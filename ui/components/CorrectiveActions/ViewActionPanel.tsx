// components/CorrectiveActions/ViewActionPanel.tsx
import React, { useState } from 'react';
import { X, Calendar, User, FileText, CheckCircle, Edit, Check } from 'lucide-react';
import { CorrectiveAction } from '@/interfaces/incidents';
import { incidentAPI } from '@/utils/api';
import { toast } from 'react-hot-toast';

interface ViewActionPanelProps {
  action: CorrectiveAction;
  onClose: () => void;
  userRole: string;
  userID: string;
  refreshActions: () => void;
}

export const ViewActionPanel: React.FC<ViewActionPanelProps> = ({ 
  action, 
  onClose, 
  userRole,
  userID,
  refreshActions 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAction, setEditedAction] = useState<CorrectiveAction>(action);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = ['admin', 'safety_officer'].includes(userRole);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedAction(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      await incidentAPI.updateCorrectiveAction(editedAction.id, editedAction);
      toast.success("Action updated successfully");
      setIsEditing(false);
      refreshActions();
    } catch (error) {
      toast.error("Failed to update action");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsCompleted = async (closeIncident: boolean) => {
    try {
      setIsSubmitting(true);
      await incidentAPI.AdminupdateCorrectiveAction(action.id, {
        ...action,
        status: 'verified',
        verifiedBy: userID, 
        verifiedAt: new Date().toISOString(),
      });
      
      if (closeIncident) {
        incidentAPI.closeIncident(action.incidentId);
        toast.success("Action verified and incident closed");
      } else {
        toast.success("Action verified and completed");
      }
      
      refreshActions();
      onClose();
    } catch (error) {
      toast.error("Failed to complete action");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex justify-end">
      <div className="bg-white shadow-lg overflow-y-auto w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Corrective Action Details</h2>
          <div className="flex items-center space-x-2">
            {isAdmin && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Edit action"
              >
                <Edit className="w-5 h-5 text-blue-500" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 py-4 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            {isEditing ? (
              <textarea
                name="description"
                value={editedAction.description}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 text-base text-gray-900"
                rows={3}
              />
            ) : (
              <p className="text-base text-gray-900">{action.description}</p>
            )}
          </div>
          
          {/* Status and Priority */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
            <div className="w-full sm:w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              {isEditing ? (
                <select
                  name="status"
                  value={editedAction.status}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                  <option value="overdue">Overdue</option>
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(action.status)}`}>
                  {action.status.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="w-full sm:w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
              {isEditing ? (
                <select
                  name="priority"
                  value={editedAction.priority}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getPriorityColor(action.priority)}`}>
                  {action.priority}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Action Type</h3>
            {isEditing ? (
              <input
                type="text"
                name="actionType"
                value={editedAction.actionType}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 text-base text-gray-900"
              />
            ) : (
              <p className="text-base text-gray-900">{action.actionType}</p>
            )}
          </div>
          
          {/* Assignment */}
          <div className="flex items-start space-x-2">
            <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="assignedTo"
                  value={editedAction.assignedTo}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-base text-gray-900"
                />
              ) : (
                <p className="text-base text-gray-900 break-words">{action.assigneeName}</p>
              )}
              <p className="text-xs text-gray-500">Assigned by {action.assignerName}</p>
            </div>
          </div>
          
          {/* Dates */}
          <div className="flex items-start space-x-2">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              {isEditing ? (
                <input
                  type="date"
                  name="dueDate"
                  value={new Date(editedAction.dueDate).toISOString().split('T')[0]}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-base text-gray-900"
                />
              ) : (
                <p className="text-base text-gray-900">{new Date(action.dueDate).toLocaleDateString()}</p>
              )}
              {action.completedAt && (
                <p className="text-xs text-gray-500">
                  Completed on {new Date(action.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Completion Notes */}
          {(action.completionNotes || isEditing) && (
            <div className="flex items-start space-x-2">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-grow">
                <h3 className="text-sm font-medium text-gray-500">Completion Notes</h3>
                {isEditing ? (
                  <textarea
                    name="completionNotes"
                    value={editedAction.completionNotes || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-base text-gray-900"
                    rows={3}
                  />
                ) : (
                  <p className="text-base text-gray-900 break-words">{action.completionNotes}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Verification */}
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-gray-500">Verification</h3>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="verificationRequired"
                      checked={editedAction.verificationRequired}
                      onChange={(e) => setEditedAction(prev => ({ 
                        ...prev, 
                        verificationRequired: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    Verification required
                  </label>
                </div>
              ) : (
                <>
                  <p className="text-base text-gray-900">
                    {action.verificationRequired ? 'Verification required' : 'No verification required'}
                  </p>
                  {action.verifiedBy && (
                    <p className="text-xs text-gray-500">
                      Verified by {action.verifiedBy} on {new Date(action.verifiedAt || '').toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Evidence/Attachments placeholder */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments & Evidence</h3>
            <div className="bg-gray-50 rounded-md p-4 text-center text-gray-500">
              Evidence section would appear here
            </div>
          </div>
          
          {/* Edit mode buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          
          {/* Admin action buttons */}
          {isAdmin && !isEditing && action.status !== 'verified' && (
            <div className="mt-6 space-y-3 border-t pt-4">
              <button
                onClick={() => handleMarkAsCompleted(true)}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                disabled={isSubmitting}
              >
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Processing...' : 'Verify & Close Incident'}
              </button>
              
              <button
                onClick={() => handleMarkAsCompleted(false)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                disabled={isSubmitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Processing...' : 'Verify Without Closing Incident'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};