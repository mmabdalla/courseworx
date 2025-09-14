import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, enrollmentsAPI, traineeProgressAPI, traineeAttendanceAPI, traineeAssignmentsAPI, userNotesAPI } from '../services/api';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  StarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TraineeDetails = () => {
  const { courseId, traineeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Get course details
  const { data: course, isLoading: courseLoading } = useQuery(
    ['course', courseId],
    () => coursesAPI.getById(courseId),
    { enabled: !!courseId }
  );

  // Get trainee details
  const { data: trainee, isLoading: traineeLoading } = useQuery(
    ['trainee', traineeId],
    () => enrollmentsAPI.getTraineeDetails(courseId, traineeId),
    { enabled: !!courseId && !!traineeId }
  );

  // Get trainee progress
  const { data: progress, isLoading: progressLoading } = useQuery(
    ['trainee-progress', courseId, traineeId],
    () => traineeProgressAPI.getTraineeProgress(courseId, traineeId),
    { enabled: !!courseId && !!traineeId }
  );

  // Get attendance data
  const { data: attendance, isLoading: attendanceLoading } = useQuery(
    ['trainee-attendance', courseId, traineeId],
    () => traineeAttendanceAPI.getTraineeAttendance(courseId, traineeId),
    { enabled: !!courseId && !!traineeId }
  );

  // Get assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery(
    ['trainee-assignments', courseId, traineeId],
    () => traineeAssignmentsAPI.getTraineeAssignments(courseId, traineeId),
    { enabled: !!courseId && !!traineeId }
  );

  // Get notes and communication
  const { data: notes, isLoading: notesLoading } = useQuery(
    ['trainee-notes', courseId, traineeId],
    () => userNotesAPI.getTraineeNotes(courseId, traineeId),
    { enabled: !!courseId && !!traineeId }
  );

  const isLoading = courseLoading || traineeLoading || progressLoading || attendanceLoading || assignmentsLoading || notesLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!trainee || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trainee Not Found</h2>
          <p className="text-gray-600 mb-4">The requested trainee could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'progress', name: 'Progress', icon: AcademicCapIcon },
    { id: 'attendance', name: 'Attendance', icon: CalendarDaysIcon },
    { id: 'assignments', name: 'Assignments', icon: DocumentTextIcon },
    { id: 'communication', name: 'Communication', icon: ChatBubbleLeftRightIcon }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatus = (status) => {
    switch (status) {
      case 'present': return { color: 'text-green-600', icon: CheckCircleIcon };
      case 'absent': return { color: 'text-red-600', icon: XCircleIcon };
      case 'late': return { color: 'text-yellow-600', icon: ClockIcon };
      default: return { color: 'text-gray-600', icon: ClockIcon };
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Trainee Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {trainee.firstName?.charAt(0)}{trainee.lastName?.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {trainee.firstName} {trainee.lastName}
            </h2>
            <p className="text-gray-600">{trainee.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trainee.status)}`}>
                {trainee.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Enrolled</p>
            <p className="text-lg font-semibold">
              {new Date(trainee.enrolledAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progress?.overallProgress || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {progress?.completedLessons || 0}/{progress?.totalLessons || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{attendance?.attendanceRate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments?.completed || 0}/{assignments?.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {progress?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h3>
        <div className="space-y-4">
          {progress?.sections?.map((section, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{section.name}</h4>
                <span className="text-sm text-gray-500">{section.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${section.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {section.completedLessons}/{section.totalLessons} lessons completed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Progress */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {progress?.lessons?.map((lesson, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                    <div className="text-sm text-gray-500">{lesson.section}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lesson.status === 'completed' ? 'bg-green-100 text-green-800' :
                      lesson.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lesson.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lesson.completedAt ? new Date(lesson.completedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lesson.timeSpent || '0 min'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{attendance?.present || 0}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{attendance?.absent || 0}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{attendance?.late || 0}</div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {attendance?.history?.map((record, index) => {
                const statusInfo = getAttendanceStatus(record.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.duration || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      {/* Assignment Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{assignments?.total || 0}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{assignments?.completed || 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{assignments?.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{assignments?.overdue || 0}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {assignments?.list?.map((assignment, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{assignment.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span>Points: {assignment.points}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
              {assignment.submission && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900">Submission</h5>
                  <p className="text-sm text-gray-600 mt-1">{assignment.submission.content}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
                  </div>
                  {assignment.submission.grade && (
                    <div className="mt-2">
                      <span className="font-medium">Grade: </span>
                      <span className="text-primary-600 font-bold">{assignment.submission.grade}/{assignment.points}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      {/* Notes and Communication */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Notes & Communication</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {notes?.map((note, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {note.type} • {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      note.type === 'feedback' ? 'bg-blue-100 text-blue-800' :
                      note.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      note.type === 'achievement' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {note.type}
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No notes or communication yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {trainee.firstName} {trainee.lastName}
                </h1>
                <p className="text-sm text-gray-600">{course.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/courses/${courseId}/enrollment`)}
                className="btn-secondary"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Enrollment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'progress' && renderProgress()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'assignments' && renderAssignments()}
          {activeTab === 'communication' && renderCommunication()}
        </div>
      </div>
    </div>
  );
};

export default TraineeDetails;
