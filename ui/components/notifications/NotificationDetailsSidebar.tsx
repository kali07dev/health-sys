// app/notifications/components/NotificationDetailsSidebar.tsx
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

interface NotificationDetailsSidebarProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
}

export default function NotificationDetailsSidebar({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
}: NotificationDetailsSidebarProps) {
  if (!notification) return null;

  const isRead = !!notification.readAt;

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-lg transform transition-transform ease-in-out duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col p-4">
        <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Notification Details</h2>
          <button
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            cklose
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              notification.type === 'alert' ? 'bg-red-100 text-red-800' :
              notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {notification.type}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{notification.title}</h3>
          
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{format(new Date(notification.createdAt), 'PPpp')}</span>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-red-700 whitespace-pre-line">{notification.userName}</p>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{notification.message}</p>
          </div>
          
          {notification.referenceId && (
            <div className="mt-6 text-sm text-gray-500">
              <p>Reference: {notification.referenceType} #{notification.referenceId}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          {!isRead ? (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Mark as Read
            </button>
          ) : (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Read on {format(new Date(notification.readAt as string), 'MMM d, h:mm a')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}