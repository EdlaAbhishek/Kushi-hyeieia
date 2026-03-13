import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Activity, Users, Star, BedDouble, Stethoscope, ChevronRight, Video, Building2, ShieldCheck, Award, Search, X, ArrowRight, BadgeCheck, Heart, Thermometer } from 'lucide-react';
import { supabase } from '../services/supabase';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Fallback hospital data (matches Hospitals.jsx mock data)
const mockHospitals = [
    { id: 'apollo-hospitals-jubilee-hills', name: 'Apollo Hospitals, Jubilee Hills', city: 'Hyderabad', beds: '500+', emergency: true, teleconsult: true, rating: 4.8, address: 'Film Nagar Main Road, Near Chiranjeevi Guest House, Jubilee Hills, Hyderabad - 500033', phone: '040-23607777' },
    { id: 'apollo-hospitals-secunderabad', name: 'Apollo Hospitals, Secunderabad', city: 'Secunderabad', beds: '400+', emergency: true, teleconsult: true, rating: 4.7, address: 'Secunderabad (DRDO branch reference), Hyderabad', phone: '040-27201066' },
    { id: 'pace-hospitals-hitec-city', name: 'PACE Hospitals, HITEC City', city: 'Hyderabad', beds: '250+', emergency: true, teleconsult: true, rating: 4.7, address: 'Metro Pillar C1772, Beside Avasa Hotel, Hitech City Road, Hyderabad – 500081', phone: '040-44440000' },
    { id: 'care-hospitals-banjara-hills', name: 'CARE Hospitals, Banjara Hills', city: 'Hyderabad', beds: '350+', emergency: true, teleconsult: true, rating: 4.6, address: 'Road No.1, Banjara Hills, Hyderabad – 500034', phone: '040-30418888' },
    { id: 'yashoda-hospitals-secunderabad', name: 'Yashoda Hospitals, Secunderabad', city: 'Secunderabad', beds: '400+', emergency: true, teleconsult: true, rating: 4.8, address: 'Alexander Road, Secunderabad – 500003', phone: '040-45674567' },
    { id: 'citizens-specialty-hospital', name: 'Citizens Specialty Hospital, Nallagandla', city: 'Hyderabad', beds: '300+', emergency: true, teleconsult: true, rating: 4.7, address: '1-100/1/CCH, Citizens Hospital Rd, Nallagandla, Hyderabad - 500019', phone: '040-67171717' },
    { id: 'continental-hospitals-gachibowli', name: 'Continental Hospitals, Gachibowli', city: 'Hyderabad', beds: '750+', emergency: true, teleconsult: true, rating: 4.6, address: 'Plot No 3, Road No.2, Financial District, Gachibowli, Hyderabad – 500032', phone: '040-67000000' },
    { id: 'kims-hospitals-secunderabad', name: 'KIMS Hospitals, Secunderabad', city: 'Secunderabad', beds: '1000+', emergency: true, teleconsult: true, rating: 4.9, address: '1-8-31/1, Minister Road, Secunderabad, Hyderabad - 500003', phone: '040-44885000' },
];

export default function HospitalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);

    // Doctor listing states
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

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
                loadDoctors(data.name);
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
            loadDoctors(found.name);
        } else {
            const fallback = {
                id: id,
                name: decodeURIComponent(id).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                city: 'Metro City',
                beds: '250+',
                emergency: true,
                teleconsult: true,
                rating: 4.5,
                address: 'Central Health District'
            };
            setHospital(fallback);
            loadDoctors(fallback.name);
        }
        setLoading(false);
    }

    async function loadDoctors(hospitalName) {
        setDoctorsLoading(true);
        try {
            // Fetch all doctors associated with this hospital
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .ilike('hospital_name', `%${hospitalName}%`);

            if (!error && data && data.length > 0) {
                setDoctors(data);
            } else {
                // If no doctors found by hospital name, try fetching all doctors 
                // (small dataset, let user browse)
                const { data: allDocs, error: allErr } = await supabase
                    .from('doctors')
                    .select('*')
                    .limit(30);

                if (!allErr && allDocs) {
                    setDoctors(allDocs);
                } else {
                    setDoctors([]);
                }
            }
        } catch (err) {
            console.warn('Could not fetch doctors:', err);
            setDoctors([]);
        }
        setDoctorsLoading(false);
    }

    // Extract unique specialties from loaded doctors
    const availableSpecialties = useMemo(() => {
        if (!doctors || doctors.length === 0) return [];
        const specs = doctors
            .map(doc => doc.specialty)
            .filter(Boolean)
            .map(s => s.trim());
        return [...new Set(specs)].sort((a, b) => a.localeCompare(b));
    }, [doctors]);

    // Filter doctors by specialty and search query
    const filteredDoctors = useMemo(() => {
        let result = doctors;
        if (selectedSpecialty) {
            const selected = selectedSpecialty.trim().toLowerCase();
            result = result.filter(doc => (doc.specialty || '').trim().toLowerCase() === selected);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(doc =>
                (doc.full_name || '').toLowerCase().includes(query) ||
                (doc.specialty || '').toLowerCase().includes(query)
            );
        }
        return result;
    }, [doctors, selectedSpecialty, searchQuery]);

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

    // Generate About text
    const aboutText = `${hospital.name} is a premier healthcare facility located in ${hospital.city}. Equipped with ${hospital.beds || '200+'} beds and state-of-the-art medical infrastructure, the hospital provides comprehensive healthcare services across multiple specializations. ${hospital.emergency ? 'The hospital offers 24/7 emergency services with a dedicated trauma center.' : ''} ${hospital.teleconsult ? 'Patients can also access teleconsultation services for remote medical guidance.' : ''} The hospital is committed to delivering world-class patient care with a team of experienced and verified medical professionals.`;

    // Facility tags based on hospital data
    const facilities = [];
    if (hospital.emergency) facilities.push({ icon: <Activity size={14} />, label: '24/7 Emergency', color: '#DC2626', bg: '#FEE2E2' });
    facilities.push({ icon: <BedDouble size={14} />, label: `${hospital.beds || '200+'} Beds`, color: '#0284C7', bg: '#E0F2FE' });
    if (hospital.teleconsult) facilities.push({ icon: <Video size={14} />, label: 'Teleconsultation', color: '#16A34A', bg: '#F0FDF4' });
    facilities.push({ icon: <Heart size={14} />, label: 'ICU & Critical Care', color: '#7C3AED', bg: '#F3E8FF' });
    facilities.push({ icon: <Thermometer size={14} />, label: 'Diagnostics Lab', color: '#EA580C', bg: '#FFF7ED' });
    facilities.push({ icon: <Stethoscope size={14} />, label: 'OPD Services', color: '#0891B2', bg: '#ECFEFF' });

    return (
        <>
            {/* Breadcrumbs */}
            <section className="section" style={{ paddingBottom: '0.5rem', paddingTop: '2rem' }}>
                <div className="container">
                    <Breadcrumbs items={[
                        { label: 'Hospitals', href: '/hospitals' },
                        { label: hospital?.name, href: '' }
                    ]} />
                </div>
            </section>

            {/* ═══════ Hospital Hero Card ═══════ */}
            <section className="section" style={{ paddingTop: 0, paddingBottom: '1rem' }}>
                <div className="container">
                    <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #E2E8F0'
                    }}>
                        {/* Gradient banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #0A3069 100%)',
                            padding: '2rem 2.5rem 1.5rem',
                            color: '#fff',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative circles */}
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                            <div style={{ position: 'absolute', bottom: -60, right: 100, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: 16,
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Building2 size={28} />
                                        </div>
                                        <div>
                                            <h1 style={{ fontSize: '1.85rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                                {hospital.name}
                                            </h1>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', opacity: 0.9 }}>
                                                <MapPin size={16} />
                                                <span style={{ fontSize: '0.95rem' }}>{hospital.address}, {hospital.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating & Stats Row */}
                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.85rem',
                                            borderRadius: 100, fontSize: '0.9rem', fontWeight: 700
                                        }}>
                                            <Star size={16} fill="#FBBF24" color="#FBBF24" /> {hospital.rating}
                                        </div>
                                        {hospital.phone && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.85rem',
                                                borderRadius: 100, fontSize: '0.85rem', fontWeight: 600
                                            }}>
                                                <Phone size={14} /> {hospital.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignSelf: 'center' }}>
                                    <button
                                        className="btn"
                                        style={{
                                            background: '#fff', color: '#1565C0', fontWeight: 700,
                                            padding: '0.75rem 1.5rem', borderRadius: 12,
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => document.getElementById('doctors-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        View Doctors
                                    </button>
                                    <button
                                        className="btn"
                                        style={{
                                            background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600,
                                            padding: '0.75rem 1.5rem', borderRadius: 12,
                                            border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                                            backdropFilter: 'blur(10px)', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setShowContact(!showContact)}
                                    >
                                        Contact Hospital
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact panel (collapsible) */}
                        {showContact && (
                            <div style={{ padding: '1.5rem 2.5rem', background: '#F0F7FF', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0' }}>
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Emergency Helpline</p>
                                        <p style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{hospital.phone || '+91 1800-123-4567'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0' }}>
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Email Support</p>
                                        <p style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>contact@{hospital.name.toLowerCase().replace(/[^a-z]/g, '')}.com</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0' }}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Working Hours</p>
                                        <p style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>24/7 Open</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Facilities Tags */}
                        <div style={{ padding: '1.25rem 2.5rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
                            {facilities.map((f, i) => (
                                <span key={i} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.4rem 0.85rem', borderRadius: 100,
                                    fontSize: '0.82rem', fontWeight: 600,
                                    background: f.bg, color: f.color,
                                    transition: 'transform 0.2s'
                                }}>
                                    {f.icon} {f.label}
                                </span>
                            ))}
                        </div>

                        {/* About Section */}
                        <div style={{ padding: '2rem 2.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 size={20} color="var(--primary)" /> About {hospital.name}
                            </h2>
                            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '0.95rem', margin: 0 }}>
                                {aboutText}
                            </p>

                            {/* Stats grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1rem',
                                marginTop: '1.5rem'
                            }}>
                                <StatCard icon={<Star size={20} fill="#F59E0B" color="#F59E0B" />} value={hospital.rating} label="Rating" bg="#FFFBEB" />
                                <StatCard icon={<BedDouble size={20} color="#0284C7" />} value={hospital.beds || '200+'} label="Total Beds" bg="#F0F9FF" />
                                <StatCard icon={<Users size={20} color="#7C3AED" />} value={doctors.length || '–'} label="Doctors" bg="#F5F3FF" />
                                <StatCard icon={<Activity size={20} color="#DC2626" />} value={hospital.emergency ? 'Yes' : 'No'} label="Emergency 24/7" bg="#FEF2F2" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ Doctors Section ═══════ */}
            <section id="doctors-section" className="section" style={{ paddingTop: '0.5rem' }}>
                <div className="container">
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        padding: '2rem 2.5rem 2.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #E2E8F0'
                    }}>
                        {/* Section Header */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
                                <Stethoscope size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary)' }} />
                                Our Doctors
                            </h2>
                            <p style={{ color: '#64748B', fontSize: '0.92rem' }}>
                                {doctorsLoading ? 'Loading doctors...' : `${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''} available`}
                                {selectedSpecialty && ` in ${selectedSpecialty}`}
                            </p>
                        </div>

                        {/* ─── Specialty Filter Pills ─── */}
                        {availableSpecialties.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Filter by Specialization
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setSelectedSpecialty(null)}
                                        style={{
                                            background: !selectedSpecialty ? 'var(--primary)' : '#fff',
                                            color: !selectedSpecialty ? '#fff' : '#334155',
                                            border: `1.5px solid ${!selectedSpecialty ? 'var(--primary)' : '#CBD5E1'}`,
                                            padding: '0.45rem 1rem',
                                            borderRadius: 100,
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        All ({doctors.length})
                                    </button>
                                    {availableSpecialties.map(spec => {
                                        const count = doctors.filter(d => (d.specialty || '').trim().toLowerCase() === spec.toLowerCase()).length;
                                        return (
                                            <button
                                                key={spec}
                                                onClick={() => setSelectedSpecialty(prev => prev === spec ? null : spec)}
                                                style={{
                                                    background: selectedSpecialty === spec ? 'var(--primary)' : '#fff',
                                                    color: selectedSpecialty === spec ? '#fff' : '#334155',
                                                    border: `1.5px solid ${selectedSpecialty === spec ? 'var(--primary)' : '#CBD5E1'}`,
                                                    padding: '0.45rem 1rem',
                                                    borderRadius: 100,
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {spec} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── Search Bar ─── */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search doctors by name or specialty..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8',
                                            display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {selectedSpecialty && (
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setSelectedSpecialty(null)}
                                    style={{ fontSize: '0.8rem', padding: '0.55em 1em' }}
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>

                        {/* ─── Doctor Cards Grid ─── */}
                        {doctorsLoading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                                Loading doctors...
                            </div>
                        ) : filteredDoctors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                                <h3 style={{ color: '#334155', marginBottom: '0.5rem' }}>No doctors found</h3>
                                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                                    {searchQuery
                                        ? `No doctors match "${searchQuery}"`
                                        : selectedSpecialty
                                            ? `No ${selectedSpecialty} specialists at this hospital`
                                            : 'No doctors registered at this hospital yet'
                                    }
                                </p>
                                {(searchQuery || selectedSpecialty) && (
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => { setSearchQuery(''); setSelectedSpecialty(null); }}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="doctor-grid">
                                {filteredDoctors.map((doc, i) => {
                                    const statusColors = {
                                        available: { bg: '#D1FAE5', text: '#059669', label: 'Available' },
                                        busy: { bg: '#FEF3C7', text: '#D97706', label: 'Busy' },
                                        offline: { bg: '#F3F4F6', text: '#6B7280', label: 'Offline' }
                                    };
                                    const status = doc.availability_status || 'available';
                                    const s = statusColors[status] || statusColors.available;

                                    return (
                                        <motion.div
                                            className="doctor-card"
                                            key={doc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}
                                        >
                                            <div className="doctor-card-header">
                                                <div style={{ position: 'relative' }}>
                                                    <img
                                                        src={doc.profile_photo || doc.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                                        alt={doc.full_name}
                                                        className="doctor-avatar"
                                                        loading="lazy"
                                                    />
                                                    <div style={{
                                                        position: 'absolute', top: -5, right: -5,
                                                        padding: '2px 8px', borderRadius: 100,
                                                        fontSize: '0.65rem', fontWeight: 700,
                                                        background: s.bg, color: s.text,
                                                        border: '2px solid #fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {s.label}
                                                    </div>
                                                    {doc.teleconsultation_available && (
                                                        <div title="Video Consultation Available" style={{
                                                            position: 'absolute', bottom: 0, right: 0,
                                                            background: '#10B981', color: '#fff',
                                                            padding: '2px', borderRadius: '50%',
                                                            border: '2px solid #fff'
                                                        }}>
                                                            <Video size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="doctor-name">{doc.full_name}</h3>
                                                    <p className="doctor-specialty">{doc.specialty || 'General Physician'}</p>
                                                </div>
                                            </div>

                                            <div className="doctor-card-details">
                                                {doc.experience && (
                                                    <div className="doctor-detail-row">
                                                        <Award size={14} color="#3B82F6" />
                                                        <span>{doc.experience} years experience</span>
                                                    </div>
                                                )}
                                                <div className="doctor-detail-row">
                                                    <BadgeCheck size={14} color="#10B981" />
                                                    <span>{doc.verified ? 'Verified Professional' : 'Registered Professional'}</span>
                                                </div>
                                                {doc.bio && (
                                                    <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, margin: '0.25rem 0 0' }}>
                                                        {doc.bio.length > 80 ? doc.bio.slice(0, 80) + '...' : doc.bio}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={() => navigate(`/doctors/${doc.id}`, {
                                                    state: {
                                                        fromHospital: hospital?.name,
                                                        hospitalId: id
                                                    }
                                                })}
                                            >
                                                View Profile & Book <ArrowRight size={15} />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

/* ─── Stat Card Component ─── */
function StatCard({ icon, value, label, bg }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.85rem',
            padding: '1rem 1.25rem', background: bg, borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.04)'
        }}>
            <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                flexShrink: 0
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0F172A', lineHeight: 1.2 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>{label}</div>
            </div>
        </div>
    );
}
