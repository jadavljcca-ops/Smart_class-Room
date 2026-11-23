import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, API_BASE_URL } from './AuthContext';
import { useToast } from './ToastContext';

const WebPushContext = createContext();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const WebPushProvider = ({ children }) => {
  const { user, token, authFetch } = useAuth();
  const { showToast } = useToast();

  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Check support and register Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);

      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          setSwRegistration(reg);

          // Check if already subscribed
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setIsSubscribed(true);
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    }
  }, []);

  // Update permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Subscribe to Web Push
  const subscribeToPush = useCallback(async (manual = false) => {
    if (!supported || !swRegistration) {
      if (manual) showToast('Push notifications not supported on this device/browser.', 'warning');
      return false;
    }

    if (!user || !token) {
      return false;
    }

    setLoading(true);
    try {
      // 1. Request Notification Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        if (manual) showToast('Notification permission denied. Please allow in browser settings.', 'warning');
        setLoading(false);
        return false;
      }

      // 2. Fetch VAPID Public Key from backend
      let vapidKey = '';
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
        if (res.ok) {
          const data = await res.json();
          vapidKey = data.publicKey;
        }
      } catch (e) {
        console.warn('Failed to fetch VAPID key from backend, using fallback:', e);
      }

      if (!vapidKey) {
        vapidKey = 'BDFti27FNvR6NkRp9DRjbloMuKSkryxvbydxyM1e54HB_IVWp8AiuXOKF3LWy4rpfyWZxqUP1Dam4ytm3jiBWRc';
      }

      // 3. Subscribe with PushManager
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      let subscription = await swRegistration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // 4. Send subscription to backend
      const subJson = subscription.toJSON();
      const sendRes = await authFetch('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: subJson })
      });

      if (sendRes.ok) {
        setIsSubscribed(true);
        if (manual) {
          showToast('Mobile Push Notifications enabled! 🔔', 'success');
        }
        setLoading(false);
        return true;
      } else {
        throw new Error('Failed to save subscription on server.');
      }
    } catch (err) {
      console.error('Error subscribing to push:', err);
      if (manual) {
        showToast('Could not enable push notifications: ' + err.message, 'error');
      }
      setLoading(false);
      return false;
    }
  }, [supported, swRegistration, user, token, authFetch, showToast]);

  // Unsubscribe from Web Push
  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration) return;
    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        await authFetch('/notifications/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      showToast('Push notifications disabled.', 'info');
    } catch (err) {
      console.error('Error unsubscribing:', err);
    }
  }, [swRegistration, authFetch, showToast]);

  // Send a test push to mobile notification bar
  const sendTestPush = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch('/notifications/test-push', {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Test push sent! Check your device notification bar 🔔', 'success');
      } else {
        showToast('Failed to trigger test push.', 'error');
      }
    } catch (err) {
      console.error('Test push error:', err);
      showToast('Network error triggering test push.', 'error');
    }
  }, [token, authFetch, showToast]);

  // Auto-subscribe if user already granted permission previously and logged in
  useEffect(() => {
    if (user && token && supported && swRegistration && permission === 'granted' && !isSubscribed) {
      subscribeToPush(false);
    }
  }, [user?.id, token, supported, swRegistration, permission, isSubscribed, subscribeToPush]);

  return (
    <WebPushContext.Provider
      value={{
        supported,
        permission,
        isSubscribed,
        loading,
        subscribeToPush,
        unsubscribeFromPush,
        sendTestPush
      }}
    >
      {children}
    </WebPushContext.Provider>
  );
};

export const useWebPush = () => {
  const context = useContext(WebPushContext);
  if (!context) {
    throw new Error('useWebPush must be used within a WebPushProvider');
  }
  return context;
};
