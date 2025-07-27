import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandownerHome.css';
import { 
  FaClipboardList, 
  FaHammer, 
  FaMoneyCheckAlt, 
  FaCheckCircle, 
  FaUserTie, 
  FaChevronRight, 
  FaRegClock, 
  FaUserCircle,
  FaPlus,
  FaEye,
  FaStar,
  FaCalendarAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaBell,
  FaUsers,
  FaCalendarCheck
} from 'react-icons/fa';
// Import images for slider
import heroIllustration from '../../assets/hero-illustration.svg';
import profileIcon from '../../assets/profile-icon.png';
import defaultAvatar from '../../assets/default-avatar.jpg';

const sliderImages = [
  heroIllustration,
  profileIcon,
  defaultAvatar,
  // Add more image imports or URLs as needed
];

const LandownerHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState({
    totalJobs: 0,
    openJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    totalApplications: 0,
    totalSpent: 0,
    pendingPayments: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [actionRequired, setActionRequired] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs data
      const jobsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/landowner/jobs`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Fetch in-progress jobs
      const inProgressResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/landowner/in-progress-jobs`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Fetch action required jobs
      const actionRequiredResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/landowner/completed-action-required`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      // Fetch payment history
      const paymentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/payments/history`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const jobs = jobsResponse.data;
      const inProgressJobs = inProgressResponse.data;
      const actionRequiredJobs = actionRequiredResponse.data;
      const payments = paymentsResponse.data;

      // Calculate statistics
      const totalJobs = jobs.length;
      const openJobs = jobs.filter(job => job.status === 'open').length;
      const inProgressJobsCount = inProgressJobs.length;
      const completedJobs = jobs.filter(job => job.status === 'completed').length;
      const totalApplications = jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);
      
      // Calculate total spent from completed payments
      const totalSpent = payments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Calculate this month's spent from completed payments
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const thisMonthSpent = payments
        .filter(payment => 
          payment.status === 'completed' &&
          new Date(payment.createdAt).getMonth() === thisMonth &&
          new Date(payment.createdAt).getFullYear() === thisYear
        )
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Get recent applications (last 5 jobs with applications)
      const recentApps = jobs
        .filter(job => job.applicants && job.applicants.length > 0)
        .slice(0, 5)
        .map(job => ({
          jobTitle: job.title,
          contractorName: job.applicants[0]?.name || 'Unknown',
          appliedDate: new Date(job.createdAt).toLocaleDateString(),
          contractorRating: 4.5, // You can add actual rating logic
          jobId: job._id
        }));

      // Process action required jobs
      const actionRequiredData = actionRequiredJobs.map(job => ({
        jobTitle: job.title,
        contractorName: job.selectedContractor?.name || 'Unknown',
        action: !job.isPaid ? 'payment' : 'feedback',
        daysSinceCompletion: Math.floor((new Date() - new Date(job.updatedAt)) / (1000 * 60 * 60 * 24)),
        jobId: job._id
      }));

      // Get upcoming deadlines (jobs starting in next 7 days)
      const upcomingDeadlinesData = jobs
        .filter(job => {
          const startDate = new Date(job.startDate);
          const today = new Date();
          const diffDays = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        })
        .map(job => ({
          jobTitle: job.title,
          deadline: new Date(job.startDate).toLocaleDateString(),
          type: 'start',
          contractor: job.selectedContractor?.name || 'Not assigned',
          jobId: job._id
        }));

      // Generate real recent activity based on actual data
      const generateRecentActivity = () => {
        const activities = [];

        // Add job postings (recent jobs)
        jobs.slice(0, 3).forEach(job => {
          activities.push({
            type: 'Job',
            icon: <FaClipboardList />,
            desc: `Posted '${job.title}'`,
            time: getTimeAgo(new Date(job.createdAt)),
            status: job.status === 'open' ? 'active' : job.status === 'completed' ? 'completed' : 'pending',
            jobId: job._id
          });
        });

        // Add recent applications
        jobs
          .filter(job => job.applicants && job.applicants.length > 0)
          .slice(0, 2)
          .forEach(job => {
            activities.push({
              type: 'Application',
              icon: <FaUserTie />,
              desc: `${job.applicants.length} contractor${job.applicants.length > 1 ? 's' : ''} applied for '${job.title}'`,
              time: getTimeAgo(new Date(job.updatedAt)),
              status: 'pending',
              jobId: job._id
            });
          });

        // Add completed jobs
        jobs
          .filter(job => job.status === 'completed')
          .slice(0, 2)
          .forEach(job => {
            activities.push({
              type: 'Completion',
              icon: <FaCheckCircle />,
              desc: `'${job.title}' marked as completed`,
              time: getTimeAgo(new Date(job.updatedAt)),
              status: 'completed',
              jobId: job._id
            });
          });

        // Add in-progress jobs
        inProgressJobs.slice(0, 2).forEach(job => {
          activities.push({
            type: 'Progress',
            icon: <FaHammer />,
            desc: `'${job.title}' is in progress`,
            time: getTimeAgo(new Date(job.updatedAt)),
            status: 'active',
            jobId: job._id
          });
        });

        // Add action required items
        actionRequiredData.slice(0, 2).forEach(item => {
          activities.push({
            type: 'Action',
            icon: item.action === 'payment' ? <FaMoneyCheckAlt /> : <FaStar />,
            desc: `${item.action === 'payment' ? 'Payment pending' : 'Feedback needed'} for '${item.jobTitle}'`,
            time: `${item.daysSinceCompletion} days ago`,
            status: 'pending',
            jobId: item.jobId
          });
        });

        // Sort by time (most recent first) and take top 6
        return activities
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 6);
      };

      // Helper function to get time ago
      const getTimeAgo = (date) => {
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
      };

      setJobData({
        totalJobs,
        openJobs,
        inProgressJobs: inProgressJobsCount,
        completedJobs,
        totalApplications,
        totalSpent,
        thisMonthSpent,
        pendingPayments: actionRequiredData.filter(item => item.action === 'payment').length
      });

      setRecentApplications(recentApps);
      setActionRequired(actionRequiredData);
      setUpcomingDeadlines(upcomingDeadlinesData);
      setRecentActivity(generateRecentActivity());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    switch(action) {
      case 'post-job':
        navigate('/landowner/post');
        break;
      case 'payments':
        navigate('/landowner/payments');
        break;
      case 'progress':
        navigate('/landowner/progress');
        break;
      case 'shortlist':
        navigate('/landowner/shortlist');
        break;
      default:
        break;
    }
  };

  const enhancedStats = [
    { 
      icon: <FaClipboardList />, 
      label: 'Total Jobs', 
      value: jobData.totalJobs,
      change: '+12%',
      color: '#4CAF50',
      detail: `${jobData.openJobs} open, ${jobData.inProgressJobs} in progress`
    },
    { 
      icon: <FaMoneyCheckAlt />, 
      label: 'Pending Payments', 
      value: jobData.pendingPayments,
      change: '+8%',
      color: '#2196F3',
      detail: `${jobData.pendingPayments} jobs need payment`
    },
    { 
      icon: <FaMoneyCheckAlt />, 
      label: 'Total Spent', 
      value: `₹${(jobData.totalSpent / 1000).toFixed(1)}K`,
      change: '+15%',
      color: '#FF9800',
      detail: `This month: ₹${(jobData.thisMonthSpent / 1000).toFixed(1)}K`
    },
    { 
      icon: <FaCheckCircle />, 
      label: 'Completed', 
      value: jobData.completedJobs,
      change: '+20%',
      color: '#9C27B0',
      detail: `${jobData.pendingPayments} need payment`
    },
  ];

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="landowner-home-pro">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landowner-home-pro">
      {/* Header Section */}
      <header className="landowner-header-pro">
        <div className="header-content">
          <div className="header-greeting">
            <div className="greeting-avatar-container">
              <FaUserCircle className="greeting-avatar" />
              <div className="status-indicator"></div>
            </div>
            <div className="greeting-text-container">
              <h1 className="greeting-title">{getGreeting()}, Landowner!</h1>
              <p className="greeting-subtitle">Here's what's happening with your projects today</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="header-action-btn primary"
              onClick={() => navigate('/landowner/post')}
            >
              <FaPlus />
              Post New Job
            </button>
            <button 
              className="header-action-btn secondary"
              onClick={() => navigate('/landowner/progress')}
            >
              <FaEye />
              View Progress
            </button>
          </div>
        </div>
      </header>

      {/* About the Platform & Image Slider Section */}
      {/**
      <section className="about-platform-section">
        <div className="about-card">
          <div className="about-card-accent"></div>
          <div className="about-platform-content">
            <div className="about-description">
              <h2>About Contractor Platform</h2>
              <p>
                Contractor Platform is your trusted partner for managing agricultural and land development projects. Effortlessly post jobs, shortlist skilled contractors, track project progress, and handle payments—all in one place. Our platform leverages smart matching and real-time updates to ensure your projects are completed efficiently and to the highest standards.
              </p>
              <ul className="about-benefits">
                <li><span className="about-benefit-icon"><FaCheckCircle /></span> Post and manage jobs with ease</li>
                <li><span className="about-benefit-icon"><FaCheckCircle /></span> AI-powered contractor shortlisting</li>
                <li><span className="about-benefit-icon"><FaCheckCircle /></span> Transparent progress tracking</li>
                <li><span className="about-benefit-icon"><FaCheckCircle /></span> Secure and simple payments</li>
                <li><span className="about-benefit-icon"><FaCheckCircle /></span> Designed for landowners and agricultural projects</li>
              </ul>
            </div>
            <div className="about-divider"></div>
            <div className="about-slider">
              <div className="about-slider-inner">
                <button className="slider-btn prev" onClick={prevSlide} aria-label="Previous image">&#8592;</button>
                <img src={sliderImages[currentSlide]} alt="Platform showcase" className="slider-image slider-image-animated" />
                <button className="slider-btn next" onClick={nextSlide} aria-label="Next image">&#8594;</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Enhanced Stats Section */}
      <section className="landowner-stats-pro">
        <div className="stats-container">
          {enhancedStats.map((stat, idx) => (
            <div className="stat-card-pro" key={idx}>
              <div className="stat-header">
                <div className="stat-icon-container" style={{backgroundColor: stat.color + '20'}}>
                  <span className="stat-icon-pro" style={{color: stat.color}}>{stat.icon}</span>
                </div>
                <div className="stat-change" style={{color: stat.color}}>
                  {stat.change}
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value-pro">{stat.value}</div>
                <div className="stat-label-pro">{stat.label}</div>
                <div className="stat-detail-pro">{stat.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="landowner-content-grid">
        {/* Recent Activity */}
        <section className="landowner-activity-pro">
          <div className="section-header-pro">
            <div className="section-title">
              <FaRegClock className="section-icon" />
              <h2>Recent Activity</h2>
            </div>
            <button className="view-all-link-pro">
              View All <FaChevronRight />
            </button>
          </div>
          <div className="activity-container">
            {recentActivity.map((item, idx) => (
              <div key={idx} className={`activity-item-pro ${item.status}`}>
                <div className="activity-icon-container">
                  <span className="activity-icon-pro">{item.icon}</span>
                </div>
                <div className="activity-content">
                  <div className="activity-desc-pro">{item.desc}</div>
                  <div className="activity-time-pro">
                    <FaRegClock />
                    {item.time}
                  </div>
                </div>
                <div className="activity-status">
                  <span className={`status-badge ${item.status}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Required Section */}
        {actionRequired.length > 0 && (
          <section className="landowner-action-required-pro">
            <div className="section-header-pro">
              <div className="section-title">
                <FaExclamationTriangle className="section-icon" />
                <h2>Action Required</h2>
              </div>
              <button 
                className="view-all-link-pro"
                onClick={() => navigate('/landowner/payments')}
              >
                View All <FaChevronRight />
              </button>
            </div>
            <div className="action-required-container">
              {actionRequired.slice(0, 3).map((item, idx) => (
                <div key={idx} className="action-required-item-pro">
                  <div className="action-required-icon">
                    {item.action === 'payment' ? <FaMoneyCheckAlt /> : <FaStar />}
                  </div>
                  <div className="action-required-content">
                    <div className="action-required-title">{item.jobTitle}</div>
                    <div className="action-required-desc">
                      {item.action === 'payment' ? 'Payment pending' : 'Feedback needed'} for {item.contractorName}
                    </div>
                    <div className="action-required-time">
                      {item.daysSinceCompletion} days since completion
                    </div>
                  </div>
                  <button 
                    className="action-required-btn"
                    onClick={() => navigate(`/landowner/${item.action === 'payment' ? 'payments' : 'progress'}`)}
                  >
                    {item.action === 'payment' ? 'Pay Now' : 'Review'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <section className="landowner-applications-pro">
            <div className="section-header-pro">
              <div className="section-title">
                <FaUserTie className="section-icon" />
                <h2>Recent Applications</h2>
              </div>
              <button 
                className="view-all-link-pro"
                onClick={() => navigate('/landowner/shortlist')}
              >
                View All <FaChevronRight />
              </button>
            </div>
            <div className="applications-container">
              {recentApplications.slice(0, 3).map((app, idx) => (
                <div key={idx} className="application-item-pro">
                  <div className="application-avatar">
                    <FaUserTie />
                  </div>
                  <div className="application-content">
                    <div className="application-title">{app.jobTitle}</div>
                    <div className="application-contractor">{app.contractorName}</div>
                    <div className="application-meta">
                      <FaStar className="star-icon" />
                      {app.contractorRating} • Applied {app.appliedDate}
                    </div>
                  </div>
                  <button 
                    className="application-btn"
                    onClick={() => navigate('/landowner/shortlist')}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <section className="landowner-deadlines-pro">
            <div className="section-header-pro">
              <div className="section-title">
                <FaCalendarCheck className="section-icon" />
                <h2>Upcoming Deadlines</h2>
              </div>
              <button 
                className="view-all-link-pro"
                onClick={() => navigate('/landowner/progress')}
              >
                View All <FaChevronRight />
              </button>
            </div>
            <div className="deadlines-container">
              {upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
                <div key={idx} className="deadline-item-pro">
                  <div className="deadline-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="deadline-content">
                    <div className="deadline-title">{deadline.jobTitle}</div>
                    <div className="deadline-info">
                      {deadline.type === 'start' ? 'Starts' : 'Ends'} {deadline.deadline}
                    </div>
                    <div className="deadline-contractor">
                      Contractor: {deadline.contractor}
                    </div>
                  </div>
                  <button 
                    className="deadline-btn"
                    onClick={() => navigate('/landowner/progress')}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="landowner-actions-pro">
          <div className="section-header-pro">
            <div className="section-title">
              <FaChartLine className="section-icon" />
              <h2>Quick Actions</h2>
            </div>
          </div>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => handleActionClick('post-job')}
            >
              <FaClipboardList className="action-icon" />
              <span>Post New Job</span>
            </button>
            <button 
              className="action-card"
              onClick={() => handleActionClick('payments')}
            >
              <FaMoneyCheckAlt className="action-icon" />
              <span>Manage Payments</span>
            </button>
            <button 
              className="action-card"
              onClick={() => handleActionClick('progress')}
            >
              <FaHammer className="action-icon" />
              <span>Track Progress</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandownerHome;