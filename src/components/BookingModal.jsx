import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

export default function BookingModal({ doctor, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [appointmentType, setAppointmentType] = useState('in-person');
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookedSlots, setBookedSlots] = useState(['10:00 AM', '02:30 PM']); // Mocked booked slots
    const status = doctor?.availability_status || 'available';

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM"
    ];

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

            // Create appointment object matching existing database schema
            const appointmentData = {
                doctor_id: doctor.id,
                patient_id: user.id,
                patient_name: (appointmentType === 'telehealth' && anonymousMode)
                    ? 'Private Patient'
                    : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email),
                patient_email: (appointmentType === 'telehealth' && anonymousMode) ? null : user?.email,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                appointment_type: appointmentType === 'telehealth' ? 'teleconsultation' : 'in_person',
                status: 'pending',
                anonymous_consultation: (appointmentType === 'telehealth' && anonymousMode)
            };

            // Store in localStorage as requested (mock)
            const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            existingAppointments.push({
                ...appointmentData,
                id: Date.now().toString(),
                doctor_name: doctor.full_name,
                doctor_specialty: doctor.specialty
            });
            localStorage.setItem('appointments', JSON.stringify(existingAppointments));

            // Also try to save to supabase if it's set up
            try {
                const { error: dbError } = await supabase.from('appointments').insert([appointmentData]);
                if (dbError) throw dbError;

                // Add notification for the doctor
                try {
                    await supabase.from('notifications').insert([{
                        user_id: doctor.id,
                        message: `New ${appointmentData.appointment_type} appointment booked by ${user.user_metadata?.full_name || user.email || 'a patient'} for ${bookingDate} at ${bookingTime}`,
                        type: 'appointment_created',
                        read_status: false
                    }]);
                } catch (notifErr) {
                    console.warn("Could not send notification", notifErr);
                }

            } catch (dbErr) {
                console.error("Supabase Save Error:", dbErr);
                toast.error("Fixed-point database error: " + (dbErr.message || "Failed to sync with cloud."));
                setBookingLoading(false);
                return; // Stop here if DB insert fails
            }

            // Store current booking details for the confirmation page
            localStorage.setItem('latest_booking', JSON.stringify({
                ...appointmentData,
                doctor_name: doctor.full_name,
                doctor_hospital: doctor.hospital,
                doctor_specialty: doctor.specialty
            }));

            // Navigate to confirmation page
            toast.success('Appointment booked successfully!');
            navigate('/appointment-confirmation');

        } catch (err) {
            console.error('Booking Catch:', err);
            toast.error(err.message || 'An unexpected error occurred.');
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2 className="modal-title">Confirm Consultation</h2>
                    <p className="modal-subtitle">Consulting with {doctor?.full_name}</p>
                    <div style={{ marginTop: '0.75rem' }}>
                        {(() => {
                            const statusColors = {
                                available: { bg: '#D1FAE5', text: '#059669', label: 'Available' },
                                busy: { bg: '#FEF3C7', text: '#D97706', label: 'Currently Busy' },
                                offline: { bg: '#F3F4F6', text: '#6B7280', label: 'Offline' }
                            }
                            const s = statusColors[status] || statusColors.available
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
                            )
                        })()}
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
                                ? "This doctor is currently busy. Please try later."
                                : "Doctor is currently unavailable. Please check back later."
                            }
                        </p>
                        <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
                            Choose Another Doctor
                        </button>
                    </div>
                )}

                {status === 'available' && (
                    <>
                        {error && <div id="booking-error" className="auth-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}

                        <form onSubmit={handleConfirmBooking}>
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

                            {/* Anonymous Consultation Toggle — only for telehealth */}
                            {appointmentType === 'telehealth' && (
                                <div className="anon-toggle-bar">
                                    <div>
                                        <label>🔒 Anonymous Consultation</label>
                                        <div className="toggle-hint">Your identity will be hidden from the doctor</div>
                                    </div>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={anonymousMode}
                                            onChange={(e) => setAnonymousMode(e.target.checked)}
                                            id="anon-toggle"
                                        />
                                        <span className="toggle-slider" onClick={() => setAnonymousMode(!anonymousMode)}></span>
                                    </div>
                                </div>
                            )}


                            <div className="form-group">
                                <label className="form-label">Doctor Name</label>
                                <input className="form-control" type="text" value={doctor?.full_name} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Appointment Date</label>
                                <input
                                    className="form-control" type="date"
                                    value={bookingDate} onChange={e => setBookingDate(e.target.value)} required
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "booking-error" : undefined}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Available Time Slots</label>
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
                                                    setError(''); // clear time error if selected
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
                                                {slot}
                                                {isBooked && <div style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>Booked</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {error && !bookingTime && <div style={{ color: 'var(--emergency)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Please select a time slot.</div>}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                {loading ? <LoadingSpinner size="small" text="Confirming..." /> : `Confirm ${appointmentType === 'in-person' ? 'Physical' : 'Video'} Appointment`}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
