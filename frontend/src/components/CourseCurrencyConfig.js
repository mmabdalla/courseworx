import React, { useState, useEffect } from 'react';

/**
 * Course Currency Configuration Component
 * 
 * Allows instructors to define and manage the internal currency for their courses.
 * This currency can be used for rewards, purchasing additional materials, or as 
 * a gamification element within the CourseWorx ecosystem.
 * 
 * Features:
 * - Define currency name and symbol
 * - Set global exchange rates
 * - Configure earning rules (points per lesson, points per quiz)
 * - Visual preview of currency branding
 */
const CourseCurrencyConfig = ({ courseId }) => {
  const [config, setConfig] = useState({
    name: 'Course Credits',
    symbol: 'CC',
    exchangeRate: 1.0,
    earningRate: 10,
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Use the standard backend port 5000 for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  /**
   * EFFECT: Fetch existing currency configuration on component mount.
   */
  useEffect(() => {
    const fetchConfig = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/currency`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data) setConfig(data);
        }
      } catch (error) {
        console.error('Failed to fetch currency config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [courseId, API_BASE_URL]);

  /**
   * ACTION: Save the updated configuration to the backend.
   */
  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: 'info', text: 'Saving configuration...' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/currency`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * UI: Render the configuration form.
   */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Course Currency Management</h2>
        <p className="text-sm text-slate-500">Configure how students earn and spend rewards in your course.</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Currency Name</label>
            <input 
              type="text"
              value={config.name}
              onChange={(e) => setConfig({...config, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              placeholder="e.g. Brain Points"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Currency Symbol/Code</label>
            <input 
              type="text"
              value={config.symbol}
              onChange={(e) => setConfig({...config, symbol: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              placeholder="e.g. BP"
            />
          </div>
        </div>

        {/* Economic Rules */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-800">Earning Rules</h3>
          <div className="flex items-center gap-4 bg-sky-50 p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-xs font-bold text-sky-700 uppercase mb-1">Points per Lesson</label>
              <input 
                type="number"
                value={config.earningRate}
                onChange={(e) => setConfig({...config, earningRate: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="text-slate-400 font-light text-2xl">×</div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Example Reward</p>
              <div className="h-10 flex items-center px-3 font-medium text-slate-700">
                {config.earningRate} {config.symbol} per completion
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Branding Preview</label>
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl text-white inline-flex">
            <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center font-bold text-lg">
              {config.symbol.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Your Balance</div>
              <div className="text-xl font-black">500 <span className="text-sky-400">{config.symbol}</span></div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-900/20'
            }`}
          >
            {loading ? 'Processing...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCurrencyConfig;
