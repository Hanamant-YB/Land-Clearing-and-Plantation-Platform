import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';
import LandownerLayout from './landowner/LandownerLayout';
import Navbar from '../components/Navbar';

const getUserRole = () => localStorage.getItem('userRole');

const Notifications = () => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    respondToJobSelection,
    deleteNotification 
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const userRole = getUserRole();

  useEffect(() => {
    fetchNotifications(currentPage, 20);
  }, [currentPage]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.jobId) {
      if (userRole === 'contractor') {
        navigate('/contractor/progress');
      } else if (userRole === 'landowner') {
        navigate('/landowner/progress');
      }
    }
  };

  const handleAcceptJob = async (notification) => {
    try {
      await respondToJobSelection(notification._id, 'accept');
      alert('Job accepted successfully!');
      navigate('/contractor/progress');
    } catch (error) {
      alert('Failed to accept job. Please try again.');
    }
  };

  const handleRejectJob = async (notification) => {
    if (!window.confirm('Are you sure you want to reject this job?')) return;
    
    try {
      await respondToJobSelection(notification._id, 'reject');
      alert('Job rejected successfully.');
    } catch (error) {
      alert('Failed to reject job. Please try again.');
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    await deleteNotification(notificationId);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_selection':
        return '🎯';
      case 'job_completion':
        return '✅';
      case 'payment_received':
        return '💰';
      case 'application_status':
        return '📋';
      default:
        return '🔔';
    }
  };

  if (loading) {
    const Layout = userRole === 'landowner' ? LandownerLayout : React.Fragment;
    return (
      <Layout>
        {userRole === 'contractor' ? (
          <div className="contractor-notifications-wrapper">
            <div className="notifications-container">
              <div className="loading">Loading notifications...</div>
            </div>
          </div>
        ) : (
          <div className="notifications-container">
            <div className="loading">Loading notifications...</div>
          </div>
        )}
      </Layout>
    );
  }

  const Layout = userRole === 'landowner' ? LandownerLayout : React.Fragment;
  return (
    <Layout>
      {userRole === 'contractor' ? (
        <div className="contractor-notifications-wrapper">
          <Navbar />
          <div className="notifications-container">
            <div className="notifications-header">
              <h1>Notifications</h1>
              <div className="header-actions">
                <button 
                  onClick={markAllAsRead}
                  className="btn-mark-all-read"
                  disabled={notifications.every(n => n.isRead)}
                >
                  Mark All as Read
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="empty-state">
                  <div className="empty-icon">🔔</div>
                  <h2>No notifications yet</h2>
                  <p>You'll see notifications here when you receive job assignments, updates, and other important messages.</p>
                </div>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header">
                        <h3>{notification.title}</h3>
                        <span className="notification-time">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="notification-message">{notification.message}</p>
                      
                      {notification.jobId && (
                        <div className="job-info">
                          <span className="job-title">{notification.jobId.title}</span>
                          <span className="job-type">{notification.jobId.workType}</span>
                          <span className="job-location">{notification.jobId.location}</span>
                        </div>
                      )}

                      {notification.actionRequired && notification.actionType === 'accept_reject' && (
                        <div className="notification-actions">
                          <button 
                            className="btn-accept"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptJob(notification);
                            }}
                          >
                            Accept Job
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectJob(notification);
                            }}
                          >
                            Reject Job
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="notification-actions-menu">
                      <button 
                        className="btn-delete"
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-pagination"
                >
                  Previous
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-pagination"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <div className="header-actions">
              <button 
                onClick={markAllAsRead}
                className="btn-mark-all-read"
                disabled={notifications.every(n => n.isRead)}
              >
                Mark All as Read
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h2>No notifications yet</h2>
                <p>You'll see notifications here when you receive job assignments, updates, and other important messages.</p>
              </div>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    {notification.jobId && (
                      <div className="job-info">
                        <span className="job-title">{notification.jobId.title}</span>
                        <span className="job-type">{notification.jobId.workType}</span>
                        <span className="job-location">{notification.jobId.location}</span>
                      </div>
                    )}

                    {notification.actionRequired && notification.actionType === 'accept_reject' && (
                      <div className="notification-actions">
                        <button 
                          className="btn-accept"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptJob(notification);
                          }}
                        >
                          Accept Job
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectJob(notification);
                          }}
                        >
                          Reject Job
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="notification-actions-menu">
                    <button 
                      className="btn-delete"
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      title="Delete notification"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-pagination"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Notifications; 