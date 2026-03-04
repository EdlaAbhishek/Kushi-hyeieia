import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MapPin, BadgeCheck, Clock, TestTubes, CalendarDays, ArrowRight } from 'lucide-react'

export default function Doctors() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [doctors, setDoctors] = useState([])
    const [selectedSpecialty, setSelectedSpecialty] = useState(null)
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
        if (!selectedSpecialty) return doctors
        const selected = selectedSpecialty.trim().toLowerCase()
        return doctors.filter(doc => {
            const docSpecialty = (doc.specialty || '').trim().toLowerCase()
            return docSpecialty === selected
        })
    }, [doctors, selectedSpecialty])

    const handleOpenBooking = (doctor) => {
        if (!user) {
            navigate('/login')
            return
        }
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
                setTimeout(() => navigate('/login'), 2000)
                return
            }

            const today = new Date().toISOString().split('T')[0]
            if (bookingDate < today) {
                setBookingError('Appointment date cannot be in the past.')
                setBookingLoading(false)
                return
            }

            const { error: insertError } = await supabase.from('appointments').insert([{
                doctor_id: selectedDoctor.id,
                patient_id: user.id,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                status: 'pending'
            }])
            if (insertError) throw insertError

            setBookingSuccess(`Appointment booked successfully with ${selectedDoctor.full_name}!`)
            setTimeout(() => {
                handleCloseBooking()
            }, 2500)
        } catch (err) {
            console.error('Booking Catch:', err)
            setBookingError(err.message || 'An unexpected error occurred.')
        } finally {
            setBookingLoading(false)
        }
    }

    const handleLabBooking = (e) => {
        e.preventDefault()
        if (!user) {
            navigate('/login')
            return
        }
        setLabLoading(true)
        setLabSuccess('')

        // Mock backend request for lab booking
        setTimeout(() => {
            setLabLoading(false)
            setLabSuccess(`Successfully booked Home Collection for ${labTest} on ${labDate}. Our phlebotomist will contact you shortly.`)
            setLabTest('')
            setLabDate('')
        }, 1200)
    }

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
                    <div className="section-header">
                        <h2 className="section-title">Browse by Specialty</h2>
                        <p className="section-subtitle">Select a specialty to filter doctors.</p>
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

                    {selectedSpecialty && (
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setSelectedSpecialty(null)}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                            >
                                Clear Filter
                            </button>
                        </div>
                    )}
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
                            <div className="loading-spinner"></div>
                            <p>Fetching doctors from database...</p>
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
                            {filteredDoctors.map(doc => (
                                <div key={doc.id} className="doctor-card">
                                    <div className="doctor-card-top">
                                        <div className="doctor-avatar">
                                            <span style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                                                {doc.full_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 className="doctor-name">{doc.full_name}</h3>
                                            <p className="doctor-specialty-text">{doc.specialty}</p>
                                        </div>
                                        <span className={`status-badge ${doc.verified ? 'status-verified' : 'status-pending'}`}>
                                            {doc.verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="doctor-card-details">
                                        <div className="doctor-detail-row">
                                            <MapPin size={14} />
                                            <span>{doc.hospital || 'Hospital not listed'}</span>
                                        </div>
                                        <div className="doctor-detail-row">
                                            <Clock size={14} />
                                            <span>Available for appointments</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleOpenBooking(doc)}>
                                        Book Appointment <ArrowRight size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Lab Test Booking ─── */}
            <section className="section">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 340px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TestTubes size={20} />
                                </div>
                                <h2 className="section-title" style={{ margin: 0, fontSize: '1.35rem', color: '#1E293B' }}>Pathology & Diagnostics</h2>
                            </div>
                            <p style={{ color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
                                Get lab tests done from the comfort of your home. We send a certified phlebotomist to collect samples and deliver digital reports within 24 hours.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {labTestsList.map(t => (
                                    <span key={t} style={{ background: '#F1F5F9', color: '#475569', padding: '0.3rem 0.65rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 500 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: '1 1 340px', maxWidth: 480 }}>
                            <div className="form-card">
                                {labSuccess && (
                                    <div className="auth-success" style={{ marginBottom: '1.25rem' }}>
                                        ✓ {labSuccess}
                                    </div>
                                )}
                                <form onSubmit={handleLabBooking}>
                                    <div className="form-group">
                                        <label className="form-label">Select Lab Test / Package</label>
                                        <select className="form-control" value={labTest} onChange={(e) => setLabTest(e.target.value)} required>
                                            <option value="" disabled>Choose a test...</option>
                                            {labTestsList.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Preferred Collection Date</label>
                                        <input
                                            type="date" className="form-control"
                                            value={labDate} onChange={(e) => setLabDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]} required
                                        />
                                    </div>
                                    <button className="btn btn-primary" disabled={labLoading} style={{ width: '100%', marginTop: '0.25rem' }}>
                                        <CalendarDays size={16} />
                                        {labLoading ? 'Processing...' : 'Book Home Collection'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BOOKING MODAL */}
            {showBooking && (
                <div className="modal-overlay" onClick={handleCloseBooking}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseBooking}>&times;</button>

                        <div className="modal-header">
                            <h2 className="modal-title">Book Appointment</h2>
                            <p className="modal-subtitle">Consulting with {selectedDoctor?.full_name}</p>
                        </div>

                        {bookingError && <div className="auth-error" style={{ marginBottom: '1rem' }}>{bookingError}</div>}
                        {bookingSuccess && <div className="auth-success">{bookingSuccess}</div>}

                        {!bookingSuccess && (
                            <form onSubmit={handleConfirmBooking}>
                                <div className="form-group">
                                    <label className="form-label">Doctor Name</label>
                                    <input className="form-control" type="text" value={selectedDoctor?.full_name} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Appointment Date</label>
                                    <input
                                        className="form-control" type="date"
                                        value={bookingDate} onChange={e => setBookingDate(e.target.value)} required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preferred Time</label>
                                    <input
                                        className="form-control" type="time"
                                        value={bookingTime} onChange={e => setBookingTime(e.target.value)} required
                                    />
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={bookingLoading}>
                                    {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
