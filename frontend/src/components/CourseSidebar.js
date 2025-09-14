import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon as CertificateIcon,
  CheckIcon,
  PlusIcon,
  TrophyIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const CourseSidebar = ({ 
  isOpen, 
  onClose, 
  sections, 
  selectedContent, 
  onContentSelect,
  onSectionToggle,
  isTrainer = false,
  onAddSection,
  onAddContent,
  onDeleteContent,
  courseProgress = { progress: 0, totalLessons: 0, completedLessons: 0 }
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [isSticky, setIsSticky] = useState(false);
  const [showProgressDropdown, setShowProgressDropdown] = useState(false);

  useEffect(() => {
    // Initialize sections - only expand the section containing the selected content
    if (sections && sections.length > 0) {
      const initialExpanded = new Set();
      
      // Find the section containing the selected content
      if (selectedContent) {
        const sectionWithSelectedContent = sections.find(section => 
          section.contents && section.contents.some(content => content.id === selectedContent.id)
        );
        if (sectionWithSelectedContent) {
          initialExpanded.add(sectionWithSelectedContent.id);
        }
      } else {
        // If no content is selected, expand the first section with content
        const firstSectionWithContent = sections.find(section => 
          section.contents && section.contents.length > 0
        );
        if (firstSectionWithContent) {
          initialExpanded.add(firstSectionWithContent.id);
        }
      }
      
      setExpandedSections(initialExpanded);
    }
  }, [sections, selectedContent]);

  useEffect(() => {
    // Calculate sidebar position based on actual header height
    const calculateSidebarPosition = () => {
      const courseHeader = document.querySelector('.course-header');
      if (courseHeader) {
        const headerHeight = courseHeader.offsetHeight;
        const sidebar = document.querySelector('.sidebar-container');
        if (sidebar) {
          sidebar.style.top = `${headerHeight}px`;
          sidebar.style.height = `calc(100vh - ${headerHeight}px)`;
        }
      }
    };

    // Calculate position on mount and resize
    calculateSidebarPosition();
    window.addEventListener('resize', calculateSidebarPosition);
    
    // Also recalculate when content changes (for dynamic titles)
    const observer = new MutationObserver(calculateSidebarPosition);
    const courseHeader = document.querySelector('.course-header');
    if (courseHeader) {
      observer.observe(courseHeader, { 
        childList: true, 
        subtree: true, 
        characterData: true 
      });
    }

    return () => {
      window.removeEventListener('resize', calculateSidebarPosition);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Handle scroll to make sidebar sticky when course header disappears
    const handleScroll = () => {
      const courseHeader = document.querySelector('.course-header');
      const sidebar = document.querySelector('.sidebar-container');
      if (courseHeader && sidebar) {
        const headerBottom = courseHeader.getBoundingClientRect().bottom;
        const shouldBeSticky = headerBottom <= 0;
        setIsSticky(shouldBeSticky);
        
        if (shouldBeSticky) {
          sidebar.classList.add('sticky');
        } else {
          sidebar.classList.remove('sticky');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close progress dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showProgressDropdown && !event.target.closest('.progress-dropdown')) {
        setShowProgressDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProgressDropdown]);

  const handleSectionToggle = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    
    if (onSectionToggle) {
      onSectionToggle(sectionId, newExpanded.has(sectionId));
    }
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      document: DocumentIcon,
      image: PhotoIcon,
      video: PlayIcon,
      article: DocumentTextIcon,
      quiz: QuestionMarkCircleIcon,
      certificate: CertificateIcon,
    };
    return icons[type] || DocumentIcon;
  };



  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };



  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`absolute right-0 w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col sidebar-container ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isSticky ? 'fixed top-0' : ''}`}>
        {/* Dark Grey Header Bar - Combined with Course Content title */}
        <div className="bg-gray-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative progress-dropdown">
                <button
                  onClick={() => setShowProgressDropdown(!showProgressDropdown)}
                  className="flex items-center space-x-1 text-sm font-medium hover:text-gray-200 transition-colors"
                >
                  <TrophyIcon className="h-5 w-5 text-yellow-400" />
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                
                {/* Progress Dropdown */}
                {showProgressDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 mb-2">Course Progress</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${courseProgress.progress || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">
                        {courseProgress.completedLessons || 0} of {courseProgress.totalLessons || 0} lessons completed
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">Course content</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Close button moved up here */}
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - No padding, with scrollbar */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sections && sections.length > 0 ? (
            <div className="space-y-2">
              {sections.map((section, sectionIndex) => {
                const isExpanded = expandedSections.has(section.id);
                const hasContents = section.contents && section.contents.length > 0;
                
                return (
                  <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
                    {/* Section Header */}
                    <button
                      onClick={() => handleSectionToggle(section.id)}
                      className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                        isExpanded ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          Section {sectionIndex + 1}: {section.title}
                        </span>
                      </div>
                    </button>

                    {/* Section Contents */}
                    {isExpanded && hasContents && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="space-y-1">
                          {section.contents.map((content, contentIndex) => {
                            const IconComponent = getContentTypeIcon(content.type);
                            const isSelected = selectedContent?.id === content.id;
                            const isCompleted = content.isCompleted || false;

                            return (
                              <div key={content.id} className="bg-white border border-gray-200">
                                <button
                                  onClick={() => {
                                    onContentSelect(content);
                                    
                                    // Auto-close sidebar for video content to provide better viewing experience
                                    if (content.type === 'video') {
                                      // Small delay to ensure content is loaded before closing sidebar
                                      setTimeout(() => {
                                        if (onClose) onClose();
                                      }, 100);
                                    }
                                  }}
                                  className={`w-full text-left p-3 transition-colors ${
                                    isSelected 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    {/* Completion Checkbox */}
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                      isCompleted 
                                        ? 'bg-purple-600 border-purple-600' 
                                        : 'border-gray-300 bg-white'
                                    }`}>
                                      {isCompleted && (
                                        <CheckIcon className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    
                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 mb-1 leading-tight break-words">
                                        {contentIndex + 1}. {content.title}
                                      </p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <IconComponent className="h-3 w-3" />
                                        {content.duration ? (
                                          <span className="font-medium text-purple-600">
                                            {formatDuration(content.duration)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">No duration</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Delete Button - Only show for trainers */}
                                    {isTrainer && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`Are you sure you want to delete "${content.title}"?`)) {
                                            onDeleteContent(content.id);
                                          }
                                        }}
                                        className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors flex-shrink-0"
                                        title="Delete content"
                                      >
                                        <TrashIcon className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Empty Section */}
                    {isExpanded && (!hasContents || section.contents.length === 0) && (
                      <div className="border-t border-gray-200 bg-gray-50 p-3">
                        <p className="text-sm text-gray-500 text-center">No content in this section</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sections available</p>
            </div>
          )}

          {/* Trainer Actions */}
          {isTrainer && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 p-4">
              <button
                onClick={onAddSection}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Section</span>
              </button>
              
              <button
                onClick={onAddContent}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Content</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseSidebar;
