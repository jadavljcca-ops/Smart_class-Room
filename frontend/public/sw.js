// EduMark Classroom & Academic Management System - PWA & Web Push Service Worker

const CACHE_NAME = 'edumark-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// PWA fetch handler for mobile offline support & install compliance
self.addEventListener('fetch', (event) => {
  // Pass-through to network with graceful offline fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ==========================================
// Web Push Notification Event (Mobile Notification Bar)
// ==========================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'EduMark Classroom 🔔',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'EduMark Classroom 🔔';
  
  // Notice: Android NotificationManager REQUIRES PNG or JPG for icon/badge.
  // SVG icons fail silently on Android status bars.
  const options = {
    body: data.body || 'You have a new update in your classroom portal.',
    icon: (data.icon && !data.icon.endsWith('.svg')) ? data.icon : '/pwa-192.png',
    badge: '/pwa-192.png',
    sound: '/notification.wav',
    vibrate: [500, 200, 500, 200, 500],
    silent: false,
    tag: data.tag || `edumark-notif-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'open', title: 'Open Portal' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  // 1. Broadcast to open client windows to trigger audible chime and hardware vibration
  const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    windowClients.forEach((client) => {
      client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
    });
  }).catch(() => {});

  // 2. Display notification in mobile status bar / notification shade
  const notificationPromise = self.registration.showNotification(title, options).catch((err) => {
    console.warn('showNotification with actions failed, retrying simplified:', err);
    return self.registration.showNotification(title, {
      body: options.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      sound: '/notification.wav',
      vibrate: [500, 200, 500, 200, 500],
      silent: false,
      tag: options.tag,
      renotify: true,
      requireInteraction: true,
      data: options.data
    });
  });

  event.waitUntil(Promise.all([broadcastPromise, notificationPromise]));
});

// ==========================================
// Notification Click Event (Tapping Notification)
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetPath = (event.notification.data && event.notification.data.url) || '/';
  const fullTargetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's an existing window open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (client.url !== fullTargetUrl && 'navigate' in client) {
            client.navigate(fullTargetUrl);
          }
          return client.focus();
        }
      }
      // If no window is currently open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(fullTargetUrl);
      }
    })
  );
});
