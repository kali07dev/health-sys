// components/CorrectiveActions/CorrectiveActionsPanel.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, Plus, Upload, Eye } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { CorrectiveAction } from '@/interfaces/incidents';
import { ActionEvidence } from './ActionEvidence';
import { ActionFeedback } from './ActionFeedback';
import { CreateActionModal } from './CreateActionModal';
import { ViewActionPanel } from './ViewActionPanel';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAction, setViewingAction] = useState<CorrectiveAction | null>(null);

  useEffect(() => {
    fetchActions();
  }, [incidentId, userID, userRole]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      let response;
      
      // If user is admin or safety officer, fetch by incident ID
      // Otherwise, fetch only actions assigned to the current user
      if (['admin', 'safety_officer'].includes(userRole)) {
        response = await incidentAPI.getCorrectiveActionsByIncidentID(incidentId);
      } else {
        response = await incidentAPI.getCorrectiveActionsByUserID(userID);
      }
      
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

  const handleViewAction = (action: CorrectiveAction) => {
    setViewingAction(action);
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-green-200 text-green-900';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-l-4 border-red-600';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-l-4 border-orange-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-l-4 border-green-600';
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
      {/* Add Corrective Action Button - Only show for admin/safety officer */}
      {['admin', 'safety_officer'].includes(userRole) && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {['admin', 'safety_officer'].includes(userRole) 
              ? `Corrective Actions for Incident #${incidentId}`
              : 'Your Assigned Corrective Actions'}
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Corrective Action</span>
          </button>
        </div>
      )}
      
      {/* Show only title for non-admin users */}
      {!['admin', 'safety_officer'].includes(userRole) && (
        <h2 className="text-xl font-semibold text-gray-900">
          Your Assigned Corrective Actions
        </h2>
      )}

      {/* Legend for status and priority */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Status</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></span>
                <span className="text-xs text-gray-600">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></span>
                <span className="text-xs text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-200"></span>
                <span className="text-xs text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-200 border border-green-300"></span>
                <span className="text-xs text-gray-600">Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-200"></span>
                <span className="text-xs text-gray-600">Overdue</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Priority</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-green-600"></span>
                <span className="text-xs text-gray-600">Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-yellow-600"></span>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-orange-600"></span>
                <span className="text-xs text-gray-600">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-red-600"></span>
                <span className="text-xs text-gray-600">Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Display Actions or Empty State */}
      {actions && actions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`bg-white p-6 rounded-lg shadow-md space-y-4 ${getPriorityColor(action.priority)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                      {action.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Priority: {action.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {action.description}
                  </h3>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                    <span>Type: {action.actionType}</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-4 pt-2 border-t border-gray-100">
                {/* View Action Button - Available to all roles */}
                <button
                  onClick={() => handleViewAction(action)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                {/* Upload Evidence Button - Only for assigned employees */}
                {userRole === 'employee' && action.assignedTo === userID && action.status !== 'completed' && action.status !== 'verified' && (
                  <button
                    onClick={() => {
                      setSelectedAction(action);
                      setActiveModal('evidence');
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Evidence</span>
                  </button>
                )}
                
                {/* Provide Feedback Button - Only for admins & safety officers */}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-lg font-medium">No corrective actions found</p>
            <p className="text-sm text-gray-500">
              {['admin', 'safety_officer'].includes(userRole) 
                ? "No actions have been assigned for this incident yet."
                : "You don't have any corrective actions assigned to you."}
            </p>
          </div>
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

      {/* Render View Action Panel */}
      {viewingAction && (
        <ViewActionPanel
          action={viewingAction}
          onClose={() => setViewingAction(null)}
          userRole={userRole}
          userID={userID}
          refreshActions={fetchActions}
        />
      )}
    </div>
  );
};