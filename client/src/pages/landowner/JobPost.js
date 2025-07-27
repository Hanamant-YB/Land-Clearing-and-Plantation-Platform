import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './JobPost.css';

export default function JobPost() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    landSize: '',
    location: '',
    workType: '',
    startDate: '',
    endDate: ''
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle image selection
  const handleFiles = e => {
    setImages(Array.from(e.target.files));
  };

  const handleDateChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      // Validate dates
      if (updated.startDate && updated.endDate) {
        if (updated.endDate <= updated.startDate) {
          setDateError('End date must be after start date');
        } else {
          setDateError('');
        }
      } else {
        setDateError('');
      }
      return updated;
    });
  };

  // Submit as multipart/form-data
  const handleSubmit = async e => {
    e.preventDefault();
    if (dateError) return;
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      images.forEach(file => data.append('images', file));

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/landowner/post`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Redirect to shortlist page for the new job
      if (response.data && response.data.job && response.data.job._id) {
        navigate(`/landowner/shortlist?jobId=${response.data.job._id}`);
      } else {
        alert('Job posted, but could not redirect to shortlist.');
      }
      setForm({
        title: '',
        description: '',
        landSize: '',
        location: '',
        workType: '',
        startDate: '',
        endDate: ''
      });
      setImages([]);
    } catch (err) {
      console.error(err);
      alert('Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="jobpost-container">
      <form className="jobpost-form" onSubmit={handleSubmit}>
        <h2>Post a New Job</h2>
        <p className="subtitle">Fill in the details below to create your job posting</p>

        <div className="form-grid">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Farm Plowing Needed"
              required
            />
          </div>

          {/* Work Type */}
          <div className="form-group">
            <label htmlFor="workType">Work Type</label>
            <select
              id="workType"
              name="workType"
              value={form.workType}
              onChange={handleChange}
              required
            >
              <option value="">Select work type...</option>
              <option value="Plowing">Plowing</option>
              <option value="Harvesting">Harvesting</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Weeding">Weeding</option>
              <option value="Planting">Planting</option>
              <option value="Fertilizing">Fertilizing</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Landscaping">Landscaping</option>
            </select>
          </div>

          {/* Land Size */}
          <div className="form-group">
            <label htmlFor="landSize">Land Size (acres)</label>
            <input
              type="number"
              id="landSize"
              name="landSize"
              value={form.landSize}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g., 10.5"
              required
            />
          </div>

          {/* Budget */}
          {/* <div className="form-group">
            <label htmlFor="budget">Budget (₹)</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 50000"
              required
            />
          </div> */}

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Punjab, India"
              required
            />
          </div>

          {/* Date Group */}
          <div className="form-group">
            <label>Project Timeline</label>
            <div className="date-group">
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleDateChange}
                placeholder="Start Date"
                required
              />
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleDateChange}
                placeholder="End Date"
                required
              />
            </div>
            {dateError && <div style={{ color: 'red', marginTop: 4 }}>{dateError}</div>}
          </div>
        </div>

        {/* Description - Full Width */}
        <div className="form-group full-width">
          <label htmlFor="description">Job Description</label>
          <textarea
            id="description"
            name="description"
            rows="6"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide detailed information about the job requirements, specific tasks, equipment needed, and any special instructions..."
            required
          />
        </div>

        {/* File Upload Section */}
        <div className="file-upload-section">
          <label className="file-picker">
            📸 Choose Images (Optional)
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
            />
          </label>
          {images.length > 0 && (
            <div className="file-list">
              {images.map((file, index) => (
                <div key={index}>• {file.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="submit-section">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Posting Job...' : '🚀 Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}