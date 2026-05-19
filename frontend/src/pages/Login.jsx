import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, LogIn, AlertCircle, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password credentials.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await axios.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      console.error('Login request failed:', err);
      setError(
        err.response?.data?.message || 'Server connection failed. Please ensure the API is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Decorative ambient glowing blur rings */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'rgba(99, 102, 241, 0.15)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '300px',
        height: '300px',
        background: 'rgba(6, 182, 212, 0.12)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>

      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Medical App Logo Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            padding: '0.85rem',
            marginBottom: '0.75rem',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={32} color="#06b6d4" />
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem'
          }}>
            MediSense-Ai
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            Patient Health Assessment & Screen Terminal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: 'var(--accent-red)',
            fontSize: '0.85rem'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input block */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="email-input">
              Clinical Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                id="email-input"
                className="form-input"
                placeholder="name@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Password input block */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password-input">
              Account Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                id="password-input"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Verifying Security...
              </span>
            ) : (
              <>
                <LogIn size={18} />
                Access Clinical Terminal
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          New patient profile?{' '}
          <Link to="/register" style={{
            color: 'var(--accent-cyan)',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'color 0.2s'
          }} onMouseOver={(e) => e.target.style.color = '#22d3ee'}
             onMouseOut={(e) => e.target.style.color = 'var(--accent-cyan)'}>
            Onboard Account
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
