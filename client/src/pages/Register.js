// client/src/pages/Register.js
import React, { useState, useContext } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { AuthContext }                  from '../context/AuthContext';
import './Register.css';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate     = useNavigate();

  const [form, setForm]     = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'email') {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value)) {
        setEmailError('Please enter a valid Gmail address');
      } else {
        setEmailError('');
      }
    }
    if (name === 'password') {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(value)) {
        setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (emailError || passwordError) return;
    setLoading(true);

    try {
      // call register; assumes register(form) throws on error
      await register(form);

      // show success and redirect to login
      alert('Registration successful! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>

        {error && <div className="error">{error}</div>}

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          disabled={loading}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={loading}
          required
        />
        {emailError && <div style={{ color: 'red', marginTop: 4 }}>{emailError}</div>}

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          disabled={loading}
          required
        />
        {passwordError && <div style={{ color: 'red', marginTop: 4 }}>{passwordError}</div>}

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          disabled={loading}
          required
        >
          <option value="">Select role</option>
          <option value="landowner">Landowner</option>
          <option value="contractor">Contractor</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>
    </div>
  );
}