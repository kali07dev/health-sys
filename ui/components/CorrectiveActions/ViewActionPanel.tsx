// components/CorrectiveActions/ViewActionPanel.tsx
import React from 'react';
import { X, AlertCircle, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { CorrectiveAction } from '@/interfaces/incidents';
// import { formatDate } from '@/utils/dateUtils';

interface ViewActionPanelProps {
  action: CorrectiveAction;
  onClose: () => void;
}

export const ViewActionPanel: React.FC<ViewActionPanelProps> = ({ action, onClose }) => {
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

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Corrective Action Details</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
          <p className="text-base text-gray-900">{action.description}</p>
        </div>
        
        {/* Status and Priority */}
        <div className="flex space-x-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(action.status)}`}>
              {action.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getPriorityColor(action.priority)}`}>
              {action.priority}
            </span>
          </div>
        </div>
        
        {/* Action Type */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Action Type</h3>
          <p className="text-base text-gray-900">{action.actionType}</p>
        </div>
        
        {/* Assignment */}
        <div className="flex items-start space-x-2">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
            <p className="text-base text-gray-900">{action.assignedTo}</p>
            <p className="text-xs text-gray-500">Assigned by {action.assignedBy}</p>
          </div>
        </div>
        
        {/* Dates */}
        <div className="flex items-start space-x-2">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <p className="text-base text-gray-900">{new Date(action.dueDate).toLocaleDateString()}</p>
            {action.completedAt && (
              <p className="text-xs text-gray-500">
                Completed on {new Date(action.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {/* Completion Notes */}
        {action.completionNotes && (
          <div className="flex items-start space-x-2">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Completion Notes</h3>
              <p className="text-base text-gray-900">{action.completionNotes}</p>
            </div>
          </div>
        )}
        
        {/* Verification */}
        <div className="flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Verification</h3>
            {action.verificationRequired ? (
              <>
                <p className="text-base text-gray-900">Verification required</p>
                {action.verifiedBy && (
                  <p className="text-xs text-gray-500">
                    Verified by {action.verifiedBy} on {new Date(action.verifiedAt || '').toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-base text-gray-900">No verification required</p>
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
      </div>
    </div>
  );
};