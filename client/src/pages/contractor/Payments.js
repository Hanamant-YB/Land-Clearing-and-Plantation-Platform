import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './Payments.css';
import Navbar from '../../components/Navbar';

export default function Payments() {
  const { token } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [token]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/payments/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments(res.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/payments/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/payments/${paymentId}/receipt`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'completed': 'status-completed',
      'refunded': 'status-refunded'
    };
    return `status-badge ${statusClasses[status] || 'status-pending'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  if (loading) {
    return (
      <div className="payments-page">
        <div className="loading">Loading payments...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="payments-page">
        <div className="payments-header">
          <h2>Payment Center</h2>
          <p>Track all your payments and download receipts</p>
        </div>

        {/* Payment Statistics */}
        <div className="payment-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Total Earnings</h3>
              <p className="stat-amount">₹{stats.completedAmount?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed Payments</h3>
              <p className="stat-number">{stats.completedPayments || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Payments</h3>
              <p className="stat-number">{stats.pendingPayments || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>This Month</h3>
              <p className="stat-amount">₹{stats.thisMonth?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({payments.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({payments.filter(p => p.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved ({payments.filter(p => p.status === 'approved').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({payments.filter(p => p.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="payments-list">
          {filteredPayments.length === 0 ? (
            <div className="no-payments">
              <div className="no-payments-icon">💳</div>
              <h3>No payments found</h3>
              <p>Payments will appear here once landowners create them for your completed work.</p>
            </div>
          ) : (
            filteredPayments.map(payment => (
              <div key={payment._id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-type">
                    <span className="payment-icon">💰</span>
                    <div className="payment-info">
                      <h4>{payment.jobId?.title || 'Job Payment'}</h4>
                      <p className="payment-type-text">
                        {payment.paymentType === 'milestone_payment' && payment.milestoneTitle 
                          ? `Milestone: ${payment.milestoneTitle}`
                          : payment.paymentType === 'full_payment' 
                          ? 'Full Payment'
                          : 'Payment'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="payment-amount">
                    <span className="amount">₹{payment.amount?.toLocaleString()}</span>
                    <span>
                      {/* Removed status badge */}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="payment-details">
                  <div className="detail-row">
                    <span className="detail-label">Landowner:</span>
                    <span className="detail-value">{payment.landownerId?.name || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(payment.createdAt)}</span>
                  </div>
                  {payment.approvedAt && (
                    <div className="detail-row">
                      <span className="detail-label">Approved:</span>
                      <span className="detail-value">{formatDate(payment.approvedAt)}</span>
                    </div>
                  )}
                  {payment.releasedAt && (
                    <div className="detail-row">
                      <span className="detail-label">Released:</span>
                      <span className="detail-value">{formatDate(payment.releasedAt)}</span>
                    </div>
                  )}
                  {payment.receiptNumber && (
                    <div className="detail-row">
                      <span className="detail-label">Receipt:</span>
                      <span className="detail-value receipt-number">{payment.receiptNumber}</span>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <button 
                    className="btn-view-details"
                    onClick={() => viewPaymentDetails(payment)}
                  >
                    View Details
                  </button>
                  {payment.status === 'completed' && payment.receiptNumber && (
                    <button 
                      className="btn-download-receipt"
                      onClick={() => downloadReceipt(payment._id)}
                    >
                      📄 Download Receipt
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Details Modal */}
        {showModal && selectedPayment && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Payment Details</h3>
                <button className="close-btn" onClick={closeModal}>×</button>
              </div>
              
              <div className="modal-content">
                <div className="modal-section">
                  <h4>Job Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Job Title:</label>
                      <span>{selectedPayment.jobId?.title || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Job Type:</label>
                      <span>{selectedPayment.jobId?.workType || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Location:</label>
                      <span>{selectedPayment.jobId?.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h4>Payment Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Amount:</label>
                      <span className="amount-highlight">₹{selectedPayment.amount?.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Type:</label>
                      <span>{selectedPayment.paymentType?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={getStatusBadge(selectedPayment.status)}>
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </span>
                    </div>
                    {selectedPayment.receiptNumber && (
                      <div className="detail-item">
                        <label>Receipt Number:</label>
                        <span className="receipt-number">{selectedPayment.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-section">
                  <h4>Timeline</h4>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot completed"></div>
                      <div className="timeline-content">
                        <h5>Payment Created</h5>
                        <p>{formatDate(selectedPayment.createdAt)}</p>
                      </div>
                    </div>
                    {selectedPayment.approvedAt && (
                      <div className="timeline-item">
                        <div className="timeline-dot completed"></div>
                        <div className="timeline-content">
                          <h5>Payment Approved</h5>
                          <p>{formatDate(selectedPayment.approvedAt)}</p>
                          {selectedPayment.approvalNotes && (
                            <p className="notes">Notes: {selectedPayment.approvalNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedPayment.releasedAt && (
                      <div className="timeline-item">
                        <div className="timeline-dot completed"></div>
                        <div className="timeline-content">
                          <h5>Payment Released</h5>
                          <p>{formatDate(selectedPayment.releasedAt)}</p>
                          {selectedPayment.releaseNotes && (
                            <p className="notes">Notes: {selectedPayment.releaseNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="modal-section">
                    <h4>Notes</h4>
                    <p className="payment-notes">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedPayment.status === 'completed' && selectedPayment.receiptNumber && (
                  <button 
                    className="btn-download-receipt"
                    onClick={() => downloadReceipt(selectedPayment._id)}
                  >
                    📄 Download Receipt
                  </button>
                )}
                <button className="btn-close" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
