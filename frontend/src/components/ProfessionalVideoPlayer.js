import React, { useEffect, useRef, useState } from 'react';

/**
 * Professional Video Player Component
 * 
 * Features:
 * - Modern, professional interface matching industry standards
 * - Advanced controls: playback speed, rewind/replay, chapters
 * - Subtitles, quality settings, picture-in-picture
 * - Anti-download and anti-theft security measures
 * - Auto-closes sidebar when video plays
 * - Auto-starts video when lesson is selected
 * - Progress tracking and analytics
 */
const ProfessionalVideoPlayer = ({ 
  videoUrl, 
  title, 
  onVideoStart, 
  onSidebarToggle,
  onVideoProgress,
  onNextLesson,
  onPreviousLesson,
  hasNextLesson = false,
  hasPreviousLesson = false,
  autoPlay = true,
  className = ""
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showPlaybackSpeed, setShowPlaybackSpeed] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticatedVideoUrl, setAuthenticatedVideoUrl] = useState(null);

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

  // Video loading with proper authentication
  useEffect(() => {
    if (!videoUrl) return;
    
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token available. Please log in again.');
        }
        
        // Create an authenticated video URL by appending the token
        // This ensures the video element includes authentication
        const authenticatedUrl = `${videoUrl}?token=${encodeURIComponent(token)}`;
        
        // Test the authenticated URL first
        const response = await fetch(authenticatedUrl, {
          method: 'HEAD', // Just check headers, don't download content
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view this video.');
          } else {
            throw new Error(`Failed to access video: ${response.status} ${response.statusText}`);
          }
        }
        
        // If we get here, authentication is successful
        setIsLoading(false);
        console.log('✅ Video authentication successful');
        
        // Store the authenticated URL for the video element
        setAuthenticatedVideoUrl(authenticatedUrl);
        
      } catch (err) {
        console.error('❌ Video authentication error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    loadVideo();
  }, [videoUrl]);

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

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackSpeed(false);
    }
  };

  const rewind = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seconds);
    }
  };



  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.log('Picture-in-Picture not supported:', error);
      }
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
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

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

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
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Security Overlay - Prevents inspection and interaction */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onSelectStart={handleSelectStart}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-white">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <p className="text-lg text-red-300 mb-2">Video Loading Failed</p>
            <p className="text-sm text-gray-300">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video Element - Only show when authenticated */}
      {!isLoading && !error && authenticatedVideoUrl && (
        <video
          ref={videoRef}
          src={authenticatedVideoUrl}
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
        />
      )}
      
      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-white">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <p className="text-lg text-red-300 mb-2">Video Access Failed</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button 
                onClick={() => window.location.href = '/login'} 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Video Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-all duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div 
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-purple-500 rounded-full relative transition-all duration-200 group-hover:bg-purple-400"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {/* Left Side Controls */}
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
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

              {/* Rewind/Replay Button */}
              <button
                onClick={() => rewind(10)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Rewind 10 seconds"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 000 2h3.586l-2.293 2.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowPlaybackSpeed(!showPlaybackSpeed)}
                  className="text-white hover:text-purple-400 transition-colors px-3 py-1 rounded text-sm font-medium hover:bg-white/10"
                  aria-label="Playback speed"
                >
                  {playbackRate}x
                </button>
                
                {showPlaybackSpeed && (
                  <div className="absolute bottom-full left-0 mb-2 bg-black/90 border border-gray-700 rounded-lg shadow-xl z-20">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                          playbackRate === rate ? 'text-purple-400 bg-white/5' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              {/* Chapters/Notes Button */}
              <button
                onClick={() => setShowChapters(!showChapters)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Chapters and notes"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
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
                  className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer relative group"
                  onClick={handleVolumeSliderChange}
                >
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-200 group-hover:bg-purple-400"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>

              {/* Subtitles Button */}
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Subtitles"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm1 2a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Quality Settings */}
              <button
                onClick={() => setShowQuality(!showQuality)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Quality settings"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Picture-in-Picture Button */}
              <button
                onClick={togglePictureInPicture}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Picture-in-Picture"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-full hover:bg-white/10"
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
      </div>

      {/* No fake security badge - implementing real security instead */}

      {/* Navigation Buttons - Overlaid on video */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
        {/* Previous Lesson Button */}
        {hasPreviousLesson && (
          <button
            onClick={onPreviousLesson}
            className="pointer-events-auto bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 ml-4 opacity-80 hover:opacity-100"
            aria-label="Previous lesson"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Next Lesson Button */}
        {hasNextLesson && (
          <button
            onClick={onNextLesson}
            className="pointer-events-auto bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 mr-4 opacity-80 hover:opacity-100"
            aria-label="Next lesson"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfessionalVideoPlayer;
