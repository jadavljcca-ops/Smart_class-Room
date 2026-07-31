import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, RefreshCw, Lock, Mail, User, School, Eye, EyeOff } from 'lucide-react';

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

  // Department creation inline modal state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);
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
      const res = await authFetch('/admin/sub-admins', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, department })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Sub Admin created successfully!', 'success');
        setFullName('');
        setEmail('');
        setPassword('');
        setDepartment('');
        fetchSubAdmins();
      } else {
        showToast(data.message || 'Failed to create sub admin.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error creating sub admin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDepartmentInline = async () => {
    if (!newDeptName || newDeptName.trim() === '') {
      showToast('Please enter a department name.', 'warning');
      return;
    }

    setAddingDept(true);
    try {
      const res = await authFetch('/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name: newDeptName })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Department added successfully!', 'success');
        const addedDeptName = newDeptName.trim();
        setNewDeptName('');
        setShowAddDeptModal(false);
        await fetchDepartments();
        setDepartment(addedDeptName);
      } else {
        showToast(data.message || 'Failed to add department.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error adding department.', 'error');
    } finally {
      setAddingDept(false);
    }
  };

  const handleDeleteSubAdmin = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the Sub Admin account for "${name}"?`)) {
      return;
    }

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }} className="sub-admins-layout">
        
        {/* Left Column: Create Sub Admin */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="hsl(var(--primary))" />
              Add Sub-Admin
            </h3>
            
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
                    placeholder="email@ljcca.edu"
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
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
                  <button
                    type="button"
                    onClick={() => setShowAddDeptModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Add New Department"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Register Sub-Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Sub Admins list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h3 style={{ color: 'hsl(var(--muted))' }}>Loading Sub Admins...</h3>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
              No department sub-admins registered yet.
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Sub-Admin Name</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th>Password</th>
                    <th>Date Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td style={{ fontWeight: 600 }}>{admin.full_name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {admin.department}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
                        {admin.raw_password || 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteSubAdmin(admin.id, admin.full_name)}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.4rem', 
                            color: 'hsl(var(--danger))',
                            borderColor: 'transparent'
                          }}
                          title="Delete Sub-Admin Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      `}</style>

      {/* Inline Modal for adding department */}
      {showAddDeptModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Add New Department</h3>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. BCA, BBA, B.Com"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => { setShowAddDeptModal(false); setNewDeptName(''); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDepartmentInline}
                className="btn btn-primary"
                disabled={addingDept}
              >
                {addingDept ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
