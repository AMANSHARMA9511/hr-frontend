'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Navbar({ user, title }) {
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = user?.fullName || user?.name || 'User';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.replace('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    if (role === 'admin') {
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300';
    }
    return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-300';
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/90 shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md transform transition-transform hover:scale-105 duration-200">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">HR Management System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Date & Time */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{currentTime}</span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 ml-2">
                {/* User Avatar */}
                <div className="relative group">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 ${getRoleColor(user?.role)}`}>
                    <span className="text-sm font-bold text-white">
                      {getInitials(displayName)}
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 ring-offset-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* User Details */}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {displayName}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleColor(user?.role)}`}>
                      {user?.role || 'Employee'}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1"></div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="group relative flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 overflow-hidden"
                >
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-3">
              {/* Mobile User Badge */}
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center ${getRoleColor(user?.role)}`}>
                <span className="text-xs font-bold text-white">
                  {getInitials(displayName)}
                </span>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-slideDown">
            <div className="px-4 py-3 space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center ${getRoleColor(user?.role)}`}>
                  <span className="text-lg font-bold text-white">
                    {getInitials(displayName)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${getRoleColor(user?.role)}`}>
                    {user?.role || 'Employee'}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700">{currentTime}</span>
              </div>

              {/* Logout Button Mobile */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
}