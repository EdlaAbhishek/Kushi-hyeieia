import { useState, useEffect } from 'react'
import { useAuth } from '../../services/AuthContext'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Pill, Clock, CheckCircle, XCircle, AlertCircle, Calendar,
    Upload, Camera, Bell, TrendingUp, ChevronRight, AlertTriangle, Eye
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'

const MEAL_LABELS = {
    before_meal: 'Before meal',
    after_meal: 'After meal',
    with_meal: 'With meal',
    empty_stomach: 'Empty stomach',
    anytime: 'Anytime'
}

export default function MedicationCenter() {
    const { user } = useAuth()
    const [medications, setMedications] = useState([])
    const [schedules, setSchedules] = useState([])
    const [logs, setLogs] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('today') // today | all | history
    const [ocrModal, setOcrModal] = useState(false)
    const [ocrProcessing, setOcrProcessing] = useState(false)

    useEffect(() => {
        if (user) fetchAll()
    }, [user])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [medsRes, schedRes, logsRes, rxRes] = await Promise.all([
                supabase.from('medications').select('*').eq('patient_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
                supabase.from('medication_schedules').select('*').eq('patient_id', user.id).order('scheduled_time'),
                supabase.from('medication_logs').select('*').eq('patient_id', user.id).eq('log_date', new Date().toISOString().split('T')[0]).order('created_at'),
                supabase.from('prescriptions').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
            ])
            setMedications(medsRes.data || [])
            setSchedules(schedRes.data || [])
            setLogs(logsRes.data || [])
            setPrescriptions(rxRes.data || [])
        } catch (err) {
            console.warn('Error fetching medications:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDoseAction = async (schedule, medication, action) => {
        try {
            const logEntry = {
                schedule_id: schedule.id,
                medication_id: medication.id,
                patient_id: user.id,
                log_date: new Date().toISOString().split('T')[0],
                status: action,
                taken_at: action === 'taken' ? new Date().toISOString() : null
            }
            const { error } = await supabase.from('medication_logs').insert([logEntry])
            if (error) throw error

            await logAudit({
                userId: user.id,
                action: action === 'taken' ? AUDIT_ACTIONS.DOSE_TAKEN : AUDIT_ACTIONS.DOSE_SKIPPED,
                entityType: 'medication',
                entityId: medication.id,
                description: `${medication.name} - ${action}`
            }).catch(() => {})

            toast.success(action === 'taken' ? `${medication.name} marked as taken` : `${medication.name} skipped`)
            fetchAll()
        } catch (err) {
            toast.error('Could not log dose')
        }
    }

    const getDoseStatus = (scheduleId) => {
        const log = logs.find(l => l.schedule_id === scheduleId)
        return log?.status || 'pending'
    }

    // Group schedules by medication
    const medSchedules = medications.map(med => ({
        ...med,
        schedules: schedules.filter(s => s.medication_id === med.id)
    }))

    // Calculate adherence
    const totalDoses = schedules.length
    const takenDoses = logs.filter(l => l.status === 'taken').length
    const adherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0

    // Next upcoming dose
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const nextDose = schedules
        .filter(s => s.scheduled_time > currentTime && getDoseStatus(s.id) === 'pending')
        .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))[0]

    const nextDoseMed = nextDose ? medications.find(m => m.id === nextDose.medication_id) : null

    const handleOcrUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setOcrProcessing(true)
        // Simulated OCR process
        setTimeout(() => {
            setOcrProcessing(false)
            setOcrModal(false)
            toast.success('Prescription scanned. Please review the extracted medications below.')
            toast('Some fields may need manual verification', { icon: '⚠️' })
        }, 3000)
    }

    if (loading) {
        return (
            <>
                <PageHeader title="Medication Center" description="Track your medications and stay on schedule" />
                <div className="dashboard-loading">
                    <div className="loading-spinner" />
                    <p>Loading medications...</p>
                </div>
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Medication Center"
                description="Track your medications and stay on schedule"
                action={
                    <button className="btn btn-primary" onClick={() => setOcrModal(true)} style={{ gap: '0.4rem' }}>
                        <Upload size={16} /> Upload Prescription
                    </button>
                }
            />

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem' }}>
                {/* Demo Banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1rem', background: '#FFFBEB',
                    border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem', color: '#92400E', fontWeight: 500,
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={15} />
                    <span><strong>Demo Mode</strong> — Medications shown are for demonstration. AI does NOT prescribe or modify dosages.</span>
                </div>

                {medications.length === 0 ? (
                    <div className="dashboard-empty" style={{ maxWidth: 520, margin: '2rem auto' }}>
                        <div className="dashboard-empty-icon">💊</div>
                        <h3>No active medications</h3>
                        <p>Your medication schedules will appear here when a prescription is added. Upload a prescription to get started.</p>
                        <ActionButton variant="primary" onClick={() => setOcrModal(true)} style={{ marginTop: '1rem' }}>
                            <Upload size={16} /> Upload Prescription
                        </ActionButton>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {/* Next Dose */}
                            <DashboardCard style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={20} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Next Dose</div>
                                        {nextDose ? (
                                            <>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{nextDose.scheduled_time}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{nextDoseMed?.name}</div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10B981' }}>All done for today!</div>
                                        )}
                                    </div>
                                </div>
                            </DashboardCard>

                            {/* Adherence */}
                            <DashboardCard style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: adherence >= 80 ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingUp size={20} style={{ color: adherence >= 80 ? '#059669' : '#D97706' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Today's Adherence</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: adherence >= 80 ? '#059669' : '#D97706' }}>{adherence}%</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{takenDoses}/{totalDoses} doses</div>
                                    </div>
                                </div>
                            </DashboardCard>

                            {/* Active Medications */}
                            <DashboardCard style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Pill size={20} style={{ color: '#4338CA' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Active Medications</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{medications.length}</div>
                                    </div>
                                </div>
                            </DashboardCard>
                        </div>

                        {/* Medication Schedule Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {medSchedules.map(med => (
                                <DashboardCard key={med.id} style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                                                {med.name}
                                            </h3>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                {med.dosage} • {med.frequency}
                                            </div>
                                            {med.instructions && (
                                                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 500, marginTop: '0.35rem' }}>
                                                    {med.instructions}
                                                </div>
                                            )}
                                        </div>
                                        <StatusBadge status={med.is_active ? 'healthy' : 'warning'}>
                                            {med.is_active ? 'Active' : 'Inactive'}
                                        </StatusBadge>
                                    </div>

                                    {med.schedules.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                            {med.schedules.map(sched => {
                                                const status = getDoseStatus(sched.id)
                                                return (
                                                    <div key={sched.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '0.65rem 0.85rem',
                                                        background: status === 'taken' ? '#F0FDF4' : status === 'skipped' ? '#F1F5F9' : 'var(--surface)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: `1px solid ${status === 'taken' ? '#BBF7D0' : 'var(--border-light)'}`
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: 36, height: 36, borderRadius: '50%',
                                                                background: status === 'taken' ? '#D1FAE5' : status === 'skipped' ? '#E2E8F0' : 'var(--primary-light)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                {status === 'taken' ? <CheckCircle size={18} style={{ color: '#059669' }} /> :
                                                                    status === 'skipped' ? <XCircle size={18} style={{ color: '#64748B' }} /> :
                                                                        <Clock size={18} style={{ color: 'var(--primary)' }} />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                                                    {sched.label || sched.scheduled_time}
                                                                </div>
                                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                    {sched.scheduled_time} • {MEAL_LABELS[sched.meal_relation] || sched.meal_relation}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {status === 'pending' ? (
                                                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                                    onClick={() => handleDoseAction(sched, med, 'taken')}
                                                                >
                                                                    <CheckCircle size={14} /> Taken
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                                                                    onClick={() => handleDoseAction(sched, med, 'skipped')}
                                                                >
                                                                    Skip
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <StatusBadge status={status === 'taken' ? 'healthy' : 'warning'}>
                                                                {status === 'taken' ? 'Taken' : 'Skipped'}
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </DashboardCard>
                            ))}
                        </div>

                        {/* Safety Disclaimer */}
                        <div style={{
                            padding: '1rem 1.25rem', background: '#F0F7FF',
                            border: '1px solid rgba(21,101,192,0.15)',
                            borderRadius: 'var(--radius-sm)', marginTop: '1.5rem',
                            fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6
                        }}>
                            <strong style={{ color: 'var(--text-dark)' }}>Medical Safety Notice:</strong> Medication schedules shown are AI-interpreted from your doctor's prescription. The AI does not modify dosage, frequency, or medication. Always follow your doctor's instructions. Contact your healthcare provider if you have questions.
                        </div>
                    </>
                )}

                {/* OCR Upload Modal */}
                <AnimatePresence>
                    {ocrModal && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !ocrProcessing && setOcrModal(false)}
                        >
                            <motion.div
                                className="modal-content"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                style={{ maxWidth: 480 }}
                            >
                                <button className="modal-close" onClick={() => !ocrProcessing && setOcrModal(false)}>×</button>
                                <div className="modal-header">
                                    <h3 className="modal-title">Upload Prescription</h3>
                                    <p className="modal-subtitle">Upload a prescription image or PDF to extract medication details</p>
                                </div>

                                <div style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: 'var(--radius)',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: ocrProcessing ? 'default' : 'pointer',
                                    background: '#FAFAFA',
                                    transition: 'all 0.2s'
                                }}
                                    onClick={() => !ocrProcessing && document.getElementById('rx-upload')?.click()}
                                >
                                    {ocrProcessing ? (
                                        <>
                                            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                                            <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Scanning prescription...</p>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Extracting medication details</p>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={32} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
                                            <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Click to upload or take photo</p>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supported: PDF, JPG, PNG (max 10MB)</p>
                                        </>
                                    )}
                                    <input
                                        id="rx-upload"
                                        type="file"
                                        accept="image/*,.pdf"
                                        style={{ display: 'none' }}
                                        onChange={handleOcrUpload}
                                        disabled={ocrProcessing}
                                    />
                                </div>

                                <div style={{
                                    marginTop: '1rem', padding: '0.75rem',
                                    background: '#FFFBEB', border: '1px solid #FDE68A',
                                    borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
                                    color: '#92400E', lineHeight: 1.5
                                }}>
                                    <strong>Important:</strong> AI will extract medication names and schedules from the prescription. You must review and confirm before activation. AI never independently changes dosage or medication.
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
