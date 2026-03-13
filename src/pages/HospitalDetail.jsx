import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Activity, Users, Star, BedDouble, Stethoscope, ArrowLeft, ChevronRight, Video } from 'lucide-react';
import { supabase } from '../services/supabase';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BookingModal from '../components/BookingModal';
import { toast } from 'react-hot-toast';

// Fallback specialties
const FALLBACK_SPECIALTIES = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Oncology', 'Gastroenterology', 'Dermatology', 'General Physician'
];

// Mock data to match fallback hospitals (real data from CSV)
const mockHospitals = [
    { id: 'apollo-hospitals-jubilee-hills', name: 'Apollo Hospitals, Jubilee Hills', city: 'Hyderabad', beds: '500+', emergency: true, teleconsult: true, rating: 4.8, address: 'Film Nagar Main Road, Near Chiranjeevi Guest House, Jubilee Hills, Hyderabad - 500033' },
    { id: 'apollo-hospitals-secunderabad', name: 'Apollo Hospitals, Secunderabad', city: 'Secunderabad', beds: '400+', emergency: true, teleconsult: true, rating: 4.7, address: 'Secunderabad (DRDO branch reference), Hyderabad' },
    { id: 'pace-hospitals-hitec-city', name: 'PACE Hospitals, HITEC City', city: 'Hyderabad', beds: '250+', emergency: true, teleconsult: true, rating: 4.7, address: 'Metro Pillar C1772, Beside Avasa Hotel, Hitech City Road, Hyderabad – 500081' },
    { id: 'care-hospitals-banjara-hills', name: 'CARE Hospitals, Banjara Hills', city: 'Hyderabad', beds: '350+', emergency: true, teleconsult: true, rating: 4.6, address: 'Road No.1, Banjara Hills, Hyderabad – 500034' },
    { id: 'yashoda-hospitals-secunderabad', name: 'Yashoda Hospitals, Secunderabad', city: 'Secunderabad', beds: '400+', emergency: true, teleconsult: true, rating: 4.8, address: 'Alexander Road, Secunderabad – 500003' },
    { id: 'citizens-specialty-hospital', name: 'Citizens Specialty Hospital, Nallagandla', city: 'Hyderabad', beds: '300+', emergency: true, teleconsult: true, rating: 4.7, address: '1-100/1/CCH, Citizens Hospital Rd, Nallagandla, Hyderabad - 500019' },
    { id: 'continental-hospitals-gachibowli', name: 'Continental Hospitals, Gachibowli', city: 'Hyderabad', beds: '750+', emergency: true, teleconsult: true, rating: 4.6, address: 'Plot No 3, Road No.2, Financial District, Gachibowli, Hyderabad – 500032' },
    { id: 'kims-hospitals-secunderabad', name: 'KIMS Hospitals, Secunderabad', city: 'Secunderabad', beds: '1000+', emergency: true, teleconsult: true, rating: 4.9, address: '1-8-31/1, Minister Road, Secunderabad, Hyderabad - 500003' },
];

export default function HospitalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);

    // Stepped booking flow
    const [step, setStep] = useState(1); // 1 = specialties, 2 = doctors, 3 = booking modal
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        loadHospital();
    }, [id]);

    async function loadHospital() {
        setLoading(true);
        try {
            // Try DB first
            const { data, error } = await supabase
                .from('hospitals')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setHospital({
                    ...data,
                    beds: data.beds ? `${data.beds}+` : '200+',
                    emergency: data.emergency !== false,
                    teleconsult: data.teleconsult || false,
                    rating: data.rating || 4.5,
                    address: data.address || data.city || 'India',
                });
                loadSpecialties(data.id, data.name);
                setLoading(false);
                return;
            }
        } catch (err) {
            // Fall through to mock lookup
        }

        // Fallback: check mock hospitals
        const found = mockHospitals.find(h => h.id === id || h.name.toLowerCase().replace(/\s+/g, '-') === id);
        if (found) {
            setHospital(found);
        } else {
            setHospital({
                id: id,
                name: decodeURIComponent(id).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                city: 'Metro City',
                beds: '250+',
                emergency: true,
                teleconsult: true,
                rating: 4.5,
                address: 'Central Health District'
            });
        }
        loadSpecialties(null, found?.name || id);
        setLoading(false);
    }

    async function loadSpecialties(hospitalId, hospitalName) {
        try {
            // Try to get distinct specialties from doctors associated with this hospital
            let query = supabase.from('doctors').select('specialty');
            if (hospitalName) {
                query = query.or(`hospital.ilike.%${hospitalName}%,hospital_name.ilike.%${hospitalName}%`);
            }
            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                const unique = [...new Set(data.map(d => d.specialty).filter(Boolean))];
                if (unique.length > 0) {
                    setSpecialties(unique);
                    return;
                }
            }
        } catch (err) {
            console.warn('Could not fetch specialties:', err);
        }
        // Fallback specialties
        setSpecialties(FALLBACK_SPECIALTIES);
    }

    async function loadDoctors(specialty) {
        setDoctorsLoading(true);
        setSelectedSpecialty(specialty);
        setStep(2);
        try {
            const hospitalName = hospital?.name || '';
            let query = supabase.from('doctors').select('*')
                .ilike('specialty', `%${specialty}%`);

            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                setDoctors(data);
            } else {
                // Show fallback doctors for the specialty
                setDoctors([
                    { id: `fallback-1`, full_name: `Dr. ${specialty} Specialist`, specialty, experience: 10, hospital: hospitalName, rating: 4.6, availability_status: 'available' },
                    { id: `fallback-2`, full_name: `Dr. Senior ${specialty}`, specialty, experience: 15, hospital: hospitalName, rating: 4.8, availability_status: 'available' },
                ]);
            }
        } catch (err) {
            console.warn('Could not fetch doctors:', err);
            setDoctors([]);
        }
        setDoctorsLoading(false);
    }

    function selectDoctor(doc) {
        setSelectedDoctor(doc);
        setStep(3);
    }

    if (loading) {
        return (
            <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="section" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h2>Hospital Not Found</h2>
                <button className="btn btn-primary" onClick={() => navigate('/hospitals')} style={{ marginTop: '1rem' }}>
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <>
            <section className="section" style={{ paddingBottom: '1rem', paddingTop: '2rem' }}>
                <div className="container">
                    <Breadcrumbs items={[
                        { label: 'Hospitals', href: '/hospitals' },
                        { label: hospital?.name, href: '' }
                    ]} />
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    {/* Hospital Header Card */}
                    <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>{hospital.name}</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600, fontSize: '0.9rem' }}>
                                        <Star size={14} fill="currentColor" /> {hospital.rating}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '1.05rem', marginBottom: '1rem' }}>
                                    <MapPin size={18} /> {hospital.address}, {hospital.city}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {hospital.emergency && (
                                        <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Activity size={14} /> 24/7 Emergency
                                        </span>
                                    )}
                                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <BedDouble size={14} /> {hospital.beds} Beds
                                    </span>
                                    {hospital.teleconsult ? (
                                        <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Video size={14} /> Video Call Available
                                        </span>
                                    ) : (
                                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            In-Person Only
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', minWidth: '200px' }}>
                                <button className="btn btn-primary" onClick={() => { setStep(1); document.getElementById('booking-flow')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    Book Appointment
                                </button>
                                <button className="btn btn-outline" onClick={() => setShowContact(!showContact)}>
                                    Contact Hospital
                                </button>
                            </div>
                        </div>

                        {showContact && (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Emergency Helpline</p>
                                        <p style={{ fontWeight: 600, color: '#0F172A' }}>+91 1800-123-4567</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Email Support</p>
                                        <p style={{ fontWeight: 600, color: '#0F172A' }}>contact@{hospital.name.toLowerCase().replace(/\s+/g, '')}.com</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Stepped Booking Flow ─── */}
                    <div id="booking-flow" style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '2rem' }}>

                        {/* Booking Flow Header */}
                        <div style={{
                            display: 'flex', gap: '2rem', padding: '1rem 0',
                            borderBottom: '1px solid #E2E8F0', marginBottom: '2rem',
                            overflowX: 'auto', whiteSpace: 'nowrap'
                        }}>
                            <StepBadge num={1} label="Select Specialty" active={step === 1} done={step > 1} onClick={step > 1 ? () => setStep(1) : undefined} />
                            <StepBadge num={2} label="Choose Doctor" active={step === 2} done={step > 2} />
                        </div>

                        {/* Step 1: Select Specialty */}
                        {step === 1 && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0F172A' }}>
                                    <Stethoscope size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                    Select a Specialty
                                </h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose the medical department for your appointment.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {specialties.map(spec => (
                                        <button
                                            key={spec}
                                            onClick={() => loadDoctors(spec)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '1.25rem', background: '#F8FAFC', borderRadius: 12,
                                                border: '1.5px solid #E2E8F0', cursor: 'pointer',
                                                transition: 'all 0.2s ease', textAlign: 'left',
                                                fontWeight: 500, color: '#1E293B', fontSize: '0.95rem'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                                            {spec}
                                            <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#94A3B8' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Select Doctor */}
                        {step === 2 && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <button onClick={() => { setStep(1); setSelectedSpecialty(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#0F172A' }}>
                                        Doctors — {selectedSpecialty}
                                    </h2>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select a doctor to proceed with booking.</p>

                                {doctorsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                                        Loading doctors...
                                    </div>
                                ) : doctors.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                                        <p>No doctors found for this specialty at this hospital.</p>
                                        <button className="btn btn-outline" onClick={() => setStep(1)} style={{ marginTop: '1rem' }}>Try another specialty</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {doctors.map(doc => (
                                            <div
                                                key={doc.id}
                                                onClick={() => selectDoctor(doc)}
                                                style={{
                                                    padding: '1.5rem', background: '#F8FAFC', borderRadius: 16,
                                                    border: '1.5px solid #E2E8F0', cursor: 'pointer',
                                                    transition: 'all 0.2s ease', position: 'relative'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                                                    }}>
                                                        {(doc.full_name || doc.name || 'D')[0]}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
                                                            {doc.full_name || doc.name}
                                                        </h3>
                                                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                                            {doc.specialty}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                                    {doc.experience && (
                                                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 6, background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>
                                                            {doc.experience} yrs exp
                                                        </span>
                                                    )}
                                                    {doc.rating && (
                                                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 6, background: '#FEF3C7', color: '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            <Star size={10} fill="currentColor" /> {doc.rating}
                                                        </span>
                                                    )}
                                                    {doc.availability_status === 'available' && (
                                                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 6, background: '#F0FDF4', color: '#16A34A', fontWeight: 600 }}>
                                                            Available
                                                        </span>
                                                    )}
                                                </div>

                                                <button 
                                                    className="btn btn-primary" 
                                                    style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/doctors/${doc.id}`, {
                                                            state: { 
                                                                fromHospital: hospital?.name,
                                                                hospitalId: id 
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Book with this Doctor
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

/* ─── Step Badge Component ─── */
function StepBadge({ num, label, active, done, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none',
                cursor: onClick ? 'pointer' : 'default',
                padding: 0, fontSize: '0.9rem',
                color: active ? 'var(--primary)' : '#94A3B8',
                fontWeight: active ? 600 : 400,
                transition: 'color 0.2s ease'
            }}
        >
            <span style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                background: done ? 'var(--primary)' : active ? '#EFF6FF' : '#F1F5F9',
                color: done ? '#fff' : active ? 'var(--primary)' : '#94A3B8',
                border: active ? '2px solid var(--primary)' : '1.5px solid #E2E8F0',
                transition: 'all 0.2s ease'
            }}>
                {done ? '✓' : num}
            </span>
            {label}
        </button>
    );
}
