import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Check, X, Trash2, Search, Filter, RefreshCw, Calendar, Mail, Phone, Hash } from 'lucide-react';

export default function RegistrationRequests() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'student', 'faculty'

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        showToast('Failed to load registration requests.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading registration requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    if (action === 'Delete' && !window.confirm('Are you sure you want to delete this request permanently?')) {
      return;
    }
    
    try {
      const res = await authFetch(`/admin/requests/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || `Request ${action}ed successfully!`, 'success');
        // Remove item from state or update list
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast(data.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error performing request action.', 'error');
    }
  };

  // Filter requests based on search query and role filter
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      (r.enrollment_number && r.enrollment_number.toLowerCase().includes(search.toLowerCase())) ||
      (r.employee_id && r.employee_id.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || r.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Registration Requests</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>
            Review and approve student and faculty registrations. Users cannot log in until approved.
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Row */}
      <div className="search-controls" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper">
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, department, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>
      </div>

      {/* Requests Grid/List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h3 style={{ color: 'hsl(var(--muted))' }}>Loading requests...</h3>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'hsl(var(--muted))' }}>
          No pending registration requests found matching your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="card"
              style={{
                borderLeft: req.role === 'student' ? '4px solid hsl(var(--primary))' : '4px solid hsl(var(--accent))',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{req.full_name}</h3>
                    <span 
                      className={`badge`}
                      style={{
                        backgroundColor: req.role === 'student' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--accent) / 0.15)',
                        color: req.role === 'student' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                        border: req.role === 'student' ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid hsl(var(--accent) / 0.3)'
                      }}
                    >
                      {req.role}
                    </span>
                  </div>

                  {/* Info lines */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} />
                      {req.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} />
                      {req.mobile_number}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Hash size={14} />
                      Dept: {req.department}
                    </div>
                    
                    {req.role === 'student' ? (
                      <>
                        <div>Sem: {req.semester}</div>
                        <div>Enroll: {req.enrollment_number}</div>
                      </>
                    ) : (
                      <div>Faculty ID: {req.employee_id}</div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} />
                    Requested on: {new Date(req.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Actions Section */}
                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                  <button 
                    onClick={() => handleAction(req.id, 'Accept')}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: 'hsl(var(--success))' }}
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'Reject')}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'hsl(var(--danger))', borderColor: 'hsl(var(--danger) / 0.3)' }}
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'Delete')}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', color: 'hsl(var(--muted))' }}
                    title="Delete Request"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
