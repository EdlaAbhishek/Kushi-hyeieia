import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MessageCircle, X, Send, AlertTriangle, Activity } from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import InfoButton from '../components/ui/InfoButton'
import { toast } from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockHealthData = [
    { month: 'Oct', score: 72 },
    { month: 'Nov', score: 75 },
    { month: 'Dec', score: 70 },
    { month: 'Jan', score: 85 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 92 },
]

export default function Dashboard({ activeTab = 'overview' }) {
    const { user } = useAuth()
    const navigate = useNavigate()
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

    // ── Confirm state ──
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, apptId: null })

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
            toast.error(`Failed to send message: ${error.message}`)
        }
    }

    const handleCancelAppointment = (id) => {
        setConfirmModal({ isOpen: true, apptId: id })
    }

    const confirmCancelAppointment = async () => {
        const { apptId } = confirmModal
        setConfirmModal({ isOpen: false, apptId: null })

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', apptId)

            if (error) throw error

            setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a))
            toast.success('Appointment cancelled successfully.')
        } catch (err) {
            toast.error(err.message)
        }
    }

    const startVideoCall = async (appt) => {
        try {
            // Check if session exists
            const { data, error } = await supabase
                .from('video_sessions')
                .select('id')
                .eq('appointment_id', appt.id)
                .maybeSingle()

            if (data) {
                navigate(`/video-call/${data.id}`)
            } else {
                // Create session
                const { data: newSession, error: createError } = await supabase
                    .from('video_sessions')
                    .insert({
                        appointment_id: appt.id,
                        doctor_id: appt.doctor_id,
                        patient_id: appt.patient_id,
                        status: 'waiting'
                    })
                    .select()
                    .single()

                if (createError) throw createError
                navigate(`/video-call/${newSession.id}`)
            }
        } catch (err) {
            toast.error("Could not start video session.")
            console.error(err)
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
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    {/* Personal Health Trends Panel (Only on Overview) */}
                    {activeTab === 'overview' && (
                        <div style={{ marginBottom: '3rem' }}>
                            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                    <Activity size={24} color="var(--primary)" /> Personal Health Trends
                                </h2>
                                <p className="section-subtitle">Your overall wellness score over time.</p>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockHealthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '5 5' }}
                                        />
                                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: 'var(--primary)', strokeWidth: 2, fill: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'overview' || activeTab === 'appointments') && (
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 className="section-title" style={{ margin: 0 }}>Your Appointments</h2>
                                <p className="section-subtitle" style={{ margin: 0 }}>
                                    {loading
                                        ? 'Loading your appointments...'
                                        : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} found`}
                                </p>
                            </div>
                            <InfoButton content={{
                                en: { title: 'Your Appointments', helps: 'This section organizes your upcoming and past medical visits so you can manage your healthcare schedule.', usage: 'View your scheduled doctors here. You can cancel an appointment if needed or click "Join Chat" to message the doctor if the feature is enabled.' },
                                hi: { title: 'आपकी नियुक्तियां', helps: 'यह अनुभाग आपकी आगामी और पिछली चिकित्सा यात्राओं को व्यवस्थित करता है ताकि आप अपनी स्वास्थ्य देखभाल अनुसूची का प्रबंधन कर सकें।', usage: 'यहाँ अपने निर्धारित डॉक्टरों को देखें। आप आवश्यक होने पर अपॉइंटमेंट रद्द कर सकते हैं या सुविधा सक्षम होने पर डॉक्टर को संदेश भेजने के लिए "चैट में शामिल हों" पर क्लिक कर सकते हैं।' },
                                te: { title: 'మీ అపాయింట్‌మెంట్‌లు', helps: 'ఈ విభాగం మీ రాబోయే మరియు గత వైద్య సందర్శనలను నిర్వహిస్తుంది, తద్వారా మీరు మీ ఆరోగ్య సంరక్షణ షెడ్యూల్‌ను నిర్వహించవచ్చు.', usage: 'ఇక్కడ షెడ్యూల్ చేయబడిన మీ వైద్యులను చూడండి. అవసరమైతే మీరు అపాయింట్‌మెంట్‌ను రద్దు చేయవచ్చు లేదా ఫీచర్ ప్రారంభించబడి ఉంటే డాక్టర్‌కు మెసేజ్ చేయడానికి "చాట్‌లో చేరండి" క్లిక్ చేయవచ్చు.' }
                            }} />
                        </div>
                    )}

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
                            {appointments.map((appt, i) => (
                                <motion.div key={appt.id} className="appointment-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}>
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
                                                    ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span className="teleconsult-badge status-badge">📹 Video</span>
                                                        {appt.status === 'confirmed' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); startVideoCall(appt); }}
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                                            >
                                                                Start Call
                                                            </button>
                                                        )}
                                                    </div>
                                                    : 'In-Person'
                                                }
                                            </span>
                                        </div>
                                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ width: '100%', marginTop: '0.5rem', borderColor: '#EF4444', color: '#EF4444' }}
                                                onClick={() => handleCancelAppointment(appt.id)}
                                            >
                                                Cancel Appointment
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <ConfirmDialog
                        isOpen={confirmModal.isOpen}
                        title="Cancel Appointment?"
                        message="Are you sure you want to cancel this appointment? This action cannot be undone."
                        confirmText="Yes, Cancel"
                        cancelText="No, Keep it"
                        onConfirm={confirmCancelAppointment}
                        onCancel={() => setConfirmModal({ isOpen: false, apptId: null })}
                    />

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
                        aria-label="Community chat message"
                        aria-invalid={chatError ? "true" : "false"}
                    />
                    <button type="submit" className="btn btn-primary global-chat-send">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </>
    )
}
