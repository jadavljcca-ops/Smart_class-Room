import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogIn, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter both ID/Email and password.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      setLoggedInUser(user);
      setShowSuccessPopup(true);

      // Trigger celebration fireworks
      const duration = 2500;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
          zIndex: 10000
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
          zIndex: 10000
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Wait for 3 seconds with blurred background popup before navigating
      setTimeout(() => {
        setShowSuccessPopup(false);
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'faculty') {
          navigate('/faculty');
        } else if (user.role === 'student') {
          navigate('/student');
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'hsl(var(--primary))', color: '#020617', borderRadius: '1.25rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '4.5rem', height: '4.5rem', marginBottom: '0.75rem', boxShadow: '0 10px 25px -5px rgba(245,158,11,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <div className="auth-logo" style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'white' }}>Edu</span><span style={{ color: 'hsl(var(--primary))' }}>Mark</span>
          </div>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
            College Classroom Management System
          </p>
        </div>

        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.25rem', textAlign: 'center' }}>
          Secure Login
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Identifier input */}
          <div className="form-group">
            <label className="form-label">ID / Enrollment No. / Email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your ID or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--muted))',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'hsl(var(--muted))' }}>New to class room? </span>
          <Link to="/register" style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'none' }}>
            Create an Account
          </Link>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid hsl(var(--border) / 0.6)', paddingTop: '1.25rem' }}>
          <Link to="/" style={{ color: 'hsl(var(--muted))', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }} className="hover-text-primary">
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
        </div>
      </div>

      {/* Success Popup Overlay */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            background: 'hsl(var(--card))',
            padding: '2.5rem 1.5rem',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid hsl(var(--border))',
            textAlign: 'center',
            margin: '0 auto'
          }}>
            <CheckCircle size={60} style={{ color: 'hsl(var(--success))', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: 'hsl(var(--foreground))', fontSize: '1.5rem', fontWeight: 700 }}>Login Successful 🎉</h2>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.95rem', lineHeight: 1.5, marginTop: '0.5rem' }}>
              Welcome back, {loggedInUser?.fullName || 'User'}!
            </p>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '0.5rem' }}>
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

