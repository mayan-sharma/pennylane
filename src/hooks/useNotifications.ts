import { useState, useEffect, useCallback } from 'react';
import type { TaxNotification } from '../types/tax';
import { getStorageData, setStorageData } from '../utils/localStorage';
import { generateTaxNotifications } from '../utils/taxCalculation';

const NOTIFICATIONS_KEY = 'tax_notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<TaxNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const savedNotifications = getStorageData(NOTIFICATIONS_KEY, []);
        const systemNotifications = generateTaxNotifications();
        
        // Merge saved notifications with system-generated ones
        const allNotifications = [...savedNotifications, ...systemNotifications];
        
        // Remove duplicates based on ID
        const uniqueNotifications = allNotifications.filter((notification, index, self) =>
          index === self.findIndex(n => n.id === notification.id)
        );

        setNotifications(uniqueNotifications);
        setStorageData(NOTIFICATIONS_KEY, uniqueNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markAsRead = useCallback((id: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
    setStorageData(NOTIFICATIONS_KEY, updatedNotifications);
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    setNotifications(updatedNotifications);
    setStorageData(NOTIFICATIONS_KEY, updatedNotifications);
  }, [notifications]);

  const deleteNotification = useCallback((id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    setStorageData(NOTIFICATIONS_KEY, updatedNotifications);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<TaxNotification, 'id' | 'createdAt'>) => {
    const newNotification: TaxNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    setStorageData(NOTIFICATIONS_KEY, updatedNotifications);
  }, [notifications]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(n => n.priority === 'HIGH' && !n.isRead);
  }, [notifications]);

  const getUpcomingDeadlines = useCallback(() => {
    return notifications.filter(n => 
      n.type === 'DEADLINE' && 
      n.dueDate && 
      new Date(n.dueDate) > new Date()
    ).sort((a, b) => 
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
  }, [notifications]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    getUnreadCount,
    getHighPriorityNotifications,
    getUpcomingDeadlines
  };
};