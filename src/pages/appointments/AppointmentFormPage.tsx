import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createAppointment, getClinicians, type Clinician } from '../../services/appointmentService';
import { searchPatients, getMyProfile } from '../../services/patientService';
import type { PatientResponseDto } from '../../models/types';
import { ArrowLeft, Save, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AppointmentFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);

  // Patient Select State
  const [patientMrn, setPatientMrn] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponseDto | null>(null);
  const [searchResults, setSearchResults] = useState<PatientResponseDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [patientError, setPatientError] = useState('');

  // Booking fields
  const [clinicianId, setClinicianId] = useState<number | ''>('');
  const [department, setDepartment] = useState('General Medicine');
  const [serviceType, setServiceType] = useState('Consultation');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [duration, setDuration] = useState(30); // minutes

  useEffect(() => {
    loadClinicians();
    loadPatientProfileIfPatient();
  }, [user]);

  useEffect(() => {
    if (location.state?.patient) {
      const p = location.state.patient as PatientResponseDto;
      setSelectedPatient(p);
      setPatientMrn(p.mrn);
    }
  }, [location.state]);

  const loadClinicians = async () => {
    try {
      const data = await getClinicians();
      setClinicians(data);
      if (data.length > 0) {
        setClinicianId(data[0].userId);
        setDepartment(data[0].department);
      }
    } catch (err) {
      console.error('Failed to load clinicians list', err);
    }
  };

  const loadPatientProfileIfPatient = async () => {
    if (user && user.role === 'PATIENT') {
      try {
        const profile = await getMyProfile();
        if (profile) {
          setSelectedPatient(profile);
          setPatientMrn(profile.mrn);
        } else {
          toast.error('Complete your patient registry first to schedule appointments.');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch patient profile', err);
      }
    }
  };

  const handlePatientSearch = async (val: string) => {
    if (user?.role === 'PATIENT') return; // Read-only for patients
    setPatientMrn(val);
    setPatientError('');
    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedPatient(null);
      return;
    }
    try {
      const results = await searchPatients(val);
      setSearchResults(results);
      setShowDropdown(true);

      const exact = results.find(p => p.mrn.toLowerCase() === val.trim().toLowerCase());
      if (exact) {
        setSelectedPatient(exact);
        setShowDropdown(false);
      } else {
        setSelectedPatient(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClinicianChange = (id: number) => {
    setClinicianId(id);
    const doc = clinicians.find(c => c.userId === id);
    if (doc) {
      setDepartment(doc.department);
    }
  };

  const formatLocalISO = (dateStr: string, timeStr: string) => {
    // Return format YYYY-MM-DDTHH:MM:SS
    return `${dateStr}T${timeStr}:00`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setPatientError('Please search and select a valid patient by MRN.');
      return;
    }
    if (!clinicianId) {
      toast.error('Please select a doctor.');
      return;
    }
    if (!bookingDate) {
      toast.error('Please choose a date.');
      return;
    }

    setLoading(true);

    try {
      const startAtStr = formatLocalISO(bookingDate, bookingTime);
      const startDate = new Date(startAtStr);
      
      // Calculate endAt based on duration
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const endAtStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

      await createAppointment({
        patientId: selectedPatient.patientId,
        clinicianId: Number(clinicianId),
        department,
        serviceType,
        startAt: startAtStr,
        endAt: endAtStr,
        createdById: user?.userId || 0,
        status: 'SCHEDULED'
      });

      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err: any) {
      console.error('Failed to create appointment', err);
      toast.error(err.message || 'Clinician already has an appointment in this slot or booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const isPatient = user?.role === 'PATIENT';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/appointments')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Book Appointment</h1>
            <p>Schedule a new patient visit and clinician slot</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Patient Selection */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Patient Information</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row-2">
              {isPatient ? (
                <div className="form-group" style={{ width: '100%' }}>
                  <label className="form-label">Booking For</label>
                  {selectedPatient && (
                    <div className="patient-summary-card" style={{ marginTop: '8px' }}>
                      <div className="patient-summary-icon">
                        <User size={18} />
                      </div>
                      <div className="patient-summary-info">
                        <div className="patient-summary-name">{selectedPatient.name}</div>
                        <div className="patient-summary-meta">
                          MRN: {selectedPatient.mrn} | DOB: {selectedPatient.dob} | Gender: {selectedPatient.gender}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group" style={{ position: 'relative', width: '100%' }}>
                  <label className="form-label">Patient MRN or Name <span className="required">*</span></label>
                  <div className="autocomplete-container">
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Type MRN or Name to search..."
                      value={patientMrn}
                      onChange={e => handlePatientSearch(e.target.value)}
                      onFocus={() => setShowDropdown(searchResults.length > 0)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      required
                    />
                    {showDropdown && searchResults.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {searchResults.map(p => (
                          <div
                            key={p.patientId}
                            className="autocomplete-item"
                            onMouseDown={() => {
                              setSelectedPatient(p);
                              setPatientMrn(p.mrn);
                              setSearchResults([]);
                              setShowDropdown(false);
                            }}
                          >
                            <div className="autocomplete-item-name">{p.name}</div>
                            <div className="autocomplete-item-sub">MRN: {p.mrn} | DOB: {p.dob}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {patientError && <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px' }}>{patientError}</div>}
                  
                  {selectedPatient && (
                    <div className="patient-summary-card" style={{ marginTop: '16px' }}>
                      <div className="patient-summary-icon">
                        <User size={18} />
                      </div>
                      <div className="patient-summary-info">
                        <div className="patient-summary-name">{selectedPatient.name}</div>
                        <div className="patient-summary-meta">
                          MRN: {selectedPatient.mrn} | DOB: {selectedPatient.dob} | Gender: {selectedPatient.gender}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctor & Schedule Selection */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Scheduling Details</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row-3">
              {/* Doctor Selection */}
              <div className="form-group">
                <label className="form-label">Select Doctor <span className="required">*</span></label>
                <select 
                  className="form-select" 
                  value={clinicianId} 
                  onChange={e => handleClinicianChange(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Choose a clinician...</option>
                  {clinicians.map(c => (
                    <option key={c.userId} value={c.userId}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label">Department</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. General Medicine" 
                  required
                />
              </div>

              {/* Service Type */}
              <div className="form-group">
                <label className="form-label">Service Type <span className="required">*</span></label>
                <select className="form-select" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                  <option value="Consultation">Consultation</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Routine Check">Routine Check</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Preventative">Preventative</option>
                </select>
              </div>
            </div>

            <div className="form-row-3" style={{ marginTop: '16px' }}>
              {/* Date */}
              <div className="form-group">
                <label className="form-label">Appointment Date <span className="required">*</span></label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Block past dates
                  required
                />
              </div>

              {/* Time */}
              <div className="form-group">
                <label className="form-label">Start Time <span className="required">*</span></label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={bookingTime} 
                  onChange={e => setBookingTime(e.target.value)}
                  required
                />
              </div>

              {/* Duration */}
              <div className="form-group">
                <label className="form-label">Duration <span className="required">*</span></label>
                <select 
                  className="form-select" 
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/appointments')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            <Save size={18} />
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
