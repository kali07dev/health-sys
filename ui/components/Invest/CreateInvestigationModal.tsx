// components/Investigation/CreateInvestigationModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { SearchEmployee } from '@/components/SearchEmployee'; 

interface CreateInvestigationModalProps {
  incidentId: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export const CreateInvestigationModal: React.FC<CreateInvestigationModalProps> = ({
  incidentId,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    leadInvestigator: '',
    startDate: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); // State for selected employee details
  const [loading, setLoading] = useState(false);

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee); // Store the selected employee's details
    setFormData({ ...formData, leadInvestigator: employee.ID }); // Update the form data with the employee's ID
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        incident_id: incidentId,
        description: formData.description,
        lead_investigator_id: formData.leadInvestigator,
        started_at: new Date(formData.startDate).toISOString(),
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
        <h2 className="text-xl font-bold mb-4">Create Investigation</h2>
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
              Lead Investigator
            </label>
            {/* <input
              type="text"
              value={formData.leadInvestigator}
              onChange={(e) =>
                setFormData({ ...formData, leadInvestigator: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            /> */}
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
              Start Date
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
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
              disabled={loading}
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