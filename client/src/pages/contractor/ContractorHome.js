import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import ContractorFooter from './ContractorFooter';
import { AuthContext } from '../../context/AuthContext';
import './ContractorHome.css';

export default function ContractorHome() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeAssignments: 0,
    completedJobs: 0,
    averageRating: 0,
    pendingPayments: 0,
    aiShortlisted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Slideshow states
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [inspirationSlideIndex, setInspirationSlideIndex] = useState(0);

  // Hero slideshow images
  const heroImages = [
    {
      src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800&h=480&fit=crop&crop=center",
      alt: "Sunrise over lush plantation"
    },
    {
      src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=480&fit=crop&crop=center",
      alt: "Rolling green hills and trees"
    },
    {
      src: "https://images.unsplash.com/photo-1464983953574-0892a716854b?w=800&h=480&fit=crop&crop=center",
      alt: "Vibrant forest with sunlight"
    }
  ];

  // Inspiration slideshow images
  const inspirationImages = [
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
      alt: "Young plant growing in soil",
      title: "Planting Growth",
      description: "Every job is like planting a seed - nurture it with care and watch it grow into something beautiful."
    },
    {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center",
      alt: "Lush green landscape with trees",
      title: "Building Landscapes",
      description: "Transform barren land into thriving ecosystems, one project at a time."
    },
    {
      src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop&crop=center",
      alt: "Sustainable forest environment",
      title: "Sustainable Future",
      description: "Your work contributes to a greener, more sustainable future for generations to come."
    }
  ];

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Slideshow effects
  useEffect(() => {
    // Hero slideshow
    const heroInterval = setInterval(() => {
      setHeroSlideIndex(prev => (prev + 1) % heroImages.length);
    }, 3000);

    // Inspiration slideshow
    const inspirationInterval = setInterval(() => {
      setInspirationSlideIndex(prev => (prev + 1) % inspirationImages.length);
    }, 4000);

    return () => {
      clearInterval(heroInterval);
      clearInterval(inspirationInterval);
    };
  }, [heroImages.length, inspirationImages.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting dashboard data fetch...');
      
      const paymentsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/payments/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('💰 Payments data:', paymentsRes.data);
      console.log('💰 Payment breakdown:', {
        totalPayments: paymentsRes.data.totalPayments,
        pendingPayments: paymentsRes.data.pendingPayments,
        pendingAmount: paymentsRes.data.pendingAmount,
        completedPayments: paymentsRes.data.completedPayments,
        completedAmount: paymentsRes.data.completedAmount,
        totalAmount: paymentsRes.data.totalAmount
      });

      const assignmentsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('📋 Assignments data:', assignmentsRes.data);

      const feedbackRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/contractor`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('⭐ Feedback data:', feedbackRes.data);

      const aiShortlistedRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/contractor/ai-shortlisted`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('🤖 AI Shortlisted data:', aiShortlistedRes.data);

      const notificationsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications?limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('🔔 Notifications data:', notificationsRes.data);

      // Calculate realistic stats
      const totalEarnings = paymentsRes.data.completedAmount || 0;
      const activeAssignments = assignmentsRes.data.length || 0;
      const completedJobs = paymentsRes.data.completedPayments || 0; // Use completed payments as completed jobs
      const averageRating = feedbackRes.data.stats?.averageRating || 0;
      const pendingPayments = paymentsRes.data.pendingAmount || 0;
      const aiShortlisted = aiShortlistedRes.data.length || 0;

      // Debug logging
      console.log('📊 Real Contractor Data:', {
        totalEarnings,
        activeAssignments,
        completedJobs,
        averageRating,
        pendingPayments,
        aiShortlisted,
        paymentStats: paymentsRes.data // Log full payment stats for debugging
      });

      // Check if there are any payments at all
      if (paymentsRes.data.totalPayments === 0) {
        console.log('⚠️ No payments found in database');
      } else {
        console.log('✅ Found real payments:', {
          total: paymentsRes.data.totalPayments,
          pending: paymentsRes.data.pendingPayments,
          completed: paymentsRes.data.completedPayments
        });
      }

      // Use ONLY real data - no fake sample data
      setStats({
        totalEarnings,
        activeAssignments,
        completedJobs,
        averageRating,
        pendingPayments,
        aiShortlisted,
      });
      setRecentActivity([
        ...(assignmentsRes.data.slice(0, 2).map(j => ({
          type: 'assignment',
          title: j.title,
          date: j.startDate,
        }))),
        ...(feedbackRes.data.feedback?.slice(0, 2).map(f => ({
          type: 'feedback',
          title: f.jobTitle,
          date: f.createdAt,
          rating: f.rating,
        })) || []),
        ...(paymentsRes.data.recentPayments?.slice(0, 2).map(p => ({
          type: 'payment',
          title: p.jobId?.title || 'Payment',
          date: p.createdAt,
          amount: p.amount,
        })) || []),
      ]);
      setNotifications(notificationsRes.data.notifications || []);
      
      // Debug logging for notifications
      console.log('🔔 Notifications breakdown:', {
        total: notificationsRes.data.notifications?.length || 0,
        unread: notificationsRes.data.notifications?.filter(n => !n.isRead).length || 0,
        actionRequired: notificationsRes.data.notifications?.filter(n => n.actionRequired).length || 0,
        types: notificationsRes.data.notifications?.map(n => n.type) || []
      });
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // Set fallback stats
      setStats({
        totalEarnings: 0,
        activeAssignments: 0,
        completedJobs: 0,
        averageRating: 0,
        pendingPayments: 0,
        aiShortlisted: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="contractor-home-dashboard">
        {/* Hero Section with Nature Images */}
        <div className="dashboard-hero">
          <div className="hero-background">
            <div className="hero-image-overlay"></div>
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <h1>Welcome, {user?.name || 'Contractor'}!</h1>
              <div className="hero-subtitle">Your Professional Land Clearing & Plantation Dashboard</div>
              <div className="hero-description">
                Nurturing growth, building landscapes, and cultivating success - all in one place
              </div>
            </div>
            <div className="hero-visual">
              <div className="nature-image-container">
                <div className="nature-image">
                  <img 
                    src={heroImages[heroSlideIndex].src} 
                    alt={heroImages[heroSlideIndex].alt}
                    loading="lazy"
                  />
                </div>
                <div className="slideshow-indicators">
                  {heroImages.map((_, index) => (
                    <div 
                      key={index}
                      className={`indicator ${index === heroSlideIndex ? 'active' : ''}`}
                      onClick={() => setHeroSlideIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="dashboard-content-inner">
            {loading ? (
              <div className="dashboard-spinner" />
            ) : (
              <>
                {/* Stats Overview Section */}
                <div className="dashboard-section">
                  <div className="dashboard-section-title">
                    <span className="section-icon">📊</span>
                    Stats Overview
                    <div className="section-decoration">🌿</div>
                  </div>
                  <div className="dashboard-section-content">
                    <div className="stats-cards">
                      <StatCard label="Total Earnings" value={`₹${stats.totalEarnings?.toLocaleString()}`} icon="💰" accent="#2e7d32" iconBg="#e8f5e9" />
                      <StatCard label="Active Assignments" value={stats.activeAssignments} icon="🛠️" accent="#1976d2" iconBg="#e3f2fd" />
                      <StatCard label="Completed Jobs" value={stats.completedJobs} icon="✅" accent="#388e3c" iconBg="#e8f5e9" />
                      <StatCard label="Avg. Rating" value={Number(stats.averageRating).toFixed(1)} icon="⭐" accent="#fbc02d" iconBg="#fffde7" />
                      <StatCard label="Pending Payments" value={`₹${stats.pendingPayments?.toLocaleString()}`} icon="⏳" accent="#e65100" iconBg="#fff3e0" />
                      <StatCard label="AI Shortlisted" value={stats.aiShortlisted} icon="🤖" accent="#512da8" iconBg="#ede7f6" />
                    </div>
                  </div>
                </div>
                <div className="dashboard-section-divider">
                  <div className="divider-decoration">🌱</div>
                </div>

                {/* Quick Actions Section */}
                <div className="dashboard-section">
                  <div className="dashboard-section-title">
                    <span className="section-icon">⚡</span>
                    Quick Actions
                    <div className="section-decoration">🌿</div>
                  </div>
                  <div className="dashboard-section-content">
                    <div className="quick-actions">
                      <QuickAction label="My Assignments" onClick={() => navigate('/contractor/assignments')} icon="🗂️" />
                      <QuickAction label="Work Management" onClick={() => navigate('/contractor/work-management')} icon="📋" />
                      <QuickAction label="Payments" onClick={() => navigate('/contractor/payments')} icon="💳" />
                      <QuickAction label="Feedback" onClick={() => navigate('/contractor/feedback')} icon="📝" />
                      <QuickAction label="Profile" onClick={() => navigate('/contractor/profile')} icon="👤" />
                      <QuickAction label="Past Works" onClick={() => navigate('/contractor/past-works')} icon="🏗️" />
                    </div>
                  </div>
                </div>
                <div className="dashboard-section-divider">
                  <div className="divider-decoration">🌱</div>
                </div>

                {/* Performance & Financials Section */}
                <div className="dashboard-section">
                  <div className="dashboard-section-title">
                    <span className="section-icon">💼</span>
                    Performance & Financials
                    <div className="section-decoration">🌿</div>
                  </div>
                  <div className="dashboard-section-content">
                    {/* Performance Metrics Grid */}
                    <div className="performance-metrics-grid">
                      <div className="metric-card performance">
                        <div className="metric-header">
                          <div className="metric-icon">📊</div>
                          <div className="metric-title">Job Completion Rate</div>
                        </div>
                        <div className="metric-value">
                          {stats.completedJobs + stats.activeAssignments > 0 ? Math.round((stats.completedJobs / (stats.completedJobs + stats.activeAssignments)) * 100) : 0}%
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="progress-bar" 
                            style={{width: `${stats.completedJobs + stats.activeAssignments > 0 ? Math.round((stats.completedJobs / (stats.completedJobs + stats.activeAssignments)) * 100) : 0}%`}}
                          ></div>
                        </div>
                        <div className="metric-details">
                          <span>{stats.completedJobs} completed</span>
                          <span>{stats.activeAssignments} active</span>
                        </div>
                      </div>

                      <div className="metric-card rating">
                        <div className="metric-header">
                          <div className="metric-icon">⭐</div>
                          <div className="metric-title">Average Rating</div>
                        </div>
                        <div className="metric-value">
                          {Number(stats.averageRating).toFixed(1)}
                        </div>
                        <div className="metric-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`star ${star <= Math.round(stats.averageRating) ? 'filled' : ''}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="metric-details">
                          <span>Based on {stats.completedJobs} reviews</span>
                        </div>
                      </div>

                      <div className="metric-card ai">
                        <div className="metric-header">
                          <div className="metric-icon">🤖</div>
                          <div className="metric-title">AI Shortlisted</div>
                        </div>
                        <div className="metric-value">
                          {stats.aiShortlisted}
                        </div>
                        <div className="metric-badge">
                          <span className="badge">AI Recommended</span>
                        </div>
                        <div className="metric-details">
                          <span>High-performance contractor</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="financial-summary">
                      <div className="financial-header">
                        <h3>💰 Financial Overview</h3>
                        <div className="financial-period">This Month</div>
                      </div>
                      
                      <div className="financial-grid">
                        <div className="financial-card earnings">
                          <div className="financial-icon">💵</div>
                          <div className="financial-content">
                            <div className="financial-label">Total Earnings</div>
                            <div className="financial-amount">₹{stats.totalEarnings?.toLocaleString()}</div>
                            <div className="financial-trend positive">
                              <span>↗</span> {stats.completedJobs > 0 ? `₹${Math.round(stats.totalEarnings / stats.completedJobs).toLocaleString()}` : '₹0'} avg per job
                            </div>
                          </div>
                        </div>

                        <div className="financial-card pending">
                          <div className="financial-icon">⏳</div>
                          <div className="financial-content">
                            <div className="financial-label">Pending Payments</div>
                            <div className="financial-amount">₹{stats.pendingPayments?.toLocaleString()}</div>
                            <div className="financial-trend neutral">
                              <span>→</span> {stats.activeAssignments > 0 ? `${stats.activeAssignments} active jobs` : 'No pending work'}
                            </div>
                          </div>
                        </div>

                        <div className="financial-card completed">
                          <div className="financial-icon">✅</div>
                          <div className="financial-content">
                            <div className="financial-label">Completed Jobs</div>
                            <div className="financial-amount">{stats.completedJobs}</div>
                            <div className="financial-trend positive">
                              <span>↗</span> {stats.completedJobs + stats.activeAssignments > 0 ? Math.round((stats.completedJobs / (stats.completedJobs + stats.activeAssignments)) * 100) : 0}% success rate
                            </div>
                          </div>
                        </div>

                        <div className="financial-card active">
                          <div className="financial-icon">🔄</div>
                          <div className="financial-content">
                            <div className="financial-label">Active Assignments</div>
                            <div className="financial-amount">{stats.activeAssignments}</div>
                            <div className="financial-trend neutral">
                              <span>→</span> {stats.activeAssignments > 0 ? 'In progress' : 'No active work'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Insights */}
                      <div className="performance-insights">
                        <div className="insights-header">
                          <h4>📈 Performance Insights</h4>
                          <div className="insights-period">Based on real data</div>
                        </div>
                        <div className="insights-grid">
                          <div className="insight-item">
                            <div className="insight-label">Efficiency Score</div>
                            <div className="insight-value">
                              {stats.completedJobs + stats.activeAssignments > 0 ? Math.round((stats.completedJobs / (stats.completedJobs + stats.activeAssignments)) * 100) : 0}%
                            </div>
                            <div className="insight-bar">
                              <div 
                                className="insight-progress" 
                                style={{width: `${stats.completedJobs + stats.activeAssignments > 0 ? Math.round((stats.completedJobs / (stats.completedJobs + stats.activeAssignments)) * 100) : 0}%`}}
                              ></div>
                            </div>
                          </div>
                          <div className="insight-item">
                            <div className="insight-label">Client Satisfaction</div>
                            <div className="insight-value">{Number(stats.averageRating).toFixed(1)}/5</div>
                            <div className="insight-bar">
                              <div 
                                className="insight-progress" 
                                style={{width: `${(stats.averageRating / 5) * 100}%`}}
                              ></div>
                            </div>
                          </div>
                          <div className="insight-item">
                            <div className="insight-label">AI Recognition</div>
                            <div className="insight-value">
                              {stats.aiShortlisted > 0 && stats.completedJobs + stats.activeAssignments > 0 ? 
                                Math.min(Math.round((stats.aiShortlisted / (stats.completedJobs + stats.activeAssignments)) * 100), 100) : 0}%
                            </div>
                            <div className="insight-bar">
                              <div 
                                className="insight-progress" 
                                style={{width: `${stats.aiShortlisted > 0 && stats.completedJobs + stats.activeAssignments > 0 ? 
                                  Math.min(Math.round((stats.aiShortlisted / (stats.completedJobs + stats.activeAssignments)) * 100), 100) : 0}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="dashboard-section-divider">
                  <div className="divider-decoration">🌱</div>
                </div>

                {/* Recent Activity & Notifications Section */}
                <div className="dashboard-section">
                  <div className="dashboard-section-title">
                    <span className="section-icon">🕒</span>
                    Recent Activity & Notifications
                    <div className="section-decoration">🌿</div>
                  </div>
                  <div className="dashboard-section-content">
                    <div className="activity-notifications-grid">
                      {/* Recent Activity Timeline */}
                      <div className="activity-timeline">
                        <div className="timeline-header">
                          <h3>📋 Activity Timeline</h3>
                          <div className="timeline-period">Last 7 days</div>
                        </div>
                        
                        {recentActivity.length === 0 ? (
                          <div className="empty-timeline">
                            <div className="empty-icon">🌱</div>
                            <div className="empty-title">No Recent Activity</div>
                            <div className="empty-description">Your activity will appear here as you work on projects</div>
                          </div>
                        ) : (
                          <div className="timeline-container">
                            {recentActivity.map((item, idx) => (
                              <div key={idx} className="timeline-item">
                                <div className="timeline-marker">
                                  <div className={`marker-icon ${item.type}`}>
                                    {item.type === 'assignment' && '🛠️'}
                                    {item.type === 'feedback' && '⭐'}
                                    {item.type === 'payment' && '💰'}
                                  </div>
                                  <div className="timeline-line"></div>
                                </div>
                                <div className="timeline-content">
                                  <div className="timeline-title">
                                    {item.type === 'assignment' && `Assigned to ${item.title}`}
                                    {item.type === 'feedback' && `Feedback received for ${item.title}`}
                                    {item.type === 'payment' && `Payment received for ${item.title}`}
                                  </div>
                                  <div className="timeline-details">
                                    {item.type === 'assignment' && (
                                      <span className="timeline-date">
                                        {item.date ? new Date(item.date).toLocaleDateString() : 'Recently'}
                                      </span>
                                    )}
                                    {item.type === 'feedback' && (
                                      <span className="timeline-rating">
                                        Rating: {item.rating}/5 stars
                                      </span>
                                    )}
                                    {item.type === 'payment' && (
                                      <span className="timeline-amount">
                                        ₹{item.amount?.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Smart Notifications */}
                      <div className="notifications-panel">
                        <div className="notifications-header">
                          <h3>🔔 Smart Notifications</h3>
                          <div className="notifications-count">
                            {notifications.filter(n => !n.isRead).length} new
                          </div>
                        </div>
                        
                        {notifications.length === 0 ? (
                          <div className="empty-notifications">
                            <div className="empty-icon">🔔</div>
                            <div className="empty-title">All Caught Up!</div>
                            <div className="empty-description">No new notifications at the moment</div>
                          </div>
                        ) : (
                          <div className="notifications-list">
                            {notifications.slice(0, 5).map((notification, idx) => (
                              <div 
                                key={idx} 
                                className={`notification-card ${notification.type} ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => markNotificationAsRead(notification._id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="notification-main">
                                  <div className="notification-icon">
                                    {notification.type === 'payment_received' && '💰'}
                                    {notification.type === 'job_selection' && '🛠️'}
                                    {notification.type === 'feedback_received' && '⭐'}
                                    {notification.type === 'weekly_progress' && '📊'}
                                    {notification.type === 'job_completion' && '✅'}
                                    {notification.type === 'application_status' && '📋'}
                                    {notification.type === 'extension_request' && '⏰'}
                                    {notification.type === 'extension_response' && '⏰'}
                                    {notification.type === 'feedback_request' && '📝'}
                                    {notification.type === 'feedback_deleted' && '🗑️'}
                                    {notification.type === 'general' && '🔔'}
                                    {!['payment_received', 'job_selection', 'feedback_received', 'weekly_progress', 'job_completion', 'application_status', 'extension_request', 'extension_response', 'feedback_request', 'feedback_deleted', 'general'].includes(notification.type) && '🔔'}
                                  </div>
                                  <div className="notification-content">
                                    <div className="notification-title">
                                      {notification.title}
                                    </div>
                                    <div className="notification-message">
                                      {notification.message}
                                    </div>
                                    <div className="notification-time">
                                      {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                  </div>
                                </div>
                                {notification.actionRequired && (
                                  <div className="notification-action">
                                    <span className="action-badge">Action Required</span>
                                  </div>
                                )}
                                {!notification.isRead && (
                                  <div className="notification-unread-indicator"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions Summary */}
                    <div className="quick-actions-summary">
                      <div className="summary-header">
                        <h4>⚡ Quick Actions</h4>
                        <div className="summary-subtitle">Common tasks and shortcuts</div>
                      </div>
                      <div className="action-buttons">
                        <button className="action-btn primary" onClick={() => navigate('/contractor/assignments')}>
                          <span className="btn-icon">📋</span>
                          <span className="btn-text">View Assignments</span>
                        </button>
                        <button className="action-btn secondary" onClick={() => navigate('/contractor/payments')}>
                          <span className="btn-icon">💳</span>
                          <span className="btn-text">Check Payments</span>
                        </button>
                        <button className="action-btn secondary" onClick={() => navigate('/contractor/feedback')}>
                          <span className="btn-icon">📝</span>
                          <span className="btn-text">View Feedback</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nature Inspiration Section */}
                <div className="dashboard-section">
                  <div className="dashboard-section-title">
                    <span className="section-icon">🌿</span>
                    Nature Inspiration
                    <div className="section-decoration">🌿</div>
                  </div>
                  <div className="dashboard-section-content">
                    <div className="inspiration-slideshow">
                      <div className="inspiration-card active">
                        <div className="inspiration-image">
                          <img 
                            src={inspirationImages[inspirationSlideIndex].src} 
                            alt={inspirationImages[inspirationSlideIndex].alt}
                            loading="lazy"
                          />
                        </div>
                        <h4>{inspirationImages[inspirationSlideIndex].title}</h4>
                        <p>{inspirationImages[inspirationSlideIndex].description}</p>
                      </div>
                      
                      <div className="slideshow-controls">
                        <button 
                          className="slideshow-btn prev"
                          onClick={() => setInspirationSlideIndex(prev => 
                            prev === 0 ? inspirationImages.length - 1 : prev - 1
                          )}
                        >
                          ‹
                        </button>
                        <div className="slideshow-indicators">
                          {inspirationImages.map((_, index) => (
                            <div 
                              key={index}
                              className={`indicator ${index === inspirationSlideIndex ? 'active' : ''}`}
                              onClick={() => setInspirationSlideIndex(index)}
                            />
                          ))}
                        </div>
                        <button 
                          className="slideshow-btn next"
                          onClick={() => setInspirationSlideIndex(prev => 
                            (prev + 1) % inspirationImages.length
                          )}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ContractorFooter />
    </>
  );
}

function StatCard({ label, value, icon, accent, iconBg }) {
  return (
    <div className="stats-card" style={{ '--accent': accent, '--icon-bg': iconBg }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function QuickAction({ label, onClick, icon }) {
  return (
    <button className="quick-action-btn" onClick={onClick}>
      <span>{icon}</span> {label}
    </button>
  );
} 