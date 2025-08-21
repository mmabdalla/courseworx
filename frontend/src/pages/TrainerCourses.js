import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI } from '../services/api';
import {
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TrainerCourses = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // all, published, unpublished

  // Fetch trainer's courses
  const { data: coursesData, isLoading, error } = useQuery(
    ['trainer-courses', filter],
    () => coursesAPI.getTrainerCourses(user?.id, { 
      isPublished: filter === 'all' ? undefined : filter === 'published'
    }),
    { enabled: !!user?.id }
  );

  const handlePublishToggle = async (courseId, currentStatus) => {
    try {
      await coursesAPI.publish(courseId, !currentStatus);
      toast.success(`Course ${currentStatus ? 'unpublished' : 'published'} successfully!`);
      // Refetch the data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update course status');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading courses: {error.message}</div>;

  const courses = coursesData?.courses || [];
  const publishedCount = courses.filter(c => c.isPublished).length;
  const unpublishedCount = courses.filter(c => !c.isPublished).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">Manage your published and unpublished courses</p>
          </div>
          <Link
            to="/courses/create"
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-primary-600" />
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
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-semibold text-gray-900">{publishedCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <p className="text-2xl font-semibold text-gray-900">{unpublishedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Courses ({courses.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'published'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setFilter('unpublished')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'unpublished'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drafts ({unpublishedCount})
            </button>
          </nav>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You haven't created any courses yet."
              : filter === 'published'
              ? "You don't have any published courses."
              : "You don't have any draft courses."
            }
          </p>
          <div className="mt-6">
            <Link to="/courses/create" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create your first course
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Course Image */}
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className={`badge ml-2 ${
                    course.isPublished ? 'badge-success' : 'badge-warning'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {course.shortDescription || course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    <span>{course.enrolledStudents || 0} students</span>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    <span>{course.level || 'Beginner'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                  
                  <Link
                    to={`/courses/${course.id}/edit`}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                </div>

                {/* Publish/Unpublish Toggle */}
                <button
                  onClick={() => handlePublishToggle(course.id, course.isPublished)}
                  className={`w-full btn-sm ${
                    course.isPublished 
                      ? 'btn-warning' 
                      : 'btn-success'
                  }`}
                >
                  {course.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerCourses;
