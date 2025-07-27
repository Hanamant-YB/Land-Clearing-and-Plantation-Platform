// client/src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar       from '../assets/default-avatar.jpg';
import './Navbar.css';
// import { FaUserCircle } from 'react-icons/fa';
import profileIcon from '../assets/profile-icon.png';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const baseUrl = process.env.REACT_APP_API_URL || '';

  /**
   * Returns a fully qualified avatar URL or the default fallback.
   */
  const getPhotoUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith('/uploads')) {
      return `${baseUrl}${path}`;
    }
    if (/^https?:/.test(path)) {
      return path;
    }
    return `${baseUrl}/${path}`;
  };

  // Route to profile page based on role
  const profileLink =
    user?.role === 'contractor' ? '/contractor/profile' :
    user?.role === 'landowner'  ? '/landowner/profile'  :
                                   '/profile';

  // Correct place for debugging:
  console.log("Navbar photo:", user?.profile?.photo);
  console.log("Navbar image URL:", getPhotoUrl(user?.profile?.photo));
  return (
    <nav className="navbar">
      <Link to={user?.role === 'landowner' ? '/landowner/home' : '/'} className="nav-logo">
        Home
      </Link>

      <div className="link-group">
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {user?.role === 'landowner' && (
          <>
            <Link to="/landowner/post">Post Job</Link>
            <Link to="/landowner/shortlist">Shortlist</Link>
            <Link to="/landowner/progress">Progress</Link>
            <Link to="/landowner/payments">Payments</Link>
          </>
        )}
        {user?.role === 'contractor' && (
          <>
            <Link to="/contractor/pastworks">Works</Link>
            <Link to="/contractor/assignments">Assigned</Link>
            <Link to="/contractor/work-management">Work Management</Link>
            <Link to="/contractor/payments">Payments</Link>
            <Link to="/contractor/ratings">Feedback</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin">Admin Dashboard</Link>
        )}
      </div>

      {user && (
        <div className="user-info">
          <NotificationBell />
          <Link to={profileLink} className="nav-profile">
            {/* <span className="nav-profile-name">{user.name}</span> */}
            <img
              className="navbar-avatar"
              src={profileIcon}
              alt="Profile Icon"
            />
          </Link>

          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
