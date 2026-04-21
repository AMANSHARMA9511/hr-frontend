import apiClient from './apiClient';

const LEAVE_URL = '/leave';

const leaveService = {
  // Apply for leave
  applyLeave: async (leaveData) => {
    try {
      const response = await apiClient.post(`${LEAVE_URL}/apply`, {
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to apply for leave' };
    }
  },

  // Get all leaves of logged-in user
  getMyLeaves: async () => {
    try {
      const response = await apiClient.get(`${LEAVE_URL}/my-leaves`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leaves' };
    }
  },

  // Get single leave by ID
  getLeaveById: async (leaveId) => {
    try {
      const response = await apiClient.get(`${LEAVE_URL}/${leaveId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leave details' };
    }
  },

  // Edit pending leave
  editLeave: async (leaveId, leaveData) => {
    try {
      const response = await apiClient.put(`${LEAVE_URL}/${leaveId}`, {
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to edit leave' };
    }
  },

  // Cancel pending leave
  cancelLeave: async (leaveId) => {
    try {
      const response = await apiClient.delete(`${LEAVE_URL}/${leaveId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel leave' };
    }
  },

  // Get leave balance
  getLeaveBalance: async () => {
    try {
      const response = await apiClient.get(`${LEAVE_URL}/balance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leave balance' };
    }
  },

  // Get leave statistics (for dashboard)
  getLeaveStatistics: async () => {
    try {
      const leaves = await leaveService.getMyLeaves();
      
      const totalLeavesTaken = leaves
        .filter(l => l.status === 'Approved')
        .reduce((sum, l) => sum + l.totalDays, 0);
      
      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
      const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;
      
      return {
        totalLeavesTaken,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        totalLeaves: leaves.length
      };
    } catch (error) {
      throw error;
    }
  },

  // Get leaves by type
  getLeavesByType: async (leaveType) => {
    try {
      const leaves = await leaveService.getMyLeaves();
      return leaves.filter(leave => leave.leaveType === leaveType);
    } catch (error) {
      throw error;
    }
  },

  // Get leaves by status
  getLeavesByStatus: async (status) => {
    try {
      const leaves = await leaveService.getMyLeaves();
      return leaves.filter(leave => leave.status === status);
    } catch (error) {
      throw error;
    }
  }
};

export default leaveService;