import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, RefreshCw, FolderKanban, ShieldAlert, Check } from 'lucide-react';

export default function DepartmentsManagement() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        showToast('Failed to fetch departments list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading departments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName || newDeptName.trim() === '') {
      showToast('Please enter a department name.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name: newDeptName })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Department added successfully!', 'success');
        setNewDeptName('');
        fetchDepartments();
      } else {
        showToast(data.message || 'Failed to add department.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error adding department.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (dept) => {
    const totalUsage = dept.student_count + dept.faculty_count;
    if (totalUsage > 0) {
      showToast(`Cannot delete department "${dept.name}". It has ${dept.student_count} students and ${dept.faculty_count} faculty assigned.`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) {
      return;
    }

    try {
      const res = await authFetch(`/admin/departments/${dept.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Department deleted successfully.', 'success');
        setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      } else {
        showToast(data.message || 'Failed to delete department.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting department.', 'error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Departments</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>
            Add new academic departments or delete unused ones.
          </p>
        </div>
        <button 
          onClick={fetchDepartments} 
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }} className="dept-layout">
        
        {/* Left Column: Add Department */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="hsl(var(--primary))" />
              Add Department
            </h3>
            
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chemical Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Create Department'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Departments list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h3 style={{ color: 'hsl(var(--muted))' }}>Loading departments...</h3>
            </div>
          ) : departments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
              No departments configured yet.
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th style={{ textAlign: 'center' }}>Active Students</th>
                    <th style={{ textAlign: 'center' }}>Active Faculty</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => {
                    const inUse = dept.student_count + dept.faculty_count > 0;
                    return (
                      <tr key={dept.id}>
                        <td style={{ fontWeight: 600 }}>{dept.name}</td>
                        <td style={{ textAlign: 'center' }}>{dept.student_count}</td>
                        <td style={{ textAlign: 'center' }}>{dept.faculty_count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteDepartment(dept)}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.4rem', 
                              color: inUse ? 'hsl(var(--muted) / 0.5)' : 'hsl(var(--danger))',
                              borderColor: 'transparent',
                              cursor: inUse ? 'not-allowed' : 'pointer'
                            }}
                            title={inUse ? "Cannot delete department in use" : "Delete Department"}
                            disabled={inUse}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .dept-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
