// components/Investigation/ScheduleInterview.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { incidentAPI } from '@/utils/api';

export const ScheduleInterview: React.FC<any> = ({ incidentId, onClose, onSchedule }) => {
    const [formData, setFormData] = useState({
      intervieweeId: '',
      scheduledFor: '',
      location: '',
    });
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await incidentAPI.scheduleInterview(incidentId, formData);
        toast.success('Interview scheduled successfully');
        onSchedule();
        onClose();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Schedule Interview</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interviewee
              </label>
              <select
                value={formData.intervieweeId}
                onChange={(e) => setFormData({ ...formData, intervieweeId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select an interviewee...</option>
                {/* Add your employees list here */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date and Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };