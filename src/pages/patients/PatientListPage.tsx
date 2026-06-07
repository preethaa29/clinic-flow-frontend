import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAllPatients, 
  registerPatient, 
  updatePatient, 
  deactivatePatient 
} from '../../services/patientService';
import type { PatientResponseDto } from '../../models/types';
import { 
  Plus, 
  Search, 
  Users, 
  Edit2, 
  Eye, 
  X, 
  Save, 
  Calendar,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PatientListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Drawer States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponseDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [insuranceId, setInsuranceId] = useState('');

  useEffect(() => {
    if (user && user.role !== 'PATIENT') {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (err: any) {
      console.error('Failed to load patients', err);
      toast.error(err.message || 'Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to deactivate (soft-delete) this patient profile?')) return;
    try {
      await deactivatePatient(id);
      toast.success('Patient profile deactivated successfully');
      loadPatients();
      if (selectedPatient && selectedPatient.patientId === id) {
        setShowDetailsDrawer(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Deactivation failed');
    }
  };

  const resetForm = () => {
    setName('');
    setDob('');
    setGender('MALE');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('');
    setStateCode('');
    setZip('');
    setEmergencyName('');
    setEmergencyPhone('');
    setInsuranceId('');
  };

  const populateForm = (p: PatientResponseDto) => {
    setName(p.name);
    setDob(p.dob);
    setGender(p.gender);
    setInsuranceId(p.insuranceId || '');

    // Parse contact JSON
    try {
      const contact = JSON.parse(p.contactInfoJson);
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
    } catch (e) {
      setEmail('');
      setPhone('');
    }

    // Parse address JSON
    try {
      const address = JSON.parse(p.addressJson);
      setStreet(address.line1 || '');
      setCity(address.city || '');
      setStateCode(address.state || '');
      setZip(address.zip || '');
    } catch (e) {
      setStreet('');
      setCity('');
      setStateCode('');
      setZip('');
    }

    // Parse primary contact
    if (p.primaryContact) {
      const match = p.primaryContact.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        setEmergencyName(match[1]);
        setEmergencyPhone(match[2]);
      } else {
        setEmergencyName(p.primaryContact);
        setEmergencyPhone('');
      }
    } else {
      setEmergencyName('');
      setEmergencyPhone('');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const contactInfoJson = JSON.stringify({ email: email.trim(), phone: phone.trim() });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const primaryContact = `${emergencyName.trim()} (${emergencyPhone.trim()})`;

      await registerPatient({
        name: name.trim(),
        dob,
        gender,
        contactInfoJson,
        addressJson,
        primaryContact,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });

      toast.success('Patient registered successfully!');
      setShowCreateModal(false);
      resetForm();
      loadPatients();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setActionLoading(true);
    try {
      const contactInfoJson = JSON.stringify({ email: email.trim(), phone: phone.trim() });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const primaryContact = `${emergencyName.trim()} (${emergencyPhone.trim()})`;

      const updated = await updatePatient(selectedPatient.patientId, {
        name: name.trim(),
        dob,
        gender,
        contactInfoJson,
        addressJson,
        primaryContact,
        insuranceId: insuranceId.trim() || undefined,
        status: selectedPatient.status
      });

      toast.success('Patient details updated successfully!');
      setShowEditModal(false);
      setSelectedPatient(updated);
      loadPatients();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const parseContact = (jsonStr: string) => {
    try {
      const c = JSON.parse(jsonStr);
      return { email: c.email || '—', phone: c.phone || '—' };
    } catch (e) {
      return { email: '—', phone: '—' };
    }
  };

  const parseAddress = (jsonStr: string) => {
    try {
      const a = JSON.parse(jsonStr);
      return `${a.line1 || ''}, ${a.city || ''}, ${a.state || ''} ${a.zip || ''}`.trim() || '—';
    } catch (e) {
      return '—';
    }
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isStaff = user?.role !== 'PATIENT';

  if (!isStaff) {
    return (
      <div className="empty-state" style={{ marginTop: '80px' }}>
        <div className="empty-state-icon" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <AlertCircle size={28} />
        </div>
        <h3>Access Denied</h3>
        <p>You do not have administrative privileges to view the patient registry.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const filteredPatients = patients.filter(p => {
    const contact = parseContact(p.contactInfoJson);
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Patient Registry</h1>
          <p>Register, view, and manage clinical patient files</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus size={18} />
            Register Patient
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="header-search search-input">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by name, MRN, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
          <button
            key={status}
            className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'ALL' ? 'All Records' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Patients Table */}
      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} /></div>
          <h3>No patients found</h3>
          <p>Try refining your search terms or register a new patient profile.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Demographics</th>
                <th>Contact info</th>
                <th>Insurance Policy ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(p => {
                const contact = parseContact(p.contactInfoJson);
                return (
                  <tr 
                    key={p.patientId} 
                    className="clickable-row"
                    onClick={() => { setSelectedPatient(p); setShowDetailsDrawer(true); }}
                  >
                    <td>
                      <div className="cell-main">{p.name}</div>
                      <div className="cell-sub" style={{ letterSpacing: '0.5px' }}>MRN: {p.mrn}</div>
                    </td>
                    <td>
                      <div className="cell-main">{calculateAge(p.dob)} yrs old</div>
                      <div className="cell-sub">{p.gender}</div>
                    </td>
                    <td>
                      <div className="cell-main">{contact.phone}</div>
                      <div className="cell-sub">{contact.email}</div>
                    </td>
                    <td>
                      {p.insuranceId ? (
                        <span className="badge badge-primary">{p.insuranceId}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Not Insured</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        <span className="badge-dot"></span>
                        {p.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn btn-ghost btn-icon" 
                          onClick={() => { setSelectedPatient(p); setShowDetailsDrawer(true); }}
                          title="View Complete File"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon" 
                          onClick={() => { setSelectedPatient(p); populateForm(p); setShowEditModal(true); }}
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        {p.status === 'ACTIVE' && (
                          <button 
                            className="btn btn-ghost btn-icon" 
                            style={{ color: 'var(--color-danger)' }}
                            onClick={(e) => handleDeactivate(p.patientId, e)}
                            title="Deactivate Profile"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE PATIENT MODAL ── */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>Register New Patient Profile</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* Basic Info */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', fontSize: '0.95rem' }}>Basic Demographics</h3>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth <span className="required">*</span></label>
                    <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender <span className="required">*</span></label>
                    <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Contact Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input type="email" className="form-input" placeholder="john.doe@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number <span className="required">*</span></label>
                    <input type="tel" className="form-input" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                {/* Address Details */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Residential Address</h3>
                <div className="form-group">
                  <label className="form-label">Street Address <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="Apartment / Suite / Street address" value={street} onChange={e => setStreet(e.target.value)} required />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">City <span className="required">*</span></label>
                    <input type="text" className="form-input" placeholder="City" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State <span className="required">*</span></label>
                    <input type="text" className="form-input" placeholder="State code (e.g. TN)" value={stateCode} onChange={e => setStateCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code <span className="required">*</span></label>
                    <input type="text" className="form-input" placeholder="Postal Zip" value={zip} onChange={e => setZip(e.target.value)} required />
                  </div>
                </div>

                {/* Emergency Contact */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Primary Emergency Contact</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Name <span className="required">*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Jane Doe (Spouse)" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone <span className="required">*</span></label>
                    <input type="tel" className="form-input" placeholder="Emergency contact phone" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} required />
                  </div>
                </div>

                {/* Insurance Details */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Insurance Policy (Optional)</h3>
                <div className="form-group">
                  <label className="form-label">Insurance Provider / Policy ID</label>
                  <input type="text" className="form-input" placeholder="e.g. INS-10932201" value={insuranceId} onChange={e => setInsuranceId(e.target.value)} />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  <Save size={16} />
                  {actionLoading ? 'Saving...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PATIENT MODAL ── */}
      {showEditModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>Edit Patient Details — {selectedPatient.name}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* Basic Info */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', fontSize: '0.95rem' }}>Basic Demographics</h3>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth <span className="required">*</span></label>
                    <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender <span className="required">*</span></label>
                    <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Contact Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number <span className="required">*</span></label>
                    <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                {/* Address Details */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Residential Address</h3>
                <div className="form-group">
                  <label className="form-label">Street Address <span className="required">*</span></label>
                  <input type="text" className="form-input" value={street} onChange={e => setStreet(e.target.value)} required />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">City <span className="required">*</span></label>
                    <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State <span className="required">*</span></label>
                    <input type="text" className="form-input" value={stateCode} onChange={e => setStateCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code <span className="required">*</span></label>
                    <input type="text" className="form-input" value={zip} onChange={e => setZip(e.target.value)} required />
                  </div>
                </div>

                {/* Emergency Contact */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Primary Emergency Contact</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Name <span className="required">*</span></label>
                    <input type="text" className="form-input" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone <span className="required">*</span></label>
                    <input type="tel" className="form-input" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} required />
                  </div>
                </div>

                {/* Insurance Details */}
                <h3 className="form-section-title" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '16px', marginTop: '24px', fontSize: '0.95rem' }}>Insurance Policy (Optional)</h3>
                <div className="form-group">
                  <label className="form-label">Insurance Provider / Policy ID</label>
                  <input type="text" className="form-input" value={insuranceId} onChange={e => setInsuranceId(e.target.value)} />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  <Save size={16} />
                  {actionLoading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PATIENT DETAILS DRAWER ── */}
      {showDetailsDrawer && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailsDrawer(false)}>
          <div 
            className="drawer" 
            style={{ 
              position: 'fixed', 
              top: 0, 
              right: 0, 
              bottom: 0, 
              width: '460px', 
              background: 'var(--color-surface)', 
              boxShadow: 'var(--shadow-xl)', 
              zIndex: 100, 
              display: 'flex', 
              flexDirection: 'column',
              animation: 'slideIn 0.25s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Patient File Summary</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailsDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--color-primary-50)', color: 'var(--color-primary-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '1.2rem' }}>
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedPatient.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', letterSpacing: '0.5px', marginTop: '2px' }}>
                    MRN: <strong>{selectedPatient.mrn}</strong>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-bg)', borderRadius: '8px', marginBottom: '24px' }}>
                <span className={`badge ${selectedPatient.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  <span className="badge-dot"></span>
                  {selectedPatient.status === 'ACTIVE' ? 'Active Profile' : 'Inactive Profile'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => { populateForm(selectedPatient); setShowEditModal(true); }}
                  >
                    Edit File
                  </button>
                  {selectedPatient.status === 'ACTIVE' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ background: 'transparent', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                      onClick={(e) => handleDeactivate(selectedPatient.patientId, e)}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              {/* Core Information Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Age & DOB</h4>
                  <div style={{ fontSize: '0.875rem' }}>{calculateAge(selectedPatient.dob)} years old (DOB: {new Date(selectedPatient.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})</div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Gender</h4>
                  <div style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{selectedPatient.gender.toLowerCase()}</div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Info</h4>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div>📞 {parseContact(selectedPatient.contactInfoJson).phone}</div>
                    <div style={{ marginTop: '2px' }}>✉️ {parseContact(selectedPatient.contactInfoJson).email}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Home Address</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>🏠 {parseAddress(selectedPatient.addressJson)}</div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Emergency Contact</h4>
                  <div style={{ fontSize: '0.875rem' }}>🚨 {selectedPatient.primaryContact || '—'}</div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Insurance Policy</h4>
                  <div style={{ fontSize: '0.875rem' }}>
                    {selectedPatient.insuranceId ? (
                      <span className="badge badge-primary">ID: {selectedPatient.insuranceId}</span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Metadata</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Registered: {new Date(selectedPatient.createdAt).toLocaleString()}</div>
                    <div>Last Updated: {new Date(selectedPatient.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            {selectedPatient.status === 'ACTIVE' && (
              <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => navigate('/appointments/new', { state: { patient: selectedPatient } })}
                >
                  <Calendar size={16} /> Book Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer slide-in animation styles */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .clickable-row {
          cursor: pointer;
        }
        .drawer {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
