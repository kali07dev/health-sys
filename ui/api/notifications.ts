// src/api/notifications.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/notifications';

export const fetchNotifications = async () => {
  const response = await axios.get(`${BASE_URL}`);
  return response.data;
};

export const updateNotificationSettings = async (settings: any) => {
  const response = await axios.put(`${BASE_URL}/settings`, settings);
  return response.data;
};