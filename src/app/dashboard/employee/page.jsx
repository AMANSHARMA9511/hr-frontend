'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LeaveForm from '@/components/LeaveForm';
import AttendanceMark from '@/components/AttendanceMark';
import LeaveHistory from '@/components/LeaveHistory';
import AttendanceHistory from '@/components/AttendanceHistory';
import StatsCard from '@/components/StatsCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/apiClient';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const displayName = user?.fullName || user?.name || 'Employee';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userData = storedUser?.user ? storedUser.user : storedUser;
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUser(userData);
    setGreeting(getGreeting());
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, attendanceRes] = await Promise.all([
        api.get('/leave/my-leaves'),
        api.get('/attendance/my-attendance')
      ]);
      setLeaves(leavesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const totalLeavesTaken = leaves
    .filter(l => l.status === 'Approved')
    .reduce((sum, l) => sum + l.totalDays, 0);

  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const attendanceRate = attendance.length > 0 
    ? ((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1)
    : 0;

  // Get current month stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const currentMonthPresent = currentMonthAttendance.filter(a => a.status === 'Present').length;
  const currentMonthRate = currentMonthAttendance.length > 0 
    ? ((currentMonthPresent / currentMonthAttendance.length) * 100).toFixed(1)
    : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <Navbar user={user} title="Employee Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="rounded-2xl shadow-lg border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
              <div>
                <p className="text-sm font-semibold text-blue-700">{greeting}</p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900">
                  {displayName.split(' ')[0]} 👋
                </h1>
                <p className="text-sm mt-2 text-gray-700">
                  Welcome back to your HR dashboard. Here is your latest overview.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                <div className="rounded-xl px-4 py-3 text-center bg-white border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600 font-medium">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {user?.joiningDate ? new Date(user.joiningDate).getFullYear() : '2024'}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3 text-center bg-white border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600 font-medium">Role</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize mt-1">{user?.role || 'employee'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard 
            title="Leave Balance" 
            value={`${user?.leaveBalance || 0}`} 
            subtitle="days remaining"
            color="blue"
            icon="🏖️"
            trend={user?.leaveBalance > 10 ? "Good" : "Low"}
          />
          <StatsCard 
            title="Leaves Taken" 
            value={`${totalLeavesTaken}`} 
            subtitle="days used"
            color="orange"
            icon="📅"
            trend={totalLeavesTaken > 15 ? "High" : "Normal"}
          />
          <StatsCard 
            title="Pending Requests" 
            value={pendingLeaves} 
            subtitle="waiting approval"
            color="yellow"
            icon="⏳"
            trend={pendingLeaves > 0 ? "Action Needed" : "All Clear"}
          />
          <StatsCard 
            title="Overall Attendance" 
            value={`${attendanceRate}%`} 
            subtitle="this year"
            color="purple"
            icon="📊"
            trend={attendanceRate >= 90 ? "Excellent" : attendanceRate >= 75 ? "Good" : "Needs Improvement"}
          />
        </div>

        {/* Current Month Highlight Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-lg p-5 text-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-semibold">This Month's Attendance</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{currentMonthRate}%</p>
                <p className="text-sm text-gray-700 mt-2">
                  {currentMonthPresent} / {currentMonthAttendance.length} days present
                </p>
              </div>
              <div className="text-5xl">📈</div>
            </div>
            <div className="mt-4 h-2 bg-green-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 rounded-full transition-all duration-500"
                style={{ width: `${currentMonthRate}%` }}
              />
            </div>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl shadow-lg p-5 text-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 font-semibold">Quick Stats</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{leaves.length}</p>
                    <p className="text-xs text-gray-700">Total Leaves</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{leaves.filter(l => l.status === 'Approved').length}</p>
                    <p className="text-xs text-gray-700">Approved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{leaves.filter(l => l.status === 'Rejected').length}</p>
                    <p className="text-xs text-gray-700">Rejected</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
                    <p className="text-xs text-gray-700">Total Days</p>
                  </div>
                </div>
              </div>
              <div className="text-5xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setShowLeaveForm(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <span className="relative z-10 flex items-center justify-center">
              ✈️ Apply for Leave
            </span>
          </button>
          
          <button
            onClick={() => {
              document.getElementById('attendance-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:border-blue-500 hover:shadow-md transition-all duration-300"
          >
            📋 View Attendance History
          </button>
        </div>

        {/* Attendance Marking Section */}
        <div id="attendance-section" className="mb-8 scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                Today's Attendance
              </h2>
            </div>
            <div className="p-6">
              <AttendanceMark onSuccess={fetchData} />
            </div>
          </div>
        </div>

        {/* Leave History Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                Leave History
              </h2>
            </div>
            <div className="p-6">
              <LeaveHistory leaves={leaves} onCancel={fetchData} />
            </div>
          </div>
        </div>

        {/* Attendance History Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Attendance History
              </h2>
            </div>
            <div className="p-6">
              <AttendanceHistory attendance={attendance} />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Form Modal */}
      {showLeaveForm && (
        <LeaveForm 
          onSuccess={fetchData} 
          onClose={() => setShowLeaveForm(false)} 
        />
      )}
    </div>
  );
}