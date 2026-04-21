'use client';

import { useState } from 'react';

export default function AttendanceHistory({ attendance, onFilterChange }) {
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    let match = true;
    
    if (filterDate) {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      if (recordDate !== filterDate) match = false;
    }
    
    if (filterStatus !== 'all') {
      if (record.status.toLowerCase() !== filterStatus.toLowerCase()) match = false;
    }
    
    return match;
  });

  // Get statistics
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const absentDays = attendance.filter(a => a.status === 'Absent').length;
  const attendancePercentage = totalDays > 0 
    ? ((presentDays / totalDays) * 100).toFixed(1) 
    : 0;

  // Group by month
  const groupByMonth = () => {
    const grouped = {};
    attendance.forEach(record => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(record);
    });
    return grouped;
  };

  const monthlyData = groupByMonth();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'monthly'

  const getStatusColor = (status) => {
    return status === 'Present' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterStatus('all');
    if (onFilterChange) onFilterChange({ date: '', status: 'all' });
  };

  const handleExportCSV = () => {
    const formatForExcel = (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const asExcelText = (value) => (value ? `'${value}` : '');

    const headers = ['Date', 'Status', 'Marked At'];
    const csvData = filteredAttendance.map(record => [
      asExcelText(formatForExcel(record.date)),
      record.status,
      asExcelText(formatForExcel(record.markedAt || record.createdAt || record.date))
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'monthly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Days</p>
          <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{presentDays}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentDays}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-blue-600">{attendancePercentage}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="p-4 sm:p-6">
        {viewMode === 'table' ? (
          // Table View
          <>
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marked At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.map((record, index) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          // Monthly View
          <div className="space-y-8">
            {Object.keys(monthlyData).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              Object.entries(monthlyData).map(([month, records]) => {
                const monthPresent = records.filter(r => r.status === 'Present').length;
                const monthTotal = records.length;
                const monthPercentage = ((monthPresent / monthTotal) * 100).toFixed(1);
                
                return (
                  <div key={month} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{month}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-green-600">Present: {monthPresent}</span>
                          <span className="text-red-600">Total: {monthTotal}</span>
                          <span className="text-blue-600">Rate: {monthPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {records.map((record) => (
                            <tr key={record._id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-sm text-gray-900">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </td>
                              <td className="px-6 py-3">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Calendar View (Bonus) */}
      {viewMode === 'calendar' && (
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Calendar view coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}