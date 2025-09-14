import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { coursesAPI, lessonCompletionAPI, courseSectionAPI, courseContentAPI, courseStatsAPI, userNotesAPI } from '../services/api';
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon as CertificateIcon,
  ArrowDownTrayIcon as DownloadIcon,
  Bars3Icon,
  ShareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import CourseSidebar from '../components/CourseSidebar';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getFileServingUrl, getBestImageUrl, getMediaUrl } from '../utils/imageUtils';
import ProfessionalVideoPlayer from '../components/ProfessionalVideoPlayer';



// Import hooks and components for content management
import { useSectionManagement } from '../hooks/useSectionManagement';
import { useContentManagement } from '../hooks/useContentManagement';
import { useFileUpload } from '../hooks/useFileUpload';
import AddSectionModal from '../components/modals/AddSectionModal';
import AddContentModal from '../components/modals/AddContentModal';

const CourseContentViewer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedContent, setSelectedContent] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [courseProgress, setCourseProgress] = useState({
    progress: 0,
    totalLessons: 0,
    completedLessons: 0
  });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Show sidebar by default on desktop
  const [activeTab, setActiveTab] = useState('overview');
  const [courseStats, setCourseStats] = useState(null);
  const [userNotes, setUserNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');

  // Modal states for content management (only for trainers)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);

  // Content and section management hooks (always called, but only used for trainers)
  const sectionManagement = useSectionManagement(id);
  const contentManagement = useContentManagement(id);
  const fileUpload = useFileUpload(id, contentManagement.setContentForm, contentManagement.setSelectedFile);

  // Get course details
  const { data: courseData, isLoading: courseLoading } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { enabled: !!id }
  );



  // Get course sections with content
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery(
    ['course-sections', id],
    () => courseSectionAPI.getAll(id),
    { enabled: !!id }
  );

  // Get all course content (including uncategorized)
  const { data: allContentData, isLoading: contentLoading } = useQuery(
    ['course-content', id],
    () => courseContentAPI.getAll(id),
    { enabled: !!id }
  );

  // Set enrollment status based on user role and course access
  useEffect(() => {
    if (user?.role === 'trainer' || user?.role === 'super_admin') {
      // Trainers and admins are always considered "enrolled" for course management
      setIsEnrolled(true);
    } else if (user?.role === 'trainee') {
      // For trainees, if they can access this page, they are enrolled
      // This should not be overridden by course progress query failures
      setIsEnrolled(true);
    }
  }, [user?.role]);

  // Get course progress
  const { isLoading: progressLoading } = useQuery(
    ['course-progress', id],
    () => lessonCompletionAPI.getProgress(id),
    { 
      enabled: !!id && user?.role !== 'trainer', // Don't call for trainers
      retry: false, // Don't retry failed requests
      onSuccess: (data) => {
        setCourseProgress({
          progress: data.progress || 0,
          totalLessons: data.totalLessons || 0,
          completedLessons: data.completedLessons || 0
        });
        // Don't override enrollment status - if we can access this page, user is enrolled
      },
      onError: (error) => {
        // Set default progress values but don't change enrollment status
        setCourseProgress({
          progress: 0,
          totalLessons: 0,
          completedLessons: 0
        });
        // Don't set isEnrolled to false - if user can access this page, they are enrolled
      }
    }
  );

  // Get course statistics
  const { isLoading: statsLoading } = useQuery(
    ['course-stats', id],
    () => courseStatsAPI.getByCourseId(id),
    { 
      enabled: !!id,
      onSuccess: (data) => {
        setCourseStats(data);
      }
    }
  );

  // Get user notes for the course
  const { isLoading: notesLoading } = useQuery(
    ['user-notes', id],
    () => userNotesAPI.getByCourseId(id),
    { 
      enabled: !!id,
      onSuccess: (data) => {
        const notesMap = {};
        // Handle different data formats - check if data is an array or has a data property
        const notesArray = Array.isArray(data) ? data : (data?.data || []);
        
        if (Array.isArray(notesArray)) {
          notesArray.forEach(note => {
            const key = note.contentId || 'course';
            if (!notesMap[key]) notesMap[key] = {};
            notesMap[key][note.tabType] = note;
          });
        }
        setUserNotes(notesMap);
      }
    }
  );

  // Quiz submission mutation
  const submitQuizMutation = useMutation(
    (data) => lessonCompletionAPI.submitQuiz(data),
    {
      onSuccess: (data) => {
        setQuizResults(data);
        toast.success('Quiz submitted successfully!');
      },
      onError: (error) => {
        toast.error('Failed to submit quiz. Please try again.');
        console.error('Quiz submission error:', error);
      }
    }
  );

  // Mark lesson as completed
  const markCompletedMutation = useMutation(
    (data) => lessonCompletionAPI.markCompleted(data),
    {
      onSuccess: () => {
        toast.success('Lesson marked as completed!');
        // Refresh progress data
        window.location.reload();
      },
      onError: (error) => {
        toast.error('Failed to mark lesson as completed.');
        console.error('Mark completed error:', error);
      }
    }
  );

  // Create/Update user note
  const saveNoteMutation = useMutation(
    (data) => {
      if (data.noteId) {
        return userNotesAPI.update(data.noteId, data);
      } else {
        return userNotesAPI.create(data.courseId, data);
      }
    },
    {
      onSuccess: (data) => {
        toast.success('Note saved successfully!');
        // Refresh notes data
        window.location.reload();
      },
      onError: (error) => {
        toast.error('Failed to save note.');
        console.error('Save note error:', error);
      }
    }
  );

  useEffect(() => {
    if (sectionsData && sectionsData.length > 0 && !selectedContent) {
      // Auto-select first content item
      const firstSection = sectionsData[0];
      if (firstSection.contents && firstSection.contents.length > 0) {
        setSelectedContent(firstSection.contents[0]);
      }
    }
  }, [sectionsData, selectedContent]);

  // Set default progress for trainers
  useEffect(() => {
    if (user?.role === 'trainer') {
      setCourseProgress({
        progress: 0,
        totalLessons: 0,
        completedLessons: 0
      });
    }
  }, [user?.role]);

  // Merge sections with uncategorized content
  const sections = React.useMemo(() => {
    const baseSections = sectionsData?.sections || [];
    const allContent = allContentData?.contents || [];
    
    // Find content that's not assigned to any section
    const sectionContentIds = new Set();
    baseSections.forEach(section => {
      if (section.contents) {
        section.contents.forEach(content => sectionContentIds.add(content.id));
      }
    });
    
    const uncategorizedContent = allContent.filter(content => !sectionContentIds.has(content.id));
    
    // If there's uncategorized content, add it as a virtual section
    const sectionsWithUncategorized = [...baseSections];
    if (uncategorizedContent.length > 0) {
      sectionsWithUncategorized.push({
        id: 'uncategorized',
        title: 'Uncategorized Content',
        description: 'Content not assigned to any section',
        contents: uncategorizedContent,
        isVirtual: true
      });
    }
    
    return sectionsWithUncategorized;
  }, [sectionsData, allContentData]);

  // Auto-select content based on URL parameter
  useEffect(() => {
    const contentParam = searchParams.get('content');
    if (contentParam && sections.length > 0) {
      // Find the content in all sections
      let foundContent = null;
      for (const section of sections) {
        if (section.contents) {
          foundContent = section.contents.find(content => content.id === contentParam);
          if (foundContent) break;
        }
      }
      if (foundContent) {
        setSelectedContent(foundContent);
      }
    }
  }, [searchParams, sections]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoProgress = (contentId, progress) => {
    setVideoProgress(prev => ({
      ...prev,
      [contentId]: progress
    }));

    // Only auto-mark as completed if user is enrolled (has progress data) and is not a trainer
    if (courseProgress.totalLessons > 0 && user?.role !== 'trainer' && ((progress >= 90 && !videoProgress[contentId]) || videoProgress[contentId] < 90)) {
      markCompletedMutation.mutate({
        courseId: id,
        contentId,
        userId: user?.id,
        progress: 100
      });
    }
  };

  const handleQuizSubmit = (contentId) => {
    const answers = quizAnswers[contentId] || {};
    submitQuizMutation.mutate({
      courseId: id,
      contentId,
      userId: user?.id,
      answers
    });
  };

  const handleNotesChange = (contentId, tabType, value) => {
    setCurrentNote(value);
  };

  const handleSaveNotes = (contentId, tabType) => {
    const noteContent = currentNote.trim();
    if (!noteContent) {
      toast.error('Please enter some notes before saving.');
      return;
    }

    const existingNote = userNotes[contentId]?.[tabType];
    const noteData = {
      courseId: id,
      contentId: contentId || null,
      notes: noteContent,
      tabType,
      isPublic: false
    };

    if (existingNote) {
      noteData.noteId = existingNote.id;
    }

    saveNoteMutation.mutate(noteData);
  };

  const getCurrentNote = (contentId, tabType) => {
    return userNotes[contentId]?.[tabType]?.notes || '';
  };

  const renderContent = (content) => {
    switch (content.type) {
      case 'video':
        return (
          <div className="space-y-6 -mx-6">
            {/* Secure Video Player - Responsive width based on sidebar state */}
            <div className="w-full bg-black overflow-hidden">
              {content.fileUrl ? (
                <ProfessionalVideoPlayer
                  videoUrl={getMediaUrl(content.fileUrl)}
                  title={content.title}
                  onVideoStart={() => {
                    // Auto-close sidebar when video starts
                    setSidebarOpen(false);
                  }}
                  onSidebarToggle={(isOpen) => {
                    setSidebarOpen(isOpen);
                  }}
                  onVideoProgress={(progress) => {
                    handleVideoProgress(content.id, progress);
                  }}
                  onNextLesson={() => {
                    // Navigate to next lesson
                    const currentIndex = allContentData?.contents?.findIndex(c => c.id === content.id) || -1;
                    if (currentIndex >= 0 && currentIndex < allContentData.contents.length - 1) {
                      const nextContent = allContentData.contents[currentIndex + 1];
                      setSelectedContent(nextContent);
                    }
                  }}
                  onPreviousLesson={() => {
                    // Navigate to previous lesson
                    const currentIndex = allContentData?.contents?.findIndex(c => c.id === content.id) || -1;
                    if (currentIndex > 0) {
                      const prevContent = allContentData.contents[currentIndex - 1];
                      setSelectedContent(prevContent);
                    }
                  }}
                  hasNextLesson={(() => {
                    const currentIndex = allContentData?.contents?.findIndex(c => c.id === content.id) || -1;
                    return currentIndex >= 0 && currentIndex < (allContentData?.contents?.length || 0) - 1;
                  })()}
                  hasPreviousLesson={(() => {
                    const currentIndex = allContentData?.contents?.findIndex(c => c.id === content.id) || -1;
                    return currentIndex > 0;
                  })()}
                  autoPlay={true}
                  className="w-full aspect-video"
                />
              ) : (
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoCameraIcon className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl font-medium">No video file available</p>
                    <p className="text-gray-400">Please contact your instructor if you believe this is an error.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Title Below Video - Left aligned with padding */}
            <div className="px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{content.title}</h2>
              {content.description && (
                <p className="text-lg text-gray-600">{content.description}</p>
              )}
            </div>

            {/* Content Tabs */}
            <div className="border-t border-gray-200 pt-6 px-6">
              <div className="flex space-x-8 border-b border-gray-200">
                {['overview', 'notes', 'announcements', 'reviews', 'learning-tools'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="py-6">
                {activeTab === 'overview' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lesson Overview</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {content.description || 'This lesson provides comprehensive coverage of the topic with practical examples and hands-on exercises.'}
                    </p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lesson Notes</h4>
                    <textarea
                      placeholder="Add your notes here..."
                      value={getCurrentNote(content.id, 'notes')}
                      onChange={(e) => handleNotesChange(content.id, 'notes', e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleSaveNotes(content.id, 'notes')}
                        disabled={saveNoteMutation.isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {saveNoteMutation.isLoading ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'announcements' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h4>
                    <p className="text-gray-600">No announcements for this lesson.</p>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lesson Reviews</h4>
                    <p className="text-gray-600">No reviews available for this lesson.</p>
                  </div>
                )}

                {activeTab === 'learning-tools' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Learning Tools</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Practice Exercises</h5>
                        <p className="text-blue-700 text-sm">Reinforce learning with hands-on practice</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-2">Additional Resources</h5>
                        <p className="text-purple-700 text-sm">Access supplementary materials and references</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {content.fileUrl ? (
              <div className="space-y-4">
                {/* Document Preview (for PDFs) */}
                {content.fileType === 'application/pdf' && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={getFileServingUrl(content.fileUrl)}
                      className="w-full h-96"
                      title={content.title}
                    />
                  </div>
                )}
                
                {/* Document Download Card */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <p className="text-sm text-gray-500">
                          {content.fileType === 'application/pdf' ? 'PDF Document' : 'Document'}
                          {content.fileSize && ` • ${Math.round(content.fileSize / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {content.fileType === 'application/pdf' && (
                        <a 
                          href={getFileServingUrl(content.fileUrl)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center"
                        >
                          <DocumentIcon className="h-4 w-4 mr-2" />
                          View Full
                        </a>
                      )}
                      <a 
                        href={getFileServingUrl(content.fileUrl)} 
                        download
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <DocumentIcon className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium text-gray-600 mb-2">No document file available</p>
                <p className="text-gray-500 mb-4">This lesson doesn't have a document file uploaded yet.</p>
                {user?.role === 'trainer' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 font-medium text-sm">
                      🎯 Trainer Action Required
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Go to Course Management → Edit this content → Upload a document file
                    </p>
                  </div>
                )}
                {user?.role !== 'trainer' && (
                  <p className="text-gray-400 text-sm mt-2">
                    Please contact your instructor if you believe this is an error.
                  </p>
                )}
              </div>
            )}
            {activeTab === 'notes' && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Document Notes</h4>
                <textarea
                  placeholder="Add your notes about this document..."
                  value={getCurrentNote(content.id, 'notes')}
                  onChange={(e) => handleNotesChange(content.id, 'notes', e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleSaveNotes(content.id, 'notes')}
                    disabled={saveNoteMutation.isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saveNoteMutation.isLoading ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <PhotoIcon className="h-6 w-6 text-blue-500" />
              {content.title}
            </h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {content.fileUrl ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={getBestImageUrl(content.fileUrl)}
                  alt={content.title}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <PhotoIcon className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium text-gray-600 mb-2">No image file available</p>
                <p className="text-gray-500 mb-4">This lesson doesn't have an image file uploaded yet.</p>
                {user?.role === 'trainer' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 font-medium text-sm">
                      🎯 Trainer Action Required
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Go to Course Management → Edit this content → Upload an image file
                    </p>
                  </div>
                )}
                {user?.role !== 'trainer' && (
                  <p className="text-gray-400 text-sm mt-2">
                    Please contact your instructor if you believe this is an error.
                  </p>
                )}
              </div>
            )}
            {activeTab === 'notes' && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Image Notes</h4>
                <textarea
                  placeholder="Add your observations and notes about this image..."
                  value={getCurrentNote(content.id, 'notes')}
                  onChange={(e) => handleNotesChange(content.id, 'notes', e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleSaveNotes(content.id, 'notes')}
                    disabled={saveNoteMutation.isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saveNoteMutation.isLoading ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold flex items-center space-x-2">
              <QuestionMarkCircleIcon className="h-8 w-8 text-purple-500" />
              {content.title}
            </h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            
            {content.questions && content.questions.length > 0 ? (
              <div className="space-y-6">
                {content.questions.map((question, qIndex) => (
                  <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Question {qIndex + 1}: {question.question}
                    </h4>
                    
                    <div className="space-y-3">
                      {question.options.map((option, oIndex) => (
                        <label key={oIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            onChange={(e) => {
                              setQuizAnswers(prev => ({
                                ...prev,
                                [content.id]: {
                                  ...prev[content.id],
                                  [question.id]: e.target.value
                                }
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                                 <div className="flex justify-end">
                   <button
                     onClick={() => handleQuizSubmit(content.id)}
                     disabled={submitQuizMutation.isLoading}
                     className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                   >
                     {submitQuizMutation.isLoading ? 'Submitting...' : 'Submit Quiz'}
                   </button>
                 </div>
                 
                 {/* Quiz Results Display */}
                 {quizResults[content.id] && (
                   <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                     <h4 className="text-lg font-semibold text-green-800 mb-2">Quiz Results</h4>
                     <div className="text-green-700">
                       <p>Score: {quizResults[content.id].score || 'N/A'}</p>
                       <p>Correct Answers: {quizResults[content.id].correctAnswers || 'N/A'}</p>
                       <p>Total Questions: {quizResults[content.id].totalQuestions || 'N/A'}</p>
                     </div>
                   </div>
                 )}
              </div>
            ) : (
              <p className="text-gray-500">No questions available for this quiz.</p>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
              {content.title}
            </h3>
            {content.description && (
              <p className="text-gray-600">{content.description}</p>
            )}
            {(content.content || content.articleContent) && (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="rich-content"
                  dangerouslySetInnerHTML={{ 
                    __html: typeof content.content === 'string' 
                      ? content.content 
                      : typeof content.articleContent === 'string'
                      ? content.articleContent
                      : JSON.stringify(content.content || content.articleContent)
                  }} 
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Content Not Supported</h3>
            <p className="text-gray-500">This content type is not yet supported.</p>
          </div>
        );
    }
  };

  if (courseLoading || sectionsLoading || contentLoading || progressLoading || statsLoading || notesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS for rich text content */}
      <style>{`
        .rich-content {
          line-height: 1.7;
        }
        
        .rich-content h1, .rich-content h2, .rich-content h3, 
        .rich-content h4, .rich-content h5, .rich-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .rich-content p {
          margin-bottom: 1em;
        }
        
        .rich-content ul, .rich-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .rich-content li {
          margin-bottom: 0.5em;
        }
        
        .rich-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-content strong {
          font-weight: 600;
        }
        
        .rich-content em {
          font-style: italic;
        }
        
        .rich-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .rich-content pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .rich-content img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          border-radius: 0.5rem;
        }
        
        .rich-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .rich-content a:hover {
          color: #1d4ed8;
        }
        
        /* Header overflow prevention */
        .course-header {
          overflow: hidden;
          word-wrap: break-word;
        }
        
        .course-title {
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          white-space: normal !important;
          line-height: 1.4 !important;
          display: block !important;
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          direction: ltr !important;
          unicode-bidi: normal !important;
        }
        
        /* Mobile specific fixes */
        @media (max-width: 640px) {
          .course-title {
            font-size: 1.125rem !important;
            line-height: 1.3 !important;
            word-spacing: normal !important;
            letter-spacing: normal !important;
            writing-mode: horizontal-tb !important;
            text-orientation: mixed !important;
            direction: ltr !important;
            unicode-bidi: normal !important;
          }
        }
        
        /* Sidebar positioning */
        .sidebar-container {
          top: 0;
          height: 100vh;
          transition: top 0.3s ease-in-out;
        }
        
        .sidebar-container.sticky {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          height: 100vh !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle - Fixed at top right */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Course Header - Full width, extends to browser edges */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm course-header">
        <div className="w-full px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            {/* Left side - Logo and Course Name - Allow wrapping */}
            <div className="flex items-start space-x-4 min-w-0 flex-1 mb-2 sm:mb-0">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">CX</span>
              </div>
              
              {/* Course Title - Mobile responsive */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight break-words course-title">
                  {courseLoading ? 'Loading...' : (courseData?.course?.title || courseData?.title || 'Course Title')}
                </h1>
              </div>
            </div>

            {/* Right side - Progress, Sidebar Toggle, and Share - Fixed width */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Progress Indicator - Moved to right side */}
              <div className="flex items-center">
                {isEnrolled ? (
                  <div className="flex items-center space-x-3">
                    <div className="relative w-10 h-10">
                      {/* Background circle */}
                      <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                        <circle 
                          cx="20" 
                          cy="20" 
                          r="16" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          className="text-gray-200"
                        />
                        {/* Progress circle */}
                        <circle 
                          cx="20" 
                          cy="20" 
                          r="16" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeDasharray={`${2 * Math.PI * 16}`}
                          strokeDashoffset={`${2 * Math.PI * 16 * (1 - courseProgress.progress / 100)}`}
                          className="text-blue-600 transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-700">
                          {courseProgress.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{courseProgress.completedLessons} of {courseProgress.totalLessons} lessons</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <div className="font-medium">Not Enrolled</div>
                  </div>
                )}
              </div>

              {/* Sidebar Toggle - Desktop */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <Bars3Icon className="h-5 w-5 text-gray-600" />
              </button>

              {/* Share Button */}
              <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <ShareIcon className="h-5 w-5 text-gray-600" />
              </button>

              {/* Homework Help Button */}
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <span className="text-sm font-medium">Homework help</span>
              </button>

              {/* Star Icon */}
              <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full width from top */}
      <div className="flex">
        {/* Content Area - Responsive to sidebar state */}
        <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'mr-96' : 'mr-0'}`}>

          {/* Main Content - Full width, no side margins */}
          <div className="w-full relative">
            {selectedContent ? (
              renderContent(selectedContent)
            ) : (
              <div className="text-center py-12">
                <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Selected</h3>
                <p className="text-gray-500">Please select a lesson from the sidebar to get started.</p>
              </div>
            )}

            {/* Content Box with 20px padding - Contains ALL content sections */}
            <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm mt-6">
              {/* Course Statistics Section */}
              {courseStats && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Course Statistics</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {courseStats.rating ? parseFloat(courseStats.rating).toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Rating</div>
                      {courseStats.totalRatings > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {courseStats.totalRatings} reviews
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {courseStats.enrollmentCount || 0}
                      </div>
                      <div className="text-sm text-gray-600">Students Enrolled</div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {formatDuration(courseStats.totalDuration || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Duration</div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {courseStats.totalLessons || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Lessons</div>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Skill Level:</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                            {courseStats.skillLevel || 'Beginner'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Language:</span>
                          <span className="text-sm text-gray-600">{courseStats.language || 'English'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Published:</span>
                          <span className="text-sm text-gray-600">
                            {courseStats.publishedDate ? new Date(courseStats.publishedDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Certificate:</span>
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            courseStats.certificateAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {courseStats.certificateAvailable ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        {courseStats.certificateAvailable && (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2">
                              <CertificateIcon className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Get certificate by completing entire course
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Description Section - Now INSIDE the content box */}
              {(courseData?.course?.description || courseData?.description) && (
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Course Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {courseData?.course?.description || courseData?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Using CourseSidebar Component */}
        <CourseSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sections={sections}
          selectedContent={selectedContent}
          onContentSelect={setSelectedContent}
          onSectionToggle={(sectionId, isExpanded) => {
            // Handle section toggle if needed
          }}
          isTrainer={user?.role === 'trainer'}
          onAddSection={() => {
            if (user?.role === 'trainer') {
              setShowAddSectionModal(true);
            } else {
              toast.error('Only trainers can add sections');
            }
          }}
          onAddContent={() => {
            if (user?.role === 'trainer') {
              setShowAddContentModal(true);
            } else {
              toast.error('Only trainers can add content');
            }
          }}
          courseProgress={courseProgress}
          onDeleteContent={(contentId) => {
            if (user?.role === 'trainer') {
              contentManagement.deleteContentMutation.mutate(contentId);
            }
          }}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Trainer-only Modals */}
      {user?.role === 'trainer' && sectionManagement && (
        <AddSectionModal
          showModal={showAddSectionModal}
          onClose={() => {
            setShowAddSectionModal(false);
            sectionManagement.resetSectionForm();
          }}
          sectionForm={sectionManagement.sectionForm}
          handleSectionFormChange={sectionManagement.handleSectionFormChange}
          handleAddSection={async (e) => {
            try {
              await sectionManagement.handleAddSection(e);
              setShowAddSectionModal(false);
            } catch (error) {
              console.error('Error adding section:', error);
              // Modal stays open on error
            }
          }}
          createSectionMutation={sectionManagement.createSectionMutation}
        />
      )}

      {user?.role === 'trainer' && contentManagement && (
        <AddContentModal
          showModal={showAddContentModal}
          onClose={() => {
            setShowAddContentModal(false);
            contentManagement.resetContentForm();
            // Also reset selected file when modal closes
            contentManagement.setSelectedFile(null);
          }}
          contentForm={contentManagement.contentForm}
          handleContentFormChange={contentManagement.handleContentFormChange}
          handleAddContent={async (e) => {
            try {
              console.log('🚀 CourseContentViewer: About to call handleAddContent');
              console.log('📁 Selected file from contentManagement:', contentManagement.selectedFile);
              console.log('📁 Selected file from fileUpload:', fileUpload.selectedFile);
              console.log('📁 Upload mutation from fileUpload:', !!fileUpload.uploadFileMutation);
              console.log('📁 FileUpload object:', fileUpload);
              
              // Use the selectedFile from contentManagement state (which should be set by fileUpload.handleFileChange)
              const result = await contentManagement.handleAddContent(e, contentManagement.selectedFile, fileUpload.uploadFileMutation);
              console.log('✅ Content creation completed successfully:', result);
              setShowAddContentModal(false);
              // Reset selected file after successful creation
              contentManagement.setSelectedFile(null);
              // Show success message
              toast.success('Content added successfully!');
            } catch (error) {
              console.error('Error adding content:', error);
              // Show error message but still close modal
              toast.error(error.message || 'Failed to add content');
              setShowAddContentModal(false);
            }
          }}
          sectionsData={sectionsData}
          selectedFile={contentManagement.selectedFile}
          handleFileChange={fileUpload.handleFileChange}
          handleFileUpload={fileUpload.handleFileUpload}
          createContentMutation={contentManagement.createContentMutation}
          uploadFileMutation={fileUpload.uploadFileMutation}
        />
      )}
      </div>
    </>
  );
};

export default CourseContentViewer;
