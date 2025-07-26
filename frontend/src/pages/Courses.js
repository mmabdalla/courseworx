import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI } from '../services/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Courses = () => {
  const { user, isTrainer, isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { data: coursesData, isLoading } = useQuery(
    ['courses', { search, category, level, sortBy, sortOrder }],
    () => coursesAPI.getAll({ search, category, level, sortBy, sortOrder }),
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useQuery(
    ['categories'],
    () => coursesAPI.getCategories(),
    { enabled: !isTrainer && !isSuperAdmin }
  );

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

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600">
              {isTrainer || isSuperAdmin 
                ? 'Manage your courses and create new ones'
                : 'Discover and enroll in courses'
              }
            </p>
          </div>
          {(isTrainer || isSuperAdmin) && (
            <Link
              to="/courses/create"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Course
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              className="input-field"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              className="input-field"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="createdAt-DESC">Newest First</option>
              <option value="createdAt-ASC">Oldest First</option>
              <option value="title-ASC">Title A-Z</option>
              <option value="title-DESC">Title Z-A</option>
              <option value="price-ASC">Price Low to High</option>
              <option value="price-DESC">Price High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {coursesData?.courses?.map((course) => (
          <div key={course.id} className="card-hover group">
            <div className="aspect-w-16 aspect-h-9 mb-4">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {course.title}
                </h3>
                <span className={`badge ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2">
                {course.shortDescription || course.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span>{course.trainer?.firstName} {course.trainer?.lastName}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
              </div>

              {course.rating && (
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm text-gray-600">
                    {course.rating} ({course.totalRatings} ratings)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(course.price)}
                </div>
                <Link
                  to={`/courses/${course.id}`}
                  className="btn-primary text-sm"
                >
                  {isTrainer || isSuperAdmin ? 'Edit' : 'View Details'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {coursesData?.courses?.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || category || level
              ? 'Try adjusting your filters'
              : 'Get started by creating your first course'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {coursesData?.pagination && coursesData.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            {/* Add pagination controls here */}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Courses; 