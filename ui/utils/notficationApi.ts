// services/notificationService.ts
import axios from 'axios';

export interface Notification {
  ID: string;
  UserName: string;
  Type: string;
  Title: string;
  Message: string;
  ReferenceID: string;
  ReferenceType: string;
  ReadAt: string;
  CreatedAt: string;
}

export interface NotificationFilter {
  type?: string;
  sortBy?: 'CreatedAt' | 'Type' | 'Title';
  sortOrder?: 'asc' | 'desc';
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

export const notificationService = {
  async getUserNotifications(userId: string, filter?: NotificationFilter) {
    const response = await axios.get(`${API_BASE_URL}/notifications/user/${userId}`, {
      params: filter,
      withCredentials: true
    });
    return response.data as Notification[];
  },

  async getAllSystemNotifications(filter?: NotificationFilter) {
    const response = await axios.get(`${API_BASE_URL}/notifications/system`, {
      params: filter,
      withCredentials: true
    });
    return response.data as Notification[];
  },

  async markAsRead(notificationId: string) {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {},
      { withCredentials: true }
    );
    return response.data;
  }
};