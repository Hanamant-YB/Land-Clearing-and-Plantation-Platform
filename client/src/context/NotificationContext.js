import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Respond to job selection (accept/reject)
  const respondToJobSelection = async (notificationId, response) => {
    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}/respond`,
        { response },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true, actionRequired: false }
            : notification
        )
      );
      
      // Update unread count
      fetchUnreadCount();
      
      return result.data;
    } catch (error) {
      console.error('Error responding to job selection:', error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
      // Update unread count if it was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Initialize notifications on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    respondToJobSelection,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 