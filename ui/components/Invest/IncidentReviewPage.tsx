import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { incidentAPI } from '@/utils/api';

interface IncidentReviewPageProps {
  incidentId: string;
}

const IncidentReviewPage = ({ incidentId }: IncidentReviewPageProps) => {
  const { data: session } = useSession();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const isAuthorized = ['admin', 'safety_officer'].includes(session?.role ?? '');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await incidentAPI.getIncident(incidentId);
        setIncident(response);
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
          {activeTab === 'details' && (
            <IncidentDetails incident={incident} isAuthorized={isAuthorized} />
          )}
          {activeTab === 'investigation' && isAuthorized && (
            <Investigation incidentId={incidentId} />
          )}
          {activeTab === 'actions' && isAuthorized && (
            <CorrectiveActions incidentId={incidentId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentReviewPage;