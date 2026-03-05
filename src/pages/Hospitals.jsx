import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import SkeletonLoader from '../components/SkeletonLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { toast } from 'react-hot-toast'

export default function Hospitals() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const hospitals = [
        { name: 'Apollo Hospitals', city: 'Chennai', beds: '500+', emergency: true, teleconsult: true },
        { name: 'Fortis Healthcare', city: 'Mumbai', beds: '400+', emergency: true, teleconsult: true },
        { name: 'Max Super Speciality', city: 'New Delhi', beds: '350+', emergency: true, teleconsult: false },
        { name: 'Narayana Health', city: 'Bangalore', beds: '300+', emergency: true, teleconsult: true },
        { name: 'AIIMS Network', city: 'Pan-India', beds: '1000+', emergency: true, teleconsult: false },
    ]

    const [searchQuery, setSearchQuery] = useState('')

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Teleconsultation doctors
    const [teleconsultDoctors, setTeleconsultDoctors] = useState([])
    const [loadingDocs, setLoadingDocs] = useState(true)

    // Booking modal
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [showBooking, setShowBooking] = useState(false)
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState('')
    const [bookingError, setBookingError] = useState('')

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    useEffect(() => {
        async function fetchTeleconsultDoctors() {
            try {
                const { data, error } = await supabase.from('doctors').select('*').limit(6)
                if (data) {
                    setTeleconsultDoctors(data)
                }
            } catch (err) {
                // handle silently for display
            }
            setLoadingDocs(false)
        }
        fetchTeleconsultDoctors()
    }, [])

    const handleOpenBooking = (doctor) => {
        if (!user) { navigate('/login'); return }
        setSelectedDoctor(doctor)
        setShowBooking(true)
        setBookingSuccess('')
        setBookingError('')
    }

    const handleCloseBooking = () => {
        setShowBooking(false)
        setSelectedDoctor(null)
        setBookingDate('')
        setBookingTime('')
    }

    const handleConfirmBooking = async (e) => {
        e.preventDefault()
        setBookingLoading(true)
        setBookingError('')

        try {
            if (!user) {
                setBookingError('Session expired. Please log in again.')
                return
            }

            const today = new Date().toISOString().split('T')[0]
            if (bookingDate < today) {
                setBookingError('Date cannot be in the past.')
                setBookingLoading(false)
                return
            }

            if (!bookingTime) {
                setBookingError('Please select a time slot.')
                setBookingLoading(false)
                return
            }

            const { error: insertError } = await supabase.from('appointments').insert([{
                doctor_id: selectedDoctor.id,
                patient_id: user.id,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                appointment_type: 'teleconsultation',
                status: 'pending'
            }])
            if (insertError) throw insertError

            toast.success(`Teleconsultation booked with ${selectedDoctor.full_name}!`)
            setTimeout(handleCloseBooking, 1000)
        } catch (err) {
            setBookingError(err.message || 'Booking failed.')
            toast.error(err.message || 'Booking failed.')
        } finally {
            setBookingLoading(false)
        }
    }

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Hospital Network</h1>
                    <p className="page-subtitle">1,000+ integrated hospital partners nationwide.</p>
                </div>
            </section>

            {/* ─── Hospital Directory ─── */}
            <section className="section">
                <div className="container">
                    <Breadcrumbs items={[{ label: 'Hospitals', href: '/hospitals' }]} />
                    <div className="section-header">
                        <h2 className="section-title">Hospital Directory</h2>
                        <p className="section-subtitle">Partner hospitals across India with emergency and teleconsultation availability.</p>
                    </div>

                    <div className="search-bar" style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search hospitals by name or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hospital</th>
                                <th>City</th>
                                <th>Capacity</th>
                                <th>Emergency</th>
                                <th>Teleconsult</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHospitals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="dashboard-empty-icon" style={{ margin: '0 auto 1rem' }}>🔍</div>
                                        <h3 style={{ marginBottom: '0.5rem', color: '#1E293B', fontSize: '1.2rem', fontWeight: 600 }}>No hospitals found</h3>
                                        <p style={{ color: '#64748B' }}>We couldn't find any hospitals matching your search criteria.</p>
                                    </td>
                                </tr>
                            ) : filteredHospitals.map((h, i) => {
                                const hospitalId = h.name.toLowerCase().replace(/\s+/g, '-');
                                return (
                                    <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => navigate(`/hospitals/${hospitalId}`)}>
                                        <td>
                                            <strong>{h.name}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>View Details <span style={{ fontSize: '0.7rem' }}>→</span></div>
                                        </td>
                                        <td>{h.city}</td>
                                        <td>{h.beds}</td>
                                        <td>{h.emergency ? <span className="status-badge status-confirmed">Available</span> : '—'}</td>
                                        <td>
                                            {h.teleconsult
                                                ? <span className="status-badge teleconsult-badge">📹 Online</span>
                                                : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ─── Teleconsultation Services ─── */}
            <section className="section section-bg">
                <div className="container">
                    <div className="section-header">
                        <div className="teleconsult-title-row">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28, color: 'var(--accent)' }}>
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            <h2 className="section-title">Teleconsultation Services</h2>
                        </div>
                        <p className="section-subtitle">
                            Connect with certified specialists through secure, HIPAA-compliant video consultations from the comfort of your home.
                        </p>
                    </div>

                    {loadingDocs && (
                        <div className="dashboard-loading" style={{ width: '100%' }}>
                            <SkeletonLoader type="card" count={3} />
                        </div>
                    )}

                    {!loadingDocs && teleconsultDoctors.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">📹</div>
                            <h3>No Teleconsultation Doctors Available</h3>
                            <p>No doctors are currently available for video consultations. Please check back later.</p>
                        </div>
                    )}

                    {!loadingDocs && teleconsultDoctors.length > 0 && (
                        <div className="grid-3">
                            {teleconsultDoctors.map((doc, i) => (
                                <motion.div key={doc.id} className="card teleconsult-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.3), ease: 'easeOut' }}>
                                    <div className="teleconsult-card-top">
                                        <div className="teleconsult-avatar">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="card-title" style={{ marginBottom: '0.1rem' }}>{doc.full_name}</h3>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{doc.specialty || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="teleconsult-card-meta">
                                        <span className="appointment-label">Hospital</span>
                                        <span className="appointment-value">{doc.hospital || '—'}</span>
                                    </div>
                                    <div className="teleconsult-card-meta">
                                        <span className="appointment-label">Mode</span>
                                        <span className="teleconsult-badge status-badge">📹 Video</span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '0.75rem' }}
                                        onClick={() => handleOpenBooking(doc)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                        Book Video Consultation
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Booking Modal ─── */}
            {showBooking && selectedDoctor && (
                <div className="modal-overlay" onClick={handleCloseBooking}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseBooking}>✕</button>
                        <div className="modal-header">
                            <h2 className="modal-title">📹 Book Teleconsultation</h2>
                            <p className="modal-subtitle">Video call with {selectedDoctor.full_name}</p>
                        </div>
                        {bookingError && <div id="hosp-booking-error" className="auth-error" role="alert">{bookingError}</div>}
                        {!bookingSuccess && (
                            <form onSubmit={handleConfirmBooking}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required aria-invalid={!!bookingError} aria-describedby={bookingError ? "hosp-booking-error" : undefined} />
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
                                                    setBookingError('');
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
                                    {bookingError && !bookingTime && <div style={{ color: 'var(--emergency)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Please select a time slot.</div>}
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={bookingLoading} style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {bookingLoading ? <LoadingSpinner size="small" text="Booking..." /> : 'Confirm Teleconsultation'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
