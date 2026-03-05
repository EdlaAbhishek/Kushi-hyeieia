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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            // Create appointment object
            const appointmentData = {
                doctor_id: doctor.id,
                patient_id: user.id,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                status: 'pending'
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
                await supabase.from('appointments').insert([appointmentData]);

                // Add notification for the doctor
                try {
                    await supabase.from('notifications').insert([{
                        user_id: doctor.id,
                        message: `New appointment booked by ${user.user_metadata?.full_name || user.email || 'a patient'} for ${bookingDate} at ${bookingTime}`,
                        type: 'appointment_created',
                        read_status: false
                    }]);
                } catch (notifErr) {
                    console.warn("Could not send notification", notifErr);
                }

            } catch (dbErr) {
                console.warn("Could not save to Supabase, but saved to localStorage", dbErr);
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
                    <h2 className="modal-title">Book Appointment</h2>
                    <p className="modal-subtitle">Consulting with {doctor?.full_name}</p>
                </div>

                {error && <div id="booking-error" className="auth-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}

                <form onSubmit={handleConfirmBooking}>
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
                            {timeSlots.map(slot => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => {
                                        setBookingTime(slot);
                                        setError(''); // clear time error if selected
                                    }}
                                    style={{
                                        padding: '0.65rem 0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-sm)',
                                        border: bookingTime === slot ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                        background: bookingTime === slot ? '#EFF6FF' : '#fff',
                                        color: bookingTime === slot ? 'var(--primary)' : 'var(--text-main)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                        {error && !bookingTime && <div style={{ color: 'var(--emergency)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Please select a time slot.</div>}
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? <LoadingSpinner size="small" text="Confirming..." /> : 'Confirm Appointment'}
                    </button>
                </form>
            </div>
        </div>
    );
}
