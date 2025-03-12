import { Investigation } from '@/interfaces/incidents';

interface InvestigationCardProps {
  investigation: Investigation;
  onClick: () => void;
}

export const InvestigationCard = ({ investigation, onClick }: InvestigationCardProps) => {
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

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Add null check for status
  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format date with more readable format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">
              Started: {formatDate(investigation.startedAt)}
            </span>
            <span className={`text-sm font-medium ${getSeverityColor(investigation.incident?.SeverityLevel)}`}>
              {investigation.incident?.SeverityLevel || 'Unknown Severity'}
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
          Incident: {investigation.incident?.Title || 'Untitled Incident'}
        </h3>
        
        <p className="text-sm text-gray-500 line-clamp-3 mb-4">
          {investigation.incident?.Description || 'No description available.'}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Lead Investigator:</span>
            <span className="ml-1 truncate block">
              {investigation.leadInvestigatorName || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="font-medium">Location:</span>
            <span className="ml-1 truncate block">
              {investigation.incident?.Location || 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Findings:</span>
            <span className="ml-1 truncate block">
              {investigation.findings || 'Pending'}
            </span>
          </div>
          <div>
            <span className="font-medium">Recommendations:</span>
            <span className="ml-1 truncate block">
              {investigation.recommendations || 'None'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Duration: {investigation.durationDays || 0} days</span>
          <span>Updated: {formatDate(investigation.updatedAt)}</span>
        </div>
      </div>
      <div 
        className={`h-2 w-full ${
          investigation.status === 'in_progress' ? 'bg-blue-500' :
          investigation.status === 'pending_review' ? 'bg-yellow-500' :
          investigation.status === 'completed' ? 'bg-green-500' : 
          'bg-gray-500'
        }`}
      ></div>
    </div>
  );
};