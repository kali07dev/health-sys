'use client';

import React, { useState, useEffect } from 'react';
import { incidentAPI } from '@/utils/api';
import { CorrectiveAction } from '@/interfaces/incidents';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { ViewActionPanel } from '@/components/CorrectiveActions/ViewActionPanel';
import { ActionEvidence } from '@/components/CorrectiveActions/ActionEvidence';
import { showErrorToast, showSuccessToast } from '@/lib/error-handling';

interface EmployeeTasksDashboardProps {
  userRole: string;
  userId: string;
}

export default function EmployeeTasksDashboard({
  userRole,
  userId,
}: EmployeeTasksDashboardProps) {
  const [actions, setActions] = useState<CorrectiveAction[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingAction, setViewingAction] = useState<CorrectiveAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        const response = await incidentAPI.getCorrectiveActionsByUserID(userId);
        setActions(response);
        setError(null);
      } catch (error) {
        console.error(error);
        setError('Unable to load your assigned tasks');
        showErrorToast(error, 'Unable to load your assigned corrective actions');
      } finally {
        setLoading(false);
      }
    };
  
    fetchActions();
  }, [userId]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await incidentAPI.getCorrectiveActionsByUserID(userId);
      setActions(response);
      setError(null);
    } catch (error) {
      console.error(error);
      setError('Unable to load your assigned tasks');
      showErrorToast(error, 'Unable to load your assigned corrective actions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAction = (action: CorrectiveAction) => {
    setViewingAction(action);
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setSelectedAction(null);
  };

  const handleModalSubmit = () => {
    setActiveModal(null);
    setSelectedAction(null);
    showSuccessToast("Action updated successfully", "Your changes have been saved");
    fetchActions(); // Refresh actions after submission
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
        <AlertCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <>
      {/* <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assigned Corrective Actions</h1> */}
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-blue-800">Total Actions</h3>
          <p className="text-3xl font-bold">{actions?.length || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-yellow-800">Pending</h3>
          <p className="text-3xl font-bold">
            {actions?.filter(a => a.status === 'pending').length || 0}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-blue-800">In Progress</h3>
          <p className="text-3xl font-bold">
            {actions?.filter(a => a.status === 'in_progress').length || 0}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-red-800">Overdue</h3>
          <p className="text-3xl font-bold">
            {actions?.filter(a => a.status === 'overdue').length || 0}
          </p>
        </div>
      </div>
      
      {/* Legend for status and priority */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="mt-1 flex flex-col md:flex-row md:items-center md:space-x-4 text-sm text-gray-500">
                    <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                    <span>Type: {action.actionType}</span>
                    <span className="font-medium text-indigo-600">Incident: #{action.incidentId}</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-4 pt-2 border-t border-gray-100">
                {/* View Action Button */}
                <button
                  onClick={() => handleViewAction(action)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                {/* Upload Evidence Button - Only if not completed/verified */}
                {action.status !== 'completed' && action.status !== 'verified' && (
                  <button
                    onClick={() => {
                      setSelectedAction(action);
                      setActiveModal('evidence');
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Evidence</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-lg font-medium">No corrective actions assigned</p>
            <p className="text-sm text-gray-500">
              You don&apos;t have any corrective actions assigned to you at this time.
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

      {/* Render View Action Panel */}
      {viewingAction && (
        <ViewActionPanel
          action={viewingAction}
          onClose={() => setViewingAction(null)}
          userRole={userRole}
          userID={userId}
          refreshActions={fetchActions}
        />
      )}
    </>
  );
}