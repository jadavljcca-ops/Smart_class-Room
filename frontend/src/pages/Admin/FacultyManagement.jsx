import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Edit, Trash2, X, Save, RefreshCw, UserPlus } from 'lucide-react';

export default function FacultyManagement() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null for adding, ID for editing
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState(''); // Only for adding

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/faculty');
      if (res.ok) {
        const data = await res.json();
        setFaculty(data);
      } else {
        showToast('Failed to load faculty list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading faculty.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const res = await authFetch('/admin/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.map(d => d.name));
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setDepartment('');
    setEmployeeId('');
    setPassword('');
    setShowForm(true);
  };

  const openEditModal = (f) => {
    setEditingId(f.id);
    setFullName(f.full_name);
    setEmail(f.email);
    setMobileNumber(f.mobile_number);
    setDepartment(f.department);
    setEmployeeId(f.employee_id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !mobileNumber || !department || !employeeId) {
      showToast('Please fill all fields.', 'warning');
      return;
    }

    const isEditing = editingId !== null;
    const url = isEditing ? `/admin/faculty/${editingId}` : '/admin/faculty';
    const method = isEditing ? 'PUT' : 'POST';
    
    const body = {
      fullName,
      email,
      mobileNumber,
      department,
      employeeId,
      ...(isEditing ? {} : { password })
    };

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Faculty account saved successfully!', 'success');
        setShowForm(false);
        fetchFaculty(); // Reload list
      } else {
        showToast(data.message || 'Failed to save faculty.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving faculty data.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member permanently? All notes uploaded by them will also be deleted.')) {
      return;
    }

    try {
      const res = await authFetch(`/admin/faculty/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Faculty deleted successfully.', 'success');
        setFaculty((prev) => prev.filter((f) => f.id !== id));
      } else {
        showToast(data.message || 'Failed to delete faculty.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting faculty.', 'error');
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    return (
      f.full_name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase()) ||
      f.employee_id.toLowerCase().includes(search.toLowerCase())
    );
  });



  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Faculty Management</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>
            Add, update, or remove approved college faculty members.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add Faculty
          </button>
          <button onClick={fetchFaculty} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="search-controls" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search faculty name, department, faculty ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Grid or Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h3 style={{ color: 'hsl(var(--muted))' }}>Loading faculty members...</h3>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'hsl(var(--muted))' }}>
          No faculty members found. Click "Add Faculty" to create one.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>{f.employee_id}</td>
                  <td style={{ fontWeight: 600 }}>{f.full_name}</td>
                  <td>{f.email}</td>
                  <td>{f.mobile_number}</td>
                  <td>{f.department}</td>
                  <td>
                    <span className="badge badge-low" style={{ textTransform: 'capitalize' }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => openEditModal(f)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--primary))' }}
                        title="Edit Faculty"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(f.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                        title="Delete Faculty"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Form Modal (CSS Dialog Overlay style) */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingId ? 'Edit Faculty Account' : 'Add New Faculty'}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. rajesh@ljcca.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="10 digit number"
                  pattern="[0-9]{10}"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-control"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FAC4002"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>

              {!editingId && (
                <div className="form-group">
                  <label className="form-label">Default Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter default login password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Save size={16} />
                  {editingId ? 'Update Faculty' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
