import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../services/AuthContext';
import { MapPin, Clock, Star, Award, ShieldCheck, CalendarDays, Building2, Stethoscope, Phone } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import Breadcrumbs from '../components/ui/Breadcrumbs';

export default function DoctorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDoctor } = useAuth();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBooking, setShowBooking] = useState(false);

    // Hospital context passed from HospitalDetail page
    const fromHospital = location.state?.fromHospital || null;
    const hospitalId = location.state?.hospitalId || null;

    useEffect(() => {
        async function fetchDoctor() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setDoctor(data);
            } catch (err) {
                console.error("Error fetching doctor details:", err);
                setError("Unable to find doctor details.");
            } finally {
                setLoading(false);
            }
        }
        fetchDoctor();
    }, [id]);

    if (loading) {
        return (
            <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="section" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Doctor Not Found</h2>
                <p style={{ color: '#64748B', marginBottom: '2rem' }}>We couldn't find the requested doctor profile.</p>
                <button className="btn btn-primary" onClick={() => navigate('/hospitals')}>Browse Hospitals</button>
            </div>
        );
    }

    // Generate contextual data
    const mockRating = "4.8";
    const mockReviews = "124";
    const experience = doctor.experience || "12 Years";
    const hospitalDisplay = fromHospital || doctor.hospital || doctor.hospital_name || 'Khushi Hygieia Networks';
    const mockBio = `Dr. ${doctor.full_name} is an experienced specialist in ${doctor.specialty || 'General Medicine'} with a history of providing excellent patient care at ${hospitalDisplay}. Committed to staying updated with the latest medical advancements and delivering compassionate, comprehensive treatment.`;

    // Build breadcrumbs based on navigation context
    const breadcrumbItems = [];
    breadcrumbItems.push({ label: 'Hospitals', href: '/hospitals' });
    if (fromHospital && hospitalId) {
        breadcrumbItems.push({ label: fromHospital, href: `/hospitals/${hospitalId}` });
    }
    breadcrumbItems.push({ label: doctor?.full_name, href: '' });

    // Available time slots for display
    const timeSlots = [
        { day: 'Monday - Friday', time: '09:00 AM - 05:00 PM', available: true },
        { day: 'Saturday', time: '10:00 AM - 02:00 PM', available: true },
        { day: 'Sunday', time: 'Closed', available: false },
    ];

    return (
        <>
            <section className="section" style={{ paddingBottom: '1rem', paddingTop: '2rem' }}>
                <div className="container">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                        {/* Profile Sidebar */}
                        <div style={{ flex: '0 0 350px', maxWidth: '100%' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                borderRadius: 20,
                                padding: '2rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                textAlign: 'center',
                                border: '1px solid #E2E8F0'
                            }}>
                                <img
                                    src={doctor.profile_photo || doctor.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                    alt={doctor.full_name}
                                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1.5rem', display: 'block', border: '4px solid #EFF6FF' }}
                                    loading="lazy"
                                />
                                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0F172A' }}>{doctor.full_name}</h1>
                                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                    {doctor.specialty || 'General Practitioner'}
                                </p>
                                <div style={{ marginBottom: '1rem' }}>
                                    {(() => {
                                        const statusColors = {
                                            available: { bg: '#D1FAE5', text: '#059669', label: 'Available' },
                                            busy: { bg: '#FEF3C7', text: '#D97706', label: 'Busy' },
                                            offline: { bg: '#F3F4F6', text: '#6B7280', label: 'Offline' }
                                        };
                                        const status = doctor.availability_status || 'available';
                                        const s = statusColors[status] || statusColors.available;
                                        return (
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '100px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: s.bg,
                                                color: s.text,
                                                display: 'inline-block'
                                            }}>
                                                ● {s.label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Hospital Affiliation */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '1.5rem',
                                    color: '#475569',
                                    background: '#F1F5F9',
                                    padding: '0.65rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem'
                                }}>
                                    <Building2 size={16} color="var(--primary)" />
                                    <span style={{ fontWeight: 600 }}>{hospitalDisplay}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>
                                            <Star size={16} color="#F59E0B" fill="#F59E0B" /> {mockRating}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{mockReviews} Reviews</div>
                                    </div>
                                    <div style={{ width: 1, background: '#E2E8F0' }}></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>
                                            <Award size={16} color="#3B82F6" /> {experience}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Experience</div>
                                    </div>
                                </div>
                                {!isDoctor && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
                                        onClick={() => setShowBooking(true)}
                                    >
                                        <CalendarDays size={18} /> Book Appointment
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            {/* About Section */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 20,
                                padding: '2.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                marginBottom: '1.5rem',
                                border: '1px solid #E2E8F0'
                            }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    About Doctor
                                    {doctor.verified && <ShieldCheck size={20} color="#10B981" />}
                                </h2>
                                <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
                                    {mockBio}
                                </p>

                                {/* Specialization Info */}
                                <div style={{
                                    background: '#F8FAFC',
                                    borderRadius: 12,
                                    padding: '1.25rem',
                                    marginBottom: '2rem',
                                    border: '1px solid #E2E8F0'
                                }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Stethoscope size={18} /> Specialization
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600 }}>
                                            {doctor.specialty || 'General Medicine'}
                                        </span>
                                        {doctor.sub_specialty && (
                                            <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600 }}>
                                                {doctor.sub_specialty}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Available Appointment Slots */}
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarDays size={20} /> Available Appointment Slots
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    {timeSlots.map(slot => (
                                        <div key={slot.day} style={{
                                            background: slot.available ? '#F8FAFC' : '#FEF2F2',
                                            padding: '1rem',
                                            borderRadius: 12,
                                            border: `1px solid ${slot.available ? '#E2E8F0' : '#FECACA'}`
                                        }}>
                                            <p style={{ fontWeight: 600, color: slot.available ? '#1E293B' : '#991B1B', marginBottom: '0.25rem' }}>{slot.day}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: slot.available ? '#64748B' : '#DC2626', fontSize: '0.9rem' }}>
                                                <Clock size={16} /> {slot.time}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Hospital Affiliation */}
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A' }}>Hospital Affiliation</h2>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        background: '#F8FAFC',
                                        padding: '1.5rem',
                                        borderRadius: 12,
                                        cursor: hospitalId ? 'pointer' : 'default',
                                        border: '1px solid #E2E8F0',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => {
                                        if (hospitalId) navigate(`/hospitals/${hospitalId}`);
                                    }}
                                    onMouseEnter={(e) => {
                                        if (hospitalId) e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (hospitalId) e.currentTarget.style.borderColor = '#E2E8F0';
                                    }}
                                >
                                    <div style={{ width: 48, height: 48, background: '#E0E7FF', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                                        <Building2 size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.05rem', color: '#1E293B', marginBottom: '0.25rem' }}>{hospitalDisplay}</h3>
                                        <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                                            {hospitalId ? 'Click to view hospital details →' : 'Part of Khushi Hygieia Healthcare Network'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {showBooking && (
                <BookingModal
                    doctor={doctor}
                    onClose={() => setShowBooking(false)}
                    hospitalName={hospitalDisplay}
                />
            )}
        </>
    );
}
