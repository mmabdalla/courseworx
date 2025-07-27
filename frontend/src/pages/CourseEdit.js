import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI } from '../services/api';
import {
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CourseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTrainer, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  // Course image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    setImageFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const handleImageUpload = async () => {
    if (!imageFile || !formData?.title) return;
    setUploadingImage(true);
    try {
      await coursesAPI.uploadCourseImage(formData.title.replace(/\s+/g, '-').toLowerCase(), imageFile);
      toast.success('Course image uploaded!');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { enabled: !!id }
  );

  useEffect(() => {
    if (courseData && courseData.course) {
      const c = courseData.course;
      setFormData({
        title: c.title || '',
        description: c.description || '',
        shortDescription: c.shortDescription || '',
        price: c.price || 0,
        duration: c.duration || '',
        level: c.level || 'beginner',
        category: c.category || '',
        tags: c.tags ? c.tags.join(', ') : '',
        requirements: c.requirements || '',
        learningOutcomes: c.learningOutcomes || '',
        maxStudents: c.maxStudents || '',
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        isPublished: c.isPublished || false,
        isFeatured: c.isFeatured || false,
      });
    }
  }, [courseData]);

  const updateCourseMutation = useMutation(
    (data) => coursesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses']);
        queryClient.invalidateQueries(['course', id]);
        toast.success('Course updated successfully!');
        navigate(`/courses/${id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update course');
        setLoading(false);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const courseData = {
      ...formData,
      price: parseFloat(formData.price),
      duration: formData.duration ? parseInt(formData.duration) : null,
      maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };
    updateCourseMutation.mutate(courseData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isTrainer && !isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to edit courses.</p>
      </div>
    );
  }

  if (isLoading || !formData) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center">
          <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600">Update the details below and save your changes</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter course title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Brief description (max 500 characters)"
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                rows={4}
                placeholder="Detailed course description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., Programming, Design, Business"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing and Duration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Duration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., 120"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <div className="relative">
                <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., 50"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                className="input-field"
                rows={3}
                placeholder="What students need to know before taking this course"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Outcomes
              </label>
              <textarea
                name="learningOutcomes"
                value={formData.learningOutcomes}
                onChange={handleInputChange}
                className="input-field"
                rows={3}
                placeholder="What students will learn from this course"
              />
            </div>
          </div>
        </div>

        {/* Publishing Options */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Publishing Options</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Publish course immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Feature this course
              </label>
            </div>
          </div>
        </div>

        {/* Course Image Upload */}
        <div className="card mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Course Image</h3>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-4 h-32 object-contain rounded" />
          )}
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={handleImageUpload}
            disabled={!imageFile || uploadingImage}
          >
            {uploadingImage ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseEdit; 