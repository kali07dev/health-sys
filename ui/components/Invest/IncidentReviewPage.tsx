"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, XCircle, UserPlus, UserCheck, FileText, Settings } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { Incident, IncidentAttachment } from '@/interfaces/incidents'; 
import IncidentDetails from '../Incidents/IncidentDetails';
import { InvestigationPanel } from './InvestigationPanel';
import { CorrectiveActionsPanel } from '../CorrectiveActions/CorrectiveActionsPanel';
import { AssignIncidentModal } from '../Incidents/AssignIncidentModal';
import { useRouter } from 'next/navigation';

interface IncidentReviewPageProps {
  incidentId: string;
}

const IncidentReviewPage = ({ incidentId }: IncidentReviewPageProps) => {
  const router = useRouter();
  const { data: session } = useSession()
  const [incident, setIncident] = useState<Incident | null>(null);
  const [attachments, setAttachments] = useState<IncidentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleOpenSummary = () => {
    router.push(`/incidents/${incidentId}/summary`);
  };

  const handleCloseIncident = async () => {
    try {
      if (!isAuthorized) {
        toast.error('You are not authorized to close this incident.');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to close this incident?');
      if (!confirmed) return;

      await incidentAPI.closeIncident(incidentId);
      toast.success('Incident closed successfully');
      router.push('/incidents');
    } catch (error) {
      console.error('Error closing incident:', error);
      toast.error('Failed to close incident');
    }
  };

  const handleAssignmentComplete = () => {
    // Refresh incident data
    fetchIncident();
  };

  const isAuthorized = ['admin', 'safety_officer', 'manager'].includes(session?.role ?? '');

  const fetchIncident = async () => {
    try {
      const response = await incidentAPI.getIncident(incidentId);
      setIncident(response.incident);
      setAttachments(response.attachments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { color: 'bg-blue-500', text: 'New', icon: '🆕' },
      investigating: { color: 'bg-yellow-500', text: 'Investigating', icon: '🔍' },
      action_required: { color: 'bg-orange-500', text: 'Action Required', icon: '⚠️' },
      resolved: { color: 'bg-green-500', text: 'Resolved', icon: '✅' },
      closed: { color: 'bg-gray-500', text: 'Closed', icon: '🔒' },
    };
    return configs[status as keyof typeof configs] || configs.new;
  };

  const statusConfig = getStatusConfig(incident?.status || 'new');

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title and Status */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {incident?.referenceNumber}
                </h1>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white ${statusConfig.color}`}>
                  <span>{statusConfig.icon}</span>
                  {statusConfig.text}
                </div>
              </div>
              <p className="text-gray-600 max-w-2xl">
                {incident?.title}
              </p>
              {incident?.assignedTo && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <UserCheck className="w-4 h-4" />
                  <span>Assigned to: <strong>{incident.assignedTo}</strong></span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {isAuthorized && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  {incident?.assignedTo ? (
                    <>
                      <Settings className="w-4 h-4" />
                      Reassign
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Assign
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleOpenSummary}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                View Summary
              </button>

              {isAuthorized && incident?.status !== "closed" && (
                <button
                  onClick={handleCloseIncident}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Close Incident
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                Details
              </button>
              {isAuthorized && (
                <>
                  <button
                    onClick={() => setActiveTab("investigation")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "investigation"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    Investigation
                  </button>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "actions"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    Actions
                  </button>
                </>
              )}
            </nav>
          </div>
          <div className="p-4 sm:p-6">
            {activeTab === "details" && incident && (
              <IncidentDetails incident={incident} attachments={attachments} isAuthorized={isAuthorized} />
            )}
            {activeTab === "investigation" && isAuthorized && <InvestigationPanel incidentId={incidentId} />}
            {activeTab === "actions" && isAuthorized && session?.role && (
              <CorrectiveActionsPanel incidentId={incidentId} userRole={session.role} userID={session?.user?.id} />
            )}
          </div>
        </div>
      </div>

      {/* Assign Incident Modal */}
      {showAssignModal && incident && (
        <AssignIncidentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          incidentId={incidentId}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </div>
  )
};

export default IncidentReviewPage;