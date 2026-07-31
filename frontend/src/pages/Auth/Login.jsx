import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogIn, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('student'); // 'student', 'faculty', 'admin'
  const [isBlinking, setIsBlinking] = useState(false);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 1000);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.fullName}!`, 'success');

      // Navigate to appropriate panel based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'faculty') {
        navigate('/faculty');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`auth-card animate-fade-in ${isBlinking ? 'blink-animation' : ''}`}>
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="LJ Logo" className="logo-img" style={{ width: '4.5rem', height: '4.5rem', marginBottom: '0.75rem', objectFit: 'contain' }} />
          <div className="auth-logo" style={{ fontSize: '1.5rem', fontWeight: 800 }}>LJ CCA Class Room</div>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
            College Classroom Management System
          </p>
        </div>

        {/* Role Tabs */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => { handleTabChange('student'); }}
          >
            Student
          </div>
          <div 
            className={`auth-tab ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => { handleTabChange('faculty'); }}
          >
            Faculty
          </div>
          <div 
            className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { handleTabChange('admin'); }}
          >
            Admin
          </div>
        </div>

        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.25rem', textAlign: 'center' }}>
          Secure {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Login
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder={`e.g. name@ljcca.edu`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

        {activeTab !== 'admin' && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'hsl(var(--muted))' }}>New to class room? </span>
            <Link to="/register" style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'none' }}>
              Create an Account
            </Link>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid hsl(var(--border) / 0.6)', paddingTop: '1.25rem' }}>
          <Link to="/" style={{ color: 'hsl(var(--muted))', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }} className="hover-text-primary">
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
