// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const API = process.env.REACT_APP_API_URL;

  // 1) Load token & user from localStorage
  const [token, setToken] = useState(
    () => localStorage.getItem('token') || ''
  );
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || 'null')
  );

  // 2) Sync axios Authorization header & localStorage.token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // 3) Persist user object in localStorage whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else     localStorage.removeItem('user');
  }, [user]);

  // 4) If we have a token but no user (e.g. on page refresh), fetch current profile
  useEffect(() => {
    if (token && !user) {
      axios
        .get(`${API}/users/me`)
        .then(res => setUser(res.data.user))
        .catch(() => {
          // Token invalid or expired
          setToken('');
          setUser(null);
        });
    }
  }, [token, user, API]);

  // ---- Authentication Actions ----

  // REGISTER: sign up & immediately log in
  const register = async signupData => {
    const res = await axios.post(`${API}/users/register`, signupData);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // LOGIN: set token + user
  const login = async credentials => {
    const res = await axios.post(`${API}/users/login`, credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // LOGOUT: clear out token + user
  const logout = () => {
    setToken('');
    setUser(null);
  };

  // Expose setUser so components (e.g. PhotoUpload) can patch the user in context
  return (
    <AuthContext.Provider
      value={{ token, user, register, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}