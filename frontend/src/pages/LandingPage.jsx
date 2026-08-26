import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  BookOpen, Users, Award, ShieldCheck, Megaphone,
  Download, Upload, ChevronRight, CheckCircle,
  HelpCircle, Layers, Activity, FileText, ArrowRight,
  Sparkles, Check, Globe, Zap, Smartphone, X, Bell, GraduationCap
} from 'lucide-react';

const CountUp = ({ end, duration = 2000, suffix = "", isFloat = false }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return <>{isFloat ? count.toFixed(1) : Math.floor(count).toLocaleString()}{suffix}</>;
};

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({ students: 5000, faculty: 120, materials: 1500, uptime: 99.9 });
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      // Direct user / trigger install
      alert('To install the app, click the install/download icon in your browser address bar or select "Install App" from browser menu.');
    }
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/public/stats')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.students === 'number') {
          setStats(data);
        }
      })
      .catch(err => console.error('Failed to load stats', err));
  }, []);


  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const departments = [
    { name: 'Computer Engineering', code: 'CE', desc: 'Focuses on software engineering, cloud architecture, AI systems, and computer networking.' },
    { name: 'Information Technology', code: 'IT', desc: 'Concentrates on database management, cybersecurity, web applications, and data analytics.' },
    { name: 'Civil Engineering', code: 'Civil', desc: 'Deals with planning, designing, and constructing sustainable modern infrastructure.' },
    { name: 'Mechanical Engineering', code: 'Mech', desc: 'Covers thermodynamics, fluid dynamics, mechanical design, and robotics.' },
    { name: 'Electrical Engineering', code: 'EE', desc: 'Emphasizes smart power systems, signal processing, and electrical machinery.' },
    { name: 'Science & Humanities', code: 'S&H', desc: 'Provides foundational sciences in physics, mathematics, chemistry, and communication.' }
  ];

  const features = {
    student: [
      { icon: <Download size={24} />, title: 'Download Study Material', desc: 'Instantly download unit-wise PDFs, PPTs, and code materials uploaded directly by your professors with 1-click access.' },
      { icon: <Megaphone size={24} />, title: 'Immediate Broadcasts', desc: 'Receive high-priority announcements, exam notices, and urgent college alerts straight on your dashboard.' },
      { icon: <Activity size={24} />, title: 'Personalized Smart Feed', desc: 'See notifications dynamically tailored to your department, semester, and registered subjects in real time.' }
    ],
    faculty: [
      { icon: <Upload size={24} />, title: 'Upload Notes & Syllabus', desc: 'Easily drag and drop course documents, syllabi, and notes categorized by subject and academic unit.' },
      { icon: <Users size={24} />, title: 'Engagement Insights', desc: 'Monitor how many students have accessed and downloaded your lecture materials to track student progress.' },
      { icon: <FileText size={24} />, title: 'Notify Classes Instantly', desc: 'Trigger instant notifications automatically to all students in your department when new lectures or notes go live.' }
    ],
    admin: [
      { icon: <ShieldCheck size={24} />, title: 'Role-Based Access Control', desc: 'Verify, approve, or manage registration requests for faculty and students securely with audit history.' },
      { icon: <Layers size={24} />, title: 'Departments & Sub-Admins', desc: 'Quickly organize academic departments, manage subject hierarchies, and assign sub-admin responsibilities.' },
      { icon: <Award size={24} />, title: 'Campus Broadcast Hub', desc: 'Designate announcements as High, Medium, or Low priority with optional file attachments and live feeds.' }
    ]
  };

  const faqs = [
    { q: 'How do I register for the portal?', a: 'Students and Faculty members can register via the Join link. Once submitted, your registration request goes to the Admin for approval. You will receive access once the admin verifies your details.' },
    { q: 'What types of file formats are supported for notes?', a: 'Faculty members can upload PDF, Word documents, PowerPoint slides, Excel spreadsheets, and ZIP archives. The max file upload limit is 10MB.' },
    { q: 'How will I receive notifications about new notes?', a: 'Once a faculty member uploads new notes for your department and semester, a notification is immediately dispatched to your account. You will see a notification badge in the navbar.' },
    { q: 'Can I change my registered department after sign up?', a: 'To maintain database integrity, you cannot change your department directly. You will need to contact the administrator at admin@edumark.com to adjust your profile.' }
  ];

  return (
    <div className="landing-page animate-fade-in" style={{ position: 'relative', overflowX: 'hidden' }}>

      {/* Futuristic Glowing Ambient Orbs */}
      <div className="abstract-blob blob-orb-1 animate-orb-pulse"></div>
      <div className="abstract-blob blob-orb-2 animate-orb-pulse delay-2"></div>
      <div className="abstract-blob blob-orb-3 animate-orb-pulse delay-4"></div>

      {/* Install App Floating Screen Bottom Banner (strictly on Landing Page) */}
      {showInstallBanner && createPortal(
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2.5rem)',
          maxWidth: '720px',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}>
          <div className="animate-fade-in-up" style={{
            background: 'linear-gradient(135deg, #001f3f 0%, #001224 100%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '16px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
              {/* Compact yellow rounded square icon badge */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)'
              }}>
                <GraduationCap size={22} strokeWidth={2.2} />
              </div>

              {/* Compact Text */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Install Smart Attendance App
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Install as an app for fast offline access & native experience.
                </div>
              </div>
            </div>

            {/* Actions: Compact Install button + Close cross */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
              <button
                onClick={handleInstallClick}
                className="btn btn-primary pulse-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 1.15rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                <Download size={15} />
                Install App
              </button>

              <button
                onClick={() => setShowInstallBanner(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}



      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative', zIndex: 2 }}>

        <div className="container hero-container">
          
          {/* Left Text Column */}
          <div className="hero-content animate-fade-in-up delay-1">
            <div className="edumark-badge">
              <Sparkles size={16} className="spin-slow" style={{ color: '#f59e0b' }} />
              <span>Next-Gen Academic & Classroom Ecosystem</span>
            </div>

            <h1 className="hero-title">
              Streamlining Learning &amp; Collaboration for <br />
              <span className="gradient-text animate-gradient-text">Edumark Campus</span>
            </h1>

            <p className="hero-subtitle">
              The unified digital platform for universities and colleges to share study materials, broadcast live announcements, and empower students and faculty with seamless cloud access.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student'} className="btn btn-primary btn-lg pulse-primary">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary btn-lg pulse-primary">
                    Access Portal <ArrowRight size={20} />
                  </Link>
                  <Link to="/register" className="btn btn-secondary btn-lg">
                    Request Registration
                  </Link>
                </>
              )}
            </div>

            {/* Trust Marks */}
            <div className="trust-marks">
              <span className="trust-item">
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Instant Cloud Downloads</span>
              </span>
              <span className="trust-item">
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Live Broadcasts</span>
              </span>
              <span className="trust-item">
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Verified Faculty Notes</span>
              </span>
            </div>
          </div>

          {/* Right Visual Floating Showcase Cards */}
          <div className="hero-visual-content animate-fade-in-up delay-2">
            <div className="glowing-center-orb animate-orb-pulse"></div>

            {/* Floating Card 1: Active Lecture Stream */}
            <div className="glass-panel animate-float shimmer-wrapper hero-floating-card hero-card-1">
              <div className="card-mini-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} style={{ color: '#f59e0b' }} />
                  <span>Active Lecture Unit</span>
                </div>
                <span className="live-ping-container">
                  <span className="live-ping-ring"></span>
                  <span className="live-ping-dot"></span>
                </span>
              </div>
              <div className="card-mini-title">Full Stack Web Engineering - CE501</div>
              <div className="card-mini-data">
                <span className="data-label">Unit 3: REST API & Cloud Auth</span>
                <span className="data-value" style={{ color: '#f59e0b' }}>PDF • 4.2 MB</span>
              </div>
              <div className="mock-progress-bar" style={{ marginTop: '10px' }}>
                <div className="mock-progress" style={{ width: '92%' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Prof. K. Patel • Computer Eng.</span>
                <span className="mini-badge-success">Verified Note</span>
              </div>
            </div>

            {/* Floating Card 2: Instant Broadcast & Cloud Sync */}
            <div className="glass-panel animate-float-delayed shimmer-wrapper hero-floating-card hero-card-2">
              <div className="card-mini-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} style={{ color: '#10b981' }} />
                  <span>Cloud Synchronization</span>
                </div>
                <span className="live-ping-container">
                  <span className="live-ping-ring" style={{ backgroundColor: '#10b981' }}></span>
                  <span className="live-ping-dot" style={{ backgroundColor: '#10b981' }}></span>
                </span>
              </div>
              <div className="card-mini-title">Real-Time Database Sync</div>
              <div className="card-mini-data">
                <span className="data-label">Latency / Uptime</span>
                <span className="data-value" style={{ color: '#10b981' }}>99.9% Online (&lt; 20ms)</span>
              </div>
            </div>

            {/* Floating Card 3: Priority Notification Alert */}
            <div className="glass-panel animate-float-reverse shimmer-wrapper hero-floating-card hero-card-3">
              <div className="card-mini-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={18} style={{ color: '#38bdf8' }} />
                  <span>Urgent Broadcast</span>
                </div>
                <span className="mini-badge" style={{ marginLeft: 'auto' }}>High Priority</span>
              </div>
              <div className="card-mini-title">Mid-Semester Exam Schedule & Syllabus</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span className="mini-badge">All Departments</span>
                <span className="mini-badge-success">Official Announcement</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Stats Banner */}
      <section id="stats" className="stats-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="glass-panel shimmer-wrapper stats-banner animate-fade-in-up delay-3">
            <div className="stat-box stat-box-hover">
              <div className="stat-num stat-num-glow">
                <CountUp end={stats.students} suffix={stats.students > 1000 ? "+" : ""} />
              </div>
              <div className="stat-desc">Active Students</div>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-box stat-box-hover">
              <div className="stat-num stat-num-glow">
                <CountUp end={stats.faculty} suffix={stats.faculty > 100 ? "+" : ""} />
              </div>
              <div className="stat-desc">Expert Faculty</div>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-box stat-box-hover">
              <div className="stat-num stat-num-glow">
                <CountUp end={stats.materials} suffix={stats.materials > 1000 ? "+" : ""} />
              </div>
              <div className="stat-desc">Lecture Notes Shared</div>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-box stat-box-hover">
              <div className="stat-num stat-num-glow">
                <CountUp end={stats.uptime} isFloat={true} suffix="%" />
              </div>
              <div className="stat-desc">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps Section (How It Works) */}
      <section id="how-it-works" className="how-it-works-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2 className="section-title">How Edumark Works in 3 Simple Steps</h2>
            <p className="section-subtitle">A seamless pipeline designed for fast notes distribution and instant student notifications.</p>
          </div>

          <div className="steps-grid">
            <div className="step-item glass-panel feature-card-hover shimmer-wrapper">
              <div className="step-icon-wrapper step-icon-glow">1</div>
              <h3 className="step-title">Faculty Uploads Notes</h3>
              <p className="step-desc">Professors upload lecture PDFs, PPT slides, and syllabus files categorized by subject and unit.</p>
            </div>

            <div className="step-connector"></div>

            <div className="step-item glass-panel feature-card-hover shimmer-wrapper">
              <div className="step-icon-wrapper step-icon-glow" style={{ animationDelay: '1s' }}>2</div>
              <h3 className="step-title">Instant Broadcast</h3>
              <p className="step-desc">Students in that department and semester automatically receive an instant notification badge and alert.</p>
            </div>

            <div className="step-connector"></div>

            <div className="step-item glass-panel feature-card-hover shimmer-wrapper">
              <div className="step-icon-wrapper step-icon-glow" style={{ animationDelay: '2s' }}>3</div>
              <h3 className="step-title">1-Click Study Download</h3>
              <p className="step-desc">Students access their personalized portal on desktop or mobile and download study files instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2 className="section-title">Designed for Every Campus Role</h2>
            <p className="section-subtitle">A unified system offering dedicated workspaces for students, faculty, and administrators.</p>
          </div>

          <div className="features-tabs-wrapper">
            <div className="features-tabs glass-panel">
              <button
                className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => setActiveTab('student')}
              >
                <Users size={18} /> Students
              </button>
              <button
                className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
                onClick={() => setActiveTab('faculty')}
              >
                <BookOpen size={18} /> Faculty Members
              </button>
              <button
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldCheck size={18} /> Portal Admins
              </button>
            </div>

            <div className="features-content-grid">
              {features[activeTab].map((feat, index) => (
                <div key={index} className="glass-panel feature-card feature-card-hover shimmer-wrapper">
                  <div className="feature-icon-wrapper">
                    {feat.icon}
                  </div>
                  <h3 className="feature-card-title">{feat.title}</h3>
                  <p className="feature-card-desc">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="departments-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2 className="section-title">Supported Academic Departments</h2>
            <p className="section-subtitle">Explore notes and announcements filtered dynamically across all engineering and science departments.</p>
          </div>

          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div key={index} className="glass-panel dept-card feature-card-hover shimmer-wrapper">
                <div className="dept-badge">{dept.code}</div>
                <h3 className="dept-name">{dept.name}</h3>
                <p className="dept-desc">{dept.desc}</p>
                <div className="dept-footer">
                  <span className="dept-link">
                    Explore Department <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container faq-container">
          <div className="faq-intro">
            <div className="faq-intro-icon-box step-icon-glow">
              <HelpCircle size={32} style={{ color: '#001b3d' }} />
            </div>
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Have questions about using the classroom portal? Browse through quick answers below or contact our administrator desk.
            </p>
            <div className="glass-panel faq-support-card shimmer-wrapper">
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem', color: '#fff' }}>Need Assistance?</div>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                For account verification, password resets, or department edits, get in touch directly.
              </p>
              <a href="mailto:admin@edumark.com" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Email Admin Support
              </a>
            </div>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, index) => (
              <div key={index} className={`glass-panel faq-item shimmer-wrapper ${openFaq === index ? 'open' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  <ChevronRight size={20} className="faq-chevron" />
                </div>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus CTA Section */}
      <section className="cta-banner-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="glass-panel shimmer-wrapper cta-banner-card">
            <div className="cta-banner-content">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800 }}>Join the Edumark Digital Community</h2>
              <p style={{ color: '#e2e8f0', fontSize: '1.1rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Sign up now to access verified notes, official campus updates, and assignments tailored to your courses.
              </p>
            </div>
            <div className="cta-banner-actions">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student'} className="btn btn-primary btn-lg pulse-primary">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg pulse-primary">
                    Create Account <ArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Access Portal
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="landing-footer" style={{ position: 'relative', zIndex: 2 }}>
        <div className="container footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '12px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.8rem', height: '2.8rem', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#001b3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                <span style={{ color: 'white' }}>Edu</span><span style={{ color: '#f59e0b' }}>Mark</span>
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Edumark classroom system streamlines notes downloads, syllabus sharing, and official notifications for students and faculty across all college departments.
            </p>
          </div>
          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <a href="/#features">Features</a>
            <a href="/#stats">Statistics</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#departments">Departments</a>
            <a href="/#faq">FAQs</a>
          </div>
          <div className="footer-links-col">
            <h4>Portal Access</h4>
            <Link to="/login">Account Login</Link>
            <Link to="/register">Register Profile</Link>
            <a href="mailto:admin@edumark.com">Admin Desk</a>
          </div>
          <div className="footer-links-col">
            <h4>Campus Address</h4>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              LJ University Campus, S.G. Road, Ahmedabad, Gujarat 382210
            </p>
          </div>
        </div>
        <div className="container footer-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
          <p>© {new Date().getFullYear()} Edumark System. All rights reserved.</p>
          <p style={{ fontSize: '0.95rem', color: '#f59e0b', textAlign: 'center', marginTop: '0.25rem' }}>
            Built &amp; Designed with Modern Academic Architecture
          </p>
        </div>
      </footer>

      {/* High-End Component Scoped Styles & Animations */}
      <style>{`
        /* Ambient Blobs */
        .abstract-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          z-index: 1;
          pointer-events: none;
        }

        .blob-orb-1 {
          top: -8%;
          left: -6%;
          width: 55vw;
          height: 55vw;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0, 59, 122, 0.2) 50%, transparent 70%);
        }

        .blob-orb-2 {
          top: 35%;
          right: -8%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(0, 37, 75, 0.2) 50%, transparent 70%);
        }

        .blob-orb-3 {
          bottom: -5%;
          left: 20%;
          width: 45vw;
          height: 45vw;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%);
        }

        /* Hero Section */
        .hero-section {
          padding: 6.5rem 0 5rem 0;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3.5rem;
          align-items: center;
        }

        .edumark-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          margin-bottom: 1.8rem;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
        }

        .hero-title {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
          color: #ffffff;
        }

        .gradient-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #38bdf8 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: #94a3b8;
          line-height: 1.65;
          margin-bottom: 2.2rem;
          max-width: 600px;
        }

        .hero-actions {
          display: flex;
          gap: 1.2rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .btn-lg {
          padding: 0.95rem 2rem;
          font-size: 1.05rem;
          font-weight: 700;
          border-radius: 99px;
        }

        .trust-marks {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          font-size: 0.88rem;
          color: #cbd5e1;
          margin-top: 0.5rem;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Hero Floating Cards Showcase */
        .hero-visual-content {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 10px 0;
        }

        .glowing-center-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 70%);
          border-radius: 50%;
          z-index: 1;
          pointer-events: none;
        }

        .hero-floating-card {
          position: relative;
          z-index: 2;
          padding: 22px 24px;
          border-radius: 16px;
        }

        .hero-card-1 {
          border-color: rgba(245, 158, 11, 0.35) !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.15) !important;
        }

        .hero-card-2 {
          border-color: rgba(16, 185, 129, 0.35) !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.15) !important;
          margin-left: 20px;
        }

        .hero-card-3 {
          border-color: rgba(56, 189, 248, 0.35) !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15) !important;
        }

        .card-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .card-mini-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .card-mini-data {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .data-label {
          font-size: 0.84rem;
          color: #94a3b8;
        }

        .data-value {
          font-size: 0.88rem;
          font-weight: 700;
          color: #ffffff;
        }

        .mini-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        .mini-badge-success {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .mock-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .mock-progress {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          border-radius: 3px;
        }

        /* Stats Section */
        .stats-section {
          padding: 3rem 0 4rem 0;
        }

        .stats-banner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 34px 28px;
          border-radius: 20px !important;
          flex-wrap: wrap;
          gap: 20px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 160px;
        }

        .stat-num {
          font-size: 2.5rem;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: -0.02em;
          transition: text-shadow 0.3s;
        }

        .stat-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .stat-divider {
          width: 1px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* How It Works (Steps) */
        .how-it-works-section {
          padding: 5rem 0;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 1.5rem;
          align-items: center;
          margin-top: 3.5rem;
        }

        .step-item {
          padding: 36px 28px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          border-radius: 18px;
          height: 100%;
        }

        .step-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.45rem;
          font-weight: 800;
          color: #001b3d;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }

        .step-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
        }

        .step-desc {
          font-size: 0.92rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        .step-connector {
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.8), rgba(56, 189, 248, 0.8));
          opacity: 0.4;
        }

        /* Features Section */
        .features-section {
          padding: 5rem 0;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 3rem auto;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.85rem;
          color: #ffffff;
        }

        .section-subtitle {
          color: #94a3b8;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        .features-tabs-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }

        .features-tabs {
          display: flex;
          padding: 6px;
          border-radius: 14px;
          gap: 8px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border: none;
          background: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.25s;
        }

        .tab-btn:hover {
          color: #ffffff;
        }

        .tab-btn.active {
          background: rgba(245, 158, 11, 0.2) !important;
          color: #f59e0b !important;
          border: 1px solid rgba(245, 158, 11, 0.45) !important;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2) !important;
        }

        .features-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          width: 100%;
        }

        .feature-card {
          padding: 32px 28px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .feature-icon-wrapper {
          width: 3.4rem;
          height: 3.4rem;
          border-radius: 14px;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(245, 158, 11, 0.3);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #ffffff;
        }

        .feature-card-desc {
          font-size: 0.92rem;
          color: #94a3b8;
          line-height: 1.65;
        }

        /* Departments */
        .departments-section {
          padding: 5rem 0;
        }

        .departments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .dept-card {
          padding: 28px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .dept-badge {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          width: fit-content;
          margin-bottom: 1.2rem;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .dept-name {
          font-size: 1.25rem;
          font-weight: 750;
          margin-bottom: 0.6rem;
          color: #ffffff;
        }

        .dept-desc {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 1.8rem;
          flex-grow: 1;
        }

        .dept-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.2rem;
        }

        .dept-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f59e0b;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: gap 0.2s;
        }

        .dept-link:hover {
          gap: 8px;
        }

        /* FAQ Section */
        .faq-section {
          padding: 5rem 0;
        }

        .faq-container {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 4rem;
        }

        .faq-intro-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .faq-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .faq-subtitle {
          color: #94a3b8;
          line-height: 1.65;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .faq-support-card {
          padding: 24px;
          border-radius: 16px;
        }

        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .faq-item {
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-question {
          padding: 1.4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 1.02rem;
          color: #ffffff;
          cursor: pointer;
          user-select: none;
        }

        .faq-chevron {
          transition: transform 0.3s;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0, 1, 0, 1), padding 0.35s;
          padding: 0 1.4rem;
          font-size: 0.92rem;
          color: #94a3b8;
          line-height: 1.65;
        }

        .faq-item.open .faq-chevron {
          transform: rotate(90deg);
          color: #f59e0b;
        }

        .faq-item.open .faq-answer {
          max-height: 250px;
          padding: 0 1.4rem 1.4rem 1.4rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1rem;
        }

        /* CTA Banner */
        .cta-banner-section {
          padding: 3rem 0 6rem 0;
        }

        .cta-banner-card {
          border-radius: 24px;
          padding: 4rem 3.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3rem;
          border-color: rgba(245, 158, 11, 0.3) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.2) !important;
        }

        .cta-banner-actions {
          display: flex;
          gap: 1.2rem;
          flex-shrink: 0;
        }

        /* Footer */
        .landing-footer {
          padding: 4.5rem 0 2rem 0;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.6fr repeat(3, 1fr);
          gap: 3rem;
          margin-bottom: 3.5rem;
        }

        .footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .footer-links-col h4 {
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .footer-links-col a {
          font-size: 0.9rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links-col a:hover {
          color: #f59e0b;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.8rem;
          font-size: 0.85rem;
          color: #64748b;
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3.5rem;
          }

          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hero-actions {
            justify-content: center;
          }

          .trust-marks {
            justify-content: center;
          }

          .hero-card-2 {
            margin-left: 0;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .step-connector {
            display: none;
          }

          .faq-container {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }

          .cta-banner-card {
            flex-direction: column;
            text-align: center;
            padding: 3rem 2rem;
          }

          .cta-banner-actions {
            justify-content: center;
            width: 100%;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 4.5rem 0 3rem 0;
          }

          .hero-title {
            font-size: 2.2rem;
          }

          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .hero-actions .btn {
            width: 100%;
          }

          .stats-banner {
            padding: 24px 16px;
            gap: 24px;
          }

          .stat-divider {
            display: none;
          }

          .stat-box {
            min-width: 130px;
          }

          .stat-num {
            font-size: 2rem;
          }

          .features-tabs {
            flex-direction: column;
            width: 100%;
          }

          .tab-btn {
            justify-content: center;
            width: 100%;
          }

          .cta-banner-actions {
            flex-direction: column;
          }

          .cta-banner-actions .btn {
            width: 100%;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
