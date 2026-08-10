import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Bell, Sun, Moon, LogOut, Key, User, Menu, X, 
  ChevronDown, BookOpen, Megaphone, UserCheck, Users, ShieldAlert,
  Home, Download
} from 'lucide-react';
import NotificationMenu from './NotificationMenu';

export default function Navbar() {
  const { user, logout, authFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const profileMenuRef = useRef(null);

  // Close menus on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
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

        {/* Desktop Menu links based on auth state & current page */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {location.pathname !== '/' && user ? (
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
              {user && (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student'} className="nav-link" style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                  Go to Dashboard →
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right side controls (theme, notifications, profile/auth actions) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* PWA Install Button */}
          {deferredPrompt && user?.role !== 'admin' && (
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
              {/* Notifications Trigger - Hidden inside /admin routes as it's in their dashboard */}
              {!location.pathname.startsWith('/admin') && (
                <NotificationMenu />
              )}

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

        </div>
      </div>




      


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

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9990
          }} onClick={() => setIsOpen(false)} className="animate-fade-in" />
          <div className="mobile-menu-drawer animate-fade-in" style={{
            position: 'fixed',
            top: '4.5rem',
            left: 0,
            right: 0,
            maxHeight: 'calc(100vh - 4.5rem)',
            overflowY: 'auto',
            backgroundColor: 'hsl(var(--card))',
            borderBottom: '1px solid hsl(var(--border))',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 9991,
            boxShadow: 'var(--shadow-md)'
          }}>
          {location.pathname !== '/' && user ? (
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
        </>
      )}

      {/* Mobile Menu Icon Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="mobile-toggle fab-button"
        style={{
          cursor: 'pointer',
          color: '#020617',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </>
  );
}
