import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PaymentForm.css';

export default function PaymentForm({ job, isOpen, onClose, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'online',
    paymentType: 'full_payment',
    notes: '',
    transactionId: '',
    transactionReference: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find the assigned contractor's estimated cost
  let estimatedCost = null;
  if (job && job.aiShortlistScores && job.selectedContractor) {
    const assignedScore = job.aiShortlistScores.find(
      score =>
        score.contractorId &&
        (score.contractorId._id === job.selectedContractor._id ||
         score.contractorId === job.selectedContractor._id ||
         score.contractorId === job.selectedContractor)
    );
    if (assignedScore && assignedScore.estimatedCost) {
      estimatedCost = assignedScore.estimatedCost;
    }
  }

  useEffect(() => {
    if (isOpen && job) {
      // Auto-fill amount with estimated cost
      setFormData({
        amount: estimatedCost ? estimatedCost.toString() : '',
        paymentMethod: 'online',
        paymentType: 'full_payment',
        notes: `Payment for completed job: ${job.title}`,
        transactionId: '',
        transactionReference: ''
      });
      setError('');
    }
  }, [isOpen, job, estimatedCost]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.paymentMethod) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/payments/create`,
        {
          jobId: job._id,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentType: formData.paymentType,
          notes: formData.notes,
          transactionId: formData.transactionId,
          transactionReference: formData.transactionReference
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        }
      );

      if (response.status === 201) {
        const paymentId = response.data._id;
        
        // Automatically approve and release the payment
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/payments/${paymentId}/approve`,
          {
            approvalNotes: 'Payment approved by landowner'
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}` 
            }
          }
        );

        await axios.patch(
          `${process.env.REACT_APP_API_URL}/payments/${paymentId}/release`,
          {
            transactionId: formData.transactionId,
            transactionReference: formData.transactionReference,
            releaseNotes: 'Payment released by landowner'
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}` 
            }
          }
        );

        // Update job with payment ID for feedback linking
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/landowner/jobs/${job._id}/payment`,
          {
            paymentId: paymentId
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}` 
            }
          }
        );

        onSubmitSuccess(paymentId);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create order on backend
      const { data: order } = await axios.post(
        `${process.env.REACT_APP_API_URL}/payments/razorpay/order`,
        { amount: Math.round(Number(estimatedCost)), jobId: job._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // from .env
        amount: order.amount,
        currency: order.currency,
        name: 'Contractor Platform',
        description: `Payment for job: ${job.title}`,
        order_id: order.id,
        handler: async function (response) {
          // 3. On success, verify payment on backend
          try {
            await axios.post(
              `${process.env.REACT_APP_API_URL}/payments/razorpay/verify`,
              {
                jobId: job._id,
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: Math.round(Number(estimatedCost)) // Always send as integer
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            onSubmitSuccess();
            onClose();
          } catch (err) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: '', // Optionally fill with user info
          email: '',
          contact: '',
        },
        theme: { color: '#3399cc' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="payment-form-overlay">
      <div className="payment-form-modal razorpay-modal">
        <div className="razorpay-header">
          <img src="https://cdn.razorpay.com/logo.svg" alt="Razorpay Logo" className="razorpay-logo" />
          <h2>Pay Contractor</h2>
        </div>
        <div className="razorpay-amount-section">
          <span className="razorpay-amount-label">Amount to Pay</span>
          <span className="razorpay-amount">₹{estimatedCost ? estimatedCost.toLocaleString() : 'Not specified'}</span>
        </div>
        <p className="razorpay-desc">Secure payment powered by Razorpay</p>
        {error && <div className="error-message">{error}</div>}
        <button className="razorpay-pay-btn" onClick={handleRazorpayPayment} disabled={loading}>
          {loading ? 'Processing...' : 'Pay with Razorpay'}
        </button>
        <button className="razorpay-cancel-btn" onClick={onClose}>Cancel</button>
        <div className="razorpay-badge">
          <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" style={{ height: 20, marginRight: 6 }} />
          <span>Powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
}