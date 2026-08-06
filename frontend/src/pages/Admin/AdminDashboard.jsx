import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SVGChart from '../../components/Shared/SVGChart';
import { Users, GraduationCap, Clock, Megaphone, FileText, BarChart3, X, Search, Calendar, Hash, FileDown, Eye, ArrowLeft, School, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import sub-admin page components to embed inside department portals
import RegistrationRequests from './RegistrationRequests';
import FacultyManagement from './FacultyManagement';
import AnnouncementsManagement from './AnnouncementsManagement';
import StudentsManagement from './StudentsManagement';

export default function AdminDashboard() {
  const { authFetch, token, user } = useAuth();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sub-department portal selection (Main Admin only)
  const [selectedDept, setSelectedDept] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'requests', 'faculty', 'announcements'

  const [departments, setDepartments] = useState([]);

  // Modals state
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  const [studentsList, setStudentsList] = useState([]);
  const [notesList, setNotesList] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Modal search filters
  const [studentSearch, setStudentSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const url = selectedDept ? `/admin/stats?department=${selectedDept}` : '/admin/stats';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        showToast('Failed to fetch dashboard statistics.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStats();
    // Reset tab when department changes
    setActiveSubTab('overview');
  }, [selectedDept]);

  const handleOpenStudentsModal = async () => {
    setShowStudentsModal(true);
    setLoadingModal(true);
    try {
      const url = selectedDept ? `/admin/students?department=${selectedDept}` : '/admin/students';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data);
      } else {
        showToast('Failed to fetch active students list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading students.', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" permanently?`)) {
      return;
    }
    try {
      const res = await authFetch(`/admin/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Student deleted successfully.', 'success');
        setStudentsList((prev) => prev.filter((s) => s.id !== id));
        fetchStats(); // Update the counts on the dashboard card
      } else {
        showToast(data.message || 'Failed to delete student.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting student.', 'error');
    }
  };

  const handleOpenNotesModal = async () => {
    setShowNotesModal(true);
    setLoadingModal(true);
    try {
      const url = selectedDept ? `/admin/notes?department=${selectedDept}` : '/admin/notes';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotesList(data);
      } else {
        showToast('Failed to fetch uploaded notes details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading notes.', 'error');
    } finally {
      setLoadingModal(false);
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
      showToast('Failed to download note file.', 'error');
    }
  };

  const handleDeleteNote = async (id, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}" note file permanently?`)) {
      return;
    }
    try {
      const res = await authFetch(`/admin/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Note deleted successfully.', 'success');
        setNotesList((prev) => prev.filter((n) => n.id !== id));
        fetchStats(); // Update the counts on the dashboard card
      } else {
        showToast(data.message || 'Failed to delete note.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting note.', 'error');
    }
  };

  // Filter lists
  const filteredStudents = studentsList.filter(s => {
    const name = s.full_name || '';
    const email = s.email || '';
    const enroll = s.enrollment_number || '';
    const dept = s.department || '';
    const term = studentSearch.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      enroll.toLowerCase().includes(term) ||
      dept.toLowerCase().includes(term)
    );
  });

  const filteredNotes = notesList.filter(n => 
    n.subject_name.toLowerCase().includes(notesSearch.toLowerCase()) ||
    n.faculty_name.toLowerCase().includes(notesSearch.toLowerCase()) ||
    n.department.toLowerCase().includes(notesSearch.toLowerCase()) ||
    n.file_name.toLowerCase().includes(notesSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'hsl(var(--muted))' }}>Loading system statistics...</h3>
      </div>
    );
  }

  const headingText = user?.adminRole === 'main_admin'
    ? (selectedDept ? `Viewing ${selectedDept} Department` : 'Welcome, Main Admin')
    : `Welcome, ${user?.department || 'Department'} Admin`;

  const subheadingText = user?.adminRole === 'main_admin'
    ? (selectedDept 
        ? `Departmental administrator sub-panel for ${selectedDept}.` 
        : 'Monitor global system metrics, manage departments, sub-admins, registrations, and notices.')
    : `Monitor metrics, manage registrations, faculty, and notices for the ${user?.department || 'selected'} department.`;

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{headingText}</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>{subheadingText}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => {
              const attendanceUrl = import.meta.env.VITE_ATTENDANCE_APP_URL || 'http://localhost:5174';
              window.open(`${attendanceUrl}?token=${token}&role=${user?.adminRole || 'admin'}`, '_blank');
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'hsl(var(--primary))' }}
          >
            <Calendar size={16} /> Attendance Portal
          </button>
          {selectedDept && (
            <button 
              onClick={() => setSelectedDept(null)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              <ArrowLeft size={16} /> Exit {selectedDept} Portal
            </button>
          )}
        </div>
      </div>

      {/* Sub-departments Portal Grid for Main Admin (Global view) */}
      {user?.adminRole === 'main_admin' && !selectedDept && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={22} color="hsl(var(--primary))" />
            Academic Departments Portals
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {(departments.length > 0 ? departments : ['BCA', 'B.Com', 'B.A', 'BBA', 'B.Sc', 'Engineering']).map((dept) => (
              <div 
                key={dept} 
                onClick={() => setSelectedDept(dept)}
                className="card" 
                style={{ 
                  cursor: 'pointer', 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '130px',
                  background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.4) 100%)',
                  border: '1px solid hsl(var(--border) / 0.8)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'hsl(var(--primary))' }}>{dept}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.25rem' }}>Administration Portal</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <span className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600 }}>
                    Enter Portal →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-departments Local Tabs (Scoped department portal view) */}
      {selectedDept && (
        <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
          <div 
            className={`auth-tab ${activeSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('overview')}
          >
            Overview & Stats
          </div>
          <div 
            className={`auth-tab ${activeSubTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('requests')}
          >
            Pending Requests
          </div>
          <div 
            className={`auth-tab ${activeSubTab === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('faculty')}
          >
            Faculty Management
          </div>
          <div 
            className={`auth-tab ${activeSubTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('students')}
          >
            Student Registry
          </div>
          <div 
            className={`auth-tab ${activeSubTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('announcements')}
          >
            Announcements & Notices
          </div>
        </div>
      )}

      {/* Scoped portal views */}
      {selectedDept && activeSubTab === 'requests' && (
        <div className="animate-fade-in">
          <RegistrationRequests department={selectedDept} />
        </div>
      )}

      {selectedDept && activeSubTab === 'faculty' && (
        <div className="animate-fade-in">
          <FacultyManagement department={selectedDept} />
        </div>
      )}

      {selectedDept && activeSubTab === 'students' && (
        <div className="animate-fade-in">
          <StudentsManagement department={selectedDept} />
        </div>
      )}

      {selectedDept && activeSubTab === 'announcements' && (
        <div className="animate-fade-in">
          <AnnouncementsManagement department={selectedDept} />
        </div>
      )}

      {/* Overview View (Renders for Sub-Admins, or for Main Admin under Global/Overview tab) */}
      {(!selectedDept || activeSubTab === 'overview') && (
        <>
          {user?.adminRole === 'main_admin' && !selectedDept && (
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={22} color="hsl(var(--accent))" />
              Global System Overview
            </h2>
          )}
          
          {/* Stats Cards */}
          <div className="dashboard-grid">
            {/* Total Students (Clickable trigger modal) */}
            <div 
              onClick={handleOpenStudentsModal}
              className="card" 
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total Students</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>Click to view details</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div className="card-value">{stats?.totalStudents || 0}</div>
                <div style={{ color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <GraduationCap size={24} />
                </div>
              </div>
            </div>

            {/* Total Faculty */}
            <div 
              onClick={() => {
                if (selectedDept) {
                  setActiveSubTab('faculty');
                }
              }}
              className="card"
              style={selectedDept ? { cursor: 'pointer' } : {}}
            >
              {!selectedDept ? (
                <Link to="/admin/faculty" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-title">Total Faculty</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalFaculty || 0}</div>
                    <div style={{ color: 'hsl(var(--accent))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--accent) / 0.1)' }}>
                      <Users size={24} />
                    </div>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Total Faculty</span>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent))', fontWeight: 600 }}>Click to manage</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalFaculty || 0}</div>
                    <div style={{ color: 'hsl(var(--accent))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--accent) / 0.1)' }}>
                      <Users size={24} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pending Requests */}
            <div 
              onClick={() => {
                if (selectedDept) {
                  setActiveSubTab('requests');
                }
              }}
              className="card"
              style={{
                borderLeft: stats?.totalPendingRequests > 0 ? '4px solid hsl(var(--warning))' : '1px solid hsl(var(--border))',
                cursor: selectedDept ? 'pointer' : 'default'
              }}
            >
              {!selectedDept ? (
                <Link to="/admin/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-title">Pending Requests</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalPendingRequests || 0}</div>
                    <div style={{ color: 'hsl(var(--warning))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--warning) / 0.1)' }}>
                      <Clock size={24} />
                    </div>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Pending Requests</span>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--warning))', fontWeight: 600 }}>Click to review</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalPendingRequests || 0}</div>
                    <div style={{ color: 'hsl(var(--warning))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--warning) / 0.1)' }}>
                      <Clock size={24} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Total Announcements */}
            <div 
              onClick={() => {
                if (selectedDept) {
                  setActiveSubTab('announcements');
                }
              }}
              className="card"
              style={selectedDept ? { cursor: 'pointer' } : {}}
            >
              {!selectedDept ? (
                <Link to="/admin/announcements" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-title">Total Announcements</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalAnnouncements || 0}</div>
                    <div style={{ color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                      <Megaphone size={24} />
                    </div>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Total Announcements</span>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>Click to manage</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="card-value">{stats?.totalAnnouncements || 0}</div>
                    <div style={{ color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                      <Megaphone size={24} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Total Notes Uploaded (Clickable trigger modal) */}
            <div 
              onClick={handleOpenNotesModal}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total Notes Uploaded</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--success))', fontWeight: 600 }}>Click to view details</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div className="card-value">{stats?.totalNotes || 0}</div>
                <div style={{ color: 'hsl(var(--success))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--success) / 0.1)' }}>
                  <FileText size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Charts section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }} className="charts-grid">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                <BarChart3 size={20} color="hsl(var(--primary))" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Notes per Department</h3>
              </div>
              <SVGChart type="bar" data={stats?.chartData?.notesPerDept || []} title="Faculty Upload Statistics" />
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                <BarChart3 size={20} color="hsl(var(--accent))" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Students per Department</h3>
              </div>
              <SVGChart type="donut" data={stats?.chartData?.studentsPerDept || []} title="Enrolled Students Breakdown" />
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: Enrolled Students details list */}
      {showStudentsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '1050px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap color="hsl(var(--primary))" />
                Approved Students Register
              </h3>
              <button 
                onClick={() => { setShowStudentsModal(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <StudentsManagement 
              department={selectedDept || user?.department} 
              insideModal={true} 
              onMutation={fetchStats}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Uploaded notes details list */}
      {showNotesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '950px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="hsl(var(--success))" />
                Uploaded Study Documents & Notes
              </h3>
              <button 
                onClick={() => { setShowNotesModal(false); setNotesSearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search filter for notes */}
            <div className="search-input-wrapper" style={{ maxWidth: '350px', marginBottom: '1.25rem' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by subject, faculty, department..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {loadingModal ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h4 style={{ color: 'hsl(var(--muted))' }}>Loading documents log...</h4>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
                No uploaded files found matching search.
              </div>
            ) : (
              <div className="table-container" style={{ marginTop: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'center' }}>Sem</th>
                      <th style={{ textAlign: 'center' }}>Unit</th>
                      <th>File Name</th>
                      <th>Uploaded By</th>
                      <th>Upload Date & Time</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotes.map((note) => (
                      <tr key={note.id}>
                        <td style={{ fontWeight: 700 }}>{note.subject_name}</td>
                        <td>{note.department}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-low">{note.semester}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-medium">{note.unit_number}</span>
                        </td>
                        <td style={{ fontSize: '0.825rem', color: 'hsl(var(--muted))' }}>{note.file_name}</td>
                        <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>Prof. {note.faculty_name}</td>
                        <td style={{ fontSize: '0.825rem' }}>{new Date(note.upload_date + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleDownloadNote(note)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                          >
                            <FileDown size={12} />
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id, note.subject_name)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                            title="Delete Document"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* CSS overrides for charts layout */}
      <style>{`
        @media (max-width: 900px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
