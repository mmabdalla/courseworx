import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import TraineeLogin from './pages/TraineeLogin';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseManagement from './pages/CourseManagement';
import UserImport from './pages/UserImport';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import CourseContent from './pages/CourseContent';
import CourseContentViewer from './pages/CourseContentViewer';
import CourseEnrollment from './pages/CourseEnrollment';
import TraineeDetails from './pages/TraineeDetails';
import LessonDetail from './pages/LessonDetail';
import Home from './pages/Home';
import TrainerCourses from './pages/TrainerCourses';
import TrainerStudents from './pages/TrainerStudents';
import PluginManagement from './pages/PluginManagement';
import FinancialDashboard from './pages/admin/FinancialDashboard';
import CurrencyManagement from './pages/admin/CurrencyManagement';
import CurrencyDetail from './pages/admin/CurrencyDetail';
import CurrencyTest from './pages/CurrencyTest';
import TrainerEarnings from './pages/TrainerEarnings';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Payouts from './pages/trainer/Payouts';
import AttendanceTracker from './pages/AttendanceTracker';
import ClassroomSessions from './pages/ClassroomSessions';
import AttendanceDashboard from './pages/AttendanceDashboard';
import AttendanceJoin from './pages/AttendanceJoin';

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

      {/* Course Learning Page - No Layout Header */}
      <Route path="/courses/:id/learn" element={
        <PrivateRoute>
          <CourseContentViewer />
        </PrivateRoute>
      } />

      {/* Private routes with Layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/create" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseManagement />
          </PrivateRoute>
        } />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/edit" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <CourseManagement />
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
        <Route path="/courses/:courseId/trainee/:traineeId" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <TraineeDetails />
          </PrivateRoute>
        } />
        <Route path="/courses/:courseId/lessons/:contentId" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <LessonDetail />
          </PrivateRoute>
        } />
        
        {/* Trainer-specific routes */}
        <Route path="/trainer/courses" element={
          <PrivateRoute allowedRoles={['trainer']}>
            <TrainerCourses />
          </PrivateRoute>
        } />
        <Route path="/trainer/students" element={
          <PrivateRoute allowedRoles={['trainer']}>
            <TrainerStudents />
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
        <Route path="/plugin-management" element={
          <PrivateRoute allowedRoles={['super_admin']}>
            <PluginManagement />
          </PrivateRoute>
        } />
        <Route path="/financial-dashboard" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <FinancialDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/currencies" element={
          <PrivateRoute allowedRoles={['super_admin']}>
            <CurrencyManagement />
          </PrivateRoute>
        } />
        <Route path="/admin/currencies/:currencyId" element={
          <PrivateRoute allowedRoles={['super_admin']}>
            <CurrencyDetail />
          </PrivateRoute>
        } />
        <Route path="/currency-test" element={<CurrencyTest />} />
        <Route path="/trainer/earnings" element={
          <PrivateRoute allowedRoles={['trainer']}>
            <TrainerEarnings />
          </PrivateRoute>
        } />
        <Route path="/trainer/payouts" element={
          <PrivateRoute allowedRoles={['trainer']}>
            <Payouts />
          </PrivateRoute>
        } />
        
        {/* Financial routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/cart" element={<Navigate to="/courses" replace />} />

        {/* Attendance routes */}
        <Route path="/attendance/tracker" element={<AttendanceTracker />} />
        <Route path="/attendance/join/:sessionId" element={<AttendanceJoin />} />
        <Route path="/courses/:courseId/sessions" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <ClassroomSessions />
          </PrivateRoute>
        } />
        <Route path="/courses/:courseId/sessions/:sessionId/attendance" element={
          <PrivateRoute allowedRoles={['super_admin', 'trainer']}>
            <AttendanceDashboard />
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