'use client';
// components/Investigations/ScheduleInterviewModal.tsx

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { InvestigationAPI } from '@/utils/investigationAPI';
import { SearchEmployee } from '@/components/SearchEmployee';
// import type { Employee } from '@/types/employee';

interface ScheduleInterviewModalProps {
  investigationId: string;
  onClose: () => void;
  onSchedule: () => void;
}

interface InterviewFormData {
  intervieweeId: string;
  scheduledFor: string;
  location: string;
}

export const ScheduleInterviewModal = ({
  investigationId,
  onClose,
  onSchedule,
}: ScheduleInterviewModalProps) => {
  const [formData, setFormData] = useState<InterviewFormData>({
    intervieweeId: '',
    scheduledFor: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({ ...prev, intervieweeId: employee.ID }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await InvestigationAPI.scheduleInterview(investigationId, formData);
      // await api.post(`/api/investigations/${investigationId}/interviews`, formData);
      onSchedule();
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interviewee</label>
            <SearchEmployee onSelect={handleSelectEmployee} />
            
            {selectedEmployee && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                Selected: {`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} 
                ({selectedEmployee.EmployeeNumber})
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
            <input
              type="datetime-local"
              name="scheduledFor"
              value={formData.scheduledFor}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter interview location"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmployee}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </>
              ) : (
                'Schedule Interview'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
