'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, XCircle } from 'lucide-react';
import { incidentAPI } from '@/utils/api';

interface FeedbackFormProps {
  actionId: string;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

export default function FeedbackForm({ 
  actionId, 
  onCancel, 
  onSubmitSuccess 
}: FeedbackFormProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      toast.error('Please add completion notes');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await incidentAPI.updateCorrectiveAction(actionId, {
        status: 'completed',
        completionNotes: notes,
        completedAt: new Date().toISOString()
      });
      
      toast.success('Action marked as completed');
      onSubmitSuccess();
      onCancel();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update action status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Completion Feedback</h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Completion Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe how this corrective action was implemented..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}