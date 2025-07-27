import React, { useContext, useState } from 'react';
import axios from 'axios';
import PhotoUpload from '../../components/PhotoUpload';
import { AuthContext } from '../../context/AuthContext';
import './LandownerProfile.css';
import ChangePassword from '../../components/ChangePassword';

export default function LandownerProfile() {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [updating, setUpdating] = useState(false);
  // Removed all password change related state

  if (!user) return <p>Please log in to view your profile.</p>;

  // Build full URL for locally‐hosted uploads
  const getPhotoUrl = path =>
    path?.startsWith('/uploads')
      ? `http://localhost:5000${path}`
      : path;

  const handleUploaded = updatedUser => setUser(updatedUser);

  // Pull out any extra fields
  const { phone = '—', address = '—' } = user;

  const handleEdit = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setUser(response.data.user);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Removed all password change related handlers

  console.log("Navbar user:", user);
  console.log("Profile user:", user);

  return (
    <div className="landowner-profile-compact">
      <div className="profile-columns">
        {/* Left: Profile Card */}
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="profile-photo-wrapper">
              {user.profile?.photo ? (
                <img
                  src={getPhotoUrl(user?.profile?.photo)}
                  alt={`${user?.name || 'User'}'s avatar`}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar placeholder" />
              )}
            </div>
            <PhotoUpload onUploaded={handleUploaded} />
            <button className="upload-info" disabled>
              Upload a new avatar. Max size 1MB.
            </button>
          </div>
          <div className="profile-basic-info">
            <h3 className="profile-name">{user.name}</h3>
            <div className="profile-username">@{user.username || user.email?.split('@')[0]}</div>
            <div className="profile-member-since">
              Member Since: <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* Right: Edit Form or Details */}
        <div className="profile-details-card">
          <h2 className="profile-title">Edit Profile</h2>
          <div className="profile-tabs">
            <span className="active">User Info</span>
          </div>
          <div className="profile-details-content">
            {isEditing ? (
              <form className="edit-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="save-btn"
                    type="submit"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Update info'}
                  </button>
                  <button 
                    className="cancel-btn"
                    type="button"
                    onClick={handleCancel}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-compact">
                <div className="info-row"><span>Name:</span> {user.name}</div>
                <div className="info-row"><span>Email:</span> {user.email}</div>
                <div className="info-row"><span>Phone:</span> {phone}</div>
                <div className="info-row"><span>Address:</span> {address}</div>
                <button 
                  className="edit-profile-btn"
                  onClick={handleEdit}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          {/* Change Password Section - replaced with ChangePassword component only */}
          <div className="change-password-section" style={{ marginTop: '32px' }}>
            <ChangePassword defaultEmail={user.email} />
          </div>
        </div>
      </div>
    </div>
  );
} 