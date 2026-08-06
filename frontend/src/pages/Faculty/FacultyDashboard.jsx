import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL, BACKEND_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, Upload, Plus, Edit, Trash2, X, Save, 
  Search, RefreshCw, Paperclip, Download, Eye, Calendar, BookOpen 
} from 'lucide-react';

export default function FacultyDashboard() {
  const { authFetch, token, user } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Search filter
  const [notesSearch, setNotesSearch] = useState('');
  
  // Note Form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null); // Null for adding
  const [subjectName, setSubjectName] = useState('');
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState('1');
  const [unitNumber, setUnitNumber] = useState('1');
  const [description, setDescription] = useState('');
  const [noteFiles, setNoteFiles] = useState([]);
  const [existingFileName, setExistingFileName] = useState('');

  // Announcement Form state
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annDescription, setAnnDescription] = useState('');
  const [annPriority, setAnnPriority] = useState('Medium');
  const [annPublishDate, setAnnPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [annExpiryDate, setAnnExpiryDate] = useState('');
  const [annAttachment, setAnnAttachment] = useState(null);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await authFetch('/faculty/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        showToast('Failed to load notes.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading notes.', 'error');
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await authFetch('/faculty/announcements');
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
      setLoadingAnnouncements(false);
    }
  };

  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchAnnouncements();
    fetchDepartments();
  }, []);

  const openAddNoteModal = () => {
    setEditingNoteId(null);
    setSubjectName('');
    setDepartment(user?.department || '');
    setSemester('1');
    setUnitNumber('1');
    setDescription('');
    setNoteFiles([]);
    setExistingFileName('');
    setShowNoteForm(true);
  };

  const openEditNoteModal = (note) => {
    setEditingNoteId(note.id);
    setSubjectName(note.subject_name);
    setDepartment(note.department);
    setSemester(note.semester);
    setUnitNumber(note.unit_number);
    setDescription(note.description);
    setNoteFiles([]);
    setExistingFileName(note.file_name || '');
    setShowNoteForm(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!subjectName || !department || !semester || !unitNumber || !description) {
      showToast('Please provide all required fields.', 'warning');
      return;
    }

    const isEditing = editingNoteId !== null;
    if (!isEditing && noteFiles.length === 0) {
      showToast('Please upload at least one note file.', 'warning');
      return;
    }

    const url = isEditing ? `/faculty/notes/${editingNoteId}` : '/faculty/notes';
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('subjectName', subjectName);
    formData.append('department', department);
    formData.append('semester', semester);
    formData.append('unitNumber', unitNumber);
    formData.append('description', description);

    if (isEditing) {
      if (noteFiles.length > 0) {
        formData.append('file', noteFiles[0]);
      }
    } else {
      for (let i = 0; i < noteFiles.length; i++) {
        formData.append('files', noteFiles[i]);
      }
    }

    try {
      const res = await authFetch(url, {
        method,
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Note file saved successfully!', 'success');
        setShowNoteForm(false);
        fetchNotes();
      } else {
        showToast(data.message || 'Failed to save note.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving note.', 'error');
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annDescription || !annPublishDate || !annExpiryDate) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('title', annTitle);
    formData.append('description', annDescription);
    formData.append('priority', annPriority);
    formData.append('publishDate', annPublishDate);
    formData.append('expiryDate', annExpiryDate);
    if (annAttachment) formData.append('attachment', annAttachment);

    try {
      const res = await authFetch('/faculty/announcements', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Announcement created successfully!', 'success');
        setShowAnnForm(false);
        setAnnTitle('');
        setAnnDescription('');
        setAnnPriority('Medium');
        setAnnAttachment(null);
        fetchAnnouncements();
      } else {
        showToast(data.message || 'Failed to create announcement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving announcement.', 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note file permanently?')) {
      return;
    }

    try {
      const res = await authFetch(`/faculty/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Note deleted successfully.', 'success');
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        showToast(data.message || 'Failed to delete note.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting note.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement permanently?')) {
      return;
    }
    try {
      const res = await authFetch(`/faculty/announcements/${id}`, { method: 'DELETE' });
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

  const handleDownloadNote = async (note) => {
    try {
      const response = await fetch(`${API_BASE_URL}/student/notes/download/${note.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.setAttribute('download', note.file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      showToast('Failed to download file.', 'error');
    }
  };

  const handleViewNote = (note) => {
    const fileUrl = `${BACKEND_URL}${note.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadAnnouncementAttachment = async (ann) => {
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

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const subject = n.subject_name || '';
    const desc = n.description || '';
    const sem = String(n.semester || '');
    const unit = String(n.unit_number || '');
    const search = (notesSearch || '').toLowerCase();
    
    return (
      subject.toLowerCase().includes(search) ||
      desc.toLowerCase().includes(search) ||
      sem.includes(search) ||
      unit.includes(search)
    );
  });

  const totalDownloads = notes.reduce((sum, n) => sum + (n.download_count || 0), 0);


  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Welcome banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Faculty Dashboard</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>
          Welcome, Prof. {user?.fullName} ({user?.department})
        </p>
      </div>

      {/* Stats row */}
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <div className="card-title">My Uploaded Notes</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div className="card-value">{notes.length}</div>
            <div style={{ color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Total Note Downloads</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div className="card-value">{totalDownloads}</div>
            <div style={{ color: 'hsl(var(--success))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--success) / 0.1)' }}>
              <Download size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Dept Announcements</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div className="card-value">{announcements.length}</div>
            <div style={{ color: 'hsl(var(--accent))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--accent) / 0.1)' }}>
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Notes Management, Right Notice Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }} className="faculty-layout">
        
        {/* Left Column: Manage Notes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>My Uploaded Lecture Notes</h2>
            <button onClick={openAddNoteModal} className="btn btn-primary">
              <Plus size={16} />
              Upload Notes
            </button>
          </div>

          {/* Search control */}
          <div className="search-controls" style={{ marginBottom: '1rem' }}>
            <div className="search-input-wrapper">
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search subject, semester, or unit..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {loadingNotes ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>
              No notes uploaded yet. Click "Upload Notes" to start sharing resources.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredNotes.map((note) => (
                <div key={note.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Sem {note.semester}</span>
                        <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>Unit {note.unit_number}</span>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', fontWeight: 600 }}>{note.file_type.toUpperCase()} File</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>{note.subject_name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>{note.description}</p>
                      
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.75rem' }}>
                        <span>Downloads: <strong style={{ color: 'hsl(var(--foreground))' }}>{note.download_count || 0}</strong></span>
                        <span>Uploaded: {new Date(note.upload_date + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignSelf: 'center' }}>

                      <button 
                        onClick={() => handleDownloadNote(note)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--primary))' }}
                        title="Download Note File"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => openEditNoteModal(note)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--muted))' }}
                        title="Edit Note Details"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                        title="Delete Note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Notices/Announcements */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="hsl(var(--accent))" />
              Notice Board
            </h2>
            <button 
              onClick={() => {
                setAnnTitle('');
                setAnnDescription('');
                setAnnPriority('Medium');
                setAnnPublishDate(new Date().toISOString().split('T')[0]);
                setAnnExpiryDate('');
                setAnnAttachment(null);
                setShowAnnForm(true);
              }}
              className="btn btn-secondary"
            >
              <Plus size={16} />
              New Notice
            </button>
          </div>

          {loadingAnnouncements ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Loading notice board...</div>
          ) : announcements.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
              No active announcements for your department.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} className="card" style={{ padding: '1rem', borderLeft: ann.priority === 'High' ? '4px solid hsl(var(--danger))' : '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                    <span className={`badge badge-${ann.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{ann.priority}</span>
                    <span>{new Date(ann.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.4rem', color: 'hsl(var(--foreground))' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'hsl(var(--foreground) / 0.85)', marginTop: '0.4rem', whiteSpace: 'pre-wrap' }}>
                    {ann.description}
                  </p>
                  
                  {ann.attachment_path && (
                    <button 
                      onClick={() => handleDownloadAnnouncementAttachment(ann)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'hsl(var(--primary))', fontSize: '0.75rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.5rem'
                      }}
                    >
                      <Paperclip size={10} />
                      Attachment
                      <Download size={10} />
                    </button>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', color: 'hsl(var(--danger))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Delete Announcement"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Form Modal */}
      {showNoteForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingNoteId ? 'Update Lecture Note' : 'Upload Lecture Note'}
              </h3>
              <button 
                onClick={() => setShowNoteForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNote}>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Advanced Operating Systems"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    className="form-control"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Number</label>
                  <select
                    className="form-control"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(u => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Topic Outline</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Summarize the topics covered in this note file..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingNoteId ? 'File Upload (Optional)' : 'File Upload (Multiple PDFs/files allowed)'}
                </label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files);
                    setNoteFiles((prev) => [...prev, ...selected]);
                    e.target.value = null; // Clear input to allow re-selection
                  }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  multiple={!editingNoteId}
                  required={!editingNoteId && noteFiles.length === 0}
                />
                {noteFiles.length > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.75rem', border: '1px solid hsl(var(--border))', borderRadius: '6px', backgroundColor: 'hsl(var(--secondary) / 0.1)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'hsl(var(--foreground))' }}>Selected File Queue:</div>
                    <ul style={{ paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {noteFiles.map((f, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                            📁 {f.name} <span style={{ color: 'hsl(var(--muted))', fontSize: '0.75rem' }}>({Math.round(f.size / 1024)} KB)</span>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setNoteFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {existingFileName && noteFiles.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', marginTop: '0.25rem' }}>
                    Current File: {existingFileName}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowNoteForm(false)}
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
                  {editingNoteId ? 'Update Note' : 'Upload Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showAnnForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Announcement</h3>
              <button 
                onClick={() => setShowAnnForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mid-Sem Exam Schedule"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Details of the announcement..."
                  value={annDescription}
                  onChange={(e) => setAnnDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Publish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={annPublishDate}
                    onChange={(e) => setAnnPublishDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date (Auto-removes from board)</label>
                <input
                  type="date"
                  className="form-control"
                  value={annExpiryDate}
                  onChange={(e) => setAnnExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attachment (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setAnnAttachment(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {annAttachment && (
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', marginTop: '0.25rem' }}>
                    Selected: {annAttachment.name}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAnnForm(false)}
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
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 850px) {
          .faculty-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
