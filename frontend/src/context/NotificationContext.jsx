import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, API_BASE_URL } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const prevNotifIdsRef = useRef(new Set());
  const audioRef = useRef(null);
  const isFirstFetchRef = useRef(true);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.volume = 0.7;
  }, []);

  const playSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Autoplay policy may block - ignore silently
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();

      // Detect genuinely new notifications (not seen before)
      const newIds = new Set(data.map((n) => n.id));
      const brandNew = data.filter((n) => !prevNotifIdsRef.current.has(n.id));

      if (!isFirstFetchRef.current && brandNew.length > 0) {
        // Play notification sound for new ones
        playSound();
      }

      // On first fetch, just record current IDs silently
      isFirstFetchRef.current = false;
      prevNotifIdsRef.current = newIds;

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      // Network error - fail silently
    }
  }, [token, user, playSound]);

  // Poll every 30 seconds when logged in as student
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    // Initial fetch
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      try {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    },
    [token]
  );

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  }, [notifications, markAsRead]);

  const deleteNotification = useCallback(
    async (id) => {
      try {
        await fetch(`${API_BASE_URL}/notifications/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    },
    [token]
  );

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showPanel,
        setShowPanel,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
