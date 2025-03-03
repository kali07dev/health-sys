// components/Investigations/ScheduleInterviewModal.tsx
'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '@/utils/api';

export const ScheduleInterviewModal = ({ investigationId, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    intervieweeId: '',
    scheduledFor: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchQuery(query);
    setSearchLoading(true);
    
    try {
      const response = await api.get(`/api/employees/search?query=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching employees:', error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({ ...prev, intervieweeId: employee.ID }));
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post(`/api/investigations/${investigationId}/interviews`, formData);
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search for employee..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  {searchResults.map(employee => (
                    <button
                      key={employee.ID}
                      type="button"
                      onClick={() => handleSelectEmployee(employee)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      {`${employee.FirstName} ${employee.LastName}`} ({employee.EmployeeNumber})
                    </button>
                  ))}
                </div>
              )}
              
              {searchLoading && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {selectedEmployee && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                Selected: {`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} ({selectedEmployee.EmployeeNumber})
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
