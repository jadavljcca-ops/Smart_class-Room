import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, User, Mail, Phone, Lock, School, GraduationCap, Briefcase, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [isBlinking, setIsBlinking] = useState(false);

  const handleRoleChange = (newRole) => {
    if (newRole !== role) {
      setRole(newRole);
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 1000);
    }
  };
  
  // State variables
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('1'); // Students only
  const [enrollmentNumber, setEnrollmentNumber] = useState(''); // Students only
  const [employeeId, setEmployeeId] = useState(''); // Faculty only
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch(err => console.error('Error loading departments:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validations
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    const payload = {
      role,
      fullName,
      email,
      mobileNumber,
      department,
      password,
      ...(role === 'student' ? { semester, enrollmentNumber } : { employeeId })
    };

    setSubmitting(true);
    try {
      const message = await register(payload);
      // Successful registration
      showToast(message, 'success');
      
      // Delay navigation slightly so user reads the toast or redirect immediately to login where they see approval instructions
      alert(`Registration Sent!\n\nYour registration request has been sent to the Main Admin. You can log in only after approval.`);
      navigate('/login');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="auth-wrapper">
      <div className={`auth-card animate-fade-in ${isBlinking ? 'blink-animation' : ''}`} style={{ maxWidth: '540px', padding: '2rem 1.75rem' }}>
        <div className="auth-header" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="LJ Logo" className="logo-img" style={{ width: '4.2rem', height: '4.2rem', marginBottom: '0.6rem', objectFit: 'contain' }} />
          <div className="auth-logo" style={{ fontSize: '1.5rem', fontWeight: 800 }}>LJ CCA Class Room</div>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
            Register as a Student or Faculty member
          </p>
        </div>

        {/* Role Tabs */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            Student Registration
          </div>
          <div 
            className={`auth-tab ${role === 'faculty' ? 'active' : ''}`}
            onClick={() => handleRoleChange('faculty')}
          >
            Faculty Registration
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Firstname Lastname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="name@ljcca.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <Phone size={16} />
              </span>
              <input
                type="tel"
                className="form-control"
                placeholder="10 digit mobile number"
                pattern="[0-9]{10}"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Department</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                <School size={16} />
              </span>
              <select
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Fields */}
          {role === 'student' && (
            <div className="auth-row-grid grid-sem-enroll">
              <div className="form-group">
                <label className="form-label">Semester</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                    <GraduationCap size={16} />
                  </span>
                  <select
                    className="form-control"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    style={{ paddingLeft: '2.2rem' }}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Enrollment Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. LJ20261012"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Faculty Fields */}
          {role === 'faculty' && (
            <div className="form-group">
              <label className="form-label">Faculty ID</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                  <Briefcase size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FAC4029"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Passwords */}
          <div className="auth-row-grid grid-passwords">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--muted))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }}>
                  <Lock size={14} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--muted))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting Request...' : (
              <>
                <UserPlus size={18} />
                Register Request
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'hsl(var(--muted))' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'none' }}>
            Login here
          </Link>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid hsl(var(--border) / 0.6)', paddingTop: '1.25rem' }}>
          <Link to="/" style={{ color: 'hsl(var(--muted))', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }} className="hover-text-primary">
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
