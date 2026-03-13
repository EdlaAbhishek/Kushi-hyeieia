import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

export default function AppointmentConfirmation() {
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('latest_booking');
        if (data) {
            setBookingDetails(JSON.parse(data));
        } else {
            // Default or redirect if no data
            navigate('/hospitals');
        }
    }, [navigate]);

    if (!bookingDetails) return null;

    return (
        <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ maxWidth: 600 }}>
                <div style={{ background: '#fff', borderRadius: 20, padding: '3rem 2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <CheckCircle size={64} color="#10B981" />
                    </div>
                    <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>Appointment Request Submitted!</h1>
                    <p style={{ color: '#64748B', marginBottom: '1rem' }}>
                        Your appointment request has been submitted successfully. The doctor will review and approve your request.
                    </p>
                    <div style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 10,
                        padding: '0.75rem 1rem',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        ⏳ Status: <strong>Pending Doctor Approval</strong>
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                            Booking Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Doctor</p>
                                <p style={{ fontWeight: 600, color: '#0F172A' }}>{bookingDetails.doctor_name}</p>
                                <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{bookingDetails.doctor_specialty}</p>
                            </div>

                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Hospital/Clinic</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: '#0F172A' }}>
                                    <MapPin size={16} color="#64748B" />
                                    <span>{bookingDetails.doctor_hospital || 'Online Consultation'}</span>
                                </div>
                            </div>

                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Date</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: '#0F172A' }}>
                                    <CalendarDays size={16} color="#64748B" />
                                    <span>{new Date(bookingDetails.appointment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>

                            <div>
                                <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Time</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: '#0F172A' }}>
                                    <Clock size={16} color="#64748B" />
                                    <span>{bookingDetails.appointment_time}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/hospitals')}>
                            Browse Hospitals <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
