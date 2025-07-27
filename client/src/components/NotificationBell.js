import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, notifications, markAsRead, respondToJobSelection } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.jobId) {
      // Navigate to job details or progress page based on user role
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'contractor') {
        navigate('/contractor/progress');
      } else if (userRole === 'landowner') {
        navigate('/landowner/progress');
      }
    }
    
    setIsOpen(false);
  };

  const handleAcceptJob = async (notification, e) => {
    e.stopPropagation();
    try {
      await respondToJobSelection(notification._id, 'accept');
      alert('Job accepted successfully!');
      navigate('/contractor/progress');
    } catch (error) {
      alert('Failed to accept job. Please try again.');
    }
    setIsOpen(false);
  };

  const handleRejectJob = async (notification, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to reject this job?')) return;
    
    try {
      await respondToJobSelection(notification._id, 'reject');
      alert('Job rejected successfully.');
    } catch (error) {
      alert('Failed to reject job. Please try again.');
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <div 
        className="bell-icon" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="currentColor"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} unread</span>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {notification.actionRequired && notification.actionType === 'accept_reject' && (
                    <div className="notification-actions">
                      <button 
                        className="btn-accept"
                        onClick={(e) => handleAcceptJob(notification, e)}
                      >
                        Accept
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={(e) => handleRejectJob(notification, e)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className="dropdown-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 