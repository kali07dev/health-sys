import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Check } from 'lucide-react';
import { SearchEmployee, Employee } from '../SearchAllEmployees';
import { incidentAPI } from '@/utils/api';
import { toast } from 'react-hot-toast';

interface AssignIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  currentAssignee?: string;
  onAssignmentComplete: () => void;
}

export const AssignIncidentModal: React.FC<AssignIncidentModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  currentAssignee,
  onAssignmentComplete,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleProceedToConfirmation = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }
    setShowConfirmation(true);
  };

  const handleAssignment = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      await incidentAPI.assignIncident(incidentId, selectedEmployee.id);
      toast.success(`Incident successfully assigned to ${selectedEmployee.firstName} ${selectedEmployee.lastName}`);
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setShowConfirmation(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all ${
          showConfirmation ? 'max-w-md' : 'max-w-lg'
        }`}>
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentAssignee ? 'Change Assignment' : 'Assign Incident'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentAssignee 
                      ? 'Select a new person to handle this incident'
                      : 'Choose who should handle this incident'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!showConfirmation ? (
            /* Employee Selection */
            <div className="px-6 pb-6">
              {currentAssignee && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Currently assigned to: <strong>{currentAssignee}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search and select employee
                  </label>
                  {/* Increased height container for search results */}
                  <div className="min-h-[200px]">
                    <SearchEmployee onSelect={handleEmployeeSelect} />
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedEmployee.firstName} {selectedEmployee.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedEmployee.department} • {selectedEmployee.position}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedEmployee.officeLocation}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToConfirmation}
                  disabled={!selectedEmployee}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation */
            <div className="px-6 pb-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Assignment
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to assign this incident to{' '}
                  <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>?
                  {currentAssignee && (
                    <span className="block mt-1 text-amber-600">
                      This will replace the current assignment.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAssignment}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : (
                    'Confirm Assignment'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};