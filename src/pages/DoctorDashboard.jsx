import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'

import InfoTooltip from '../components/ui/InfoTooltip'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import DataTable from '../components/ui/DataTable'

export default function DoctorDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [appointments, setAppointments] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)
    const [availabilityStatus, setAvailabilityStatus] = useState('available')
    const [updatingStatus, setUpdatingAvailability] = useState(false)

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
            // Fetch doctor's current availability
            const { data: docData, error: docError } = await supabase
                .from('doctors')
                .select('availability_status')
                .eq('id', user.id)
                .single()
            if (!docError && docData) {
                setAvailabilityStatus(docData.availability_status || 'available')
            }

            const { data, error } = await supabase
                .from('appointments')
                .select('*, patients:patient_id(full_name, email)')
                .eq('doctor_id', user.id)
                .order('appointment_date', { ascending: false })
            if (error) throw error

            // Sort by urgency first (Emergency -> Urgent -> Routine), then date 
            const urgencyWeight = { 'Emergency': 3, 'Urgent': 2, 'Routine': 1 }
            const sortedAppointments = (data || []).sort((a, b) => {
                const weightA = urgencyWeight[a.urgency] || 1
                const weightB = urgencyWeight[b.urgency] || 1
                if (weightA !== weightB) {
                    return weightB - weightA
                }
                return new Date(a.appointment_date) - new Date(b.appointment_date)
            })

            setAppointments(sortedAppointments)

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
        } finally {
            setLoading(false)
        }
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
            if (error) throw error
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

    const joinVideoCall = async (appt) => {
        try {
            // Check if session exists
            const { data, error } = await supabase
                .from('video_sessions')
                .select('id')
                .eq('appointment_id', appt.id)
                .maybeSingle()

            if (error) throw error

            if (data) {
                navigate(`/video-call/${data.id}`)
                return
            }

            // Doctor is calling this, so doctor_id = user.id (current auth user)
            // Resolve patient's auth user_id from doctors table if needed
            const { data: newSession, error: createError } = await supabase
                .from('video_sessions')
                .insert({
                    appointment_id: appt.id,
                    doctor_id: user.id,   // current logged-in doctor's auth ID
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

    const handleAvailabilityUpdate = async (newStatus) => {
        setUpdatingAvailability(true)
        try {
            const { error } = await supabase
                .from('doctors')
                .update({ availability_status: newStatus })
                .eq('id', user.id)
            if (error) throw error
            setAvailabilityStatus(newStatus)
            toast.success(`Availability updated to ${newStatus}`)
        } catch (err) {
            toast.error(`Failed to update availability: ${err.message}`)
        }
        setUpdatingAvailability(false)
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
        try {
            const dateStr = d.includes('T') ? d.split('T')[0] : d
            const date = new Date(dateStr + 'T00:00:00')
            if (isNaN(date.getTime()) || date.getFullYear() > 2100) return d
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        } catch { return d }
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

    const getUrgencyColor = (urgency) => {
        switch (urgency?.toLowerCase()) {
            case 'emergency': return { bg: '#FEE2E2', text: '#B91C1C' } // Red
            case 'urgent': return { bg: '#FEF3C7', text: '#D97706' } // Yellow
            case 'routine': return { bg: '#D1FAE5', text: '#059669' } // Green
            default: return { bg: '#F3F4F6', text: '#4B5563' }
        }
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'

    return (
        <>
            <PageHeader
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Doctor Dashboard
                        <InfoTooltip content={{
                            title: "Doctor Workspace",
                            description: "Your centralized hub for managing patient appointments, viewing daily schedules, and updating your availability status.",
                            usage: "Update your status to busy/offline to prevent new bookings. Use the action buttons to confirm or complete appointments."
                        }} />
                    </div>
                }
                description={`Welcome back, ${userName}`}
                className="doctor-header"
            />

            <SectionContainer style={{ paddingBottom: 0 }}>
                <div>
                    <DashboardCard style={{ padding: '1.5rem', marginBottom: '2rem', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Availability Status</h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                    Control when patients can book new appointments with you.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { id: 'available', label: 'Available', color: '#10B981', bg: '#D1FAE5' },
                                    { id: 'busy', label: 'Busy', color: '#F59E0B', bg: '#FEF3C7' },
                                    { id: 'offline', label: 'Offline', color: '#6B7280', bg: '#F3F4F6' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        disabled={updatingStatus}
                                        onClick={() => handleAvailabilityUpdate(status.id)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            border: availabilityStatus === status.id ? `2px solid ${status.color}` : '1px solid var(--border-color)',
                                            background: availabilityStatus === status.id ? status.bg : '#fff',
                                            color: availabilityStatus === status.id ? status.color : 'var(--text-main)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </DashboardCard>
                </div>
            </SectionContainer>

            <SectionContainer>
                <div>

                    {/* Notifications Section */}
                    {notifications.length > 0 && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                    <AlertTriangle size={20} color="var(--primary)" /> Recent Notifications
                                </h2>
                                <InfoTooltip content={{
                                    en: { title: 'Doctor Privacy', helps: 'Manage your workload and patient appointments.', usage: 'Toggle your status between Available, Busy, or Offline. When Busy or Offline, new patients cannot book appointments, but existing ones are preserved.' },
                                    hi: { title: 'डॉक्टर की गोपनीयता', helps: 'अपने कार्यभार और रोगी नियुक्तियों का प्रबंधन करें।', usage: 'उपलब्ध, व्यस्त या ऑफ़लाइन के बीच अपनी स्थिति टॉगल करें। व्यस्त या ऑफ़लाइन होने पर, नए रोगी अपॉइंटमेंट बुक नहीं कर सकते।' },
                                    te: { title: 'డాక్టర్ గోప్యత', helps: 'మీ పని భారాన్ని మరియు రోగి అపాయింట్‌మెంట్‌లను నిర్వహించండి.', usage: 'మీ స్థితిని అందుబాటులో ఉంది, బిజీగా లేదా ఆఫ్‌లైన్ మధ్య టోగుల్ చేయండి. బిజీగా లేదా ఆఫ్‌లైన్లో ఉన్నప్పుడు, కొత్త రోగులు అపాయింట్‌మెంట్‌లను బుక్ చేయలేరు.' }
                                }} />
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
                                                {(() => {
                                                    const d = new Date(notif.created_at);
                                                    return isNaN(d.getTime()) || d.getFullYear() > 2100 ? 'Recently' : d.toLocaleString('en-IN');
                                                })()}
                                            </p>
                                        </div>
                                        {!notif.read_status && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hospital Resources Panel */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div className="section-header" style={{ marginBottom: '1rem' }}>
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                🏥 Hospital Resources
                            </h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <DashboardCard className="stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Beds Available</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>42</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>/ 150</span>
                                </div>
                            </DashboardCard>
                            <DashboardCard className="stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>On-Duty Doctors</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>12</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Specialists</span>
                                </div>
                            </DashboardCard>
                            <DashboardCard className="stat-card" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: '#991B1B', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Emergencies Today</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B91C1C' }}>5</span>
                                    <span style={{ fontSize: '0.85rem', color: '#991B1B' }}>critical</span>
                                </div>
                            </DashboardCard>
                        </div>
                    </div>

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
                        <div className="doctor-table-wrap" style={{ overflowX: 'auto' }}>
                            <DataTable>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Patient</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Date</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Time</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Urgency / Type</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Status</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Notes</th>
                                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(appt => {
                                        const displayName = appt.patients?.full_name || appt.patients?.email || appt.patient_name || appt.patient_email || 'Patient';
                                        return (
                                            <tr key={appt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                                    {displayName}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatDate(appt.appointment_date)}</td>
                                                <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatTime(appt.appointment_time)}</td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        {appt.urgency && (
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                padding: '0.1rem 0.4rem',
                                                                borderRadius: '0.25rem',
                                                                backgroundColor: getUrgencyColor(appt.urgency).bg,
                                                                color: getUrgencyColor(appt.urgency).text,
                                                                alignSelf: 'flex-start'
                                                            }}>
                                                                {(appt.urgency || '').toUpperCase()}
                                                            </span>
                                                        )}
                                                        {appt.appointment_type === 'telehealth' || appt.appointment_type === 'teleconsultation'
                                                            ? <span className="teleconsult-badge status-badge" style={{ marginTop: '0.1rem' }}>📹 Video</span>
                                                            : <span style={{ fontSize: '0.85rem' }}>In-Person</span>
                                                        }
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                                                    <span className={`status-badge ${getStatusClass(appt.status)}`}>
                                                        {(appt.status || 'pending').charAt(0).toUpperCase() + (appt.status || 'pending').slice(1)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
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
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                                                    <div className="doctor-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {appt.status === 'pending' && (
                                                            <>
                                                                <ActionButton
                                                                    variant="primary"
                                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                                    disabled={updatingId === appt.id}
                                                                    onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                                                                >
                                                                    Confirm
                                                                </ActionButton>
                                                                <ActionButton
                                                                    variant="outline"
                                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                                                    onClick={() => toast.success(`AI suggests slot: Today at ${appt.urgency === 'Emergency' ? 'Immediately' : '2:30 PM'} based on urgency.`)}
                                                                >
                                                                    Suggest Slot
                                                                </ActionButton>
                                                            </>
                                                        )}
                                                        {appt.status === 'confirmed' && (
                                                            <>
                                                                <ActionButton
                                                                    variant="primary"
                                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                                    disabled={updatingId === appt.id}
                                                                    onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                                                >
                                                                    Complete
                                                                </ActionButton>
                                                                {(appt.appointment_type === 'telehealth' || appt.appointment_type === 'teleconsultation') && (
                                                                    <ActionButton
                                                                        onClick={() => joinVideoCall(appt)}
                                                                        variant="outline"
                                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#EFF6FF', borderColor: 'var(--primary)' }}
                                                                    >
                                                                        📹 Join Call
                                                                    </ActionButton>
                                                                )}
                                                            </>
                                                        )}
                                                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                                            <ActionButton
                                                                variant="outline"
                                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                                                                disabled={updatingId === appt.id}
                                                                onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                                            >
                                                                Cancel
                                                            </ActionButton>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </div>
            </SectionContainer>

            {/* Post-Care Notes Modal */}
            {notesModal && (
                <div className="modal-overlay" onClick={() => setNotesModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setNotesModal(null)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Post-Care Instructions</h2>
                            <p className="modal-subtitle">
                                Patient: {(() => {
                                    const a = appointments.find(a => a.id === notesModal);
                                    if (a?.patient_name) return a.patient_name;
                                    if (a?.patient_email) return a.patient_email;
                                    return 'Unknown Patient';
                                })()}
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
