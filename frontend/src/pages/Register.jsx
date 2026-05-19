import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    age: '',
    gender: 'Male',
    address: '',
    city: '',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, fullName, age, gender, city, pincode } = formData;

    if (!email || !password || !fullName || !age || !gender || !city || !pincode) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 8) {
      setError('Security requirement: Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await axios.post('/auth/register', {
        ...formData,
        age: parseInt(age, 10)
      });
      
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(
        err.response?.data?.message || 'Server error. Please verify database configurations.'
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
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      {/* Decorative glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '350px',
        height: '350px',
        background: 'rgba(20, 184, 166, 0.12)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '350px',
        height: '350px',
        background: 'rgba(99, 102, 241, 0.12)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }}></div>

      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '750px',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Header Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '1.25rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            border: '1px solid rgba(20, 184, 166, 0.4)',
            borderRadius: '12px',
            padding: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(20, 184, 166, 0.2)'
          }}>
            <Activity size={24} color="#14b8a6" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: '#fff' }}>Patient Clinical Onboarding</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complete credentials & demographic fields to register profile</p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '2.0rem',
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
          {/* Two Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            {/* Column A: Credentials */}
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>
                1. System Security Credentials
              </h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="reg-email">Email Address *</label>
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  className="form-input"
                  placeholder="name@clinical.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="reg-password">Password (min 8 chars) *</label>
                <input
                  type="password"
                  id="reg-password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="reg-name">Full Patient Name *</label>
                <input
                  type="text"
                  id="reg-name"
                  name="fullName"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Column B: Medical Demographics */}
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-teal)', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>
                2. Demographics & Geographic Data
              </h3>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="reg-age">Age *</label>
                  <input
                    type="number"
                    id="reg-age"
                    name="age"
                    className="form-input"
                    placeholder="25"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="reg-gender">Gender *</label>
                  <select
                    id="reg-gender"
                    name="gender"
                    className="form-input"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="reg-city">City *</label>
                  <input
                    type="text"
                    id="reg-city"
                    name="city"
                    className="form-input"
                    placeholder="Mangaluru"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="reg-pincode">Pincode *</label>
                  <input
                    type="text"
                    id="reg-pincode"
                    name="pincode"
                    className="form-input"
                    placeholder="575001"
                    value={formData.pincode}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="reg-address">Street Address</label>
                <input
                  type="text"
                  id="reg-address"
                  name="address"
                  className="form-input"
                  placeholder="Apartment, Street Name"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '2rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <Link to="/login" style={{
                color: 'var(--accent-cyan)',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Login
              </Link>
            </div>
            
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.9rem 2.25rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <span>Onboarding Profile...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  Complete Registration
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
