import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { SearchEmployee } from '@/components/SearchEmployee';
import { CorrectiveAction } from '@/interfaces/incidents'; // Import the CorrectiveAction interface

// Define the type for the employee object
interface Employee {
  ID: string;
  FirstName: string;
  LastName: string;
  EmployeeNumber: string;
}

interface CreateActionModalProps {
  incidentId: string;
  userID: string;
  onClose: () => void;
  onSubmit: (formData: Partial<CorrectiveAction>) => void; // Update to accept Partial<CorrectiveAction>
}

export const CreateActionModal: React.FC<CreateActionModalProps> = ({
  incidentId,
  userID,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    actionType: '',
    priority: 'low' as 'low' | 'medium' | 'high' | 'critical', // Ensure priority matches CorrectiveAction type
    assignedTo: '', // This will store the selected employee's ID
    dueDate: '',   // Store the raw input value
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null); // State for selected employee details
  const [loading, setLoading] = useState(false);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee); // Store the selected employee's details
    setFormData({ ...formData, assignedTo: employee.ID }); // Update the form data with the employee's ID
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format the dueDate field to RFC3339
      const formattedDueDate = new Date(formData.dueDate).toISOString();

      const payload: Partial<CorrectiveAction> = {
        incidentId: incidentId,
        description: formData.description,
        actionType: formData.actionType,
        priority: formData.priority,
        status: 'pending',
        assignedTo: formData.assignedTo, // Use the selected employee's ID
        assignedBy: userID, // Replace with actual user ID
        dueDate: formattedDueDate, // Use the formatted date
        verificationRequired: false,
      };

      await onSubmit(payload);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create corrective action');
    } finally {
      toast.success("Actions Have Been set successfully");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-lg">
        <h2 className="text-2xl font-medium mb-6 text-gray-900">Add Corrective Action</h2>
        <form onSubmit={handleSubmit}>
          {/* First row - Description spans full width */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              rows={3}
              required
              placeholder="Enter description"
            />
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Action Type
                </label>
                <div className="relative">
                  <select
                    value={formData.actionType}
                    onChange={(e) =>
                      setFormData({ ...formData, actionType: e.target.value })
                    }
                    className="appearance-none mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 pr-8"
                    required
                  >
                    <option value="">Select action type</option>
                    <option value="Process Improvement">Process Improvement</option>
                    <option value="Training Required">Training Required</option>
                    <option value="Equipment Repair">Equipment Repair</option>
                    <option value="Policy Update">Policy Update</option>
                    <option value="Safety Measure">Safety Measure</option>
                    <option value="Documentation Update">Documentation Update</option>
                    <option value="System Configuration">System Configuration</option>
                    <option value="Root Cause Analysis">Root Cause Analysis</option>
                    <option value="Preventive Maintenance">Preventive Maintenance</option>
                    <option value="Personnel Action">Personnel Action</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })
                    }
                    className="appearance-none mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 pr-8"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Assigned To
                </label>
                <div className="bg-gray-50 rounded-lg border border-gray-300 p-3">
                  <SearchEmployee onSelect={handleEmployeeSelect} />
                  {selectedEmployee && (
                    <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-2 rounded-md">
                      Selected: {`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} ({selectedEmployee.EmployeeNumber})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.assignedTo}
              className={`px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 flex items-center justify-center min-w-24 transition-colors ${loading || !formData.assignedTo ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};