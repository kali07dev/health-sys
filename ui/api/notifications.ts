// src/api/notifications.ts
import axios from 'axios';
import { Notification } from '@/interfaces/notification'; // Import the type

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: number;
}

const BASE_URL = 'http://localhost:8000/api/notifications';



export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await axios.get<Notification[]>(`${BASE_URL}`);
  return response.data;
};

export const updateNotificationSettings = async (
  settings: NotificationSettings
): Promise<NotificationSettings> => {
  const response = await axios.put<NotificationSettings>(
    `${BASE_URL}/settings`,
    settings
  );
  return response.data;
};