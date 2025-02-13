import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNotificationSettings } from "@/api/notifications";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { Loader2 } from "../ui/loader"; // Import Loader2

export const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
        queryClient.invalidateQueries({ 
            queryKey: ["notificationSettings"] 
          });
      toast({
        title: "Success",
        description: "Notification settings updated",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "error",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const settings = {
      emailNotifications: formData.get("emailNotifications") === "on",
      pushNotifications: formData.get("pushNotifications") === "on",
      reminderFrequency: Number(formData.get("reminderFrequency")),
    };
    mutation.mutate(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="emailNotifications" className="font-medium">
          Email Notifications
        </label>
        <Switch id="emailNotifications" name="emailNotifications" />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="pushNotifications" className="font-medium">
          Push Notifications
        </label>
        <Switch id="pushNotifications" name="pushNotifications" />
      </div>
      <div>
        <label htmlFor="reminderFrequency" className="font-medium">
          Reminder Frequency (days)
        </label>
        <input
          type="number"
          id="reminderFrequency"
          name="reminderFrequency"
          min="1"
          max="30"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Settings
      </Button>
    </form>
  );
};