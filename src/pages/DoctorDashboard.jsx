import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function DoctorDashboard() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)

    // Post-care notes state
    const [notesModal, setNotesModal] = useState(null)
    const [notesText, setNotesText] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)

    // ── Chat state ──
    const [chatOpen, setChatOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(true)
    const [chatError, setChatError] = useState(null)
    const messagesEndRef = useRef(null)

    // ── Confirm state ──
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, apptId: null, newStatus: null })

    const email = user?.email || ''

    const fetchAppointments = async () => {
        setLoading(true)
        setFetchError(null)

        if (!user) { setFetchError('Session expired.'); setLoading(false); return }

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', user.id)
                .order('appointment_date', { ascending: false })
            if (error) throw error
            setAppointments(data || [])

            const { data: notifData, error: notifError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            if (!notifError && notifData) {
                setNotifications(notifData)
            }

        } catch (err) {
            setFetchError(err.message)
            setAppointments([])
        }
        setLoading(false)
    }

    const markNotificationRead = async (id) => {
        try {
            await supabase.from('notifications').update({ read_status: true }).eq('id', id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n))
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => { fetchAppointments() }, [user])

    // ── Global chat ──
    useEffect(() => {
        const loadMessages = async () => {
            setChatLoading(true)
            setChatError(null)
            const { data, error } = await supabase
                .from('global_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100)
            if (error) {
                console.error("Chat load error:", error)
                setChatError(error.message)
            }
            if (!error && data) setMessages(data)
            setChatLoading(false)
        }
        loadMessages()

        const channel = supabase
            .channel('global-chat-doctor')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'global_messages' },
                (payload) => {
                    setMessages(prev => [...prev, payload.new])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        if (chatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, chatOpen])

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const msgContent = chatInput.trim()
        setChatInput('')
        const { error } = await supabase.from('global_messages').insert({
            user_id: user.id,
            user_name: user?.user_metadata?.full_name || email,
            user_role: 'doctor',
            content: msgContent,
        })
        if (error) {
            console.error("Chat send error:", error)
            toast.error(`Failed to send message: ${error.message}`)
        }
    }

    const handleUpdateStatus = (apptId, newStatus) => {
        if (newStatus === 'cancelled') {
            setConfirmModal({ isOpen: true, apptId, newStatus })
        } else {
            updateStatus(apptId, newStatus)
        }
    }

    const confirmStatusUpdate = () => {
        updateStatus(confirmModal.apptId, confirmModal.newStatus)
        setConfirmModal({ isOpen: false, apptId: null, newStatus: null })
    }

    const updateStatus = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId)
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId)
            setAppointments(prev => prev.map(a =>
                a.id === appointmentId ? { ...a, status: newStatus } : a
            ))
            toast.success(`Appointment marked as ${newStatus}.`)
        } catch (err) {
            setFetchError(err.message)
            toast.error(err.message)
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
            const { error } = await supabase
                .from('appointments')
                .update({ notes: notesText })
                .eq('id', notesModal)
            if (error) throw error
            setAppointments(prev => prev.map(a =>
                a.id === notesModal ? { ...a, notes: notesText } : a
            ))
            toast.success('Notes saved successfully!')
        } catch (err) {
            setFetchError(err.message)
            toast.error(err.message)
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

                    {/* Notifications Section */}
                    {notifications.length > 0 && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div className="section-header" style={{ marginBottom: '1rem' }}>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                    <AlertTriangle size={20} color="var(--primary)" /> Recent Notifications
                                </h2>
                            </div>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markNotificationRead(notif.id)}
                                        style={{
                                            background: notif.read_status ? '#F8FAFC' : '#EFF6FF',
                                            border: `1px solid ${notif.read_status ? '#E2E8F0' : '#BFDBFE'}`,
                                            padding: '1rem 1.25rem',
                                            borderRadius: 'var(--radius)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: notif.read_status ? 'default' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div>
                                            <p style={{ margin: 0, color: '#1E293B', fontWeight: notif.read_status ? 400 : 500, fontSize: '0.95rem' }}>
                                                {notif.message}
                                            </p>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                {new Date(notif.created_at).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        {!notif.read_status && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
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
                                                                onClick={() => handleUpdateStatus(appt.id, 'completed')}
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
                                                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
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

            {/* ── Floating Chat Button ── */}
            <button
                className={`floating-chat-btn ${chatOpen ? 'active' : ''}`}
                onClick={() => setChatOpen(!chatOpen)}
                title="Community Chat"
            >
                {chatOpen ? <X size={26} /> : <MessageCircle size={26} />}
            </button>

            {/* ── Floating Chat Panel ── */}
            <div className={`floating-chat-panel ${chatOpen ? 'open' : ''}`}>
                <div className="floating-chat-header">
                    <h4>💬 Community Chat</h4>
                    <button className="floating-chat-close" onClick={() => setChatOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="global-chat-messages">
                    {chatError && (
                        <div className="global-chat-empty" style={{ color: 'var(--emergency)' }}>
                            <MessageCircle size={32} />
                            <p style={{ textAlign: 'center' }}><strong>Database Error:</strong><br />{chatError}</p>
                            <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>You must run the SQL to create the <code>global_messages</code> table.</p>
                        </div>
                    )}
                    {chatLoading && !chatError && (
                        <div className="global-chat-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading messages...</p>
                        </div>
                    )}
                    {!chatLoading && !chatError && messages.length === 0 && (
                        <div className="global-chat-empty">
                            <MessageCircle size={32} />
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`global-msg ${msg.user_id === user?.id ? 'global-msg-own' : 'global-msg-other'}`}
                        >
                            <div className="global-msg-header">
                                <span className="global-msg-name">
                                    {msg.user_role === 'doctor' && <span className="doctor-chat-badge">Dr.</span>}
                                    {msg.user_name}
                                </span>
                                <span className="global-msg-time">
                                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="global-msg-content">{msg.content}</p>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="global-chat-input" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="form-control"
                    />
                    <button type="submit" className="btn btn-primary global-chat-send">
                        <Send size={18} />
                    </button>
                </form>
            </div>

            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title="Cancel Appointment?"
                message="Are you sure you want to cancel this patient appointment? This will notify the health system."
                confirmText="Yes, Cancel"
                cancelText="No, Keep it"
                onConfirm={confirmStatusUpdate}
                onCancel={() => setConfirmModal({ isOpen: false, apptId: null, newStatus: null })}
            />
        </>
    )
}
