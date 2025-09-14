import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, enrollmentsAPI, attendanceAPI, usersAPI } from '../services/api';
import {
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const SliderImageUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await usersAPI.uploadSliderImage(file);
      toast.success('Slider image uploaded!');
      setFile(null);
      setPreview(null);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Slider Image</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <img src={preview} alt="Preview" className="mt-4 h-32 object-contain rounded" />
      )}
      <button
        className="btn-primary mt-4"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

const Dashboard = () => {
  const { user, isSuperAdmin, isTrainer, isTrainee } = useAuth();

  // Fetch data based on user role
  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    ['courses', 'dashboard'],
    () => coursesAPI.getAll({ limit: 5, isPublished: true }),
    { enabled: !isSuperAdmin }
  );

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery(
    ['enrollments', 'my'],
    () => enrollmentsAPI.getMy({ limit: 5 }),
    { enabled: isTrainee }
  );

  const { data: attendanceStats, isLoading: attendanceLoading } = useQuery(
    ['attendance', 'stats'],
    () => attendanceAPI.getStats(),
    { enabled: isTrainee }
  );

  const { data: userStats, isLoading: userStatsLoading } = useQuery(
    ['users', 'stats'],
    () => usersAPI.getStats(),
    { enabled: isSuperAdmin }
  );

  const { data: courseStats, isLoading: courseStatsLoading } = useQuery(
    ['courses', 'stats'],
    () => coursesAPI.getStats(),
    { enabled: isSuperAdmin || isTrainer }
  );

  // New queries for real counts
  const { data: enrollmentStats, isLoading: enrollmentStatsLoading } = useQuery(
    ['enrollments', 'stats'],
    () => enrollmentsAPI.getStats(),
    { enabled: isSuperAdmin || isTrainer }
  );

  const { data: trainerCourseStats, isLoading: trainerCourseStatsLoading } = useQuery(
    ['courses', 'trainer-stats'],
    () => coursesAPI.getStats(),
    { enabled: isTrainer }
  );

  const { data: traineeEnrollmentStats, isLoading: traineeEnrollmentStatsLoading } = useQuery(
    ['enrollments', 'trainee-stats'],
    () => enrollmentsAPI.getStats(),
    { enabled: isTrainee }
  );

  const isLoading = coursesLoading || enrollmentsLoading || attendanceLoading || 
                   userStatsLoading || courseStatsLoading || enrollmentStatsLoading ||
                   trainerCourseStatsLoading || traineeEnrollmentStatsLoading;

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  const renderSuperAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userStats?.data?.stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Trainers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userStats?.data?.stats?.trainers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Trainees</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userStats?.data?.stats?.trainees || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courseStats?.data?.stats?.totalCourses || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {/* Add recent users list here */}
            <p className="text-gray-500 text-sm">No recent users to display</p>
          </div>
        </div>
        <SliderImageUpload />

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium">{userStats?.data?.stats?.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Published Courses</span>
              <span className="text-sm font-medium">{courseStats?.data?.stats?.publishedCourses || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Enrollments</span>
              <span className="text-sm font-medium">{enrollmentStats?.data?.stats?.totalEnrollments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Featured Courses</span>
              <span className="text-sm font-medium">{courseStats?.data?.stats?.featuredCourses || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/trainer/courses" className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {trainerCourseStats?.data?.stats?.myCourses || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Click to view all courses</p>
            </div>
          </div>
        </Link>

        <Link to="/trainer/students" className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrollmentStats?.data?.stats?.myStudents || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Click to view all students</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Courses</h3>
          <div className="space-y-3">
            {coursesData?.courses?.length > 0 ? (
              coursesData.courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-500">{course.trainer?.firstName} {course.trainer?.lastName}</p>
                  </div>
                  <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No courses found</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/courses/create" className="w-full btn-primary block text-center">
              Create New Course
            </Link>
            <Link to="/trainer/courses" className="w-full btn-secondary block text-center">
              View All Courses
            </Link>
            <Link to="/trainer/students" className="w-full btn-secondary block text-center">
              Manage Students
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTraineeDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {traineeEnrollmentStats?.data?.stats?.myEnrollments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceStats?.data?.stats?.attendanceRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {traineeEnrollmentStats?.data?.stats?.completedCourses || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Enrollments</h3>
          <div className="space-y-3">
            {enrollmentsData?.enrollments?.length > 0 ? (
              enrollmentsData.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{enrollment.course.title}</p>
                    <p className="text-sm text-gray-500">Progress: {enrollment.progress}%</p>
                  </div>
                  <span className={`badge ${
                    enrollment.status === 'active' ? 'badge-success' : 
                    enrollment.status === 'completed' ? 'badge-primary' : 'badge-warning'
                  }`}>
                    {enrollment.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No enrollments found</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary">
              Browse Courses
            </button>
            <button className="w-full btn-secondary">
              View Assignments
            </button>
            <button className="w-full btn-secondary">
              Attendance History
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName}! Here's what's happening.</p>
      </div>

      {isSuperAdmin && renderSuperAdminDashboard()}
      {isTrainer && renderTrainerDashboard()}
      {isTrainee && renderTraineeDashboard()}
    </div>
  );
};

export default Dashboard; 