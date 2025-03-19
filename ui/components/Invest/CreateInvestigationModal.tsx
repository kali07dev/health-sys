// components/Investigation/CreateInvestigationModal.tsx
import React, { useState } from 'react';
// import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { SearchEmployee, Employee } from '@/components/SearchEmployee'; 

interface InvestigationPayload {
  incident_id: string;
  description: string;
  lead_investigator_id: string;
  started_at: string;
}

interface CreateInvestigationModalProps {
  incidentId: string;
  onClose: () => void;
  onSubmit: (formData: InvestigationPayload) => void;
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);// State for selected employee details
  const [loading, setLoading] = useState(false);

  const handleEmployeeSelect = (employee: Employee) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-2xl font-medium mb-6 text-gray-900">Create Investigation</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
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
              placeholder="Enter investigation description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Lead Investigator
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
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              required
            />
          </div>
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
              disabled={loading || !selectedEmployee}
              className={`px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 flex items-center justify-center min-w-24 transition-colors ${loading || !selectedEmployee ? 'opacity-70 cursor-not-allowed' : ''}`}
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