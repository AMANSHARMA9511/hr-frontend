'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/apiClient';

export default function AttendanceMark({ onSuccess }) {
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const res = await api.get('/attendance/my-attendance');
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayRecord = res.data.find(record => 
        new Date(record.date).toLocaleDateString('en-CA') === today
      );
      if (todayRecord) {
        setMarkedToday(true);
        setTodayStatus(todayRecord.status);
      }
    } catch (error) {
      console.error('Failed to check attendance');
    }
  };

  const handleMarkAttendance = async (status) => {
    setLoading(true);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    try {
      await api.post('/attendance/mark', { status, date: today });
      toast.success(`✅ Attendance marked as ${status}!`);
      setMarkedToday(true);
      setTodayStatus(status);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (markedToday) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-green-800 font-semibold">Attendance Marked!</p>
            <p className="text-sm text-green-600">
              You are marked as <strong>{todayStatus}</strong> for today ({currentTime.toLocaleTimeString()})
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Mark Today's Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">
            Current Time: <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleMarkAttendance('Present')}
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? '⏳...' : '✅ Present'}
          </button>
          <button
            onClick={() => handleMarkAttendance('Absent')}
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? '⏳...' : '❌ Absent'}
          </button>
        </div>
      </div>
    </div>
  );
}