import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Trash2, X, Save, RefreshCw, Upload, Download, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function StudentsManagement({ department: propDepartment, insideModal = false, onMutation }) {
  const { authFetch, user } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk Upload Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);

  const [departments, setDepartments] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const url = propDepartment ? `/admin/students?department=${propDepartment}` : '/admin/students';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        showToast('Failed to load students list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading students.', 'error');
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
    fetchStudents();
    fetchDepartments();
  }, [propDepartment]);

  const openAddModal = () => {
    setEnrollmentNumber('');
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setDepartment(propDepartment || '');
    setSemester('');
    setPassword('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const targetDept = propDepartment || department;

    if (!fullName || !email || !mobileNumber || !targetDept || !semester || !enrollmentNumber || !password) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/admin/students', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          mobileNumber,
          department: targetDept,
          semester,
          enrollmentNumber,
          password
        })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Student account created successfully!', 'success');
        setShowForm(false);
        fetchStudents();
        if (onMutation) onMutation();
      } else {
        showToast(data.message || 'Failed to save student.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving student data.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" permanently? All note download history for this student will also be deleted.`)) {
      return;
    }

    try {
      const res = await authFetch(`/admin/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Student deleted successfully.', 'success');
        setStudents((prev) => prev.filter((s) => s.id !== id));
        if (onMutation) onMutation();
      } else {
        showToast(data.message || 'Failed to delete student.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting student.', 'error');
    }
  };

  // Dynamically load sheetjs for xlsx parsing
  const loadXLSX = () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('Failed to load excel parser library.'));
      document.head.appendChild(script);
    });
  };

  // Parse CSV helper
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    const result = [];
    if (lines.length <= 1) return [];

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      result.push(row);
    }
    return result;
  };

  // Handle File upload parse
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkFile(file);
    setParsingFile(true);
    setParsedStudents([]);

    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
      const reader = new FileReader();

      if (ext === 'csv') {
        reader.onload = (evt) => {
          try {
            const rawData = parseCSV(evt.target.result);
            processRawUploadData(rawData);
          } catch (err) {
            showToast('Failed to parse CSV file structure.', 'error');
          }
        };
        reader.readAsText(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await loadXLSX();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            processRawUploadData(rawData);
          } catch (err) {
            showToast('Failed to parse Excel workbook sheet.', 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        showToast('Invalid file format. Please upload a .csv or .xlsx file.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error processing spreadsheet file.', 'error');
    } finally {
      setParsingFile(false);
    }
  };

  // Standardize raw keys to match application expected fields
  const processRawUploadData = (rawList) => {
    const defaultDept = propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : '');

    const formatted = rawList.map(row => {
      // Find case-insensitive keys
      const getVal = (possibleKeys) => {
        const foundKey = Object.keys(row).find(k => possibleKeys.includes(k.trim().toLowerCase()));
        return foundKey ? row[foundKey] : '';
      };

      return {
        fullName: getVal(['fullname', 'name', 'studentname', 'full name', 'student name']),
        email: getVal(['email', 'emailaddress', 'email address']),
        mobileNumber: getVal(['mobile', 'mobilenumber', 'phone', 'contact', 'mobile number', 'phone number']),
        department: getVal(['department', 'dept']) || defaultDept,
        semester: getVal(['semester', 'sem']),
        enrollmentNumber: getVal(['enrollment', 'enrollmentnumber', 'enrollment no', 'enrollment number', 'enrollno', 'rollno', 'roll number']),
        password: getVal(['password', 'pass', 'defaultpassword']) || 'student123'
      };
    });

    setParsedStudents(formatted);
    showToast(`Parsed ${formatted.length} students from spreadsheet!`, 'success');
  };

  const handleBulkImport = async () => {
    if (parsedStudents.length === 0) {
      showToast('No parsed students to import.', 'warning');
      return;
    }

    // Verify all rows have required fields
    const invalidRows = parsedStudents.some(s => 
      !s.fullName || !s.email || !s.mobileNumber || !s.department || !s.semester || !s.enrollmentNumber
    );

    if (invalidRows) {
      showToast('Some parsed rows are missing required fields. Please review the preview.', 'error');
      return;
    }

    setParsingFile(true);
    try {
      const res = await authFetch('/admin/students/bulk', {
        method: 'POST',
        body: JSON.stringify({ students: parsedStudents })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Import complete!', 'success');
        setShowBulkModal(false);
        setBulkFile(null);
        setParsedStudents([]);
        fetchStudents();
        if (onMutation) onMutation();
      } else {
        showToast(data.message || 'Import failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during bulk import.', 'error');
    } finally {
      setParsingFile(false);
    }
  };

  // Download Sample CSV Helper
  const downloadSampleCSV = () => {
    const defaultDept = propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : 'BCA');
    const headers = 'Enrollment Number,Full Name,Email,Mobile Number,Department,Semester,Password\n';
    const row1 = `22BCA2001,Amit Patel,amit@ljcca.edu,9876543210,${defaultDept},3,patel123\n`;
    const row2 = `22BCA2002,Neha Shah,neha@ljcca.edu,9876543211,${defaultDept},3,shah123\n`;
    
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'students_bulk_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    return (
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className={insideModal ? "animate-fade-in" : "container animate-fade-in"} style={insideModal ? { padding: 0 } : { padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        {!insideModal ? (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {propDepartment ? `${propDepartment} ` : ''}Students Management
            </h1>
            <p style={{ color: 'hsl(var(--muted))' }}>
              Add, delete, or upload student rosters to manage student accounts{propDepartment ? ` in ${propDepartment}` : ''}.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'hsl(var(--muted))', margin: 0 }}>
              Directly add single students or upload spreadsheets to import students in bulk.
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} />
            Bulk Import (.csv/.xlsx)
          </button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />
            Add Student
          </button>
          <button onClick={fetchStudents} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
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
            placeholder="Search student name, department, enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Grid or Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h3 style={{ color: 'hsl(var(--muted))' }}>Loading students database...</h3>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'hsl(var(--muted))' }}>
          No active students found. Click "Add Student" or "Bulk Import" to populate.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Enrollment No</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th style={{ textAlign: 'center' }}>Sem</th>
                <th>Password</th>
                <th>Date Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.enrollment_number}</td>
                  <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td>{s.mobile_number}</td>
                  <td>{s.department}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-low">{s.semester}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{s.raw_password || 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(s.id, s.full_name)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                      title="Delete Student"
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

      {showForm && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', alignSelf: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Student</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Enrollment Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 22BCA2099"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Amit Patel"
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
                  placeholder="e.g. amit@ljcca.edu"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  {propDepartment ? (
                    <input type="text" className="form-control" value={propDepartment} readOnly />
                  ) : (
                    <select
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select Dept</option>
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    className="form-control"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  >
                    <option value="">Select Sem</option>
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Login Password</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Set login password for student"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  <Save size={16} />
                  {submitting ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', alignSelf: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="hsl(var(--primary))" />
                Spreadsheet Bulk Import (.csv / .xlsx)
              </h3>
              <button onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedStudents([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}>
                <X size={20} />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', backgroundColor: 'hsl(var(--secondary) / 0.3)', border: '1px dashed hsl(var(--primary) / 0.4)', marginBottom: '1.5rem' }}>
              <AlertCircle size={22} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Column Mapping Instructions</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', lineHeight: '1.4' }}>
                  Your sheet must contain the following headers: <strong>Enrollment Number, Full Name, Email, Mobile Number, Semester</strong>. 
                  {!propDepartment && <span> You should also include a <strong>Department</strong> column (e.g. BCA, BBA).</span>} 
                  &nbsp;If a <strong>Password</strong> column is omitted, the default password <code>student123</code> is assigned.
                </p>
                <button onClick={downloadSampleCSV} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={12} />
                  Download Sample CSV
                </button>
              </div>
            </div>

            {/* File Pick Container */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem', 
              marginBottom: '1.5rem', 
              border: '2px dashed hsl(var(--border))', 
              borderRadius: '8px', 
              padding: '2.5rem 1.5rem', 
              backgroundColor: 'hsl(var(--secondary) / 0.15)' 
            }}>
              <Upload size={36} style={{ color: 'hsl(var(--primary))', marginBottom: '0.25rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))' }}>
                Select student list spreadsheet file
              </p>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ padding: '0.5rem', maxWidth: '350px', width: '100%', cursor: 'pointer', textAlign: 'center' }}
              />
            </div>

            {/* Spreadsheet Row Previews */}
            {parsingFile ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h4 style={{ color: 'hsl(var(--muted))' }}>Parsing sheet file...</h4>
              </div>
            ) : parsedStudents.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground))' }}>Roster Preview ({parsedStudents.length} Students)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Verify columns before importing</span>
                </div>
                
                <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid hsl(var(--border) / 0.8)' }}>
                  <table style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Enrollment</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Dept</th>
                        <th style={{ textAlign: 'center' }}>Sem</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedStudents.map((s, idx) => {
                        const isRowInvalid = !s.fullName || !s.email || !s.mobileNumber || !s.department || !s.semester || !s.enrollmentNumber;
                        return (
                          <tr key={idx} style={{ backgroundColor: isRowInvalid ? 'hsl(var(--danger) / 0.05)' : 'inherit' }}>
                            <td style={{ fontWeight: 700 }}>
                              {s.enrollmentNumber ? s.enrollmentNumber : <span style={{ color: 'hsl(var(--danger))', fontWeight: 600 }}>Missing</span>}
                            </td>
                            <td>{s.fullName ? s.fullName : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{s.email ? s.email : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{s.mobileNumber ? s.mobileNumber : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{s.department ? s.department : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td style={{ textAlign: 'center' }}>{s.semester ? s.semester : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{s.password}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                  <button type="button" onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedStudents([]); }} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="button" onClick={handleBulkImport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} />
                    Confirm Bulk Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
