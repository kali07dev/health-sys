// app/notifications/components/NotificationItem.tsx
import { format } from 'date-fns';

interface Notification {
  id: string;
  userName: string;
  type: string;
  title: string;
  message: string;
  referenceId: string;
  referenceType: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
}

export default function NotificationItem({ 
  notification, 
  onClick, 
  onMarkAsRead 
}: NotificationItemProps) {
  const isRead = !!notification.readAt;
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
  };

  return (
    <li 
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!isRead ? 'bg-red-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {getNotificationIcon(notification.type)}
        
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <h3 className={`text-sm font-medium ${!isRead ? 'text-red-700' : 'text-gray-900'}`}>
              {notification.title}
            </h3>
            <span className="text-xs text-gray-500">
              {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
          
          <p className="mt-1 text-sm text-gray-600 truncate">
            {notification.message}
          </p>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 capitalize">
              {notification.type}
            </span>
            
            {!isRead && (
              <button
                onClick={handleMarkAsRead}
                className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}