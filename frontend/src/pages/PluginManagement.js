import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const PluginManagement = () => {
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  // Function to clear cache and refetch
  const clearCacheAndRefetch = () => {
    queryClient.clear();
    queryClient.invalidateQueries('plugins');
  };

  // Fetch plugins
  const { data: pluginsData, isLoading, error } = useQuery(
    'plugins',
    async () => {
      console.log('🔍 Making API call to /core/plugins');
      try {
        const response = await api.get('/core/plugins');
        console.log('🔍 API Response:', response);
        console.log('🔍 API Response data:', response.data);
        console.log('🔍 API Response status:', response.status);
        return response;
      } catch (error) {
        console.error('🔍 API Call Error:', error);
        console.error('🔍 Error response:', error.response);
        throw error;
      }
    },
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch plugins:', error);
        console.error('Error details:', error.response?.data);
      }
    }
  );

  // Fetch plugin statistics
  const { data: statsData, error: statsError } = useQuery(
    'plugin-stats',
    () => api.get('/core/stats'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch plugin stats:', error);
      }
    }
  );

  // Plugin actions
  const enablePluginMutation = useMutation(
    (pluginName) => api.post(`/core/plugins/${pluginName}/enable`),
    {
      onSuccess: () => {
        toast.success('Plugin enabled successfully');
        queryClient.invalidateQueries('plugins');
      },
      onError: (error) => {
        toast.error('Failed to enable plugin');
        console.error('Enable plugin error:', error);
      }
    }
  );

  const disablePluginMutation = useMutation(
    (pluginName) => api.post(`/core/plugins/${pluginName}/disable`),
    {
      onSuccess: () => {
        toast.success('Plugin disabled successfully');
        queryClient.invalidateQueries('plugins');
      },
      onError: (error) => {
        toast.error('Failed to disable plugin');
        console.error('Disable plugin error:', error);
      }
    }
  );

  const reloadPluginMutation = useMutation(
    (pluginName) => api.post(`/core/plugins/${pluginName}/reload`),
    {
      onSuccess: () => {
        toast.success('Plugin reloaded successfully');
        queryClient.invalidateQueries('plugins');
      },
      onError: (error) => {
        toast.error('Failed to reload plugin');
        console.error('Reload plugin error:', error);
      }
    }
  );

  const plugins = Array.isArray(pluginsData?.data?.data) ? pluginsData.data.data : [];
  const stats = statsData?.data?.data || {};
  
  // Debug logging
  console.log('🔍 Plugins Data:', pluginsData);
  console.log('🔍 Plugins Data type:', typeof pluginsData);
  console.log('🔍 Plugins Data.data:', pluginsData?.data);
  console.log('🔍 Plugins Data.data type:', typeof pluginsData?.data);
  console.log('🔍 Plugins Data.data.data:', pluginsData?.data?.data);
  console.log('🔍 Plugins Data.data.data is array:', Array.isArray(pluginsData?.data?.data));
  console.log('🔍 Plugins Data.data.data length:', pluginsData?.data?.data?.length);
  console.log('🔍 Plugins Data.data keys:', pluginsData?.data ? Object.keys(pluginsData.data) : 'no data');
  console.log('🔍 Stats Data:', statsData);
  console.log('🔍 Processed plugins:', plugins);
  console.log('🔍 Processed stats:', stats);
  console.log('🔍 Plugins length:', plugins.length);
  console.log('🔍 Is plugins array?', Array.isArray(plugins));

  const handlePluginAction = (action, pluginName) => {
    switch (action) {
      case 'enable':
        enablePluginMutation.mutate(pluginName);
        break;
      case 'disable':
        disablePluginMutation.mutate(pluginName);
        break;
      case 'reload':
        reloadPluginMutation.mutate(pluginName);
        break;
      default:
        break;
    }
  };

  const getStatusIcon = (enabled) => {
    return enabled ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusText = (enabled) => {
    return enabled ? 'Enabled' : 'Disabled';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load plugins</h2>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plugin Management</h1>
              <p className="mt-2 text-gray-600">
                Manage and configure plugins for your CourseWorx instance
              </p>
            </div>
                         <div className="flex items-center space-x-4">
               <div className="bg-white rounded-lg p-4 shadow-sm">
                 <div className="text-sm text-gray-500">Total Plugins</div>
                 <div className="text-2xl font-bold text-blue-600">{stats.registry?.totalPlugins || plugins.length}</div>
               </div>
               <div className="bg-white rounded-lg p-4 shadow-sm">
                 <div className="text-sm text-gray-500">Enabled</div>
                 <div className="text-2xl font-bold text-green-600">{stats.registry?.enabledPlugins || plugins.filter(p => p.enabled).length}</div>
               </div>
               <button
                 onClick={clearCacheAndRefetch}
                 className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
               >
                 Refresh Data
               </button>
             </div>
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <div
              key={plugin.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Plugin Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <PuzzlePieceIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
                      <p className="text-sm text-gray-500">v{plugin.version}</p>
                    </div>
                  </div>
                  {getStatusIcon(plugin.enabled)}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{plugin.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Status: {getStatusText(plugin.enabled)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Author: {plugin.author}
                  </span>
                </div>
              </div>

              {/* Plugin Actions */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setShowDetails(true);
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <InformationCircleIcon className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  {plugin.enabled ? (
                    <button
                      onClick={() => handlePluginAction('disable', plugin.name)}
                      disabled={disablePluginMutation.isLoading}
                      className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePluginAction('enable', plugin.name)}
                      disabled={enablePluginMutation.isLoading}
                      className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Enable
                    </button>
                  )}
                  
                  <button
                    onClick={() => handlePluginAction('reload', plugin.name)}
                    disabled={reloadPluginMutation.isLoading}
                    className="bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {plugins.length === 0 && (
          <div className="text-center py-12">
            <PuzzlePieceIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins installed</h3>
            <p className="text-gray-600">
              Install plugins to extend the functionality of your CourseWorx instance.
            </p>
          </div>
        )}
      </div>

      {/* Plugin Details Modal */}
      {showDetails && selectedPlugin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedPlugin.name} Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-900">{selectedPlugin.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Version</h3>
                    <p className="text-gray-900">{selectedPlugin.version}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Author</h3>
                    <p className="text-gray-900">{selectedPlugin.author}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">License</h3>
                    <p className="text-gray-900">{selectedPlugin.license}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="text-gray-900">{getStatusText(selectedPlugin.enabled)}</p>
                  </div>
                </div>

                {selectedPlugin.metadata?.courseworx?.permissions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlugin.metadata.courseworx.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPlugin.metadata?.courseworx?.settings && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Settings</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(selectedPlugin.metadata.courseworx.settings, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginManagement;
