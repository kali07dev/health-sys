// components/Investigation/AssignInvestigator.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { SearchEmployee, Employee } from '@/components/SearchEmployee'; 

interface AssignInvestigatorProps {
  incidentId: string;
  onClose: () => void;
  onAssign: () => void;
}

export const AssignInvestigator: React.FC<AssignInvestigatorProps> = ({
  incidentId,
  onClose,
  onAssign,
}) => {
  const [investigatorId, setInvestigatorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee); // Store the selected employee's details
    setInvestigatorId( employee.ID); // Update the form data with the employee's ID
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await incidentAPI.assignInvestigator(incidentId, investigatorId);
      toast.success('Investigator assigned successfully');
      onAssign();
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
        <h2 className="text-xl font-bold mb-4">Assign Investigator</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Investigator
            </label>
            <SearchEmployee onSelect={handleEmployeeSelect} />
              {selectedEmployee && (
                 <div className="mt-2 text-sm text-gray-500">
                    Selected: {`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} ({selectedEmployee.EmployeeNumber})
                  </div>
              )}
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
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

