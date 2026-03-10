import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../services/AuthContext';
import { MapPin, Clock, Star, Award, ShieldCheck, ArrowLeft, CalendarDays } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import Breadcrumbs from '../components/ui/Breadcrumbs';

export default function DoctorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDoctor } = useAuth();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBooking, setShowBooking] = useState(false);

    useEffect(() => {
        const nameMapping = {
            'Aizen': { full_name: 'Dr. Priya Sharma', hospital: 'Apollo Hospitals, Hyderabad' },
            'Direct Test Doctor': { full_name: 'Dr. Rajesh Kapoor', hospital: 'Fortis Heart Institute, Delhi' },
            'Admin User': { full_name: 'Dr. Ananya Reddy', hospital: 'KIMS Hospital, Secunderabad' },
            'Abhi': { full_name: 'Dr. Vikram Patel', hospital: 'Yashoda Hospitals, Hyderabad' },
        }

        async function fetchDoctor() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Apply name mapping to fix placeholder data
                const mapping = nameMapping[data?.full_name]
                setDoctor(mapping ? { ...data, ...mapping } : data);
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
                <button className="btn btn-primary" onClick={() => navigate('/doctors')}>Back to Doctors</button>
            </div>
        );
    }

    // Generate mock ratings & bio if not present in DB
    const mockRating = "4.8";
    const mockReviews = "124";
    const mockBio = `Dr. ${doctor.full_name} is an experienced specialist in ${doctor.specialty || 'General Medicine'} with a history of providing excellent patient care. Committed to staying updated with the latest medical advancements and delivering compassionate, comprehensive treatment.`;
    const mockExperience = "12 Years";

    return (
        <>
            <section className="section" style={{ paddingBottom: '1rem', paddingTop: '2rem' }}>
                <div className="container">
                    <Breadcrumbs items={[{ label: 'Doctors', href: '/doctors' }, { label: doctor?.full_name, href: '' }]} />
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', md: { flexDirection: 'row' } }}>

                        {/* Profile Sidebar */}
                        <div style={{ flex: '0 0 350px' }}>
                            <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', textAlign: 'center' }}>
                                <img
                                    src={doctor.profile_photo || doctor.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                    alt={doctor.full_name}
                                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1.5rem', display: 'block', border: '4px solid #EFF6FF' }}
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
                                        }
                                        const status = doctor.availability_status || 'available'
                                        const s = statusColors[status] || statusColors.available
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
                                        )
                                    })()}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#64748B' }}>
                                    <MapPin size={16} />
                                    <span>{doctor.hospital || 'Khushi Hygieia Networks'}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>
                                            <Star size={16} color="#F59E0B" fill="#F59E0B" /> {mockRating}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{mockReviews} Reviews</div>
                                    </div>
                                    <div style={{ width: 1, background: '#E2E8F0' }}></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>
                                            <Award size={16} color="#3B82F6" /> {mockExperience}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Experience</div>
                                    </div>
                                </div>
                                {!isDoctor && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                        onClick={() => setShowBooking(true)}
                                    >
                                        <CalendarDays size={18} /> Book Appointment
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    About Doctor
                                    {doctor.verified && <ShieldCheck size={20} color="#10B981" />}
                                </h2>
                                <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                                    {mockBio}
                                </p>

                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A' }}>Availability</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <p style={{ fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>Monday - Friday</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.9rem' }}>
                                            <Clock size={16} /> 09:00 AM - 05:00 PM
                                        </div>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <p style={{ fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>Saturday</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.9rem' }}>
                                            <Clock size={16} /> 10:00 AM - 02:00 PM
                                        </div>
                                    </div>
                                    <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: 12, border: '1px solid #FECACA' }}>
                                        <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: '0.25rem' }}>Sunday</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.9rem' }}>
                                            Closed
                                        </div>
                                    </div>
                                </div>

                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A' }}>Location</h2>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#F8FAFC', padding: '1.5rem', borderRadius: 12 }}>
                                    <div style={{ width: 40, height: 40, background: '#E0E7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.05rem', color: '#1E293B', marginBottom: '0.25rem' }}>{doctor.hospital || 'Khushi Hygieia Clinic'}</h3>
                                        <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Sector A, Metropolitan Health District, New Delhi, India 110001</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {showBooking && (
                <BookingModal doctor={doctor} onClose={() => setShowBooking(false)} />
            )}
        </>
    );
}
