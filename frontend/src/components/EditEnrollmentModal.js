import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { enrollmentsAPI } from '../services/api';
import {
  XMarkIcon,
  AcademicCapIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EditEnrollmentModal = ({ isOpen, onClose, trainee, course }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    status: trainee?.status || 'active',
    notes: trainee?.notes || '',
    paymentAmount: trainee?.paymentAmount || 0,
    paymentStatus: trainee?.paymentStatus || 'pending'
  });

  const updateEnrollmentMutation = useMutation(
    (data) => enrollmentsAPI.update(trainee.enrollmentId, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['enrollments', 'course', course.id, 'trainees']);
        queryClient.invalidateQueries(['trainee', trainee.id]);
        toast.success('Enrollment updated successfully');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update enrollment');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    updateEnrollmentMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen || !trainee || !course) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {trainee.firstName?.charAt(0)}{trainee.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Edit Enrollment</h3>
              <p className="text-sm text-gray-500">{trainee.firstName} {trainee.lastName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AcademicCapIcon className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">{course.title}</h4>
                <p className="text-sm text-gray-500">Course Enrollment Details</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add notes about this enrollment..."
            />
          </div>

          {/* Warning for status changes */}
          {(formData.status === 'suspended' || formData.status === 'cancelled') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Changing the status to <strong>{formData.status}</strong> will affect the trainee's access to course content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={updateEnrollmentMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={updateEnrollmentMutation.isLoading}
            >
              {updateEnrollmentMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Update Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEnrollmentModal;
