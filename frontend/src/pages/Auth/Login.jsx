import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      if (user.role === 'admin' || user.role === 'faculty') {
        if (user.role === 'admin') navigate('/admin');
        if (user.role === 'faculty') navigate('/faculty');
      } else {
        if (user.role === 'student') navigate('/student');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#001a35', /* Base dark navy */
      backgroundImage: 'radial-gradient(circle at 10% 40%, #1e133c 0%, #001a35 45%, #001a35 100%)', /* Added subtle purple glow on left */
      padding: '1.5rem',
      fontFamily: 'var(--font-family)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        background: '#032042', /* Card specific navy blue */
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: 'white'
      }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '36px', 
            height: '36px', 
            background: 'rgba(255, 255, 255, 0.06)', 
            borderRadius: '50%',
            color: '#8a9bb3',
            textDecoration: 'none',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}>
            <ArrowLeft size={18} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffb300, #ff8c00)',
            borderRadius: '14px', 
            padding: '0.85rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(255, 140, 0, 0.3)'
          }}>
            <GraduationCap size={32} color="#000" strokeWidth={2.5} />
          </div>
          
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'white' }}>Edu</span><span style={{ color: '#ff9900' }}>Mark</span>
          </h1>
          <p style={{ color: '#8a9bb3', fontSize: '0.9rem', margin: 0 }}>
            Sign in to access your academic dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ffffff' }}>
              Email ID (Gmail) <span style={{ color: '#ff9900' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8a9bb3' }}>
                <Mail size={18} />
              </span>
              <input
                type="text"
                placeholder="Enter Your Email ID (Gmail)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.75rem',
                  background: '#02152b', /* Very dark input background */
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff9900'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ffffff' }}>
              Password <span style={{ color: '#ff9900' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8a9bb3' }}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 2.75rem',
                  background: '#02152b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff9900'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
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
                  color: '#8a9bb3',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.9rem',
              marginTop: '1rem',
              background: 'linear-gradient(to right, #f6a011, #ea8200)', /* Exact orange from image */
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: submitting ? 0.8 : 1,
              boxShadow: '0 4px 15px rgba(234, 130, 0, 0.2)',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {submitting ? 'Signing In...' : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Removed 'New to class room?' link to strictly match the provided photo exactly. */}

        <div style={{ marginTop: '3.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#8a9bb3' }}>
          EduMark © 2026 • <span style={{ color: '#ff9900' }}>This Module Built and Designed By Team</span>
        </div>
      </div>
    </div>
  );
}

