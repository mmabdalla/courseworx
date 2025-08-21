import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentsAPI, coursesAPI } from '../services/api';
import {
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  UserIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TrainerStudents = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch trainer's courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    ['trainer-courses'],
    () => coursesAPI.getTrainerCourses(user?.id),
    { enabled: !!user?.id }
  );

  // Fetch enrollments for selected course
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery(
    ['trainer-enrollments', selectedCourse],
    () => selectedCourse === 'all' 
      ? enrollmentsAPI.getTrainerEnrollments(user?.id)
      : enrollmentsAPI.getCourseTrainees(selectedCourse),
    { enabled: !!user?.id && !!selectedCourse }
  );

  const handleRemoveStudent = async (enrollmentId, studentName, courseTitle) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from ${courseTitle}?`)) {
      try {
        await enrollmentsAPI.delete(enrollmentId);
        toast.success(`${studentName} removed from ${courseTitle} successfully!`);
        // Refetch the data
        window.location.reload();
      } catch (error) {
        toast.error('Failed to remove student from course');
      }
    }
  };

  if (coursesLoading || enrollmentsLoading) return <LoadingSpinner />;

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || enrollmentsData?.trainees || [];
  
  // Get unique students across all courses
  const uniqueStudents = enrollments.reduce((acc, enrollment) => {
    const studentId = enrollment.user?.id || enrollment.userId;
    if (!acc.find(s => s.id === studentId)) {
      acc.push({
        id: studentId,
        firstName: enrollment.user?.firstName || enrollment.user?.firstName,
        lastName: enrollment.user?.lastName || enrollment.user?.lastName,
        email: enrollment.user?.email || enrollment.user?.email,
        avatar: enrollment.user?.avatar || enrollment.user?.avatar,
        enrollments: []
      });
    }
    
    const student = acc.find(s => s.id === studentId);
    student.enrollments.push({
      courseId: enrollment.course?.id || enrollment.courseId,
      courseTitle: enrollment.course?.title || enrollment.course?.title,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress || 0,
      enrollmentId: enrollment.id
    });
    
    return acc;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600 mt-2">Manage students enrolled in your courses</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{uniqueStudents.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">{enrollments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div className="mb-6">
        <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Course
        </label>
        <select
          id="course-filter"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Students List */}
      {uniqueStudents.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedCourse === 'all' 
              ? "You don't have any students enrolled in your courses yet."
              : "No students are enrolled in this course."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {uniqueStudents.map((student) => (
            <div key={student.id} className="card">
              {/* Student Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {student.avatar ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={student.avatar}
                        alt={`${student.firstName} ${student.lastName}`}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/users/${student.id}`}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                  
                  {/* Actions Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowActionsDropdown(showActionsDropdown === student.id ? null : student.id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      title="Student Actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                    
                    {showActionsDropdown === student.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowActionsDropdown(null);
                              // Add more actions here in the future
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            disabled
                          >
                            <span className="text-gray-400">More actions coming soon...</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollments */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Course Enrollments</h4>
                {student.enrollments.map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{enrollment.courseTitle}</h5>
                        <span className={`badge ${
                          enrollment.status === 'active' ? 'badge-success' : 
                          enrollment.status === 'completed' ? 'badge-primary' : 'badge-warning'
                        }`}>
                          {enrollment.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          <span>Progress: {enrollment.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveStudent(
                        enrollment.enrollmentId, 
                        `${student.firstName} ${student.lastName}`, 
                        enrollment.courseTitle
                      )}
                      className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Remove from course"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerStudents;
