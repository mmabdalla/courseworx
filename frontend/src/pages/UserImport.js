import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import {
  DocumentArrowUpIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const UserImport = () => {
  const { isSuperAdmin, isTrainer } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const importUsersMutation = useMutation(
    (data) => usersAPI.importUsers(data),
    {
      onSuccess: (response) => {
        setImportResults(response.data);
        queryClient.invalidateQueries(['users']);
        toast.success('Users imported successfully!');
        setLoading(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to import users');
        setLoading(false);
      },
    }
  );

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }

      setFile(selectedFile);
      
      // Preview the file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvContent = event.target.result;
        const lines = csvContent.split('\n').slice(0, 6); // Show first 5 rows
        setPreview(lines.join('\n'));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', 'trainee');
    formData.append('defaultPassword', 'changeme123');

    importUsersMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    const template = `firstName,lastName,email,phone
John,Doe,john.doe@example.com,+1234567890
Jane,Smith,jane.smith@example.com,+1234567891
Mike,Johnson,mike.johnson@example.com,+1234567892`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trainees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isSuperAdmin && !isTrainer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to import users.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center">
          <UserPlusIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Trainees</h1>
            <p className="text-gray-600">Upload a CSV file to create trainee accounts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload CSV File</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-file"
                  />
                  <label
                    htmlFor="csv-file"
                    className="cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">CSV files only</p>
                </div>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>All imported users will have the role "trainee"</li>
                      <li>Default password will be "changeme123"</li>
                      <li>Users will be prompted to change password on first login</li>
                      <li>Duplicate emails will be skipped</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={downloadTemplate}
                className="btn-secondary flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Template
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Importing...</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Import Users
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">File Preview</h2>
          
          {preview ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">CSV Preview (first 5 rows):</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                {preview}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No file selected</p>
              <p className="text-sm">Upload a CSV file to see preview</p>
            </div>
          )}

          {/* CSV Format Instructions */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Required CSV Format:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Header row:</strong> firstName,lastName,email,phone</p>
              <p><strong>Example:</strong> John,Doe,john@example.com,+1234567890</p>
              <p><strong>Note:</strong> Phone number is optional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="card mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Import Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Successfully Created</p>
                  <p className="text-2xl font-bold text-green-600">{importResults.created}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Skipped (Duplicates)</p>
                  <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
                </div>
              </div>
            </div>
          </div>

          {importResults.errorDetails && importResults.errorDetails.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details:</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults.errorDetails.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserImport; 