import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './AdminProfile.css';

export default function AdminProfile() {
  const { user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || user.role !== 'admin') {
    return <p>Only admin can access this page.</p>;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message && message.toLowerCase().includes('success');

  return (
    <div className="admin-profile-outer">
      <div className="admin-profile-card">
        <h2>Admin Profile</h2>
        <form onSubmit={handleChangePassword} className="admin-change-password-form">
          <div>
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
        {message && (
          <div className={isSuccess ? 'success' : 'error'}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 