import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'
import { FileText, Eye, Clock, UserCheck, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import InfoTooltip from '../components/ui/InfoTooltip'

const RECORD_TYPE_MAP = {
    prescription: { label: 'Prescription', icon: '💊' },
    lab_report: { label: 'Lab Report', icon: '🧪' },
    scan: { label: 'Scan / MRI', icon: '🔬' },
    xray: { label: 'X-Ray', icon: '☢️' },
    discharge_summary: { label: 'Discharge Summary', icon: '📋' },
    other: { label: 'Other', icon: '📄' }
}

// Demo placeholder patients for when no real data exists
const DEMO_PATIENTS = [
    { id: 'demo-1', name: 'Ananya Reddy', permissions: 1, timeLeft: '6h 30m remaining' },
    { id: 'demo-2', name: 'Priya Sharma', permissions: 2, timeLeft: '23h 15m remaining' },
    { id: 'demo-3', name: 'Neha Kapoor', permissions: 1, timeLeft: '2d 4h remaining' },
    { id: 'demo-4', name: 'Kavya Iyer', permissions: 1, timeLeft: '11h 45m remaining' },
    { id: 'demo-5', name: 'Aditi Verma', permissions: 3, timeLeft: '5d 12h remaining' },
    { id: 'demo-6', name: 'Sneha Patil', permissions: 1, timeLeft: '1h 20m remaining' },
    { id: 'demo-7', name: 'Meera Nair', permissions: 2, timeLeft: '3d 6h remaining' }
]

export default function DoctorPatientRecords() {
    const { user } = useAuth()
    const [permissions, setPermissions] = useState([])
    const [selectedPatientId, setSelectedPatientId] = useState(null)
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [recordsLoading, setRecordsLoading] = useState(false)
    const [fetchError, setFetchError] = useState(null)
    const [recordsError, setRecordsError] = useState(null)

    // Access request loading
    const [requestingAccess, setRequestingAccess] = useState(false)

    useEffect(() => {
        if (user) fetchPermissions()
    }, [user])

    const fetchPermissions = async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const { data, error } = await supabase
                .from('record_permissions')
                .select('*')
                .eq('doctor_id', user.id)
                .eq('access_granted', true)
                .eq('access_revoked', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
            if (error) throw error

            const patientIds = [...new Set((data || []).map(p => p.patient_id))]
            let patientMap = {}
            if (patientIds.length > 0) {
                const { data: patients } = await supabase
                    .from('patients')
                    .select('id, full_name, email')
                    .in('id', patientIds)
                patientMap = (patients || []).reduce((acc, p) => {
                    acc[p.id] = p
                    return acc
                }, {})
            }

            const enriched = (data || []).map(perm => ({
                ...perm,
                patient_name: patientMap[perm.patient_id]?.full_name || patientMap[perm.patient_id]?.email || 'Unknown Patient',
                patient_email: patientMap[perm.patient_id]?.email || ''
            }))

            setPermissions(enriched)
        } catch (err) {
            console.error('Fetch permissions error:', err)
            setFetchError('Unable to load patient records. Please retry.')
        } finally {
            setLoading(false)
        }
    }

    const loadPatientRecords = async (patientId) => {
        setSelectedPatientId(patientId)
        setRecordsLoading(true)
        setRecordsError(null)
        setHiddenCount(0)
        try {
            let query = supabase
                .from('patient_records')
                .select('*')
                .eq('patient_id', patientId)
                .order('uploaded_at', { ascending: false })

            const { data, error } = await query
            if (error) throw error

            setRecords(data || [])


        } catch (err) {
            console.error('Fetch records error:', err)
            setRecordsError('Unable to load patient records. Please retry.')
        } finally {
            setRecordsLoading(false)
        }
    }


    const requestSensitiveAccess = async () => {
        if (!selectedPatientId) return
        setRequestingAccess(true)
        try {
            // Check if a pending request already exists
            const { data: existing } = await supabase
                .from('access_requests')
                .select('id')
                .eq('doctor_id', user.id)
                .eq('patient_id', selectedPatientId)
                .eq('status', 'pending')
                .limit(1)

            if (existing && existing.length > 0) {
                toast('Access request already pending', { icon: '⏳' })
                setRequestingAccess(false)
                return
            }

            const { error } = await supabase
                .from('access_requests')
                .insert({
                    doctor_id: user.id,
                    patient_id: selectedPatientId,
                    status: 'pending',
                    requested_duration: 30
                })
            if (error) throw error

            // Also insert a notification for the patient
            await supabase.from('notifications').insert({
                user_id: selectedPatientId,
                message: 'A doctor has requested temporary access to your sensitive medical records. Please review in Health Vault.',
                type: 'access_request'
            }).catch(() => { }) // Non-critical

            toast.success('Access request sent to patient')
        } catch (err) {
            toast.error('Failed to send request: ' + err.message)
        } finally {
            setRequestingAccess(false)
        }
    }

    const handleViewRecord = async (filePath) => {
        try {
            let actualPath = filePath
            if (filePath.includes('/medical-records/')) {
                actualPath = filePath.split('/medical-records/')[1]
            }

            const { data, error } = await supabase.storage
                .from('medical-records')
                .createSignedUrl(actualPath, 3600) // 1 hour expiry
            
            if (error) throw error
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank')
            }
        } catch (err) {
            console.error('Error generating signed URL:', err)
            toast.error('Failed to open file: ' + err.message)
        }
    }

    const formatDate = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        } catch { return d }
    }

    const getTimeRemaining = (expiresAt) => {
        const diff = new Date(expiresAt) - new Date()
        if (diff <= 0) return 'Expired'
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`
        if (hours > 0) return `${hours}h ${minutes}m remaining`
        return `${minutes}m remaining`
    }

    const getTypeInfo = (type) => RECORD_TYPE_MAP[type] || RECORD_TYPE_MAP.other

    // Group permissions by patient
    const patientGroups = permissions.reduce((acc, perm) => {
        const pid = perm.patient_id
        if (!acc[pid]) {
            acc[pid] = {
                patientName: perm.patient_name || 'Unknown Patient',
                permissions: []
            }
        }
        acc[pid].permissions.push(perm)
        return acc
    }, {})

    const hasRealPatients = Object.keys(patientGroups).length > 0

    return (
        <>
            <PageHeader
                title="Patient Records"
                description="View medical records shared by your patients."
            />


            <SectionContainer>
                <div>
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserCheck size={20} /> Patients With Shared Access
                            </h2>
                            <p className="section-subtitle">
                                {loading ? 'Loading...' : hasRealPatients
                                    ? `${Object.keys(patientGroups).length} patient${Object.keys(patientGroups).length !== 1 ? 's' : ''} sharing records`
                                    : 'Demo patients shown below'
                                }
                            </p>
                        </div>
                        <ActionButton variant="outline" onClick={fetchPermissions} style={{ fontSize: '0.8rem' }}>
                            <RefreshCw size={14} /> Refresh
                        </ActionButton>
                    </div>

                    {loading && (
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading patient records...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && fetchError && (
                        <div style={{ padding: '2rem', textAlign: 'center', background: '#FEF2F2', borderRadius: 'var(--radius)', border: '1px solid #FECACA' }}>
                            <AlertCircle size={32} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
                            <h3 style={{ color: '#991B1B', fontSize: '1rem', marginBottom: '0.5rem' }}>Unable to load patient records. Please retry.</h3>
                            <ActionButton variant="primary" onClick={fetchPermissions} style={{ marginTop: '0.5rem' }}>
                                <RefreshCw size={14} /> Try Again
                            </ActionButton>
                        </div>
                    )}

                    {/* Empty State with demo patients */}
                    {!loading && !fetchError && !hasRealPatients && (
                        <div>
                            <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A', marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#92400E', fontWeight: 500 }}>
                                    📋 No patient records shared yet. Below are sample patients for demo purposes.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {DEMO_PATIENTS.map(demo => (
                                    <DashboardCard key={demo.id} style={{ padding: '1rem 1.25rem', opacity: 0.85 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{demo.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {demo.permissions} permission{demo.permissions !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className="expiry-badge active"><Clock size={12} /> {demo.timeLeft}</span>
                                                <ActionButton variant="outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', opacity: 0.6 }} disabled>
                                                    <Eye size={13} /> View Records
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </DashboardCard>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Real patients */}
                    {!loading && !fetchError && hasRealPatients && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {Object.entries(patientGroups).map(([patientId, group]) => {
                                const isSelected = selectedPatientId === patientId
                                const latestPerm = group.permissions[0]
                                return (
                                    <motion.div
                                        key={patientId}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <DashboardCard
                                            style={{
                                                padding: '1.25rem',
                                                cursor: 'pointer',
                                                border: isSelected ? '2px solid var(--primary)' : undefined,
                                                background: isSelected ? 'var(--primary-light)' : undefined
                                            }}
                                            onClick={() => loadPatientRecords(patientId)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>
                                                        {group.patientName}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                        {group.permissions.length} active permission{group.permissions.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className="expiry-badge active">
                                                        <Clock size={12} /> {getTimeRemaining(latestPerm.expires_at)}
                                                    </span>
                                                    <ActionButton
                                                        variant={isSelected ? 'primary' : 'outline'}
                                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                                        onClick={(e) => { e.stopPropagation(); loadPatientRecords(patientId) }}
                                                    >
                                                        <Eye size={14} /> View Records
                                                    </ActionButton>
                                                </div>
                                            </div>
                                        </DashboardCard>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SectionContainer>

            {/* Selected Patient's Records */}
            {selectedPatientId && (
                <SectionContainer className="bg-surface">
                    <div>
                        <div className="section-header">
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} /> Medical Records
                            </h2>
                            <p className="section-subtitle">
                                {recordsLoading ? 'Loading...' : `${records.length} record${records.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>

                        {recordsLoading && (
                            <div className="dashboard-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading records...</p>
                            </div>
                        )}

                        {/* Records error */}
                        {!recordsLoading && recordsError && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', background: '#FEF2F2', borderRadius: 'var(--radius)', border: '1px solid #FECACA' }}>
                                <p style={{ margin: 0, color: '#991B1B', fontWeight: 500 }}>Unable to load patient records. Please retry.</p>
                                <ActionButton variant="outline" onClick={() => loadPatientRecords(selectedPatientId)} style={{ marginTop: '0.75rem' }}>
                                    <RefreshCw size={14} /> Retry
                                </ActionButton>
                            </div>
                        )}



                        {!recordsLoading && !recordsError && records.length === 0 && (
                            <div className="dashboard-empty">
                                <div className="dashboard-empty-icon">📄</div>
                                <h3>No Records</h3>
                                <p>This patient hasn't uploaded any records yet.</p>
                            </div>
                        )}

                        {!recordsLoading && !recordsError && records.length > 0 && (
                            <div className="records-grid">
                                {records.map(record => {
                                    const typeInfo = getTypeInfo(record.record_type)
                                    return (
                                        <motion.div
                                            className="record-card"
                                            key={record.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="record-card-header">
                                                <div className={`record-type-icon ${record.record_type}`}>
                                                    {typeInfo.icon}
                                                </div>
                                                <div className="record-card-info">
                                                    <h4>{record.file_name || typeInfo.label}</h4>
                                                    <p>
                                                        {typeInfo.label} • {formatDate(record.uploaded_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="record-card-actions">
                                                <ActionButton
                                                    variant="primary"
                                                    style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                                                    onClick={() => handleViewRecord(record.file_url)}
                                                >
                                                    <Eye size={14} /> View Record
                                                </ActionButton>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FFFBEB', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A' }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ShieldCheck size={16} /> Access is temporary and expires automatically based on patient-set duration.
                            </p>
                        </div>
                    </div>
                </SectionContainer>
            )}
        </>
    )
}
