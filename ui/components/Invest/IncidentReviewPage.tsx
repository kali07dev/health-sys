"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, XCircle } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { Incident, IncidentAttachment } from '@/interfaces/incidents'; 
import IncidentDetails from '../Incidents/IncidentDetails';
import { InvestigationPanel } from './InvestigationPanel';
import { CorrectiveActionsPanel } from '../CorrectiveActions/CorrectiveActionsPanel';
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

  // const handleCloseModal = () => {
  //   setActiveTab('details');
  // };

  const handleCloseIncident = async () => {
    try {
      if (!isAuthorized) {
        toast.error('You are not authorized to close this incident.');
        return;
      }

      // Confirm before closing
      const confirmed = window.confirm('Are you sure you want to close this incident?');
      if (!confirmed) return;

      incidentAPI.closeIncident(incidentId);
      toast.success('Incident closed successfully');
      
      // Optionally redirect or refresh
      router.push('/incidents');
    } catch (error) {
      console.error('Error closing incident:', error);
      toast.error('Failed to close incident');
    }
  };

  const isAuthorized = ['admin', 'safety_officer'].includes(session?.role ?? '');

  useEffect(() => {
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
    fetchIncident();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
      // <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <Toaster position="top-right" />
  
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Incident Review: {incident?.referenceNumber}
            </h1>
            <p className="mt-2 text-gray-600">
              Status: <span className="font-semibold">{incident?.status}</span>
            </p>
          </div>
          {isAuthorized && incident?.status !== "closed" && (
            <button
              onClick={handleCloseIncident}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Close Incident
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("details")}
                className={`${
                  activeTab === "details"
                    ? "border-red-500 text-red-600 dark:text-red-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Details
              </button>
              {isAuthorized && (
                <>
                  <button
                    onClick={() => setActiveTab("investigation")}
                    className={`${
                      activeTab === "investigation"
                        ? "border-red-500 text-red-600 dark:text-red-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                  >
                    Investigation
                  </button>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`${
                      activeTab === "actions"
                        ? "border-red-500 text-red-600 dark:text-red-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
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
    )
};

export default IncidentReviewPage;