import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { courseContentAPI } from '../services/api';
import {
  PlusIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, DocumentTextIcon,
  QuestionMarkCircleIcon, AcademicCapIcon, TrashIcon, PencilIcon,
  ArrowLeftIcon, XMarkIcon, PlusIcon as AddIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CourseContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTrainer, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // State for modals and forms
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [showQuizQuestionsModal, setShowQuizQuestionsModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '', description: '', type: 'document', order: 0, points: 0,
    isRequired: true, isPublished: true, articleContent: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    questionType: 'single_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
    order: 0
  });

  // Get course content
  const { data: contentData, isLoading: contentLoading, error: contentError } = useQuery(
    ['course-content', id],
    () => courseContentAPI.getAll(id),
    {
      enabled: !!id,
      onError: (error) => {
        console.error('Error fetching content:', error);
      }
    }
  );

  // Mutations for CRUD operations
  const createContentMutation = useMutation(
    (data) => courseContentAPI.create(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        setShowAddContentModal(false);
        resetContentForm();
        toast.success('Content added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add content');
      },
    }
  );

  const updateContentMutation = useMutation(
    ({ contentId, data }) => courseContentAPI.update(id, contentId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        setShowEditContentModal(false);
        setEditingContent(null);
        resetContentForm();
        toast.success('Content updated successfully!');
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
    ({ file, contentType }) => courseContentAPI.uploadFile(id, file, contentType),
    {
      onSuccess: (data) => {
        setContentForm(prev => ({
          ...prev,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          fileType: data.fileType
        }));
        setUploadingFile(false);
        setSelectedFile(null);
        toast.success('File uploaded successfully!');
      },
      onError: (error) => {
        setUploadingFile(false);
        toast.error(error.response?.data?.error || 'Failed to upload file');
      },
    }
  );

  const addQuizQuestionsMutation = useMutation(
    ({ contentId, questions }) => courseContentAPI.addQuizQuestions(id, contentId, questions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', id]);
        setShowQuizQuestionsModal(false);
        setQuizQuestions([]);
        setCurrentQuestion({
          question: '',
          questionType: 'single_choice',
          options: ['', '', '', ''],
          correctAnswer: '',
          points: 1,
          explanation: '',
          order: 0
        });
        toast.success('Quiz questions added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add quiz questions');
      },
    }
  );

  // Handlers for form changes, add/edit/delete, file upload
  const handleContentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetContentForm = () => {
    setContentForm({
      title: '', description: '', type: 'document', order: 0, points: 0,
      isRequired: true, isPublished: true, articleContent: '',
    });
    setSelectedFile(null);
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    createContentMutation.mutate(contentForm);
  };

  const handleEditContent = async (e) => {
    e.preventDefault();
    updateContentMutation.mutate({
      contentId: editingContent.id,
      data: contentForm
    });
  };

  const handleDeleteContent = (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const handleEditContentClick = (content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title,
      description: content.description,
      type: content.type,
      order: content.order,
      points: content.points,
      isRequired: content.isRequired,
      isPublished: content.isPublished,
      articleContent: content.articleContent || '',
    });
    setShowEditContentModal(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('contentType', contentForm.type);
    uploadFileMutation.mutate({ file: formData, contentType: contentForm.type });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      document: DocumentIcon,
      image: PhotoIcon,
      video: VideoCameraIcon,
      article: DocumentTextIcon,
      quiz: QuestionMarkCircleIcon,
      certificate: AcademicCapIcon,
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

  // Quiz question handlers
  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (currentQuestion.questionType !== 'text' && currentQuestion.options.filter(opt => opt.trim()).length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    if (!currentQuestion.correctAnswer.trim()) {
      toast.error('Please specify the correct answer');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now(), // Temporary ID for frontend
      order: quizQuestions.length
    };

    setQuizQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion({
      question: '',
      questionType: 'single_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
      order: 0
    });
  };

  const removeQuestion = (index) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddQuizQuestions = (contentId) => {
    if (quizQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    addQuizQuestionsMutation.mutate({
      contentId,
      questions: quizQuestions
    });
  };

  const openQuizQuestionsModal = (content) => {
    setEditingContent(content);
    setQuizQuestions(content.questions || []);
    setShowQuizQuestionsModal(true);
  };

  if (!isTrainer && !isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to manage course content.</p>
      </div>
    );
  }

  if (contentLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (contentError) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading content: {contentError.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/courses/${id}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
              <p className="text-gray-600">Manage course materials</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Course Materials
          {contentData?.contents && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({contentData.contents.length} items)
            </span>
          )}
        </h2>

        {contentData?.contents && contentData.contents.length > 0 ? (
          <div className="space-y-4">
            {contentData.contents.map((content) => {
              const IconComponent = getContentTypeIcon(content.type);
              return (
                <div key={content.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <IconComponent className="h-8 w-8 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{content.title}</h3>
                        <p className="text-sm text-gray-500">{getContentTypeLabel(content.type)}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">Order: {content.order}</span>
                          <span className="text-xs text-gray-500">Points: {content.points}</span>
                          {content.isRequired && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                          )}
                          {content.isPublished ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Published</span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Draft</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {content.type === 'quiz' && (
                        <button
                          onClick={() => openQuizQuestionsModal(content)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Manage Questions"
                        >
                          <QuestionMarkCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditContentClick(content)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No content available</p>
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
                    Content Type
                  </label>
                  <select
                    name="type"
                    value={contentForm.type}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
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
                    placeholder="Enter content description"
                  />
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
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      checked={contentForm.isRequired}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={contentForm.isPublished}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Published</span>
                  </label>
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

              {/* Quiz Questions */}
              {contentForm.type === 'quiz' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Questions
                  </label>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600 mb-3">
                        Quiz questions can be added after creating the quiz content.
                      </p>
                    </div>
                  </div>
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
                    Content Type
                  </label>
                  <select
                    name="type"
                    value={contentForm.type}
                    onChange={handleContentFormChange}
                    className="input-field w-full"
                    disabled
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
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
                    placeholder="Enter content description"
                  />
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
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      checked={contentForm.isRequired}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={contentForm.isPublished}
                      onChange={handleContentFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Published</span>
                  </label>
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

      {/* Quiz Questions Modal */}
      {showQuizQuestionsModal && editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Manage Quiz Questions: {editingContent.title}
              </h2>
              <button
                onClick={() => {
                  setShowQuizQuestionsModal(false);
                  setEditingContent(null);
                  setQuizQuestions([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Question Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Question</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <textarea
                    name="question"
                    value={currentQuestion.question}
                    onChange={handleQuestionFormChange}
                    className="input-field w-full"
                    rows={3}
                    placeholder="Enter your question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    name="questionType"
                    value={currentQuestion.questionType}
                    onChange={handleQuestionFormChange}
                    className="input-field w-full"
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>

                {['single_choice', 'multiple_choice'].includes(currentQuestion.questionType) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="input-field w-full"
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  {currentQuestion.questionType === 'true_false' ? (
                    <select
                      name="correctAnswer"
                      value={currentQuestion.correctAnswer}
                      onChange={handleQuestionFormChange}
                      className="input-field w-full"
                    >
                      <option value="">Select correct answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : currentQuestion.questionType === 'text' ? (
                    <input
                      type="text"
                      name="correctAnswer"
                      value={currentQuestion.correctAnswer}
                      onChange={handleQuestionFormChange}
                      className="input-field w-full"
                      placeholder="Sample correct answer (optional)"
                    />
                  ) : (
                    <select
                      name="correctAnswer"
                      value={currentQuestion.correctAnswer}
                      onChange={handleQuestionFormChange}
                      className="input-field w-full"
                    >
                      <option value="">Select correct answer</option>
                      {currentQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={currentQuestion.points}
                    onChange={handleQuestionFormChange}
                    className="input-field w-full"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <textarea
                    name="explanation"
                    value={currentQuestion.explanation}
                    onChange={handleQuestionFormChange}
                    className="input-field w-full"
                    rows={2}
                    placeholder="Explain why this is the correct answer..."
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-primary w-full"
                >
                  <AddIcon className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Questions ({quizQuestions.length})
                </h3>
                
                {quizQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {quizQuestions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                        <p className="text-sm text-gray-500 mb-2">
                          Type: {question.questionType.replace('_', ' ')} | Points: {question.points}
                        </p>
                        {question.options && question.options.filter(opt => opt.trim()).length > 0 && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">Options:</p>
                            <ul className="list-disc list-inside">
                              {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                                <li key={optIndex} className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>No questions added yet</p>
                  </div>
                )}

                {quizQuestions.length > 0 && (
                  <button
                    onClick={() => handleAddQuizQuestions(editingContent.id)}
                    disabled={addQuizQuestionsMutation.isLoading}
                    className="btn-primary w-full"
                  >
                    {addQuizQuestionsMutation.isLoading ? 'Saving...' : 'Save Questions'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent; 