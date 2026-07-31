import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their default home
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main Admin specific guard
function RequireMainAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role === 'admin' && user.adminRole === 'main_admin') {
    return children;
  }
  return <Navigate to="/admin" replace />;
}

// Redirects home requests to user's dashboard based on their role
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

// Main App layout container
function AppLayout() {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 4.5rem)' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Common Routes */}
          <Route 
            path="/change-password" 
            element={
              <RequireAuth>
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
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
