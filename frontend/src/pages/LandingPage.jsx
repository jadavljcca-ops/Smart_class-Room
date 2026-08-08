import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Users, Award, ShieldCheck, Megaphone,
  Download, Upload, ChevronRight, CheckCircle,
  HelpCircle, Layers, Activity, FileText, ArrowRight, Check
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const departments = [
    { name: 'Computer Engineering', code: 'CE', desc: 'Focuses on software engineering, cloud architecture, and computer networking systems.' },
    { name: 'Information Technology', code: 'IT', desc: 'Concentrates on database management, cybersecurity, web applications, and analytics.' },
    { name: 'Civil Engineering', code: 'Civil', desc: 'Deals with planning, designing, and constructing sustainable infrastructure.' },
    { name: 'Mechanical Engineering', code: 'Mech', desc: 'Covers thermodynamics, fluid dynamics, design, and manufacturing sciences.' },
    { name: 'Electrical Engineering', code: 'EE', desc: 'Emphasizes power systems, electronics, signaling, and electrical machinery.' },
    { name: 'Science & Humanities', code: 'S&H', desc: 'Provides core education in physics, chemistry, mathematics, and professional writing.' }
  ];

  const features = {
    student: [
      { icon: <Download size={22} />, title: 'Download Study Material', desc: 'Instantly download unit-wise PDFs, docx, or PPT materials uploaded directly by your department professors.' },
      { icon: <Megaphone size={22} />, title: 'Immediate Broadcasts', desc: 'Receive high-priority announcements and urgent alerts straight from administration on your dashboard.' },
      { icon: <Activity size={22} />, title: 'Personalized Feed', desc: 'See notifications specifically tailored to your department, semester, and registered courses.' }
    ],
    faculty: [
      { icon: <Upload size={22} />, title: 'Upload Notes & Syllabus', desc: 'Easily drag and drop course documents, notes, and instructions categorized by subject and unit.' },
      { icon: <Users size={22} />, title: 'Download Engagement', desc: 'Track how many students have downloaded your lecture materials to monitor learning progress.' },
      { icon: <FileText size={22} />, title: 'Notify Your Classes', desc: 'Trigger instant notifications automatically to all students in your department when new notes are live.' }
    ],
    admin: [
      { icon: <ShieldCheck size={22} />, title: 'Access Control', desc: 'Verify and approve registration requests for new faculty members and students securely.' },
      { icon: <Layers size={22} />, title: 'Departments Management', desc: 'Quickly set up, rename, or structure college departments and academic boundaries.' },
      { icon: <Award size={22} />, title: 'Broadcasting Hub', desc: 'Designate announcements as High, Medium, or Low priority with optional file attachments.' }
    ]
  };

  const faqs = [
    { q: 'How do I register for the portal?', a: 'Students and Faculty members can register via the Join link. Once submitted, your registration request goes to the Admin for approval. You will receive access once the admin verifies your details.' },
    { q: 'What types of file formats are supported for notes?', a: 'Faculty members can upload PDF, Word documents, Powerpoint slides, Excel spreadsheets, and ZIP archives. The max file upload limit is 10MB.' },
    { q: 'How will I receive notifications about new notes?', a: 'Once a faculty member uploads new notes for your department and semester, a notification is immediately dispatched to your account. You will see a notification badge in the navbar.' },
    { q: 'Can I change my registered department after sign up?', a: 'To maintain database sanity, you cannot change your department directly. You will need to contact the main administrator at admin@edumark.com to adjust your profile.' }
  ];

  return (
    <div className="landing-page animate-fade-in" style={{ overflowX: 'hidden' }}>

      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated background blobs */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <Activity size={14} style={{ color: 'hsl(var(--primary))' }} />
              <span>Next-Gen Academic Hub</span>
            </span>
            <h1 className="hero-title">
              Streamlining Learning & Collaboration for <span className="gradient-text">Edumark</span>
            </h1>
            <p className="hero-subtitle">
              A comprehensive classroom management ecosystem for students, faculty, and administrators. Access lectures notes, syllabus materials, and real-time updates seamlessly.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student'} className="btn btn-primary btn-lg">
                  Go to your Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary btn-lg">
                    Access Portal <ArrowRight size={18} />
                  </Link>
                  <Link to="/register" className="btn btn-secondary btn-lg">
                    Request Registration
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-mockup-wrapper">
            <div className="hero-mockup-glow"></div>
            <div className="hero-mockup-card">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="mockup-title">Edumark Portal Preview</div>
              </div>
              <div className="mockup-body">
                {/* Mock Note Card */}
                <div className="mock-card">
                  <div className="mock-card-header">
                    <div className="mock-icon-bg">
                      <BookOpen size={18} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <div>
                      <div className="mock-title">Full Stack Web Development</div>
                      <div className="mock-subtitle">Unit 3: REST API Design & CRUD</div>
                    </div>
                  </div>
                  <div className="mock-details">
                    <span>PDF Document • 4.2 MB</span>
                    <span className="mock-badge">Verified Note</span>
                  </div>
                  <div className="mock-progress-bar">
                    <div className="mock-progress" style={{ width: '85%' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))' }}>Uploaded by Prof. K. Patel</span>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }} disabled>
                      Download
                    </button>
                  </div>
                </div>

                {/* Mock Announcement Card */}
                <div className="mock-card" style={{ borderLeft: '3px solid hsl(var(--danger))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="badge badge-high" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>High Priority</span>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted))' }}>Just now</span>
                  </div>
                  <div className="mock-announcement-title">Mid-Semester Syllabus & Schedule</div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>
                    The schedule for upcoming mid-semester examinations has been updated. Please download the file...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">5,000+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">120+</div>
              <div className="stat-label">Expert Faculty</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">1,500+</div>
              <div className="stat-label">Lecture Notes Shared</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Designed for Every Campus Role</h2>
            <p className="section-subtitle">A unified system offering tailored dashboards for all stakeholders in Edumark.</p>
          </div>

          <div className="features-tabs-wrapper">
            <div className="features-tabs">
              <button
                className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => setActiveTab('student')}
              >
                <Users size={16} /> Students
              </button>
              <button
                className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
                onClick={() => setActiveTab('faculty')}
              >
                <BookOpen size={16} /> Faculty Members
              </button>
              <button
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldCheck size={16} /> Portal Admins
              </button>
            </div>

            <div className="features-content-grid">
              {features[activeTab].map((feat, index) => (
                <div key={index} className="feature-card card">
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
      <section id="departments" className="departments-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Supported Academic Departments</h2>
            <p className="section-subtitle">Explore notes and announcements filtered dynamically across the major academic departments of the college.</p>
          </div>

          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div key={index} className="dept-card card">
                <div className="dept-badge">{dept.code}</div>
                <h3 className="dept-name">{dept.name}</h3>
                <p className="dept-desc">{dept.desc}</p>
                <div className="dept-footer">
                  <span className="dept-link">Explore Material <ChevronRight size={14} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container faq-container">
          <div className="faq-intro">
            <HelpCircle size={40} className="faq-intro-icon" />
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Have questions about using the classroom portal? Browse through the quick answers below or contact the support deck.
            </p>
            <div className="faq-support-card card">
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Need Direct Assistance?</div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginBottom: '1rem' }}>
                For account verification, password resets, or department edits, get in touch.
              </p>
              <a href="mailto:support@edumark.com" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', width: 'fit-content' }}>
                Email Support Team
              </a>
            </div>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item card ${openFaq === index ? 'open' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  <ChevronRight size={18} className="faq-chevron" />
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
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-banner-content">
              <h2>Join the Edumark Digital Community</h2>
              <p>Sign up now to access verified notes, campus updates, and assignments tailored to your courses.</p>
            </div>
            <div className="cta-banner-actions">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student'} className="btn btn-primary btn-lg" style={{ color: 'black' }}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg" style={{ color: 'black' }}>
                    Create Account
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
                    Access Panel
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="landing-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: 'hsl(var(--primary))', color: '#020617', borderRadius: '12px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.6rem', height: '2.6rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                <span style={{ color: 'white' }}>Edu</span><span style={{ color: 'hsl(var(--primary))' }}>Mark</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', lineHeight: 1.6 }}>
              Edumark classroom system streamlines notes downloads, assignments tracking, and official notifications for students and faculty.
            </p>
          </div>
          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <a href="/#features">Features</a>
            <a href="/#stats">Statistics</a>
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
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', lineHeight: 1.6 }}>
              Tibrewal Commerce College, NEAR NEW, IIM Rd, Vastrapur, Ahmedabad, Gujarat 380015
            </p>
          </div>
        </div>
        <div className="container footer-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <p>© {new Date().getFullYear()} Edumark. All rights reserved.</p>
          <p style={{ fontSize: '1rem', color: 'orange', textAlign: 'center', marginTop: '0.25rem' }}>
            This Module Built and Designed By <span style={{ fontWeight: 'bold' }}>Jadav Dashrath</span> And <span style={{ fontWeight: 'bold' }}>Dabhi Prit</span>
          </p>
        </div>
      </footer>

      {/* Beautiful Landing Page Specific CSS */}
      <style>{`
        /* Floating Background Blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.15;
          pointer-events: none;
        }
        
        .blob-1 {
          top: 10%;
          left: 5%;
          width: 300px;
          height: 300px;
          background-color: hsl(var(--primary));
          animation: floatBlob 12s infinite alternate ease-in-out;
        }
        
        .blob-2 {
          bottom: 10%;
          right: 5%;
          width: 350px;
          height: 350px;
          background-color: hsl(var(--accent));
          animation: floatBlob 16s infinite alternate-reverse ease-in-out;
        }

        @keyframes floatBlob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(40px, -60px) scale(1.12);
          }
          100% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.6deg);
          }
        }

        /* Hero Section Styling */
        .hero-section {
          padding: 6rem 0 5rem 0;
          position: relative;
          background: radial-gradient(circle at 15% 15%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
                      radial-gradient(circle at 85% 85%, hsl(var(--accent) / 0.1) 0%, transparent 50%);
        }
        
        .hero-container {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 968px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
          }
          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: hsl(var(--primary) / 0.12);
          color: hsl(var(--primary));
          padding: 0.4rem 0.8rem;
          border-radius: 9999px;
          font-size: 0.775rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          border: 1px solid hsl(var(--primary) / 0.2);
        }
        
        .hero-title {
          font-size: clamp(2.2rem, 4vw, 3.4rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.025em;
          margin-bottom: 1.25rem;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
        }
        
        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
        
        .hero-badge, .hero-title, .hero-subtitle, .hero-actions {
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .hero-badge { animation-delay: 0.1s; }
        .hero-title { animation-delay: 0.2s; }
        .hero-subtitle { animation-delay: 0.3s; }
        .hero-actions { animation-delay: 0.4s; }
        
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hero-subtitle {
          font-size: 1.1rem;
          color: hsl(var(--muted));
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 580px;
        }
        
        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .btn-lg {
          padding: 0.85rem 1.75rem;
          font-size: 1rem;
        }
        
        /* Mockup Card Design */
        .hero-mockup-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .hero-mockup-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          background-color: hsl(var(--primary) / 0.2);
          border-radius: 50%;
          filter: blur(60px);
          z-index: 1;
        }
        
        .hero-mockup-card {
          width: 100%;
          max-width: 440px;
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          z-index: 2;
          overflow: hidden;
          animation: floatCard 6s ease-in-out infinite;
        }
        
        .mockup-header {
          display: flex;
          align-items: center;
          padding: 0.85rem 1.25rem;
          background-color: hsl(var(--secondary) / 0.6);
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .mockup-dots {
          display: flex;
          gap: 0.4rem;
          margin-right: 1.25rem;
        }
        
        .mockup-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: hsl(var(--muted) / 0.4);
        }
        .mockup-dots span:nth-child(1) { background-color: hsl(var(--danger) / 0.8); }
        .mockup-dots span:nth-child(2) { background-color: hsl(var(--warning) / 0.8); }
        .mockup-dots span:nth-child(3) { background-color: hsl(var(--success) / 0.8); }
        
        .mockup-title {
          font-size: 0.775rem;
          font-weight: 600;
          color: hsl(var(--muted));
          letter-spacing: 0.02em;
        }
        
        .mockup-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background-color: hsl(var(--card));
        }
        
        .mock-card {
          padding: 1rem;
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          background-color: hsl(var(--secondary) / 0.2);
        }
        
        .mock-card-header {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .mock-icon-bg {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 8px;
          background-color: hsl(var(--primary) / 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        
        .mock-title {
          font-size: 0.85rem;
          font-weight: 700;
        }
        
        .mock-subtitle {
          font-size: 0.75rem;
          color: hsl(var(--muted));
        }
        
        .mock-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: hsl(var(--muted));
          margin-bottom: 0.5rem;
        }
        
        .mock-badge {
          background-color: hsl(var(--success) / 0.12);
          color: hsl(var(--success));
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .mock-progress-bar {
          height: 6px;
          background-color: hsl(var(--border));
          border-radius: 3px;
          overflow: hidden;
        }
        
        .mock-progress {
          height: 100%;
          background-color: hsl(var(--primary));
          border-radius: 3px;
        }
        
        .mock-announcement-title {
          font-size: 0.8rem;
          font-weight: 700;
        }
        
        /* Stats Section */
        .stats-section {
          padding: 3rem 0;
          background-color: hsl(var(--card));
          border-top: 1px solid hsl(var(--border));
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }
        
        .stat-card {
          padding: 1rem;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .stat-card:hover {
          transform: translateY(-4px) scale(1.06);
        }
        
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: hsl(var(--primary));
          margin-bottom: 0.25rem;
          transition: text-shadow 0.3s ease;
        }
        
        .stat-card:hover .stat-value {
          text-shadow: 0 0 12px hsl(var(--primary) / 0.3);
        }
        
        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* Features Section Styling */
        .features-section {
          padding: 5rem 0;
        }
        
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 3rem auto;
        }
        
        .section-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        
        .section-subtitle {
          color: hsl(var(--muted));
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .features-tabs-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }
        
        .features-tabs {
          display: flex;
          background-color: hsl(var(--secondary) / 0.8);
          border: 1px solid hsl(var(--border));
          padding: 0.4rem;
          border-radius: 12px;
          gap: 0.25rem;
        }
        
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          border: none;
          background: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          color: hsl(var(--muted));
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          color: hsl(var(--foreground));
        }
        
        .tab-btn.active {
          background-color: hsl(var(--card));
          color: hsl(var(--primary));
          box-shadow: var(--shadow-sm);
        }
        
        .features-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          width: 100%;
        }
        
        .feature-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
          transform: skewX(-20deg);
          transition: 0.5s;
        }
        
        .feature-card:hover::before {
          left: 150%;
        }
        
        .feature-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1), 0 0 15px hsl(var(--primary)/0.25);
          border-color: hsl(var(--primary) / 0.5);
        }
        
        .feature-card:hover .feature-icon-wrapper {
          transform: scale(1.15) rotate(5deg);
          background-color: hsl(var(--primary));
          color: white;
        }

        .feature-icon-wrapper {
          width: 3.2rem;
          height: 3.2rem;
          border-radius: 12px;
          background-color: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .feature-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        
        .feature-card-desc {
          font-size: 0.875rem;
          color: hsl(var(--muted));
          line-height: 1.6;
        }
        
        /* Departments Styling */
        .departments-section {
          padding: 5rem 0;
          background-color: hsl(var(--secondary) / 0.3);
          border-top: 1px solid hsl(var(--border));
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .departments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }
        
        .dept-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .dept-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, transparent, hsl(var(--accent)/0.6), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .dept-card:hover::after {
          opacity: 1;
        }
        
        .dept-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1), 0 0 20px hsl(var(--accent)/0.2);
          border-color: transparent;
        }

        .dept-card:hover .dept-badge {
          background-color: hsl(var(--accent));
          color: white;
          transform: scale(1.08);
        }

        .dept-badge {
          background-color: hsl(var(--accent) / 0.1);
          color: hsl(var(--accent));
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          width: fit-content;
          margin-bottom: 1rem;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        
        .dept-name {
          font-size: 1.2rem;
          font-weight: 750;
          margin-bottom: 0.5rem;
        }
        
        .dept-desc {
          font-size: 0.85rem;
          color: hsl(var(--muted));
          line-height: 1.5;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        
        .dept-footer {
          border-top: 1px solid hsl(var(--border) / 0.5);
          padding-top: 1rem;
        }
        
        .dept-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
        }
        
        .dept-link:hover {
          text-decoration: underline;
        }
        
        /* FAQ Section Styling */
        .faq-section {
          padding: 5rem 0;
        }
        
        .faq-container {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 4rem;
        }
        
        @media (max-width: 900px) {
          .faq-container {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }
        
        .faq-intro-icon {
          color: hsl(var(--primary));
          margin-bottom: 1rem;
        }
        
        .faq-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }
        
        .faq-subtitle {
          color: hsl(var(--muted));
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .faq-support-card {
          padding: 1.25rem;
          background-color: hsl(var(--card));
        }
        
        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .faq-item {
          padding: 0 !important;
          transition: all 0.3s;
          border-radius: 10px !important;
        }
        
        .faq-question {
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }
        
        .faq-chevron {
          transition: transform 0.2s;
          color: hsl(var(--muted));
        }
        
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0, 1, 0, 1), padding 0.3s;
          padding: 0 1.25rem;
          font-size: 0.875rem;
          color: hsl(var(--muted));
          line-height: 1.6;
        }
        
        .faq-item.open .faq-chevron {
          transform: rotate(90deg);
          color: hsl(var(--primary));
        }
        
        .faq-item.open .faq-answer {
          max-height: 200px;
          padding: 0 1.25rem 1.25rem 1.25rem;
          border-top: 1px solid hsl(var(--border) / 0.5);
          padding-top: 1rem;
        }
        
        /* CTA Banner */
        .cta-banner-section {
          padding: 2rem 0 5rem 0;
        }
        
        .cta-banner-card {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent) / 0.85));
          border-radius: 20px;
          padding: 3.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3rem;
          color: white;
          box-shadow: var(--shadow-lg);
        }
        
        .cta-banner-content h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
        }
        
        .cta-banner-content p {
          opacity: 0.9;
          font-size: 1.05rem;
          max-width: 550px;
          line-height: 1.5;
        }
        
        .cta-banner-actions {
          display: flex;
          gap: 1rem;
          flex-shrink: 0;
        }
        
        @media (max-width: 820px) {
          .cta-banner-card {
            flex-direction: column;
            text-align: center;
            padding: 2.5rem;
          }
          .cta-banner-actions {
            justify-content: center;
            width: 100%;
          }
        }
        
        /* Footer Styling */
        .landing-footer {
          background-color: hsl(var(--card));
          border-top: 1px solid hsl(var(--border));
          padding: 4rem 0 2rem 0;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 3rem;
          margin-bottom: 3rem;
        }
        
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
        
        .footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .footer-links-col h4 {
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        
        .footer-links-col a {
          font-size: 0.85rem;
          color: hsl(var(--muted));
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-links-col a:hover {
          color: hsl(var(--primary));
        }
        
        .footer-bottom {
          border-top: 1px solid hsl(var(--border));
          padding-top: 1.5rem;
          text-align: center;
          font-size: 0.8rem;
          color: hsl(var(--muted));
        }

        /* Mobile Adjustments */
        @media (max-width: 600px) {
          .hero-section {
            padding: 4rem 0 3rem 0;
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
          .features-tabs {
            flex-direction: column;
            width: 100%;
            gap: 0.5rem;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
          .stat-value {
            font-size: 2rem;
          }
          .departments-grid {
            grid-template-columns: 1fr;
          }
          .cta-banner-card {
            padding: 2rem 1.5rem;
          }
          .cta-banner-actions {
            flex-direction: column;
            width: 100%;
          }
          .cta-banner-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
