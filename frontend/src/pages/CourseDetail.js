import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, enrollmentsAPI } from '../services/api';
import api from '../utils/api';
import { getThumbnailUrl } from '../utils/imageUtils';
import {
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  BookOpenIcon,
  CogIcon,
  EyeIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import TrainerAssignmentModal from '../components/TrainerAssignmentModal';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isTrainee, isTrainer, isSuperAdmin } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { data: course, isLoading, error } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { 
      enabled: !!id,
      retry: 1,
      retryDelay: 1000
    }
  );

  // Check if user is already enrolled in this course
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useQuery(
    ['enrollments', 'my'],
    () => enrollmentsAPI.getMy(),
    { 
      enabled: !!user && isTrainee,
      retry: 1,
      retryDelay: 1000
    }
  );

  // Check if current user is enrolled in this specific course
  const userEnrollment = enrollmentStatus?.enrollments?.find(
    enrollment => enrollment.courseId === id
  );
  
  const isEnrolled = userEnrollment && ['active', 'pending', 'completed'].includes(userEnrollment.status);
  const isActiveEnrollment = userEnrollment && userEnrollment.status === 'active';
  const isPendingEnrollment = userEnrollment && userEnrollment.status === 'pending';

  const enrollmentMutation = useMutation(
    (data) => enrollmentsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['enrollments']);
        toast.success('Successfully enrolled in course!');
        setEnrolling(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to enroll in course');
        setEnrolling(false);
      },
    }
  );

  const addToCartMutation = useMutation(
    (data) => api.post('/financial/cart/items', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cart']);
        toast.success('Course added to cart!');
        setAddingToCart(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add course to cart');
        setAddingToCart(false);
      },
    }
  );

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses');
      return;
    }

    setEnrolling(true);
    enrollmentMutation.mutate({
      courseId: id,
      paymentAmount: parseFloat(courseData.price),
    });
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add courses to cart');
      return;
    }

    setAddingToCart(true);
    addToCartMutation.mutate({
      courseId: id,
      quantity: 1
    });
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await coursesAPI.delete(courseId);
      toast.success('Course deleted successfully!');
      // Redirect to courses list
      window.location.href = '/courses';
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete course');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: 'badge-success',
      intermediate: 'badge-warning',
      advanced: 'badge-danger',
    };
    return colors[level] || 'badge-secondary';
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error loading course</h3>
        <p className="text-gray-500">Failed to load course details.</p>
        <p className="text-sm text-gray-400 mt-2">Error: {error.message}</p>
      </div>
    );
  }

  if (!course?.course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Course not found</h3>
        <p className="text-gray-500">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  const courseData = course.course;
  
  // RTL language detection
  const isRTL = courseData.language === 'arabic' || courseData.language === 'hebrew' || courseData.language === 'urdu';

  return (
    <div className={`${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{courseData.title}</h1>
            <p className="text-gray-600 mt-2">{courseData.shortDescription}</p>
          </div>
          {/* Action Buttons - Responsive Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowActionsDropdown(!showActionsDropdown);
                }
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Course Actions"
              aria-label="Course actions menu"
              aria-expanded={showActionsDropdown}
              aria-haspopup="true"
            >
              <EllipsisVerticalIcon className="h-6 w-6" />
            </button>
            
            {/* Dropdown Menu */}
            {showActionsDropdown && (
              <div className={`absolute mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 transition-all duration-200 ease-out ${isRTL ? 'left-0' : 'right-0'}`}>
                <div className="py-1">
                  {/* View Content - Always visible */}
                  <Link
                    to={`/courses/${id}/learn`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                    onClick={() => setShowActionsDropdown(false)}
                  >
                    <EyeIcon className="h-5 w-5 mr-3 text-gray-400" />
                    View Content
                  </Link>
                  
                  {/* Manage Content - Trainer/Admin only */}
                  {(isTrainer || isSuperAdmin) && (
                    <Link
                      to={`/courses/${id}/content`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      onClick={() => setShowActionsDropdown(false)}
                    >
                      <CogIcon className="h-5 w-5 mr-3 text-gray-400" />
                      Manage Content
                    </Link>
                  )}
                  
                  {/* Manage Enrollment - Trainer/Admin only */}
                  {(isTrainer || isSuperAdmin) && (
                    <Link
                      to={`/courses/${id}/enrollment`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      onClick={() => setShowActionsDropdown(false)}
                    >
                      <UserPlusIcon className="h-5 w-5 mr-3 text-gray-400" />
                      Manage Enrollment
                    </Link>
                  )}
                  
                  {/* Classroom Sessions - Trainer/Admin only, for classroom/hybrid courses */}
                  {(isTrainer || isSuperAdmin) && (courseData?.courseType === 'classroom' || courseData?.courseType === 'hybrid') && (
                    <Link
                      to={`/courses/${id}/sessions`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      onClick={() => setShowActionsDropdown(false)}
                    >
                      <CalendarDaysIcon className="h-5 w-5 mr-3 text-gray-400" />
                      Classroom Sessions
                    </Link>
                  )}
                  
                  {/* Edit Course - Trainer/Admin only */}
                  {(isTrainer || isSuperAdmin) && (
                    <Link
                      to={`/courses/${id}/edit`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      onClick={() => setShowActionsDropdown(false)}
                    >
                      <PencilIcon className="h-5 w-5 mr-3 text-gray-400" />
                      Edit Course
                    </Link>
                  )}
                  
                  {/* Assign Trainer - Super Admin only */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setShowTrainerModal(true);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      title="Assign Trainer (Super Admin only)"
                    >
                      <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Assign Trainer
                    </button>
                  )}
                  
                  {/* Delete Course - Trainer/Admin only */}
                  {(isTrainer || isSuperAdmin) && (
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        if (window.confirm(`Are you sure you want to delete "${courseData.title}"? This action cannot be undone.`)) {
                          handleDeleteCourse(courseData.id);
                        }
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                      title="Delete Course (Cannot be undone)"
                    >
                      <TrashIcon className="h-5 w-5 mr-3 text-red-400" />
                      Delete Course
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Image */}
          {courseData.thumbnail && (
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={getThumbnailUrl(courseData.thumbnail)}
                alt={courseData.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Course Description */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {courseData.description}
              </p>
            </div>
          </div>

          {/* Course Requirements */}
          {courseData.requirements && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {courseData.requirements}
                </p>
              </div>
            </div>
          )}

          {/* Learning Outcomes */}
          {courseData.learningOutcomes && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What You'll Learn</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {courseData.learningOutcomes}
                </p>
              </div>
            </div>
          )}

          {/* Course Curriculum */}
          {courseData.curriculum && courseData.curriculum.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Curriculum</h2>
              <div className="space-y-3">
                {courseData.curriculum.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{section.title}</h3>
                    {section.lessons && (
                      <ul className="space-y-2">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <li key={lessonIndex} className="flex items-center text-sm text-gray-600">
                            <BookOpenIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {lesson.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            {/* Price and Enrollment */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatPrice(courseData.price)}
              </div>
              {isTrainee && (
                <>
                  {enrollmentLoading ? (
                    <div className="w-full flex justify-center py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : isEnrolled ? (
                    <div className="w-full text-center">
                      {isPendingEnrollment ? (
                        <>
                          <div className="flex items-center justify-center w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg mb-2">
                            <AcademicCapIcon className="h-5 w-5 mr-2" />
                            <span className="font-medium">Enrollment Pending</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            Payment required to access course content
                          </div>
                          <button
                            onClick={handleEnroll}
                            disabled={enrolling}
                            className="w-full btn-secondary"
                          >
                            {enrolling ? <LoadingSpinner size="sm" /> : 'Complete Payment'}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg mb-2">
                            <AcademicCapIcon className="h-5 w-5 mr-2" />
                            <span className="font-medium">Already Enrolled</span>
                          </div>
                          <Link
                            to={`/courses/${id}/learn`}
                            className="w-full btn-primary inline-block text-center"
                          >
                            Continue Learning
                          </Link>
                          {/* Attendance Tracker for classroom courses */}
                          {(courseData?.courseType === 'classroom' || courseData?.courseType === 'hybrid') && (
                            <Link
                              to="/attendance/tracker"
                              className="w-full btn-secondary inline-block text-center mt-2"
                            >
                              <CalendarDaysIcon className="h-4 w-4 mr-2 inline" />
                              Attendance Tracker
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full btn-primary"
                      >
                        {enrolling ? <LoadingSpinner size="sm" /> : 'Enroll Now'}
                      </button>
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="w-full btn-secondary flex items-center justify-center"
                      >
                        {addingToCart ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <ShoppingCartIcon className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Course Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Level</span>
                <span className={`badge ${getLevelColor(courseData.level)}`}>
                  {courseData.level}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm text-gray-900 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatDuration(courseData.duration)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm text-gray-900">{courseData.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Instructor</span>
                <span className="text-sm text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {courseData.trainer?.firstName} {courseData.trainer?.lastName}
                </span>
              </div>

              {courseData.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Rating</span>
                  <span className="text-sm text-gray-900 flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    {courseData.rating} ({courseData.totalRatings})
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Students</span>
                <span className="text-sm text-gray-900 flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  {courseData.enrolledStudents || 0} enrolled
                </span>
              </div>
            </div>

            {/* Course Features */}
            {courseData.tags && courseData.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Course Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {courseData.tags.map((tag, index) => (
                    <span key={index} className="badge badge-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course Dates */}
            {(courseData.startDate || courseData.endDate) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Course Schedule</h3>
                <div className="space-y-2 text-sm">
                  {courseData.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date</span>
                      <span className="text-gray-900">
                        {new Date(courseData.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {courseData.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">End Date</span>
                      <span className="text-gray-900">
                        {new Date(courseData.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainer Assignment Modal */}
      <TrainerAssignmentModal
        isOpen={showTrainerModal}
        onClose={() => setShowTrainerModal(false)}
        courseId={id}
        currentTrainer={courseData?.trainer}
      />
    </div>
  );
};

export default CourseDetail; 