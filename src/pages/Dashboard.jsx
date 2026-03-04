import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MessageCircle, X, Send } from 'lucide-react'

export default function Dashboard() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    // ── Chat state ──
    const [chatOpen, setChatOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(true)
    const [chatError, setChatError] = useState(null)
    const messagesEndRef = useRef(null)

    const email = user?.email || ''

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true)
            setFetchError(null)

            try {
                if (!user) {
                    setFetchError('Unable to verify your session. Please log in again.')
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, doctors(*)')
                    .eq('patient_id', user.id)
                    .order('appointment_date', { ascending: false })
                if (error) throw error
                setAppointments(data || [])
            } catch (err) {
                console.error('Appointments fetch error:', err.message)
                setFetchError(err.message)
                setAppointments([])
            }

            setLoading(false)
        }

        fetchAppointments()
    }, [user])

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
            .channel('global-chat')
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
            user_role: user?.user_metadata?.role || 'patient',
            content: msgContent,
        })
        if (error) {
            console.error("Chat send error:", error)
            alert(`Failed to send message: ${error.message}`)
        }
    }

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
        </>
    )
}
