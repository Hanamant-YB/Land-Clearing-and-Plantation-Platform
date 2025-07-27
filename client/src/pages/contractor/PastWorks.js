// client/src/pages/contractor/PastWorks.js
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './PastWorks.css';
import Navbar from '../../components/Navbar';

export default function PastWorks() {
  const { token } = useContext(AuthContext);
  const [works, setWorks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    budget: '',
    date: '',
    rating: '',
    landownerFeedback: ''
  });
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Load existing past works
  useEffect(() => {
    loadPastWorks();
  }, []);

  const loadPastWorks = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/contractor/pastworks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorks(res.data);
    } catch (error) {
      console.error('Error loading past works:', error);
      alert('Failed to load past works');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert('You can only upload up to 3 photos');
      return;
    }
    setPhotos(files);
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    
    setUploadingPhotos(true);
    const uploadedUrls = [];
    
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('photo', photo);
        
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/photo/upload`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        uploadedUrls.push(res.data.photoUrl);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
    
    return uploadedUrls;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      description: '',
      budget: '',
      date: '',
      rating: '',
      landownerFeedback: ''
    });
    setPhotos([]);
    setExistingPhotos([]);
    setIsAdding(false);
    setEditingWork(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    try {
      // Upload new photos first
      const newPhotoUrls = await uploadPhotos();
      
      // Combine existing photos with new photos
      const allPhotos = [...existingPhotos, ...newPhotoUrls];
      
      const submitData = {
        ...formData,
        photos: allPhotos
      };

      if (editingWork) {
        // Update existing work
        await axios.put(
          `${process.env.REACT_APP_API_URL}/contractor/pastworks/${editingWork._id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Past work updated successfully!');
      } else {
        // Add new work
        await axios.post(
          `${process.env.REACT_APP_API_URL}/contractor/pastworks`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Past work added successfully!');
      }
      
      resetForm();
      loadPastWorks();
    } catch (error) {
      console.error('Error saving past work:', error);
      alert('Failed to save past work: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (work) => {
    setEditingWork(work);
    setFormData({
      title: work.title || '',
      type: work.type || '',
      description: work.description || '',
      budget: work.budget || '',
      date: work.date ? new Date(work.date).toISOString().split('T')[0] : '',
      rating: work.rating || '',
      landownerFeedback: work.landownerFeedback || ''
    });
    setPhotos([]);
    setExistingPhotos(work.photos || []);
    setIsAdding(true);
  };

  const handleDelete = async (workId) => {
    if (!window.confirm('Are you sure you want to delete this past work?')) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/contractor/pastworks/${workId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Past work deleted successfully!');
      loadPastWorks();
    } catch (error) {
      console.error('Error deleting past work:', error);
      alert('Failed to delete past work');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBudget = (budget) => {
    return budget ? `$${Number(budget).toLocaleString()}` : 'Not specified';
  };

  const formatBudgetBadge = (budget) => {
    return budget ? `$${Number(budget).toLocaleString()}` : 'N/A';
  };

  return (
    <>
      <Navbar />
      <div className="pastworks-page">
        <h2>Your Past Works</h2>

        {/* Add/Edit Form */}
        {isAdding && (
          <form className="past-work-form" onSubmit={handleSubmit}>
            <h3>{editingWork ? 'Edit Past Work' : 'Add New Past Work'}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Farm Plowing Project"
                  required
                />
              </div>
              <div className="form-group">
                <label>Work Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., Plowing, Harvesting"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the work you completed..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Budget</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="Amount in dollars"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  placeholder="1-5"
                  min="1"
                  max="5"
                />
              </div>
              <div className="form-group">
                <label>Landowner Feedback</label>
                <input
                  type="text"
                  name="landownerFeedback"
                  value={formData.landownerFeedback}
                  onChange={handleInputChange}
                  placeholder="Feedback from landowner after completion"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Work Photos (2-3 photos) *</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                required={!editingWork} // Required for new works, optional for editing
              />
              <small>Select 2-3 photos showing your completed work</small>
              
              {/* Show existing photos when editing */}
              {editingWork && existingPhotos.length > 0 && (
                <div className="existing-photos">
                  <p>Existing Photos:</p>
                  <div className="existing-photo-gallery">
                    {existingPhotos.map((photo, index) => (
                      <div key={index} className="existing-photo-item">
                        <img 
                          src={photo} 
                          alt={`Existing photo ${index + 1}`}
                          onClick={() => window.open(photo, '_blank')}
                        />
                        <button
                          type="button"
                          className="remove-photo-btn"
                          onClick={() => removeExistingPhoto(index)}
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {photos.length > 0 && (
                <div className="selected-photos">
                  <p>New Photos ({photos.length}):</p>
                  {photos.map((photo, index) => (
                    <span key={index} className="photo-name">{photo.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-save"
                disabled={uploadingPhotos}
              >
                {uploadingPhotos ? 'Uploading...' : (editingWork ? 'Update Work' : 'Add Work')}
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Add New Work Button */}
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="btn-add-work"
          >
            + Add New Past Work
          </button>
        )}

        {/* Past Works List */}
        {!isAdding && (
          <div className="past-works-list">
            <h3>Your Past Works ({works.length})</h3>
            
            {works.length === 0 ? (
              <p className="no-works">No past works yet. Add your first work to showcase your experience!</p>
            ) : (
              <div className="past-works-grid">
                {works.map(work => (
                  <div key={work._id} className="work-card">
                    <div className="work-header">
                      <h4>{work.title}</h4>
                      <div className="work-actions">
                        <button 
                          onClick={() => handleEdit(work)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(work._id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="work-content">
                      <div className="work-details">
                        {work.type && <p><strong>Type:</strong> {work.type}</p>}
                        <p><strong>Description:</strong> {work.description}</p>
                        <p><strong>Date:</strong> {formatDate(work.date)}</p>
                        
                        {/* Enhanced job details for automatically created entries */}
                        {work.landownerName && (
                          <p><strong>Landowner:</strong> {work.landownerName}</p>
                        )}
                        {work.location && (
                          <p><strong>Location:</strong> {work.location}</p>
                        )}
                        {work.landSize && (
                          <p><strong>Land Size:</strong> {work.landSize} acres</p>
                        )}
                        {work.startDate && (
                          <p><strong>Start Date:</strong> {formatDate(work.startDate)}</p>
                        )}
                        {work.endDate && (
                          <p><strong>End Date:</strong> {formatDate(work.endDate)}</p>
                        )}
                        {work.completionDate && (
                          <p><strong>Completed:</strong> {formatDate(work.completionDate)}</p>
                        )}
                        
                        {work.landownerFeedback && (
                          <p><strong>Feedback:</strong> "{work.landownerFeedback}"</p>
                        )}
                      </div>

                      {/* Work Photos */}
                      {work.photos && work.photos.length > 0 && (
                        <div className="work-photos">
                          <h5>Work Photos ({work.photos.length}):</h5>
                          <div className="photo-gallery">
                            {work.photos.map((photo, index) => (
                              <div key={index} className="photo-item">
                                <img 
                                  src={photo} 
                                  alt={`Work photo ${index + 1}`}
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="work-meta">
                        {work.rating && (
                          <div className="work-rating">
                            <span>⭐ {work.rating}/5</span>
                          </div>
                        )}
                        {work.budget && (
                          <div className="work-budget">
                            ₹{Number(work.budget).toLocaleString()}
                          </div>
                        )}
                        {/* Show if this is an automatically created entry */}
                        {work.jobId && (
                          <div className="work-source">
                            <span className="auto-created-badge">Auto-generated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}