import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TrendingUp, X, Check, AlertTriangle, FileSpreadsheet, Users, ArrowRight, Sparkles, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PromoteModal({ isOpen, onClose, defaultDept = 'All', onSuccess }) {
  const { authFetch, user } = useAuth();
  const { showToast } = useToast();

  const [targetDept, setTargetDept] = useState(defaultDept || 'All');
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (user?.adminRole === 'sub_admin' && user?.department) {
      setTargetDept(user.department);
    } else if (defaultDept) {
      setTargetDept(defaultDept);
    }
  }, [defaultDept, user]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmChecked(false);
      return;
    }

    if (user?.adminRole === 'sub_admin' && user?.department) {
      setTargetDept(user.department);
      return;
    }

    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const res = await authFetch('/admin/departments');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDepartments(data.map(d => typeof d === 'string' ? d : d.name));
          } else {
            setDepartments(['BCA', 'B.Com', 'B.A', 'BBA', 'B.Sc', 'Engineering']);
          }
        }
      } catch (err) {
        setDepartments(['BCA', 'B.Com', 'B.A', 'BBA', 'B.Sc', 'Engineering']);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepts();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const downloadBase64Excel = (base64Data, filename) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `Graduated_Students_Sem8_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading Excel file:', e);
    }
  };

  const handlePromote = async () => {
    if (!confirmChecked) {
      showToast('Please check the confirmation box to proceed.', 'warning');
      return;
    }

    setPromoting(true);
    try {
      const res = await authFetch('/admin/promote-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: targetDept })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 1. If Sem 8 students graduated, automatically download the Excel file
        if (data.excelBase64) {
          downloadBase64Excel(data.excelBase64, data.fileName);
        }

        // 2. Confetti celebration
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        // 3. Success toast
        showToast(
          data.message || `Promotion completed! ${data.promotedCount} students promoted to next semester.`,
          'success'
        );

        if (onSuccess) {
          onSuccess(data);
        }
        onClose();
      } else {
        showToast(data.message || 'Failed to promote students.', 'error');
      }
    } catch (err) {
      console.error('Promote error:', err);
      showToast('Error connecting to server while promoting students.', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const isSubAdmin = user?.adminRole === 'sub_admin';

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
            }}>
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'hsl(var(--foreground))' }}>
                Promote Students & Graduate Batch
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', margin: '0.2rem 0 0 0' }}>
                Advance all enrolled students to their next semester
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--muted))',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Target Department
          </label>
          {isSubAdmin ? (
            <input
              type="text"
              className="form-control"
              value={`${user?.department || 'Department'} (Your Department)`}
              disabled
              style={{ fontSize: '0.95rem', padding: '0.65rem 0.85rem', fontWeight: 600, backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
            />
          ) : (
            <select
              className="form-control"
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              style={{ fontSize: '0.95rem', padding: '0.65rem 0.85rem' }}
            >
              <option value="All">All Departments (Campus-wide)</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept} Department</option>
              ))}
            </select>
          )}
        </div>

        {/* Informational Workflow Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* Promotion Card */}
          <div style={{
            padding: '1rem 1.15rem',
            backgroundColor: 'hsl(var(--primary) / 0.08)',
            border: '1px solid hsl(var(--primary) / 0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{ color: 'hsl(var(--primary))', marginTop: '0.15rem' }}>
              <Users size={20} />
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '0.2rem' }}>
                Semesters 1 ➔ 7 (Active Promotion)
              </div>
              <div style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
                All students in <strong>Sem 1 to Sem 7</strong> will automatically move up by 1 semester:
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'hsl(var(--muted))', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-low">Sem 1 ➔ 2</span>
                <span className="badge badge-low">Sem 2 ➔ 3</span>
                <span className="badge badge-low">Sem 3 ➔ 4</span>
                <span className="badge badge-low">Sem 4 ➔ 5</span>
                <span className="badge badge-low">Sem 5 ➔ 6</span>
                <span className="badge badge-low">Sem 6 ➔ 7</span>
                <span className="badge badge-low">Sem 7 ➔ 8</span>
              </div>
            </div>
          </div>

          {/* Graduation Card */}
          <div style={{
            padding: '1rem 1.15rem',
            backgroundColor: 'hsl(var(--warning) / 0.1)',
            border: '1px solid hsl(var(--warning) / 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{ color: 'hsl(var(--warning))', marginTop: '0.15rem' }}>
              <FileSpreadsheet size={20} />
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '0.2rem' }}>
                Semester 8 (Graduation & Excel Export)
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--foreground) / 0.85)' }}>
                <li>
                  An <strong>Excel spreadsheet (.xlsx)</strong> containing full student details of Semester 8 will be <strong>automatically downloaded</strong> to your computer.
                </li>
                <li>
                  Graduated students' accounts will be <strong>permanently deleted</strong> from the active database.
                </li>
                <li>
                  Their active login session will end immediately and they will <strong>not be able to log in again</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'hsl(var(--secondary) / 0.4)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <input
            type="checkbox"
            id="promoteConfirmCheck"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            style={{
              cursor: 'pointer',
              width: '18px',
              height: '18px',
              accentColor: '#f59e0b',
              flexShrink: 0
            }}
          />
          <label
            htmlFor="promoteConfirmCheck"
            style={{
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              userSelect: 'none'
            }}
          >
            I confirm that I want to promote {targetDept === 'All' ? 'all' : targetDept} students and graduate the Semester 8 batch.
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}
            disabled={promoting}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePromote}
            disabled={!confirmChecked || promoting}
            style={{
              background: confirmChecked
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'hsl(var(--muted))',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.925rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: confirmChecked && !promoting ? 'pointer' : 'not-allowed',
              opacity: promoting ? 0.7 : 1,
              boxShadow: confirmChecked ? '0 6px 18px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {promoting ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                Promoting Students...
              </>
            ) : (
              <>
                <TrendingUp size={18} strokeWidth={2.5} />
                Execute Promotion
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
