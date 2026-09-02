import { confirmDelete } from '../../utils/alerts';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Trash2, X, Save, RefreshCw, Upload, Download, AlertCircle, FileText, CheckCircle, LogOut, Edit, CheckSquare, Square, TrendingUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import PromoteModal from '../../components/Admin/PromoteModal';

export default function StudentsManagement({ department: propDepartment, insideModal = false, onMutation }) {
  const { authFetch, user } = useAuth();
  const { showToast } = useToast();

  const [showPromoteModal, setShowPromoteModal] = useState(false);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterEnrollment, setFilterEnrollment] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Form Modal state (used for both Add and Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk Upload Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);

  const [departments, setDepartments] = useState([]);

  const fetchStudents = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const url = propDepartment ? `/admin/students?department=${propDepartment}` : '/admin/students';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        setSelectedIds(new Set()); // Reset selection on reload
      } else {
        showToast('Failed to load students list.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading students.', 'error');
    } finally {
      if (showSpinner) setLoading(false);
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
    setEditingId(null);
    setEnrollmentNumber('');
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setDepartment(propDepartment || '');
    setSemester('');
    setShowForm(true);
  };

  const openEditModal = (s) => {
    setEditingId(s.id);
    setEnrollmentNumber(s.enrollment_number);
    setFullName(s.full_name);
    setEmail(s.email);
    setMobileNumber(s.mobile_number);
    setDepartment(s.department);
    setSemester(s.semester.toString());
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const targetDept = propDepartment || department;

    if (!fullName || !email || !mobileNumber || !targetDept || !semester || !enrollmentNumber) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      showToast('Mobile Number must be exactly 10 digits.', 'warning');
      return;
    }

    if (!editingId && !/^\d{10}$/.test(enrollmentNumber)) {
      showToast('Enrollment Number must be exactly 10 digits.', 'warning');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      showToast('Invalid Gmail. Please use a valid @gmail.com address.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await authFetch(`/admin/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            fullName,
            email,
            mobileNumber,
            department: targetDept,
            semester,
            enrollmentNumber,
          })
        });
      } else {
        res = await authFetch('/admin/students', {
          method: 'POST',
          body: JSON.stringify({
            fullName,
            email,
            mobileNumber,
            department: targetDept,
            semester,
            enrollmentNumber,
            password: mobileNumber
          })
        });
      }
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || (editingId ? 'Student updated successfully!' : 'Student account created successfully!'), 'success');
        setShowForm(false);
        fetchStudents(false);
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
    const isConfirmed = await confirmDelete({ 
      entityName: 'record', 
      customText: `Are you sure you want to delete "${name}" permanently? All note download history for this student will also be deleted.` 
    });
    if (!isConfirmed) return;

    try {
      const res = await authFetch(`/admin/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Student deleted successfully.', 'success');
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        if (onMutation) onMutation();
      } else {
        showToast(data.message || 'Failed to delete student.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting student.', 'error');
    }
  };

  // --- Multi-select handlers ---
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirmDelete({
      entityName: 'records',
      customText: `Are you sure you want to permanently delete ${selectedIds.size} selected student(s)? This action cannot be undone.`
    });
    if (!isConfirmed) return;

    setBulkDeleting(true);
    try {
      const res = await authFetch('/admin/students/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Selected students deleted.', 'success');
        fetchStudents(false);
        if (onMutation) onMutation();
      } else {
        showToast(data.message || 'Bulk delete failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during bulk delete.', 'error');
    } finally {
      setBulkDeleting(false);
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

      const mobile = getVal(['mobile', 'mobilenumber', 'phone', 'contact', 'mobile number', 'phone number', 'mob']);
      return {
        fullName: getVal(['fullname', 'name', 'studentname', 'full name', 'student name']),
        email: getVal(['email', 'emailaddress', 'email address']),
        mobileNumber: mobile,
        department: getVal(['department', 'dept', 'departments']) || defaultDept,
        semester: getVal(['semester', 'sem']),
        enrollmentNumber: getVal(['enrollment', 'enrollmentnumber', 'enrollments number', 'enrollment no', 'enrollment number', 'enrollments', 'enrollno', 'rollno', 'roll number']),
        password: mobile
      };
    });

    // Filter out rows that are entirely or mostly empty (i.e. no name, email, and enrollment number)
    const validRows = formatted.filter(s => 
      (s.fullName && s.fullName.toString().trim() !== '') || 
      (s.email && s.email.toString().trim() !== '') || 
      (s.enrollmentNumber && s.enrollmentNumber.toString().trim() !== '')
    );

    setParsedStudents(validRows);
    showToast(`Parsed ${validRows.length} students from spreadsheet!`, 'success');
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

  const handleForceLogoutAll = async () => {
    const targetDeptName = propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : 'All');
    const msg = targetDeptName === 'All'
      ? "Are you sure you want to force logout ALL students across all departments? They will be prompted to log in again."
      : `Are you sure you want to force logout all students in the ${targetDeptName} department? They will be prompted to log in again.`;

    const isConfirmed = await confirmDelete({ 
      entityName: 'record', 
      customText: msg 
    });
    if (!isConfirmed) return;

    try {
      const res = await authFetch('/admin/students/logout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: targetDeptName })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'All students logged out successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to logout students.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during force logout.', 'error');
    }
  };

  // Download Sample CSV Helper
  const downloadSampleCSV = () => {
    const defaultDept = propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : 'BCA');
    const headers = 'Enrollment Number,Full Name,Email,Mobile Number,Department,Semester\n';
    const row1 = `22BCA2001,Amit Patel,amit@edumark.com,9876543210,${defaultDept},3\n`;
    const row2 = `22BCA2002,Neha Shah,neha@edumark.com,9876543211,${defaultDept},3\n`;
    
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'students_bulk_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    const matchName = !filterName || s.full_name.toLowerCase().includes(filterName.toLowerCase());
    const matchEnrollment = !filterEnrollment || s.enrollment_number.toLowerCase().includes(filterEnrollment.toLowerCase());
    const matchDept = !filterDept || s.department.toLowerCase() === filterDept.toLowerCase();
    const matchSem = !filterSem || s.semester.toString() === filterSem.toString();
    
    return matchName && matchEnrollment && matchDept && matchSem;
  });

  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

  return (
    <div className={insideModal ? "animate-fade-in" : "container animate-fade-in"} style={insideModal ? { padding: 0 } : { padding: '0 1.5rem 2rem 1.5rem' }}>
      {/* Header Card — sticky */}

      {!insideModal ? (
        <div className="sticky-header-wrapper">
          <div className="admin-header-card" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem',
            background: 'linear-gradient(135deg, #002d62 0%, #001f3f 100%)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '20px', padding: '22px 28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
          }}>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {propDepartment ? `${propDepartment} ` : ''}Students Management
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
                Add, edit, delete, or upload student rosters to manage student accounts{propDepartment ? ` in ${propDepartment}` : ''}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {(user?.adminRole === 'main_admin' || user?.adminRole === 'sub_admin') && (
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Promote Students to Next Semester & Archive Sem 8"
                >
                  <TrendingUp size={16} strokeWidth={2.5} />
                  Promote
                </button>
              )}
              <button onClick={handleForceLogoutAll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--danger))', borderColor: 'hsl(var(--danger) / 0.3)' }} title="Forces all students in this scope to log in again next time they try to access the system.">
                <LogOut size={16} />
                {propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : '') ? 'Logout Dept Students' : 'Logout All Students'}
              </button>
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
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.95rem' }}>
              Directly add single students or upload spreadsheets to import students in bulk.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(user?.adminRole === 'main_admin' || user?.adminRole === 'sub_admin') && (
              <button
                type="button"
                onClick={() => setShowPromoteModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Promote Students to Next Semester & Archive Sem 8"
              >
                <TrendingUp size={16} strokeWidth={2.5} />
                Promote
              </button>
            )}
            <button onClick={handleForceLogoutAll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--danger))', borderColor: 'hsl(var(--danger) / 0.3)' }}>
              <LogOut size={16} />
              {propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : '') ? 'Logout Dept Students' : 'Logout All Students'}
            </button>
            <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={16} />
              Bulk Import
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
      )}



      {/* Bulk Delete Bar — shows when items are selected */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'hsl(var(--danger) / 0.08)', border: '1px solid hsl(var(--danger) / 0.3)',
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
          flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <span style={{ fontWeight: 600, color: 'hsl(var(--danger))' }}>
            {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
              Deselect All
            </button>
            <button onClick={handleBulkDelete} className="btn btn-secondary" disabled={bulkDeleting}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'hsl(var(--danger))', borderColor: 'hsl(var(--danger) / 0.4)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Trash2 size={14} />
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.5rem',
        backgroundColor: insideModal ? 'rgba(255, 255, 255, 0.06)' : 'hsl(var(--secondary) / 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        border: insideModal ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid hsl(var(--border) / 0.5)'
      }}>
        {/* Name Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: insideModal ? '#e2e8f0' : 'hsl(var(--muted))', marginBottom: '0.25rem', display: 'block' }}>Student Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search Name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>

        {/* Enrollment Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: insideModal ? '#e2e8f0' : 'hsl(var(--muted))', marginBottom: '0.25rem', display: 'block' }}>Enrollment Number</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search Enrollment..."
            value={filterEnrollment}
            onChange={(e) => setFilterEnrollment(e.target.value)}
          />
        </div>

        {/* Department Filter (Only show if not scoped to a specific department already) */}
        {!(propDepartment || (user?.adminRole !== 'main_admin' ? user?.department : '')) && (
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: insideModal ? '#e2e8f0' : 'hsl(var(--muted))', marginBottom: '0.25rem', display: 'block' }}>Department</label>
            <select
              className="form-control"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}

        {/* Semester Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: insideModal ? '#e2e8f0' : 'hsl(var(--muted))', marginBottom: '0.25rem', display: 'block' }}>Semester</label>
          <select
            className="form-control"
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Sem {sem}</option>
            ))}
          </select>
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
                {/* Select All Checkbox */}
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title={allSelected ? 'Deselect All' : 'Select All'}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'hsl(var(--danger))' }}
                  />
                </th>
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
                <tr key={s.id} style={{ backgroundColor: selectedIds.has(s.id) ? 'hsl(var(--danger) / 0.05)' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'hsl(var(--danger))' }}
                    />
                  </td>
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
                    {formatDate(s.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => openEditModal(s)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--primary))' }}
                        title="Edit Student"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, s.full_name)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'hsl(var(--danger))' }}
                        title="Delete Student"
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

      {/* Add / Edit Student Modal */}
      {showForm && createPortal(
        <div 
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', alignSelf: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingId ? 'Edit Student' : 'Add New Student'}</h3>
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
                  placeholder="10 digit number"
                  maxLength="10"
                  minLength="10"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  readOnly={!!editingId}
                  style={editingId ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                />
                {editingId && <small style={{ color: 'hsl(var(--muted))', fontSize: '0.75rem' }}>Enrollment number cannot be changed.</small>}
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
                  placeholder="e.g. amit@gmail.com"
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
                  maxLength="10"
                  minLength="10"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  <Save size={16} />
                  {submitting ? 'Saving...' : (editingId ? 'Update Student' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && createPortal(
        <div 
          onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedStudents([]); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', alignSelf: 'center' }}
          >
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
                  &nbsp;The student's Mobile Number will automatically be assigned as their default password.
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

      {/* Student Semester Promotion & Sem 8 Graduation Modal */}
      <PromoteModal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        defaultDept={propDepartment || 'All'}
        onSuccess={() => {
          fetchStudents();
          if (onMutation) onMutation();
        }}
      />
    </div>
  );
}
