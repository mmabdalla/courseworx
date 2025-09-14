import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ClassroomSessions = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showQRCode, setShowQRCode] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    sessionDate: '',
    startTime: '',
    endTime: '',
    location: '',
    roomNumber: '',
    maxCapacity: '',
    notes: ''
  });

  // Fetch classroom sessions
  const { data: sessionsData, isLoading, error } = useQuery(
    ['classroom-sessions', courseId],
    () => api.get(`/classroom-sessions/course/${courseId}`).then(res => res.data),
    {
      enabled: !!courseId
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

  // Create session mutation
  const createSessionMutation = useMutation(
    (sessionData) => api.post('/classroom-sessions', sessionData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['classroom-sessions', courseId]);
        setShowCreateForm(false);
        setFormData({
          sessionDate: '',
          startTime: '',
          endTime: '',
          location: '',
          roomNumber: '',
          maxCapacity: '',
          notes: ''
        });
        toast.success('Classroom session created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create session');
      }
    }
  );

  // Update session status mutation
  const updateStatusMutation = useMutation(
    ({ sessionId, status }) => api.patch(`/classroom-sessions/${sessionId}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom-sessions', courseId]);
        toast.success('Session status updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update status');
      }
    }
  );

  // Delete session mutation
  const deleteSessionMutation = useMutation(
    (sessionId) => api.delete(`/classroom-sessions/${sessionId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom-sessions', courseId]);
        toast.success('Session deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete session');
      }
    }
  );

  // Get QR code mutation
  const getQRCodeMutation = useMutation(
    (sessionId) => api.get(`/classroom-sessions/${sessionId}/qr-code`).then(res => res.data),
    {
      onSuccess: (data) => {
        setShowQRCode(data);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate QR code');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createSessionMutation.mutate({
      courseId,
      ...formData
    });
  };

  const handleStatusChange = (sessionId, newStatus) => {
    updateStatusMutation.mutate({ sessionId, status: newStatus });
  };

  const handleDelete = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleViewAttendance = (sessionId) => {
    navigate(`/courses/${courseId}/sessions/${sessionId}/attendance`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-8 text-red-600">Error loading sessions</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classroom Sessions</h1>
            {courseData && (
              <p className="text-gray-600 mt-2">{courseData.title}</p>
            )}
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Session
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {sessionsData?.sessions?.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions created</h3>
            <p className="text-gray-600 mb-4">Create your first classroom session to start tracking attendance.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Session
            </button>
          </div>
        ) : (
          sessionsData?.sessions?.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                      {session.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {session.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{session.location}</span>
                      </div>
                    )}
                    {session.roomNumber && (
                      <div className="text-gray-600">
                        <strong>Room:</strong> {session.roomNumber}
                      </div>
                    )}
                    {session.maxCapacity && (
                      <div className="flex items-center text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>Max {session.maxCapacity} students</span>
                      </div>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-gray-600 text-sm mb-4">{session.notes}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => getQRCodeMutation.mutate(session.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View QR Code"
                  >
                    <QrCodeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleViewAttendance(session.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View Attendance"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(session.id, 'in_progress')}
                      className="p-2 text-green-400 hover:text-green-600"
                      title="Start Session"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                  )}
                  {session.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(session.id, 'completed')}
                      className="p-2 text-red-400 hover:text-red-600"
                      title="End Session"
                    >
                      <StopIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete Session"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create Classroom Session</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date *
                </label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Classroom location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Room 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    name="maxCapacity"
                    value={formData.maxCapacity}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="Additional notes about this session"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isLoading}
                  className="btn-primary"
                >
                  {createSessionMutation.isLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between p-8 border-b">
              <h3 className="text-2xl font-semibold text-gray-900 leading-tight">
                {showQRCode.session.courseTitle}
              </h3>
              <button
                onClick={() => setShowQRCode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
            </div>

            <div className="p-8 text-center">
              <div className="mb-6">
                <p className="text-lg text-gray-600">
                  {new Date(showQRCode.session.sessionDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {showQRCode.session.startTime}
                </p>
                {showQRCode.session.location && (
                  <p className="text-lg text-gray-600">{showQRCode.session.location}</p>
                )}
              </div>

              <div className="mb-6">
                <img
                  src={showQRCode.qrCodeImage}
                  alt="QR Code"
                  className="mx-auto border rounded-lg shadow-lg"
                  style={{ width: '500px', height: '500px' }}
                />
              </div>

              <p className="text-lg text-gray-600">
                Scan the QR code for attendance and classroom login
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomSessions;
