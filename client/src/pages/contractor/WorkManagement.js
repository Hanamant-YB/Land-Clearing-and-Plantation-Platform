import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './WorkManagement.css';
import Navbar from '../../components/Navbar';

const WorkManagement = () => {
  const { token, user } = useContext(AuthContext);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  
  // Progress form state
  const [progressForm, setProgressForm] = useState({
    weekNumber: '',
    description: '',
    progressPercentage: 0,
    photos: [],
    challenges: '',
    nextWeekPlan: ''
  });

  // Extension form state
  const [extensionForm, setExtensionForm] = useState({
    reason: '',
    requestedDays: '',
    newEndDate: ''
  });

  useEffect(() => {
    fetchAssignedJobs();
  }, []);

  const fetchAssignedJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Filter to only show in-progress jobs
      const inProgressJobs = response.data.filter(job => job.status === 'in_progress');
      setAssignedJobs(inProgressJobs);
      
      if (inProgressJobs.length > 0) {
        setSelectedJob(inProgressJobs[0]);
        fetchWeeklyProgress(inProgressJobs[0]._id);
      }
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyProgress = async (jobId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/work-progress/${jobId}/weekly`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeeklyProgress(response.data);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      setWeeklyProgress([]);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchWeeklyProgress(job._id);
  };

  const handlePhotoUpload = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/photo/upload`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.urls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      return [];
    }
  };

  const addWeeklyProgress = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    console.log('Submitting weekly progress for job:', selectedJob._id);
    console.log('Form data:', progressForm);

    // Frontend validation
    const weekNumber = parseInt(progressForm.weekNumber);
    const progressPercentage = parseInt(progressForm.progressPercentage);

    if (isNaN(weekNumber) || weekNumber < 1) {
      alert('Please enter a valid week number (must be 1 or greater)');
      return;
    }

    if (isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      alert('Please enter a valid progress percentage (must be between 0 and 100)');
      return;
    }

    if (!progressForm.description.trim()) {
      alert('Please enter a description for the weekly progress');
      return;
    }

    try {
      let photoUrls = [];
      if (progressForm.photos.length > 0) {
        console.log('Uploading photos...');
        photoUrls = await handlePhotoUpload(progressForm.photos);
        console.log('Photo URLs:', photoUrls);
      }

      const requestData = {
        ...progressForm,
        weekNumber: weekNumber,
        progressPercentage: progressPercentage,
        photos: photoUrls
      };

      console.log('Sending request with data:', requestData);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/work-progress/${selectedJob._id}/weekly`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response received:', response.data);

      setWeeklyProgress(response.data);
      setProgressForm({
        weekNumber: '',
        description: '',
        progressPercentage: 0,
        photos: [],
        challenges: '',
        nextWeekPlan: ''
      });
      setShowProgressModal(false);
      alert('Weekly progress added successfully!');
    } catch (error) {
      console.error('Error adding weekly progress:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error adding weekly progress';
      alert(errorMessage);
    }
  };

  const updateWeeklyProgress = async (e) => {
    e.preventDefault();
    if (!selectedJob || !editingProgress) return;

    // Frontend validation
    const weekNumber = parseInt(progressForm.weekNumber);
    const progressPercentage = parseInt(progressForm.progressPercentage);

    if (isNaN(weekNumber) || weekNumber < 1) {
      alert('Please enter a valid week number (must be 1 or greater)');
      return;
    }

    if (isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      alert('Please enter a valid progress percentage (must be between 0 and 100)');
      return;
    }

    if (!progressForm.description.trim()) {
      alert('Please enter a description for the weekly progress');
      return;
    }

    try {
      let photoUrls = editingProgress.photos;
      if (progressForm.photos.length > 0) {
        const newPhotoUrls = await handlePhotoUpload(progressForm.photos);
        photoUrls = [...photoUrls, ...newPhotoUrls];
      }

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/work-progress/${selectedJob._id}/weekly/${editingProgress._id}`,
        {
          ...progressForm,
          weekNumber: weekNumber,
          progressPercentage: progressPercentage,
          photos: photoUrls
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWeeklyProgress(response.data);
      setProgressForm({
        weekNumber: '',
        description: '',
        progressPercentage: 0,
        photos: [],
        challenges: '',
        nextWeekPlan: ''
      });
      setEditingProgress(null);
      setShowProgressModal(false);
      alert('Weekly progress updated successfully!');
    } catch (error) {
      console.error('Error updating weekly progress:', error);
      const errorMessage = error.response?.data?.message || 'Error updating weekly progress';
      alert(errorMessage);
    }
  };

  const deletePhoto = async (progressId, photoIndex) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/work-progress/${selectedJob._id}/weekly/${progressId}/photo/${photoIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeeklyProgress(response.data);
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo');
    }
  };

  const requestExtension = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/work-progress/${selectedJob._id}/extension-request`,
        extensionForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setExtensionForm({
        reason: '',
        requestedDays: '',
        newEndDate: ''
      });
      setShowExtensionModal(false);
      alert('Extension request sent to landowner!');
    } catch (error) {
      console.error('Error requesting extension:', error);
      alert('Error requesting extension');
    }
  };

  const markJobCompleted = async () => {
    if (!selectedJob) return;

    if (!window.confirm('Are you sure you want to mark this job as completed?')) {
      return;
    }

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs/${selectedJob._id}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Job marked as completed!');
      fetchAssignedJobs();
    } catch (error) {
      console.error('Error marking job as completed:', error);
      alert('Error marking job as completed');
    }
  };

  const openEditProgress = (progress) => {
    setEditingProgress(progress);
    setProgressForm({
      weekNumber: progress.weekNumber,
      description: progress.description,
      progressPercentage: progress.progressPercentage,
      photos: [],
      challenges: progress.challenges || '',
      nextWeekPlan: progress.nextWeekPlan || ''
    });
    setShowProgressModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getNextWeekNumber = () => {
    if (weeklyProgress.length === 0) return 1;
    return Math.max(...weeklyProgress.map(p => p.weekNumber)) + 1;
  };

  if (loading) {
    return (
      <div className="work-management-container">
        <div className="loading">Loading your assigned jobs...</div>
      </div>
    );
  }

  if (assignedJobs.length === 0) {
    return (
      <div className="work-management-container">
        <div className="no-jobs">
          <h3>No In-Progress Jobs</h3>
          <p>You don't have any jobs currently in progress to manage.</p>
          <p>Completed jobs and other status jobs are not shown in this section.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="work-management-container">
        <div className="header">
          <h2>Work Management</h2>
          <p>Manage your in-progress jobs and track weekly progress</p>
        </div>

        <div className="job-selection">
          <label>Select In-Progress Job to Manage:</label>
          <select 
            value={selectedJob?._id || ''} 
            onChange={(e) => {
              const job = assignedJobs.find(j => j._id === e.target.value);
              handleJobSelect(job);
            }}
          >
            {assignedJobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title} - {job.workType} (Landowner: {job.postedBy?.name || 'Unknown'})
              </option>
            ))}
          </select>
        </div>

        {selectedJob && (
          <div className="selected-job-details">
            <div className="job-info">
              <div className="job-header-with-status">
                <h3>{selectedJob.title}</h3>
                <span className="status-badge in-progress">In Progress</span>
              </div>
              <div className="job-meta">
                <span><strong>Work Type:</strong> {selectedJob.workType}</span>
                <span><strong>Location:</strong> {selectedJob.location}</span>
                <span><strong>Budget:</strong> {(() => {
                  if (selectedJob && selectedJob.aiShortlistScores && user) {
                    const myScore = selectedJob.aiShortlistScores.find(
                      score =>
                        score.contractorId &&
                        (score.contractorId._id === user._id ||
                         score.contractorId === user._id ||
                         score.contractorId === user.id)
                    );
                    if (myScore && myScore.estimatedCost) {
                      return `₹${myScore.estimatedCost.toLocaleString()}`;
                    }
                  }
                  return 'Not specified';
                })()}</span>
                <span><strong>End Date:</strong> {formatDate(selectedJob.endDate)}</span>
              </div>
              
              {/* Landowner Information */}
              {selectedJob.postedBy && (
                <div className="landowner-section">
                  <h4>Landowner Information</h4>
                  <div className="landowner-details">
                    <p><strong>Name:</strong> {selectedJob.postedBy.name}</p>
                    <p><strong>Email:</strong> {selectedJob.postedBy.email}</p>
                    {selectedJob.postedBy.phone && (
                      <p><strong>Phone:</strong> {selectedJob.postedBy.phone}</p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="job-description">{selectedJob.description}</p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={() => {
                  setEditingProgress(null);
                  setProgressForm({
                    weekNumber: getNextWeekNumber(),
                    description: '',
                    progressPercentage: 0,
                    photos: [],
                    challenges: '',
                    nextWeekPlan: ''
                  });
                  setShowProgressModal(true);
                }}
                className="btn-add-progress"
              >
                Add Weekly Progress
              </button>
              
              <button 
                onClick={() => setShowExtensionModal(true)}
                className="btn-request-extension"
              >
                Request Extension
              </button>
              
              <button 
                onClick={markJobCompleted}
                className="btn-complete-job"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        )}

        {/* Weekly Progress List */}
        <div className="weekly-progress-section">
          <h3>Weekly Progress Updates</h3>
          {weeklyProgress.length === 0 ? (
            <div className="no-progress">
              <p>No weekly progress updates yet. Add your first update!</p>
            </div>
          ) : (
            <div className="progress-list">
              {weeklyProgress.map((progress, index) => (
                <div key={progress._id} className="progress-card">
                  <div className="progress-header">
                    <h4>Week {progress.weekNumber}</h4>
                    <span className="progress-percentage">{progress.progressPercentage}%</span>
                    <button 
                      onClick={() => openEditProgress(progress)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                  </div>
                  
                  <div className="progress-content">
                    <p><strong>Description:</strong> {progress.description}</p>
                    {progress.challenges && (
                      <p><strong>Challenges:</strong> {progress.challenges}</p>
                    )}
                    {progress.nextWeekPlan && (
                      <p><strong>Next Week Plan:</strong> {progress.nextWeekPlan}</p>
                    )}
                    <p><strong>Date:</strong> {formatDate(progress.createdAt)}</p>
                  </div>

                  {progress.photos && progress.photos.length > 0 && (
                    <div className="progress-photos">
                      <h5>Photos:</h5>
                      <div className="photo-gallery">
                        {progress.photos.map((photo, photoIndex) => (
                          <div key={photoIndex} className="photo-item">
                            <img src={photo} alt={`Progress photo ${photoIndex + 1}`} />
                            <button 
                              onClick={() => deletePhoto(progress._id, photoIndex)}
                              className="btn-delete-photo"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Modal */}
        {showProgressModal && (
          <div className="modal-overlay">
            <div className="progress-modal">
              <div className="modal-header">
                <h3>{editingProgress ? 'Edit Weekly Progress' : 'Add Weekly Progress'}</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowProgressModal(false);
                    setEditingProgress(null);
                    setProgressForm({
                      weekNumber: '',
                      description: '',
                      progressPercentage: 0,
                      photos: [],
                      challenges: '',
                      nextWeekPlan: ''
                    });
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={editingProgress ? updateWeeklyProgress : addWeeklyProgress}>
                <div className="form-group">
                  <label>Week Number:</label>
                  <input
                    type="number"
                    value={progressForm.weekNumber}
                    onChange={(e) => setProgressForm({...progressForm, weekNumber: e.target.value})}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Progress Percentage:</label>
                  <input
                    type="number"
                    value={progressForm.progressPercentage}
                    onChange={(e) => setProgressForm({...progressForm, progressPercentage: e.target.value})}
                    required
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={progressForm.description}
                    onChange={(e) => setProgressForm({...progressForm, description: e.target.value})}
                    required
                    rows="4"
                    placeholder="What was accomplished this week?"
                  />
                </div>

                <div className="form-group">
                  <label>Challenges (Optional):</label>
                  <textarea
                    value={progressForm.challenges}
                    onChange={(e) => setProgressForm({...progressForm, challenges: e.target.value})}
                    rows="3"
                    placeholder="Any challenges faced this week?"
                  />
                </div>

                <div className="form-group">
                  <label>Next Week Plan (Optional):</label>
                  <textarea
                    value={progressForm.nextWeekPlan}
                    onChange={(e) => setProgressForm({...progressForm, nextWeekPlan: e.target.value})}
                    rows="3"
                    placeholder="What's planned for next week?"
                  />
                </div>

                <div className="form-group">
                  <label>Add Photos:</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setProgressForm({...progressForm, photos: Array.from(e.target.files)})}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowProgressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingProgress ? 'Update Progress' : 'Add Progress'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Extension Request Modal */}
        {showExtensionModal && (
          <div className="modal-overlay">
            <div className="extension-modal">
              <div className="modal-header">
                <h3>Request Date Extension</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowExtensionModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={requestExtension}>
                <div className="form-group">
                  <label>Reason for Extension:</label>
                  <textarea
                    value={extensionForm.reason}
                    onChange={(e) => setExtensionForm({...extensionForm, reason: e.target.value})}
                    required
                    rows="4"
                    placeholder="Please explain why you need an extension..."
                  />
                </div>

                <div className="form-group">
                  <label>Additional Days Needed:</label>
                  <input
                    type="number"
                    value={extensionForm.requestedDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      let newEndDate = '';
                      if (selectedJob && selectedJob.endDate && !isNaN(days)) {
                        const baseDate = new Date(selectedJob.endDate);
                        if (!isNaN(baseDate.getTime())) {
                          baseDate.setDate(baseDate.getDate() + days);
                          newEndDate = baseDate.toISOString().split('T')[0];
                        }
                      }
                      setExtensionForm({
                        ...extensionForm, 
                        requestedDays: e.target.value,
                        newEndDate
                      });
                    }}
                    required
                    min="1"
                    max="30"
                  />
                </div>

                <div className="form-group">
                  <label>New Proposed End Date:</label>
                  <input
                    type="date"
                    value={extensionForm.newEndDate}
                    readOnly
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowExtensionModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Send Extension Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WorkManagement;