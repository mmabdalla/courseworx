import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import api from '../utils/api';
import { 
  QrCodeIcon, 
  ClockIcon, 
  MapPinIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

const AttendanceJoin = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Get or create device ID
  useEffect(() => {
    let storedDeviceId = localStorage.getItem('courseworx_device_id');
    if (!storedDeviceId) {
      storedDeviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('courseworx_device_id', storedDeviceId);
      setIsFirstTime(true);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // Check if user returned from login and link device
  useEffect(() => {
    const checkLoginReturn = () => {
      // Check if user is logged in (has auth token)
      const token = localStorage.getItem('token');
      if (token && deviceId && sessionId) {
        // User is logged in, link device to user account
        linkDeviceMutation.mutate();
      }
    };

    // Check immediately
    checkLoginReturn();

    // Also check when component mounts (in case user just logged in)
    const timer = setTimeout(checkLoginReturn, 1000);
    return () => clearTimeout(timer);
  }, [deviceId, sessionId]);

  // Fetch session details
  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/classroom-sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId
  });

  // Check if user is already checked in
  const { data: attendanceData, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', sessionId, deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const response = await api.get(`/attendance/device/${deviceId}/session/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId && !!deviceId
  });

  // Link device to user after login
  const linkDeviceMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/link-device', {
        deviceId,
        sessionId
      });
      return response.data;
    },
    onSuccess: () => {
      // Refresh attendance data to show user info
      refetchAttendance();
    }
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async (checkInData) => {
      const response = await api.post('/attendance/checkin', checkInData);
      return response.data;
    },
    onSuccess: () => {
      setIsCheckingIn(false);
      // Refresh attendance data
      window.location.reload();
    },
    onError: (error) => {
      console.error('Check-in failed:', error);
      setIsCheckingIn(false);
    }
  });

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/checkout', {
        sessionId,
        deviceId
      });
      return response.data;
    },
    onSuccess: () => {
      // Refresh attendance data
      window.location.reload();
    }
  });

  const handleCheckIn = async () => {
    if (!deviceId) return;
    
    setIsCheckingIn(true);
    checkInMutation.mutate({
      sessionId,
      deviceId,
      checkInMethod: 'qr_code'
    });
  };

  const handleCheckOut = async () => {
    if (!deviceId) return;
    checkOutMutation.mutate();
  };

  const handleLogin = () => {
    // Store the session ID to redirect back after login
    localStorage.setItem('courseworx_attendance_redirect', sessionId);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-4">The QR code you scanned is invalid or expired.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const session = sessionData?.session;
  const isCheckedIn = attendanceData?.attendance?.status === 'present';
  const isCheckedOut = attendanceData?.attendance?.status === 'checked_out';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center">
            <QrCodeIcon className="h-8 w-8 text-white mr-3" />
            <div>
              <h1 className="text-xl font-bold text-white">Classroom Attendance</h1>
              <p className="text-blue-100 text-sm">Scan QR Code to Check In</p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">
                  {new Date(session?.sessionDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">
                  {session?.startTime} - {session?.endTime}
                </span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">{session?.location}</span>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Device ID</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{deviceId}</p>
            {isFirstTime && (
              <p className="text-xs text-blue-600 mt-1">
                First time using this device - you'll be identified automatically
              </p>
            )}
          </div>

          {/* Status */}
          {isCheckedIn && !isCheckedOut && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">You're checked in!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Checked in at {new Date(attendanceData?.attendance?.checkInTime).toLocaleTimeString()}
              </p>
            </div>
          )}

          {isCheckedOut && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-700 font-medium">You've checked out</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Checked out at {new Date(attendanceData?.attendance?.checkOutTime).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="w-full btn-primary flex items-center justify-center"
              >
                {isCheckingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Check In
                  </>
                )}
              </button>
            )}

            {isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckOut}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                Check Out
              </button>
            )}

            {(isCheckedOut || !isCheckedIn) && (
              <button
                onClick={handleLogin}
                className="w-full btn-outline flex items-center justify-center"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Login to Identify Yourself
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isFirstTime 
                ? "This is your first time using this device. Your attendance will be tracked automatically."
                : "Your device is recognized. You can check in/out quickly."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceJoin;


