import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersAPI } from '../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Users = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery(
    ['users', { search, role, page }],
    () => usersAPI.getAll({ search, role, page }),
    { keepPreviousData: true }
  );

  const deleteUserMutation = useMutation(
    (userId) => usersAPI.delete(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      },
    }
  );

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'badge-danger',
      trainer: 'badge-primary',
      trainee: 'badge-success',
    };
    return colors[role] || 'badge-secondary';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'badge-success' : 'badge-warning';
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage trainers and trainees in the system</p>
          </div>
          <button className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="trainer">Trainers</option>
              <option value="trainee">Trainees</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setRole('');
                setPage(1);
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData?.users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadgeColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteUserMutation.isLoading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {usersData?.users?.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || role
                ? 'Try adjusting your filters'
                : 'Get started by adding your first user'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {usersData?.pagination && usersData.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === usersData.pagination.totalPages}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(usersData.pagination.currentPage - 1) * usersData.pagination.itemsPerPage + 1}
                </span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(
                    usersData.pagination.currentPage * usersData.pagination.itemsPerPage,
                    usersData.pagination.totalItems
                  )}
                </span>
                {' '}of{' '}
                <span className="font-medium">{usersData.pagination.totalItems}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: usersData.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === page
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === usersData.pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 