import { confirmDelete } from '../../utils/alerts';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, X, Save, RefreshCw, UserPlus, Eye, EyeOff, ArrowLeft, Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function FacultyManagement({ department: propDepartment, insideModal }) {
  const { authFetch, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Bulk Upload Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedFaculty, setParsedFaculty] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  
  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null for adding, ID for editing
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaculty = async (showSpinner = true) => {
    if (showSpinner && faculty.length === 0) setLoading(true);
    try {
      const url = propDepartment ? `/admin/faculty?department=${propDepartment}` : '/admin/faculty';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setFaculty(data);
        setSelectedIds(new Set()); // Reset selection on reload
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
    setDepartment(propDepartment || '');
    setShowForm(true);
  };

  const openEditModal = (f) => {
    setEditingId(f.id);
    setFullName(f.full_name);
    setEmail(f.email);
    setMobileNumber(f.mobile_number);
    setDepartment(f.department);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !mobileNumber || !department) {
      showToast('Please fill all fields.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      showToast('Mobile Number must be exactly 10 digits.', 'warning');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      showToast('Invalid Gmail. Please use a valid @gmail.com address.', 'warning');
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
      employeeId: mobileNumber,
      ...(isEditing ? {} : { password: mobileNumber })
    };

    setIsSubmitting(true);
    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Faculty account saved successfully!', 'success');
        setShowForm(false);
        fetchFaculty(false); // Reload list silently
      } else {
        showToast(data.message || 'Failed to save faculty.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving faculty data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmDelete({ 
      entityName: 'record', 
      customText: 'Are you sure you want to delete this faculty member permanently? All notes uploaded by them will also be deleted.' 
    });
    if (!isConfirmed) return;

    try {
      const res = await authFetch(`/admin/faculty/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Faculty deleted successfully.', 'success');
        setFaculty((prev) => prev.filter((f) => f.id !== id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        showToast(data.message || 'Failed to delete faculty.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting faculty.', 'error');
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
    if (selectedIds.size === filteredFaculty.length && filteredFaculty.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFaculty.map(f => f.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirmDelete({
      entityName: 'records',
      customText: `Are you sure you want to permanently delete ${selectedIds.size} selected faculty member(s)? All their uploaded notes will also be deleted.`
    });
    if (!isConfirmed) return;

    setBulkDeleting(true);
    try {
      const res = await authFetch('/admin/faculty/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Selected faculty deleted.', 'success');
        fetchFaculty(false);
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
    setParsedFaculty([]);

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
      const empId = getVal(['employeeid', 'employee id', 'empid', 'emp id', 'employee_id']) || mobile;
      return {
        fullName: getVal(['fullname', 'name', 'facultyname', 'full name', 'faculty name']),
        email: getVal(['email', 'emailaddress', 'email address']),
        mobileNumber: mobile,
        department: getVal(['department', 'dept', 'departments']) || defaultDept,
        employeeId: empId,
        password: mobile
      };
    });

    // Filter out rows that are entirely or mostly empty
    const validRows = formatted.filter(f => 
      (f.fullName && f.fullName.toString().trim() !== '') || 
      (f.email && f.email.toString().trim() !== '') || 
      (f.mobileNumber && f.mobileNumber.toString().trim() !== '')
    );

    setParsedFaculty(validRows);
    showToast(`Parsed ${validRows.length} faculty members from spreadsheet!`, 'success');
  };

  const handleBulkImport = async () => {
    if (parsedFaculty.length === 0) {
      showToast('No parsed faculty to import.', 'warning');
      return;
    }

    // Verify all rows have required fields
    const invalidRows = parsedFaculty.some(f => 
      !f.fullName || !f.email || !f.mobileNumber || !f.department
    );

    if (invalidRows) {
      showToast('Some parsed rows are missing required fields. Please review the preview.', 'error');
      return;
    }

    setParsingFile(true);
    try {
      const res = await authFetch('/admin/faculty/bulk', {
        method: 'POST',
        body: JSON.stringify({ faculty: parsedFaculty })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Import complete!', 'success');
        setShowBulkModal(false);
        setBulkFile(null);
        setParsedFaculty([]);
        fetchFaculty();
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
    const headers = 'Full Name,Email,Mobile Number,Department,Employee ID\n';
    const row1 = `Prof. Rajesh Sharma,rajesh@edumark.com,9876543210,${defaultDept},EMP101\n`;
    const row2 = `Dr. Priya Mehta,priya@edumark.com,9876543211,${defaultDept},EMP102\n`;
    
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'faculty_bulk_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFaculty = faculty.filter((f) => {
    return (
      f.full_name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase())
    );
  });

  const allSelected = filteredFaculty.length > 0 && selectedIds.size === filteredFaculty.length;

  return (
    <div className={insideModal ? '' : "container animate-fade-in"} style={insideModal ? {} : { padding: '0 1.5rem 2rem 1.5rem' }}>
      {/* Header Card — sticky */}

      {!insideModal && (
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
                {propDepartment ? `${propDepartment} ` : ''}Faculty Management
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
                Add, update, or remove approved college faculty members{propDepartment ? ` for ${propDepartment}` : ''}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!propDepartment && (
                <button onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
              )}
              <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={16} />
                Bulk Import (.csv/.xlsx)
              </button>
              <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} />
                Add Faculty
              </button>
              <button onClick={fetchFaculty} className="btn btn-secondary">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}


      
      {/* Modal Actions when inside modal */}
      {insideModal && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} />
            Bulk Import
          </button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />
            Add Faculty
          </button>
          <button onClick={fetchFaculty} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
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
            {selectedIds.size} faculty member{selectedIds.size > 1 ? 's' : ''} selected
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

      {/* Search Filter */}
      <div className="search-controls" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search faculty name, department..."
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
          No faculty members found. Click "Add Faculty" or "Bulk Import" to create one.
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
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Password</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((f) => (
                <tr key={f.id} style={{ backgroundColor: selectedIds.has(f.id) ? 'hsl(var(--danger) / 0.05)' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'hsl(var(--danger))' }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{f.full_name}</td>
                  <td>{f.email}</td>
                  <td>{f.mobile_number}</td>
                  <td>{f.department}</td>
                  <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{f.raw_password || 'N/A'}</td>
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
      {showForm && createPortal(
        <div 
          onClick={() => setShowForm(false)}
          style={{
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
            zIndex: 20000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', alignSelf: 'center', backgroundColor: '#ffffff', color: '#000000', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 60px rgba(0, 40, 85, 0.25)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000000' }}>

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
                  placeholder="e.g. rajesh@gmail.com"
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

              <div className="form-group">
                <label className="form-label">Department</label>
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
                    <option value="">Select Department</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
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
                  disabled={isSubmitting}
                >
                  <Save size={16} />
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Faculty' : 'Create Faculty')}
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
          onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedFaculty([]); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 20000, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in" 
            style={{ width: '100%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', alignSelf: 'center', backgroundColor: '#ffffff', color: '#000000', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 60px rgba(0, 40, 85, 0.25)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                <Upload size={20} color="hsl(var(--primary))" />
                Faculty Spreadsheet Bulk Import (.csv / .xlsx)
              </h3>
              <button onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedFaculty([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted))' }}>
                <X size={20} />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', backgroundColor: 'hsl(var(--secondary) / 0.3)', border: '1px dashed hsl(var(--primary) / 0.4)', marginBottom: '1.5rem' }}>
              <AlertCircle size={22} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Column Mapping Instructions</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', lineHeight: '1.4' }}>
                  Your sheet must contain the following headers: <strong>Full Name, Email, Mobile Number</strong>. 
                  {!propDepartment && <span> You should also include a <strong>Department</strong> column (e.g. BCA, BBA).</span>} 
                  &nbsp;Optional: <strong>Employee ID</strong> (defaults to mobile number). The faculty's Mobile Number will automatically be assigned as their default password.
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
                Select faculty list spreadsheet file
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
            ) : parsedFaculty.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground))' }}>Roster Preview ({parsedFaculty.length} Faculty Members)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Verify columns before importing</span>
                </div>
                
                <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid hsl(var(--border) / 0.8)' }}>
                  <table style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Dept</th>
                        <th>Employee ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedFaculty.map((f, idx) => {
                        const isRowInvalid = !f.fullName || !f.email || !f.mobileNumber || !f.department;
                        return (
                          <tr key={idx} style={{ backgroundColor: isRowInvalid ? 'hsl(var(--danger) / 0.05)' : 'inherit' }}>
                            <td style={{ fontWeight: 700 }}>{f.fullName ? f.fullName : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{f.email ? f.email : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{f.mobileNumber ? f.mobileNumber : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{f.department ? f.department : <span style={{ color: 'hsl(var(--danger))' }}>Missing</span>}</td>
                            <td>{f.employeeId || f.mobileNumber}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                  <button type="button" onClick={() => { setShowBulkModal(false); setBulkFile(null); setParsedFaculty([]); }} className="btn btn-secondary">
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
