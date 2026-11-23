import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { WebPushProvider } from './context/WebPushContext';

// Navigation & Components
import Navbar from './components/Shared/Navbar';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ChangePassword from './pages/Auth/ChangePassword';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import RegistrationRequests from './pages/Admin/RegistrationRequests';
import FacultyManagement from './pages/Admin/FacultyManagement';
import AnnouncementsManagement from './pages/Admin/AnnouncementsManagement';
import DepartmentsManagement from './pages/Admin/DepartmentsManagement';
import SubAdminsManagement from './pages/Admin/SubAdminsManagement';
import StudentsManagement from './pages/Admin/StudentsManagement';
import AdminProfile from './pages/Admin/AdminProfile';

// Faculty Pages
import FacultyDashboard from './pages/Faculty/FacultyDashboard';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';

// Landing Page
import LandingPage from './pages/LandingPage';

// Route Guards
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ color: 'hsl(var(--muted))' }}>Initializing session...</h3>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles?.map(r => r.toLowerCase());

  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    // Role not authorized, redirect to their default home
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'faculty') return <Navigate to="/faculty" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main Admin specific guard
function RequireMainAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const userRole = (user?.role || '').toLowerCase();
  if (user && userRole === 'admin' && user.adminRole === 'main_admin') {
    return children;
  }
  return <Navigate to="/admin" replace />;
}

// Redirects home requests to user's dashboard based on their role
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'faculty') return <Navigate to="/faculty" replace />;
  if (userRole === 'student') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

// Main App layout container
function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminPage = user?.role === 'admin' && location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const hideNavbar = isAuthPage || isLandingPage;
  
  return (
    <div className={isAdminPage ? 'admin-sidebar-layout' : 'standard-layout'}>
      {!hideNavbar && <Navbar />}
      <main className={isAdminPage ? 'admin-main-content' : ''} style={{ minHeight: hideNavbar ? '100vh' : 'calc(100vh - 4.5rem)', width: '100%' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Secure Common Routes */}
          <Route 
            path="/change-password" 
            element={
              <RequireAuth allowedRoles={['admin', 'faculty']}>
                <ChangePassword />
              </RequireAuth>
            } 
          />

          {/* Secure Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/requests" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <RegistrationRequests />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/faculty" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <FacultyManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/students" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <StudentsManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/announcements" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AnnouncementsManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/departments" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <RequireMainAdmin>
                  <DepartmentsManagement />
                </RequireMainAdmin>
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/sub-admins" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <RequireMainAdmin>
                  <SubAdminsManagement />
                </RequireMainAdmin>
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminProfile />
              </RequireAuth>
            } 
          />

          {/* Secure Faculty Routes */}
          <Route 
            path="/faculty" 
            element={
              <RequireAuth allowedRoles={['faculty']}>
                <FacultyDashboard />
              </RequireAuth>
            } 
          />

          {/* Secure Student Routes */}
          <Route 
            path="/student" 
            element={
              <RequireAuth allowedRoles={['student']}>
                <StudentDashboard />
              </RequireAuth>
            } 
          />

          {/* Default Base Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <WebPushProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </WebPushProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
