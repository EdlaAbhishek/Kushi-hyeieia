import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MapPin, BadgeCheck, Clock, TestTubes, CalendarDays, ArrowRight } from 'lucide-react'
import SkeletonLoader from '../components/SkeletonLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import InfoButton from '../components/ui/InfoButton'
import { toast } from 'react-hot-toast'

export default function Doctors() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [doctors, setDoctors] = useState([])
    const [selectedSpecialty, setSelectedSpecialty] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    // Booking states
    const [showBooking, setShowBooking] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState('')
    const [bookingError, setBookingError] = useState('')

    // Lab Test states
    const [labTest, setLabTest] = useState('')
    const [labDate, setLabDate] = useState('')
    const [labLoading, setLabLoading] = useState(false)
    const [labSuccess, setLabSuccess] = useState('')

    const labTestsList = [
        "Complete Blood Count (CBC)",
        "Lipid Profile",
        "Thyroid Profile (T3, T4, TSH)",
        "Diabetes Screening (HbA1c)",
        "Liver Function Test (LFT)",
        "Kidney Function Test (KFT)",
        "Vitamin D & B12",
        "Full Body Checkup"
    ]

    useEffect(() => {
        async function fetchDoctors() {
            setLoading(true)
            setFetchError(null)

            try {
                const { data, error } = await supabase.from('doctors').select('*')
                if (error) throw error
                setDoctors(data || [])
            } catch (err) {
                console.error('Fetch error:', err.message)
                setFetchError(err.message)
                setDoctors([])
            }

            setLoading(false)
        }
        fetchDoctors()
    }, [])

    const availableSpecialties = useMemo(() => {
        if (!doctors || doctors.length === 0) return []
        const specs = doctors
            .map(doc => doc.specialty)
            .filter(Boolean)
            .map(s => s.trim())
        return [...new Set(specs)].sort((a, b) => a.localeCompare(b))
    }, [doctors])

    const filteredDoctors = useMemo(() => {
        let result = doctors
        if (selectedSpecialty) {
            const selected = selectedSpecialty.trim().toLowerCase()
            result = result.filter(doc => (doc.specialty || '').trim().toLowerCase() === selected)
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(doc =>
                (doc.full_name || '').toLowerCase().includes(query) ||
                (doc.hospital || '').toLowerCase().includes(query) ||
                (doc.specialty || '').toLowerCase().includes(query)
            )
        }
        return result
    }, [doctors, selectedSpecialty, searchQuery])

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Doctor Network</h1>
                    <p className="page-subtitle">5,000+ verified specialists across India.</p>
                </div>
            </section>

            {/* ─── Specialty Filter ─── */}
            <section className="section">
                <div className="container">
                    <Breadcrumbs items={[{ label: 'Doctors', href: '/doctors' }]} />
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="section-title">Browse by Specialty</h2>
                            <p className="section-subtitle">Select a specialty to filter doctors.</p>
                        </div>
                        <InfoButton content={{
                            en: { title: 'Doctor Network', helps: 'Find verified specialists for your health needs.', usage: 'Filter specialists by their field or search for specific doctors/hospitals. Each doctor profile shows their expertise and real-time availability.' },
                            hi: { title: 'डॉक्टर नेटवर्क', helps: 'अपनी स्वास्थ्य आवश्यकताओं के लिए सत्यापित विशेषज्ञों को खोजें।', usage: 'विशेषज्ञों को उनके क्षेत्र के आधार पर फ़िल्टर करें या विशिष्ट डॉक्टरों/अस्पतालों की खोज करें। प्रत्येक डॉक्टर प्रोफ़ైల్ उनकी विशेषज्ञता और रीयल-टाइम उपलब्धता दिखाती है।' },
                            te: { title: 'డాక్టర్ నెట్‌వర్క్', helps: 'మీ ఆరోగ్య అవసరాల కోసం ధృవీకరించబడిన నిపుణులను కనుగొనండి.', usage: 'నిపుణులను వారి రంగం ఆధారంగా ఫిల్టర్ చేయండి లేదా నిర్దిష్ట వైద్యులు/ఆసుపత్రుల కోసం శోధించండి. ప్రతి డాక్టర్ ప్రొఫైల్ వారి నైపుణ్యం మరియు రియల్ టైమ్ లభ్యతను చూపుతుంది.' }
                        }} />
                    </div>

                    {!loading && availableSpecialties.length === 0 && (
                        <p style={{ color: '#64748B' }}>No specialties found in current inventory.</p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {availableSpecialties.map(spec => (
                            <button
                                key={spec}
                                onClick={() => setSelectedSpecialty(prev => prev === spec ? null : spec)}
                                className="specialty-pill"
                                style={{
                                    background: selectedSpecialty === spec ? 'var(--primary)' : '#fff',
                                    color: selectedSpecialty === spec ? '#fff' : '#334155',
                                    border: `1.5px solid ${selectedSpecialty === spec ? 'var(--primary)' : '#CBD5E1'}`,
                                    padding: '0.45rem 1rem',
                                    borderRadius: '100px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="search-bar" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, hospital, or specialty..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                                    }}
                                >
                                    ✕
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
                </div>
            </section>

            {/* ─── Doctor Cards ─── */}
            <section className="section" style={{ background: '#F8FAFC', paddingTop: '2.5rem' }}>
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title" style={{ color: '#1E293B' }}>
                            {selectedSpecialty ? `${selectedSpecialty} Specialists` : 'All Verified Doctors'}
                        </h2>
                        <p className="section-subtitle" style={{ color: '#64748B' }}>
                            {loading
                                ? 'Loading doctors...'
                                : `${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''} available`}
                        </p>
                    </div>

                    {fetchError && (
                        <div className="auth-error" style={{ maxWidth: 600, marginBottom: '1.5rem' }}>
                            <strong>Database error:</strong> {fetchError}
                        </div>
                    )}

                    {loading && (
                        <div className="dashboard-loading">
                            <SkeletonLoader type="card" count={6} />
                        </div>
                    )}

                    {!loading && !fetchError && filteredDoctors.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">🔍</div>
                            <h3>No doctors found</h3>
                            <p>No doctors available for <strong>{selectedSpecialty || 'the selected criteria'}</strong>.</p>
                        </div>
                    )}

                    {!loading && filteredDoctors.length > 0 && (
                        <div className="doctor-grid">
                            {filteredDoctors.map((doc, i) => {
                                const statusColors = {
                                    available: { bg: '#D1FAE5', text: '#059669', label: 'Available' },
                                    busy: { bg: '#FEF3C7', text: '#D97706', label: 'Busy' },
                                    offline: { bg: '#F3F4F6', text: '#6B7280', label: 'Offline' }
                                }
                                const status = doc.availability_status || 'available'
                                const s = statusColors[status] || statusColors.available

                                return (
                                    <motion.div className="doctor-card" key={doc.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}>
                                        <div className="doctor-card-header">
                                            <div style={{ position: 'relative' }}>
                                                <img src={doc.profile_photo || doc.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt={doc.full_name} className="doctor-avatar" loading="lazy" />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    right: -5,
                                                    padding: '2px 8px',
                                                    borderRadius: '100px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    background: s.bg,
                                                    color: s.text,
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    {s.label}
                                                </div>
                                                {doc.teleconsultation_available && (
                                                    <div title="Video Consultation Available" style={{ position: 'absolute', bottom: 0, right: 0, background: '#10B981', color: '#fff', padding: '2px', borderRadius: '50%', border: '2px solid #fff' }}>
                                                        <Clock size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="doctor-name">{doc.full_name}</h3>
                                                <p className="doctor-specialty">{doc.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="doctor-card-details">
                                            <div className="doctor-detail-row">
                                                <MapPin size={14} />
                                                <span>{doc.hospital || 'Hospital not listed'}</span>
                                            </div>
                                            <div className="doctor-detail-row">
                                                <BadgeCheck size={14} color="#10B981" />
                                                <span>Verified Professional</span>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate(`/doctors/${doc.id}`)}>
                                            View Profile & Book <ArrowRight size={15} />
                                        </button>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section >
        </>
    )
}
