import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell, Sun, Moon, LogOut, Key, User, Menu, X,
  ChevronDown, BookOpen, Megaphone, UserCheck, Users, ShieldAlert,
  Home, Download, Settings, LayoutGrid, GraduationCap, Building2, ShieldCheck, School
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

  // Is this an admin page? (used to show Profile & Settings in nav)
  const isAdminPage = user?.role === 'admin' && location.pathname.startsWith('/admin');

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <img 
                src="/favicon.svg" 
                alt="Edumark Logo" 
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(251, 191, 36, 0.4)',
                  display: 'block',
                  flexShrink: 0
                }} 
              />
              <div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
                  <span style={{ color: 'white' }}>Edu</span><span style={{ color: '#fbbf24' }}>Mark</span>
                </span>
                {user && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em', display: 'block', marginTop: '1px' }}>
                    {user.role === 'admin' ? (user.adminRole === 'main_admin' ? 'Admin Hub' : `${user.department || ''} Admin`) : user.role === 'faculty' ? 'Faculty Hub' : 'Student Hub'}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Menu links based on auth state & current page */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {location.pathname !== '/' && user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                      <LayoutGrid size={18} /> Dashboard
                    </Link>
                    <Link to="/admin/faculty" className={`nav-link ${location.pathname === '/admin/faculty' ? 'active' : ''}`}>
                      <GraduationCap size={18} /> Faculty
                    </Link>
                    <Link to="/admin/students" className={`nav-link ${location.pathname === '/admin/students' ? 'active' : ''}`}>
                      <Users size={18} /> Students
                    </Link>
                    <Link to="/admin/announcements" className={`nav-link ${location.pathname === '/admin/announcements' ? 'active' : ''}`}>
                      <Megaphone size={18} /> Announcements
                    </Link>
                    {user.adminRole === 'main_admin' && (
                      <>
                        <Link to="/admin/departments" className={`nav-link ${location.pathname === '/admin/departments' ? 'active' : ''}`}>
                          <Building2 size={18} /> Departments
                        </Link>
                        <Link to="/admin/sub-admins" className={`nav-link ${location.pathname === '/admin/sub-admins' ? 'active' : ''}`}>
                          <ShieldCheck size={18} /> Sub Admins
                        </Link>
                      </>
                    )}

                    {/* Profile & Settings dropdown for Admin */}
                    <div ref={profileMenuRef} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowProfileMenu(prev => !prev)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: showProfileMenu ? 'rgba(255,255,255,0.1)' : 'none',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          padding: '0.35rem 0.7rem',
                          color: showProfileMenu ? '#f59e0b' : '#94a3b8',
                          fontSize: '0.925rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { if (!showProfileMenu) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; } }}
                      >
                        {/* Avatar Circle */}
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0
                        }}>
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <Settings size={14} />
                        Profile & Settings
                        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>

                      {/* Dropdown Panel */}
                      {showProfileMenu && (
                        <div style={{
                          position: 'absolute',
                          top: 'calc(100% + 10px)',
                          right: 0,
                          minWidth: '230px',
                          backgroundColor: '#002855',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '12px',
                          padding: '0.5rem',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                          zIndex: 9999,
                          animation: 'fadeInDown 0.18s ease',
                        }}>
                          {/* User Info Section */}
                          <div style={{
                            padding: '0.75rem 0.75rem 0.6rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            marginBottom: '0.4rem',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 800, color: '#fff', flexShrink: 0
                              }}>
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{user.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize', marginTop: '0.1rem' }}>
                                  {user.adminRole === 'main_admin' ? 'Main Admin' : 'Admin'}{user.department ? ` | ${user.department}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Edit Profile */}
                          <Link
                            to="/admin/profile"
                            onClick={() => setShowProfileMenu(false)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.55rem 0.75rem', borderRadius: '8px',
                              textDecoration: 'none', color: '#cbd5e1',
                              fontSize: '0.9rem', fontWeight: 500,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                          >
                            <User size={15} style={{ color: 'hsl(var(--primary))' }} />
                            Edit Profile
                          </Link>


                          {/* Logout */}
                          <button
                            onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.55rem 0.75rem', borderRadius: '8px',
                              border: 'none', background: 'none',
                              color: '#f87171', fontSize: '0.9rem',
                              width: '100%', textAlign: 'left',
                              cursor: 'pointer', transition: 'all 0.15s',
                              fontWeight: 500,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#f87171'; }}
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {user.role === 'faculty' && (
                  <>
                    <Link to="/faculty" className={`nav-link ${location.pathname === '/faculty' ? 'active' : ''}`}>
                      <BookOpen size={18} /> Dashboard &amp; Notes
                    </Link>
                  </>
                )}

                {user.role === 'student' && (
                  <>
                    <Link to="/student" className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}>
                      <BookOpen size={18} /> Dashboard &amp; Study Notes
                    </Link>
                  </>
                )}

              </>
            ) : (
              <>
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



            {/* Go to Home Page Button (next to theme toggle on auth pages) */}
            {!user && location.pathname === '/login' && (
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
                {/* Notifications Trigger - Hidden on desktop admin routes, shown on mobile */}
                <div className={location.pathname.startsWith('/admin') ? "admin-mobile-nav-notif" : ""}>
                  <NotificationMenu />
                </div>

                {/* Unified Profile card at bottom of sidebar for Admin, Faculty, and Students */}
                <div className="desktop-only-block" style={{ width: '100%', paddingTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Photo-style User Card matching photo */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 20, 50, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: (isAdminPage || user.role === 'faculty') ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    flex: 1,
                    overflow: 'hidden',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
                  }}
                    onClick={() => {
                      if (isAdminPage) navigate('/admin/profile');
                      else if (user.role === 'faculty') navigate('/change-password');
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 20, 50, 0.65)';
                      e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 20, 50, 0.45)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                    title={isAdminPage ? "Edit Profile" : user.role === 'faculty' ? "Change Password" : user.fullName}
                  >
                    {/* Avatar circle */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 800, color: '#001b3d',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)'
                    }}>
                      <GraduationCap size={20} color="#001b3d" />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.fullName || 'Administrator'}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email || 'admin@ljcca.edu'}
                      </div>
                    </div>
                    {(isAdminPage || user.role === 'faculty') && (
                      <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    title="Logout"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '10px',
                      padding: '0.6rem',
                      cursor: 'pointer',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <LogOut size={19} />
                  </button>
                </div>

              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }} className="desktop-only-flex">
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Login
                </Link>
              </div>
            )}

          </div>
        </div>
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
            backgroundColor: 'rgba(0,0,0,0.65)',
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
            backgroundColor: '#002855',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 9991,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#ffffff'
          }}>
            {location.pathname !== '/' && user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
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

                {/* Profile & Settings section inside mobile drawer */}
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* User Info Card */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0
                    }}>
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                        {user.adminRole === 'main_admin' ? 'Main Admin' : user.role}{user.department ? ` | ${user.department}` : ''}
                      </div>
                    </div>
                  </div>

                  {user.role !== 'student' && (
                    <Link to="/change-password" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 1rem' }}>
                      <Key size={15} /> Change Password
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '0.6rem 1rem' }}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Login inside mobile drawer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', fontWeight: 700 }}>Login</Link>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Floating Circular Mobile Hamburger Toggle Button (Hidden on laptop/desktop view, visible ONLY on mobile) */}
      {!(location.pathname === '/' && !user) && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-floating-toggle"
          aria-label="Toggle navigation menu"
          title="Menu"
        >
          {isOpen ? <X size={20} color="#ffffff" strokeWidth={2.4} /> : <Menu size={20} color="#ffffff" strokeWidth={2.4} />}
        </button>
      )}

      {/* CSS rules for navigation links & responsive displays */}
      <style>{`
        .mobile-floating-toggle {
          display: none !important;
        }
        .nav-link {
          text-decoration: none;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.925rem;
          transition: color 0.2s;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        .nav-link:hover, .nav-link.active {
          color: #f59e0b !important;
        }
        .dropdown-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
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
          .mobile-floating-toggle {
            display: flex !important;
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%) !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 6px 18px rgba(245, 158, 11, 0.5), 0 3px 10px rgba(0, 0, 0, 0.35) !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            z-index: 9999 !important;
            touch-action: manipulation !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          }
          .mobile-floating-toggle:active {
            transform: scale(0.92) !important;
          }
        }
        @media (max-width: 480px) {
          .navbar span {
            font-size: 1.05rem !important;
          }
        }
      `}</style>
    </>
  );
}
