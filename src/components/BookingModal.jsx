import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import { MapPin, Calendar, Clock, User, Phone, Mail, FileText, Home, AlertCircle } from 'lucide-react';

export default function BookingModal({ doctor, onClose, hospitalName, urgentContext }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [appointmentType, setAppointmentType] = useState('in-person');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookedSlots, setBookedSlots] = useState([]);

    const status = doctor?.availability_status || 'available';

    const timeSlots = [
        "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30",
        "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00"
    ];

    const formatSlotDisplay = (slot) => {
        const [h, m] = slot.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${display}:${m} ${ampm}`;
    };

    // Auto-prefill logged-in user data
    useEffect(() => {
        if (user) {
            const metadata = user.user_metadata || {};
            setFullName(metadata.full_name || metadata.name || '');
            setEmail(user.email || '');
            setPhoneNumber(metadata.phone || metadata.phone_number || '');
        }
    }, [user]);

    // Pre-fill reason with symptoms from urgent triage context
    useEffect(() => {
        if (urgentContext?.symptoms && !reasonForVisit) {
            const prefix = urgentContext.triage ? `[${urgentContext.triage} Triage] ` : '';
            const conditions = urgentContext.possibleConditions ? ` | Possible: ${urgentContext.possibleConditions}` : '';
            setReasonForVisit(`${prefix}${urgentContext.symptoms}${conditions}`);
        }
    }, [urgentContext]);

    // Fetch already booked slots for the selected date + doctor
    useEffect(() => {
        async function fetchBookedSlots() {
            if (!bookingDate || !doctor?.id) return;
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('appointment_time')
                    .eq('doctor_id', doctor.id)
                    .eq('appointment_date', bookingDate)
                    .not('status', 'in', '("cancelled","rejected")');

                if (!error && data) {
                    setBookedSlots(data.map(a => a.appointment_time));
                }
            } catch (err) {
                console.warn('Could not fetch booked slots:', err);
            }
        }
        fetchBookedSlots();
    }, [bookingDate, doctor?.id]);

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!user) {
                setError('Session expired. Please log in again.');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            if (bookingDate < today) {
                setError('Appointment date cannot be in the past.');
                setLoading(false);
                return;
            }

            if (!bookingTime) {
                setError('Please select an available time slot.');
                setLoading(false);
                return;
            }

            if (!fullName.trim()) {
                setError('Please enter your full name.');
                setLoading(false);
                return;
            }

            if (!phoneNumber.trim()) {
                setError('Please enter your phone number.');
                setLoading(false);
                return;
            }

            if (!reasonForVisit.trim()) {
                setError('Please enter the reason for your visit.');
                setLoading(false);
                return;
            }

            // Create appointment record — status is PENDING (requires doctor approval)
            const appointmentData = {
                doctor_id: doctor.id,
                patient_id: user.id,
                hospital_id: doctor.hospital_id || null,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                appointment_type: appointmentType === 'telehealth' ? 'teleconsultation' : 'in_person',
                type: appointmentType === 'telehealth' ? 'telehealth' : 'in-person',
                status: 'pending',
                patient_name: fullName.trim(),
                patient_phone: phoneNumber.trim(),
                patient_email: email.trim(),
                patient_address: address.trim(),
                reason: reasonForVisit.trim(),
                symptoms: reasonForVisit.trim(),
                doctor_name: doctor.full_name || '',
                hospital_name: hospitalName || doctor.hospital_name || '',
                ...(urgentContext?.urgent ? {
                    priority: 'urgent',
                    triage_level: urgentContext.triage || 'Urgent',
                    patient_age: urgentContext.patientAge || null,
                    patient_gender: urgentContext.patientGender || null
                } : {})
            };

            // Save to Supabase
            try {
                const { error: dbError } = await supabase.from('appointments').insert([appointmentData]);
                if (dbError) throw dbError;

                // Add notification for the doctor
                try {
                    await supabase.from('notifications').insert([{
                        user_id: doctor.id,
                        message: `${urgentContext?.urgent ? '🚨 URGENT: ' : ''}New appointment request from ${fullName.trim()} for ${bookingDate} at ${formatSlotDisplay(bookingTime)} — Reason: ${reasonForVisit.trim().slice(0, 50)}`,
                        type: urgentContext?.urgent ? 'urgent_appointment' : 'appointment_created',
                        read_status: false
                    }]);
                } catch (notifErr) {
                    console.warn("Could not send notification", notifErr);
                }

            } catch (dbErr) {
                console.error("Supabase Save Error:", dbErr);
                toast.error("Database error: " + (dbErr.message || "Failed to save appointment."));
                setLoading(false);
                return;
            }

            // Store latest booking for confirmation page
            localStorage.setItem('latest_booking', JSON.stringify({
                ...appointmentData,
                doctor_name: doctor.full_name,
                doctor_hospital: hospitalName || doctor.hospital_name,
                doctor_specialty: doctor.specialty
            }));

            toast.success('Appointment request submitted! Awaiting doctor approval.');
            navigate('/appointment-confirmation');

        } catch (err) {
            console.error('Booking error:', err);
            toast.error(err.message || 'An unexpected error occurred.');
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2 className="modal-title">Request Appointment</h2>
                    <p className="modal-subtitle">
                        Consulting with <strong>{doctor?.full_name}</strong>
                        {(hospitalName || doctor?.hospital_name) && (
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
                                <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                {hospitalName || doctor?.hospital_name}
                            </span>
                        )}
                    </p>
                    {/* ─── URGENT PRIORITY BADGE ─── */}
                    {urgentContext?.urgent && (
                        <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem 1rem',
                            background: urgentContext.triage === 'Emergency'
                                ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                                : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                            border: `1.5px solid ${urgentContext.triage === 'Emergency' ? '#EF4444' : '#F59E0B'}`,
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            color: urgentContext.triage === 'Emergency' ? '#991B1B' : '#92400E',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>
                                <strong>{urgentContext.triage} Priority</strong> — This appointment is flagged as urgent based on your triage assessment.
                            </span>
                        </div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                        {(() => {
                            const statusColors = {
                                available: { bg: '#D1FAE5', text: '#059669', label: 'Available' },
                                busy: { bg: '#FEF3C7', text: '#D97706', label: 'Currently Busy' },
                                offline: { bg: '#F3F4F6', text: '#6B7280', label: 'Offline' }
                            };
                            const s = statusColors[status] || statusColors.available;
                            return (
                                <span style={{
                                    padding: '0.35rem 1rem',
                                    borderRadius: '100px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: s.bg,
                                    color: s.text,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    border: '1px solid currentColor'
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></span>
                                    {s.label}
                                </span>
                            );
                        })()}
                    </div>

                    {/* Pending notice */}
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                        Your appointment will be in <strong>Pending</strong> status until the doctor approves it.
                    </div>
                </div>

                {status !== 'available' && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '2rem',
                        textAlign: 'center',
                        background: '#FFFBEB',
                        borderRadius: '12px',
                        border: '1px solid #FEF3C7'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
                        <h3 style={{ color: '#92400E', marginBottom: '0.5rem' }}>Doctor is currently {status}</h3>
                        <p style={{ color: '#B45309', margin: 0, fontSize: '0.95rem' }}>
                            {status === 'busy'
                                ? "This doctor is currently busy. You can still submit a request."
                                : "Doctor is currently unavailable. Please check back later."
                            }
                        </p>
                        {status === 'offline' && (
                            <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
                                Choose Another Doctor
                            </button>
                        )}
                    </div>
                )}

                {status !== 'offline' && (
                    <>
                        {error && <div id="booking-error" className="auth-error" style={{ marginBottom: '1rem', marginTop: '1rem' }} role="alert">{error}</div>}

                        <form onSubmit={handleConfirmBooking} style={{ marginTop: '1.5rem' }}>
                            {/* Consultation Type */}
                            <div className="form-group">
                                <label className="form-label">Consultation Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className={`btn ${appointmentType === 'in-person' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setAppointmentType('in-person')}
                                        style={{ fontSize: '0.85rem', padding: '0.75rem 0.5rem' }}
                                    >
                                        🏥 Physical Visit
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${appointmentType === 'telehealth' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setAppointmentType('telehealth')}
                                        style={{ fontSize: '0.85rem', padding: '0.75rem 0.5rem' }}
                                    >
                                        📹 Video Call
                                    </button>
                                </div>
                            </div>

                            {/* Patient Information Section */}
                            <div style={{
                                background: '#F8FAFC',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                marginBottom: '1rem',
                                border: '1px solid #E2E8F0'
                            }}>
                                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} /> Patient Information
                                </h4>
                                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Full Name *</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>
                                            <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                            Phone Number *
                                        </label>
                                        <input
                                            className="form-control"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            required
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>
                                            <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                            Email
                                        </label>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{ fontSize: '0.85rem' }}>
                                        <Home size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                        Address
                                    </label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Your full address"
                                    />
                                </div>
                            </div>

                            {/* Reason for Visit */}
                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                    Reason for Visit *
                                </label>
                                <textarea
                                    className="form-control"
                                    value={reasonForVisit}
                                    onChange={e => setReasonForVisit(e.target.value)}
                                    required
                                    placeholder="Briefly describe your symptoms or reason for the visit..."
                                    rows={3}
                                    style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
                                />
                            </div>

                            {/* Appointment Date */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                    Appointment Date *
                                </label>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={bookingDate}
                                    onChange={e => setBookingDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Time Slots */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                    Available Time Slots *
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '0.5rem',
                                    marginTop: '0.5rem'
                                }}>
                                    {timeSlots.map(slot => {
                                        const isBooked = bookedSlots.includes(slot);
                                        const isSelected = bookingTime === slot;

                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                disabled={isBooked}
                                                onClick={() => {
                                                    setBookingTime(slot);
                                                    setError('');
                                                }}
                                                style={{
                                                    padding: '0.65rem 0.5rem',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                                    background: isSelected ? '#EFF6FF' : (isBooked ? '#F1F5F9' : '#fff'),
                                                    color: isSelected ? 'var(--primary)' : (isBooked ? '#94A3B8' : 'var(--text-main)'),
                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    outline: 'none',
                                                    opacity: isBooked ? 0.7 : 1,
                                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                    boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isBooked && !isSelected) {
                                                        e.currentTarget.style.borderColor = 'var(--primary-light)';
                                                        e.currentTarget.style.background = '#F8FAFC';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isBooked && !isSelected) {
                                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                                        e.currentTarget.style.background = '#fff';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }
                                                }}
                                            >
                                                {formatSlotDisplay(slot)}
                                                {isBooked && <div style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>Booked</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {error && !bookingTime && <div style={{ color: 'var(--emergency)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Please select a time slot.</div>}
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.85rem'
                                }}
                                disabled={loading}
                            >
                                {loading
                                    ? <LoadingSpinner size="small" text="Submitting Request..." />
                                    : `Submit Appointment Request`
                                }
                            </button>

                            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.75rem' }}>
                                Your appointment will remain <strong>Pending</strong> until the doctor approves it.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
