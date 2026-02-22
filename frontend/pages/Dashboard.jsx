import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../services/AuthContext'

export default function Dashboard() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true)
            setFetchError(null)

            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !currentUser) {
                setFetchError('Unable to verify your session. Please log in again.')
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    appointment_time,
                    status,
                    appointment_type,
                    doctors (
                        full_name,
                        specialty,
                        hospital_name
                    )
                `)
                .eq('patient_id', currentUser.id)
                .order('appointment_date', { ascending: false })

            if (error) {
                console.error('Appointments fetch error:', error.message)
                setFetchError(error.message)
                setAppointments([])
            } else {
                setAppointments(data || [])
            }

            setLoading(false)
        }

        fetchAppointments()
    }, [])

    const getStatusClass = (status) => {
        switch (status) {
            case 'confirmed': return 'status-confirmed'
            case 'completed': return 'status-completed'
            case 'cancelled': return 'status-cancelled'
            default: return 'status-pending'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmed'
            case 'completed': return 'Completed'
            case 'cancelled': return 'Cancelled'
            default: return 'Pending'
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        const d = new Date(dateStr + 'T00:00:00')
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return '—'
        const [h, m] = timeStr.split(':')
        const hour = parseInt(h, 10)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${display}:${m} ${ampm}`
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {userName}.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Your Appointments</h2>
                        <p className="section-subtitle">
                            {loading
                                ? 'Loading your appointments...'
                                : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} found`}
                        </p>
                    </div>

                    {fetchError && (
                        <div className="auth-error" style={{ maxWidth: 600, margin: '0 auto 1.5rem' }}>
                            <strong>Error:</strong> {fetchError}
                        </div>
                    )}

                    {loading && (
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Fetching your appointments...</p>
                        </div>
                    )}

                    {!loading && !fetchError && appointments.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">📋</div>
                            <h3>No Appointments Yet</h3>
                            <p>You haven't booked any appointments. Browse our doctor network to get started.</p>
                            <Link to="/doctors" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
                                Book Appointment
                            </Link>
                        </div>
                    )}

                    {!loading && appointments.length > 0 && (
                        <div className="appointment-grid">
                            {appointments.map(appt => (
                                <div key={appt.id} className="appointment-card">
                                    <div className="appointment-card-header">
                                        <div className="appointment-doctor-info">
                                            <h3 className="appointment-doctor-name">
                                                {appt.doctors?.full_name || 'Doctor'}
                                            </h3>
                                            <p className="appointment-doctor-specialty">
                                                {appt.doctors?.specialty || '—'}
                                            </p>
                                        </div>
                                        <span className={`status-badge ${getStatusClass(appt.status)}`}>
                                            {getStatusLabel(appt.status)}
                                        </span>
                                    </div>

                                    <div className="appointment-card-body">
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Hospital</span>
                                            <span className="appointment-value">
                                                {appt.doctors?.hospital_name || '—'}
                                            </span>
                                        </div>
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Date</span>
                                            <span className="appointment-value">
                                                {formatDate(appt.appointment_date)}
                                            </span>
                                        </div>
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Time</span>
                                            <span className="appointment-value">
                                                {formatTime(appt.appointment_time)}
                                            </span>
                                        </div>
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Type</span>
                                            <span className="appointment-value">
                                                {appt.appointment_type === 'teleconsultation'
                                                    ? <span className="teleconsult-badge status-badge">📹 Video</span>
                                                    : 'In-Person'
                                                }
                                            </span>
                                        </div>
                                        {appt.appointment_type === 'teleconsultation' && appt.status === 'confirmed' && (
                                            <Link to={`/teleconsult/${appt.id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                                                📹 Join Consultation
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && appointments.length > 0 && (
                        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                            <Link to="/doctors" className="btn btn-outline">
                                Book Another Appointment
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}
