import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/outline';
import api from '../services/api';
import NotificationDrawer from './NotificationDrawer';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const data = response.data.notifications || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-300 relative group"
      >
        <BellIcon className="h-6 w-6 transform group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-slate-900 animate-pulse"></span>
        )}
      </button>

      <NotificationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        notifications={notifications}
        onUpdate={fetchNotifications}
      />
    </div>
  );
};

export default NotificationBell;
