// components/Investigation/InvestigationPanel.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, FileText, Users } from 'lucide-react';
import { AssignInvestigator } from './AssignInvestigator';
import { ScheduleInterview } from './ScheduleInterview';
import { InvestigationFindings } from './InvestigationFindings';
import { CreateInvestigationModal } from './CreateInvestigationModal'; // Import the new modal
import { ViewInvestigation } from './ViewInvestigation'; // Import the ViewInvestigation modal
import { incidentAPI } from '@/utils/api';
import {
  Investigation,
} from '@/interfaces/incidents';
interface InvestigationPanelProps {
  incidentId: string;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({ incidentId }) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for Create Investigation Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State for View Investigation Modal

  useEffect(() => {
    const fetchInvestigation = async () => {
      try {
        const response = await incidentAPI.getInvestigation(incidentId);
        setInvestigation(response);
      } catch (error) {
        toast.error('No Investigation Exists for this Incident, Please Create One');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchInvestigation();
  }, [incidentId]);

  const fetchInvestigation = async () => {
    try {
      const response = await incidentAPI.getInvestigation(incidentId);
      setInvestigation(response);
    } catch (error) {
      toast.error('No Investigation Exists for this Incident, Please Create One');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestigation = async (formData: Partial<Investigation>) => {
    try {
      await incidentAPI.createInvestigation(incidentId, formData);
      toast.success('Investigation created successfully');
      setIsCreateModalOpen(false); // Close the modal
      fetchInvestigation(); // Refresh investigation data
    } catch (error) {
      console.error(error);
      toast.error('Failed to create investigation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show empty state or investigation details */}
      {!investigation ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 text-gray-500">
          <span>No investigation has been created yet.</span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investigation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="Assign Investigator"
            icon={<Users className="w-6 h-6 text-red-600" />}
            onClick={() => setActiveModal('assign')}
            status={investigation?.leadInvestigatorId ? 'completed' : 'pending'}
          />
          <ActionCard
            title="Schedule Interview"
            icon={<FileText className="w-6 h-6 text-red-600" />}
            onClick={() => setActiveModal('interview')}
            status={investigation?.interviews?.length > 0 ? 'in-progress' : 'pending'}
          />
          <ActionCard
            title="Add Findings"
            icon={<Plus className="w-6 h-6 text-red-600" />}
            onClick={() => setActiveModal('findings')}
            status={investigation?.findings ? 'completed' : 'pending'}
          />

          {/* Add a new card for viewing investigation */}
          <ActionCard
            title="View Investigation"
            icon={<FileText className="w-6 h-6 text-red-600" />}
            onClick={() => setIsViewModalOpen(true)} // Open the View Investigation modal
            status={investigation?.recommendations ? 'completed' : 'pending'}
          />
        </div>
      )}

      {/* Render Modals */}
      {activeModal === 'assign' && (
        <AssignInvestigator
          incidentId={incidentId}
          onClose={() => setActiveModal(null)}
          onAssign={fetchInvestigation}
        />
      )}
      {activeModal === 'interview' && (
        <ScheduleInterview
          incidentId={incidentId}
          onClose={() => setActiveModal(null)}
          onSchedule={fetchInvestigation}
        />
      )}
      {activeModal === 'findings' && (
        <InvestigationFindings
          incidentId={incidentId}
          onClose={() => setActiveModal(null)}
          onSubmit={fetchInvestigation}
        />
      )}

      {/* Render Create Investigation Modal */}
      {isCreateModalOpen && (
        <CreateInvestigationModal
          incidentId={incidentId}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateInvestigation}
        />
      )}

      {/* Render View Investigation Modal */}
      {isViewModalOpen && investigation && (
        <ViewInvestigation
          incidentId={incidentId}
          onClose={() => setIsViewModalOpen(false)} // Close the modal
        />
      )}
    </div>
  );
};

interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  status: 'pending' | 'in-progress' | 'completed';
}

const ActionCard: React.FC<ActionCardProps> = ({ title, icon, onClick, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <button
      onClick={onClick}
      className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-left border border-red-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </button>
  );
};