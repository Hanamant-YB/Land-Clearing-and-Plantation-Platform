// client/src/pages/contractor/ContractorProfile.js
import React, { useContext, useState } from 'react';
import axios from 'axios';
import PhotoUpload from '../../components/PhotoUpload';
import { AuthContext } from '../../context/AuthContext';
import './ContractorProfile.css';
import Navbar from '../../components/Navbar';
import ChangePassword from '../../components/ChangePassword';

export default function ContractorProfile() {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  if (!user) return <p>Please log in to view your profile.</p>;

  // Helper to ensure ratesPerAcre is always a plain object
  const toPlainObject = (mapOrObj) => {
    if (!mapOrObj) return {};
    if (mapOrObj.type === 'Map' && Array.isArray(mapOrObj.value)) {
      return Object.fromEntries(mapOrObj.value);
    }
    if (typeof mapOrObj.entries === 'function') {
      return Object.fromEntries(mapOrObj.entries());
    }
    if (typeof mapOrObj === 'object' && !Array.isArray(mapOrObj)) {
      return { ...mapOrObj };
    }
    return {};
  };

  // Build full URL for locally-hosted uploads
  const getPhotoUrl = path =>
    path?.startsWith('/uploads')
      ? `http://localhost:5000${path}`
      : path;

  const handleUploaded = updatedUser => setUser(updatedUser);

  // Pull out any extra fields
  const { phone = '—', address = '—', profile = {} } = user;

  // Handle bio - use default if empty or undefined
  const defaultBio = `Hi, I'm ${user?.name || 'a contractor'} with over ${profile.completedJobs || 0} completed jobs and ${profile.pendingJobs || 0} pending tasks. I specialize in delivering high-quality work and ensuring customer satisfaction. With years of experience in the industry, I'm committed to completing projects on time and within budget. Feel free to reach out for any construction or renovation needs!`;
  const isDefaultBio = !profile.bio || profile.bio.trim() === '' || (profile.bio.includes('Hi, I\'m') && profile.bio.includes('with over') && profile.bio.includes('completed jobs'));
  const bio = profile.bio && profile.bio.trim() !== '' ? profile.bio : defaultBio;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: isDefaultBio ? '' : (user?.profile?.bio || ''),
    skills: user?.profile?.skills || [],
    availability: user?.profile?.availability || 'Available',
    location: user?.profile?.location || '',
    ratesPerAcre: toPlainObject(user?.profile?.ratesPerAcre)
  });
  const [updating, setUpdating] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [activeTab, setActiveTab] = useState('userInfo');

  const handleEdit = () => {
    setFormData({
      name: user.name || '',
      username: user.username || '',
      phone: user.phone || '',
      address: user.address || '',
      bio: isDefaultBio ? '' : (user.profile?.bio || ''),
      skills: user.profile?.skills || [],
      availability: user.profile?.availability || 'Available',
      location: user.profile?.location || '',
      ratesPerAcre: toPlainObject(user.profile?.ratesPerAcre)
    });
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    setUpdating(true);
    try {
      // Remove blank rates before sending
      const cleanedRates = {};
      Object.entries(formData.ratesPerAcre).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanedRates[key] = value;
        }
      });
      const dataToSend = { ...formData, ratesPerAcre: cleanedRates };
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/profile`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUser(response.data.user);
      setFormData({
        name: response.data.user.name || '',
        username: response.data.user.username || '',
        phone: response.data.user.phone || '',
        address: response.data.user.address || '',
        bio: response.data.user.profile?.bio || '',
        skills: response.data.user.profile?.skills || [],
        availability: response.data.user.profile?.availability || 'Available',
        location: response.data.user.profile?.location || '',
        ratesPerAcre: toPlainObject(response.data.user.profile?.ratesPerAcre)
      });
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };
  // --- Rates Per Acre Management ---
  const WORK_TYPES = [
    'Plowing',
    'Harvesting',
    'Irrigation',
    'Weeding',
    'Planting',
    'Fertilizing',
    'Pest Control',
    'Landscaping'
  ];
  const handleRateChange = (workType, value) => {
    setFormData(prev => ({
      ...prev,
      ratesPerAcre: {
        ...prev.ratesPerAcre,
        [workType]: value === '' ? '' : Number(value)
      }
    }));
  };
  // Fallback in render logic to ensure ratesPerAcre is always defined
  if (!formData.ratesPerAcre) formData.ratesPerAcre = {};

  return (
    <>
      <Navbar />
      <div className="contractor-profile-compact">
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
              <span 
                className={activeTab === 'userInfo' ? 'active' : ''}
                onClick={() => setActiveTab('userInfo')}
              >
                User Info
              </span>
              <span 
                className={activeTab === 'professional' ? 'active' : ''}
                onClick={() => setActiveTab('professional')}
              >
                Professional Details
              </span>
            </div>
            <div className="profile-details-content">
              {isEditing ? (
                <form className="edit-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                  {activeTab === 'userInfo' ? (
                    <>
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
                          <label>Username</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={user.email}
                            readOnly
                            disabled
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
                        <div className="form-group">
                          <label>Location</label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Enter your city or location"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>About Me</label>
                          <input
                            type="text"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Short bio or specialization"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Professional Details Tab */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Skills / Work Types</label>
                          <div className="skills-input">
                            <input
                              type="text"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Add a skill (e.g., Plowing, Harvesting)"
                            />
                            <button 
                              type="button" 
                              onClick={handleAddSkill}
                              className="add-skill-btn"
                            >
                              Add
                            </button>
                          </div>
                          <div className="skills-list">
                            {formData.skills.map((skill, index) => (
                              <span key={index} className="skill-tag">
                                {skill}
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="remove-skill"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* --- Rates Per Acre Section --- */}
                      <div className="form-row">
                        <div className="form-group">
                          <div className="rates-section-card">
                            <h3>Rates Per Acre (by Work Type)</h3>
                            <p className="rates-note">Set your rate per acre for each work type. Leave blank if you do not offer this service.</p>
                            <div className="rates-table">
                              {WORK_TYPES.map(workType => (
                                <div key={workType} className="rate-row">
                                  <span className="work-type-label">{workType}</span>
                                  <span className="currency-symbol">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={formData.ratesPerAcre[workType] || ''}
                                    onChange={e => handleRateChange(workType, e.target.value)}
                                    className="rate-input"
                                    placeholder="Enter rate"
                                  />
                                  <span className="per-acre-label">per acre</span>
                                  {formData.ratesPerAcre[workType] && (
                                    <button
                                      type="button"
                                      className="remove-rate"
                                      onClick={() => handleRateChange(workType, '')}
                                      title="Clear rate"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#e11d48',
                                        fontSize: '1.2em',
                                        marginLeft: '8px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* --- End Rates Per Acre Section --- */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Availability</label>
                          <select
                            name="availability"
                            value={formData.availability}
                            onChange={handleInputChange}
                          >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Part-time">Part-time</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
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
                  {activeTab === 'userInfo' ? (
                    <>
                      <div className="info-row"><span>Name:</span> {user.name}</div>
                      <div className="info-row"><span>Email:</span> {user.email}</div>
                      <div className="info-row"><span>Phone:</span> {phone}</div>
                      <div className="info-row"><span>Address:</span> {address}</div>
                      <div className="info-row">
                        <span>Location:</span>
                        {typeof profile.location === 'string'
                          ? profile.location
                          : profile.location && profile.location.coordinates
                            ? `Lat: ${profile.location.coordinates[1]}, Lng: ${profile.location.coordinates[0]}`
                            : 'Not specified'}
                      </div>
                      <div className="info-row"><span>About Me:</span> {bio}</div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span>Skills:</span> 
                        {profile.skills && profile.skills.length > 0 ? (
                          <div className="skills-display">
                            {profile.skills.map((skill, index) => (
                              <span key={index} className="skill-tag-display">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-data">No skills added yet</span>
                        )}
                      </div>
                      <div className="info-row">
                        <span>Availability:</span> {profile.availability || 'Available'}
                      </div>
                    </>
                  )}
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
    </>
  );
}