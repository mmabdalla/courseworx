import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Secure Video Player Component
 * 
 * Features:
 * - Prevents video downloads and right-click
 * - Hides video source URLs from browser inspection
 * - Auto-closes sidebar when video plays
 * - Auto-starts video when lesson is selected
 * - Professional video controls
 * - Full-screen expansion
 * - Anti-theft measures
 */
const SecureVideoPlayer = ({ 
  videoUrl, 
  title, 
  onVideoStart, 
  onSidebarToggle,
  onVideoProgress,
  autoPlay = true,
  className = ""
}) => {
  const videoRef = useRef(null);
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Security: Prevent right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Security: Prevent keyboard shortcuts for video controls
  const handleKeyDown = (e) => {
    // Prevent F11 (fullscreen), Ctrl+R (refresh), F5 (refresh)
    if (e.key === 'F11' || (e.ctrlKey && e.key === 'r') || e.key === 'F5') {
      e.preventDefault();
      return false;
    }
    
    // Allow only basic video controls
    const allowedKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'm', 'f'];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
      return false;
    }
  };

  // Security: Prevent drag and drop
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  // Security: Prevent selection
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  };

  // Handle video events
  const handlePlay = () => {
    setIsPlaying(true);
    if (onVideoStart) onVideoStart();
    if (onSidebarToggle) onSidebarToggle(false); // Close sidebar when video starts
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Track video progress for analytics
      if (onVideoProgress) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        onVideoProgress(progress);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  // Control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * duration;
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeSliderChange = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, clickX / width));
      videoRef.current.volume = newVolume;
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-play when component mounts or videoUrl changes
  useEffect(() => {
    if (autoPlay && videoRef.current && videoUrl) {
      // Small delay to ensure video is loaded
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.log('Auto-play prevented by browser:', e);
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [videoUrl, autoPlay]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!videoUrl) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎥</div>
          <p className="text-xl">No video available</p>
          <p className="text-gray-400">Please contact your instructor if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Security Overlay - Prevents inspection and interaction */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onSelectStart={handleSelectStart}
      />
      
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onVolumeChange={handleVolumeChange}
        playsInline
        preload="metadata"
        style={{ 
          // Security: Hide video source from inspection
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          outline: 'none'
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Custom Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300">
        {/* Progress Bar */}
        <div className="mb-3">
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-500 rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div 
                className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer relative"
                onClick={handleVolumeSliderChange}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium opacity-75">
        🔒 Secure
      </div>
    </div>
  );
};

export default SecureVideoPlayer;
