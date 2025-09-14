import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from 'react-query';
import QRScanner from '../components/QRScanner';
import {
  QrCodeIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(true);

  // Check-in mutation
  const checkInMutation = useMutation(
    (data) => api.post('/attendance/checkin', data),
    {
      onSuccess: (response) => {
        setAttendanceStatus({
          type: 'success',
          message: response.data.message,
          data: response.data.attendance
        });
        setScannedData(response.data.attendance);
        toast.success(response.data.message);
      },
      onError: (error) => {
        setAttendanceStatus({
          type: 'error',
          message: error.response?.data?.error || 'Check-in failed'
        });
        toast.error(error.response?.data?.error || 'Check-in failed');
      }
    }
  );

  // Check-out mutation
  const checkOutMutation = useMutation(
    (data) => api.post('/attendance/checkout', data),
    {
      onSuccess: (response) => {
        setAttendanceStatus({
          type: 'success',
          message: response.data.message,
          data: response.data.attendance
        });
        setScannedData(response.data.attendance);
        toast.success(response.data.message);
      },
      onError: (error) => {
        setAttendanceStatus({
          type: 'error',
          message: error.response?.data?.error || 'Check-out failed'
        });
        toast.error(error.response?.data?.error || 'Check-out failed');
      }
    }
  );

  const handleQRScan = (qrData) => {
    setShowScanner(false);
    
    // Handle both URL format (new) and JSON format (old)
    let sessionId;
    if (qrData.sessionId) {
      // New URL format
      sessionId = qrData.sessionId;
    } else if (qrData.sessionId) {
      // Old JSON format
      sessionId = qrData.sessionId;
    } else {
      toast.error('Invalid QR code format');
      return;
    }
    
    // Generate device ID for anonymous check-in
    let deviceId = localStorage.getItem('courseworx_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('courseworx_device_id', deviceId);
    }
    
    if (isCheckingIn) {
      checkInMutation.mutate({ 
        sessionId, 
        deviceId,
        checkInMethod: 'qr_code'
      });
    } else {
      checkOutMutation.mutate({ 
        sessionId, 
        deviceId
      });
    }
  };

  const resetAttendance = () => {
    setScannedData(null);
    setAttendanceStatus(null);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access attendance tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Attendance Tracker</h1>
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome, {user.firstName}!
            </h2>
            <p className="text-gray-600 text-sm">
              Scan the QR code at the classroom entrance to check in/out
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!scannedData && (
          <div className="space-y-4 mb-6">
            <button
              onClick={() => {
                setIsCheckingIn(true);
                setShowScanner(true);
                resetAttendance();
              }}
              disabled={checkInMutation.isLoading}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {checkInMutation.isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <QrCodeIcon className="h-5 w-5 mr-2" />
              )}
              Check In
            </button>

            <button
              onClick={() => {
                setIsCheckingIn(false);
                setShowScanner(true);
                resetAttendance();
              }}
              disabled={checkOutMutation.isLoading}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {checkOutMutation.isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <QrCodeIcon className="h-5 w-5 mr-2" />
              )}
              Check Out
            </button>
          </div>
        )}

        {/* Attendance Status */}
        {attendanceStatus && (
          <div className={`rounded-lg p-6 mb-6 ${
            attendanceStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {attendanceStatus.type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${
                  attendanceStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {attendanceStatus.message}
                </h3>
                {attendanceStatus.data && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{attendanceStatus.data.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>
                        {formatDate(attendanceStatus.data.sessionDate)} at {attendanceStatus.data.startTime}
                      </span>
                    </div>
                    {attendanceStatus.data.checkInTime && (
                      <div className="text-sm text-gray-600">
                        <strong>Checked in:</strong> {formatTime(attendanceStatus.data.checkInTime)}
                      </div>
                    )}
                    {attendanceStatus.data.checkOutTime && (
                      <div className="text-sm text-gray-600">
                        <strong>Checked out:</strong> {formatTime(attendanceStatus.data.checkOutTime)}
                      </div>
                    )}
                    {attendanceStatus.data.duration && (
                      <div className="text-sm text-gray-600">
                        <strong>Duration:</strong> {attendanceStatus.data.duration} minutes
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Find the QR code at the classroom entrance</li>
            <li>• Tap "Check In" when arriving at the classroom</li>
            <li>• Tap "Check Out" when leaving the classroom</li>
            <li>• Point your camera at the QR code to scan</li>
          </ul>
        </div>

        {/* Reset Button */}
        {scannedData && (
          <div className="mt-6">
            <button
              onClick={resetAttendance}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700"
            >
              Scan Another QR Code
            </button>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
          title={isCheckingIn ? "Check In" : "Check Out"}
        />
      )}
    </div>
  );
};

export default AttendanceTracker;


