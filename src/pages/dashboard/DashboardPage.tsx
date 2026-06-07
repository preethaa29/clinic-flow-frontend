import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile, registerPatient } from '../../services/patientService';
import { toast } from 'react-hot-toast';
import {
  Users,
  CalendarDays,
  Stethoscope,
  Pill,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Profile Registration Modal State ──
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Form Fields
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [insuranceId, setInsuranceId] = useState('');

  // Check if patient profile is registered
  useEffect(() => {
    if (user && user.role === 'PATIENT') {
      getMyProfile()
        .then(profile => {
          if (!profile) {
            // Patient user doesn't have a record in patients table yet
            setShowRegisterModal(true);
            toast.error('Complete your patient registry to proceed.', { id: 'registry-warn' });
          }
        })
        .catch(err => {
          console.error('Failed to query patient profile status', err);
        });
    }
  }, [user]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRegisterLoading(true);

    try {
      const contactInfoJson = JSON.stringify({ email: user.email, phone: phone.trim() });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const primaryContact = `${emergencyName.trim()} (${emergencyPhone.trim()})`;

      await registerPatient({
        name: user.name,
        dob,
        gender,
        contactInfoJson,
        addressJson,
        primaryContact,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });

      toast.success('Patient registration completed successfully!');
      setShowRegisterModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const stats = [
    { label: 'Total Patients', value: '1,284', icon: <Users size={22} />, color: 'primary', trend: '+12%', trendDir: 'up' as const },
    { label: 'Today\'s Appointments', value: '18', icon: <CalendarDays size={22} />, color: 'info', trend: '3 remaining', trendDir: 'up' as const },
    { label: 'Active Encounters', value: '5', icon: <Stethoscope size={22} />, color: 'warning', trend: '2 urgent', trendDir: 'up' as const },
    { label: 'Pending Prescriptions', value: '23', icon: <Pill size={22} />, color: 'success', trend: '+8 today', trendDir: 'up' as const },
  ];

  const recentActivities = [
    { text: 'Encounter completed for Arjun Mehta', time: '5 minutes ago', color: 'var(--color-success)' },
    { text: 'New appointment scheduled — Priya Sharma', time: '15 minutes ago', color: 'var(--color-info)' },
    { text: 'Prescription issued for Ravi Kumar', time: '32 minutes ago', color: 'var(--color-primary)' },
    { text: 'Lab results received — Fatima Begum', time: '1 hour ago', color: 'var(--color-warning)' },
    { text: 'Patient registration — Suresh Patel', time: '2 hours ago', color: 'var(--color-success)' },
    { text: 'Invoice #1042 marked as paid', time: '3 hours ago', color: 'var(--color-primary)' },
  ];

  const todayAppointments = [
    { patient: 'Arjun Mehta', time: '09:00 AM', type: 'Follow-Up', status: 'COMPLETED' },
    { patient: 'Priya Sharma', time: '10:00 AM', type: 'New Visit', status: 'COMPLETED' },
    { patient: 'Ravi Kumar', time: '11:15 AM', type: 'Follow-Up', status: 'CHECKED_IN' },
    { patient: 'Fatima Begum', time: '02:00 PM', type: 'New Visit', status: 'SCHEDULED' },
    { patient: 'Suresh Patel', time: '03:30 PM', type: 'Emergency', status: 'SCHEDULED' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'COMPLETED': { cls: 'badge-success', label: 'Completed' },
      'CHECKED_IN': { cls: 'badge-info', label: 'Checked In' },
      'SCHEDULED': { cls: 'badge-warning', label: 'Scheduled' },
      'CANCELLED': { cls: 'badge-danger', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Here's what's happening at the clinic today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-card-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <div className={`stat-card-trend ${stat.trendDir}`}>
                <TrendingUp size={12} />
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/encounters/new')}>
            <div className="qa-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-dark)' }}>
              <Plus size={24} />
            </div>
            <h4>New Encounter</h4>
            <p>Start a clinical visit</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/prescriptions')}>
            <div className="qa-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Pill size={24} />
            </div>
            <h4>Write Prescription</h4>
            <p>Prescribe medication</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/encounters')}>
            <div className="qa-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Stethoscope size={24} />
            </div>
            <h4>View Encounters</h4>
            <p>Review clinical notes</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/appointments')}>
            <div className="qa-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <CalendarDays size={24} />
            </div>
            <h4>Appointments</h4>
            <p>Today's schedule</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              Today's Appointments
            </h3>
            <span className="badge badge-primary">{todayAppointments.length}</span>
          </div>
          <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((appt, i) => (
                  <tr key={i}>
                    <td className="cell-main">{appt.patient}</td>
                    <td>{appt.time}</td>
                    <td>{appt.type}</td>
                    <td>{getStatusBadge(appt.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
              Recent Activity
            </h3>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="activity-list">
            {recentActivities.map((activity, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: activity.color }} />
                <div className="activity-content">
                  <p>{activity.text}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mandatory Patient Registry Form Modal ── */}
      {showRegisterModal && (
        <div className="modal-overlay" style={{ background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal" style={{ maxWidth: '650px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}>
            <div className="modal-header" style={{ padding: '24px 24px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                Complete Patient Registry
              </h2>
            </div>
            
            <form onSubmit={handleRegisterSubmit}>
              <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                  To finalize your activation and enable scheduling, please fill in your demographic and primary contact details for your clinic record.
                </p>

                {/* Patient Name */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={user?.name || ''} 
                    disabled 
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* DOB */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Date of Birth *</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={e => setDob(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  {/* Gender */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Gender *</label>
                    <select 
                      value={gender} 
                      onChange={e => setGender(e.target.value)} 
                      required
                      style={{ width: '100%', padding: '10px 14px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phone number */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                  />
                </div>

                {/* Address Section */}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Address Details</h3>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Street Address *</label>
                  <input 
                    type="text" 
                    placeholder="123 Health Ave" 
                    value={street} 
                    onChange={e => setStreet(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>City *</label>
                    <input 
                      type="text" 
                      placeholder="Chennai" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>State *</label>
                    <input 
                      type="text" 
                      placeholder="TN" 
                      value={stateCode} 
                      onChange={e => setStateCode(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Zip *</label>
                    <input 
                      type="text" 
                      placeholder="600001" 
                      value={zip} 
                      onChange={e => setZip(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Primary Emergency Contact */}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Emergency Contact</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Name *</label>
                    <input 
                      type="text" 
                      placeholder="Jane Doe (Spouse)" 
                      value={emergencyName} 
                      onChange={e => setEmergencyName(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Phone *</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 00000" 
                      value={emergencyPhone} 
                      onChange={e => setEmergencyPhone(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Optional Insurance ID */}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Insurance Details (Optional)</h3>
                
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Insurance Policy ID</label>
                  <input 
                    type="text" 
                    placeholder="INS-104928" 
                    value={insuranceId} 
                    onChange={e => setInsuranceId(e.target.value)} 
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  type="submit" 
                  disabled={registerLoading}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {registerLoading ? 'Activating Profile...' : 'Complete Registration & Activate Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
