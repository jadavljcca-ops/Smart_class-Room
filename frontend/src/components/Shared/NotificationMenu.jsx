import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, X } from 'lucide-react';

export default function NotificationMenu() {
  const { user, authFetch } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotifBanner, setNewNotifBanner] = useState(null);
  const [bellRinging, setBellRinging] = useState(false);
  
  const notificationMenuRef = useRef(null);
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
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              try {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  const playPromise = audioRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.catch((e) => console.log('Audio play blocked:', e));
                  }
                }
              } catch (e) {}

              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 1500);

              setNewNotifBanner(brandNewUnread[0].message);
              setTimeout(() => setNewNotifBanner(null), 5000);
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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const dismissedNotifs = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
      if (!dismissedNotifs.includes(id)) {
        dismissedNotifs.push(id);
        localStorage.setItem('dismissedNotifs', JSON.stringify(dismissedNotifs));
      }
      await authFetch(`/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting notification:', err);
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
        >
          <Bell size={20} className={bellRinging ? 'bell-ring' : ''} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>

        {showNotifications && (
          <>
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }} onClick={() => setShowNotifications(false)} />
            <div className="card dropdown-menu" style={{
              position: 'absolute',
              top: '35px',
              right: 0,
              width: '90vw',
              maxWidth: '400px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-lg)',
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))', fontWeight: 600 }}>{unreadCount} unread</span>}
              </div>
              
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    style={{
                      padding: '0.6rem 2.2rem 0.6rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: notif.is_read ? 'transparent' : 'hsl(var(--secondary) / 0.5)',
                      borderBottom: '1px solid hsl(var(--border) / 0.5)',
                      fontSize: '0.825rem',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      position: 'relative'
                    }}
                  >
                    <div>{notif.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted))',
                        padding: '0.15rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s, background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--danger))';
                        e.currentTarget.style.backgroundColor = 'hsl(var(--danger) / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--muted))';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Delete Notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {newNotifBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 99999,
            maxWidth: '360px',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--primary) / 0.5)',
            borderLeft: '4px solid hsl(var(--primary))',
            borderRadius: 'var(--radius)',
            padding: '1rem 1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'slideInRight 0.4s ease'
          }}
        >
          <div style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '0.1rem' }}>
            <Bell size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>
              New Notification
            </div>
            <div style={{ fontSize: '0.825rem', color: 'hsl(var(--muted))', lineHeight: 1.4 }}>
              {newNotifBanner}
            </div>
          </div>
          <button
            onClick={() => setNewNotifBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))', padding: 0, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
