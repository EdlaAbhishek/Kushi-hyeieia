import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../services/AuthContext'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Clock, Play, CheckCircle, AlertTriangle, SkipForward,
    Stethoscope, Activity, UserCheck, ShieldAlert, Sparkles,
    RefreshCw, Pause, AlertCircle, Phone, FileText
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// Initial simulated OPD patients for demonstration
const INITIAL_DEMO_QUEUE = [
    {
        id: 'token-101',
        token_number: 119,
        token_prefix: 'A',
        patient_name: 'Rajesh Varma',
        age: 48,
        gender: 'Male',
        phone: '+91 98480 22341',
        status: 'in_consultation',
        priority: 'normal',
        priority_reason: null,
        check_in_at: '10:05 AM',
        consult_start: '10:18 AM',
        triage_notes: 'Recurrent dry cough and slight shortness of breath for 4 days.',
        vitals: { bp: '130/85', pulse: '78 bpm', temp: '98.8°F', spo2: '98%' }
    },
    {
        id: 'token-102',
        token_number: 120,
        token_prefix: 'A',
        patient_name: 'Lakshmi Narayana',
        age: 62,
        gender: 'Female',
        phone: '+91 94401 88321',
        status: 'checked_in',
        priority: 'normal',
        priority_reason: null,
        check_in_at: '10:12 AM',
        consult_start: null,
        triage_notes: 'Routine quarterly diabetes checkup and fasting blood report review.',
        vitals: { bp: '138/88', pulse: '74 bpm', temp: '98.4°F', spo2: '97%' }
    },
    {
        id: 'token-103',
        token_number: 121,
        token_prefix: 'A',
        patient_name: 'Mohammed Farooq',
        age: 34,
        gender: 'Male',
        phone: '+91 97000 11902',
        status: 'waiting',
        priority: 'emergency',
        priority_reason: 'Severe acute epigastric pain with diaphoresis (elevated by triage staff)',
        check_in_at: '10:20 AM',
        consult_start: null,
        triage_notes: 'Acute epigastric radiating pain, sweating, onset 1 hr ago.',
        vitals: { bp: '145/95', pulse: '96 bpm', temp: '99.1°F', spo2: '99%' }
    },
    {
        id: 'token-104',
        token_number: 122,
        token_prefix: 'A',
        patient_name: 'Ananya Deshmukh',
        age: 26,
        gender: 'Female',
        phone: '+91 91234 56789',
        status: 'waiting',
        priority: 'normal',
        priority_reason: null,
        check_in_at: '10:25 AM',
        consult_start: null,
        triage_notes: 'Migraine with aura for 24 hours, unresponsive to OTC paracetamol.',
        vitals: { bp: '118/76', pulse: '82 bpm', temp: '98.6°F', spo2: '99%' }
    },
    {
        id: 'token-105',
        token_number: 123,
        token_prefix: 'A',
        patient_name: 'Venkat Rao',
        age: 55,
        gender: 'Male',
        phone: '+91 93910 44556',
        status: 'waiting',
        priority: 'normal',
        priority_reason: null,
        check_in_at: '10:30 AM',
        consult_start: null,
        triage_notes: 'Post-op 2-week wound inspection after knee arthroscopy.',
        vitals: { bp: '124/80', pulse: '72 bpm', temp: '98.2°F', spo2: '98%' }
    }
]

export default function DoctorQueue() {
    const { user } = useAuth()
    const [queue, setQueue] = useState(INITIAL_DEMO_QUEUE)
    const [queueStatus, setQueueStatus] = useState('active') // active | paused | closed
    const [selectedPatient, setSelectedPatient] = useState(INITIAL_DEMO_QUEUE[0])
    const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
    const [targetEmergencyPatient, setTargetEmergencyPatient] = useState(null)
    const [emergencyReason, setEmergencyReason] = useState('')
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: '', patient: null })
    const [consultationTimer, setConsultationTimer] = useState(0)
    const [completedCount, setCompletedCount] = useState(14)
    const [avgConsultMins, setAvgConsultMins] = useState(12)
    const timerRef = useRef(null)

    // Consultation timer for active patient
    useEffect(() => {
        if (selectedPatient && selectedPatient.status === 'in_consultation') {
            timerRef.current = setInterval(() => {
                setConsultationTimer(prev => prev + 1)
            }, 1000)
        } else {
            clearInterval(timerRef.current)
            setConsultationTimer(0)
        }
        return () => clearInterval(timerRef.current)
    }, [selectedPatient?.id, selectedPatient?.status])

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const currentPatient = queue.find(p => p.status === 'in_consultation') || selectedPatient
    const waitingPatients = queue.filter(p => p.status === 'waiting' || p.status === 'checked_in')

    // Start Consultation
    const handleStartConsultation = async (patient) => {
        setQueue(prev => prev.map(p => {
            if (p.id === patient.id) {
                return { ...p, status: 'in_consultation', consult_start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            }
            if (p.status === 'in_consultation') {
                return { ...p, status: 'checked_in' }
            }
            return p
        }))
        setSelectedPatient({ ...patient, status: 'in_consultation' })
        setConsultationTimer(0)
        toast.success(`Started consultation for Token ${patient.token_prefix}-${patient.token_number}`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'queue_token',
            entityId: patient.id,
            description: `Doctor started consultation with Token ${patient.token_prefix}-${patient.token_number} (${patient.patient_name})`
        })
    }

    // Complete Consultation
    const handleCompleteConsultation = async () => {
        if (!currentPatient) return

        setQueue(prev => prev.filter(p => p.id !== currentPatient.id))
        setCompletedCount(prev => prev + 1)
        toast.success(`Consultation completed for Token ${currentPatient.token_prefix}-${currentPatient.token_number}`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'queue_token',
            entityId: currentPatient.id,
            description: `Doctor completed consultation with Token ${currentPatient.token_prefix}-${currentPatient.token_number}`
        })

        // Auto select next waiting patient (emergency first, then checked_in, then waiting)
        const sortedWaiting = [...waitingPatients].filter(p => p.id !== currentPatient.id).sort((a, b) => {
            if (a.priority === 'emergency') return -1
            if (b.priority === 'emergency') return 1
            return a.token_number - b.token_number
        })

        if (sortedWaiting.length > 0) {
            setSelectedPatient(sortedWaiting[0])
        } else {
            setSelectedPatient(null)
        }
    }

    // Skip / Mark No-show
    const handleSkipPatient = async (patient, reason = 'No-show') => {
        setQueue(prev => prev.filter(p => p.id !== patient.id))
        toast(`Token ${patient.token_prefix}-${patient.token_number} marked as ${reason}`, { icon: '⏭️' })

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'queue_token',
            entityId: patient.id,
            description: `Doctor marked Token ${patient.token_prefix}-${patient.token_number} as ${reason}`
        })

        if (selectedPatient?.id === patient.id) {
            const nextOne = waitingPatients.find(p => p.id !== patient.id)
            setSelectedPatient(nextOne || null)
        }
    }

    // Emergency Override Trigger
    const openEmergencyOverride = (patient) => {
        setTargetEmergencyPatient(patient)
        setEmergencyReason('')
        setEmergencyModalOpen(true)
    }

    const submitEmergencyOverride = async (e) => {
        e.preventDefault()
        if (!emergencyReason.trim()) {
            toast.error('Clinical justification is required for emergency priority elevation')
            return
        }

        setQueue(prev => {
            const updated = prev.map(p => {
                if (p.id === targetEmergencyPatient.id) {
                    return { ...p, priority: 'emergency', priority_reason: emergencyReason }
                }
                return p
            })
            // Re-sort: emergency first
            return [...updated].sort((a, b) => {
                if (a.priority === 'emergency' && b.priority !== 'emergency') return -1
                if (b.priority === 'emergency' && a.priority !== 'emergency') return 1
                return 0
            })
        })

        toast.success(`Token ${targetEmergencyPatient.token_prefix}-${targetEmergencyPatient.token_number} elevated to Emergency Priority`, {
            icon: '🚨'
        })

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'queue_token',
            entityId: targetEmergencyPatient.id,
            description: `EMERGENCY OVERRIDE: Token ${targetEmergencyPatient.token_prefix}-${targetEmergencyPatient.token_number} elevated. Reason: ${emergencyReason}`
        })

        setEmergencyModalOpen(false)
        setTargetEmergencyPatient(null)
        setEmergencyReason('')
    }

    return (
        <div className="doctor-queue-container" style={{ padding: '0 0 2rem 0' }}>
            <PageHeader
                title="Doctor OPD Queue Console"
                description="Live outpatient consultation workflow, patient calling, and authorized clinical triage."
            />

            {/* Top Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <DashboardCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT TOKEN</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0' }}>
                                {currentPatient?.status === 'in_consultation'
                                    ? `${currentPatient.token_prefix}-${currentPatient.token_number}`
                                    : 'None Active'}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> Time: {formatTimer(consultationTimer)}
                            </span>
                        </div>
                        <div style={{ background: 'var(--primary-light)', padding: '0.8rem', borderRadius: 'var(--radius)', color: 'var(--primary)' }}>
                            <Stethoscope size={24} />
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN WAITING ROOM</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.2rem 0' }}>
                                {waitingPatients.length}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {waitingPatients.filter(p => p.priority === 'emergency').length} emergency triage
                            </span>
                        </div>
                        <div style={{ background: '#FEF3C7', padding: '0.8rem', borderRadius: 'var(--radius)', color: '#D97706' }}>
                            <Users size={24} />
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVG. CONSULTATION</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.2rem 0' }}>
                                ~{avgConsultMins} min
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: 15 min / patient</span>
                        </div>
                        <div style={{ background: '#E0F2FE', padding: '0.8rem', borderRadius: 'var(--radius)', color: '#0284C7' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLETED TODAY</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', margin: '0.2rem 0' }}>
                                {completedCount}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OPD session 78% done</span>
                        </div>
                        <div style={{ background: '#DCFCE7', padding: '0.8rem', borderRadius: 'var(--radius)', color: '#16A34A' }}>
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </DashboardCard>
            </div>

            {/* Queue Control Bar */}
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.85rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>OPD Session Status:</span>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: queueStatus === 'active' ? '#DCFCE7' : queueStatus === 'paused' ? '#FEF3C7' : '#F1F5F9',
                        color: queueStatus === 'active' ? '#15803D' : queueStatus === 'paused' ? '#B45309' : '#64748B'
                    }}>
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: queueStatus === 'active' ? '#16A34A' : queueStatus === 'paused' ? '#F59E0B' : '#94A3B8'
                        }} />
                        {queueStatus === 'active' ? 'Live & Accepting' : queueStatus === 'paused' ? 'Paused' : 'Closed'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Department of Pulmonology & Internal Medicine</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {queueStatus === 'active' ? (
                        <ActionButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setQueueStatus('paused')
                                toast('OPD queue paused for break', { icon: '☕' })
                            }}
                        >
                            <Pause size={14} /> Pause Queue
                        </ActionButton>
                    ) : (
                        <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                setQueueStatus('active')
                                toast.success('OPD queue resumed')
                            }}
                        >
                            <Play size={14} /> Resume Queue
                        </ActionButton>
                    )}
                </div>
            </div>

            {/* Split View: Active Consultation & Waiting List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1.8fr)',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* Active Consultation Console */}
                <DashboardCard
                    title="Active Consultation Chamber"
                    icon={Stethoscope}
                    action={
                        currentPatient?.status === 'in_consultation' ? (
                            <span style={{
                                background: '#DCFCE7',
                                color: '#16A34A',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-pill)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> In Chamber
                            </span>
                        ) : null
                    }
                >
                    {currentPatient ? (
                        <div>
                            {/* Patient Badge Card */}
                            <div style={{
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                padding: '1.2rem',
                                background: currentPatient.priority === 'emergency' ? '#FEF2F2' : 'var(--surface)',
                                marginBottom: '1.25rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '1.4rem',
                                                fontWeight: 800,
                                                color: 'var(--primary)',
                                                fontFamily: 'monospace'
                                            }}>
                                                {currentPatient.token_prefix}-{currentPatient.token_number}
                                            </span>
                                            {currentPatient.priority === 'emergency' && (
                                                <span style={{
                                                    background: '#DC2626',
                                                    color: '#FFFFFF',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    <AlertTriangle size={12} /> EMERGENCY TRIAGE
                                                </span>
                                            )}
                                        </div>
                                        <h3 style={{ margin: '0.4rem 0 0.15rem 0', fontSize: '1.15rem', color: 'var(--text-dark)' }}>
                                            {currentPatient.patient_name}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {currentPatient.age} yrs • {currentPatient.gender} • {currentPatient.phone}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check-in</span>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                                            {currentPatient.check_in_at}
                                        </div>
                                    </div>
                                </div>

                                {currentPatient.priority === 'emergency' && currentPatient.priority_reason && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem 0.75rem',
                                        background: '#FEE2E2',
                                        borderRadius: 'var(--radius-sm)',
                                        color: '#991B1B',
                                        fontSize: '0.8rem',
                                        lineHeight: 1.4
                                    }}>
                                        <strong>Priority Clinical Note:</strong> {currentPatient.priority_reason}
                                    </div>
                                )}

                                {/* Vitals Snapshot */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '0.5rem',
                                    marginTop: '1rem',
                                    background: '#FFFFFF',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blood Pressure</span>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentPatient.vitals?.bp || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pulse</span>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentPatient.vitals?.pulse || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temp</span>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentPatient.vitals?.temp || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SpO2</span>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16A34A' }}>{currentPatient.vitals?.spo2 || '—'}</div>
                                    </div>
                                </div>

                                {/* Triage notes */}
                                <div style={{ marginTop: '0.85rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PATIENT REPORTED TRIAGE NOTE:</span>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                        "{currentPatient.triage_notes}"
                                    </p>
                                </div>
                            </div>

                            {/* Clinical Action Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {currentPatient.status !== 'in_consultation' ? (
                                    <ActionButton
                                        variant="primary"
                                        onClick={() => handleStartConsultation(currentPatient)}
                                        style={{ gridColumn: 'span 2' }}
                                    >
                                        <Play size={16} /> Start Consultation
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        variant="primary"
                                        onClick={handleCompleteConsultation}
                                        style={{ background: '#16A34A', gridColumn: 'span 2' }}
                                    >
                                        <CheckCircle size={16} /> Complete Consultation & Call Next
                                    </ActionButton>
                                )}

                                <ActionButton
                                    variant="outline"
                                    onClick={() => handleSkipPatient(currentPatient, 'No-Show')}
                                >
                                    <SkipForward size={14} /> Skip / No-Show
                                </ActionButton>

                                <ActionButton
                                    variant="outline"
                                    onClick={() => openEmergencyOverride(currentPatient)}
                                    style={{ color: '#DC2626', borderColor: '#FECACA' }}
                                >
                                    <AlertTriangle size={14} /> Clinical Emergency Elevation
                                </ActionButton>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                            <UserCheck size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>No Patient Currently in Chamber</h4>
                            <p style={{ fontSize: '0.85rem', maxWidth: 300, margin: '0 auto 1rem' }}>
                                Select a waiting patient from the queue on the right to begin consultation.
                            </p>
                            {waitingPatients.length > 0 && (
                                <ActionButton
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleStartConsultation(waitingPatients[0])}
                                >
                                    Call Next Patient ({waitingPatients[0].token_prefix}-{waitingPatients[0].token_number})
                                </ActionButton>
                            )}
                        </div>
                    )}
                </DashboardCard>

                {/* Queue Roster */}
                <DashboardCard
                    title={`Waiting Room (${waitingPatients.length})`}
                    icon={Users}
                    action={
                        <button
                            onClick={() => toast.success('Queue refreshed')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem'
                            }}
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    }
                >
                    {waitingPatients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                            <CheckCircle size={40} style={{ margin: '0 auto 0.75rem', color: '#16A34A', opacity: 0.7 }} />
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>All Clear!</h4>
                            <p style={{ fontSize: '0.85rem' }}>No patients currently waiting in the OPD queue.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {waitingPatients.map((patient, index) => {
                                const isSelected = selectedPatient?.id === patient.id
                                const isEmergency = patient.priority === 'emergency'

                                return (
                                    <div
                                        key={patient.id}
                                        onClick={() => setSelectedPatient(patient)}
                                        style={{
                                            border: `1px solid ${isSelected ? 'var(--primary)' : isEmergency ? '#FCA5A5' : 'var(--border)'}`,
                                            background: isSelected ? 'var(--primary-light)' : isEmergency ? '#FEF2F2' : 'var(--surface)',
                                            borderRadius: 'var(--radius)',
                                            padding: '0.85rem 1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isEmergency ? '#DC2626' : 'var(--primary)',
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                fontFamily: 'monospace'
                                            }}>
                                                {patient.token_number}
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                                        {patient.patient_name}
                                                    </span>
                                                    {isEmergency && (
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            background: '#EF4444',
                                                            color: '#fff',
                                                            padding: '0.1rem 0.4rem',
                                                            borderRadius: '3px'
                                                        }}>
                                                            EMERGENCY
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {patient.age}y {patient.gender} • In queue since {patient.check_in_at}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <ActionButton
                                                variant="primary"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleStartConsultation(patient)
                                                }}
                                            >
                                                Call In
                                            </ActionButton>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openEmergencyOverride(patient)
                                                }}
                                                title="Elevate to Emergency"
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid #FECACA',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: '#DC2626',
                                                    padding: '0.35rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <ShieldAlert size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </DashboardCard>
            </div>

            {/* Emergency Priority Clinical Elevation Modal */}
            {emergencyModalOpen && targetEmergencyPatient && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius)',
                            maxWidth: '520px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#991B1B' }}>Clinical Emergency Elevation</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Token {targetEmergencyPatient.token_prefix}-{targetEmergencyPatient.token_number} ({targetEmergencyPatient.patient_name})
                                </p>
                            </div>
                        </div>

                        <div style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.85rem',
                            marginBottom: '1.2rem',
                            fontSize: '0.8rem',
                            color: '#991B1B',
                            lineHeight: 1.5
                        }}>
                            <strong>Medical Governance Requirement:</strong> Emergency queue elevation bypasses regular token order. Per clinical governance policy, an immutable audit log entry is recorded with your doctor credential and justification note.
                        </div>

                        <form onSubmit={submitEmergencyOverride}>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
                                    Clinical Justification / Triage Urgency *
                                </label>
                                <textarea
                                    value={emergencyReason}
                                    onChange={(e) => setEmergencyReason(e.target.value)}
                                    placeholder="e.g. Patient exhibits chest tightness with diaphoretic symptoms; requires immediate ECG & bedside evaluation."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.85rem'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <ActionButton
                                    variant="outline"
                                    type="button"
                                    onClick={() => setEmergencyModalOpen(false)}
                                >
                                    Cancel
                                </ActionButton>
                                <ActionButton
                                    variant="primary"
                                    type="submit"
                                    style={{ background: '#DC2626', borderColor: '#DC2626' }}
                                >
                                    Confirm Emergency Elevation
                                </ActionButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
