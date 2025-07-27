import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
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
import Home from './pages/Home';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
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
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <Login />
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