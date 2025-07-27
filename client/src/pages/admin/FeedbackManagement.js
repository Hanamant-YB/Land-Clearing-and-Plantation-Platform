import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './FeedbackManagement.css';

export default function FeedbackManagement() {
  const { token } = useContext(AuthContext);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    contractorId: '',
    landownerId: '',
    rating: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, [filters]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/all?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback(response.data.feedback);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    }
  };

  const handleDeleteFeedback = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/feedback/${selectedFeedback._id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: 'Admin deletion' }
        }
      );
      setShowDeleteModal(false);
      setSelectedFeedback(null);
      loadFeedback();
      loadStats();
      alert('Feedback deleted successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        // Feedback already deleted, just refresh the list
        setShowDeleteModal(false);
        setSelectedFeedback(null);
        loadFeedback();
        loadStats();
      } else {
        alert('Failed to delete feedback');
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="feedback-management">
        <div className="loading">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
