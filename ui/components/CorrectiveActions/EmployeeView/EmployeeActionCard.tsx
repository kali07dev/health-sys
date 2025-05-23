import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { CorrectiveAction } from '@/interfaces/incidents';
import { useTranslations } from 'next-intl';

interface EmployeeActionCardProps {
  action: CorrectiveAction;
  onClick: () => void;
}

export default function EmployeeActionCard({ action, onClick }: EmployeeActionCardProps) {
  const t = useTranslations('correctiveActions');
  
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
    const statusText = t(`status.${status}`, { defaultValue: status });
    
    switch (status) {
      case 'completed':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-400',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          textColor: 'text-green-700',
          text: statusText
        };
      case 'verified':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-600',
          icon: <CheckCircle2 className="h-5 w-5 text-green-800" />,
          textColor: 'text-green-800',
          text: statusText
        };
      case 'in_progress':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          textColor: 'text-blue-700',
          text: statusText
        };
      case 'overdue':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          textColor: 'text-red-700',
          text: statusText
        };
      default:
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-400',
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          textColor: 'text-amber-700',
          text: statusText
        };
    }
  };

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    const priorityText = t(`priority.${priority}`, { defaultValue: priority });
    
    switch (priority) {
      case 'critical':
        return { style: 'bg-red-100 text-red-800', text: priorityText };
      case 'high':
        return { style: 'bg-orange-100 text-orange-800', text: priorityText };
      case 'medium':
        return { style: 'bg-yellow-100 text-yellow-800', text: priorityText };
      default:
        return { style: 'bg-green-100 text-green-800', text: priorityText };
    }
  };

  const statusConfig = getStatusConfig(action.status);
  const priorityConfig = getPriorityStyle(action.priority);

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
              {statusConfig.text}
            </span>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityConfig.style}`}>
            {priorityConfig.text}
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
                ? t('details.daysOverdue', { days: Math.abs(daysDiff) })
                : daysDiff === 0 
                  ? t('details.dueToday')
                  : t('details.daysRemaining', { days: daysDiff })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}