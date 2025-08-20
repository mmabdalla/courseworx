import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import TraineeLogin from './pages/TraineeLogin';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import UserImport from './pages/UserImport';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import CourseEdit from './pages/CourseEdit';
import CourseContent from './pages/CourseContent';
import CourseContentViewer from './pages/CourseContentViewer';
import CourseEnrollment from './pages/CourseEnrollment';
import Home from './pages/Home';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, setupRequired } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If setup is required, redirect to setup
  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading, setupRequired } = useAuth();

  console.log('AppRoutes render - user:', user, 'loading:', loading, 'setupRequired:', setupRequired);

  // Show loading while checking setup and auth status
  if (loading) {
    return <LoadingSpinner />;
  }

  // If setup is required, show setup page
  if (setupRequired) {
    console.log('Setup required, showing setup page');
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  console.log('Setup not required, showing normal routes');
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/trainee-login" element={
        user ? <Navigate to="/dashboard" replace /> : <TraineeLogin />
      } />
      {/* Public homepage route */}
      <Route path="/" element={<Home />} />

      {/* Private routes with Layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/create" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseCreate />
          </PrivateRoute>
        } />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/edit" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseEdit />
          </PrivateRoute>
        } />
        <Route path="/courses/:id/content" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseContent />
          </PrivateRoute>
        } />
        <Route path="/courses/:id/enrollment" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseEnrollment />
          </PrivateRoute>
        } />
        <Route path="/courses/:id/learn" element={
          <PrivateRoute>
            <CourseContentViewer />
          </PrivateRoute>
        } />
        <Route path="/enrollments" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseEnrollment />
          </PrivateRoute>
        } />
        <Route path="/users/import" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <UserImport />
          </PrivateRoute>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={
          <PrivateRoute allowedRoles={['super_admin']}>
            <Users />
          </PrivateRoute>
        } />
      </Route>
      {/* Catch-all: redirect to dashboard if authenticated, else to login */}
      <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App; 