import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { courseContentAPI, coursesAPI } from '../services/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { getFileServingUrl, getBestImageUrl } from '../utils/imageUtils';



const LessonDetail = () => {
  const { courseId, contentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useQuery(
    ['course', courseId],
    () => coursesAPI.getById(courseId),
    { enabled: !!courseId }
  );

  // Fetch lesson content details
  const { data: contentData, isLoading: contentLoading } = useQuery(
    ['lesson-detail', courseId, contentId],
    () => courseContentAPI.getById(courseId, contentId),
    { enabled: !!courseId && !!contentId }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    () => courseContentAPI.delete(courseId, contentId),
    {
      onSuccess: () => {
        toast.success('Lesson deleted successfully!');
        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
        navigate(`/courses/${courseId}/content`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete lesson');
      }
    }
  );

  // Toggle publish mutation
  const togglePublishMutation = useMutation(
    (isPublished) => courseContentAPI.update(courseId, contentId, { isPublished }),
    {
      onSuccess: (data, isPublished) => {
        toast.success(`Lesson ${isPublished ? 'published' : 'unpublished'} successfully!`);
        queryClient.invalidateQueries(['lesson-detail', courseId, contentId]);
        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update lesson');
      }
    }
  );

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'document': return <DocumentIcon className="h-6 w-6" />;
      case 'image': return <PhotoIcon className="h-6 w-6" />;
      case 'video': return <VideoCameraIcon className="h-6 w-6" />;
      case 'article': return <DocumentTextIcon className="h-6 w-6" />;
      case 'quiz': return <QuestionMarkCircleIcon className="h-6 w-6" />;
      case 'certificate': return <AcademicCapIcon className="h-6 w-6" />;
      default: return <DocumentIcon className="h-6 w-6" />;
    }
  };

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'document': return 'text-green-600 bg-green-100';
      case 'image': return 'text-blue-600 bg-blue-100';
      case 'video': return 'text-purple-600 bg-purple-100';
      case 'article': return 'text-orange-600 bg-orange-100';
      case 'quiz': return 'text-red-600 bg-red-100';
      case 'certificate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (courseLoading || contentLoading) {
    return <LoadingSpinner />;
  }

  if (!contentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lesson could not be found.</p>
          <Link
            to={`/courses/${courseId}/content`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Course Content
          </Link>
        </div>
      </div>
    );
  }

  const content = contentData.content || contentData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/courses/${courseId}/content`)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
                title="Back to Course Content"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">{content?.title || 'Loading...'}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/courses/${courseId}/learn?content=${contentId}`}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </Link>
              <button
                onClick={() => togglePublishMutation.mutate(!content.isPublished)}
                disabled={togglePublishMutation.isLoading}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  content.isPublished 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {content.isPublished ? (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    {togglePublishMutation.isLoading ? 'Unpublishing...' : 'Unpublish'}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    {togglePublishMutation.isLoading ? 'Publishing...' : 'Publish'}
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/courses/${courseId}/content?edit=${contentId}`)}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getContentTypeColor(content.type)}`}>
                    {getContentTypeIcon(content.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
                    <p className="text-gray-600 capitalize">{content.type} Content</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {content.isPublished ? (
                    <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Draft
                    </span>
                  )}
                  {content.isRequired && (
                    <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-sm">
                      Required
                    </span>
                  )}
                </div>
              </div>

              {content.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{content.description}</p>
                </div>
              )}

              {/* Article Content */}
              {content.type === 'article' && (content.content || content.articleContent) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Article Content</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: typeof content.content === 'string' ? content.content : 
                               typeof content.articleContent === 'string' ? content.articleContent :
                               JSON.stringify(content.content || content.articleContent)
                      }} 
                    />
                  </div>
                </div>
              )}

              {/* File Information */}
              {['document', 'image', 'video'].includes(content.type) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">File Information</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    {content.fileUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">File URL:</span>
                          <span className="text-sm text-blue-600 font-mono break-all">{content.fileUrl}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">File Type:</span>
                          <span className="text-sm text-gray-900">{content.fileType || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">File Size:</span>
                          <span className="text-sm text-gray-900">{formatFileSize(content.fileSize)}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">File Preview:</p>
                          {content.type === 'image' && (
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                              <img 
                                src={getBestImageUrl(content.fileUrl)} 
                                alt={content.title}
                                className="w-full max-h-96 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
                                }}
                              />
                              <div className="hidden p-4 text-center text-red-600">
                                <XCircleIcon className="h-8 w-8 mx-auto mb-2" />
                                <p>Image failed to load</p>
                                <p className="text-sm text-gray-500">Check file path: {getFileServingUrl(content.fileUrl)}</p>
                              </div>
                            </div>
                          )}
                          {content.type === 'video' && (
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                              <video 
                                controls 
                                className="w-full max-h-96"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
                                }}
                              >
                                <source src={getFileServingUrl(content.fileUrl)} type={content.fileType || "video/mp4"} />
                                Your browser does not support the video tag.
                              </video>
                              <div className="hidden p-4 text-center text-red-600">
                                <XCircleIcon className="h-8 w-8 mx-auto mb-2" />
                                <p>Video failed to load</p>
                                <p className="text-sm text-gray-500">Check file path: {getFileServingUrl(content.fileUrl)}</p>
                              </div>
                            </div>
                          )}
                          {content.type === 'document' && (
                            <div className="space-y-2">
                              <a
                                href={getFileServingUrl(content.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <DocumentIcon className="h-4 w-4 mr-2" />
                                Open Document
                              </a>
                              {content.fileType === 'application/pdf' && (
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                  <iframe
                                    src={getFileServingUrl(content.fileUrl)}
                                    className="w-full h-96"
                                    title={content.title}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="text-gray-600">No file uploaded for this {content.type} content.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz Information */}
              {content.type === 'quiz' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Information</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Points:</span>
                        <span className="ml-2 text-sm text-gray-900">{content.points || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Questions:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {content.quizData?.questions?.length || 0}
                        </span>
                      </div>
                    </div>
                    {content.quizData?.questions?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Questions:</p>
                        <div className="space-y-2">
                          {content.quizData.questions.map((question, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium">Q{index + 1}: {question.question}</p>
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optionIndex) => (
                                  <div 
                                    key={optionIndex}
                                    className={`text-xs px-2 py-1 rounded ${
                                      optionIndex === question.correctAnswer 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {option} {optionIndex === question.correctAnswer && '✓'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Raw Data (for debugging) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Data (Debug)</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
                <pre>{JSON.stringify(content, null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order:</span>
                  <span className="text-sm font-medium">{content.order || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Points:</span>
                  <span className="text-sm font-medium">{content.points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Required:</span>
                  <span className={`text-sm font-medium ${content.isRequired ? 'text-green-600' : 'text-gray-400'}`}>
                    {content.isRequired ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Published:</span>
                  <span className={`text-sm font-medium ${content.isPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                    {content.isPublished ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium">{formatDate(content.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Updated:</span>
                    <span className="text-sm font-medium">{formatDate(content.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Course Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Course:</span>
                  <p className="text-sm font-medium">{courseData?.course?.title || courseData?.title || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Section:</span>
                  <p className="text-sm font-medium">{content.sectionId || 'Uncategorized'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/courses/${courseId}/learn?content=${contentId}`}
                  className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View in Learning Page
                </Link>
                <button
                  onClick={() => togglePublishMutation.mutate(!content.isPublished)}
                  disabled={togglePublishMutation.isLoading}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                    content.isPublished 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {content.isPublished ? (
                    <>
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      {togglePublishMutation.isLoading ? 'Unpublishing...' : 'Unpublish'}
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      {togglePublishMutation.isLoading ? 'Publishing...' : 'Publish'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/courses/${courseId}/content?edit=${contentId}`)}
                  className="w-full flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Content
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Content
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Lesson</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{content.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetail;
