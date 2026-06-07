import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerPatient } from '../../services/patientService';
import { Users, LogOut, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PatientProfileSetupPage() {
  const { user, refreshPatientProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

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

      toast.success('Patient registry profile completed successfully!');
      await refreshPatientProfile();
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Profile activation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="auth-bg-glow"></div>
      <div className="auth-bg-glow-2"></div>

      <div className="card" style={{ maxWidth: '640px', width: '100%', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', boxShadow: 'var(--shadow-xl)', padding: '32px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-100)', color: 'var(--color-primary-dark)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Activate Patient Profile</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Complete your registry record to enable appointment booking</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost" 
            style={{ color: '#94a3b8' }} 
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
          Hello <strong>{user?.name}</strong>, since this is your first time signing in, please fill out your clinical demographic profile below. These details will be stored securely in the patient registry database.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Demographics */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '16px' }}>Demographics</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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

          <div className="form-group" style={{ marginBottom: '24px' }}>
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

          {/* Address */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Residential Address</h3>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Street Address *</label>
            <input 
              type="text" 
              placeholder="123 Health Avenue" 
              value={street} 
              onChange={e => setStreet(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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

          {/* Emergency Contact */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Emergency Contact</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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

          {/* Insurance Details */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Insurance details (Optional)</h3>
          
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Insurance Policy ID</label>
            <input 
              type="text" 
              placeholder="e.g. INS-904221" 
              value={insuranceId} 
              onChange={e => setInsuranceId(e.target.value)} 
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Save size={18} />
            {loading ? 'Activating Profile...' : 'Complete Profile Setup & Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
