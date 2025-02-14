'use client';

import React from "react";
import { useQuery } from '@tanstack/react-query';
import { fetchNotifications } from "@/api/notifications";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { Notification } from "@/interfaces/notification";

export const NotificationList: React.FC = () => {
  const { toast } = useToast();
  
  const { 
    data: notifications, 
    isLoading, 
    error 
  } = useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "error",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  if (error) {
    return <div>Error loading notifications</div>;
  }

  if (!notifications?.length) {
    return <div>No notifications found</div>;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className="bg-white shadow rounded-lg p-4"
        >
          <h3 className="font-bold text-lg">{notification.title}</h3>
          <p className="text-gray-600">{notification.message}</p>
          <p className="text-sm text-gray-400 mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
          <Button 
            className="mt-2"
            variant="default"
          >
            Mark as Read
          </Button>
        </div>
      ))}
    </div>
  );
};