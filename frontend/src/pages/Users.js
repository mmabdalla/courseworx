import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const initialUserState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'trainee',
  isActive: true,
};

const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [userForm, setUserForm] = useState(initialUserState);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Add User handler
  const openAddUserModal = () => {
    setUserForm(initialUserState);
    setModalMode('add');
    setEditingUserId(null);
    setModalIsOpen(true);
  };

  // Edit User handler
  const openEditUserModal = (user) => {
    setUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'trainee',
      isActive: user.isActive,
    });
    setModalMode('edit');
    setEditingUserId(user.id);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditingUserId(null);
  };

  // Add/Edit User submit handler
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        // For new users, we need to include a password
        const userData = {
          ...userForm,
          password: 'defaultPassword123' // You might want to generate this or ask user to set it
        };
        await authAPI.register(userData);
        toast.success('User added successfully!');
      } else if (modalMode === 'edit' && editingUserId) {
        await usersAPI.update(editingUserId, userForm);
        toast.success('User updated successfully!');
      }
      queryClient.invalidateQueries(['usersV2']);
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    changePasswordMutation.mutate({ userId: editingUserId, password: newPassword });
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const { data: usersData, isLoading } = useQuery(
    ['usersV2', { search, role, page }],
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

  const changePasswordMutation = useMutation(
    ({ userId, password }) => usersAPI.changePassword(userId, password),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setNewPassword('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to change password');
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

  console.log('usersData', usersData);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage trainers and trainees in the system</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/users/import"
              className="btn-secondary flex items-center"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Import Users
            </Link>
            <button className="btn-primary flex items-center" onClick={openAddUserModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
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
              {usersData?.data?.users?.map((user) => (
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
                        onClick={() => openEditUserModal(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteUserMutation.isLoading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {usersData?.data?.users?.length === 0 && (
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
      {usersData?.data?.pagination && usersData.data.pagination.totalPages > 1 && (
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
              disabled={page === usersData.data.pagination.totalPages}
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
                  {(usersData.data.pagination.currentPage - 1) * usersData.data.pagination.itemsPerPage + 1}
                </span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(
                    usersData.data.pagination.currentPage * usersData.data.pagination.itemsPerPage,
                    usersData.data.pagination.totalItems
                  )}
                </span>
                {' '}of{' '}
                <span className="font-medium">{usersData.data.pagination.totalItems}</span>
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
                {Array.from({ length: usersData.data.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                  disabled={page === usersData.data.pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal (Pure React + Tailwind) */}
      {modalIsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Add User' : 'Edit User'}</h2>
            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" name="firstName" value={userForm.firstName} onChange={handleFormChange} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input type="text" name="lastName" value={userForm.lastName} onChange={handleFormChange} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" value={userForm.email} onChange={handleFormChange} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="text" name="phone" value={userForm.phone} onChange={handleFormChange} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select name="role" value={userForm.role} onChange={handleFormChange} className="input-field w-full">
                  <option value="trainee">Trainee</option>
                  <option value="trainer">Trainer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="isActive" checked={userForm.isActive} onChange={handleFormChange} className="mr-2" />
                <label className="text-sm">Active</label>
              </div>
              
              {/* Password Change Section for Super Admin */}
              {modalMode === 'edit' && isSuperAdmin && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Change Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="input-field w-full" 
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={handlePasswordChange}
                        disabled={!newPassword.trim() || newPassword.length < 6 || changePasswordMutation.isLoading}
                        className="btn-secondary text-sm"
                      >
                        {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{modalMode === 'add' ? 'Add' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 