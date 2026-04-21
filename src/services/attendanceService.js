import apiClient from './apiClient';

const ATTENDANCE_URL = '/attendance';

const attendanceService = {
  // Mark attendance for today or specific date
  markAttendance: async (status, date = null) => {
    try {
      const attendanceDate = date || new Date().toISOString().split('T')[0];
      const response = await apiClient.post(`${ATTENDANCE_URL}/mark`, {
        status,
        date: attendanceDate
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark attendance' };
    }
  },

  // Get my attendance history with filters
  getMyAttendance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString 
        ? `${ATTENDANCE_URL}/my-attendance?${queryString}`
        : `${ATTENDANCE_URL}/my-attendance`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendance' };
    }
  },

  // Get today's attendance status
  getTodayAttendance: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceService.getMyAttendance();
      return attendance.find(record => 
        new Date(record.date).toISOString().split('T')[0] === today
      ) || null;
    } catch (error) {
      throw error;
    }
  },

  // Check if attendance already marked for today
  isTodayMarked: async () => {
    const todayRecord = await attendanceService.getTodayAttendance();
    return !!todayRecord;
  },

  // Get attendance statistics
  getAttendanceStatistics: async () => {
    try {
      const attendance = await attendanceService.getMyAttendance();
      
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'Present').length;
      const absentDays = attendance.filter(a => a.status === 'Absent').length;
      const attendancePercentage = totalDays > 0 
        ? ((presentDays / totalDays) * 100).toFixed(1)
        : 0;
      
      // Get current month statistics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthRecords = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
      });
      
      const currentMonthPresent = currentMonthRecords.filter(r => r.status === 'Present').length;
      const currentMonthTotal = currentMonthRecords.length;
      const currentMonthPercentage = currentMonthTotal > 0
        ? ((currentMonthPresent / currentMonthTotal) * 100).toFixed(1)
        : 0;
      
      // Get last 30 days streak
      const last30Days = attendance
        .slice(0, 30)
        .filter(a => a.status === 'Present').length;
      
      return {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage,
        currentMonth: {
          present: currentMonthPresent,
          total: currentMonthTotal,
          percentage: currentMonthPercentage
        },
        last30DaysStreak: last30Days,
        recentRecords: attendance.slice(0, 10)
      };
    } catch (error) {
      throw error;
    }
  },

  // Get attendance by month
  getAttendanceByMonth: async (year, month) => {
    try {
      const attendance = await attendanceService.getMyAttendance();
      return attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year && 
               recordDate.getMonth() === month;
      });
    } catch (error) {
      throw error;
    }
  },

  // Get attendance by year
  getAttendanceByYear: async (year) => {
    try {
      const attendance = await attendanceService.getMyAttendance();
      return attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year;
      });
    } catch (error) {
      throw error;
    }
  },

  // Get monthly summary
  getMonthlySummary: async () => {
    try {
      const attendance = await attendanceService.getMyAttendance();
      const summary = {};
      
      attendance.forEach(record => {
        const date = new Date(record.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!summary[monthYear]) {
          summary[monthYear] = {
            present: 0,
            absent: 0,
            total: 0
          };
        }
        
        if (record.status === 'Present') {
          summary[monthYear].present++;
        } else {
          summary[monthYear].absent++;
        }
        summary[monthYear].total++;
      });
      
      return summary;
    } catch (error) {
      throw error;
    }
  }
};

export default attendanceService;