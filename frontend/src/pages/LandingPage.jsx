import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Megaphone, Bell, Search, Layers, Users,
  Zap, ArrowRight, Download, X, GraduationCap, CheckCircle2,
  FileText, Compass, Code, ExternalLink
} from 'lucide-react';

const LinkedInIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
  </svg>
);

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if PWA is already installed or running as standalone webapp
  const isAppInstalled = () => {
    if (typeof window === 'undefined') return true;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');
    const isSavedInstalled = localStorage.getItem('pwa_installed') === 'true';
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    return isStandalone || isSavedInstalled || isDismissed;
  };

  const [showInstallBanner, setShowInstallBanner] = useState(() => !isAppInstalled());
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // If already installed or running as standalone, don't show install banner
    if (isAppInstalled()) {
      setShowInstallBanner(false);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled()) {
        setShowInstallBanner(true);
      }
    };

    // Automatically detect when PWA has finished installing via browser
    const handleAppInstalled = () => {
      localStorage.setItem('pwa_installed', 'true');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const handleModeChange = (e) => {
      if (e.matches) {
        localStorage.setItem('pwa_installed', 'true');
        setShowInstallBanner(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (standaloneMedia.addEventListener) {
      standaloneMedia.addEventListener('change', handleModeChange);
    } else if (standaloneMedia.addListener) {
      standaloneMedia.addListener(handleModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (standaloneMedia.removeEventListener) {
        standaloneMedia.removeEventListener('change', handleModeChange);
      } else if (standaloneMedia.removeListener) {
        standaloneMedia.removeListener(handleModeChange);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_installed', 'true');
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      alert('To install the app, click the install/download icon in your browser address bar or select "Install App" from browser menu.');
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } else {
      navigate('/login');
    }
  };

  // 6 Classroom Features with 3 distinct colors from theme: navy (#003580), amber (#f59e0b), dark (#1e2a3a)
  const features = [
    {
      icon: <BookOpen size={28} />,
      title: 'Unit-Wise Study Materials',
      desc: 'Faculty easily upload syllabus-mapped lecture notes, PPT presentations, and reference documents for students to download with 1-click access.',
      variant: 'navy'
    },
    {
      icon: <Megaphone size={28} />,
      title: 'Priority Announcements',
      desc: 'Broadcast campus circulars, exam schedules, and emergency notices with High, Medium, or Low urgency badges directly to student dashboards.',
      variant: 'amber'
    },
    {
      icon: <Layers size={28} />,
      title: 'Department & Semester Hubs',
      desc: 'Structured organization by department (BCA, B.Com, BBA, B.Sc) and semester, ensuring students find exactly what belongs to their academic curriculum.',
      variant: 'dark'
    },
    {
      icon: <Search size={28} />,
      title: 'Instant Note & Subject Search',
      desc: 'Quickly find notes, syllabus files, and circulars by subject, unit number, faculty name, or keywords with instant, optimized search.',
      variant: 'dark'
    },
    {
      icon: <Users size={28} />,
      title: 'Multi-Role Campus Portals',
      desc: 'Tailored dashboards for Students, Faculty, and Administrators with secure verification workflows, student rosters, and material management.',
      variant: 'amber'
    },
    {
      icon: <Zap size={28} />,
      title: 'Progressive Web App (PWA)',
      desc: 'Install directly on smartphones or desktops without app store friction. Enjoy lightning-fast performance, offline caching, and responsive design.',
      variant: 'navy'
    }
  ];

  // 3 Simple Steps for Classroom System
  const steps = [
    {
      num: '1',
      title: 'Faculty Uploads Material',
      desc: 'Professors upload unit-wise notes, syllabi, assignment resources, and official notices from their dashboard.'
    },
    {
      num: '2',
      title: 'Students Filter & Access',
      desc: 'Students select their department and semester to instantly view, read, and download relevant study materials.'
    },
    {
      num: '3',
      title: 'Stay Informed in Real Time',
      desc: 'Receive immediate alerts for exam schedules, urgent announcements, and academic updates right on your screen.'
    }
  ];

  return (
    <div style={styles.page} className="landing-page">
      {/* PWA Install Banner */}
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
              <img
                src="/favicon.svg"
                alt="Edumark Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
                  display: 'block'
                }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Install EduMark Classroom App
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Install as an app for fast offline access to notes, syllabi &amp; notices.
                </div>
              </div>
            </div>

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
                onClick={handleDismissBanner}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s'
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

      {/* ===================== HERO SECTION ===================== */}
      <section style={styles.hero}>
        <div style={styles.heroLayout} className="animate-fade-in-up landing-hero-layout">
          {/* Left Text Col */}
          <div style={styles.heroTextCol}>
            <div style={styles.badge}>
              <Zap size={16} color="#fbbf24" className="spin-slow" />
              <span>Edu<span style={{ color: '#fbbf24' }}>Mark</span> Academic Platform</span>
            </div>

            <div style={styles.heroBrandWrap}>
              <img
                src="/favicon.svg"
                alt="EduMark Logo"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  boxShadow: '0 6px 20px rgba(251, 191, 36, 0.45)',
                  display: 'block',
                  flexShrink: 0
                }}
              />
              <h1 style={styles.heroTitle}>
                Edu<span style={{ color: '#fbbf24' }}>Mark</span>
              </h1>
            </div>

            <h2 style={styles.heroSubtitle}>
              Streamline Classroom Learning <br />
              <span style={{ color: '#fbbf24' }}>with Smart Notes &amp; Instant Notices</span>
            </h2>

            <p style={styles.heroDesc}>
              The unified digital platform for colleges and universities to share course notes, broadcast priority campus circulars, and empower students and faculty with seamless academic access.
            </p>

            <div style={styles.heroBtns}>
              <button
                style={styles.btnPrimary}
                onClick={handleGetStarted}
                id="landing-get-started-btn"
              >
                Get Started <Zap size={18} color="#c2410c" fill="#ea580c" style={{ display: 'inline-flex', verticalAlign: 'middle' }} />
              </button>

              <button
                style={styles.btnGhost}
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                id="landing-how-it-works-btn"
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(229, 231, 235, 0.28)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.25), 0 0 16px rgba(229, 231, 235, 0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(229, 231, 235, 0.16)';
                  e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.45)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.3)';
                }}
              >
                How it Works
              </button>
            </div>

            <div style={styles.trustRow}>
              <span style={styles.trustItem}>
                <CheckCircle2 size={15} color="#10b981" /> 1-Click Note Downloads
              </span>
              <span style={styles.trustItem}>
                <CheckCircle2 size={15} color="#10b981" /> Cloud Synced
              </span>
              <span style={styles.trustItem}>
                <CheckCircle2 size={15} color="#10b981" /> Verified Campus Access
              </span>
            </div>
          </div>

          {/* Right Visual Col — 3 Live Floating Cards */}
          <div style={styles.heroVisualCol} className="animate-fade-in-up delay-2">
            {/* Card 1: Active Lecture Unit */}
            <div style={styles.cardPreview1} className="animate-float">
              <div style={styles.previewCardHeader}>
                <BookOpen size={16} color="#fbbf24" />
                <span>Active Lecture Material</span>
                <span style={styles.livePingDot}></span>
              </div>
              <div style={styles.previewCardTitle}>Data Structures &amp; Algorithms - Unit 3</div>
              <div style={styles.previewCardData}>
                <span style={styles.previewCardLabel}>Resource File</span>
                <span style={styles.previewCardValue}>PDF • 4.2 MB</span>
              </div>
            </div>

            {/* Card 2: Priority Announcement */}
            <div style={styles.cardPreview2} className="animate-float-delayed">
              <div style={styles.previewCardHeader}>
                <Bell size={16} color="#10b981" />
                <span>Urgent Broadcast</span>
                <span style={{ ...styles.livePingDot, backgroundColor: '#10b981' }}></span>
              </div>
              <div style={styles.previewCardTitle}>Mid-Semester Exam Schedule Released</div>
              <div style={styles.previewCardData}>
                <span style={styles.previewCardLabel}>Priority Badge</span>
                <span style={{ ...styles.previewCardValue, color: '#10b981' }}>HIGH • BCA Sem 4</span>
              </div>
            </div>

            {/* Card 3: Department Hub */}
            <div style={styles.cardPreview3} className="animate-float-more-delayed">
              <div style={styles.previewCardHeader}>
                <GraduationCap size={16} color="#fbbf24" />
                <span>Department Portal</span>
              </div>
              <div style={styles.previewCardTitle}>Computer Applications (BCA)</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={styles.miniTag}>Semester 1-6</span>
                <span style={styles.miniTagSuccess}>All Subjects</span>
                <span style={styles.miniTagAmber}>Verified Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row inside Hero */}
        <div style={styles.statsRow} className="animate-fade-in-up delay-3 landing-stats-row">
          <div style={styles.statCard} className="stat-box-hover landing-stat-card">
            <div style={styles.statNum} className="stat-num-glow">5,000+</div>
            <div style={styles.statLabel}>Active Students</div>
          </div>
          <div style={styles.statCard} className="stat-box-hover landing-stat-card">
            <div style={styles.statNum} className="stat-num-glow">1,500+</div>
            <div style={styles.statLabel}>Study Materials Uploaded</div>
          </div>
          <div style={styles.statCard} className="stat-box-hover landing-stat-card">
            <div style={styles.statNum} className="stat-num-glow">100%</div>
            <div style={styles.statLabel}>Department Coverage</div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES SECTION (WHITE / LIGHT BLUE BG #f0f4f8) ===================== */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Everything You Need in One Platform</h2>
          <p style={styles.sectionSub}>Powerful academic features designed for modern colleges and universities</p>
        </div>

        {/* 6 Cards with DIFFERENT COLORS: Navy (#003580), Amber (#f59e0b), Dark (#1e2a3a) */}
        <div style={styles.featuresGrid} className="landing-features-grid">
          {features.map((item, idx) => {
            const isAmber = item.variant === 'amber';
            const isDark = item.variant === 'dark';

            // Exact color mappings from attendance.edumark.app
            const cardBg = isAmber ? '#f59e0b' : isDark ? '#1e2a3a' : '#003580';
            const iconBg = isAmber ? '#001b3d' : '#f59e0b';
            const iconColor = isAmber ? '#f59e0b' : '#001b3d';
            const titleColor = isAmber ? '#001b3d' : '#ffffff';
            const descColor = isAmber ? 'rgba(0, 27, 61, 0.85)' : '#ffffff';

            return (
              <div
                key={idx}
                style={{ ...styles.featureCard, backgroundColor: cardBg }}
                className={`feature-card-hover variant-${item.variant} landing-feature-card`}
              >
                <div style={{ ...styles.featureIconBox, backgroundColor: iconBg }}>
                  <span style={{ color: iconColor, display: 'flex' }}>
                    {item.icon}
                  </span>
                </div>
                <h3 style={{ ...styles.featureCardTitle, color: titleColor }} className="feature-card-heading">
                  {item.title}
                </h3>
                <p style={{ ...styles.featureCardDesc, color: descColor }} className="feature-card-paragraph">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== 3 SIMPLE STEPS SECTION ===================== */}
      <section id="how-it-works" style={styles.stepsSection} className="landing-steps-section">
        <div style={styles.sectionHead} className="landing-section-head">
          <h2 style={{ ...styles.sectionTitle, color: '#ffffff' }}>3 Simple Steps</h2>
          <p style={{ ...styles.sectionSub, color: 'rgba(147,197,253,0.85)' }}>
            Effortless academic material sharing and communication across your entire college.
          </p>
        </div>

        <div style={styles.stepsGrid} className="landing-steps-grid">
          {steps.map((s, idx) => (
            <React.Fragment key={idx}>
              <div style={styles.stepCard} className="landing-step-card">
                <div style={{ ...styles.stepCircle, animationDelay: `${idx * 0.8}s` }} className="step-icon-glow landing-step-circle">
                  {s.num}
                </div>
                <h3 style={styles.stepTitle} className="landing-step-title">{s.title}</h3>
                <p style={styles.stepDesc} className="landing-step-desc">{s.desc}</p>
              </div>
              {idx < steps.length - 1 && (
                <div style={styles.stepConnector} className="landing-step-connector" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* CTA Card */}
        <div style={styles.ctaContainer} className="landing-cta-container">
          <div style={styles.ctaCard} className="shimmer-wrapper landing-cta-card">
            <div style={styles.ctaBadgeIcon}>
              <GraduationCap size={26} color="#001b3d" />
            </div>
            <h2 style={styles.ctaTitle} className="landing-cta-title">
              Ready to Transform Your College Classroom Experience?
            </h2>
            <p style={styles.ctaDesc} className="landing-cta-desc">
              Join the portal now to access lecture notes, syllabi, and instant campus circulars.
            </p>
            <button
              style={styles.btnPrimary}
              onClick={handleGetStarted}
              id="landing-cta-btn"
              className="landing-cta-btn"
            >
              Login to Portal &nbsp; <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      </section>

      {/* ===================== LEADERSHIP & INNOVATION SECTION ===================== */}
      <section id="leadership-and-team" className="landing-team-section">
        {/* Ambient Glowing Blobs */}
        <div className="landing-team-blob landing-team-blob-1" />
        <div className="landing-team-blob landing-team-blob-2" />
        <div className="landing-team-blob landing-team-blob-3" />

        <div className="landing-team-container">
          {/* TOP: ACADEMIC VISIONARY / THE MIND BEHIND THE VISION */}
          <div className="landing-visionary-grid">
            {/* Left: Heading & Badge */}
            <div className="landing-visionary-heading-col">
              <div className="landing-pill-badge">
                <Compass size={14} className="text-yellow" />
                <span>Academic Visionary</span>
              </div>
              <h2 className="landing-visionary-title" style={{ color: '#ffffff' }}>
                <span style={{ color: '#ffffff' }}>The</span><br />
                <span style={{ color: '#ffffff' }}>mind</span><br />
                <span className="landing-serif-italic" style={{ color: '#fbbf24' }}>behind the<br />vision.</span>
              </h2>
            </div>

            {/* Center: Leader Portrait Card */}
            <div className="landing-visionary-card-col">
              <div className="landing-portrait-card-glow">
                <div className="landing-portrait-card-inner">
                  <div className="landing-portrait-frame">
                    <img
                      src="/assets/parth-joshi.jpeg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://www.edumark.app/assets/parth-joshi.jpeg";
                      }}
                      alt="Prof. Parth Joshi"
                      className="landing-portrait-img"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Leader Details & Actions */}
            <div className="landing-visionary-details-col">
              <span className="landing-eyebrow">LEADERSHIP &amp; MENTORSHIP</span>
              <h3 className="landing-visionary-name" style={{ color: '#ffffff' }}>Prof. Parth Joshi</h3>
              <p className="landing-role-tag">PROJECT MENTOR &amp; GUIDE</p>
              <p className="landing-visionary-bio">
                Guiding the vision and academic excellence of EduMark, fostering student innovation, and driving institutional digital transformation with scalable modern architecture.
              </p>
              <div className="landing-btn-group">
                <a
                  href="https://www.linkedin.com/in/parthjoshi26?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-btn-yellow"
                  title="LinkedIn"
                >
                  <span>LinkedIn</span>
                  <LinkedInIcon size={14} />
                </a>
                <a
                  href="mailto:parth_ljcca@ljku.edu.in"
                  className="landing-btn-glass"
                  title="Portfolio"
                >
                  <span>Portfolio</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="landing-team-divider" />

          {/* BOTTOM: ENGINEERING & INNOVATION / THE MINDS BEHIND THE CODE */}
          <div className="landing-devs-wrapper">
            <div className="landing-devs-header">
              <div className="landing-pill-badge">
                <Code size={14} className="text-yellow" />
                <span>Engineering &amp; Innovation</span>
              </div>
              <h2 className="landing-devs-title" style={{ color: '#ffffff' }}>
                <span style={{ color: '#ffffff' }}>The minds</span><br />
                <span className="landing-serif-italic" style={{ color: '#fbbf24' }}>behind the code.</span>
              </h2>
              <p className="landing-devs-sub">
                Architecting, designing, and engineering the EduMark platform.
              </p>
            </div>

            <div className="landing-devs-grid">
              {/* Developer 1: Jadav Dashrath */}
              <div className="landing-dev-card">
                <div className="landing-dev-card-glow">
                  <div className="landing-dev-card-inner">
                    <div className="landing-dev-img-frame">
                      <img
                        src="/assets/developer-1.jpg"
                        alt="Jadav Dashrath"
                        className="landing-portrait-img"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                <div className="landing-dev-info" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 className="landing-dev-name" style={{ color: '#ffffff', marginBottom: '16px', textAlign: 'center', width: '100%' }}>Jadav Dashrath</h3>
                  <div className="landing-btn-group" style={{ justifyContent: 'center' }}>
                    <a
                      href="https://www.linkedin.com/in/dashrath-jadav-393673424?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="landing-btn-yellow"
                      title="LinkedIn"
                    >
                      <span>LinkedIn</span>
                      <LinkedInIcon size={14} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Developer 2: Dabhi Prit */}
              <div className="landing-dev-card">
                <div className="landing-dev-card-glow">
                  <div className="landing-dev-card-inner">
                    <div className="landing-dev-img-frame">
                      <img
                        src="/assets/developer-2.jpg"
                        alt="Dabhi Prit"
                        className="landing-portrait-img"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                <div className="landing-dev-info" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 className="landing-dev-name" style={{ color: '#ffffff', marginBottom: '16px', textAlign: 'center', width: '100%' }}>Dabhi Prit</h3>
                  <div className="landing-btn-group" style={{ justifyContent: 'center' }}>
                    <a
                      href="https://www.linkedin.com/in/prit-dabhi-435978372?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="landing-btn-yellow"
                      title="LinkedIn"
                    >
                      <span>LinkedIn</span>
                      <LinkedInIcon size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <img src="/favicon.svg" alt="Logo" style={styles.logoIcon} />
          <span style={{ ...styles.navBrand, fontSize: '1.25rem' }}>
            Edu<span style={{ color: '#fbbf24' }}>Mark</span>
          </span>
        </div>
        <p style={styles.footerText}>
          © {new Date().getFullYear()} EduMark Classroom &amp; Academic Management System.
        </p>
        <p style={styles.footerCredit}>
          This Module is Build, Designed, and Devloped by <span style={{ color: '#fbbf24', fontWeight: 'normal' }}>Jadav Dashrath</span> And <span style={{ color: '#fbbf24', fontWeight: 'normal' }}>Dabhi Prit</span>
        </p>
      </footer>
    </div>
  );
}

// Exact Styles from attendance.edumark.app
const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflowX: 'hidden'
  },
  hero: {
    background: 'linear-gradient(180deg, #003366 0%, #004080 50%, #003366 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0 80px 0',
    width: '100%'
  },
  heroLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '40px',
    width: '100%',
    maxWidth: '1350px',
    padding: '20px 4% 50px 4%',
    alignItems: 'center'
  },
  heroTextCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.1)',
    marginBottom: '20px',
    border: '1px solid rgba(251, 191, 36, 0.25)'
  },
  heroBrandWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px'
  },
  heroTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-1.5px',
    lineHeight: '1'
  },
  heroSubtitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)',
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: '1.25',
    margin: '0 0 16px 0',
    letterSpacing: '-0.5px'
  },
  heroDesc: {
    fontSize: '1.05rem',
    color: 'rgba(147, 197, 253, 0.9)',
    lineHeight: '1.65',
    margin: '0 0 32px 0',
    maxWidth: '580px'
  },
  heroBtns: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '28px'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none',
    color: '#001b3d',
    fontWeight: '700',
    fontSize: '1rem',
    padding: '14px 32px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  btnGhost: {
    background: 'rgba(229, 231, 235, 0.16)',
    border: '1.5px solid rgba(229, 231, 235, 0.45)',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    padding: '12px 32px',
    borderRadius: '12px',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trustRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    fontSize: '0.88rem',
    color: 'rgba(147, 197, 253, 0.8)',
    fontWeight: '500'
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  heroVisualCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    padding: '10px 0'
  },
  cardPreview1: {
    background: 'rgba(0, 35, 75, 0.65)',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
    padding: '22px 26px',
    borderRadius: '18px',
    backdropFilter: 'blur(12px)'
  },
  cardPreview2: {
    background: 'rgba(0, 35, 75, 0.65)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
    padding: '22px 26px',
    borderRadius: '18px',
    backdropFilter: 'blur(12px)'
  },
  cardPreview3: {
    background: 'rgba(0, 35, 75, 0.65)',
    border: '1px solid rgba(14, 165, 233, 0.35)',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
    padding: '22px 26px',
    borderRadius: '18px',
    backdropFilter: 'blur(12px)'
  },
  previewCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.82rem',
    color: 'rgba(147, 197, 253, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  livePingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#fbbf24',
    marginLeft: 'auto'
  },
  previewCardTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '700',
    fontSize: '1.15rem',
    color: '#ffffff',
    marginBottom: '12px'
  },
  previewCardData: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '10px'
  },
  previewCardLabel: {
    fontSize: '0.85rem',
    color: 'rgba(147, 197, 253, 0.8)'
  },
  previewCardValue: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#ffffff'
  },
  miniTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    background: 'rgba(14, 165, 233, 0.15)',
    color: '#38bdf8',
    fontWeight: '600'
  },
  miniTagSuccess: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    fontWeight: '600'
  },
  miniTagAmber: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    background: 'rgba(251, 191, 36, 0.15)',
    color: '#fbbf24',
    fontWeight: '600'
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '0 4%',
    width: '100%',
    maxWidth: '1350px'
  },
  statCard: {
    flex: '1 1 260px',
    background: 'rgba(0, 35, 75, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '18px',
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    backdropFilter: 'blur(8px)'
  },
  statNum: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '2.6rem',
    fontWeight: '800',
    color: '#fbbf24',
    lineHeight: '1'
  },
  statLabel: {
    fontSize: '0.88rem',
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  featuresSection: {
    backgroundColor: '#f0f4f8',
    padding: '90px 4%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  sectionHead: {
    textAlign: 'center',
    marginBottom: '56px',
    maxWidth: '750px'
  },
  sectionTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
    fontWeight: '800',
    color: '#002d62',
    margin: '0 0 14px',
    letterSpacing: '-0.5px'
  },
  sectionSub: {
    fontSize: '1.05rem',
    color: '#5a7a9e',
    lineHeight: '1.6',
    margin: 0
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    columnGap: '24px',
    rowGap: '32px',
    width: '100%',
    maxWidth: '1350px'
  },
  featureCard: {
    borderRadius: '20px',
    padding: '36px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
  },
  featureIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  featureCardTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0
  },
  featureCardDesc: {
    fontSize: '0.95rem',
    lineHeight: '1.65',
    margin: 0
  },
  stepsSection: {
    background: 'linear-gradient(180deg, #003366 0%, #004080 50%, #003366 100%)',
    padding: '90px 4%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  stepsGrid: {
    display: 'flex',
    gap: '0',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1200px',
    flexWrap: 'wrap'
  },
  stepCard: {
    flex: '1 1 240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
    padding: '0 20px'
  },
  stepCircle: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#001b3d',
    boxShadow: '0 10px 24px rgba(251, 191, 36, 0.45)',
    flexShrink: 0
  },
  stepConnector: {
    height: '2px',
    width: '60px',
    minWidth: '40px',
    background: 'rgba(255, 255, 255, 0.15)',
    marginTop: '34px',
    flexShrink: 0
  },
  stepTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  stepDesc: {
    fontSize: '0.9rem',
    color: 'rgba(147, 197, 253, 0.8)',
    lineHeight: '1.6',
    margin: 0
  },
  ctaContainer: {
    width: '100%',
    maxWidth: '1200px',
    marginTop: '70px',
    display: 'flex',
    justifyContent: 'center'
  },
  ctaCard: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(0, 64, 128, 0.6) 0%, rgba(0, 51, 102, 0.85) 100%)',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    borderRadius: '24px',
    padding: '50px 36px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)'
  },
  ctaBadgeIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(251, 191, 36, 0.4)',
    marginBottom: '4px'
  },
  ctaTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  ctaDesc: {
    fontSize: '1.05rem',
    color: 'rgba(147, 197, 253, 0.9)',
    margin: '0 0 12px',
    maxWidth: '560px'
  },
  footer: {
    backgroundColor: '#00264d',
    padding: '40px 4%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    width: '100%'
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px'
  },
  footerText: {
    fontSize: '1.05rem',
    color: 'rgba(191, 219, 254, 0.85)',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.5
  },
  footerCredit: {
    fontSize: '1.02rem',
    color: 'rgba(191, 219, 254, 0.8)',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.5
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'block'
  },
  navBrand: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '800',
    fontSize: '1.5rem',
    color: '#ffffff',
    letterSpacing: '-0.5px'
  }
};
