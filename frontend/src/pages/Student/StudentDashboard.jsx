import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Megaphone, FileText, Search, Download, Paperclip, 
  Calendar, RefreshCw, Filter, User, BookOpen, GraduationCap, School, Eye, Folder, ArrowLeft 
} from 'lucide-react';

export default function StudentDashboard() {
  const { authFetch, token, user } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Search & Filter state for Notes
  const [notesQuery, setNotesQuery] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [facultyQuery, setFacultyQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState(user?.department || 'all');
  const [semFilter, setSemFilter] = useState(user?.semester || 'all');
  const [viewMode, setViewMode] = useState('subject'); // 'subject' or 'faculty'
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Search state for Announcements
  const [annQuery, setAnnQuery] = useState('');

  const fetchAnnouncements = async () => {
    setLoadingAnn(true);
    try {
      const res = await authFetch('/student/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        showToast('Failed to load notices.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading announcements.', 'error');
    } finally {
      setLoadingAnn(false);
    }
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await authFetch('/student/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        showToast('Failed to load study notes.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading faculty notes.', 'error');
    } finally {
      setLoadingNotes(false);
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
    fetchAnnouncements();
    fetchNotes();
    fetchDepartments();
  }, []);

  const handleDownloadNote = async (note) => {
    try {
      showToast(`Starting download: ${note.file_name}`, 'info');
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
      showToast('Download completed!', 'success');
      
      // Update notes local count for download
      setNotes(prev => 
        prev.map(n => n.id === note.id ? { ...n, download_count: (n.download_count || 0) + 1 } : n)
      );
    } catch (err) {
      console.error(err);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  const handleViewNote = (note) => {
    const fileUrl = `http://localhost:5000${note.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadAnnouncementAttachment = async (ann) => {
    try {
      showToast(`Starting download: ${ann.attachment_name}`, 'info');
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
      showToast('Attachment downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to download attachment.', 'error');
    }
  };

  // Filter Announcements
  const filteredAnnouncements = announcements.filter((ann) => {
    return (
      ann.title.toLowerCase().includes(annQuery.toLowerCase()) ||
      ann.description.toLowerCase().includes(annQuery.toLowerCase())
    );
  });

  // Filter Notes based on inputs
  const filteredNotes = notes.filter((n) => {
    const matchesSubject = n.subject_name.toLowerCase().includes(subjectQuery.toLowerCase()) || n.description.toLowerCase().includes(subjectQuery.toLowerCase());
    const matchesFaculty = n.faculty_name.toLowerCase().includes(facultyQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || n.department === deptFilter;
    const matchesSem = semFilter === 'all' || String(n.semester) === String(semFilter);
    const matchesGeneral = notesQuery === '' || 
      n.subject_name.toLowerCase().includes(notesQuery.toLowerCase()) || 
      n.faculty_name.toLowerCase().includes(notesQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(notesQuery.toLowerCase());

    return matchesSubject && matchesFaculty && matchesDept && matchesSem && matchesGeneral;
  });



  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Welcome banner */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Student Dashboard</h1>
          <p style={{ color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Welcome, {user?.fullName}</span>
            <span>•</span>
            <span>Sem {user?.semester}</span>
            <span>•</span>
            <span>{user?.department}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => { fetchAnnouncements(); fetchNotes(); }} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Two-section page layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }} className="student-layout">
        
        {/* SECTION 1: Announcements & Notices */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={20} color="hsl(var(--primary))" />
            Notices & Board
          </h2>

          {/* Search notice */}
          <div className="search-controls" style={{ marginBottom: '1rem' }}>
            <div className="search-input-wrapper" style={{ minWidth: '100%' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search notices..."
                value={annQuery}
                onChange={(e) => setAnnQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {loadingAnn ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Loading notice board...</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
              No active announcements found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAnnouncements.map((ann) => (
                <div 
                  key={ann.id} 
                  className="card animate-fade-in" 
                  style={{
                    padding: '1.1rem',
                    borderLeft: ann.priority === 'High' ? '4px solid hsl(var(--danger))' : '1px solid hsl(var(--border))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                    <span className={`badge badge-${ann.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{ann.priority}</span>
                    <span>{ann.publish_date}</span>
                  </div>
                  <h4 style={{ fontSize: '0.975rem', fontWeight: 700, marginTop: '0.4rem', color: 'hsl(var(--foreground))' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground) / 0.85)', marginTop: '0.4rem', whiteSpace: 'pre-wrap' }}>
                    {ann.description}
                  </p>
                  
                  {ann.attachment_path && (
                    <button 
                      onClick={() => handleDownloadAnnouncementAttachment(ann)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'hsl(var(--primary))', fontSize: '0.75rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.6rem'
                      }}
                    >
                      <Paperclip size={10} />
                      Download Attachment
                      <Download size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Faculty Notes */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="hsl(var(--success))" />
            Faculty Lecture Notes
          </h2>

          {/* View Toggle Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid hsl(var(--border) / 0.5)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => { setViewMode('subject'); setSelectedFaculty(null); }}
              className={`btn ${viewMode === 'subject' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <BookOpen size={14} />
              View by Subject
            </button>
            <button
              onClick={() => { setViewMode('faculty'); setSelectedFaculty(null); }}
              className={`btn ${viewMode === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Folder size={14} />
              View by Faculty
            </button>
          </div>

          {/* Search boxes & Filters */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: 'hsl(var(--secondary) / 0.3)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted))', marginBottom: '0.75rem' }}>
              Advanced Notes Search
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }} className="filters-grid">
              <input
                type="text"
                className="form-control"
                placeholder="Search Subject or Topic..."
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by Faculty Name..."
                value={facultyQuery}
                onChange={(e) => setFacultyQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }} className="filters-grid">
              <select
                className="form-control"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                className="form-control"
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes display */}
          {loadingNotes ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>
              No faculty study notes found matching your filters.
            </div>
          ) : viewMode === 'subject' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredNotes.map((note) => (
                <div key={note.id} className="card animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Sem {note.semester}</span>
                        <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>Unit {note.unit_number}</span>
                        <span className="badge badge-high" style={{ fontSize: '0.7rem', textTransform: 'capitalize', backgroundColor: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent) / 0.3)' }}>
                          {note.department}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.4rem', color: 'hsl(var(--foreground))' }}>
                        {note.subject_name}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>
                        {note.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                        <User size={12} />
                        Uploaded by: <strong style={{ color: 'hsl(var(--foreground))' }}>Prof. {note.faculty_name}</strong>
                        <span>•</span>
                        <span>{new Date(note.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <button 
                        onClick={() => handleDownloadNote(note)}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Download size={14} />
                        Download ({note.file_type.toUpperCase()})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* View Mode: Faculty Folders */
            <div>
              {selectedFaculty === null ? (
                /* Directory of Folders */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {Object.entries(
                    filteredNotes.reduce((acc, note) => {
                      const name = note.faculty_name || 'Unknown Faculty';
                      if (!acc[name]) acc[name] = [];
                      acc[name].push(note);
                      return acc;
                    }, {})
                  ).map(([facName, facNotes]) => (
                    <div 
                      key={facName}
                      onClick={() => setSelectedFaculty(facName)}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        padding: '1.5rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        border: '1.5px dashed hsl(var(--primary) / 0.25)',
                        backgroundColor: 'hsl(var(--card) / 0.35)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.25)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ color: '#EAB308', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={48} fill="#FEF08A" />
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))' }}>
                        Prof. {facName}
                      </h4>
                      <span className="badge badge-low" style={{ marginTop: '0.6rem', fontSize: '0.75rem' }}>
                        {facNotes.length} Document{facNotes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Subfolder Notes list */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button
                      onClick={() => setSelectedFaculty(null)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <ArrowLeft size={14} />
                      Back to Folders
                    </button>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'hsl(var(--foreground))' }}>
                      Folder: Prof. {selectedFaculty}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredNotes
                      .filter(n => n.faculty_name === selectedFaculty)
                      .map((note) => (
                        <div key={note.id} className="card animate-fade-in">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Sem {note.semester}</span>
                                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>Unit {note.unit_number}</span>
                                <span className="badge badge-high" style={{ fontSize: '0.7rem', textTransform: 'capitalize', backgroundColor: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent) / 0.3)' }}>
                                  {note.department}
                                </span>
                              </div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.4rem', color: 'hsl(var(--foreground))' }}>
                                {note.subject_name}
                              </h3>
                              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>
                                {note.description}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                                <User size={12} />
                                Uploaded by: <strong style={{ color: 'hsl(var(--foreground))' }}>Prof. {note.faculty_name}</strong>
                                <span>•</span>
                                <span>{new Date(note.upload_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{ alignSelf: 'center' }}>
                              <button 
                                onClick={() => handleDownloadNote(note)}
                                className="btn btn-primary"
                                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                              >
                                <Download size={14} />
                                Download ({note.file_type.toUpperCase()})
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Responsive layout overrides */}
      <style>{`
        @media (max-width: 900px) {
          .student-layout {
            grid-template-columns: 1fr !important;
          }
          .filters-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
