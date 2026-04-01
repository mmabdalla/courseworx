import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordChangeModal from './PasswordChangeModal';
import ShoppingCart from './ShoppingCart';
import {
  HomeIcon,
  AcademicCapIcon,
  UsersIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  PuzzlePieceIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  BellIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

const Layout = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Check if user requires password change
  useEffect(() => {
    if (user?.requiresPasswordChange) {
      setShowPasswordModal(true);
    }
  }, [user?.requiresPasswordChange]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const navigation = [
    { name: 'Courses', href: '/courses', icon: AcademicCapIcon },
    ...(user?.role === 'trainee' ? [{ name: 'Attendance Tracker', href: '/attendance/tracker', icon: CalendarDaysIcon }] : []),
    ...(isSuperAdmin ? [{ name: 'Users', href: '/users', icon: UsersIcon }] : []),
    ...(isSuperAdmin ? [{ name: 'Plugin Management', href: '/plugin-management', icon: PuzzlePieceIcon }] : []),
    ...(isSuperAdmin ? [{ name: 'Financial Dashboard', href: '/financial-dashboard', icon: CurrencyDollarIcon }] : []),
    ...(isSuperAdmin ? [{ name: 'Currency Management', href: '/admin/currencies', icon: CurrencyDollarIcon }] : []),
    ...(isSuperAdmin ? [{ name: 'System Logs', href: '/admin/logs', icon: CommandLineIcon }] : []),
    ...(user?.role === 'trainer' ? [{ name: 'My Earnings', href: '/trainer/earnings', icon: BanknotesIcon }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">CX</span>
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Home</span>
            </button>
            
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* User dropdown menu */}
        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          {/* Shopping Cart - Only for trainees */}
          {user?.role === 'trainee' && (
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 relative"
              title="Shopping Cart"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {/* Cart badge would go here if we had cart item count */}
            </button>
          )}
          
          {/* Notifications */}
          <NotificationBell />
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          
          <div className="relative user-menu pt-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform active:scale-95"
            >
              <div className="h-9 w-9 rounded-full bg-primary-600 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5 font-medium tracking-wide">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Profile
                  </a>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
      
      {/* Shopping Cart Modal */}
      <ShoppingCart 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
    </div>
  );
};

export default Layout; 