import { useState } from 'react'
import { useAuth } from '../../services/AuthContext'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Activity, Building2, Users, Clock, Plus, Play, Pause, XCircle,
    CheckCircle, AlertTriangle, ShieldCheck, BarChart3, Settings,
    TrendingUp, Calendar, RefreshCw
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'

// Demo departments and queues for admin control
const INITIAL_QUEUES = [
    {
        id: 'q-1',
        department: 'General Medicine',
        doctor: 'Dr. Priya Sharma',
        room: 'OPD-102',
        status: 'active',
        current_token: 119,
        last_token: 135,
        waiting_count: 14,
        avg_wait_min: 28,
        avg_consult_min: 12,
        peak_hour: '10:00 AM - 12:00 PM'
    },
    {
        id: 'q-2',
        department: 'Orthopedics',
        doctor: 'Dr. Anil Kumar',
        room: 'OPD-105',
        status: 'active',
        current_token: 42,
        last_token: 58,
        waiting_count: 16,
        avg_wait_min: 35,
        avg_consult_min: 18,
        peak_hour: '11:00 AM - 01:00 PM'
    },
    {
        id: 'q-3',
        department: 'Cardiology',
        doctor: 'Dr. Meena Rao',
        room: 'OPD-201',
        status: 'active',
        current_token: 18,
        last_token: 25,
        waiting_count: 7,
        avg_wait_min: 22,
        avg_consult_min: 20,
        peak_hour: '09:00 AM - 11:00 AM'
    },
    {
        id: 'q-4',
        department: 'Pulmonology',
        doctor: 'Dr. Ramesh Gupta',
        room: 'OPD-108',
        status: 'paused',
        current_token: 31,
        last_token: 40,
        waiting_count: 9,
        avg_wait_min: 40,
        avg_consult_min: 15,
        peak_hour: '10:30 AM - 12:30 PM'
    }
]

const INITIAL_AUDIT_LOGS = [
    { id: 'aud-1', time: '10:20 AM', action: 'EMERGENCY_OVERRIDE', target: 'Token A-121', actor: 'Dr. Priya Sharma', note: 'Acute epigastric radiating pain' },
    { id: 'aud-2', time: '10:14 AM', action: 'QUEUE_STATUS_CHANGE', target: 'OPD-108 Pulmonology', actor: 'Admin Desk 1', note: 'Status set to Paused (Sterilization break)' },
    { id: 'aud-3', time: '09:45 AM', action: 'TOKEN_CALLED', target: 'Token B-42', actor: 'Dr. Anil Kumar', note: 'Consultation initiated' },
    { id: 'aud-4', time: '09:00 AM', action: 'QUEUE_INITIALIZED', target: 'All OPD Wings', actor: 'Hospital Admin', note: 'Morning OPD session opened' }
]

export default function AdminQueue() {
    const { user } = useAuth()
    const [queues, setQueues] = useState(INITIAL_QUEUES)
    const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [activeTab, setActiveTab] = useState('live') // live | analytics | audit
    const [newQueue, setNewQueue] = useState({
        department: 'Dermatology',
        doctor: 'Dr. Kavitha Nair',
        room: 'OPD-112',
        max_tokens: 60,
        avg_consult_min: 15
    })

    // Toggle Queue status (Start / Pause / Close)
    const handleStatusChange = async (queueId, newStatus) => {
        setQueues(prev => prev.map(q => q.id === queueId ? { ...q, status: newStatus } : q))
        const qObj = queues.find(q => q.id === queueId)

        const logEntry = {
            id: 'aud-' + Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `QUEUE_${newStatus.toUpperCase()}`,
            target: `${qObj?.department} (${qObj?.room})`,
            actor: 'Hospital Admin',
            note: `Queue status changed to ${newStatus}`
        }
        setAuditLogs(prev => [logEntry, ...prev])

        toast.success(`${qObj?.department} queue status updated to ${newStatus}`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'opd_queue',
            entityId: queueId,
            description: `Admin changed status of ${qObj?.department} queue to ${newStatus}`
        })
    }

    // Call Next Patient Manually
    const handleCallNext = async (queueId) => {
        setQueues(prev => prev.map(q => {
            if (q.id === queueId) {
                const nextTok = q.current_token + 1
                return {
                    ...q,
                    current_token: nextTok,
                    waiting_count: Math.max(0, q.waiting_count - 1)
                }
            }
            return q
        }))

        const qObj = queues.find(q => q.id === queueId)
        toast.success(`Manually called Token #${qObj.current_token + 1} in ${qObj.department}`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'opd_queue',
            entityId: queueId,
            description: `Admin desk manually called next token in ${qObj.department}`
        })
    }

    // Create New OPD Queue
    const handleCreateQueue = (e) => {
        e.preventDefault()
        const created = {
            id: 'q-' + Date.now(),
            department: newQueue.department,
            doctor: newQueue.doctor,
            room: newQueue.room,
            status: 'active',
            current_token: 0,
            last_token: 0,
            waiting_count: 0,
            avg_wait_min: 15,
            avg_consult_min: Number(newQueue.avg_consult_min),
            peak_hour: '10:00 AM - 12:00 PM'
        }
        setQueues(prev => [...prev, created])
        setShowCreateModal(false)
        toast.success(`Created OPD Queue for ${created.department} (${created.doctor})`)
    }

    return (
        <div style={{ padding: '0 0 2rem 0' }}>
            <PageHeader
                title="Hospital OPD Operations & Queue Command"
                description="Monitor real-time patient queues, departmental capacity, consultation throughput, and clinical audit governance."
                action={
                    <ActionButton variant="primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> Configure New OPD Queue
                    </ActionButton>
                }
            />

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.5rem'
            }}>
                {[
                    { id: 'live', label: 'Live Department Queues', icon: Activity },
                    { id: 'analytics', label: 'Queue Analytics & Peak Times', icon: BarChart3 },
                    { id: 'audit', label: 'Clinical Priority Audit Trail', icon: ShieldCheck }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent'
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* LIVE QUEUES TAB */}
            {activeTab === 'live' && (
                <div>
                    {/* High-level KPIs */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <DashboardCard>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE DEPARTMENTS</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-dark)' }}>
                                {queues.filter(q => q.status === 'active').length} of {queues.length}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: '#16A34A' }}>All core wings operational</span>
                        </DashboardCard>

                        <DashboardCard>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PATIENTS IN WAITING</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--primary)' }}>
                                {queues.reduce((acc, q) => acc + q.waiting_count, 0)}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average wait ~29 min</span>
                        </DashboardCard>

                        <DashboardCard>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOSPITAL CONSULTATION RATE</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.2rem 0', color: '#16A34A' }}>
                                ~16.2 min
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Optimal clinic pace</span>
                        </DashboardCard>

                        <DashboardCard>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PEAK OPD TRAFFIC</span>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0', color: '#EA580C' }}>
                                10:00 - 12:30
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High load period</span>
                        </DashboardCard>
                    </div>

                    {/* Department Queue Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: '1.25rem'
                    }}>
                        {queues.map(q => (
                            <DashboardCard
                                key={q.id}
                                title={`${q.department} (${q.room})`}
                                icon={Building2}
                                action={
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: q.status === 'active' ? '#DCFCE7' : q.status === 'paused' ? '#FEF3C7' : '#F1F5F9',
                                        color: q.status === 'active' ? '#15803D' : q.status === 'paused' ? '#B45309' : '#64748B'
                                    }}>
                                        <span style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: q.status === 'active' ? '#16A34A' : q.status === 'paused' ? '#F59E0B' : '#94A3B8'
                                        }} />
                                        {q.status.toUpperCase()}
                                    </span>
                                }
                            >
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                        {q.doctor}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Consultation Avg: ~{q.avg_consult_min} min • Peak: {q.peak_hour}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    background: 'var(--surface)',
                                    padding: '0.85rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    marginBottom: '1rem'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SERVING NOW</span>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                                            Token #{q.current_token}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PATIENTS WAITING</span>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: q.waiting_count > 10 ? '#EA580C' : 'var(--text-dark)' }}>
                                            {q.waiting_count}
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <ActionButton
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleCallNext(q.id)}
                                        disabled={q.status !== 'active'}
                                    >
                                        <Users size={14} /> Call Next
                                    </ActionButton>

                                    {q.status === 'active' ? (
                                        <ActionButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusChange(q.id, 'paused')}
                                        >
                                            <Pause size={14} /> Pause
                                        </ActionButton>
                                    ) : (
                                        <ActionButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusChange(q.id, 'active')}
                                        >
                                            <Play size={14} /> Resume
                                        </ActionButton>
                                    )}

                                    <ActionButton
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange(q.id, q.status === 'closed' ? 'active' : 'closed')}
                                        style={{ color: '#DC2626' }}
                                    >
                                        {q.status === 'closed' ? 'Re-open' : 'Close Wing'}
                                    </ActionButton>
                                </div>
                            </DashboardCard>
                        ))}
                    </div>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <DashboardCard title="Departmental Waiting Duration vs Target" icon={BarChart3}>
                        <div style={{ padding: '0.5rem 0' }}>
                            {queues.map(q => (
                                <div key={q.id} style={{ marginBottom: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                        <span style={{ fontWeight: 600 }}>{q.department} ({q.doctor})</span>
                                        <span style={{ color: 'var(--text-muted)' }}>Avg Wait: {q.avg_wait_min} min (Target: &lt; 30 min)</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, (q.avg_wait_min / 45) * 100)}%`,
                                            height: '100%',
                                            background: q.avg_wait_min > 30 ? '#EA580C' : 'var(--primary)',
                                            borderRadius: '4px'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>

                    <DashboardCard title="Peak OPD Hours & Capacity Planning" icon={TrendingUp}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                            <p>
                                <strong>System Load Insight:</strong> Peak hospital footfall consistently peaks between <strong>10:00 AM and 12:30 PM</strong> across General Medicine and Orthopedic clinics.
                            </p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginTop: '1rem'
                            }}>
                                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Morning Session (08:30 - 13:00)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>64% of total daily tokens</div>
                                </div>
                                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Afternoon Session (14:00 - 17:30)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>36% of total daily tokens</div>
                                </div>
                            </div>
                        </div>
                    </DashboardCard>
                </div>
            )}

            {/* AUDIT LOG TAB */}
            {activeTab === 'audit' && (
                <DashboardCard title="OPD Clinical Governance & Override Audit Log" icon={ShieldCheck}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        All queue priority elevation, manual call-ins, and schedule pauses are permanently logged per medical governance protocols.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.75rem' }}>Time</th>
                                    <th style={{ padding: '0.75rem' }}>Event Action</th>
                                    <th style={{ padding: '0.75rem' }}>Target</th>
                                    <th style={{ padding: '0.75rem' }}>Authorized Actor</th>
                                    <th style={{ padding: '0.75rem' }}>Clinical Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.time}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: log.action.includes('EMERGENCY') ? '#FEE2E2' : '#E0F2FE',
                                                color: log.action.includes('EMERGENCY') ? '#DC2626' : '#0369A1'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{log.target}</td>
                                        <td style={{ padding: '0.75rem' }}>{log.actor}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{log.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DashboardCard>
            )}

            {/* Create Queue Modal */}
            {showCreateModal && (
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
                            maxWidth: '480px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-dark)' }}>
                            Configure New OPD Clinic Queue
                        </h3>

                        <form onSubmit={handleCreateQueue} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    value={newQueue.department}
                                    onChange={e => setNewQueue({ ...newQueue, department: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Assigned Doctor
                                </label>
                                <input
                                    type="text"
                                    value={newQueue.doctor}
                                    onChange={e => setNewQueue({ ...newQueue, doctor: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Chamber / Room
                                    </label>
                                    <input
                                        type="text"
                                        value={newQueue.room}
                                        onChange={e => setNewQueue({ ...newQueue, room: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Target Duration (Min)
                                    </label>
                                    <input
                                        type="number"
                                        value={newQueue.avg_consult_min}
                                        onChange={e => setNewQueue({ ...newQueue, avg_consult_min: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <ActionButton variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </ActionButton>
                                <ActionButton variant="primary" type="submit">
                                    Create Queue
                                </ActionButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
