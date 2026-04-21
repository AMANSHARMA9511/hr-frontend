import apiClient from './apiClient';

const ADMIN_URL = '/admin';

const adminService = {
  // Get all employees
  getAllEmployees: async () => {
    try {
      const response = await apiClient.get(`${ADMIN_URL}/employees`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employees' };
    }
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    try {
      const response = await apiClient.get(`${ADMIN_URL}/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employee' };
    }
  },

  // Get all leave requests (with filters)
  getAllLeaves: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      
      const queryString = params.toString();
      const url = queryString ? `${ADMIN_URL}/leaves?${queryString}` : `${ADMIN_URL}/leaves`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leaves' };
    }
  },

  // Approve leave request
  approveLeave: async (leaveId) => {
    try {
      const response = await apiClient.put(`${ADMIN_URL}/leaves/${leaveId}`, {
        status: 'Approved'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve leave' };
    }
  },

  // Reject leave request
  rejectLeave: async (leaveId, reason = '') => {
    try {
      const response = await apiClient.put(`${ADMIN_URL}/leaves/${leaveId}`, {
        status: 'Rejected',
        rejectionReason: reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject leave' };
    }
  },

  // Get all attendance records
  getAllAttendance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `${ADMIN_URL}/attendance?${queryString}` : `${ADMIN_URL}/attendance`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendance' };
    }
  },

  // Get dashboard statistics for admin
  getDashboardStats: async () => {
    try {
      const [employees, leaves, attendance] = await Promise.all([
        adminService.getAllEmployees(),
        adminService.getAllLeaves(),
        adminService.getAllAttendance()
      ]);
      
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => 
        new Date(a.date).toISOString().split('T')[0] === today && a.status === 'Present'
      ).length;
      
      return {
        totalEmployees: employees.length,
        pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'Approved').length,
        rejectedLeaves: leaves.filter(l => l.status === 'Rejected').length,
        todayAttendance,
        totalAttendance: attendance.length
      };
    } catch (error) {
      throw error;
    }
  },

  // Update employee leave balance
  updateLeaveBalance: async (employeeId, newBalance) => {
    try {
      const response = await apiClient.put(`${ADMIN_URL}/employees/${employeeId}/leave-balance`, {
        leaveBalance: newBalance
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update leave balance' };
    }
  },

  // Delete employee (admin only)
  deleteEmployee: async (employeeId) => {
    try {
      const response = await apiClient.delete(`${ADMIN_URL}/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete employee' };
    }
  }
};

export default adminService;