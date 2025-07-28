import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, enrollmentsAPI } from '../services/api';
import {
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  BookOpenIcon,
  CogIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import TrainerAssignmentModal from '../components/TrainerAssignmentModal';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isTrainee, isTrainer, isSuperAdmin } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: course, isLoading, error } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { 
      enabled: !!id,
      retry: 1,
      retryDelay: 1000
    }
  );

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

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses');
      return;
    }

    setEnrolling(true);
    enrollmentMutation.mutate({
      courseId: id,
      paymentAmount: courseData.price,
    });
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

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{courseData.title}</h1>
            <p className="text-gray-600 mt-2">{courseData.shortDescription}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/courses/${id}/learn`}
              className="btn-primary flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View Content
            </Link>
            {(isTrainer || isSuperAdmin) && (
              <Link
                to={`/courses/${id}/content`}
                className="btn-secondary flex items-center"
              >
                <CogIcon className="h-5 w-5 mr-2" />
                Manage Content
              </Link>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => setShowTrainerModal(true)}
                className="btn-secondary flex items-center"
                title="Assign Trainer (Super Admin only)"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Assign Trainer
              </button>
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
                src={courseData.thumbnail}
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
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full btn-primary"
                >
                  {enrolling ? <LoadingSpinner size="sm" /> : 'Enroll Now'}
                </button>
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