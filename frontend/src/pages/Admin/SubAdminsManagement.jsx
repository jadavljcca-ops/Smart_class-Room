import { confirmDelete } from '../../utils/alerts';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, RefreshCw, Lock, Mail, User, School, Eye, EyeOff, Edit2 } from 'lucide-react';

export default function SubAdminsManagement() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();

  const [subAdmins, setSubAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);


  const [showPassword, setShowPassword] = useState(false);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/sub-admins');
      if (res.ok) {
        const data = await res.json();
        setSubAdmins(data);
      } else {
        showToast('Failed to fetch sub-admins list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading sub-admins.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await authFetch('/admin/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchDepartments();
  }, []);

  const handleAddSubAdmin = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !department) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/admin/sub-admins/${editingId}` : '/admin/sub-admins';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method: method,
        body: JSON.stringify({ fullName, email, password, department })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || `Sub Admin ${editingId ? 'updated' : 'created'} successfully!`, 'success');
        resetForm();
        fetchSubAdmins();
      } else {
        showToast(data.message || `Failed to ${editingId ? 'update' : 'create'} sub admin.`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving sub admin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setDepartment('');
    setEditingId(null);
  };

  const handleEditClick = (admin) => {
    setEditingId(admin.id);
    setFullName(admin.full_name);
    setEmail(admin.email);
    setPassword(admin.raw_password || '');
    setDepartment(admin.department);
  };



  const handleDeleteSubAdmin = async (id, name) => {
    const isConfirmed = await confirmDelete({ 
      entityName: 'record', 
      customText: `Are you sure you want to delete the Sub Admin account for "${name}"?` 
    });
    if (!isConfirmed) return;

    try {
      const res = await authFetch(`/admin/sub-admins/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Sub Admin deleted successfully.', 'success');
        setSubAdmins((prev) => prev.filter((admin) => admin.id !== id));
      } else {
        showToast(data.message || 'Failed to delete sub admin.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting sub admin.', 'error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Sub-Admins</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>
            Register new department admins or delete existing ones.
          </p>
        </div>
        <button 
          onClick={fetchSubAdmins} 
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '2rem' }} className="sub-admins-layout">
        
        {/* Left Column: Create Sub Admin */}
        <div className="scrollable-col">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="hsl(var(--primary))" />
                {editingId ? 'Edit Sub-Admin' : 'Add Sub-Admin'}
              </h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Cancel Edit</button>
              )}
            </div>
            
            <form onSubmit={handleAddSubAdmin}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@edumark.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Password"
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

              {/* Department Dropdown */}
              <div className="form-group">
                <label className="form-label">Department</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                    <School size={16} />
                  </span>
                  <select
                    className="form-control"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (editingId ? 'Update Sub-Admin' : 'Register Sub-Admin')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Sub Admins list */}
        <div className="scrollable-col">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h3 style={{ color: 'hsl(var(--muted))' }}>Loading Sub Admins...</h3>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
              No department sub-admins registered yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
              {subAdmins.map((admin) => (
                <div key={admin.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.full_name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={admin.email}>{admin.email}</p>
                    </div>
                    <span className="badge" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                      {admin.department}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'hsl(var(--background))', padding: '0.75rem', borderRadius: '8px' }}>
                    <Lock size={14} color="hsl(var(--muted))" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>{admin.raw_password || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border) / 0.5)' }}>
                    <button
                      onClick={() => handleEditClick(admin)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem',
                        border: 'none',
                        backgroundColor: 'transparent'
                      }}
                      title="Edit Sub-Admin"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSubAdmin(admin.id, admin.full_name)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        color: 'hsl(var(--danger))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem',
                        border: 'none',
                        backgroundColor: 'transparent'
                      }}
                      title="Delete Sub-Admin Account"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sub-admins-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 901px) {
          .scrollable-col {
            max-height: calc(100vh - 180px);
            overflow-y: auto;
            padding-right: 0.5rem;
          }
        }
      `}</style>


    </div>
  );
}
