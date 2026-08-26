import { confirmDelete } from '../../utils/alerts';
import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SVGChart from '../../components/Shared/SVGChart';
import { Users, GraduationCap, Clock, Megaphone, FileText, BarChart3, X, Search, Hash, FileDown, Eye, ArrowLeft, School, Trash2 } from 'lucide-react';

import { Link } from 'react-router-dom';

// Import sub-admin page components to embed inside department portals
import RegistrationRequests from './RegistrationRequests';
import FacultyManagement from './FacultyManagement';
import AnnouncementsManagement from './AnnouncementsManagement';
import StudentsManagement from './StudentsManagement';
import NotificationMenu from '../../components/Shared/NotificationMenu';
import studentAvatar from '../../assets/student-avatar.png';
import facultyAvatar from '../../assets/faculty-avatar.png';
import requestIcon from '../../assets/request-icon.png';
import announcementIcon from '../../assets/announcement-icon.png';
import notesIcon from '../../assets/notes-icon.png';

export default function AdminDashboard() {
  const { authFetch, token, user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingRequests: 0,
    totalFaculty: 0,
    totalNotes: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Sub-department portal selection (Main Admin only)
  const [selectedDept, setSelectedDept] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'requests', 'faculty', 'announcements'

  const [departments, setDepartments] = useState([]);

  // Modals state
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const [studentsList, setStudentsList] = useState([]);
  const [notesList, setNotesList] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Modal search filters
  const [studentSearch, setStudentSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const url = selectedDept ? `/admin/stats?department=${selectedDept}` : '/admin/stats';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
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
    const isConfirmed = await confirmDelete({
      entityName: 'record',
      customText: `Are you sure you want to delete "${name}" permanently?`
    });
    if (!isConfirmed) return;
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
    const isConfirmed = await confirmDelete({
      entityName: 'record',
      customText: `Are you sure you want to delete "${subjectName}" note file permanently?`
    });
    if (!isConfirmed) return;
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

  const headingText = user?.adminRole === 'main_admin'
    ? (selectedDept ? `Viewing ${selectedDept} Department` : 'Welcome, Main Admin')
    : `Welcome, ${user?.department || 'Department'} Admin`;

  const subheadingText = user?.adminRole === 'main_admin'
    ? (selectedDept
      ? `Departmental administrator sub-panel for ${selectedDept}.`
      : 'Monitor global system metrics, manage departments, sub-admins, registrations, and notices.')
    : `Monitor metrics, manage registrations, faculty, and notices for the ${user?.department || 'selected'} department.`;

  return (
    <>
      <div className="container animate-fade-in" style={{ padding: '0 1.5rem 2rem 1.5rem' }}>
        {/* Header Banner — wrapped in sticky-header-wrapper to mask top gap on scroll */}

        <div className="sticky-header-wrapper">
          <div className="admin-top-header-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', background: 'linear-gradient(135deg, #002d62 0%, #001f3f 100%)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' }}>
            <div>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{headingText}</h1>
              <p style={{ color: '#94a3b8', margin: '0.4rem 0 0 0', fontSize: '0.95rem' }}>{subheadingText}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="admin-desktop-banner-notif">
                <NotificationMenu />
              </div>
              {selectedDept && (
                <button
                  onClick={() => setSelectedDept(null)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.65rem 1.25rem' }}
                >
                  <ArrowLeft size={18} /> Exit {selectedDept} Portal
                </button>
              )}
            </div>
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12), 0 0 14px rgba(245, 158, 11, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a' }}>{dept}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Administration Portal</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <span className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
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
                <div className="card-title">
                  Total Students
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div className="card-value">{stats?.totalStudents || 0}</div>
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '14px', 
                    backgroundColor: '#eff6ff', 
                    border: '1.5px solid #dbeafe',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
                  }}>
                    <img 
                      src={studentAvatar} 
                      alt="Student" 
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }} 
                    />
                  </div>
                </div>
              </div>

              {/* Total Faculty */}
              <div
                onClick={() => {
                  if (selectedDept) {
                    setActiveSubTab('faculty');
                  } else {
                    setShowFacultyModal(true);
                  }
                }}
                className="card"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {!selectedDept ? (
                  <div>
                    <div className="card-title">Total Faculty</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div className="card-value">{stats?.totalFaculty || 0}</div>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '14px', 
                        backgroundColor: '#f0fdf4', 
                        border: '1.5px solid #bbf7d0',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.12)'
                      }}>
                        <img 
                          src={facultyAvatar} 
                          alt="Faculty" 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-title">
                      Total Faculty
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div className="card-value">{stats?.totalFaculty || 0}</div>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '14px', 
                        backgroundColor: '#f0fdf4', 
                        border: '1.5px solid #bbf7d0',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.12)'
                      }}>
                        <img 
                          src={facultyAvatar} 
                          alt="Faculty" 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }} 
                        />
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
                  } else {
                    setShowAnnouncementsModal(true);
                  }
                }}
                className="card"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {!selectedDept ? (
                  <div>
                    <div className="card-title">Total Announcements</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div className="card-value">{stats?.totalAnnouncements || 0}</div>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '14px', 
                        backgroundColor: '#fffbeb', 
                        border: '1.5px solid #fde68a',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                      }}>
                        <img 
                          src={announcementIcon} 
                          alt="Announcements" 
                          style={{ width: '46px', height: '46px', objectFit: 'contain' }} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-title">
                      Total Announcements
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div className="card-value">{stats?.totalAnnouncements || 0}</div>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '14px', 
                        backgroundColor: '#fffbeb', 
                        border: '1.5px solid #fde68a',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                      }}>
                        <img 
                          src={announcementIcon} 
                          alt="Announcements" 
                          style={{ width: '46px', height: '46px', objectFit: 'contain' }} 
                        />
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
                <div className="card-title">
                  Total Notes Uploaded
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div className="card-value">{stats?.totalNotes || 0}</div>
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '14px', 
                    backgroundColor: '#fefce8', 
                    border: '1.5px solid #fef08a',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(202, 138, 4, 0.12)'
                  }}>
                    <img 
                      src={notesIcon} 
                      alt="Notes Uploaded" 
                      style={{ width: '46px', height: '46px', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Charts section */}
            {user?.adminRole === 'main_admin' && !selectedDept && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }} className="charts-grid">

                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                    <BarChart3 size={20} color="hsl(var(--accent))" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Students per Department</h3>
                  </div>
                  <SVGChart type="donut" data={stats?.chartData?.studentsPerDept || []} title="Enrolled Students Breakdown" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: Enrolled Students details list */}
      {showStudentsModal && (
        <div 
          onClick={() => setShowStudentsModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '1050px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#001c3d', backdropFilter: 'none' }}
          >
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

      {/* MODAL 1.5: Faculty Members details list */}
      {showFacultyModal && (
        <div 
          onClick={() => setShowFacultyModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '1050px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#001c3d', backdropFilter: 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users color="hsl(var(--success))" />
                Faculty Members Register
              </h3>
              <button
                onClick={() => { setShowFacultyModal(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <FacultyManagement
              department={selectedDept || user?.department}
              insideModal={true}
            />
          </div>
        </div>
      )}

      {/* MODAL 1.75: Announcements Modal */}
      {showAnnouncementsModal && (
        <div 
          onClick={() => setShowAnnouncementsModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '1050px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#001c3d', backdropFilter: 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone color="hsl(var(--warning))" />
                Announcements & Notices
              </h3>
              <button
                onClick={() => { setShowAnnouncementsModal(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            <AnnouncementsManagement
              department={selectedDept || user?.department}
              insideModal={true}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Uploaded notes details list */}
      {showNotesModal && (
        <div 
          onClick={() => { setShowNotesModal(false); setNotesSearch(''); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '950px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#001c3d', backdropFilter: 'none' }}
          >
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
    </>
  );
}
