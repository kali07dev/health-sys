import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { CorrectiveAction } from '@/interfaces/incidents';

interface EmployeeActionCardProps {
  action: CorrectiveAction;
  onClick: () => void;
}

export default function EmployeeActionCard({ action, onClick }: EmployeeActionCardProps) {
  // Format due date
  const dueDate = new Date(action.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Calculate days remaining or overdue
  const today = new Date();
  const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  // Define status styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-400',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          textColor: 'text-green-700'
        };
      case 'verified':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-600',
          icon: <CheckCircle2 className="h-5 w-5 text-green-800" />,
          textColor: 'text-green-800'
        };
      case 'in_progress':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          textColor: 'text-blue-700'
        };
      case 'overdue':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          textColor: 'text-red-700'
        };
      default:
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-400',
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          textColor: 'text-amber-700'
        };
    }
  };

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const statusConfig = getStatusConfig(action.status);

  return (
    <div 
      className={`border rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer ${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            {statusConfig.icon}
            <span className={`ml-2 text-sm font-medium ${statusConfig.textColor}`}>
              {action.status.charAt(0).toUpperCase() + action.status.slice(1).replace('_', ' ')}
            </span>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityStyle(action.priority)}`}>
            {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
          </span>
        </div>
        
        <h3 className="text-base font-medium text-gray-900 mb-3 line-clamp-2">{action.description}</h3>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formattedDueDate}</span>
          </div>
          
          {action.status !== 'completed' && action.status !== 'verified' && (
            <div className={daysDiff < 0 ? 'text-red-600 font-medium' : daysDiff <= 3 ? 'text-amber-600 font-medium' : 'text-gray-600'}>
              {daysDiff < 0 
                ? `${Math.abs(daysDiff)} days overdue` 
                : daysDiff === 0 
                  ? 'Due today' 
                  : `${daysDiff} days remaining`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}