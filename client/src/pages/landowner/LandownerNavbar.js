import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import profileIcon from '../../assets/profile-icon.png';
import NotificationBell from '../../components/NotificationBell';
import logo from '../../assets/logo.svg';
import './LandownerNavbar.css';

export default function LandownerNavbar() {
  const { user, logout } = useAuth();
  const profileLink = '/landowner/profile';

  return (
    <nav className="landowner-navbar">
      <Link to="/landowner/home" className="nav-logo">
        <img src={logo} alt="Platform Logo" style={{ height: 36, verticalAlign: 'middle', marginRight: 10 }} />
        Home
      </Link>
      <div className="link-group">
        <Link to="/landowner/post">Post Job</Link>
        <Link to="/landowner/shortlist">Shortlist</Link>
        <Link to="/landowner/progress">Progress</Link>
        <Link to="/landowner/payments">Payments</Link>
      </div>
      {user && (
        <div className="user-info">
          <NotificationBell />
          <Link to={profileLink} className="nav-profile">
            <img className="navbar-avatar" src={profileIcon} alt="Profile Icon" />
          </Link>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      )}
    </nav>
  );
} 