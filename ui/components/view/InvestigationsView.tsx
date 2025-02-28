// components/Investigations/InvestigationsView.tsx
'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { InvestigationCard } from './InvestigationCard';
import { InvestigationDetailsSidebar } from './InvestigationDetailsSidebar';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { InvestigationFindingsModal } from './InvestigationFindingsModal';
import { InvestigationAPI } from '@/utils/investigationAPI';
import { Investigation,} from '@/interfaces/incidents';

// interface Investigation {
//   ID: string;
//   IncidentID: string;
//   LeadInvestigatorID: string;
//   Description: string;
//   RootCause: string;
//   ContributingFactors: any;
//   InvestigationMethods: any;
//   Findings: string;
//   Recommendations: string;
//   StartedAt: string;
//   CompletedAt: string | null;
//   Status: string;
//   CreatedAt: string;
//   UpdatedAt: string;
//   LeadInvestigator?: {
//     FirstName: string;
//     LastName: string;
//   };
//   Incident?: {
//     Title: string;
//     Description: string;
//   };
// }

interface InvestigationsViewProps {
  userId: string;
  userRole: string;
}

export default function InvestigationsView({ userId, userRole }: InvestigationsViewProps) {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  
  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const response = await InvestigationAPI.getInvestigationByEmployee(userId)
        setInvestigations(response);
      } catch (err) {
        setError('Failed to load investigations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvestigations();
  }, [userId]);
  
  const filteredInvestigations = investigations.filter(investigation => 
    investigation.Incident?.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    investigation.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelectInvestigation = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
  };
  
  const handleCloseSidebar = () => {
    setSelectedInvestigation(null);
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = InvestigationAPI.getInvestigationByEmployee(userId)
      setInvestigations(response);
      
      // Refresh selected investigation if needed
      if (selectedInvestigation) {
        const updatedInvestigation = response.find(
          (inv: Investigation) => inv.id === selectedInvestigation.id
        );
        setSelectedInvestigation(updatedInvestigation || null);
      }
    } catch (err) {
      setError('Failed to refresh investigations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Search investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredInvestigations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No investigations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestigations.map((investigation) => (
            <InvestigationCard
              key={investigation.id}
              investigation={investigation}
              onClick={() => handleSelectInvestigation(investigation)}
            />
          ))}
        </div>
      )}
      
      {/* Sidebar for detailed view */}
      {selectedInvestigation && (
        <InvestigationDetailsSidebar
          investigation={selectedInvestigation}
          onClose={handleCloseSidebar}
          onScheduleInterview={() => setShowInterviewModal(true)}
          onAddFindings={() => setShowFindingsModal(true)}
        />
      )}
      
      {/* Modals */}
      {showInterviewModal && selectedInvestigation && (
        <ScheduleInterviewModal
          investigationId={selectedInvestigation.id}
          onClose={() => setShowInterviewModal(false)}
          onSchedule={handleRefresh}
        />
      )}
      
      {showFindingsModal && selectedInvestigation && (
        <InvestigationFindingsModal
          investigationId={selectedInvestigation.id}
          onClose={() => setShowFindingsModal(false)}
          onSubmit={handleRefresh}
        />
      )}
    </div>
  );
}
