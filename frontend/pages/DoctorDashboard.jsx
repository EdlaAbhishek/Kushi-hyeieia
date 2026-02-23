import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function DoctorDashboard() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)

    // Post-care notes state
    const [notesModal, setNotesModal] = useState(null) // appointment id
    const [notesText, setNotesText] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)

    const fetchAppointments = async () => {
        setLoading(true)
        setFetchError(null)

        if (!user) { setFetchError('Session expired.'); setLoading(false); return }

        try {
            const data = await apiFetch('/api/appointments/doctor')
            setAppointments(data.appointments || [])
        } catch (err) {
            setFetchError(err.message)
            setAppointments([])
        }
        setLoading(false)
    }

    useEffect(() => { fetchAppointments() }, [user])

    const updateStatus = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId)
        try {
            await apiFetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            })
            setAppointments(prev => prev.map(a =>
                a.id === appointmentId ? { ...a, status: newStatus } : a
            ))
        } catch (err) {
            setFetchError(err.message)
        }
        setUpdatingId(null)
    }

    const openNotes = (appt) => {
        setNotesModal(appt.id)
        setNotesText(appt.notes || '')
    }

    const saveNotes = async () => {
        if (!notesModal) return
        setSavingNotes(true)

        try {
            await apiFetch(`/api/appointments/${notesModal}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes: notesText })
            })
            setAppointments(prev => prev.map(a =>
                a.id === notesModal ? { ...a, notes: notesText } : a
            ))
        } catch (err) {
            setFetchError(err.message)
        }
        setSavingNotes(false)
        setNotesModal(null)
    }

    const formatDate = (d) => {
        if (!d) return '—'
        return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const formatTime = (t) => {
        if (!t) return '—'
        const [h, m] = t.split(':')
        const hour = parseInt(h, 10)
        return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
    }

    const getStatusClass = (s) => {
        switch (s) {
            case 'confirmed': return 'status-confirmed'
            case 'completed': return 'status-completed'
            case 'cancelled': return 'status-cancelled'
            default: return 'status-pending'
        }
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'

    return (
        <>
            <section className="page-header doctor-header">
                <div className="container">
                    <h1 className="page-title">Doctor Dashboard</h1>
                    <p className="page-subtitle">Welcome back, Dr. {userName}</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">My Appointments</h2>
                        <p className="section-subtitle">
                            {loading ? 'Loading...' : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}
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
                            <p>Fetching appointments...</p>
                        </div>
                    )}

                    {!loading && appointments.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">📋</div>
                            <h3>No Appointments</h3>
                            <p>You don't have any patient appointments yet.</p>
                        </div>
                    )}

                    {!loading && appointments.length > 0 && (
                        <div className="doctor-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(appt => (
                                        <tr key={appt.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {appt.patient_name || 'Patient'}
                                            </td>
                                            <td>{formatDate(appt.appointment_date)}</td>
                                            <td>{formatTime(appt.appointment_time)}</td>
                                            <td>
                                                {appt.appointment_type === 'teleconsultation'
                                                    ? <span className="teleconsult-badge status-badge">📹 Video</span>
                                                    : <span style={{ fontSize: '0.85rem' }}>In-Person</span>
                                                }
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(appt.status)}`}>
                                                    {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                {appt.notes ? (
                                                    <span className="notes-preview" title={appt.notes} onClick={() => openNotes(appt)} style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.82rem' }}>
                                                        📝 {appt.notes.slice(0, 20)}{appt.notes.length > 20 ? '...' : ''}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                                        onClick={() => openNotes(appt)}
                                                    >
                                                        + Add
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <div className="doctor-actions">
                                                    {appt.status === 'pending' && (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                            disabled={updatingId === appt.id}
                                                            onClick={() => updateStatus(appt.id, 'confirmed')}
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {appt.status === 'confirmed' && (
                                                        <>
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                                disabled={updatingId === appt.id}
                                                                onClick={() => updateStatus(appt.id, 'completed')}
                                                            >
                                                                Complete
                                                            </button>
                                                            {appt.appointment_type === 'teleconsultation' && (
                                                                <Link to={`/teleconsult/${appt.id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                                                                    Join
                                                                </Link>
                                                            )}
                                                        </>
                                                    )}
                                                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                                                            disabled={updatingId === appt.id}
                                                            onClick={() => updateStatus(appt.id, 'cancelled')}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Post-Care Notes Modal */}
            {notesModal && (
                <div className="modal-overlay" onClick={() => setNotesModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setNotesModal(null)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Post-Care Instructions</h2>
                            <p className="modal-subtitle">
                                Patient: {appointments.find(a => a.id === notesModal)?.patient_name || 'Unknown'}
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Care Notes & Follow-up</label>
                            <textarea
                                className="form-control"
                                rows={6}
                                value={notesText}
                                onChange={e => setNotesText(e.target.value)}
                                placeholder="Enter post-care instructions, medication details, follow-up schedule..."
                                style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveNotes} disabled={savingNotes}>
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setNotesModal(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
