// app/notifications/components/NotificationsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { notificationService, type Notification, type NotificationFilter } from '@/utils/notficationApi';
import { format } from 'date-fns';
import LoadingSpinner from '../ui/LoadingSpinner';

interface NotificationsListProps {
  userId: string;
  isSystemView?: boolean;
}

export default function NotificationsList({ userId, isSystemView = false }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [filter] = useState<NotificationFilter>({
    sortBy: 'CreatedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = isSystemView
          ? await notificationService.getAllSystemNotifications(filter)
          : await notificationService.getUserNotifications(userId, filter);
        setNotifications(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "error"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [filter, isSystemView, toast, userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = isSystemView
        ? await notificationService.getAllSystemNotifications(filter)
        : await notificationService.getUserNotifications(userId, filter);
      setNotifications(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      toast({
        title: "Success",
        description: "Notification marked as read"
      });
      fetchNotifications();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "error"
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.ID}
          className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{notification.Title}</h3>
              <p className="text-gray-600 mt-1">{notification.Message}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                  {notification.Type}
                </span>
                <span className="text-sm text-gray-500">
                  {format(new Date(notification.CreatedAt), 'PPp')}
                </span>
              </div>
            </div>
            {!notification.ReadAt && (
              <button
                onClick={() => handleMarkAsRead(notification.ID)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Mark as Read
              </button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No notifications found
        </div>
      )}
    </div>
  );
}

