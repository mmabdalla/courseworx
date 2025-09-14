import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Debug component mounting and state changes
  useEffect(() => {
    try {
      console.log('🚀 Login component mounted');
      console.log('🌐 Current location:', window.location.href);
      console.log('🔧 useAuth hook:', !!login);
      console.log('🔧 useNavigate hook:', !!navigate);
    } catch (error) {
      console.error('💥 Error in component mount:', error);
    }
  }, [login, navigate]);

  useEffect(() => {
    try {
      console.log('📧 Identifier changed:', identifier);
    } catch (error) {
      console.error('💥 Error in identifier effect:', error);
    }
  }, [identifier]);

  useEffect(() => {
    try {
      console.log('🔑 Password changed, length:', password.length);
    } catch (error) {
      console.error('💥 Error in password effect:', error);
    }
  }, [password]);

  // Test basic JavaScript functionality
  useEffect(() => {
    try {
      console.log('🧪 Testing basic JavaScript functionality...');
      
      // Test DOM manipulation
      const testElement = document.getElementById('js-test');
      const debugElement = document.getElementById('debug-info');
      
      if (testElement) {
        testElement.innerHTML = '✅ JavaScript Working';
        console.log('✅ DOM manipulation working');
      } else {
        console.log('⚠️ js-test element not found');
      }
      
      // Update debug display
      if (debugElement) {
        let debugText = '✅ JavaScript Working\n';
        debugText += `🌐 URL: ${window.location.href}\n`;
        debugText += `🔧 Login function: ${!!login}\n`;
        debugText += `🔧 Navigate function: ${!!navigate}\n`;
        debugText += `📧 Identifier: ${identifier}\n`;
        debugText += `🔑 Password length: ${password.length}\n`;
        
        // Test basic JavaScript features
        const testArray = [1, 2, 3];
        const doubled = testArray.map(x => x * 2);
        debugText += `✅ Array methods: ${doubled.join(', ')}\n`;
        
        // Test async/await
        const testAsync = async () => {
          return 'async working';
        };
        testAsync().then(result => {
          debugText += `✅ Async/await: ${result}\n`;
          if (debugElement) {
            debugElement.innerHTML = debugText.replace(/\n/g, '<br>');
          }
        });
        
        // Update immediately with what we have so far
        debugElement.innerHTML = debugText.replace(/\n/g, '<br>');
      }
      
    } catch (error) {
      console.error('💥 Error in JavaScript test:', error);
      const debugElement = document.getElementById('debug-info');
      if (debugElement) {
        debugElement.innerHTML = `❌ JavaScript Error: ${error.message}`;
      }
    }
  }, [login, navigate, identifier, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 FORM SUBMITTED!');
    console.log('🎯 Event object:', e);
    
    // Update debug display to show form submission
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
      debugElement.innerHTML = '🎯 Form submitted! Starting login process...';
    }
    
    setLoading(true);
    setError(''); // Clear previous errors

    console.log('🔐 Login attempt started');
    console.log('📧 Identifier:', identifier);
    console.log('🔑 Password length:', password.length);
    console.log('🌐 Current URL:', window.location.href);

    try {
      console.log('📡 Calling login function...');
      
      // Update debug display
      if (debugElement) {
        debugElement.innerHTML = '📡 Calling login function...';
      }
      
      const result = await login(identifier, password);
      console.log('📡 Login result:', result);
      
      // Update debug display with result
      if (debugElement) {
        debugElement.innerHTML = `📡 Login result received: ${JSON.stringify(result)}`;
      }
      
      if (result.success) {
        console.log('✅ Login successful, navigating to dashboard');
        if (debugElement) {
          debugElement.innerHTML = '✅ Login successful! Navigating to dashboard...';
        }
        // Add a small delay to ensure the user sees the success message
        setTimeout(() => {
          // Check if user was redirected from attendance page
          const attendanceRedirect = localStorage.getItem('courseworx_attendance_redirect');
          if (attendanceRedirect) {
            localStorage.removeItem('courseworx_attendance_redirect');
            navigate(`/attendance/join/${attendanceRedirect}`);
          } else {
            navigate('/dashboard');
          }
        }, 100);
      } else {
        console.error('❌ Login failed:', result.error);
        if (debugElement) {
          debugElement.innerHTML = `❌ Login failed: ${result.error}`;
        }
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      console.error('💥 Error stack:', error.stack);
      
      // Update debug display with error
      if (debugElement) {
        debugElement.innerHTML = `💥 Unexpected error: ${error.message}`;
      }
      
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to CourseWorx
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your courses and track your progress
          </p>
          
          {/* Simple JavaScript test */}
          <div className="mt-2 text-center text-xs text-blue-600">
            <span id="js-test">JavaScript Test</span>
          </div>
          
          {/* Visual Debug Display */}
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left">
            <div className="font-bold">🔍 Debug Info:</div>
            <div id="debug-info">Loading...</div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or Phone
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="identifier"
                required
                className="input-field rounded-t-lg"
                placeholder="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input-field rounded-b-lg pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Login Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in'
              )}
            </button>
            
            {/* Simple debug button */}
            <button
              type="button"
              className="mt-2 w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => {
                alert('Debug button clicked! Check the debug info above for details.');
                
                // Update debug display with current state
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                  let debugText = '🧪 Debug Button Clicked!\n';
                  debugText += `🌐 Current URL: ${window.location.href}\n`;
                  debugText += `🔧 Login function: ${!!login}\n`;
                  debugText += `🔧 Navigate function: ${!!navigate}\n`;
                  debugText += `📧 Identifier: ${identifier}\n`;
                  debugText += `🔑 Password length: ${password.length}\n`;
                  debugText += `⏳ Loading: ${loading}\n`;
                  debugText += `❌ Error: ${error || 'None'}\n`;
                  debugText += `⏰ Timestamp: ${new Date().toLocaleTimeString()}\n`;
                  
                  debugElement.innerHTML = debugText.replace(/\n/g, '<br>');
                }
                
                // Also try to log to console (for desktop debugging)
                console.log('🧪 Debug button clicked!');
                console.log('🧪 Current state:', { identifier, password, loading, error });
                console.log('🧪 Window location:', window.location.href);
                console.log('🧪 Login function:', !!login);
              }}
            >
              🧪 Debug Info
            </button>
            
            {/* API Connectivity Test Button */}
            <button
              type="button"
              className="mt-2 w-full py-2 px-4 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={async () => {
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                  debugElement.innerHTML = '🌐 Testing API connectivity...';
                }
                
                try {
                  // Test the mobile endpoint directly
                  const response = await fetch('http://10.0.0.96:5000/api/mobile-test');
                  const data = await response.json();
                  
                  if (debugElement) {
                    debugElement.innerHTML = `✅ API Test Success!<br>Status: ${response.status}<br>Response: ${JSON.stringify(data)}`;
                  }
                } catch (error) {
                  if (debugElement) {
                    debugElement.innerHTML = `❌ API Test Failed!<br>Error: ${error.message}`;
                  }
                }
              }}
            >
              🌐 Test API Connection
            </button>
            
            {/* Login Endpoint Test Button */}
            <button
              type="button"
              className="mt-2 w-full py-2 px-4 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={async () => {
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                  debugElement.innerHTML = '🔐 Testing login endpoint...';
                }
                
                try {
                  // Test the login endpoint directly
                  const response = await fetch('http://10.0.0.96:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      identifier: 'test@test.com',
                      password: 'testpassword'
                    })
                  });
                  
                  if (debugElement) {
                    debugElement.innerHTML = `🔐 Login Endpoint Test:<br>Status: ${response.status}<br>Status Text: ${response.statusText}`;
                  }
                } catch (error) {
                  if (debugElement) {
                    debugElement.innerHTML = `❌ Login Endpoint Failed!<br>Error: ${error.message}`;
                  }
                }
              }}
            >
              🔐 Test Login Endpoint
            </button>
            
            {/* Simple Fetch Test Button */}
            <button
              type="button"
              className="mt-2 w-full py-2 px-4 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              onClick={async () => {
                const debugElement = document.getElementById('debug-info');
                if (debugElement) {
                  debugElement.innerHTML = '🔄 Testing simple fetch...';
                }
                
                try {
                  // Test a simple fetch with timeout
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                  
                  const response = await fetch('http://10.0.0.96:5000/api/mobile-test', {
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  const data = await response.json();
                  
                  if (debugElement) {
                    debugElement.innerHTML = `🔄 Simple Fetch Test:<br>Status: ${response.status}<br>Response: ${JSON.stringify(data)}`;
                  }
                } catch (error) {
                  if (debugElement) {
                    debugElement.innerHTML = `❌ Simple Fetch Failed!<br>Error: ${error.name} - ${error.message}`;
                  }
                }
              }}
            >
              🔄 Simple Fetch Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 