import React from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  TrashIcon, 
  InformationCircleIcon, 
  ExclamationCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

const NotificationDrawer = ({ isOpen, onClose, notifications, onUpdate }) => {
  if (!isOpen) return null;

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      onUpdate();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      onUpdate();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error': return <ExclamationCircleIcon className="h-6 w-6 text-red-400" />;
      case 'warning': return <ExclamationCircleIcon className="h-6 w-6 text-yellow-400" />;
      default: return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition-all duration-500 ease-in-out shadow-2xl">
          <div className="h-full flex flex-col bg-slate-900 border-l border-white/10 shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-8 bg-slate-800/30 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  System Hub
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-sm">
                <span className="text-slate-400">{notifications.filter(n => !n.isRead).length} unread signals</span>
                <button 
                  onClick={markAllRead}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Mark all seen
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-30 italic">
                  <InformationCircleIcon className="h-16 w-16 mb-4" />
                  <p>Silence on the network</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      notif.isRead 
                        ? 'bg-slate-800/10 border-white/5 opacity-60 grayscale' 
                        : 'bg-slate-800/40 border-indigo-500/30 shadow-indigo-500/5 shadow-lg grayscale-0 scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="mt-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(notif.createdAt))} ago
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={(e) => deleteNotification(notif.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-900 border-t border-white/10 text-center">
              <p className="text-xs text-slate-500">CourseWorx v2.0.7 — Signal Relay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
