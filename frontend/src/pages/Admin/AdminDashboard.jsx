import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SVGChart from '../../components/Shared/SVGChart';
import { Users, GraduationCap, Clock, Megaphone, FileText, BarChart3, X, Search, Calendar, Hash, FileDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { authFetch, token } = useAuth();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await authFetch('/admin/stats');
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

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenStudentsModal = async () => {
    setShowStudentsModal(true);
    setLoadingModal(true);
    try {
      const res = await authFetch('/admin/students');
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

  const handleOpenNotesModal = async () => {
    setShowNotesModal(true);
    setLoadingModal(true);
    try {
      const res = await authFetch('/admin/notes');
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
      const API_BASE_URL = 'http://localhost:5000/api';
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

  // Filter lists
  const filteredStudents = studentsList.filter(s => 
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.department.toLowerCase().includes(studentSearch.toLowerCase())
  );

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

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, Admin</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>
          Monitor system metrics, manage registrations, faculty accounts, and notices.
        </p>
      </div>

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
        <Link to="/admin/faculty" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div className="card-title">Total Faculty</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <div className="card-value">{stats?.totalFaculty || 0}</div>
              <div style={{ color: 'hsl(var(--accent))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--accent) / 0.1)' }}>
                <Users size={24} />
              </div>
            </div>
          </div>
        </Link>

        {/* Pending Requests */}
        <Link to="/admin/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ borderLeft: stats?.totalPendingRequests > 0 ? '4px solid hsl(var(--warning))' : '1px solid hsl(var(--border))' }}>
            <div className="card-title">Pending Requests</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <div className="card-value">{stats?.totalPendingRequests || 0}</div>
              <div style={{ color: 'hsl(var(--warning))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--warning) / 0.1)' }}>
                <Clock size={24} />
              </div>
            </div>
          </div>
        </Link>

        {/* Total Announcements */}
        <Link to="/admin/announcements" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div className="card-title">Total Announcements</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <div className="card-value">{stats?.totalAnnouncements || 0}</div>
              <div style={{ color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                <Megaphone size={24} />
              </div>
            </div>
          </div>
        </Link>

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

      {/* MODAL 1: Enrolled Students details list */}
      {showStudentsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '900px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap color="hsl(var(--primary))" />
                Approved Students Register
              </h3>
              <button 
                onClick={() => { setShowStudentsModal(false); setStudentSearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search filter for students */}
            <div className="search-input-wrapper" style={{ maxWidth: '350px', marginBottom: '1.25rem' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {loadingModal ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h4 style={{ color: 'hsl(var(--muted))' }}>Loading student records...</h4>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
                No active students found matching search.
              </div>
            ) : (
              <div className="table-container" style={{ marginTop: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Enrollment No</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'center' }}>Sem</th>
                      <th>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((stud) => (
                      <tr key={stud.id}>
                        <td style={{ fontWeight: 700 }}>{stud.enrollment_number}</td>
                        <td style={{ fontWeight: 600 }}>{stud.full_name}</td>
                        <td>{stud.email}</td>
                        <td>{stud.mobile_number}</td>
                        <td>{stud.department}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-low">{stud.semester}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                          {new Date(stud.created_at).toLocaleDateString()}
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
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDownloadNote(note)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                          >
                            <FileDown size={12} />
                            Download
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
