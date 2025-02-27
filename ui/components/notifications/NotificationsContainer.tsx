'use client';
// app/notifications/components/NotificationsContainer.tsx
import { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import NotificationDetailsSidebar from './NotificationDetailsSidebar';
import PaginationControls from './PaginationControls';

interface Notification {
  ID: string;
  UserName: string;
  Type: string;
  Title: string;
  Message: string;
  ReferenceID: string;
  ReferenceType: string;
  ReadAt: string | null;
  CreatedAt: string;
}

interface NotificationsContainerProps {
  userId: string;
}

export default function NotificationsContainer({ userId }: NotificationsContainerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [userId, currentPage, pageSize, sortBy, sortOrder]);

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
      setNotifications(data.Notifications);
      setTotalNotifications(data.Total);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

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
          notification.ID === notificationId
            ? { ...notification, ReadAt: new Date().toISOString() }
            : notification
        )
      );

      // If the selected notification is the one marked as read, update it too
      if (selectedNotification && selectedNotification.ID === notificationId) {
        setSelectedNotification({
          ...selectedNotification,
          ReadAt: new Date().toISOString()
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
    <div className="flex h-full">
      <div className="w-full">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">You have no notifications at this time.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-medium">All Notifications</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="pageSize" className="text-sm text-gray-600">
                    Show:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
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
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.ID}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.ID)}
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