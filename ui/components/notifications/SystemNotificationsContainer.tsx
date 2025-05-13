'use client';
// app/notifications/components/SystemNotificationsContainer.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationItem from './NotificationItem';
import NotificationDetailsSidebar from './NotificationDetailsSidebar';
import PaginationControls from './PaginationControls';

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

interface SystemNotificationsContainerProps {
  userRole?: string;
}

export default function SystemNotificationsContainer({ userRole }: SystemNotificationsContainerProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, ] = useState('created_at');
  const [sortOrder, ] = useState('desc');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has permission to view system notifications
  const hasPermission = userRole === 'admin' || userRole === 'safety_officer' || userRole === 'manager';

  // Function to navigate back to user notifications
  const navigateToUserNotifications = () => {
    router.push('/alerts');
  };

  useEffect(() => {
    // Only fetch if user has permission
    if (hasPermission) {
      const fetchSystemNotifications = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/notifications/system?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch system notifications');
          }
          
          const data = await response.json();
          setNotifications(data.notifications);
          setTotalNotifications(data.total);
        } catch (error) {
          console.error('Error fetching system notifications:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSystemNotifications();
    } else {
      // Redirect unauthorized users
      router.push('/alerts');
    }
  }, [hasPermission, currentPage, pageSize, sortBy, sortOrder, router]);

  // const fetchSystemNotifications = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(
  //       `/api/notifications/system?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  //     );
      
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch system notifications');
  //     }
      
  //     const data = await response.json();
  //     setNotifications(data.notifications);
  //     setTotalNotifications(data.total);
  //   } catch (error) {
  //     console.error('Error fetching system notifications:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

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

  if (!hasPermission) {
    return <div>You do not have permission to view system notifications.</div>;
  }

  if (loading && notifications.length === 0) {
    return <div>Loading system notifications...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-full">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">System Notifications</h1>
          <button
            onClick={navigateToUserNotifications}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Back to Your Notifications
          </button>
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">There are no system notifications at this time.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-medium text-black">All System Notifications</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="pageSize" className="text-sm text-gray-600">
                    Show:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border rounded p-1 text-sm text-black" 
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
            </div>
            
            <PaginationControls 
              currentPage={currentPage}
              totalItems={totalNotifications}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
      
      <NotificationDetailsSidebar
        notification={selectedNotification}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
}