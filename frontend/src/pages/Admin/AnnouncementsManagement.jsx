import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Edit, Trash2, X, Save, RefreshCw, Paperclip, Download, Calendar } from 'lucide-react';

export default function AnnouncementsManagement({ department: propDepartment }) {
  const { authFetch, token } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null for adding
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('All');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [attachment, setAttachment] = useState(null); // File object
  const [existingAttachmentName, setExistingAttachmentName] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        showToast('Failed to load announcements.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading announcements.', 'error');
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
        setDepartments(['All', ...data.map(d => d.name)]);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDepartment(propDepartment || 'All');
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setPublishDate(today);
    setExpiryDate(nextWeek);
    setPriority('Medium');
    setAttachment(null);
    setExistingAttachmentName('');
    setShowForm(true);
  };

  const openEditModal = (ann) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setDescription(ann.description);
    setDepartment(ann.department);
    setPublishDate(ann.publish_date);
    setExpiryDate(ann.expiry_date);
    setPriority(ann.priority);
    setAttachment(null);
    setExistingAttachmentName(ann.attachment_name || '');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title || !description || !publishDate || !expiryDate) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    const isEditing = editingId !== null;
    const url = isEditing ? `/admin/announcements/${editingId}` : '/admin/announcements';
    const method = isEditing ? 'PUT' : 'POST';

    // Since we can upload files, we must use FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('department', department);
    formData.append('publishDate', publishDate);
    formData.append('expiryDate', expiryDate);
    formData.append('priority', priority);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await authFetch(url, {
        method,
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Announcement saved successfully!', 'success');
        setShowForm(false);
        fetchAnnouncements();
      } else {
        showToast(data.message || 'Failed to save announcement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving announcement.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement permanently?')) {
      return;
    }

    try {
      const res = await authFetch(`/admin/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Announcement deleted successfully.', 'success');
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } else {
        showToast(data.message || 'Failed to delete announcement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting announcement.', 'error');
    }
  };

  const handleDownload = async (ann) => {
    try {
      const response = await fetch(`${API_BASE_URL}/student/announcements/download/${ann.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.setAttribute('download', ann.attachment_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      showToast('Failed to download attachment.', 'error');
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch = 
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.description.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'all' || ann.department === deptFilter;

    return matchesSearch && matchesDept;
  });



  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {propDepartment ? `${propDepartment} ` : ''}Announcements & Notices
          </h1>
          <p style={{ color: 'hsl(var(--muted))' }}>
            Publish important alerts, events, and notices to college students and faculty{propDepartment ? ` in ${propDepartment}` : ''}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add Announcement
          </button>
          <button onClick={fetchAnnouncements} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search filters */}
      <div className="search-controls" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ flex: '2', minWidth: '250px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search announcement titles or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <select
          className="form-control"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="all">All Departments</option>
          {departments.map((dept, idx) => (
            dept !== 'All' && <option key={idx} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Notices List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h3 style={{ color: 'hsl(var(--muted))' }}>Loading announcements...</h3>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'hsl(var(--muted))' }}>
          No announcements found. Click "Add Announcement" to post a new one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredAnnouncements.map((ann) => (
            <div key={ann.id} className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid hsl(var(--border) / 0.5)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${ann.priority.toLowerCase()}`}>{ann.priority} Priority</span>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', fontWeight: 600 }}>Dept: {ann.department}</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.5rem', color: 'hsl(var(--foreground))' }}>
                    {ann.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => openEditModal(ann)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', color: 'hsl(var(--primary))' }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Description Body */}
              <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', color: 'hsl(var(--foreground) / 0.9)', fontSize: '0.95rem' }}>
                {ann.description}
              </p>

              {/* Footer info (Dates + Attachments) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border) / 0.3)', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} />
                    Publish: {ann.publish_date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} />
                    Expiry: {ann.expiry_date}
                  </span>
                </div>

                {ann.attachment_path && (
                  <button 
                    onClick={() => handleDownload(ann)}
                    className="btn btn-secondary animate-fade-in"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'hsl(var(--primary))' }}
                  >
                    <Paperclip size={12} />
                    {ann.attachment_name}
                    <Download size={12} style={{ marginLeft: '4px' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit notice Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
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
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. End Semester Examination Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Notice Details</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Write the details of the announcement here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Department</label>
                  {propDepartment ? (
                    <input
                      type="text"
                      className="form-control"
                      value={propDepartment}
                      readOnly
                    />
                  ) : (
                    <select
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Publish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* File Attachment */}
              <div className="form-group">
                <label className="form-label">Attachment (Optional PDF/Image)</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  accept=".pdf,image/*"
                />
                {existingAttachmentName && !attachment && (
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', marginTop: '0.25rem' }}>
                    Current Attachment: {existingAttachmentName}
                  </p>
                )}
              </div>

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
                  {editingId ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
