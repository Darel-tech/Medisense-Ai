import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, Activity, MapPin, AlertTriangle, Calendar, Send, 
  LogOut, PlusCircle, CheckCircle, ChevronRight, Sliders, 
  Map, MessageSquare, X, RefreshCw, Thermometer, ShieldAlert 
} from 'lucide-react';

const DashboardPage = () => {
  const { user, logout, setUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Patient Profile State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '', age: '', gender: '', address: '', city: '', pincode: ''
  });

  // 2. Hospital Finder State
  const [hospitalCity, setHospitalCity] = useState('');
  const [hospitalPincode, setHospitalPincode] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  // 3. Symptom Assessment Terminal State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [symptomsLoading, setSymptomsLoading] = useState(false);
  
  // Assessment workflow
  const [assessmentStep, setAssessmentStep] = useState(1); // 1: Choose category, 2: Select symptoms details, 3: Show result
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); // [{ id, name, severity, duration }]
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessing, setAssessing] = useState(false);

  // 4. Daily Monitoring Tracker State
  const [monitoringHistory, setMonitoringHistory] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    improvement: 'same', newSymptoms: '', temperature: '98.6', notes: ''
  });

  // 5. Clinical AI Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Load Dashboard Data
  const loadDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('/dashboard');
      setDashboardData(response.data);
      
      // Auto fill Profile editor
      const prof = response.data.profileSummary;
      setProfileForm({
        fullName: prof.full_name,
        age: prof.age,
        gender: prof.gender,
        address: prof.address || '',
        city: prof.city,
        pincode: prof.pincode
      });

      // If active monitoring exists, load historical logs
      if (response.data.activeMonitoring) {
        loadMonitoringLogs(response.data.activeMonitoring.assessment_id);
      } else {
        setMonitoringHistory(null);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary views:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load 7-Day Tracking Logs
  const loadMonitoringLogs = async (assessmentId) => {
    try {
      const response = await axios.get(`/monitoring/${assessmentId}`);
      setMonitoringHistory(response.data);
    } catch (err) {
      console.error('Error loading monitoring history logs:', err);
    }
  };

  // Load hospitals nearby
  const loadHospitals = async () => {
    setHospitalsLoading(true);
    try {
      const params = {};
      if (hospitalCity) params.city = hospitalCity;
      if (hospitalPincode) params.pincode = hospitalPincode;
      if (emergencyOnly) params.emergencyOnly = true;

      const response = await axios.get('/hospitals/nearby', { params });
      setHospitals(response.data.hospitals);
      
      if (!hospitalCity && !hospitalPincode) {
        setHospitalCity(response.data.searchCriteria.city);
        setHospitalPincode(response.data.searchCriteria.pincode);
      }
    } catch (err) {
      console.error('Error loading hospital directory records:', err);
    } finally {
      setHospitalsLoading(false);
    }
  };

  // Load symptom categories
  const loadCategories = async () => {
    try {
      const response = await axios.get('/symptoms/categories');
      setCategories(response.data);
      if (response.data.length > 0) {
        setSelectedCategory(response.data[0]);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Load symptoms for selected category
  const loadSymptoms = async (catName) => {
    if (!catName) return;
    setSymptomsLoading(true);
    try {
      const response = await axios.get(`/symptoms?category=${catName}`);
      setAllSymptoms(response.data);
    } catch (err) {
      console.error('Error loading symptoms:', err);
    } finally {
      setSymptomsLoading(false);
    }
  };

  // Fetch Chat logs
  const loadChatLogs = async () => {
    try {
      const response = await axios.get('/chat/history');
      setChatHistory(response.data);
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  };

  // Run initial mounts
  useEffect(() => {
    loadDashboard();
    loadCategories();
    loadHospitals();
    loadChatLogs();
  }, []);

  // Sync symptoms loading when category changes
  useEffect(() => {
    loadSymptoms(selectedCategory);
  }, [selectedCategory]);

  // Scroll to bottom of chat when it opens or receives a message
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatOpen]);

  // 1. UPDATE PROFILE
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/patient/profile', profileForm);
      // Update global context name
      setUser({ ...user, fullName: profileForm.fullName });
      setEditingProfile(false);
      loadDashboard(true);
    } catch (err) {
      alert('Profile update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // 2. DAILY CHECK-IN LOG
  const handleDailyCheckin = async (e) => {
    e.preventDefault();
    if (!dashboardData?.activeMonitoring) return;
    checkingIn(true);
    setCheckingIn(true);

    try {
      const payload = {
        assessmentId: dashboardData.activeMonitoring.assessment_id,
        improvement: checkinForm.improvement,
        newSymptoms: checkinForm.newSymptoms,
        temperature: parseFloat(checkinForm.temperature),
        notes: checkinForm.notes
      };

      await axios.post('/monitoring', payload);
      // Reset daily log checkin form
      setCheckinForm({
        improvement: 'same', newSymptoms: '', temperature: '98.6', notes: ''
      });
      // Reload Dashboard states contextually
      await loadDashboard(true);
    } catch (err) {
      alert('Daily log submission failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCheckingIn(false);
    }
  };

  // 3. SUBMIT SYMPTOM SCREENING ASSESSMENT
  const handleToggleSymptom = (sym) => {
    const exists = selectedSymptoms.find(s => s.id === sym.symptom_id);
    if (exists) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== sym.symptom_id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, {
        id: sym.symptom_id,
        name: sym.symptom_name,
        severity: 5,
        duration: 2
      }]);
    }
  };

  const handleUpdateSymptomDetail = (id, field, val) => {
    setSelectedSymptoms(selectedSymptoms.map(s => {
      if (s.id === id) {
        return { ...s, [field]: val };
      }
      return s;
    }));
  };

  const handleAssessmentSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom to assess.');
      return;
    }
    setAssessing(true);
    try {
      const response = await axios.post('/assessments', {
        symptoms: selectedSymptoms,
        notes: assessmentNotes
      });
      setAssessmentResult(response.data.assessment);
      setAssessmentStep(3);
      // Clear forms
      setSelectedSymptoms([]);
      setAssessmentNotes('');
      // Reload dashboard
      loadDashboard(true);
    } catch (err) {
      alert('Clinical assessment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssessing(false);
    }
  };

  // 4. CHAT MESSAGE SEND
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatSending(true);

    // Append optimistic user message locally
    setChatHistory(prev => [...prev, { chat_id: Date.now(), message_type: 'user', message_text: userMsg }]);

    try {
      const response = await axios.post('/chat', { message: userMsg });
      // Append bot response from server
      setChatHistory(prev => [...prev, { chat_id: Date.now() + 1, message_type: 'bot', message_text: response.data.reply }]);
    } catch (err) {
      console.error('Chat failed:', err);
    } finally {
      setChatSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div style={{
          border: '3px solid rgba(6, 182, 212, 0.1)',
          borderTop: '3px solid var(--accent-cyan)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-title)', fontSize: '1rem' }}>
          Loading Clinical Data Views...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const profileSummary = dashboardData?.profileSummary;
  const activeMonitoring = dashboardData?.activeMonitoring;
  const recentAssessments = dashboardData?.recentAssessments || [];
  const riskPercent = profileSummary ? Math.min(100, Math.round(profileSummary.avg_risk_score * 1.2)) : 0;
  
  // Health score circle color
  let riskColor = 'var(--accent-green)';
  if (profileSummary?.latest_risk_level === 'medium') riskColor = 'var(--accent-yellow)';
  if (profileSummary?.latest_risk_level === 'high') riskColor = 'var(--accent-red)';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* ==========================================================================
         TOP BAR: NAV HEADER
         ========================================================================== */}
      <header style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.85rem 2rem'
      }}>
        <div style={{
          maxWidth: '1300px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '10px',
              padding: '0.5rem'
            }}>
              <Activity size={20} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>MediSense-Ai</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--accent-green)' }}></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live SQL DB Active
                </span>
              </div>
            </div>
          </div>

          {/* User controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Patient: <strong style={{ color: '#fff' }}>{user?.fullName || profileSummary?.full_name}</strong>
            </span>
            <button
              onClick={() => {
                setRefreshing(true);
                loadDashboard().then(() => setRefreshing(false));
              }}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
              Sync Views
            </button>
            <button
              onClick={logout}
              className="btn-primary"
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                boxShadow: 'none',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)'
              }}
            >
              <LogOut size={14} />
              Term
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================================================
         BENTO GRID BOARD
         ========================================================================== */ }
      <main className="bento-container animate-fade-in" style={{ marginTop: '1.5rem' }}>
        
        {/* BENTO CARD 1: PATIENT PROFILE (col-4) */}
        <section className="glass-card col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <User size={18} color="var(--accent-cyan)" />
              Patient Profile Card
            </h3>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-cyan)', 
                  fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Age</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Gender</label>
                  <select
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1.5 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>City</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Address</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span style={{ width: '100px', color: 'var(--text-muted)' }}>ID:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                  MED-{String(profileSummary?.patient_id).padStart(5, '0')}
                </span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span style={{ width: '100px', color: 'var(--text-muted)' }}>Name:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{profileSummary?.full_name}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span style={{ width: '100px', color: 'var(--text-muted)' }}>Age/Sex:</span>
                <span>{profileSummary?.age} years / {profileSummary?.gender}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span style={{ width: '100px', color: 'var(--text-muted)' }}>Location:</span>
                <span>{profileSummary?.city} ({profileSummary?.pincode})</span>
              </div>
              {profileSummary?.address && (
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '100px', color: 'var(--text-muted)' }}>Address:</span>
                  <span style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>{profileSummary.address}</span>
                </div>
              )}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span style={{ width: '100px', color: 'var(--text-muted)' }}>Email:</span>
                <span>{profileSummary?.email}</span>
              </div>
            </div>
          )}
        </section>

        {/* BENTO CARD 2: RADIUS HEALTH RISK SCORE & STATS (col-4) */}
        <section className="glass-card col-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginBottom: '1.25rem', color: '#fff' }}>
            <Activity size={18} color="var(--accent-indigo)" />
            Clinical Health Status
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', width: '100%', justifyContent: 'space-around', margin: '1rem 0' }}>
            {/* Glowing circle score */}
            <div 
              className="radial-progress" 
              style={{ 
                '--percentage': `${riskPercent * 3.6}deg`,
                background: `conic-gradient(${riskColor} ${riskPercent * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`,
                width: '110px',
                height: '110px',
                boxShadow: `0 0 15px rgba(255, 255, 255, 0.02)`
              }}
            >
              <div className="radial-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>{riskPercent}</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '-0.1rem' }}>
                  Risk Idx
                </span>
              </div>
            </div>

            {/* Value block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                  Current Risk Profile
                </span>
                <span 
                  className={
                    profileSummary?.latest_risk_level === 'high' ? 'badge-high' : 
                    profileSummary?.latest_risk_level === 'medium' ? 'badge-medium' : 'badge-low'
                  }
                  style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.85rem' }}
                >
                  {profileSummary?.latest_risk_level || 'No Records'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                  Total Assessments
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#fff' }}>
                  {profileSummary?.total_assessments || 0}
                </strong>
              </div>
            </div>
          </div>

          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: '1.4',
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            {profileSummary?.latest_risk_level === 'high' ? (
              <span style={{ color: 'var(--accent-red)' }}>⚠️ Immediate clinical emergency warning issued. Refer to Nearby Hospital Card below.</span>
            ) : profileSummary?.latest_risk_level === 'medium' ? (
              <span style={{ color: 'var(--accent-yellow)' }}>👨‍⚕️ 7-Day health tracker timeline active. Complete your daily symptom check-ins.</span>
            ) : profileSummary?.latest_risk_level === 'low' ? (
              <span style={{ color: 'var(--accent-green)' }}>🛌 Low-risk status maintained. Self-isolate and monitor if symptoms fluctuate.</span>
            ) : (
              <span>No active diagnostics recorded. Run a screening using the Symptom Assessment terminal.</span>
            )}
          </div>
        </section>

        {/* BENTO CARD 3: HOSPITAL DIRECTORY LOCATOR (col-4) */}
        <section className="glass-card col-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#fff' }}>
            <MapPin size={18} color="var(--accent-teal)" />
            Hospital Directory Finder
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="City (e.g. Mangaluru)"
              className="form-input"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
              value={hospitalCity}
              onChange={(e) => setHospitalCity(e.target.value)}
            />
            <input
              type="text"
              placeholder="Pincode"
              className="form-input"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', width: '80px' }}
              value={hospitalPincode}
              onChange={(e) => setHospitalPincode(e.target.value)}
            />
            <button
              onClick={loadHospitals}
              className="btn-primary"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem', boxShadow: 'none' }}
              disabled={hospitalsLoading}
            >
              Search
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => {
                setEmergencyOnly(e.target.checked);
                // Trigger reload
                setTimeout(loadHospitals, 0);
              }}
            />
            Show Emergency/Trauma Centers Only
          </label>

          {/* Hospital List Scroll Box */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '135px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {hospitalsLoading ? (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Resolving clinics...</p>
            ) : hospitals.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0' }}>No facilities matching search.</p>
            ) : (
              hospitals.map(h => (
                <div key={h.hospital_id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ minWidth: 0, paddingRight: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.hospital_name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {h.hospital_type} • {h.address}, {h.city}
                    </span>
                  </div>
                  {h.has_emergency === 1 && (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      fontSize: '0.6rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      ER ACTIVE
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* BENTO CARD 4: SYMPTOM ASSESSMENT TERMINAL (col-8) */}
        <section className="glass-card col-8" style={{ display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <PlusCircle size={20} color="var(--accent-cyan)" />
              Symptom Assessment Terminal
            </h3>
            {assessmentStep > 1 && (
              <button
                onClick={() => setAssessmentStep(1)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}
              >
                Reset Diagnostic
              </button>
            )}
          </div>

          {/* STEP 1: CATEGORY & SYMPTOMS PICKER */}
          {assessmentStep === 1 && (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '1rem' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)' : 'rgba(255, 255, 255, 0.03)',
                      color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                      border: selectedCategory === cat ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Symptoms selector grid */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '140px', padding: '0.25rem' }}>
                {symptomsLoading ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching clinical symptoms...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.65rem' }}>
                    {allSymptoms.map(sym => {
                      const isSelected = selectedSymptoms.some(s => s.id === sym.symptom_id);
                      return (
                        <button
                          key={sym.symptom_id}
                          onClick={() => handleToggleSymptom(sym)}
                          style={{
                            background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'rgba(15, 22, 38, 0.6)',
                            border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.75rem',
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '0.25rem' }}>
                            {sym.symptom_name}
                          </span>
                          {sym.is_emergency_sign === 1 && (
                            <span title="Emergency Flag Indicator" style={{ width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-red)', flexShrink: 0 }}></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trigger next step button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Selected Symptoms: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedSymptoms.length}</strong>
                </span>
                <button
                  onClick={() => setAssessmentStep(2)}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem' }}
                  disabled={selectedSymptoms.length === 0}
                >
                  Configure Severity
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE SLIDERS FOR SEVERITY & DURATION */}
          {assessmentStep === 2 && (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '1rem' }}>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '150px', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.25rem' }}>
                {selectedSymptoms.map(sym => (
                  <div key={sym.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{sym.name}</strong>
                      <button
                        onClick={() => setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== sym.id))}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {/* Severity Slider */}
                      <div style={{ flex: 2, minWidth: '180px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Severity (Rating: 1 - 10)</span>
                          <strong style={{ color: 'var(--accent-cyan)' }}>{sym.severity}/10</strong>
                        </span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={sym.severity}
                          onChange={(e) => handleUpdateSymptomDetail(sym.id, 'severity', parseInt(e.target.value))}
                          style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', outline: 'none', marginTop: '0.45rem', cursor: 'pointer' }}
                        />
                      </div>

                      {/* Duration Spinner */}
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Duration (Days)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateSymptomDetail(sym.id, 'duration', Math.max(1, sym.duration - 1))}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.85rem', color: '#fff', width: '20px', textAlign: 'center', fontWeight: '600' }}>
                            {sym.duration}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSymptomDetail(sym.id, 'duration', Math.min(30, sym.duration + 1))}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Patient notes */}
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
                <input
                  type="text"
                  placeholder="Optional: Provide general notes, chronic factors, or allergies..."
                  className="form-input"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                />
                <button
                  onClick={handleAssessmentSubmit}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
                  disabled={assessing || selectedSymptoms.length === 0}
                >
                  {assessing ? 'Analysing...' : 'Submit Diagnostic'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DISPLAY DIAGNOSTIC OUTCOMES */}
          {assessmentStep === 3 && assessmentResult && (
            <div className="animate-fade-in" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {/* Diagnosed Details Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Primary Matched Disease Profile
                  </span>
                  <strong style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-title)' }}>
                    {assessmentResult.diagnosis.disease_name}
                  </strong>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '0.25rem 0' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CONFIDENCE</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
                        {assessmentResult.diagnosis.confidence}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>RISK LEVEL</span>
                      <span className={assessmentResult.risk_level === 'high' ? 'badge-high' : assessmentResult.risk_level === 'medium' ? 'badge-medium' : 'badge-low'} style={{ display: 'inline-block', marginTop: '0.15rem' }}>
                        {assessmentResult.risk_level}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>RISK SCORE</span>
                      <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{assessmentResult.risk_score}</strong>
                    </div>
                  </div>
                </div>

                {/* Differential Possibilities */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Differential Possibilities (Overlapping Symptoms)
                  </span>
                  
                  {assessmentResult.differential_diagnoses && assessmentResult.differential_diagnoses.length > 0 ? (
                    assessmentResult.differential_diagnoses.map(diff => (
                      <div key={diff.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{diff.name}</span>
                        <strong style={{ color: '#fff' }}>{diff.confidence}%</strong>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.5rem 0' }}>No overlapping profiles matched.</p>
                  )}
                </div>
              </div>

              {/* Recommendation message banner */}
              <div style={{
                background: assessmentResult.risk_level === 'high' ? 'rgba(239, 68, 68, 0.08)' : assessmentResult.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${assessmentResult.risk_level === 'high' ? 'rgba(239, 68, 68, 0.2)' : assessmentResult.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                borderRadius: '12px',
                padding: '0.85rem 1.1rem',
                fontSize: '0.82rem',
                lineHeight: '1.4',
                color: assessmentResult.risk_level === 'high' ? 'var(--accent-red)' : assessmentResult.risk_level === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-green)'
              }}>
                {assessmentResult.diagnosis.recommendation}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  onClick={() => setAssessmentStep(1)}
                  className="btn-primary"
                  style={{ padding: '0.45rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  Clear & Exit Screening
                </button>
              </div>
            </div>
          )}
        </section>

        {/* BENTO CARD 5: 7-DAY DAILY MONITORING PROGRESS (col-8) */}
        <section className="glass-card col-8" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#fff' }}>
            <Calendar size={20} color="var(--accent-indigo)" />
            7-Day Patient Daily Monitoring Timeline
          </h3>

          {activeMonitoring ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Critical Alert Warning banner if trigger fires alerts */}
              {monitoringHistory?.logs?.some(l => l.hospitalize === 1 || l.alert_trigger === 1) && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid var(--accent-red)',
                  borderRadius: '12px',
                  padding: '0.85rem 1.2rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'center',
                  color: 'var(--accent-red)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  animation: 'pulse-alert 2.5s infinite',
                  lineHeight: '1.4'
                }}>
                  <ShieldAlert size={28} style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800' }}>🚨 CLINICAL WORSE TRAJECTORY ALERTS ACTIVE</span>
                    Automated database diagnostic algorithms have flagged consecutive worsening states or prolonged clinical stagnation. Worsening check-in thresholds triggered hospitalize indicators! Please consult a general practitioner or proceed to the nearby trauma centers list on your right immediately!
                  </div>
                </div>
              )}

              {/* Two columns: Daily logger & Calendar log view */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* 7 Day Timeline Visual logs */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Monitoring Check-in Course (Assessment ID: MED-{String(activeMonitoring.assessment_id).padStart(5, '0')})
                  </span>
                  
                  {/* Calendar row representation */}
                  <div className="calendar-timeline">
                    {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                      const log = monitoringHistory?.logs?.[dayNum - 1];
                      let dayClass = 'calendar-day';
                      if (log) {
                        dayClass += ` filled-${log.improvement}`;
                      }

                      return (
                        <div key={dayNum} className={dayClass} title={log ? `Day ${dayNum}: ${log.improvement.toUpperCase()} (${log.temperature}°F) - ${log.notes || 'No notes'}` : `Day ${dayNum}: Not logged yet`}>
                          <strong>D{dayNum}</strong>
                          <span style={{ fontSize: '0.55rem', marginTop: '0.15rem' }}>
                            {log ? `${Math.round(log.temperature)}°` : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-around', color: 'var(--text-muted)' }}>
                    <span>🟩 Improving</span>
                    <span>🟨 Same</span>
                    <span>🟥 Worse</span>
                  </div>
                </div>

                {/* Daily Check-in Form */}
                <form onSubmit={handleDailyCheckin} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Record Daily Symptom Progress
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1.5 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Symptom Trajectory *</label>
                      <select
                        className="form-input"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}
                        value={checkinForm.improvement}
                        onChange={(e) => setCheckinForm({ ...checkinForm, improvement: e.target.value })}
                        required
                      >
                        <option value="improving">Improving 🟩</option>
                        <option value="same">Same (No change) 🟨</option>
                        <option value="worse">Worse (Deteriorating) 🟥</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Temp (°F)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}
                        value={checkinForm.temperature}
                        onChange={(e) => setCheckinForm({ ...checkinForm, temperature: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>New/Evolving Symptoms</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dry cough started..."
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}
                      value={checkinForm.newSymptoms}
                      onChange={(e) => setCheckinForm({ ...checkinForm, newSymptoms: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Daily notes..."
                      className="form-input"
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', flex: 1 }}
                      value={checkinForm.notes}
                      onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.75rem', boxShadow: 'none' }}
                      disabled={checkingIn}
                    >
                      <CheckCircle size={12} />
                      Log Day
                    </button>
                  </div>
                </form>

              </div>

            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '16px',
              padding: '2.5rem', textAlign: 'center', gap: '0.75rem'
            }}>
              <Calendar size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>No Active Health Trackers Configured</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.4' }}>
                7-day active daily log timelines are automatically triggered by the database when symptom assessments calculate a medium (moderate) or high clinical risk level.
              </p>
            </div>
          )}
        </section>

      </main>

      {/* ==========================================================================
         SIRI-STYLE CLINICAL AI FLOATING WIDGET
         ========================================================================== */}
      
      {/* Floating Circle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(6, 182, 212, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 999
        }}
        className="hover-pop"
        title="Dr. MediSense Clinical AI Chatbot"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Drawer Window */}
      <div className={`chat-drawer glass-card ${chatOpen ? 'open' : ''}`} style={{
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '20px'
      }}>
        {/* Chat Drawer Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: '0.85rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            borderRadius: '10px',
            padding: '0.45rem',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            <Activity size={18} color="#06b6d4" />
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Dr. MediSense AI</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>Screening Assistant</span>
          </div>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingRight: '0.25rem',
          marginBottom: '1rem'
        }}>
          {chatHistory.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '2rem', gap: '0.5rem', color: 'var(--text-muted)'
            }}>
              <MessageSquare size={24} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>No Dialogue History</span>
              <p style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>Describe your symptoms, ask medical screening questions, or learn about our diagnostic database!</p>
            </div>
          ) : (
            chatHistory.map(chat => (
              <div
                key={chat.chat_id}
                className={chat.message_type === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {chat.message_text}
              </div>
            ))
          )}
          
          {chatSending && (
            <div className="chat-bubble-bot" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem' }}>
              <span className="dot-pulse" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block' }}></span>
              <span className="dot-pulse" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animationDelay: '0.2s' }}></span>
              <span className="dot-pulse" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animationDelay: '0.4s' }}></span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleChatSend} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
          <input
            type="text"
            placeholder="Type clinical inquiry (e.g. chest pain)..."
            className="form-input"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', flex: 1 }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatSending}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', boxShadow: 'none' }}
            disabled={chatSending || !chatInput.trim()}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      <style>{`
        .spin-anim {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .dot-pulse {
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }
        .hover-pop:hover {
          transform: scale(1.08);
        }
      `}</style>

    </div>
  );
};

export default DashboardPage;
