import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI, enrollmentsAPI } from '../services/api';
import {
  UserPlusIcon,
  UsersIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CourseEnrollment = () => {
  const { id } = useParams();
  const { user, isTrainer, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Get course details
  const { data: course, isLoading: courseLoading } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { enabled: !!id }
  );

  // Get enrolled trainees
  const { data: enrolledData, isLoading: enrolledLoading } = useQuery(
    ['enrollments', 'course', id, 'trainees'],
    () => enrollmentsAPI.getCourseTrainees(id),
    { enabled: !!id }
  );

  // Get available trainees
  const { data: availableData, isLoading: availableLoading } = useQuery(
    ['enrollments', 'available-trainees', id],
    () => enrollmentsAPI.getAvailableTrainees({ courseId: id }),
    { enabled: !!id && showAssignModal }
  );

  // Bulk enrollment mutation
  const bulkEnrollMutation = useMutation(
    (data) => enrollmentsAPI.bulkEnroll(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['enrollments', 'course', id, 'trainees']);
        queryClient.invalidateQueries(['enrollments', 'available-trainees', id]);
        toast.success(data.message);
        setShowAssignModal(false);
        setSelectedTrainees([]);
        setAssigning(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to assign trainees');
        setAssigning(false);
      }
    }
  );

  // Single trainee assignment mutation
  const assignTraineeMutation = useMutation(
    (data) => enrollmentsAPI.assignTrainee(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['enrollments', 'course', id, 'trainees']);
        queryClient.invalidateQueries(['enrollments', 'available-trainees', id]);
        toast.success(data.message);
        setShowAssignModal(false);
        setSelectedTrainees([]);
        setAssigning(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to assign trainee');
        setAssigning(false);
      }
    }
  );

  const handleBulkAssign = async () => {
    if (selectedTrainees.length === 0) {
      toast.error('Please select at least one trainee');
      return;
    }

    setAssigning(true);
    bulkEnrollMutation.mutate({
      courseId: id,
      traineeIds: selectedTrainees,
      status: 'active',
      notes: `Bulk assigned by ${user.firstName} ${user.lastName}`
    });
  };

  const handleSingleAssign = async (traineeId) => {
    setAssigning(true);
    assignTraineeMutation.mutate({
      courseId: id,
      traineeId,
      status: 'active',
      notes: `Assigned by ${user.firstName} ${user.lastName}`
    });
  };

  const toggleTraineeSelection = (traineeId) => {
    setSelectedTrainees(prev => 
      prev.includes(traineeId) 
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const filteredAvailableTrainees = availableData?.trainees?.filter(trainee =>
    trainee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.phone?.includes(searchTerm)
  ) || [];

  const isLoading = courseLoading || enrolledLoading;

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Course not found.</p>
      </div>
    );
  }

  // Check if user has permission to manage this course
  const canManage = isSuperAdmin || (isTrainer && course.trainerId === user.id);
  if (!canManage) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to manage this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Enrollment</h1>
          <p className="text-gray-600">Manage trainees for "{course.title}"</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/courses/${id}`}
            className="btn-secondary"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Course
          </Link>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Assign Trainees
          </button>
        </div>
      </div>

      {/* Course Info */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
            <p className="text-sm text-gray-500">
              Trainer: {course.trainer?.firstName} {course.trainer?.lastName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Enrolled Trainees</p>
            <p className="text-2xl font-bold text-primary-600">
              {enrolledData?.trainees?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Enrolled Trainees */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Enrolled Trainees</h3>
          <span className="text-sm text-gray-500">
            {enrolledData?.trainees?.length || 0} trainees
          </span>
        </div>

        {enrolledData?.trainees?.length > 0 ? (
          <div className="space-y-3">
            {enrolledData.trainees.map((trainee) => (
              <div key={trainee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {trainee.firstName?.charAt(0)}{trainee.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {trainee.firstName} {trainee.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{trainee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-sm font-medium">{trainee.progress || 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      trainee.status === 'active' ? 'bg-green-100 text-green-800' :
                      trainee.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      trainee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trainee.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                      {trainee.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                      {trainee.status === 'completed' && <CheckIcon className="h-3 w-3 mr-1" />}
                      {trainee.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trainees enrolled yet.</p>
            <p className="text-sm text-gray-400">Assign trainees to get started.</p>
          </div>
        )}
      </div>

      {/* Assign Trainees Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Trainees</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Available Trainees */}
            <div className="max-h-96 overflow-y-auto">
              {availableLoading ? (
                <LoadingSpinner size="md" />
              ) : filteredAvailableTrainees.length > 0 ? (
                <div className="space-y-2">
                  {filteredAvailableTrainees.map((trainee) => (
                    <div key={trainee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTrainees.includes(trainee.id)}
                          onChange={() => toggleTraineeSelection(trainee.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {trainee.firstName?.charAt(0)}{trainee.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {trainee.firstName} {trainee.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{trainee.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSingleAssign(trainee.id)}
                        disabled={assigning}
                        className="btn-secondary btn-sm"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available trainees found.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={selectedTrainees.length === 0 || assigning}
                className="btn-primary"
              >
                {assigning ? 'Assigning...' : `Assign ${selectedTrainees.length} Trainees`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollment; 