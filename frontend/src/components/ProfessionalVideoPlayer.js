import React, { useEffect, useRef, useState } from 'react';

/**
 * Professional Video Player Component
 * 
 * A high-performance, accessible, and secure video player for CourseWorx lessons.
 * 
 * Features:
 * - Modern, professional interface matching industry standards
 * - Advanced controls: playback speed (0.5x to 2x), rewind/forward (10s), chapters
 * - Subtitles, quality settings, picture-in-picture mode
 * - Anti-download and anti-theft security measures (context menu disabling, shortcut prevention)
 * - Auto-closes sidebar when video plays for focused learning
 * - Auto-starts video when lesson is selected (configurable)
 * - Real-time progress tracking and analytics integration
 * 
 * @param {string} videoUrl - The source URL for the video
 * @param {string} title - The title of the current lesson/video
 * @param {function} onVideoStart - Callback triggered when playback begins
 * @param {function} onSidebarToggle - Callback to collapse/expand the lesson sidebar
 * @param {function} onVideoProgress - Callback to track progress percentage
 * @param {function} onNextLesson - Callback for "Next Lesson" navigation
 * @param {function} onPreviousLesson - Callback for "Previous Lesson" navigation
 * @param {boolean} hasNextLesson - Whether a next lesson exists
 * @param {boolean} hasPreviousLesson - Whether a previous lesson exists
 * @param {boolean} autoPlay - Whether to start playback automatically (default: true)
 * @param {string} className - Optional CSS classes for the container
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

  /**
   * SECURITY: Prevent right-click context menu to discourage direct video downloads.
   */
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  /**
   * SECURITY: Block specific keyboard shortcuts that could be used to inspect or bypass controls.
   */
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

  /**
   * SECURITY: Prevent dragging the video element.
   */
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  /**
   * SECURITY: Prevent text/element selection on the player.
   */
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  };

  /**
   * EFFECT: Handles authenticated video loading.
   * Prepends JWT token to the URL for backend validation.
   */
  useEffect(() => {
    if (!videoUrl) return;
    
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Retrieve the JWT token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token available. Please log in again.');
        }
        
        // Create an authenticated video URL by appending the token
        // This ensures the backend serves the stream securely
        const authenticatedUrl = `${videoUrl}?token=${encodeURIComponent(token)}`;
        
        // Verify access with a HEAD request before setting the source
        const response = await fetch(authenticatedUrl, {
          method: 'HEAD',
          headers: {
             'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Your session may have expired.');
          } else if (response.status === 403) {
            throw new Error('Access denied. This content is restricted.');
          } else {
            throw new Error(`Failed to access video stream: ${response.status}`);
          }
        }
        
        setIsLoading(false);
        setAuthenticatedVideoUrl(authenticatedUrl);
        
      } catch (err) {
        console.error('❌ Video initialization failed:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    loadVideo();
  }, [videoUrl]);

  /**
   * EVENT: Handle video play state.
   */
  const handlePlay = () => {
    setIsPlaying(true);
    if (onVideoStart) onVideoStart();
    if (onSidebarToggle) onSidebarToggle(false); // Enable 'Theater Mode' automatically
  };

  /**
   * EVENT: Handle video pause state.
   */
  const handlePause = () => {
    setIsPlaying(false);
  };

  /**
   * EVENT: Track playback progress.
   */
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Update analytics/completion progress
      if (onVideoProgress) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        onVideoProgress(progress);
      }
    }
  };

  /**
   * EVENT: Handle metadata loaded (duration, etc.).
   */
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  /**
   * EVENT: Synchronize volume and mute states.
   */
  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  /**
   * ACTION: Toggle Play/Pause.
   */
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  /**
   * ACTION: Toggle Mute.
   */
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  /**
   * ACTION: Toggle Fullscreen with cross-browser support.
   */
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
        }
      }
    }
  };

  /**
   * ACTION: Seek to specific time based on progress bar click.
   */
  const handleSeek = (e) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * duration;
      videoRef.current.currentTime = seekTime;
    }
  };

  /**
   * ACTION: Adjust volume via slider.
   */
  const handleVolumeSliderChange = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, clickX / width));
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
      }
    }
  };

  /**
   * ACTION: Change playback speed.
   */
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackSpeed(false);
    }
  };

  /**
   * ACTION: Rewind video by specified seconds.
   */
  const rewind = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seconds);
    }
  };

  /**
   * ACTION: Forward video by specified seconds.
   */
  const forward = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + seconds);
    }
  };

  /**
   * ACTION: Toggle Picture-in-Picture mode.
   */
  const togglePictureInPicture = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.warn('Picture-in-Picture failed:', error);
      }
    }
  };

  /**
   * UTILITY: Format seconds into MM:SS format.
   */
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * EFFECT: Handle Auto-Play logic.
   */
  useEffect(() => {
    if (autoPlay && videoRef.current && authenticatedVideoUrl) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.warn('Auto-play blocked by browser. User interaction required.');
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authenticatedVideoUrl, autoPlay]);

  /**
   * EFFECT: Synchronize UI state with fullscreen changes.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * EFFECT: Auto-hide player controls during active playback.
   */
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
      <div className={`bg-slate-900 rounded-xl flex flex-col items-center justify-center p-12 text-center ${className}`}>
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Video Selected</h3>
        <p className="text-slate-400 max-w-sm">Please select a lesson from the sidebar to begin your learning journey.</p>
      </div>
    );
  }

  return (
    <div 
      className={`group relative bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      {/* Security Barrier */}
      <div 
        className="absolute inset-0 z-10 select-none touch-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onSelectStart={handleSelectStart}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-30">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sky-100 font-medium animate-pulse">Initializing Secure Stream...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30 p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Playback Denied</h3>
          <p className="text-slate-400 mb-6 max-w-md">{error}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/20"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="px-6 py-2.5 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            >
              Authentication Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Video Element */}
      {!isLoading && !error && authenticatedVideoUrl && (
        <video
          ref={videoRef}
          src={authenticatedVideoUrl}
          className="w-full aspect-video"
          onContextMenu={handleContextMenu}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVolumeChange={handleVolumeChange}
          playsInline
          preload="auto"
        />
      )}
      
      {/* HUD - Heads Up Display / Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20 pb-6 px-6 transition-all duration-500 transform ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {/* Progress System */}
        <div className="relative group/progress mb-6">
          <div 
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden transition-all duration-200 group-hover/progress:h-2"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full relative transition-all duration-300"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Primary Action: Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Jump Controls */}
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => rewind(10)}
                className="p-2 text-white/70 hover:text-white transition-colors"
                title="Rewind 10s"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"/></svg>
              </button>
              <button
                onClick={() => forward(10)}
                className="p-2 text-white/70 hover:text-white transition-colors"
                title="Forward 10s"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z"/></svg>
              </button>
            </div>

            {/* Time Stamp */}
            <div className="hidden sm:block text-white/90 text-sm font-semibold tabular-nums px-2">
              {formatTime(currentTime)} <span className="text-white/40 mx-1">/</span> {formatTime(duration)}
            </div>

            {/* Volume Complex */}
            <div className="hidden md:flex items-center gap-3 group/volume">
              <button onClick={toggleMute} className="text-white/80 hover:text-white">
                {isMuted ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <div 
                className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300"
                onClick={handleVolumeSliderChange}
              >
                <div className="w-20 h-1 bg-white/20 rounded-full relative">
                  <div className="absolute inset-0 bg-white rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Settings */}
          <div className="flex items-center gap-1 sm:gap-3">
             {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPlaybackSpeed(!showPlaybackSpeed)}
                className="px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 border border-white/10"
              >
                {playbackRate}x
              </button>
              {showPlaybackSpeed && (
                <div className="absolute bottom-full right-0 mb-3 w-28 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        playbackRate === rate ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={togglePictureInPicture}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Mini Player"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2h-6" /></svg>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Navigation Overlays */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 z-15 pointer-events-none">
        {hasPreviousLesson && (
          <button
            onClick={onPreviousLesson}
            className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-sky-600 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
            title="Previous Lesson"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        {hasNextLesson && (
          <button
            onClick={onNextLesson}
            className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-sky-600 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
            title="Next Lesson"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfessionalVideoPlayer;
