import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, courseContentAPI } from '../services/api';
import {
  ArrowLeftIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon as CertificateIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon as DownloadIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CourseContentViewer = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedContent, setSelectedContent] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [videoProgress, setVideoProgress] = useState({});

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

  // Quiz submission mutation
  const submitQuizMutation = useMutation(
    (data) => courseContentAPI.submitQuiz(id, selectedContent.id, data),
    {
      onSuccess: (data) => {
        setQuizResults(data.results);
        toast.success('Quiz submitted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit quiz');
      },
    }
  );

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = () => {
    if (!selectedContent) return;
    submitQuizMutation.mutate({
      answers: quizAnswers
    });
  };

  const handleVideoProgress = (contentId, progress) => {
    setVideoProgress(prev => ({
      ...prev,
      [contentId]: progress
    }));
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

  const renderContent = (content) => {
    switch (content.type) {
      case 'document':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{content.title}</h3>
              {content.fileUrl && (
                <a
                  href={content.fileUrl}
                  download
                  className="btn-secondary flex items-center"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download
                </a>
              )}
            </div>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {content.fileUrl ? (
              <div className="bg-gray-100 rounded-lg p-4">
                <iframe
                  src={content.fileUrl}
                  className="w-full h-96"
                  title={content.title}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentIcon className="h-16 w-16 mx-auto mb-4" />
                <p>No document file available</p>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {content.fileUrl ? (
              <div className="text-center">
                <img
                  src={content.fileUrl}
                  alt={content.title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PhotoIcon className="h-16 w-16 mx-auto mb-4" />
                <p>No image file available</p>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {content.fileUrl ? (
              <div className="text-center">
                <video
                  controls
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  onTimeUpdate={(e) => {
                    const progress = (e.target.currentTime / e.target.duration) * 100;
                    handleVideoProgress(content.id, progress);
                  }}
                >
                  <source src={content.fileUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4" />
                <p>No video file available</p>
              </div>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            <div className="prose max-w-none">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content.articleContent || 'No content available' }}
              />
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            
            {content.questions && content.questions.length > 0 ? (
              <div className="space-y-6">
                {content.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3 mb-4">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                        <p className="text-sm text-gray-500">Points: {question.points}</p>
                      </div>
                    </div>

                    {question.questionType === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quizAnswers[question.id]?.includes(option) || false}
                              onChange={(e) => {
                                const currentAnswers = quizAnswers[question.id] || [];
                                if (e.target.checked) {
                                  handleQuizAnswer(question.id, [...currentAnswers, option]);
                                } else {
                                  handleQuizAnswer(question.id, currentAnswers.filter(a => a !== option));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.questionType === 'single_choice' && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={quizAnswers[question.id] === option}
                              onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.questionType === 'true_false' && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="true"
                            checked={quizAnswers[question.id] === 'true'}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700">True</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="false"
                            checked={quizAnswers[question.id] === 'false'}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700">False</span>
                        </label>
                      </div>
                    )}

                    {question.questionType === 'text' && (
                      <textarea
                        value={quizAnswers[question.id] || ''}
                        onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter your answer..."
                      />
                    )}

                    {quizResults[question.id] && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        quizResults[question.id].correct 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {quizResults[question.id].correct ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <XMarkIcon className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {quizResults[question.id].correct ? 'Correct!' : 'Incorrect'}
                          </span>
                        </div>
                        {question.explanation && (
                          <p className="mt-2 text-sm">{question.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={submitQuizMutation.isLoading}
                    className="btn-primary"
                  >
                    {submitQuizMutation.isLoading ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4" />
                <p>No questions available for this quiz</p>
              </div>
            )}
          </div>
        );

      case 'certificate':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            <div className="text-center py-8">
              <CertificateIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Certificate template will be displayed here</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Unsupported content type</p>
          </div>
        );
    }
  };

  if (courseLoading || contentLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (!courseData?.course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Course not found</h3>
        <p className="text-gray-500">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  const course = courseData.course;
  const contents = contentData?.contents || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to={`/courses/${id}`}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">Course Content</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Content Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Materials</h2>
            <div className="space-y-2">
              {contents.length > 0 ? (
                contents.map((content, index) => {
                  const IconComponent = getContentTypeIcon(content.type);
                  const isSelected = selectedContent?.id === content.id;
                  const isCompleted = videoProgress[content.id] >= 90; // 90% watched for videos

                  return (
                    <button
                      key={content.id}
                      onClick={() => setSelectedContent(content)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 border' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {content.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getContentTypeLabel(content.type)}
                          </p>
                        </div>
                        {isCompleted && (
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No content available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-3">
          <div className="card">
            {selectedContent ? (
              renderContent(selectedContent)
            ) : (
              <div className="text-center py-12 text-gray-500">
                <EyeIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Content</h3>
                <p className="text-sm">Choose a content item from the sidebar to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContentViewer; 