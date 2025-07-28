import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const TrainerAssignmentModal = ({ isOpen, onClose, courseId, currentTrainer }) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get available trainers
  const { data: trainersData, isLoading: trainersLoading, error: trainersError } = useQuery(
    ['available-trainers'],
    () => {
      console.log('Fetching available trainers...');
      return coursesAPI.getAvailableTrainers();
    },
    {
      enabled: isOpen,
      onError: (error) => {
        console.error('Trainer loading error:', error);
        toast.error('Failed to load trainers');
      },
      onSuccess: (data) => {
        console.log('Trainers loaded successfully:', data);
      }
    }
  );

  // Assign trainer mutation
  const assignTrainerMutation = useMutation(
    ({ courseId, trainerId }) => coursesAPI.assignTrainer(courseId, trainerId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses']);
        queryClient.invalidateQueries(['course', courseId]);
        toast.success('Trainer assigned successfully!');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to assign trainer');
      }
    }
  );

  const handleAssignTrainer = () => {
    if (!selectedTrainerId) {
      toast.error('Please select a trainer');
      return;
    }
    assignTrainerMutation.mutate({ courseId, trainerId: selectedTrainerId });
  };

  if (!isOpen) return null;

  // Check if user is Super Admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-4">
              Only Super Admins can assign trainers to courses.
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Assign Trainer
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {currentTrainer && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Current Trainer:</strong> {currentTrainer.firstName} {currentTrainer.lastName}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Trainer
            </label>
            {trainersLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a trainer...</option>
                {trainersData?.trainers?.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName} ({trainer.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {trainersError && (
            <div className="mb-4 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-800">
                Error loading trainers: {trainersError.message}
              </p>
            </div>
          )}
          
          {trainersData?.trainers?.length === 0 && !trainersLoading && !trainersError && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                No active trainers available. Please create trainer accounts first.
              </p>
            </div>
          )}
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: trainersData = {JSON.stringify(trainersData, null, 2)}</p>
              <p>Debug: trainersLoading = {trainersLoading}</p>
              <p>Debug: trainersError = {trainersError?.message}</p>
              <p>Debug: Current user role = {user?.role}</p>
              <p>Debug: Current user ID = {user?.id}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTrainer}
              disabled={!selectedTrainerId || assignTrainerMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignTrainerMutation.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Assign Trainer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerAssignmentModal; 