'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/apiClient';

export default function LeaveForm({ onSuccess, onClose, editLeave = null }) {
  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLeaveBalance();
    if (editLeave) {
      setFormData({
        leaveType: editLeave.leaveType || editLeave.type || 'Casual',
        startDate: new Date(editLeave.startDate).toISOString().split('T')[0],
        endDate: new Date(editLeave.endDate).toISOString().split('T')[0],
        reason: editLeave.reason || ''
      });
    }
  }, [editLeave]);

  const fetchLeaveBalance = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const user = storedUser?.user ? storedUser.user : storedUser;
      setLeaveBalance(user.leaveBalance || 0);
    } catch (error) {
      console.error('Failed to fetch leave balance');
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors = {};
    const days = calculateDays();

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    if (days > leaveBalance && !editLeave) {
      newErrors.days = `Insufficient balance! You have ${leaveBalance} days left.`;
    }
    if (days > 30) {
      newErrors.days = 'Cannot apply for more than 30 days at once';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const days = calculateDays();
    if (days <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      };

      if (editLeave) {
        await api.put(`/leave/${editLeave._id}`, payload);
        toast.success('Leave updated successfully!');
      } else {
        await api.post('/leave/apply', payload);
        toast.success('Leave applied successfully!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  const days = calculateDays();
  const remainingBalance = leaveBalance - days;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-4 sm:px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {editLeave ? 'Edit Leave Request' : 'Apply for Leave'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Leave Balance Card */}
              {!editLeave && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">Available Balance</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{leaveBalance} days</p>
                    </div>
                    {days > 0 && (
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-blue-800 font-medium">After Application</p>
                        <p className={`text-xl sm:text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remainingBalance} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white text-gray-900"
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      required
                    >
                      <option className="text-gray-900 bg-white" value="Casual">Casual Leave</option>
                      <option className="text-gray-900 bg-white" value="Sick">Sick Leave</option>
                      <option className="text-gray-900 bg-white" value="Paid">Paid Leave</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.startDate ? 'border-red-500 text-gray-900 bg-white' : 'border-gray-300 text-gray-900 bg-white'
                    }`}
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      setErrors({ ...errors, startDate: '' });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.endDate ? 'border-red-500 text-gray-900 bg-white' : 'border-gray-300 text-gray-900 bg-white'
                    }`}
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                      setErrors({ ...errors, endDate: '' });
                    }}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>

                {/* Days Preview */}
                {formData.startDate && formData.endDate && (
                  <div className={`rounded-xl p-4 ${
                    days > leaveBalance && !editLeave
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total Days</p>
                        <p className={`text-2xl font-bold ${days > leaveBalance && !editLeave ? 'text-red-600' : 'text-blue-600'}`}>
                          {days} day{days !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {days > 0 && !editLeave && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Balance After</p>
                          <p className={`text-xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {remainingBalance} days
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.days && (
                      <p className="mt-2 text-sm text-red-600">{errors.days}</p>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-500"
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Tell us why you need leave..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || (days > leaveBalance && !editLeave)}
                    className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      editLeave ? 'Update Leave' : 'Apply Leave'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}