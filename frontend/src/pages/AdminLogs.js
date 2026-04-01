import React, { useState, useEffect } from 'react';
import { 
  TerminalIcon, 
  TrashIcon, 
  RefreshIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/outline';
import api from '../services/api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/logs');
      setLogs(response.data.logs || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all system logs? This cannot be undone.')) return;
    try {
      await api.post('/admin/logs/clear');
      setLogs([]);
    } catch (err) {
      alert('Failed to clear logs');
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000); // Refresh Every 10s
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getLogColor = (line) => {
    if (line.includes('ERROR')) return 'text-red-400';
    if (line.includes('WARN')) return 'text-yellow-400';
    if (line.includes('EVENT')) return 'text-blue-400';
    return 'text-gray-300';
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TerminalIcon className="h-8 w-8 text-indigo-500" />
              System Power Logs
            </h1>
            <p className="text-slate-400 mt-1">Real-time backend audit trail and error monitoring</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                autoRefresh ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </button>
            <button 
              onClick={fetchLogs}
              className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors"
              title="Manual Refresh"
            >
              <RefreshIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={clearLogs}
              className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-all"
              title="Clear Logs"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400">
            <ExclamationCircleIcon className="h-6 w-6" />
            {error}
          </div>
        )}

        <div className="bg-black/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <span className="text-xs text-slate-500 ml-2 font-mono">system.log — {logs.length} entries</span>
          </div>
          
          <div className="p-4 font-mono text-sm overflow-y-auto max-h-[70vh] custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <InformationCircleIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>No log data available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className={`${getLogColor(log)} transition-colors hover:bg-white/5 px-2 py-0.5 rounded`}>
                    <span className="opacity-30 mr-3 select-none">{logs.length - idx}</span>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-6 text-center">
          <p className="text-slate-600 text-xs">
            CourseWorx v2.0.7 System Monitoring Utility
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLogs;
