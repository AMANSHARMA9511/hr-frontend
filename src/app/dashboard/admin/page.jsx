'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/services/apiClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedTab, setSelectedTab] = useState('leaves');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminName, setAdminName] = useState('Admin');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Salary calculation constants (adjust as per company policy)
  const DAILY_SALARY = 1000; // Example: ₹1000 per day
  const MONTHLY_SALARY = 30000; // Example: ₹30,000 per month

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const user = storedUser?.user ? storedUser.user : storedUser;

    if (!token || user?.role !== 'admin') {
      router.push('/login');
      return;
    }

    if (user?.fullName) {
      setAdminName(user.fullName);
    } else if (user?.name) {
      setAdminName(user.name);
    } else if (user?.email) {
      setAdminName(user.email.split('@')[0]);
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, leavesRes, attendanceRes] = await Promise.all([
        api.get('/admin/employees'),
        api.get('/admin/leaves'),
        api.get('/admin/attendance')
      ]);
      setEmployees(employeesRes.data);
      setLeaves(leavesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await api.put(`/admin/leaves/${id}`, { status });
      toast.success(`Leave ${status.toLowerCase()} successfully!`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update leave');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.replace('/login');
  };

  const getDisplayName = (person) => person?.fullName || person?.name || 'Unknown';

  const getStatusBadgeClass = (status) => {
    if (status === 'Approved') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  // Get employee monthly attendance with date-wise details
  const getEmployeeMonthlyAttendance = (employeeId) => {
    const employeeAttendance = attendance.filter(record =>
      record.userId?._id === employeeId || record.userId === employeeId
    );

    const filteredByMonth = employeeAttendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });

    const present = filteredByMonth.filter(record => record.status === 'Present').length;
    const absent = filteredByMonth.filter(record => record.status === 'Absent').length;
    const total = filteredByMonth.length;

    return { present, absent, total, records: filteredByMonth };
  };

  // Get employee monthly leaves with date-wise details
  const getEmployeeMonthlyLeaves = (employeeId) => {
    const employeeLeaves = leaves.filter(leave =>
      leave.userId?._id === employeeId || leave.userId === employeeId
    );

    const filteredByMonth = employeeLeaves.filter(leave => {
      const startDate = new Date(leave.startDate);
      return startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear;
    });

    const approved = filteredByMonth.filter(leave => leave.status === 'Approved').length;
    const pending = filteredByMonth.filter(leave => leave.status === 'Pending').length;
    const rejected = filteredByMonth.filter(leave => leave.status === 'Rejected').length;
    const totalDays = filteredByMonth.reduce((sum, leave) => sum + (leave.totalDays || 0), 0);

    return { approved, pending, rejected, totalDays, records: filteredByMonth };
  };

  // Calculate salary for the month
  const calculateSalary = (attendanceData, leavesData) => {
    const workingDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const presentDays = attendanceData.present;
    const leaveDays = leavesData.totalDays;
    const absentDays = attendanceData.absent;

    // Salary calculation logic
    // Option 1: Based on daily rate
    const salaryByDailyRate = presentDays * DAILY_SALARY;

    // Option 2: Based on monthly salary with deduction for absent days
    const dailyRateFromMonthly = MONTHLY_SALARY / workingDaysInMonth;
    const salaryWithDeduction = MONTHLY_SALARY - (absentDays * dailyRateFromMonthly);

    return {
      workingDaysInMonth,
      presentDays,
      absentDays,
      leaveDays,
      salaryByDailyRate: salaryByDailyRate.toFixed(2),
      salaryWithDeduction: salaryWithDeduction.toFixed(2),
      dailyRate: DAILY_SALARY,
      monthlySalary: MONTHLY_SALARY
    };
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const exportToCSV = () => {
    if (!selectedEmployee) return;

    const attendanceData = getEmployeeMonthlyAttendance(selectedEmployee._id);
    const leavesData = getEmployeeMonthlyLeaves(selectedEmployee._id);
    const salaryData = calculateSalary(attendanceData, leavesData);

    const csvRows = [];

    // Header
    csvRows.push(['Employee Monthly Report', selectedEmployee.fullName || selectedEmployee.name]);
    csvRows.push(['Month', new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })]);
    csvRows.push(['Year', selectedYear]);
    csvRows.push([]);

    // Attendance Summary
    csvRows.push(['ATTENDANCE SUMMARY']);
    csvRows.push(['Total Working Days', 'Present', 'Absent', 'Leave Days', 'Attendance Percentage']);
    const attendancePercentage = attendanceData.total > 0
      ? ((attendanceData.present / attendanceData.total) * 100).toFixed(2)
      : 0;
    csvRows.push([salaryData.workingDaysInMonth, attendanceData.present, attendanceData.absent, leavesData.totalDays, `${attendancePercentage}%`]);
    csvRows.push([]);

    // Salary Calculation
    csvRows.push(['SALARY CALCULATION']);
    csvRows.push(['Description', 'Amount']);
    csvRows.push(['Monthly Salary', `₹${salaryData.monthlySalary}`]);
    csvRows.push(['Daily Rate', `₹${salaryData.dailyRate}`]);
    csvRows.push(['Present Days', attendanceData.present]);
    csvRows.push(['Leave Days Taken', leavesData.totalDays]);
    csvRows.push(['Absent Days', attendanceData.absent]);
    csvRows.push(['Salary (Based on Daily Rate)', `₹${salaryData.salaryByDailyRate}`]);
    csvRows.push(['Salary (Monthly - Deduction)', `₹${salaryData.salaryWithDeduction}`]);
    csvRows.push([]);

    // Detailed Attendance
    csvRows.push(['DETAILED ATTENDANCE']);
    csvRows.push(['Date', 'Status', 'Marked At']);
    attendanceData.records.forEach(record => {
      csvRows.push([
        new Date(record.date).toLocaleDateString(),
        record.status,
        new Date(record.markedAt || record.createdAt || record.date).toLocaleString()
      ]);
    });
    csvRows.push([]);

    // Detailed Leaves
    csvRows.push(['DETAILED LEAVES']);
    csvRows.push(['Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason']);
    leavesData.records.forEach(leave => {
      csvRows.push([
        leave.leaveType || leave.type,
        new Date(leave.startDate).toLocaleDateString(),
        new Date(leave.endDate).toLocaleDateString(),
        leave.totalDays,
        leave.status,
        leave.reason || '-'
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEmployee.fullName || selectedEmployee.name}_${selectedMonth + 1}_${selectedYear}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const filteredLeaves = leaves.filter(leave => {
    const employeeName = getDisplayName(leave.userId).toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredEmployees = employees.filter(emp =>
    getDisplayName(emp).toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalEmployees: employees.length,
    pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
    approvedLeaves: leaves.filter(l => l.status === 'Approved').length,
    rejectedLeaves: leaves.filter(l => l.status === 'Rejected').length,
    todayPresent: attendance.filter(a =>
      new Date(a.date).toDateString() === new Date().toDateString() &&
      a.status === 'Present'
    ).length,
    totalAttendance: attendance.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{adminName}</span>
                  <span className="text-xs text-blue-700 font-medium">Administrator</span>
                </div>
              </div>

              <div className="sm:hidden w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm sm:text-base"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium opacity-90">Welcome back,</p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">{adminName} 👑</h1>
                <p className="text-sm opacity-90 mt-2">
                  Manage employees, leaves, and attendance from one place
                </p>
              </div>
              <div className="flex space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xs opacity-90">System Status</p>
                  <p className="text-sm font-semibold">Active</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xs opacity-90">Today's Date</p>
                  <p className="text-sm font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-1 bg-blue-500"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-1 bg-yellow-500"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Leaves</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvedLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-1 bg-green-500"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Present</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.todayPresent}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-1 bg-purple-500"></div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-green-700 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-800">{stats.approvedLeaves}</p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
            <p className="text-xs text-red-700 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.rejectedLeaves}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Total Attendance</p>
            <p className="text-2xl font-bold text-blue-800">{stats.totalAttendance}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
            <p className="text-xs text-orange-700 font-medium">Leave Rate</p>
            <p className="text-2xl font-bold text-orange-800">
              {stats.totalEmployees ? ((stats.pendingLeaves / stats.totalEmployees) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            + Create Employee Account
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex flex-nowrap min-w-max -mb-px">
              <button
                onClick={() => setSelectedTab('leaves')}
                className={`py-4 px-4 sm:px-6 font-medium text-sm transition-all duration-200 whitespace-nowrap ${selectedTab === 'leaves'
                  ? 'border-b-2 border-blue-500 text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Leave Requests</span>
                  {stats.pendingLeaves > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.pendingLeaves}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setSelectedTab('employees')}
                className={`py-4 px-4 sm:px-6 font-medium text-sm transition-all duration-200 whitespace-nowrap ${selectedTab === 'employees'
                  ? 'border-b-2 border-blue-500 text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Employees</span>
                </span>
              </button>
              <button
                onClick={() => setSelectedTab('attendance')}
                className={`py-4 px-4 sm:px-6 font-medium text-sm transition-all duration-200 whitespace-nowrap ${selectedTab === 'attendance'
                  ? 'border-b-2 border-blue-500 text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Attendance Records</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Leave Requests Tab */}
          {selectedTab === 'leaves' && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {['all', 'Pending', 'Approved', 'Rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${filterStatus === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && (
                      <span className="ml-1">
                        ({leaves.filter((leave) => leave.status === status).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-700 font-medium">
                          No leave requests found
                        </td>
                      </tr>
                    ) : (
                      filteredLeaves.map((leave) => (
                        <tr key={leave._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700">
                                  {getDisplayName(leave.userId).charAt(0)}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900">{getDisplayName(leave.userId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                              {leave.leaveType || leave.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{leave.totalDays}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{leave.reason || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(leave.status)}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {leave.status === 'Pending' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleLeaveAction(leave._id, 'Approved')}
                                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-700 font-semibold">
                                {leave.status === 'Approved' ? 'Already approved' : 'Already rejected'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Employees Tab with View Button */}
          {selectedTab === 'employees' && (
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joining Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Leave Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-700 font-medium">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr key={employee._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {getDisplayName(employee).charAt(0)}
                              </div>
                              <span className="font-semibold text-gray-900">{getDisplayName(employee)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{employee.email}</td>
                          <td className="px-6 py-4 text-gray-900">{new Date(employee.joiningDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.leaveBalance > 10 ? 'bg-green-100 text-green-800' :
                              employee.leaveBalance > 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {employee.leaveBalance} days
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewEmployee(employee)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {selectedTab === 'attendance' && (
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Marked At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-700 font-medium">
                          No attendance records found
                        </td>
                      </tr>
                    ) : (
                      attendance.slice(0, 50).map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {getDisplayName(record.userId).charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{getDisplayName(record.userId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(record.markedAt || record.createdAt || record.date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-sm rounded-full font-semibold ${record.status === 'Present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {record.status === 'Present' ? '✅ Present' : '❌ Absent'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal with Salary Calculation */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                    {getDisplayName(selectedEmployee).charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{getDisplayName(selectedEmployee)}</h2>
                    <p className="text-blue-100">{selectedEmployee.email}</p>
                    <p className="text-sm text-blue-100 mt-1">
                      Joined: {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Month/Year Selector */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Stats and Salary Section */}
            {(() => {
              const attendanceData = getEmployeeMonthlyAttendance(selectedEmployee._id);
              const leavesData = getEmployeeMonthlyLeaves(selectedEmployee._id);
              const attendancePercentage = attendanceData.total > 0
                ? ((attendanceData.present / attendanceData.total) * 100).toFixed(2)
                : 0;
              const salaryData = calculateSalary(attendanceData, leavesData);

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Total Present</p>
                          <p className="text-3xl font-bold text-green-800">{attendanceData.present}</p>
                          <p className="text-xs text-green-600 mt-1">out of {salaryData.workingDaysInMonth} days</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-medium">Total Absent</p>
                          <p className="text-3xl font-bold text-red-800">{attendanceData.absent}</p>
                          <p className="text-xs text-red-600 mt-1">without approved leave</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Leave Days Taken</p>
                          <p className="text-3xl font-bold text-purple-800">{leavesData.totalDays}</p>
                          <p className="text-xs text-purple-600 mt-1">approved leaves</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Attendance %</p>
                          <p className="text-3xl font-bold text-blue-800">{attendancePercentage}%</p>
                          <p className="text-xs text-blue-600 mt-1">overall attendance</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Calculation Section */}
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Salary Calculation for {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} {selectedYear}</h3>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Working Days in Month:</span>
                            <span className="font-semibold text-gray-900">{salaryData.workingDaysInMonth} days</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Present Days:</span>
                            <span className="font-semibold text-green-700">{salaryData.presentDays} days</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Absent Days:</span>
                            <span className="font-semibold text-red-700">{salaryData.absentDays} days</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Leave Days (Approved):</span>
                            <span className="font-semibold text-purple-700">{salaryData.leaveDays} days</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Monthly Salary (Base):</span>
                            <span className="font-semibold text-gray-900">₹{salaryData.monthlySalary.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Daily Rate:</span>
                            <span className="font-semibold text-gray-900">₹{salaryData.dailyRate.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200 bg-green-50 p-2 rounded-lg">
                            <span className="text-green-800 font-medium">Calculated Salary (Daily Rate):</span>
                            <span className="font-bold text-green-800 text-lg">₹{parseFloat(salaryData.salaryByDailyRate).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200 bg-blue-50 p-2 rounded-lg">
                            <span className="text-blue-800 font-medium">Calculated Salary (With Deduction):</span>
                            <span className="font-bold text-blue-800 text-lg">₹{parseFloat(salaryData.salaryWithDeduction).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                          ℹ️ Note: Salary calculation is based on the selected month's data.
                          You can use either calculation method as per company policy.
                          Deduction is calculated as: (Absent Days × Daily Rate)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leave Summary */}
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Leave Summary</h3>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{leavesData.approved}</p>
                        <p className="text-sm text-gray-700">Approved Leaves</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-700">{leavesData.pending}</p>
                        <p className="text-sm text-gray-700">Pending Leaves</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                        <p className="text-2xl font-bold text-red-700">{leavesData.rejected}</p>
                        <p className="text-sm text-gray-700">Rejected Leaves</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Attendance Table */}
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Daily Attendance Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700">Date</th>
                            <th className="px-4 py-2 text-left text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left text-gray-700">Marked At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {attendanceData.records.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-4 py-8 text-center text-gray-600">
                                No attendance records for this month
                              </td>
                            </tr>
                          ) : (
                            attendanceData.records.map((record) => (
                              <tr key={record._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {record.status === 'Present' ? '✅ Present' : '❌ Absent'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-600 text-xs">
                                  {new Date(record.markedAt || record.createdAt || record.date).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detailed Leaves Table */}
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Leave Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700">Type</th>
                            <th className="px-4 py-2 text-left text-gray-700">Start Date</th>
                            <th className="px-4 py-2 text-left text-gray-700">End Date</th>
                            <th className="px-4 py-2 text-left text-gray-700">Days</th>
                            <th className="px-4 py-2 text-left text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left text-gray-700">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {leavesData.records.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-gray-600">
                                No leave requests for this month
                              </td>
                            </tr>
                          ) : (
                            leavesData.records.map((leave) => (
                              <tr key={leave._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900">{leave.leaveType || leave.type}</td>
                                <td className="px-4 py-2 text-gray-900">{new Date(leave.startDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-gray-900">{new Date(leave.endDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2 font-semibold text-gray-900">{leave.totalDays}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {leave.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-700">{leave.reason || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}