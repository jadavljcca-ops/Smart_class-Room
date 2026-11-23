import React, { useState } from 'react';
import { useWebPush } from '../../context/WebPushContext';
import { Bell, CheckCircle, Smartphone, Send, X } from 'lucide-react';

export default function PushNotificationPrompt({ compact = false }) {
  const { supported, permission, isSubscribed, loading, subscribeToPush, sendTestPush } = useWebPush();
  const [dismissed, setDismissed] = useState(false);

  if (!supported || dismissed) {
    return null;
  }

  // If already subscribed, show a sleek badge with test option
  if (isSubscribed) {
    if (compact) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          marginBottom: '0.65rem',
          fontSize: '0.78rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 600 }}>
            <CheckCircle size={14} /> Mobile Push Active
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sendTestPush();
            }}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Send size={11} /> Test Push
          </button>
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        padding: '0.65rem 1rem',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        marginBottom: '1.25rem',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600 }}>
          <CheckCircle size={17} />
          <span>Mobile Notification Bar is Active! 📲</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={sendTestPush}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
            }}
          >
            <Send size={13} /> Test Notification Bar
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
            title="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // If permission is denied by browser settings
  if (permission === 'denied') {
    return null;
  }

  // Compact layout for inside NotificationMenu
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        padding: '0.65rem 0.75rem',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        marginBottom: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Smartphone size={15} /> Mobile Notification Bar
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#4b5563', lineHeight: 1.3 }}>
          Get instant alerts in your phone notification shade when notices or notes are posted.
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            subscribeToPush(true);
          }}
          disabled={loading}
          style={{
            marginTop: '0.2rem',
            backgroundColor: '#f59e0b',
            color: '#001b3d',
            border: 'none',
            borderRadius: '6px',
            padding: '0.35rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
          }}
        >
          <Bell size={13} /> {loading ? 'Enabling...' : 'Enable Mobile Notifications'}
        </button>
      </div>
    );
  }

  // Full banner layout for dashboard
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      backgroundColor: 'linear-gradient(135deg, #002d62 0%, #001f44 100%)',
      background: '#002855',
      color: '#ffffff',
      borderRadius: '16px',
      border: '1px solid rgba(251, 191, 36, 0.35)',
      boxShadow: '0 6px 20px rgba(0, 40, 85, 0.15)',
      marginBottom: '1.5rem',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: 'rgba(251, 191, 36, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fbbf24',
          flexShrink: 0
        }}>
          <Smartphone size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>
            Enable Mobile Push Notifications 🔔
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            Receive announcements and notes directly in your phone's notification bar even when app is closed.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => subscribeToPush(true)}
          disabled={loading}
          style={{
            backgroundColor: '#fbbf24',
            color: '#001b3d',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
          }}
        >
          <Bell size={15} /> {loading ? 'Enabling...' : 'Turn On'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
