// components/ui/timeline.tsx
import { ReactNode } from 'react';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  type: string;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline events available.
      </div>
    );
  }

  const getEventTypeIcon = (type: string): ReactNode => {
    switch (type?.toLowerCase()) {
      case 'created':
        return (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        );
      case 'updated':
        return (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        );
      case 'resolved':
        return (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case 'comment':
        return (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
    }
  };

  const getEventColor = (type: string, color: string = 'red'): string => {
    const baseColor = color || 'red';
    
    switch (type?.toLowerCase()) {
      case 'created':
        return `bg-${baseColor}-600`;
      case 'updated':
        return `bg-${baseColor}-500`;
      case 'resolved':
        return 'bg-green-500';
      case 'comment':
        return 'bg-blue-500';
      default:
        return `bg-${baseColor}-400`;
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== items.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <span className={`${getEventColor(item.type, item.color)} h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white`}>
                    {getEventTypeIcon(item.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-2">{item.date}</p>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}