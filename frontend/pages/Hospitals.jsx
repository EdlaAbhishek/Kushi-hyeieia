import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { apiFetch } from '../services/api'

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

    useEffect(() => {
        async function fetchTeleconsultDoctors() {
            try {
                const data = await apiFetch('/api/doctors')
                if (data && data.doctors) {
                    setTeleconsultDoctors(data.doctors.slice(0, 6))
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

            await apiFetch('/api/appointments', {
                method: 'POST',
                body: JSON.stringify({
                    doctor_id: selectedDoctor.id,
                    appointment_date: bookingDate,
                    appointment_time: bookingTime,
                    appointment_type: 'teleconsultation'
                })
            })

            setBookingSuccess(`Teleconsultation booked with ${selectedDoctor.full_name}!`)
            setTimeout(handleCloseBooking, 2500)
        } catch (err) {
            setBookingError(err.message || 'Booking failed.')
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
                    <div className="section-header">
                        <h2 className="section-title">Hospital Directory</h2>
                        <p className="section-subtitle">Partner hospitals across India with emergency and teleconsultation availability.</p>
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
                            {hospitals.map(h => (
                                <tr key={h.name}>
                                    <td><strong>{h.name}</strong></td>
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
                            ))}
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
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading available doctors...</p>
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
                            {teleconsultDoctors.map(doc => (
                                <div key={doc.id} className="card teleconsult-card">
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
                                </div>
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
                        {bookingSuccess && <div className="auth-success">{bookingSuccess}</div>}
                        {bookingError && <div className="auth-error">{bookingError}</div>}
                        {!bookingSuccess && (
                            <form onSubmit={handleConfirmBooking}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preferred Time</label>
                                    <input type="time" className="form-control" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={bookingLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                                    {bookingLoading ? 'Booking...' : 'Confirm Teleconsultation'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
