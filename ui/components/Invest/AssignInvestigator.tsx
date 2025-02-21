// components/Investigation/AssignInvestigator.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { incidentAPI } from '@/utils/api';

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
            <select
              value={investigatorId}
              onChange={(e) => setInvestigatorId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select an investigator...</option>
              {/* Add your investigators list here */}
            </select>
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

