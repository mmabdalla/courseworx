import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const AttendanceDashboard = () => {
  const { courseId, sessionId } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch session attendance
  const { data: attendanceData, isLoading, error } = useQuery(
    ['session-attendance', sessionId],
    () => api.get(`/classroom-sessions/${sessionId}/attendance`).then(res => res.data),
    {
      enabled: !!sessionId
    }
  );

  // Fetch course details
  const { data: courseData } = useQuery(
    ['course', courseId],
    () => api.get(`/courses/${courseId}`).then(res => res.data),
    {
      enabled: !!courseId
    }
  );

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'late': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'absent': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'left_early': return <ClockIcon className="h-5 w-5 text-orange-500" />;
      default: return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'left_early': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateStats = () => {
    if (!attendanceData?.attendance) return { total: 0, present: 0, late: 0, absent: 0, leftEarly: 0 };

    const attendance = attendanceData.attendance;
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const leftEarly = attendance.filter(a => a.status === 'left_early').length;

    return { total, present, late, absent, leftEarly };
  };

  const stats = calculateStats();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-8 text-red-600">Error loading attendance data</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 mr-4"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
                {courseData && (
                  <p className="text-gray-600">{courseData.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Info */}
        {attendanceData?.session && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(attendanceData.session.sessionDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{attendanceData.session.startTime} - {attendanceData.session.endTime}</p>
                </div>
              </div>
              {attendanceData.session.location && (
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{attendanceData.session.location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{attendanceData.session.status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('detailed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'detailed'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detailed List
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Attendance Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Present on Time</p>
                          <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                        </div>
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Late Arrivals</p>
                          <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                        </div>
                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Absent</p>
                          <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                        </div>
                        <XCircleIcon className="h-8 w-8 text-red-600" />
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Left Early</p>
                          <p className="text-2xl font-bold text-orange-900">{stats.leftEarly}</p>
                        </div>
                        <ClockIcon className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Rate</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Attendance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'detailed' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Student Attendance Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceData?.attendance?.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {record.User?.firstName?.charAt(0)}{record.User?.lastName?.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.User?.firstName} {record.User?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{record.User?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                                {record.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkInTime ? formatTime(record.checkInTime) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkOutTime ? formatTime(record.checkOutTime) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.duration ? `${record.duration} min` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;


