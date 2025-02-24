// components/CorrectiveActions/CorrectiveActionsPanel.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, Plus, Upload } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { CorrectiveAction } from '@/interfaces/incidents';
import { ActionEvidence } from './ActionEvidence';
import { ActionFeedback } from './ActionFeedback';
import { CreateActionModal } from './CreateActionModal';

interface CorrectiveActionsPanelProps {
  incidentId: string;
  userID: string;
  userRole: string;
}

export const CorrectiveActionsPanel: React.FC<CorrectiveActionsPanelProps> = ({
  incidentId,
  userRole,
  userID,
}) => {
  const [actions, setActions] = useState<CorrectiveAction[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for Create Action Modal

  useEffect(() => {
    fetchActions();
  }, [incidentId]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await incidentAPI.getCorrectiveActionsByIncidentID(incidentId);
      setActions(response);
      setError(null);
    } catch (error) {
      console.error(error);
      setError('Failed to fetch actions');
      toast.error('Failed to fetch actions');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setSelectedAction(null);
  };

  const handleModalSubmit = () => {
    setActiveModal(null);
    setSelectedAction(null);
    fetchActions(); // Refresh actions after submission
  };

  const handleCreateAction = async (formData: any) => {
    try {
      await incidentAPI.createCorrectiveAction(formData);
      toast.success('Corrective action created successfully');
      setIsCreateModalOpen(false); // Close the modal
      fetchActions(); // Refresh actions
    } catch (error) {
      console.error(error);
      toast.error('Failed to create corrective action');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Corrective Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Corrective Action</span>
        </button>
      </div>

      {/* Display Actions or Empty State */}
      {actions && actions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="bg-white p-6 rounded-lg shadow-md space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {action.description}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Due: {new Date(action.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    action.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {action.status}
                </span>
              </div>
              {userRole === 'employee' && action.assignedTo === 'currentUserId' && (
                <button
                  onClick={() => {
                    setSelectedAction(action);
                    setActiveModal('evidence');
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Completion Evidence</span>
                </button>
              )}
              {['admin', 'safety_officer'].includes(userRole) && (
                <button
                  onClick={() => {
                    setSelectedAction(action);
                    setActiveModal('feedback');
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Provide Feedback</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center p-8 text-gray-500">
          No corrective actions assigned yet.
        </div>
      )}

      {/* Render ActionEvidence Modal */}
      {activeModal === 'evidence' && selectedAction && (
        <ActionEvidence
          actionId={selectedAction.id}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Render ActionFeedback Modal */}
      {activeModal === 'feedback' && selectedAction && (
        <ActionFeedback
          actionId={selectedAction.id}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Render Create Action Modal */}
      {isCreateModalOpen && (
        <CreateActionModal
          incidentId={incidentId}
          userID={userID}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateAction}
        />
      )}
    </div>
  );
};