// components/CorrectiveActions/ActionFeedback.tsx
import { incidentAPI } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";


export const ActionFeedback: React.FC<{
    actionId: string;
    onClose: () => void;
    onSubmit: () => void;
  }> = ({ actionId, onClose, onSubmit }) => {
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      try {
        await incidentAPI.provideFeedback(actionId, { feedback, status });
        toast.success('Feedback submitted successfully');
        onSubmit();
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
          <h2 className="text-xl font-bold mb-4">Provide Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'approved' | 'rejected')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
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
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };