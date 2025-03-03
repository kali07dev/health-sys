// Add proper type definition for props
import { Investigation } from '@/interfaces/incidents';
import { XMarkIcon, ClockIcon, DocumentTextIcon, UserCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface InvestigationDetailsSidebarProps {
  investigation: Investigation;
  onClose: () => void;
  onScheduleInterview: () => void;
  onAddFindings: () => void;
}

export const InvestigationDetailsSidebar = ({ 
  investigation, 
  onClose,
  onScheduleInterview,
  onAddFindings
}: InvestigationDetailsSidebarProps) => {
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
            {investigation.Incident?.Title || 'Investigation'}
          </h3>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <UserCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Lead Investigator</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {investigation.LeadInvestigator ? 
                `${investigation.LeadInvestigator.FirstName} ${investigation.LeadInvestigator.LastName}` : 
                'Unassigned'}
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Description</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {investigation.rootCause || investigation.Incident?.Description || 'No description available.'}
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
          </div>
        </div>
      </div>
    </div>
  );
};