import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, courseContentAPI } from '../services/api';
import {
  PlusIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon as CertificateIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CourseContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTrainer, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Content management state
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    type: 'document',
    order: 0,
    points: 0,
    isRequired: true,
    isPublished: true,
    articleContent: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Get course details
  const { data: courseData, isLoading: courseLoading } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { enabled: !!id }
  );

  // Get course content
  const { data: contentData, isLoading: contentLoading } = useQuery(
    ['course-content', id],
    () => courseContentAPI.getAll(id),
    { enabled: !!id }
  );

  // Content management mutations
  const createContentMutation = useMutation(
    (data) => courseContentAPI.create(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        toast.success('Content added successfully!');
        setShowAddContentModal(false);
        resetContentForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add content');
      },
    }
  );

  const updateContentMutation = useMutation(
    (data) => courseContentAPI.update(id, editingContent.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        toast.success('Content updated successfully!');
        setShowEditContentModal(false);
        setEditingContent(null);
        resetContentForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update content');
      },
    }
  );

  const deleteContentMutation = useMutation(
    (contentId) => courseContentAPI.delete(id, contentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        toast.success('Content deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete content');
      },
    }
  );

  const uploadFileMutation = useMutation(
    ({ contentType, file, contentId }) => courseContentAPI.uploadFile(id, contentType, file, contentId),
    {
      onSuccess: (data) => {
        toast.success('File uploaded successfully!');
        setSelectedFile(null);
        setUploadingFile(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to upload file');
        setUploadingFile(false);
      },
    }
  );

  // Content management handlers
  const handleContentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetContentForm = () => {
    setContentForm({
      title: '',
      description: '',
      type: 'document',
      order: 0,
      points: 0,
      isRequired: true,
      isPublished: true,
      articleContent: '',
    });
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    createContentMutation.mutate(contentForm);
  };

  const handleEditContent = async (e) => {
    e.preventDefault();
    updateContentMutation.mutate(contentForm);
  };

  const handleDeleteContent = (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const handleEditContentClick = (content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title || '',
      description: content.description || '',
      type: content.type || 'document',
      order: content.order || 0,
      points: content.points || 0,
      isRequired: content.isRequired !== undefined ? content.isRequired : true,
      isPublished: content.isPublished !== undefined ? content.isPublished : true,
      articleContent: content.articleContent || '',
    });
    setShowEditContentModal(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploadingFile(true);
    uploadFileMutation.mutate({
      contentType: contentForm.type,
      file: selectedFile,
      contentId: editingContent?.id || null
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      document: DocumentIcon,
      image: PhotoIcon,
      video: VideoCameraIcon,
      article: DocumentTextIcon,
      quiz: QuestionMarkCircleIcon,
      certificate: CertificateIcon,
    };
    return icons[type] || DocumentIcon;
  };

  const getContentTypeLabel = (type) => {
    const labels = {
      document: 'Document',
      image: 'Image',
      video: 'Video',
      article: 'Article',
      quiz: 'Quiz',
      certificate: 'Certificate',
    };
    return labels[type] || 'Document';
  };

  if (!isTrainer && !isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to manage course content.</p>
      </div>
    );
  }

  if (courseLoading || contentLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/courses/${id}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
              <p className="text-gray-600">
                {courseData?.course?.title} - Manage course materials
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddContentModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Content
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Course Materials</h2>
          <div className="text-sm text-gray-500">
            {contentData?.contents?.length || 0} items
          </div>
        </div>

        {contentData?.contents?.length > 0 ? (
          <div className="space-y-4">
            {contentData.contents.map((content) => {
              const IconComponent = getContentTypeIcon(content.type);
              return (
                <div key={content.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <IconComponent className="h-8 w-8 text-gray-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{content.title}</h4>
                        <p className="text-sm text-gray-600">{getContentTypeLabel(content.type)}</p>
                        {content.description && (
                          <p className="text-sm text-gray-500 mt-1">{content.description}</p>
                        )}
                        {content.fileUrl && (
                          <p className="text-xs text-blue-600 mt-1">File attached</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          Order: {content.order}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          Points: {content.points}
                        </span>
                        {content.isRequired && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                        {content.isPublished ? (
                          <EyeIcon className="h-4 w-4 text-green-600" title="Published" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Unpublished" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditContentClick(content)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit content"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContent(content.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete content"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-sm">Start building your course by adding content</p>
          </div>
        )}
      </div>

      {/* Add Content Modal */}
      {showAddContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Course Content</h2>
              <button
                onClick={() => {
                  setShowAddContentModal(false);
                  resetContentForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddContent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={contentForm.title}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={contentForm.description}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    rows={3}
                    placeholder="Brief description of this content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type *
                  </label>
                  <select
                    name="type"
                    value={contentForm.type}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={contentForm.order}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={contentForm.points}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      checked={contentForm.isRequired}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Required content
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={contentForm.isPublished}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Published
                    </label>
                  </div>
                </div>
              </div>

              {/* Article Content */}
              {contentForm.type === 'article' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content
                  </label>
                  <textarea
                    name="articleContent"
                    value={contentForm.articleContent}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    rows={8}
                    placeholder="Write your article content here..."
                  />
                </div>
              )}

              {/* File Upload for Document, Image, Video */}
              {['document', 'image', 'video'].includes(contentForm.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="input-field w-full"
                    accept={
                      contentForm.type === 'document' 
                        ? '.pdf,.doc,.docx,.txt'
                        : contentForm.type === 'image'
                        ? 'image/*'
                        : 'video/*'
                    }
                  />
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                        className="btn-secondary mt-2"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContentModal(false);
                    resetContentForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createContentMutation.isLoading}
                  className="btn-primary"
                >
                  {createContentMutation.isLoading ? 'Adding...' : 'Add Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {showEditContentModal && editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Course Content</h2>
              <button
                onClick={() => {
                  setShowEditContentModal(false);
                  setEditingContent(null);
                  resetContentForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditContent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={contentForm.title}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={contentForm.description}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    rows={3}
                    placeholder="Brief description of this content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type *
                  </label>
                  <select
                    name="type"
                    value={contentForm.type}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={contentForm.order}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={contentForm.points}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      checked={contentForm.isRequired}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Required content
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={contentForm.isPublished}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Published
                    </label>
                  </div>
                </div>
              </div>

              {/* Article Content */}
              {contentForm.type === 'article' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content
                  </label>
                  <textarea
                    name="articleContent"
                    value={contentForm.articleContent}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    rows={8}
                    placeholder="Write your article content here..."
                  />
                </div>
              )}

              {/* File Upload for Document, Image, Video */}
              {['document', 'image', 'video'].includes(contentForm.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="input-field w-full"
                    accept={
                      contentForm.type === 'document' 
                        ? '.pdf,.doc,.docx,.txt'
                        : contentForm.type === 'image'
                        ? 'image/*'
                        : 'video/*'
                    }
                  />
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                        className="btn-secondary mt-2"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditContentModal(false);
                    setEditingContent(null);
                    resetContentForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateContentMutation.isLoading}
                  className="btn-primary"
                >
                  {updateContentMutation.isLoading ? 'Updating...' : 'Update Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent; 