// components/AttendanceMark.jsx or AttendanceMark.tsx

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/apiClient';

export default function AttendanceMark({ onSuccess }) {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Failed to check attendance');
    }
  };

  const markAttendance = async (status) => {
    setLoading(true);
    try {
      await api.post('/attendance/mark', { status });
      toast.success(`Attendance marked as ${status}!`);
      checkTodayAttendance();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const todayDate = new Date();
  const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;

  return (
    <div className="space-y-4">
      {/* Current Date and Time Display */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="text-2xl font-bold text-gray-800">
          {formatDate(todayDate)}
        </div>
        <div className="text-lg text-gray-600 mt-1 font-mono">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {todayDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
      </div>

      {todayAttendance ? (
        <div className="rounded-xl border p-4 text-center bg-gray-50">
          <div className="flex items-center justify-center gap-2 mb-2">
            {todayAttendance.status === 'Present' ? (
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-lg font-semibold text-gray-800">
            You were marked {todayAttendance.status} today
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Marked at: {formatTime(todayAttendance.markedAt || todayAttendance.createdAt)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Date: {formatDate(todayAttendance.date)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {isWeekend ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-yellow-800 font-medium">🎉 Weekend!</p>
              <p className="text-sm text-yellow-600 mt-1">Today is a non-working day. Enjoy your weekend!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => markAttendance('Present')}
                  disabled={loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Present
                  </span>
                </button>
                
                <button
                  onClick={() => markAttendance('Absent')}
                  disabled={loading}
                  className="bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Mark Absent
                  </span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                ⏰ Mark your attendance for {formatDate(todayDate)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}