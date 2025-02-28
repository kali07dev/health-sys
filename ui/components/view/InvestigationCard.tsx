// components/Investigations/InvestigationCard.tsx
import { Investigation } from '@/interfaces/incidents';

interface InvestigationCardProps {
  investigation: Investigation;
  onClick: () => void;
}

export const InvestigationCard = ({ investigation, onClick }: InvestigationCardProps) => {
  // Properly type the status parameter
  const getStatusBadgeColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reopened':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add null check for status
  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fix the references to match your interface (lowercase properties)
  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-100 overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(investigation.status)}`}>
            {formatStatus(investigation.status)}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(investigation.startedAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
          {investigation.Incident?.Title || 'Investigation'}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3 mb-4">
          {investigation.rootCause || investigation.Incident?.Description || 'No description available.'}
        </p>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium">Lead:</span>
          <span className="ml-1 truncate">
            {investigation.LeadInvestigator ? 
              `${investigation.LeadInvestigator.FirstName} ${investigation.LeadInvestigator.LastName}` : 
              'Unassigned'}
          </span>
        </div>
      </div>
      <div className="h-2 bg-red-500 w-full"></div>
    </div>
  );
};