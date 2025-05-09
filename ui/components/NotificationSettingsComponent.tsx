import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/dashCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface NotificationSettingsProps {
  userId: string;
}

interface NotificationSettings {
  id: string;
  userId: string;
  reminderFrequency: string;
  lastReminderAt: string;
  updatedAt: string;
}

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({ userId }) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const frequencies = [
    { value: 'immediate', label: 'Immediately' },
    { value: 'hourly', label: 'Every Hour' },
    { value: 'daily', label: 'Once a Day' },
    { value: 'weekly', label: 'Once a Week' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/notification-settings/${userId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [userId, toast]);



  const updateSettings = async (frequency: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/notification-settings/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminderFrequency: frequency }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Notification Frequency
            </label>
            <Select
              disabled={saving}
              value={settings?.reminderFrequency}
              onValueChange={updateSettings}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {settings?.lastReminderAt && (
            <p className="text-sm text-gray-500">
              Last notification sent: {new Date(settings.lastReminderAt).toLocaleDateString()}
            </p>
          )}
          
          {saving && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving changes...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsComponent;