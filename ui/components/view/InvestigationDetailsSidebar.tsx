import { Investigation } from '@/interfaces/incidents';
import { 
  XMarkIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  CheckCircleIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { InvestigationAPI } from '@/utils/investigationAPI';
import { useRouter } from 'next/navigation';

interface InvestigationDetailsSidebarProps {
  investigation: Investigation;
  onClose: () => void;
  onScheduleInterview: () => void;
  onAddFindings: () => void;
  onInvestigationClosed: () => void; // New prop for handling investigation closure
}

export const InvestigationDetailsSidebar = ({ 
  investigation, 
  onClose,
  onScheduleInterview,
  onAddFindings,
  onInvestigationClosed
}: InvestigationDetailsSidebarProps) => {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseInvestigation = async () => {
    if (!window.confirm('Are you sure you want to close this investigation? This action cannot be undone.')) {
      return;
    }

    setIsClosing(true);
    try {
      await InvestigationAPI.closeInvestigation(investigation.id);
      onInvestigationClosed();
      router.refresh(); // Refresh the page to reflect the updated status
    } catch (error) {
      console.error('Error closing investigation:', error);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40 overflow-hidden flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto animate-slide-left">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Investigation Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium 
              ${investigation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                investigation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                investigation.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {investigation.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{new Date(investigation.startedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Incident Name: :{investigation.incident?.Title || 'Investigation'}
          </h3>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <UserCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Lead Investigator</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {investigation.leadInvestigatorName ||  'Unassigned'}
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Description</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {investigation.rootCause || investigation.incident?.Description || 'No description available.'}
            </p>

            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Incident Description</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {investigation.incident?.Description || 'No description available.'}
            </p>
          </div>
          
          {investigation.rootCause && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Root Cause</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{investigation.rootCause}</p>
            </div>
          )}
          
          {investigation.contributingFactors && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Contributing Factors</span>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-7">
                {Array.isArray(investigation.contributingFactors) ? 
                  investigation.contributingFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  )) : 
                  <li>No contributing factors available</li>
                }
              </ul>
            </div>
          )}
          
          {investigation.findings && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Findings</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{investigation.findings}</p>
            </div>
          )}
          
          {investigation.recommendations && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Recommendations</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{investigation.recommendations}</p>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-6 space-y-4">
            {investigation.status !== 'completed' && (
              <>
                <button 
                  onClick={onScheduleInterview}
                  className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Schedule Interview
                </button>
                
                {!investigation.findings && (
                  <button 
                    onClick={onAddFindings}
                    className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-red-500 border border-red-500 rounded-md text-sm font-medium transition-colors"
                  >
                    Add Findings
                  </button>
                )}
              </>
            )}

            {investigation.status !== 'completed' && (
              <button 
                onClick={handleCloseInvestigation}
                disabled={isClosing}
                className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LockClosedIcon className="h-4 w-4 mr-2" />
                {isClosing ? 'Closing Investigation...' : 'Close Investigation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};