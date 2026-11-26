import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { Bell, X, Volume2 } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import PushNotificationPrompt from './PushNotificationPrompt';
import { triggerNotificationAlert } from '../../utils/notificationSound';

export default function NotificationMenu() {
  const { user, token, authFetch } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotifBanner, setNewNotifBanner] = useState(null);
  const [bellRinging, setBellRinging] = useState(false);
  
  const notificationMenuRef = useRef(null);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const lastKnownNotifId = useRef(null);
  const audioUnlocked = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.volume = 0.75;
    audioRef.current.preload = 'auto';

    const unlockAudio = () => {
      if (audioRef.current && !audioUnlocked.current) {
        audioUnlocked.current = true;
        audioRef.current.muted = true;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.muted = false;
          }).catch(() => {
            audioRef.current.muted = false;
          });
        }
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (notificationMenuRef.current && notificationMenuRef.current.contains(event.target)) ||
        (dropdownRef.current && dropdownRef.current.contains(event.target))
      ) {
        return;
      }
      setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real-Time Server-Sent Events (SSE) listener for instantaneous notifications
  useEffect(() => {
    if (!user || !token) return;

    let eventSource = null;
    let reconnectTimer = null;

    const connectSSE = () => {
      try {
        const streamUrl = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          if (!event.data) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'notification' && parsed.notification) {
              const notif = parsed.notification;

              // 1. Play real-time alert sound & vibration immediately
              triggerNotificationAlert([400, 150, 400, 150, 400]);

              // 2. Ring bell icon
              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 2000);

              // 3. Show top-center live alert banner
              setNewNotifBanner(notif.message);
              setTimeout(() => setNewNotifBanner(null), 6000);

              // 4. Update notifications list
              setNotifications((prev) => {
                if (prev.some(n => n.id === notif.id)) return prev;
                return [notif, ...prev];
              });

              // 5. Native OS notification if permitted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification('EduMark Classroom 🔔', {
                      body: notif.message,
                      icon: '/pwa-192.png',
                      badge: '/pwa-192.png',
                      vibrate: [400, 150, 400, 150, 400],
                      silent: false,
                      tag: `edumark-notif-${notif.id}`,
                      renotify: true,
                      data: { url: user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student' }
                    }).catch(() => {});
                  }).catch(() => {});
                }
              }
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn('SSE initialization error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/notifications');
      if (res.ok) {
        let data = await res.json();
        const dismissedNotifs = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
        data = data.filter(n => !dismissedNotifs.includes(n.id));
        
        if (data && data.length > 0) {
          const latestId = data[0].id;
          if (lastKnownNotifId.current !== null && latestId > lastKnownNotifId.current) {
            const brandNewUnread = data.filter(n => n.id > lastKnownNotifId.current && !n.is_read);
            if (brandNewUnread.length > 0) {
              // Trigger physical hardware vibration and audible chime
              triggerNotificationAlert([400, 150, 400, 150, 400]);

              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 2000);

              setNewNotifBanner(brandNewUnread[0].message);
              setTimeout(() => setNewNotifBanner(null), 6000);

              // Display in device status bar / notification shade with sound & vibration
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification('EduMark Classroom 🔔', {
                      body: brandNewUnread[0].message,
                      icon: '/pwa-192.png',
                      badge: '/pwa-192.png',
                      vibrate: [400, 150, 400, 150, 400],
                      silent: false,
                      requireInteraction: false,
                      tag: `edumark-notif-${brandNewUnread[0].id}`,
                      renotify: true,
                      data: { url: user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student' }
                    }).catch(() => {});
                  }).catch(() => {});
                }
              }
            }
          }
          lastKnownNotifId.current = latestId;
        }
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 6-second background fallback sync
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const handleTestAlert = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // 1. Immediately fire local sound & physical hardware vibration
    triggerNotificationAlert([400, 150, 400, 150, 400]);
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 2000);
    setNewNotifBanner('🔔 Real-Time Alert Test: Sound & Vibration active!');
    setTimeout(() => setNewNotifBanner(null), 6000);

    // 2. Request permission if not yet granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {}
    }

    // 3. Trigger native mobile status bar notification with vibration & sound
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('EduMark Classroom 🔔', {
          body: 'Mobile notification test successful! Sound and vibration are active.',
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
          sound: '/notification.wav',
          vibrate: [400, 150, 400, 150, 400],
          silent: false,
          tag: `test-alert-${Date.now()}`,
          renotify: true
        }).catch(() => {});
      }).catch(() => {});
    }

    // 4. Trigger backend test route so the entire end-to-end SSE pipeline is tested
    try {
      await authFetch('/notifications/test', { method: 'POST' });
    } catch (err) {}
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // 1. Instantly remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    // 2. Persist in localStorage to prevent resurfacing
    try {
      const dismissedNotifs = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
      if (!dismissedNotifs.includes(id)) {
        dismissedNotifs.push(id);
        localStorage.setItem('dismissedNotifs', JSON.stringify(dismissedNotifs));
      }
    } catch (err) {}

    // 3. Delete in database
    try {
      await authFetch(`/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const allIds = notifications.map(n => n.id);
    setNotifications([]);

    try {
      const dismissedNotifs = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
      const updated = [...new Set([...dismissedNotifs, ...allIds])];
      localStorage.setItem('dismissedNotifs', JSON.stringify(updated));
    } catch (err) {}

    try {
      await authFetch('/notifications', { method: 'DELETE' });
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div style={{ position: 'relative' }} ref={notificationMenuRef}>
        <button 
          onClick={() => setShowNotifications(!showNotifications)} 
          className="btn-icon btn btn-secondary"
          style={{
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          title="Notifications"
        >
          <Bell size={20} className={bellRinging ? 'bell-ring' : ''} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>

        {showNotifications && createPortal(
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 99998
              }} 
              onClick={() => setShowNotifications(false)} 
            />
            <div 
              ref={dropdownRef}
              className="card notification-dropdown animate-fade-in" 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '70px',
                left: 0,
                right: 0,
                margin: '0 auto',
                width: '90vw',
                maxWidth: '430px',
                maxHeight: '450px',
                overflowY: 'auto',
                zIndex: 99999,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))'
              }}
            >
              <div style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                borderBottom: '1px solid hsl(var(--border))',
                paddingBottom: '0.6rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'hsl(var(--danger))',
                      fontWeight: 600,
                      backgroundColor: 'hsl(var(--danger) / 0.12)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '10px'
                    }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleTestAlert}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: '#f59e0b',
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px'
                    }}
                    title="Test Real-Time Alert with Sound and Vibration"
                  >
                    <Volume2 size={12} />
                    Test Alert
                  </button>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleClearAll(e);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        background: 'none',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--muted))',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--danger))';
                        e.currentTarget.style.backgroundColor = 'hsl(var(--danger) / 0.1)';
                        e.currentTarget.style.borderColor = 'hsl(var(--danger) / 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--muted))';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      }}
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--muted))',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Mobile Web Push Permission Button for Students & Faculty (Hidden once allowed) */}
              {(user?.role === 'student' || user?.role === 'faculty') && <PushNotificationPrompt compact={true} />}
              
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    style={{
                      padding: '0.75rem 2.5rem 0.75rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: notif.is_read ? 'transparent' : 'hsl(var(--secondary) / 0.5)',
                      border: '1px solid hsl(var(--border) / 0.6)',
                      fontSize: '0.825rem',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {notif.department && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: notif.department === 'All' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--primary) / 0.25)',
                          color: 'hsl(var(--primary))',
                          border: '1px solid hsl(var(--border))'
                        }}>
                          {notif.department}
                        </span>
                      )}
                      <span style={{ flex: 1, paddingRight: '0.5rem', fontWeight: notif.is_read ? 400 : 600 }}>{notif.message}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))' }}>
                      {formatDateTime(notif.created_at)}
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteNotification(notif.id, e);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '0.55rem',
                        right: '0.55rem',
                        background: 'hsl(var(--secondary) / 0.9)',
                        border: '1px solid hsl(var(--border))',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted))',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        transition: 'all 0.2s ease',
                        padding: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--danger))';
                        e.currentTarget.style.backgroundColor = 'hsl(var(--danger) / 0.15)';
                        e.currentTarget.style.borderColor = 'hsl(var(--danger) / 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--muted))';
                        e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.9)';
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      }}
                      title="Remove notification"
                      aria-label="Remove notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>,
          document.body
        )}
      </div>

      {newNotifBanner && createPortal(
        <div
          style={{
            position: 'fixed',
            top: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            width: '92%',
            maxWidth: '460px',
            background: 'linear-gradient(135deg, #001f3f 0%, #002d62 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'fadeInDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            <Bell size={22} className="animate-bounce" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f59e0b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                New Live Alert 🔔
              </span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Just now</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word' }}>
              {newNotifBanner}
            </div>
          </div>
          <button
            onClick={() => setNewNotifBanner(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.8)',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s'
            }}
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
