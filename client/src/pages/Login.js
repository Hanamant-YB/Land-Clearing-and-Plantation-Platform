import React, { useState, useContext } from 'react';
import { useNavigate }                from 'react-router-dom';
import { AuthContext }                from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
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
      const user = await login(form);          // ← wait for user
      if (user.role === 'admin') {
        navigate('/admin', { replace: true }); // ← go directly to AdminDashboard
      } else if (user.role === 'landowner') {
        navigate('/landowner/home', { replace: true });
      } else if (user.role === 'contractor') {
        navigate('/contractor/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>

        {error && <div className="error">{error}</div>}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        {emailError && <div style={{ color: 'red', marginTop: 4 }}>{emailError}</div>}

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
        {passwordError && <div style={{ color: 'red', marginTop: 4 }}>{passwordError}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <div className="login-register-link">
        Don't have an account?{' '}
        <span className="register-link" onClick={() => navigate('/register')}>
          Register
        </span>
      </div>
    </div>
  );
}