import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Bell, Sun, Moon, LogOut, Key, User, Menu, X, 
  ChevronDown, BookOpen, Megaphone, UserCheck, Users, ShieldAlert,
  Home, Download
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, authFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotifBanner, setNewNotifBanner] = useState(null); // { message, type }
  const [bellRinging, setBellRinging] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const audioRef = useRef(null);
  const lastKnownNotifId = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.volume = 0.75;
  }, []);

  // Close menus on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Fetch notifications if user is logged in
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/notifications');
      if (res.ok) {
        const data = await res.json();
        
        // Check if there are new unread notifications
        if (data && data.length > 0) {
          const latestId = data[0].id;
          
          if (lastKnownNotifId.current !== null && latestId > lastKnownNotifId.current) {
            // Find brand new unread notifications
            const brandNewUnread = data.filter(n => n.id > lastKnownNotifId.current && !n.is_read);
            if (brandNewUnread.length > 0) {
              // Play notification sound
              try {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(() => {});
                }
              } catch (e) {}

              // Ring the bell
              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 1500);

              // Show floating banner with the latest new message
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
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => 
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ backgroundColor: 'hsl(var(--primary))', color: '#020617', borderRadius: '12px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.6rem', height: '2.6rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'white' }}>Edu</span><span style={{ color: 'hsl(var(--primary))' }}>Mark</span>
            </span>
          </Link>
        </div>

        {/* Desktop Menu links based on auth state */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
                  <Link to="/admin/requests" className={`nav-link ${location.pathname === '/admin/requests' ? 'active' : ''}`}>Requests</Link>
                  <Link to="/admin/faculty" className={`nav-link ${location.pathname === '/admin/faculty' ? 'active' : ''}`}>Faculty</Link>
                  <Link to="/admin/students" className={`nav-link ${location.pathname === '/admin/students' ? 'active' : ''}`}>Students</Link>
                  <Link to="/admin/announcements" className={`nav-link ${location.pathname === '/admin/announcements' ? 'active' : ''}`}>Announcements</Link>
                  {user.adminRole === 'main_admin' && (
                    <>
                      <Link to="/admin/departments" className={`nav-link ${location.pathname === '/admin/departments' ? 'active' : ''}`}>Departments</Link>
                      <Link to="/admin/sub-admins" className={`nav-link ${location.pathname === '/admin/sub-admins' ? 'active' : ''}`}>Sub Admins</Link>
                    </>
                  )}
                </>
              )}

              {user.role === 'faculty' && (
                <>
                  <Link to="/faculty" className={`nav-link ${location.pathname === '/faculty' ? 'active' : ''}`}>Dashboard & Notes</Link>
                </>
              )}

              {user.role === 'student' && (
                <>
                  <Link to="/student" className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}>Dashboard</Link>
                </>
              )}
            </>
          ) : (
            <>
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#stats" className="nav-link">Statistics</a>
              <a href="/#departments" className="nav-link">Departments</a>
              <a href="/#faq" className="nav-link">FAQ</a>
            </>
          )}
        </div>

        {/* Right side controls (theme, notifications, profile/auth actions) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius)'
              }}
              title="Install App"
            >
              <Download size={15} />
              <span className="desktop-only-btn">Install App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="btn-icon" 
            title="Toggle Theme"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '0.5rem',
              borderRadius: '50%'
            }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Go to Home Page Button (next to theme toggle on auth pages) */}
          {!user && (location.pathname === '/login' || location.pathname === '/register') && (
            <Link 
              to="/" 
              className="desktop-only-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--secondary) / 0.5)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--border))'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.5)'}
            >
              <Home size={15} />
              <span>Home</span>
            </Link>
          )}

          {user ? (
            <>
              {/* Notifications Trigger */}
              <div style={{ position: 'relative' }} ref={notificationMenuRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="btn-icon"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  <Bell size={20} className={bellRinging ? 'bell-ring' : ''} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="card dropdown-menu" style={{
                    position: 'absolute',
                    top: '2.5rem',
                    right: 0,
                    width: '320px',
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
                )}
              </div>

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }} ref={profileMenuRef} className="desktop-only-block">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <User size={16} />
                  <span style={{ display: 'none', md: 'inline' }}>{user.fullName}</span>
                  <ChevronDown size={14} />
                </button>

                {showProfileMenu && (
                  <div className="card dropdown-menu" style={{
                    position: 'absolute',
                    top: '2.5rem',
                    right: 0,
                    width: '220px',
                    zIndex: 1000,
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}>
                    {/* User info details */}
                    <div style={{ padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid hsl(var(--border))', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', textTransform: 'capitalize' }}>
                        {user.role} {user.department ? `| ${user.department}` : ''}
                      </div>
                    </div>

                    <Link 
                      to="/change-password" 
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: 'inherit',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                      className="dropdown-item"
                    >
                      <Key size={14} />
                      Change Password
                    </Link>

                    <button 
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'none',
                        color: 'hsl(var(--danger))',
                        fontSize: '0.85rem',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      className="dropdown-item"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-only-flex">
              <Link 
                to="/login" 
                className="btn btn-secondary" 
                style={{ 
                  padding: '0.4rem 0.9rem', 
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary" 
                style={{ 
                  padding: '0.4rem 0.9rem', 
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Icon Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="mobile-toggle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '0.5rem',
              display: 'none',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="mobile-menu-drawer animate-fade-in" style={{
          position: 'absolute',
          top: '4.5rem',
          left: 0,
          right: 0,
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 99,
          boxShadow: 'var(--shadow-md)'
        }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
                  <Link to="/admin/requests" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/requests' ? 'active' : ''}`}>Requests</Link>
                  <Link to="/admin/faculty" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/faculty' ? 'active' : ''}`}>Faculty</Link>
                  <Link to="/admin/students" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/students' ? 'active' : ''}`}>Students</Link>
                  <Link to="/admin/announcements" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/announcements' ? 'active' : ''}`}>Announcements</Link>
                  {user.adminRole === 'main_admin' && (
                    <>
                      <Link to="/admin/departments" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/departments' ? 'active' : ''}`}>Departments</Link>
                      <Link to="/admin/sub-admins" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin/sub-admins' ? 'active' : ''}`}>Sub Admins</Link>
                    </>
                  )}
                </>
              )}

              {user.role === 'faculty' && (
                <>
                  <Link to="/faculty" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/faculty' ? 'active' : ''}`}>Dashboard & Notes</Link>
                </>
              )}

              {user.role === 'student' && (
                <>
                  <Link to="/student" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}>Dashboard</Link>
                </>
              )}

              {/* Profile options inside mobile drawer */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0 0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', textTransform: 'capitalize' }}>
                    {user.role} {user.department ? `| ${user.department}` : ''}
                  </div>
                </div>
                <Link to="/change-password" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 1rem' }}>
                  <Key size={15} /> Change Password
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '0.6rem 1rem' }}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <a href="/#features" onClick={() => setIsOpen(false)} className="nav-link">Features</a>
              <a href="/#stats" onClick={() => setIsOpen(false)} className="nav-link">Statistics</a>
              <a href="/#departments" onClick={() => setIsOpen(false)} className="nav-link">Departments</a>
              <a href="/#faq" onClick={() => setIsOpen(false)} className="nav-link">FAQ</a>
              
              {/* Login / Register inside mobile drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '1rem' }}>
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ width: '100%' }}>Login</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>Register</Link>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Floating Notification Banner */}
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

      {/* CSS overrides specifically for hover navigation links */}
      <style>{`
        .nav-link {
          text-decoration: none;
          color: hsl(var(--muted));
          font-weight: 500;
          font-size: 0.925rem;
          transition: color 0.2s;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        .nav-link:hover, .nav-link.active {
          color: hsl(var(--primary));
        }
        .dropdown-item:hover {
          background-color: hsl(var(--secondary)) !important;
        }
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(5deg); }
          90% { transform: rotate(-3deg); }
        }
        .bell-ring {
          animation: bellRing 0.8s ease-in-out;
          transform-origin: top center;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-only-btn {
            display: none !important;
          }
          .desktop-only-flex {
            display: none !important;
          }
          .desktop-only-block {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .navbar span {
            font-size: 1.05rem !important;
          }
        }
      `}</style>
    </nav>
  );
}
