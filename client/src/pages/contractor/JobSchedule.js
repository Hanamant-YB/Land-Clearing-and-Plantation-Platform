// client/src/pages/contractor/JobSchedule.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function JobSchedule() {
  const { token } = useContext(AuthContext);
  const { jobId } = useParams();
  const navigate  = useNavigate();
  const [dates, setDates] = useState({ startDate: '', endDate: '' });

  const handleChange = e => {
    const { name, value } = e.target;
    setDates(d => ({ ...d, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.post(
      `${process.env.REACT_APP_API_URL}/contractor/assignments/${jobId}/schedule`,
      dates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('Schedule proposed');
    navigate('/contractor/assignments');
  };

  return (
    <>
      <Navbar />
      <form onSubmit={handleSubmit}>
        <h2>Propose Schedule</h2>
        <label>
          Start Date  
          <input
            name="startDate"
            type="date"
            value={dates.startDate}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          End Date  
          <input
            name="endDate"
            type="date"
            value={dates.endDate}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">Submit Schedule</button>
      </form>
    </>
  );
}