import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../services/AuthContext'

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

    useEffect(() => {
        async function fetchDoctors() {
            setLoading(true)
            setFetchError(null)

            const { data, error } = await supabase
                .from('doctors')
                .select('*')

            if (error) {
                console.error('Supabase fetch error:', error.message)
                setFetchError(error.message)
                setDoctors([])
            } else {
                setDoctors(data || [])
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
            // 1. Fresh check of the logged-in user to satisfy RLS
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !currentUser) {
                setBookingError('Session expired. Please log in again.')
                setTimeout(() => navigate('/login'), 2000)
                return
            }

            // 2. Simple validation
            const today = new Date().toISOString().split('T')[0]
            if (bookingDate < today) {
                setBookingError('Appointment date cannot be in the past.')
                return
            }

            // 3. Construct booking data (Exact columns confirmed by schema check)
            const bookingData = {
                patient_id: currentUser.id,
                doctor_id: selectedDoctor.id,
                appointment_date: bookingDate,
                appointment_time: bookingTime,
                status: 'pending'
            }

            console.log('Final booking attempt with:', bookingData)

            const { error: insertError } = await supabase
                .from('appointments')
                .insert([bookingData])

            if (insertError) {
                console.error('Record Insert Error:', insertError)
                if (insertError.code === '42501') {
                    throw new Error('RLS Error: Your account does not have permission to insert into appointments. Please verify database policies.')
                }
                throw new Error(insertError.message || 'Failed to book appointment.')
            }

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

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Doctor Network</h1>
                    <p className="page-subtitle">5,000+ verified specialists across India.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Browse by Specialty</h2>
                        <p className="section-subtitle">Select a specialty to filter doctors.</p>
                    </div>

                    {!loading && availableSpecialties.length === 0 && (
                        <p style={{ color: 'var(--text-muted)' }}>No specialties found in current inventory.</p>
                    )}

                    <div className="grid-3">
                        {availableSpecialties.map(spec => (
                            <div
                                key={spec}
                                className={`card specialty-card${selectedSpecialty === spec ? ' specialty-active' : ''}`}
                                onClick={() => setSelectedSpecialty(prev => prev === spec ? null : spec)}
                            >
                                <h3 className="card-title">{spec}</h3>
                                <p className="card-text">Specialised care in {spec.toLowerCase()} for patient wellness.</p>
                            </div>
                        ))}
                    </div>

                    {selectedSpecialty && (
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setSelectedSpecialty(null)}
                            >
                                Show All Doctors
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section className="section section-bg">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            {selectedSpecialty ? `${selectedSpecialty} Specialists` : 'All Verified Doctors'}
                        </h2>
                        <p className="section-subtitle">
                            {loading
                                ? 'Loading doctors...'
                                : `${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''} found`}
                        </p>
                    </div>

                    {fetchError && (
                        <div className="auth-error" style={{ maxWidth: 600, margin: '0 auto 1.5rem' }}>
                            <strong>Database error:</strong> {fetchError}
                        </div>
                    )}

                    {loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                            Fetching doctors from database...
                        </p>
                    )}

                    {!loading && !fetchError && filteredDoctors.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                            No doctors available for <strong>{selectedSpecialty || 'the selected criteria'}</strong>.
                        </p>
                    )}

                    {!loading && filteredDoctors.length > 0 && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Specialty</th>
                                    <th>Hospital</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.map(doc => (
                                    <tr key={doc.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{doc.full_name}</td>
                                        <td>{doc.specialty}</td>
                                        <td>{doc.hospital || '—'}</td>
                                        <td>
                                            <span className={`status-badge ${doc.verified ? 'status-verified' : 'status-pending'}`}>
                                                {doc.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                onClick={() => handleOpenBooking(doc)}
                                            >
                                                Book
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
                                        className="form-control"
                                        type="date"
                                        value={bookingDate}
                                        onChange={e => setBookingDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preferred Time</label>
                                    <input
                                        className="form-control"
                                        type="time"
                                        value={bookingTime}
                                        onChange={e => setBookingTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    disabled={bookingLoading}
                                >
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
