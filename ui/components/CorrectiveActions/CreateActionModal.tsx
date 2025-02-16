// components/CorrectiveActions/CreateActionModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { SearchEmployee } from '@/components/SearchEmployee'; // Import the SearchEmployee component

interface CreateActionModalProps {
  incidentId: string;
  userID: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
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
    priority: 'low',
    assignedTo: '', // This will store the selected employee's ID
    dueDate: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); // State for selected employee details
  const [loading, setLoading] = useState(false);

  const handleEmployeeSelect = (employee: any) => {
    console.log("Full employee data:", employee); // Add this
    setSelectedEmployee(employee);
    setFormData({ ...formData, assignedTo: employee.ID });
    console.log("Updated formData:", formData); // Add this
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        incident_id: incidentId,
        description: formData.description,
        action_type: formData.actionType,
        priority: formData.priority,
        status: 'pending',
        assigned_to: formData.assignedTo, // Use the selected employee's ID
        assigned_by: userID, // Replace with actual user ID
        due_date: formData.dueDate,
        verification_required: false,
      };
      await onSubmit(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add Corrective Action</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Action Type
            </label>
            <input
              type="text"
              value={formData.actionType}
              onChange={(e) =>
                setFormData({ ...formData, actionType: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assigned To
            </label>
            {/* Integrate the SearchEmployee component */}
            <SearchEmployee onSelect={handleEmployeeSelect} />
            {selectedEmployee && (
              <div className="mt-2 text-sm text-gray-500">
                Selected: {`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} ({selectedEmployee.EmployeeNumber})
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
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
              disabled={loading || !formData.assignedTo} // Disable if no employee is selected
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
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