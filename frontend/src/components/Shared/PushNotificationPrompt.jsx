import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebPush } from '../../context/WebPushContext';
import { useToast } from '../../context/ToastContext';
import { Bell, BellRing, AlertTriangle } from 'lucide-react';

export default function PushNotificationPrompt({ compact = false }) {
  const { user } = useAuth();
  const { supported, permission, isSubscribed, loading, subscribeToPush } = useWebPush();
  const { showToast } = useToast();

  // If push notifications are not supported on this browser, do not show
  if (!supported) {
    return null;
  }

  // Exact User Requirement:
  // "ek var notification allow kariya pachi te button na aavu joiyte and jo notification allow na kare to j te button farithi aavu joiye."
  // Once allowed, do NOT show ANY button, badge or green active banner.
  if (permission === 'granted') {
    return null;
  }

  const handleAllowClick = async () => {
    if (permission === 'denied') {
      showToast('તમારા બ્રાઉઝરમાં નોટિફિકેશન બ્લોક છે. કૃપા કરીને બ્રાઉઝર Site Settings માંથી Notifications Allow કરો.', 'warning');
      return;
    }
    const success = await subscribeToPush(true);
    if (success) {
      showToast('મોબાઇલ નોટિફિકેશન સફળતાપૂર્વક ચાલુ થઈ ગઈ! 🔔', 'success');
    }
  };

  // Compact layout (used inside NotificationMenu bell dropdown)
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        padding: '0.65rem 0.75rem',
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
        borderRadius: '10px',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        marginBottom: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BellRing size={15} /> મોબાઇલ નોટિફિકેશન
          </span>
          <button
            type="button"
            onClick={handleAllowClick}
            disabled={loading}
            style={{
              backgroundColor: '#f59e0b',
              color: '#001b3d',
              border: 'none',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Bell size={12} /> {loading ? 'મંજૂર થઈ રહ્યું છે...' : 'Allow (મંજૂર કરો)'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#4b5563', lineHeight: 1.3 }}>
          નવી એનાઉન્સમેન્ટ અને સ્ટડી નોટ્સના તુરંત એલર્ટ તમારા મોબાઇલમાં મેળવવા માટે Allow કરો.
        </p>
      </div>
    );
  }

  // Full dashboard permission banner (displayed on Student and Faculty panels when not yet allowed)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.85rem',
      padding: '0.9rem 1.25rem',
      background: 'linear-gradient(135deg, #002855 0%, #001f44 100%)',
      color: '#ffffff',
      borderRadius: '16px',
      border: '1px solid rgba(251, 191, 36, 0.45)',
      boxShadow: '0 6px 20px rgba(0, 40, 85, 0.2)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: permission === 'denied' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: permission === 'denied' ? '#ef4444' : '#fbbf24',
          flexShrink: 0
        }}>
          {permission === 'denied' ? <AlertTriangle size={22} /> : <BellRing size={22} />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: permission === 'denied' ? '#fca5a5' : '#fbbf24' }}>
            {permission === 'denied' 
              ? 'મોબાઇલ નોટિફિકેશન બંધ છે ⚠️' 
              : 'મોબાઇલ નોટિફિકેશન મંજૂર કરો 🔔'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
            {permission === 'denied'
              ? 'તમારા બ્રાઉઝરમાં નોટિફિકેશન બ્લોક છે. મેળવવા માટે Site Settings માં Notifications Allow કરો.'
              : 'નવી એનાઉન્સમેન્ટ અને સ્ટડી નોટ્સના તુરંત એલર્ટ તમારા મોબાઇલના નોટિફિકેશન બારમાં મેળવવા માટે Allow કરો.'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAllowClick}
        disabled={loading}
        style={{
          backgroundColor: '#fbbf24',
          color: '#001b3d',
          border: 'none',
          borderRadius: '10px',
          padding: '0.65rem 1.4rem',
          fontSize: '0.88rem',
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          boxShadow: '0 4px 14px rgba(251, 191, 36, 0.35)',
          transition: 'all 0.15s ease'
        }}
      >
        <Bell size={16} />
        {loading ? 'મંજૂર થઈ રહ્યું છે...' : (permission === 'denied' ? 'સેટિંગ્સ મદદ ⚙️' : 'Allow Notifications (મંજૂર કરો)')}
      </button>
    </div>
  );
}
