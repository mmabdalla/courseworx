import React, { useState, useEffect } from 'react';
import { ShareIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const CourseHeader = ({ 
  courseTitle, 
  progress, 
  totalLessons, 
  completedLessons,
  onShare,
  onMenuClick 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header only when scrolled to top (within 50px)
      if (currentScrollY <= 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ease-in-out">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Course Name */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {courseTitle || 'Course Title'}
            </h1>
          </div>

          {/* Center - Progress Indicator */}
          <div className="flex items-center space-x-4 mx-8">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Progress</div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                  {progress || 0}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedLessons || 0} of {totalLessons || 0} lessons completed
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onShare}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
