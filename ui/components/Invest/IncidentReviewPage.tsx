"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import { Incident, IncidentAttachment } from '@/interfaces/incidents'; 
import IncidentDetails from '../Incidents/IncidentDetails';
import { InvestigationPanel } from './InvestigationPanel';
import { CorrectiveActionsPanel } from '../CorrectiveActions/CorrectiveActionsPanel';
import router from 'next/router';

interface IncidentReviewPageProps {
  incidentId: string;
}

const IncidentReviewPage = ({ incidentId }: IncidentReviewPageProps) => {
  // const { data: session } = useSession();
  const { data: session, status } = useSession()
  const [incident, setIncident] = useState<Incident | null>(null);
  const [attachments, setAttachments] = useState<IncidentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const handleCloseModal = () => {
    setActiveTab('details'); // Reset to the default tab
  };

  if (status === "unauthenticated") {
    router.push("/login")
    return
  }
  if (status === "authenticated") {
    const userID = session.user?.id
    const userRole = session.role
  }
  const isAuthorized = ['admin', 'safety_officer'].includes(session?.role ?? '');
  console.log('session', session);
  console.log('isAuthorized', session?.role, session?.user?.id  );

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
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Incident Review: {incident?.referenceNumber}
        </h1>
        <p className="mt-2 text-gray-600">
          Status: <span className="font-semibold">{incident?.status}</span>
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Details
            </button>
            {isAuthorized && (
              <>
                <button
                  onClick={() => setActiveTab('investigation')}
                  className={`${
                    activeTab === 'investigation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Investigation
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`${
                    activeTab === 'actions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Actions
                </button>
              </>
            )}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'details' && incident && (
            <IncidentDetails incident={incident} 
            attachments={attachments}
            isAuthorized={isAuthorized}  />
          )}
          {activeTab === 'investigation' && isAuthorized && (
            <InvestigationPanel incidentId={incidentId} />
          )}
          {activeTab === 'actions' && isAuthorized && session?.role && (
            <CorrectiveActionsPanel incidentId={incidentId} userRole={session.role} userID= {session?.user?.id } />
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentReviewPage;