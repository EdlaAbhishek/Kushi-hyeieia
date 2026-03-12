import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MessageCircle, X, Send, AlertTriangle, Activity } from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import PageHeader from '../components/ui/PageHeader'

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
    const [labBookings, setLabBookings] = useState([])
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

        async function fetchLabBookings() {
            try {
                if (!user) return;

                const { data, error } = await supabase
                    .from('lab_test_bookings')
                    .select('*')
                    .eq('patient_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setLabBookings(data || [])
            } catch (err) {
                console.error('Lab bookings fetch error:', err.message)
            }
        }

        fetchLabBookings()

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
            // Check if session already exists for this appointment
            const { data, error } = await supabase
                .from('video_sessions')
                .select('id')
                .eq('appointment_id', appt.id)
                .maybeSingle()

            if (error) {
                console.error("Video session lookup error:", error)
                throw error
            }

            if (data) {
                navigate(`/video-call/${data.id}`)
                return
            }

            // Resolve doctor's auth user_id from the doctors table
            // appointments.doctor_id = doctors.id (table PK), but
            // video_sessions.doctor_id FK references users.id (auth user)
            let doctorAuthId = null
            const { data: docData } = await supabase
                .from('doctors')
                .select('user_id')
                .eq('id', appt.doctor_id)
                .maybeSingle()

            doctorAuthId = docData?.user_id || null

            if (!doctorAuthId) {
                toast.error("This doctor's account is not set up for video calls yet. Please try a different doctor.")
                return
            }

            const { data: newSession, error: createError } = await supabase
                .from('video_sessions')
                .insert({
                    appointment_id: appt.id,
                    doctor_id: doctorAuthId,
                    patient_id: appt.patient_id,
                    status: 'waiting'
                })
                .select()
                .single()

            if (createError) {
                console.error("Video session create error:", createError)
                throw createError
            }
            navigate(`/video-call/${newSession.id}`)
        } catch (err) {
            console.error("Full error:", err)
            toast.error(`Could not start video session: ${err.message || err.details || 'Unknown error'}`)
        }
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'confirmed': return 'status-confirmed'
            case 'completed': return 'status-completed'
            case 'cancelled': return 'status-cancelled'
            case 'pending': return 'status-pending'
            default: return 'status-pending'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmed'
            case 'completed': return 'Completed'
            case 'cancelled': return 'Cancelled'
            case 'pending': return 'Pending'
            default: return 'Pending'
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        let isoDateStr = dateStr;
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('-');
            isoDateStr = `${y}-${m}-${d}`;
        }
        const d = new Date(isoDateStr + 'T00:00:00')
        if (isNaN(d.getTime()) || d.getFullYear() > 2100) {
            const fallbackD = new Date(dateStr);
            if (!isNaN(fallbackD.getTime()) && fallbackD.getFullYear() <= 2100) return fallbackD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return dateStr;
        }
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
            <PageHeader
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Welcome back, {userName}
                        <InfoTooltip content={{
                            title: "Patient Dashboard",
                            description: "This is your central hub for managing your health. From here, you can view upcoming appointments, track health trends, check your lab test bookings, and access your medical records.",
                            usage: "Use the tabs to navigate or click the Action buttons to book new appointments."
                        }} />
                    </div>
                }
                description="Manage your appointments, health records, and upcoming tests."
                action={
                    <ActionButton to="/doctors" variant="primary">
                        + New Appointment
                    </ActionButton>
                }
            />

            <SectionContainer style={{ paddingTop: '1.5rem' }}>
                <div>
                    {/* Personal Health Trends Panel (Only on Overview) */}
                    {/* Personal Health Metrics (Overview Only) */}
                    {activeTab === 'overview' && (
                        <div style={{ marginBottom: '3.5rem' }}>
                            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                    <Activity size={24} color="var(--primary)" /> Personal Health Insights
                                </h2>
                                <p className="section-subtitle">AI-driven metrics and historical wellness trends.</p>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {/* Health Trends Chart */}
                                <DashboardCard style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Wellness Score Trend</h3>
                                        <InfoTooltip content={{
                                            en: { title: 'Wellness Score', helps: 'A weighted average of your recent vital signs, lab results, and symptom history.', usage: 'Track this monthly. A score above 80 is considered excellent.' },
                                            hi: { title: 'कल्याण स्कोर', helps: 'आपके हालिया महत्वपूर्ण संकेतों, लैब परिणामों और लक्षण इतिहास का भारित औसत।', usage: 'इसे मासिक रूप से ट्रैक करें। 80 से ऊपर का स्कोर उत्कृष्ट माना जाता है।' },
                                            te: { title: 'వెల్నెస్ స్కోర్', helps: 'మీ ఇటీవలి కీలక సంకేతాలు, ల్యాబ్ ఫలితాలు మరియు లక్షణ చరిత్ర యొక్క సగటు.', usage: 'దీన్ని నెలవారీగా ట్రాక్ చేయండి. 80 కంటే ఎక్కువ స్కోరు అద్భుతంగా పరిగణించబడుతుంది.' }
                                        }} />
                                    </div>
                                    <div style={{ height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={mockHealthData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                                />
                                                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </DashboardCard>

                                {/* Predictive Risk Score Card */}
                                <DashboardCard style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <AlertTriangle size={20} color="#EAB308" /> AI Risk Profile
                                        </h3>
                                        <InfoTooltip content={{
                                            en: { title: 'Predictive Risk Profile', helps: 'AI analysis of clinical records to identify potential risks before symptoms occur.', usage: 'Update your Health Vault regularly to improve the precision of this score.' },
                                            hi: { title: 'भविष्य कहनेवाला जोखिम प्रोफ़ाइल', helps: 'लक्षणों के होने से पहले संभावित जोखिमों की पहचान करने के लिए नैदानिक ​​रिकॉर्ड का एआई विश्लेषण।', usage: 'इस स्कोर की सटीकता में सुधार के लिए अपने हेल्थ वॉल्ट को नियमित रूप से अपडेट करें।' },
                                            te: { title: 'ప్రిడిక్టివ్ రిస్క్ ప్రొఫైల్', helps: 'లక్షణాలు కనిపించే ముందే సంభావ్య ప్రమాదాలను గుర్తించడానికి క్లినికల్ రికార్డుల AI విశ్లేషణ.', usage: 'ఈ స్కోర్ యొక్క ఖచ్చితత్వాన్ని మెరుగుపరచడానికి మీ హెల్త్ వాల్ట్‌ను క్రమం తప్పకుండా అప్‌డేట్ చేయండి.' }
                                        }} />
                                    </div>
                                    
                                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>12%</div>
                                        <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <span>↓ 2%</span> <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8 }}>since last checkup</span>
                                        </div>
                                        
                                        <div style={{ marginTop: '1.5rem', background: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#64748B', border: '1px solid #E2E8F0' }}>
                                            <strong>Status:</strong> Low baseline risk. Maintain current lifestyle and regular monitoring.
                                        </div>
                                    </div>
                                </DashboardCard>
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
                            <InfoTooltip content={{
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
                                <motion.div key={appt.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}>
                                    <DashboardCard className="appointment-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                                    {appt.appointment_type === 'telehealth' || appt.appointment_type === 'teleconsultation'
                                                        ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <span className="teleconsult-badge status-badge">📹 Video</span>
                                                            {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                                                <ActionButton
                                                                    variant="primary"
                                                                    onClick={(e) => { e.stopPropagation(); startVideoCall(appt); }}
                                                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: 600 }}
                                                                >
                                                                    📹 Join Call
                                                                </ActionButton>
                                                            )}
                                                        </div>
                                                        : 'In-Person'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                            <ActionButton
                                                variant="outline"
                                                style={{ width: '100%', marginTop: 'auto', borderColor: '#EF4444', color: '#EF4444' }}
                                                onClick={() => handleCancelAppointment(appt.id)}
                                            >
                                                Cancel Appointment
                                            </ActionButton>
                                        )}
                                    </DashboardCard>
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
                            <ActionButton to="/hospitals" variant="outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                Find More Hospitals
                            </ActionButton>
                        </div>
                    )}

                    {/* ── LAB BOOKINGS SECTION ── */}
                    {(activeTab === 'overview' || activeTab === 'appointments') && (
                        <div style={{ marginTop: '4rem' }}>
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 className="section-title" style={{ margin: 0 }}>Your Lab Tests</h2>
                                    <p className="section-subtitle" style={{ margin: 0 }}>
                                        {labBookings.length === 0
                                            ? 'No lab tests booked'
                                            : `${labBookings.length} lab booking${labBookings.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <InfoTooltip content={{
                                    en: { title: 'Lab Tests', helps: 'This section tracks the diagnostic tests you have scheduled.', usage: 'View your requested home collections here.' },
                                    hi: { title: 'प्रयोगशाला परीक्षण', helps: 'यह अनुभाग आपके द्वारा निर्धारित नैदानिक परीक्षणों को ट्रैक करता है।', usage: 'अपने अनुरोधित होम संग्रह को यहां देखें।' },
                                    te: { title: 'ప్రయోగశాల పరీక్షలు', helps: 'ఈ విభాగం మీరు ప్లాన్ చేసిన రోగనిర్ధారణ పరీక్షలను ట్రాక్ చేస్తుంది.', usage: 'మీరు అభ్యర్థించిన హోమ్ కలెక్షన్లను ఇక్కడ వీక్షించండి.' }
                                }} />
                            </div>

                            {labBookings.length === 0 ? (
                                <div className="dashboard-empty" style={{ padding: '2rem' }}>
                                    <div className="dashboard-empty-icon">🧪</div>
                                    <h3 style={{ fontSize: '1.1rem' }}>No Diagnostic Tests Booked</h3>
                                    <p style={{ fontSize: '0.9rem' }}>You haven't requested any home collections for lab tests.</p>
                                    <Link to="/services" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                                        Explore Services
                                    </Link>
                                </div>
                            ) : (
                                <div className="appointment-grid">
                                    {labBookings.map((booking, i) => (
                                        <motion.div key={booking.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}>
                                            <DashboardCard className="appointment-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <div className="appointment-card-header">
                                                    <div className="appointment-doctor-info">
                                                        <h3 className="appointment-doctor-name" style={{ fontSize: '1.1rem' }}>
                                                            Home Collection
                                                        </h3>
                                                        <p className="appointment-doctor-specialty">
                                                            {booking.tests.length} tests requested
                                                        </p>
                                                    </div>
                                                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                                        {getStatusLabel(booking.status)}
                                                    </span>
                                                </div>

                                                <div className="appointment-card-body" style={{ padding: '1rem' }}>
                                                    <div className="appointment-detail">
                                                        <span className="appointment-label">Date</span>
                                                        <span className="appointment-value">{formatDate(booking.preferred_date)}</span>
                                                    </div>
                                                    <div className="appointment-detail">
                                                        <span className="appointment-label">Time Slot</span>
                                                        <span className="appointment-value">{booking.preferred_time_slot}</span>
                                                    </div>
                                                    <div className="appointment-detail" style={{ alignItems: 'flex-start' }}>
                                                        <span className="appointment-label">Tests</span>
                                                        <div className="appointment-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                            {booking.tests.map(t => (
                                                                <span key={t} style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#475569' }}>
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="appointment-detail" style={{ alignItems: 'flex-start', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #E2E8F0' }}>
                                                        <span className="appointment-label">Address</span>
                                                        <span className="appointment-value" style={{ fontSize: '0.8rem', color: '#64748B' }}>{booking.address}</span>
                                                    </div>
                                                </div>
                                            </DashboardCard>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SectionContainer>

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
