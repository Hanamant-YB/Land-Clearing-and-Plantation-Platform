// client/src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Star, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Home,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  LogOut,
  Brain,
  Zap,
  Eye,
  Moon,
  Sun
} from 'lucide-react';
import AIShortlist from './AIShortlist';
import FeedbackManagement from './FeedbackManagement';
import EyeModalTest from './EyeModalTest';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [landowners, setLandowners] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [contractorReviews, setContractorReviews] = useState([]);
  const [works, setWorks] = useState([]);
  const [worksSubTab, setWorksSubTab] = useState('all');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    totalUsers: 0,
    totalPayments: 0,
    completedJobs: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    totalRevenue: 0,
    avgRating: 0
  });

  // AI Analytics states
  const [aiAnalytics, setAiAnalytics] = useState({
    successRate: { totalJobs: 0, aiSelected: 0, successRate: 0 },
    jobTypeStats: {},
    topContractors: [],
    usageStats: { totalJobs: 0, jobsWithAI: 0, aiUsageRate: 0, recentJobs: 0, recentJobsWithAI: 0, recentAIUsageRate: 0 }
  });

  // Loading states
  const [loading, setLoading] = useState(true);

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [selectedContractorReviews, setSelectedContractorReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Add state for job and rating modals
  const [showJobReviewsModal, setShowJobReviewsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobReviews, setSelectedJobReviews] = useState([]);
  const [loadingJobReviews, setLoadingJobReviews] = useState(false);
  const [showRatingReviewsModal, setShowRatingReviewsModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedRatingReviews, setSelectedRatingReviews] = useState([]);
  const [loadingRatingReviews, setLoadingRatingReviews] = useState(false);

  // Add state for selected review modal
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    // Try to load from localStorage
    return localStorage.getItem('adminDarkMode') === 'true';
  });

  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setLoading(true);
      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL + '/admin',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      try {
        // Add cache-busting timestamp to force fresh data
        const timestamp = Date.now();
        
        // Fetch all data initially
        const [jobsRes, paymentsRes, usersRes, analyticsRes] = await Promise.all([
          api.get(`/jobs?t=${timestamp}`),
          api.get(`/payments?t=${timestamp}`),
          api.get(`/users?t=${timestamp}`),
          api.get(`/analytics?t=${timestamp}`)
        ]);
        
        setJobs(jobsRes.data);
        setPayments(paymentsRes.data);
        setUsers(usersRes.data);
        setAnalytics(analyticsRes.data);
        
        // Set AI analytics from the main analytics response
        if (analyticsRes.data.aiAnalytics) {
          setAiAnalytics(analyticsRes.data.aiAnalytics);
        }
        
        // Fetch specific data based on active tab
        if (activeTab === 'landowners') {
          const landownersRes = await api.get('/landowners');
          setLandowners(landownersRes.data);
        }
        if (activeTab === 'contractors') {
          const contractorsRes = await api.get('/contractors');
          setContractors(contractorsRes.data);
        }
        if (activeTab === 'contractor-reviews') {
          const reviewsRes = await api.get('/contractor-reviews');
          setContractorReviews(reviewsRes.data);
        }
        if (activeTab === 'works') {
          const worksRes = await api.get('/works');
          setWorks(worksRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, activeTab]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('adminDarkMode', darkMode);
  }, [darkMode]);

  // Filter works by status
  const getFilteredWorks = () => {
    let filtered = works;
    
    switch (worksSubTab) {
      case 'completed':
        filtered = filtered.filter(work => work.status === 'completed');
        break;
      case 'incomplete':
        filtered = filtered.filter(work => work.status === 'in_progress');
        break;
      case 'pending':
        filtered = filtered.filter(work => work.status === 'open');
        break;
      default:
        break;
    }
    
    if (searchTerm) {
      filtered = filtered.filter(work => 
        work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.postedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.selectedContractor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Filter other data by search term
  const getFilteredData = (data, searchFields) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  };

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).filter(key => key !== '_id');
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = header.split('.').reduce((obj, key) => obj?.[key], row) || '';
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart data
  const jobStatusData = [
    { name: 'Completed', value: analytics.completedJobs, color: '#10b981' },
    { name: 'In Progress', value: analytics.inProgressJobs, color: '#3b82f6' },
    { name: 'Pending', value: analytics.pendingJobs, color: '#f59e0b' }
  ];

  // State for real monthly revenue data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);

  useEffect(() => {
    if (!token) return;
    const fetchMonthlyRevenue = async () => {
      try {
        const api = axios.create({
          baseURL: process.env.REACT_APP_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        const res = await api.get('/monthly-revenue-trend');
        setMonthlyRevenueData(res.data);
      } catch (err) {
        setMonthlyRevenueData([]);
      }
    };
    fetchMonthlyRevenue();
  }, [token]);

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'payments', label: 'Payments', icon: () => <span style={{fontSize: 20, fontWeight: 700, fontFamily: 'inherit'}}>₹</span> },
    { id: 'landowners', label: 'Landowners', icon: UserCheck },
    { id: 'contractors', label: 'Contractors', icon: Users },
    { id: 'contractor-reviews', label: 'Reviews', icon: Star },
    { id: 'works', label: 'Works', icon: TrendingUp },
    { id: 'ai-shortlist', label: 'AI Shortlist', icon: Brain }
  ];

  // 1) Delete a user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(u => u.filter(x => x._id !== id));
      setLandowners(l => l.filter(x => x._id !== id));
      setContractors(c => c.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // 2) Delete a job
  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/jobs/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(j => j.filter(x => x._id !== id));
      setWorks(w => w.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete job');
    }
  };

  // Add review for a completed job
  const handleAddReview = async (jobId, rating, review) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/jobs/${jobId}/review`,
        { rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the data
      if (activeTab === 'contractor-reviews') {
        const api = axios.create({
          baseURL: process.env.REACT_APP_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        api.get('/contractor-reviews').then(r => setContractorReviews(r.data)).catch(console.error);
      }
      if (activeTab === 'works') {
        const api = axios.create({
          baseURL: process.env.REACT_APP_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        api.get('/works').then(r => setWorks(r.data)).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add review');
    }
  };

  // Admin delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/feedback/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the reviews list
      if (activeTab === 'contractor-reviews') {
        const api = axios.create({
          baseURL: process.env.REACT_APP_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        api.get('/contractor-reviews').then(r => setContractorReviews(r.data)).catch(console.error);
      }
      alert('Review deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  // 3) Delete a payment
  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/payments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments(p => p.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  // Force refresh all data
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL + '/admin',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const timestamp = Date.now();
      const [jobsRes, paymentsRes, usersRes, analyticsRes] = await Promise.all([
        api.get(`/jobs?t=${timestamp}`),
        api.get(`/payments?t=${timestamp}`),
        api.get(`/users?t=${timestamp}`),
        api.get(`/analytics?t=${timestamp}`)
      ]);
      
      setJobs(jobsRes.data);
      setPayments(paymentsRes.data);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
      
      if (analyticsRes.data.aiAnalytics) {
        setAiAnalytics(analyticsRes.data.aiAnalytics);
      }
      
      // Refresh specific tab data if needed
      if (activeTab === 'landowners') {
        const landownersRes = await api.get(`/landowners?t=${timestamp}`);
        setLandowners(landownersRes.data);
      }
      if (activeTab === 'contractors') {
        const contractorsRes = await api.get(`/contractors?t=${timestamp}`);
        setContractors(contractorsRes.data);
      }
      if (activeTab === 'contractor-reviews') {
        const reviewsRes = await api.get(`/contractor-reviews?t=${timestamp}`);
        setContractorReviews(reviewsRes.data);
      }
      if (activeTab === 'works') {
        const worksRes = await api.get(`/works?t=${timestamp}`);
        setWorks(worksRes.data);
      }
      
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (columns, data, renderRow, exportFilename) => (
    <div className="table-section">
      <div className="table-header">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button 
          className="export-btn"
          onClick={() => exportToCSV(data, exportFilename)}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>{data.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="overview-section">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{analytics.totalUsers}</p>
            <p className="stat-change positive">+12% from last month</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon jobs">
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Jobs</h3>
            <p className="stat-number">{analytics.totalJobs}</p>
            <p className="stat-change positive">+8% from last month</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">₹{analytics.totalRevenue?.toLocaleString()}</p>
            <p className="stat-change positive">+15% from last month</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rating">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>Avg Rating</h3>
            <p className="stat-number">{analytics.avgRating?.toFixed(1)}/5</p>
            <p className="stat-change positive">+0.3 from last month</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {jobStatusData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => value} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {jobs.slice(0, 5).map(job => (
            <div key={job._id} className="activity-item">
              <div className="activity-icon">
                <Briefcase size={16} />
              </div>
              <div className="activity-content">
                <p><strong>{job.title}</strong> was posted by {job.postedBy?.name}</p>
                <span className="activity-time">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch reviews for a contractor
  const openContractorReviewsModal = async (contractor) => {
    setSelectedContractor(contractor);
    setShowReviewsModal(true);
    setLoadingReviews(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/all?contractorId=${contractor._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Fetched reviews for contractor', contractor._id, response.data);
      setSelectedContractorReviews(response.data.feedback || []);
    } catch (err) {
      console.error('Error fetching contractor reviews:', err);
      setSelectedContractorReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedContractor(null);
    setSelectedContractorReviews([]);
  };

  // Fetch reviews for a job
  const openJobReviewsModal = async (job) => {
    setSelectedJob(job);
    setShowJobReviewsModal(true);
    setLoadingJobReviews(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/all?jobId=${job._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedJobReviews(response.data.feedback || []);
    } catch (err) {
      setSelectedJobReviews([]);
    } finally {
      setLoadingJobReviews(false);
    }
  };

  const closeJobReviewsModal = () => {
    setShowJobReviewsModal(false);
    setSelectedJob(null);
    setSelectedJobReviews([]);
  };

  // Fetch reviews for a rating
  const openRatingReviewsModal = async (rating) => {
    setSelectedRating(rating);
    setShowRatingReviewsModal(true);
    setLoadingRatingReviews(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/all?rating=${rating}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedRatingReviews(response.data.feedback || []);
    } catch (err) {
      setSelectedRatingReviews([]);
    } finally {
      setLoadingRatingReviews(false);
    }
  };

  const closeRatingReviewsModal = () => {
    setShowRatingReviewsModal(false);
    setSelectedRating(null);
    setSelectedRatingReviews([]);
  };

  // Open review detail modal
  const openReviewDetailModal = (review) => {
    setSelectedReview(review);
    setShowReviewDetailModal(true);
  };
  const closeReviewDetailModal = () => {
    setShowReviewDetailModal(false);
    setSelectedReview(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem 0.5rem 1.5rem' }}>
          <h2>Admin Panel</h2>
          <button
            className="dark-mode-toggle"
            onClick={() => setDarkMode(dm => !dm)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 22, marginLeft: 8 }}
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="breadcrumb">
            <span>Admin Dashboard</span>
            {activeTab !== 'overview' && (
              <>
                <span className="separator">/</span>
                <span>{navItems.find(item => item.id === activeTab)?.label}</span>
              </>
            )}
          </div>
          <button 
            className="refresh-btn"
            onClick={handleRefreshData}
            disabled={loading}
            title="Refresh Data"
          >
            {loading ? '🔄' : '🔄'} Refresh
          </button>
        </header>

        <div className="content-body">
          {activeTab === 'overview' && renderOverview()}

          {activeTab === 'ai-shortlist' && <AIShortlist />}

          {activeTab === 'jobs' && renderTable(
            ['Title','Posted By','Location','Created At','Actions'],
            getFilteredData(jobs, ['title', 'postedBy.name', 'location']),
            job => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.postedBy?.name || '–'}</td>
                <td>{job.location || '–'}</td>
                <td>{new Date(job.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteJob(job._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ),
            'jobs'
          )}

          {activeTab === 'payments' && renderTable(
            ['Landowner','Contractor','Amount','Date','Actions'],
            getFilteredData(payments, ['landownerId.name', 'contractorId.name']),
            p => (
              <tr key={p._id}>
                <td>{p.landownerId?.name}</td>
                <td>{p.contractorId?.name}</td>
                <td>₹{p.amount}</td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeletePayment(p._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ),
            'payments'
          )}

          {activeTab === 'landowners' && renderTable(
            ['Name','Email','Phone','Actions'],
            getFilteredData(landowners, ['name', 'email', 'phone']),
            l => (
              <tr key={l._id}>
                <td>{l.name}</td>
                <td>{l.email}</td>
                <td>{l.phone || '–'}</td>
                <td>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(l._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ),
            'landowners'
          )}

          {activeTab === 'contractors' && renderTable(
            ['Name','Email','Phone','Rating','Actions'],
            getFilteredData(contractors, ['name', 'email', 'phone']),
            c => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone || '–'}</td>
                <td>
                  <div className="rating-display">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`star ${star <= (c.profile?.rating || 0) ? 'filled' : 'empty'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="rating-text">({c.profile?.rating || 0}/5)</span>
                  </div>
                </td>
                <td>
                  <button
                    className="action-btn"
                    title="View Reviews"
                    onClick={() => openContractorReviewsModal(c)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(c._id)}
                    title="Delete Contractor"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ),
            'contractors'
          )}

          {activeTab === 'contractor-reviews' && (
            <div className="table-section">
              <div className="table-header">
                <div className="search-container">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button 
                  className="export-btn"
                  onClick={() => exportToCSV(getFilteredData(contractorReviews, ['contractor.name', 'job.title']), 'contractor-reviews')}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contractor</th>
                      <th>Job Title</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData(contractorReviews, ['contractor.name', 'job.title']).length > 0 ? (
                      getFilteredData(contractorReviews, ['contractor.name', 'job.title']).map(review => (
                        <tr key={review._id}>
                          <td>
                            <button
                              className="link-btn"
                              onClick={() => openReviewDetailModal(review)}
                              title="View review details"
                            >
                              {review.contractor?.name}
                            </button>
                          </td>
                          <td>
                            <button
                              className="link-btn"
                              onClick={() => openReviewDetailModal(review)}
                              title="View review details"
                            >
                              {review.job?.title}
                            </button>
                          </td>
                          <td>
                            <button
                              className="link-btn"
                              onClick={() => openReviewDetailModal(review)}
                              title="View review details"
                            >
                              <div className="rating-display">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span 
                                    key={star} 
                                    className={`star ${star <= review.rating ? 'filled' : 'empty'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="rating-text">({review.rating}/5)</span>
                              </div>
                            </button>
                          </td>
                          <td>{review.comment || '–'}</td>
                          <td>{new Date(review.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="action-btn"
                              title="View review details"
                              onClick={() => openReviewDetailModal(review)}
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteReview(review._id)}
                              style={{ marginLeft: 8 }}
                              title="Delete Review"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            📝 No reviews found
                            <br />
                            <small>Reviews will appear here when landowners submit feedback for completed jobs</small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'works' && (
            <div className="works-section">
              <div className="works-tabs">
                {['all', 'completed', 'incomplete', 'pending'].map(subTab => (
                  <button
                    key={subTab}
                    className={`work-tab ${worksSubTab === subTab ? 'active' : ''}`}
                    onClick={() => setWorksSubTab(subTab)}
                  >
                    {subTab === 'all' && <Briefcase size={16} />}
                    {subTab === 'completed' && <CheckCircle size={16} />}
                    {subTab === 'incomplete' && <Clock size={16} />}
                    {subTab === 'pending' && <AlertCircle size={16} />}
                    {subTab.charAt(0).toUpperCase() + subTab.slice(1)} Works
                  </button>
                ))}
              </div>
              
              <div className="table-section">
                <div className="table-header">
                  <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Search works..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button 
                    className="export-btn"
                    onClick={() => exportToCSV(getFilteredWorks(), 'works')}
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Landowner</th>
                        <th>Contractor</th>
                        <th>Status</th>
                        <th>Budget</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredWorks().map(work => (
                        <tr key={work._id}>
                          <td>{work.title}</td>
                          <td>{work.postedBy?.name || '–'}</td>
                          <td>{work.selectedContractor?.name || '–'}</td>
                          <td>
                            {work.status.replace('_', ' ')}
                          </td>
                          <td>{typeof work.budget === 'number' && work.budget > 0 ? `₹${work.budget.toLocaleString()}` : '—'}</td>
                          <td>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteJob(work._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Management Section */}
          {activeTab === 'contractor-reviews' && <FeedbackManagement />}

          {/* Contractor Reviews Modal */}
          {showReviewsModal && (
            <div className="modal-overlay">
              <div className="modal-content contractor-reviews-modal">
                <div className="modal-header">
                  <h3>Reviews for {selectedContractor?.name}</h3>
                  <button className="close-btn" onClick={closeReviewsModal}>&times;</button>
                </div>
                <div className="modal-body">
                  {/* Debug output for troubleshooting */}
                  <div style={{ fontSize: '0.95rem', color: '#888', marginBottom: '1rem' }}>
                    <div><strong>Contractor ID:</strong> {selectedContractor?._id}</div>
                    <div><strong>Reviews found:</strong> {selectedContractorReviews.length}</div>
                    <div><strong>Reviews data:</strong> {JSON.stringify(selectedContractorReviews)}</div>
                  </div>
                  {loadingReviews ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading reviews...</div>
                  ) : selectedContractorReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>No reviews found for this contractor.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Job Title</th>
                          <th>Rating</th>
                          <th>Review</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContractorReviews.map(r => (
                          <tr key={r._id}>
                            <td>{r.jobTitle || r.job?.title || '–'}</td>
                            <td>
                              <div className="rating-display">
                                {[1,2,3,4,5].map(star => (
                                  <span key={star} className={`star ${star <= r.rating ? 'filled' : 'empty'}`}>★</span>
                                ))}
                                <span className="rating-text">({r.rating}/5)</span>
                              </div>
                            </td>
                            <td>{r.review || r.comment || '–'}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Reviews Modal */}
          {showJobReviewsModal && (
            <div className="modal-overlay">
              <div className="modal-content contractor-reviews-modal">
                <div className="modal-header">
                  <h3>Reviews for Job: {selectedJob?.title}</h3>
                  <button className="close-btn" onClick={closeJobReviewsModal}>&times;</button>
                </div>
                <div className="modal-body">
                  {loadingJobReviews ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading reviews...</div>
                  ) : selectedJobReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>No reviews found for this job.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Contractor</th>
                          <th>Rating</th>
                          <th>Review</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedJobReviews.map(r => (
                          <tr key={r._id}>
                            <td>{r.contractor?.name || '–'}</td>
                            <td>
                              <div className="rating-display">
                                {[1,2,3,4,5].map(star => (
                                  <span key={star} className={`star ${star <= r.rating ? 'filled' : 'empty'}`}>★</span>
                                ))}
                                <span className="rating-text">({r.rating}/5)</span>
                              </div>
                            </td>
                            <td>{r.review || r.comment || '–'}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rating Reviews Modal */}
          {showRatingReviewsModal && (
            <div className="modal-overlay">
              <div className="modal-content contractor-reviews-modal">
                <div className="modal-header">
                  <h3>Reviews with Rating: {selectedRating}/5</h3>
                  <button className="close-btn" onClick={closeRatingReviewsModal}>&times;</button>
                </div>
                <div className="modal-body">
                  {loadingRatingReviews ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading reviews...</div>
                  ) : selectedRatingReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>No reviews found with this rating.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Contractor</th>
                          <th>Job Title</th>
                          <th>Review</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRatingReviews.map(r => (
                          <tr key={r._id}>
                            <td>{r.contractor?.name || '–'}</td>
                            <td>{r.jobTitle || r.job?.title || '–'}</td>
                            <td>{r.review || r.comment || '–'}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Detail Modal */}
          {showReviewDetailModal && selectedReview && (
            <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(30, 41, 59, 0.7)' }}>
              <div
                className="modal-content contractor-reviews-modal"
                style={{
                  maxWidth: 600,
                  minWidth: 340,
                  margin: '60px auto',
                  borderRadius: 18,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  background: '#fff',
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Header */}
                <div style={{
                  background: '#f8fafc',
                  padding: '1.5rem 2rem 1rem 2rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.45rem', marginBottom: 2 }}>
                      {selectedReview.job?.title || selectedReview.jobTitle || 'Job'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 15 }}>
                      {selectedReview.jobDescription || ''}
                    </div>
                  </div>
                  <button className="close-btn" onClick={closeReviewDetailModal} style={{ fontSize: 28, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 16 }}>&times;</button>
                </div>
                {/* Main Content */}
                <div style={{ padding: '1.5rem 2rem 1.5rem 2rem', background: '#fff' }}>
                  {/* Top Row: Badges and Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div>
                      {selectedReview.jobType && <span className="badge" style={{ background: '#e0f2fe', color: '#2563eb', marginRight: 8, padding: '4px 12px', borderRadius: 12, fontSize: 13 }}>{selectedReview.jobType}</span>}
                      {selectedReview.jobBudget && <span className="badge" style={{ background: '#e0ffe0', color: '#15803d', marginRight: 8, padding: '4px 12px', borderRadius: 12, fontSize: 13 }}>₹{selectedReview.jobBudget?.toLocaleString()}</span>}
                      {selectedReview.jobLocation && <span className="badge" style={{ background: '#fff7e0', color: '#eab308', padding: '4px 12px', borderRadius: 12, fontSize: 13 }}>{selectedReview.jobLocation}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
                        {[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= selectedReview.rating ? 'filled' : 'empty'}`}>★</span>)}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedReview.rating}/5</div>
                      <div style={{ color: '#888', fontSize: 14 }}>Overall: {selectedReview.overallScore || selectedReview.rating}/5</div>
                    </div>
                  </div>
                  {/* Review Text */}
                  {(selectedReview.review || selectedReview.comment) && (
                    <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '14px 18px', marginBottom: 18, fontStyle: 'italic', color: '#334155', fontSize: 16, lineHeight: 1.6 }}>
                      "{selectedReview.review || selectedReview.comment}"
                    </div>
                  )}
                  {/* Ratings Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ color: '#334155', fontWeight: 500 }}>Quality: <span style={{ color: '#fbbf24' }}>{[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= selectedReview.qualityOfWork ? 'filled' : 'empty'}`}>★</span>)} </span></div>
                    <div style={{ color: '#334155', fontWeight: 500 }}>Communication: <span style={{ color: '#fbbf24' }}>{[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= selectedReview.communication ? 'filled' : 'empty'}`}>★</span>)} </span></div>
                    <div style={{ color: '#334155', fontWeight: 500 }}>Timeliness: <span style={{ color: '#fbbf24' }}>{[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= selectedReview.timeliness ? 'filled' : 'empty'}`}>★</span>)} </span></div>
                    <div style={{ color: '#334155', fontWeight: 500 }}>Professionalism: <span style={{ color: '#fbbf24' }}>{[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= selectedReview.professionalism ? 'filled' : 'empty'}`}>★</span>)} </span></div>
                  </div>
                  {/* Strengths & Areas for Improvement */}
                  {selectedReview.strengths && <div style={{ marginBottom: 8, color: '#0f172a' }}><strong>Strengths:</strong> {selectedReview.strengths}</div>}
                  {selectedReview.areasForImprovement && <div style={{ marginBottom: 8, color: '#0f172a' }}><strong>Areas for Improvement:</strong> {selectedReview.areasForImprovement}</div>}
                  {/* Recommendation Badge */}
                  <div style={{ marginBottom: 16 }}>
                    {selectedReview.wouldRecommend ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600, borderRadius: 10, padding: '4px 14px', fontSize: 15 }}>✓ Would Recommend</span>
                    ) : (
                      <span style={{ background: '#fee2e2', color: '#e11d48', fontWeight: 600, borderRadius: 10, padding: '4px 14px', fontSize: 15 }}>✗ Would Not Recommend</span>
                    )}
                  </div>
                  {/* Footer Info */}
                  <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '10px 16px', fontSize: 15, marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                    <span><strong>Contractor:</strong> {selectedReview.contractor?.name || '–'}</span>
                    <span><strong>Landowner:</strong> {selectedReview.landowner?.name || selectedReview.landownerId?.name || '–'}</span>
                    <span><strong>Payment:</strong> ₹{selectedReview.paymentId?.amount || selectedReview.paymentAmount || selectedReview.jobBudget || '–'}</span>
                    <span><strong>Submitted:</strong> {new Date(selectedReview.createdAt).toLocaleDateString()}</span>
                  </div>
                  {/* Delete Button */}
                  <button
                    className="action-btn delete"
                    style={{ width: '100%', marginTop: 0, fontSize: 16, padding: '12px 0', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none', boxShadow: '0 2px 8px rgba(239,68,68,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => handleDeleteReview(selectedReview._id)}
                  >
                    Delete Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}