'use client';
// app/notifications/components/NotificationsContainer.tsx
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import NotificationItem from './NotificationItem';
// import NotificationDetailsSidebar from './NotificationDetailsSidebar';
// import PaginationControls from './PaginationControls';

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

interface NotificationsContainerProps {
  userId: string;
  userRole?: string; 
}


export default function NotificationsContainer({ userId, userRole  }: NotificationsContainerProps) {
  // const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, ] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, ] = useState('created_at');
  const [sortOrder, ] = useState('desc');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [, setSidebarOpen] = useState(false);

   // Check if user has admin or safety_officer role
   const canViewSystemNotifications = userRole === 'admin' || userRole === 'safety_officer';

   // Function to navigate to system notifications
  //  const navigateToSystemNotifications = () => {
  //    router.push('/alerts/system');
  //  };

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/notifications/user/${userId}?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalNotifications(data.total);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userId, currentPage, pageSize, sortBy, sortOrder]);

  // const fetchNotifications = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(
  //       `/api/notifications/user/${userId}?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  //     );
      
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch notifications');
  //     }
      
  //     const data = await response.json();
  //     setNotifications(data.notifications);
  //     setTotalNotifications(data.total);
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setSidebarOpen(true);
  };

  // const handleCloseSidebar = () => {
  //   setSidebarOpen(false);
  // };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update the local state to reflect the change
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, ReadAt: new Date().toISOString() }
            : notification
        )
      );

      // If the selected notification is the one marked as read, update it too
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification({
          ...selectedNotification,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const pageSizeOptions = [10, 20, 30, 50];

  if (loading && notifications.length === 0) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b">
        <h3 className="text-lg font-medium text-gray-900">Your Notifications</h3>
        {canViewSystemNotifications && (
          <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
            View System Notifications
          </button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          You have no notifications at this time.
        </div>
      ) : (
        <>
          <div className="border-b p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="text-md font-medium text-gray-700">All Notifications</h4>
              <div className="flex items-center text-sm">
                <span className="mr-2">Show:</span>
                <select 
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border rounded p-1 text-sm"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationItem 
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}