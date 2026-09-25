import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../services/AuthContext'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Ticket, Clock, Users, Building2, Stethoscope, ChevronRight,
    AlertTriangle, CheckCircle, XCircle, RefreshCw, QrCode, History, Coffee
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'

// Demo queue data (simulated hospital integration)
const DEMO_HOSPITALS = [
    { id: 'demo-1', name: 'KIMS Hospital', city: 'Secunderabad' },
    { id: 'demo-2', name: 'Apollo Hospitals Jubilee Hills', city: 'Hyderabad' },
    { id: 'demo-3', name: 'Yashoda Hospitals', city: 'Secunderabad' },
    { id: 'demo-4', name: 'Care Hospitals', city: 'Hyderabad' }
]

const DEMO_DEPARTMENTS = {
    'demo-1': [{ id: 'dept-1', name: 'General Medicine' }, { id: 'dept-2', name: 'Orthopedics' }, { id: 'dept-3', name: 'Cardiology' }],
    'demo-2': [{ id: 'dept-4', name: 'General Medicine' }, { id: 'dept-5', name: 'Dermatology' }, { id: 'dept-6', name: 'Neurology' }],
    'demo-3': [{ id: 'dept-7', name: 'ENT' }, { id: 'dept-8', name: 'Ophthalmology' }, { id: 'dept-9', name: 'Pediatrics' }],
    'demo-4': [{ id: 'dept-10', name: 'Pulmonology' }, { id: 'dept-11', name: 'Gastroenterology' }, { id: 'dept-12', name: 'General Medicine' }]
}

const DEMO_DOCTORS = {
    'dept-1': [{ id: 'doc-1', name: 'Dr. Priya Sharma' }, { id: 'doc-2', name: 'Dr. Suresh Reddy' }],
    'dept-2': [{ id: 'doc-3', name: 'Dr. Anil Kumar' }],
    'dept-3': [{ id: 'doc-4', name: 'Dr. Meena Rao' }],
    'dept-4': [{ id: 'doc-5', name: 'Dr. Vikram Singh' }],
    'dept-5': [{ id: 'doc-6', name: 'Dr. Kavitha Nair' }],
    'dept-6': [{ id: 'doc-7', name: 'Dr. Rajesh Menon' }],
    'dept-7': [{ id: 'doc-8', name: 'Dr. Shalini Das' }],
    'dept-8': [{ id: 'doc-9', name: 'Dr. Arvind Patel' }],
    'dept-9': [{ id: 'doc-10', name: 'Dr. Sneha Iyer' }],
    'dept-10': [{ id: 'doc-11', name: 'Dr. Ramesh Gupta' }],
    'dept-11': [{ id: 'doc-12', name: 'Dr. Ananya Bhatt' }],
    'dept-12': [{ id: 'doc-13', name: 'Dr. Kiran Joshi' }]
}

function generateToken() {
    return Math.floor(100 + Math.random() * 900)
}

export default function PatientQueue() {
    const { user } = useAuth()
    const [step, setStep] = useState('select') // select | active | history
    const [hospitals, setHospitals] = useState(DEMO_HOSPITALS)
    const [selectedHospital, setSelectedHospital] = useState(null)
    const [selectedDept, setSelectedDept] = useState(null)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [activeToken, setActiveToken] = useState(null)
    const [queueHistory, setQueueHistory] = useState([])
    const [loading, setLoading] = useState(false)

    // Simulated queue state
    const [queueState, setQueueState] = useState(null)

    // Load active token from Supabase on mount
    useEffect(() => {
        if (user) {
            loadActiveToken()
            loadQueueHistory()
        }
    }, [user])

    const loadActiveToken = async () => {
        try {
            const { data, error } = await supabase
                .from('queue_tokens')
                .select('*')
                .eq('patient_id', user.id)
                .in('status', ['waiting', 'checked_in'])
                .order('created_at', { ascending: false })
                .limit(1)

            if (!error && data?.length > 0) {
                const token = data[0]
                setActiveToken(token)
                simulateQueueProgress(token.token_number)
                setStep('active')
            }
        } catch (err) {
            console.warn('Could not load active token:', err)
        }
    }

    const loadQueueHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('queue_tokens')
                .select('*')
                .eq('patient_id', user.id)
                .in('status', ['completed', 'cancelled', 'skipped', 'no_show'])
                .order('created_at', { ascending: false })
                .limit(10)

            if (!error) setQueueHistory(data || [])
        } catch (err) {
            console.warn('Could not load queue history:', err)
        }
    }

    const simulateQueueProgress = useCallback((tokenNum) => {
        const servingToken = Math.max(tokenNum - Math.floor(Math.random() * 12 + 3), 100)
        const ahead = tokenNum - servingToken
        const estWait = ahead * (12 + Math.floor(Math.random() * 8))
        const now = new Date()
        const returnBy = new Date(now.getTime() + estWait * 60000)

        setQueueState({
            serving: servingToken,
            ahead,
            estWaitMin: estWait,
            estWaitMax: estWait + Math.floor(Math.random() * 10 + 5),
            returnBy: returnBy.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        })
    }, [])

    // Auto-update queue simulation every 30s
    useEffect(() => {
        if (!activeToken || step !== 'active') return
        const interval = setInterval(() => {
            setQueueState(prev => {
                if (!prev || prev.ahead <= 0) return prev
                const newAhead = Math.max(prev.ahead - 1, 0)
                const newServing = prev.serving + 1
                const estWait = newAhead * 15
                const now = new Date()
                const returnBy = new Date(now.getTime() + estWait * 60000)
                return {
                    serving: newServing,
                    ahead: newAhead,
                    estWaitMin: estWait,
                    estWaitMax: estWait + 8,
                    returnBy: returnBy.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                }
            })
        }, 30000)
        return () => clearInterval(interval)
    }, [activeToken, step])

    const handleTakeToken = async () => {
        if (!selectedHospital || !selectedDept || !selectedDoctor) {
            toast.error('Please select hospital, department and doctor')
            return
        }
        setLoading(true)
        try {
            const tokenNum = generateToken()
            const { data, error } = await supabase.from('queue_tokens').insert([{
                queue_id: null, // Will be linked when real queue exists
                patient_id: user.id,
                token_number: tokenNum,
                token_prefix: 'A',
                status: 'waiting',
                priority: 'normal',
                estimated_wait: Math.floor(Math.random() * 30 + 15)
            }]).select()

            if (error) {
                // If table doesn't exist yet, simulate locally
                const simulatedToken = {
                    id: crypto.randomUUID(),
                    token_number: tokenNum,
                    token_prefix: 'A',
                    status: 'waiting',
                    priority: 'normal',
                    hospital: selectedHospital,
                    department: selectedDept,
                    doctor: selectedDoctor,
                    created_at: new Date().toISOString()
                }
                setActiveToken(simulatedToken)
                simulateQueueProgress(tokenNum)
            } else {
                setActiveToken({ ...data[0], hospital: selectedHospital, department: selectedDept, doctor: selectedDoctor })
                simulateQueueProgress(tokenNum)
            }

            await logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.TOKEN_CREATED,
                entityType: 'queue_token',
                description: `Token A-${tokenNum} taken for ${selectedDoctor.name} at ${selectedHospital.name}`
            }).catch(() => {})

            setStep('active')
            toast.success(`Token A-${tokenNum} generated!`)
        } catch (err) {
            toast.error('Failed to generate token. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelToken = async () => {
        if (!activeToken) return
        try {
            await supabase
                .from('queue_tokens')
                .update({ status: 'cancelled' })
                .eq('id', activeToken.id)
                .catch(() => {})

            await logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.TOKEN_CANCELLED,
                entityType: 'queue_token',
                entityId: activeToken.id,
                description: `Token A-${activeToken.token_number} cancelled`
            }).catch(() => {})

            setActiveToken(null)
            setQueueState(null)
            setStep('select')
            toast.success('Token cancelled')
            loadQueueHistory()
        } catch (err) {
            toast.error('Could not cancel token')
        }
    }

    const departments = selectedHospital ? (DEMO_DEPARTMENTS[selectedHospital.id] || []) : []
    const doctors = selectedDept ? (DEMO_DOCTORS[selectedDept.id] || []) : []

    return (
        <>
            <PageHeader
                title="OPD Queue"
                description="Take a digital token and track your waiting status in real time"
                action={
                    step === 'select' ? (
                        <button
                            className="btn btn-outline"
                            onClick={() => setStep('history')}
                            style={{ gap: '0.4rem' }}
                        >
                            <History size={16} /> Queue History
                        </button>
                    ) : step === 'history' ? (
                        <button className="btn btn-primary" onClick={() => setStep('select')}>
                            New Token
                        </button>
                    ) : null
                }
            />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1rem' }}>
                {/* Demo Mode Banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1rem', background: '#FFFBEB',
                    border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem', color: '#92400E', fontWeight: 500,
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={15} />
                    <span><strong>Demo Mode</strong> — Simulated Hospital Integration. Queue data shown is for demonstration purposes.</span>
                </div>

                <AnimatePresence mode="wait">
                    {/* ====== STEP: SELECT HOSPITAL/DEPARTMENT/DOCTOR ====== */}
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                        >
                            <DashboardCard title="Select Hospital" icon={Building2}>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {hospitals.map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => { setSelectedHospital(h); setSelectedDept(null); setSelectedDoctor(null) }}
                                            className={`doctor-select-item ${selectedHospital?.id === h.id ? 'selected' : ''}`}
                                        >
                                            <Building2 size={18} style={{ color: 'var(--primary)' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{h.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.city}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </DashboardCard>

                            {selectedHospital && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
                                    <DashboardCard title="Select Department" icon={Stethoscope}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {departments.map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => { setSelectedDept(d); setSelectedDoctor(null) }}
                                                    className={`specialty-card ${selectedDept?.id === d.id ? 'specialty-active' : ''}`}
                                                >
                                                    {d.name}
                                                </button>
                                            ))}
                                        </div>
                                    </DashboardCard>
                                </motion.div>
                            )}

                            {selectedDept && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
                                    <DashboardCard title="Select Doctor" icon={Stethoscope}>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {doctors.map(doc => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoctor(doc)}
                                                    className={`doctor-select-item ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
                                                >
                                                    <div className="doctor-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                                                        {doc.name.split(' ').slice(1).map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{doc.name}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedDept.name}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </DashboardCard>
                                </motion.div>
                            )}

                            {selectedDoctor && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem' }}>
                                    <ActionButton variant="primary" onClick={handleTakeToken} disabled={loading} style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>
                                        <Ticket size={18} />
                                        {loading ? 'Generating Token...' : 'Take Digital Token'}
                                    </ActionButton>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ====== STEP: ACTIVE TOKEN ====== */}
                    {step === 'active' && activeToken && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Token Display */}
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                borderRadius: 'var(--radius-lg)',
                                padding: '2.5rem 2rem',
                                textAlign: 'center',
                                color: '#fff',
                                marginBottom: '1.5rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>
                                    Your Token
                                </div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                                    {activeToken.token_prefix}-{activeToken.token_number}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', opacity: 0.85 }}>
                                    {activeToken.doctor?.name} • {activeToken.department?.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', opacity: 0.65 }}>
                                    {activeToken.hospital?.name}
                                </div>
                            </div>

                            {/* Queue Status Cards */}
                            {queueState && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                            Now Serving
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>
                                            A-{queueState.serving}
                                        </div>
                                    </DashboardCard>

                                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                            People Ahead
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                                            {queueState.ahead}
                                        </div>
                                    </DashboardCard>

                                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                            Est. Wait
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-heading)' }}>
                                            ~{queueState.estWaitMin} min
                                        </div>
                                    </DashboardCard>

                                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                            Status
                                        </div>
                                        <StatusBadge status={activeToken.status === 'checked_in' ? 'info' : 'pending'}>
                                            {activeToken.status === 'checked_in' ? 'Checked In' : 'Waiting'}
                                        </StatusBadge>
                                    </DashboardCard>
                                </div>
                            )}

                            {/* Smart Wait Suggestion */}
                            {queueState && queueState.ahead > 3 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '1rem 1.25rem',
                                    background: 'var(--accent-light)',
                                    border: '1px solid rgba(13, 148, 136, 0.2)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1.5rem'
                                }}>
                                    <Coffee size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.88rem' }}>
                                            You can safely wait in the cafeteria
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            Return before approximately <strong>{queueState.returnBy}</strong>. Estimates update continuously based on actual queue progress.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Queue Progress Visualization */}
                            {queueState && (
                                <DashboardCard title="Queue Progress" icon={Users} style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'relative', height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                                        <motion.div
                                            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'var(--primary)', borderRadius: 4 }}
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.max(100 - (queueState.ahead / 15) * 100, 5)}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        <span>Queue Start</span>
                                        <span>Your Turn</span>
                                    </div>
                                </DashboardCard>
                            )}

                            {/* QR Check-in placeholder */}
                            <DashboardCard title="Hospital Check-in" icon={QrCode} style={{ marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <div style={{
                                        width: 120, height: 120, margin: '0 auto 1rem',
                                        background: 'var(--surface)', border: '2px dashed var(--border)',
                                        borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <QrCode size={48} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                        Scan the QR code at the hospital reception to check in
                                    </p>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                                        Simulated Hospital Integration — QR scanning will be available when connected to hospital systems
                                    </p>
                                </div>
                            </DashboardCard>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-outline" onClick={() => { simulateQueueProgress(activeToken.token_number) }} style={{ flex: 1, gap: '0.4rem' }}>
                                    <RefreshCw size={16} /> Refresh Status
                                </button>
                                <button className="btn btn-outline" onClick={handleCancelToken} style={{ flex: 1, gap: '0.4rem', borderColor: '#EF4444', color: '#EF4444' }}>
                                    <XCircle size={16} /> Cancel Token
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ====== STEP: HISTORY ====== */}
                    {step === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <DashboardCard title="Queue History" icon={History}>
                                {queueHistory.length === 0 ? (
                                    <div className="dashboard-empty">
                                        <div className="dashboard-empty-icon">📋</div>
                                        <h3>No queue history yet</h3>
                                        <p>Your OPD queue tokens will appear here after your visits.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {queueHistory.map(token => (
                                            <div key={token.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.85rem 1rem', border: '1px solid var(--border-light)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                                                        {token.token_prefix}-{token.token_number}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        {new Date(token.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                <StatusBadge status={token.status === 'completed' ? 'healthy' : token.status === 'cancelled' ? 'danger' : 'warning'}>
                                                    {token.status}
                                                </StatusBadge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashboardCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
