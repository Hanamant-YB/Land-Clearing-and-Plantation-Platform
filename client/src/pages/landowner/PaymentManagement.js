import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PaymentManagement.css';
import axios from 'axios';

const PaymentManagement = () => {
  const { user, token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
    fetchPaymentStats();
    // eslint-disable-next-line
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(
        'http://localhost:5000/api/payments/history',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPayments(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch payment history. Please try again.');
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payments/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPaymentStats(res.data);
    } catch (error) {
      setError('Failed to fetch payment stats.');
    }
  };

  const handleFilter = (status) => {
    setFilter(status);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const downloadReceipt = async (paymentId, receiptNumber) => {
    setDownloading(paymentId);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/payments/${paymentId}/receipt`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptNumber || paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download receipt.');
    }
    setDownloading(null);
  };

  // Filter and search logic
  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      filter === 'all' ? true : payment.status === filter;
    const matchesSearch =
      payment.jobId?.title?.toLowerCase().includes(search.toLowerCase()) ||
      payment.contractorId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Format amount
  const formatAmount = (amount) =>
    amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Format date
  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className="payment-management beautiful-bg">
      <div className="payment-management-header">
        <h1>Payment Management</h1>
        <p>View all your payments made to contractors</p>
      </div>

      {/* Payment Statistics */}
      <div className="payment-stats beautiful-cards">
        {paymentStats ? (
          <>
            <div className="stat-card">
              <div className="stat-main">
                <span className="stat-count">{paymentStats.totalPayments}</span>
                <span className="stat-currency">₹{formatAmount(paymentStats.totalAmount)}</span>
              </div>
              <div className="stat-label">Total Payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-main">
                <span className="stat-count">{paymentStats.pendingPayments}</span>
                <span className="stat-currency">₹{formatAmount(paymentStats.pendingAmount)}</span>
              </div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-main">
                <span className="stat-count">{paymentStats.completedPayments}</span>
                <span className="stat-currency">₹{formatAmount(paymentStats.completedAmount)}</span>
              </div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-main">
                <span className="stat-currency">₹{formatAmount(paymentStats.thisMonth)}</span>
              </div>
              <div className="stat-label">This Month</div>
            </div>
          </>
        ) : (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading stats...</span>
          </div>
        )}
      </div>

      {/* Filter/Search Bar */}
      <div className="filter-search-bar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => handleFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilter('pending')}
          >
            Pending
          </button>
        </div>
        <input
          type="text"
          className="search-bar"
          placeholder="Search by job title or contractor name..."
          value={search}
          onChange={handleSearch}
        />
        <button onClick={fetchPaymentHistory} className="btn-secondary refresh-btn">
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading Spinner */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <div className="payment-history-container beautiful-card">
          <h2>Payment History</h2>
          <table className="payment-history-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Contractor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-results">No results found.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="payment-row">
                    <td>{payment.jobId?.title}</td>
                    <td>{payment.contractorId?.name}</td>
                    <td>
                      {formatAmount(payment.amount)} {payment.currency}
                    </td>
                    <td>
                      {/* Removed status badge */}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </td>
                    <td>{payment.paymentMethod}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      {payment.status === 'completed' && payment.receiptNumber ? (
                        <button
                          className="btn-download-receipt"
                          onClick={() => downloadReceipt(payment._id, payment.receiptNumber)}
                          disabled={downloading === payment._id}
                        >
                          {downloading === payment._id ? 'Downloading...' : 'Download'}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement; 