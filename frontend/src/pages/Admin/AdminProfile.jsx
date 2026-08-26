import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { showProfileUpdatedAlert } from '../../utils/alerts';
import { User, Key, Save, ArrowLeft, Lock, Eye, EyeOff, Mail, Shield, Building } from 'lucide-react';

export default function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isMainAdmin = user?.adminRole === 'main_admin';

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // --- Save profile name only ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty.', 'warning');
      return;
    }
    setSubmittingProfile(true);
    try {
      const msg = await updateProfile({ fullName: fullName.trim() });
      await showProfileUpdatedAlert('Your profail has been Updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // --- Change password ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const msg = await updateProfile({
        fullName: user.fullName,
        currentPassword,
        newPassword,
      });
      await showProfileUpdatedAlert('Your profail has been Updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };


  const inputStyle = {
    paddingLeft: '2.6rem',
    paddingRight: '2.6rem',
  };

  const iconStyle = {
    position: 'absolute', left: '0.85rem', top: '50%',
    transform: 'translateY(-50%)', color: 'hsl(var(--muted))',
    display: 'flex', alignItems: 'center', pointerEvents: 'none',
  };

  const eyeBtnStyle = {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    color: 'hsl(var(--muted))', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: '0.2rem',
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '0 1.5rem 2.5rem 1.5rem', maxWidth: '720px' }}>


      {/* Header Card — sticky */}
      <div className="sticky-header-wrapper">
        <div className="admin-header-card" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
          background: 'linear-gradient(135deg, #002d62 0%, #001f3f 100%)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: '20px', padding: '22px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>My Profile & Settings</h1>
            <p style={{ color: '#94a3b8', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
              Update your name and password. {!isMainAdmin && 'Email can only be changed by the Main Admin.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>



      {/* User Info Card (read-only overview) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{user?.fullName}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
            <span className="badge badge-low" style={{ textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={11} /> {isMainAdmin ? 'Main Admin' : 'Sub Admin'}
            </span>
            {user?.department && (
              <span className="badge" style={{ backgroundColor: 'hsl(var(--secondary) / 0.3)', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                <Building size={11} /> {user.department}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Edit Name ═══ */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="hsl(var(--primary))" />
          Personal Information
        </h3>

        <form onSubmit={handleSaveProfile}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><User size={16} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Email — readonly always (sub-admin cannot edit; main admin uses sub-admin mgmt) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Email Address
              {!isMainAdmin && (
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted))', fontWeight: 400, background: 'hsl(var(--secondary) / 0.5)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                  🔒 Only Main Admin can change
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><Mail size={16} /></span>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                readOnly
                style={{ ...inputStyle, opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'hsl(var(--secondary) / 0.3)' }}
              />
            </div>
          </div>

          {/* Department — readonly always */}
          {user?.department && (
            <div className="form-group">
              <label className="form-label">Department</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Building size={16} /></span>
                <input
                  type="text"
                  className="form-control"
                  value={user.department}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'hsl(var(--secondary) / 0.3)' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submittingProfile} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Save size={16} />
              {submittingProfile ? 'Saving...' : 'Save Name'}
            </button>
          </div>
        </form>
      </div>

      {/* ═══ Change Password ═══ */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} color="hsl(var(--primary))" />
          Change Password
        </h3>

        <form onSubmit={handleChangePassword}>
          {/* Current Password */}
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><Lock size={16} /></span>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={inputStyle}
                required
              />
              <button type="button" style={eyeBtnStyle} onClick={() => setShowCurrent(v => !v)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><Lock size={16} /></span>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-control"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={inputStyle}
                required
              />
              <button type="button" style={eyeBtnStyle} onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><Lock size={16} /></span>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== newPassword ? 'hsl(var(--danger))' : undefined }}
                required
              />
              <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ color: 'hsl(var(--danger))', fontSize: '0.78rem', marginTop: '0.25rem' }}>Passwords do not match.</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={changingPassword} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
