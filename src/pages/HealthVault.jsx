import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'
import { FileText, Upload, Trash2, Share2, Eye, Clock, ShieldCheck, X, UserX, Lock, Unlock, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import DataTable from '../components/ui/DataTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import InfoTooltip from '../components/ui/InfoTooltip'

const RECORD_TYPES = [
    { value: 'prescription', label: 'Prescription', icon: '💊' },
    { value: 'lab_report', label: 'Lab Report', icon: '🧪' },
    { value: 'scan', label: 'Scan / MRI', icon: '🔬' },
    { value: 'xray', label: 'X-Ray', icon: '☢️' },
    { value: 'discharge_summary', label: 'Discharge Summary', icon: '📋' },
    { value: 'other', label: 'Other', icon: '📄' }
]

const DURATION_OPTIONS = [
    { value: 30, label: '30 Minutes', unit: 'minutes' },
    { value: 1440, label: '24 Hours', unit: 'minutes' },
    { value: 10080, label: '7 Days', unit: 'minutes' }
]

export default function HealthVault() {
    const { user } = useAuth()
    const fileInputRef = useRef(null)

    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedType, setSelectedType] = useState('prescription')
    const [dragover, setDragover] = useState(false)

    // Share modal state
    const [shareModal, setShareModal] = useState(false)
    const [doctors, setDoctors] = useState([])
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [selectedDuration, setSelectedDuration] = useState(1440)
    const [sharing, setSharing] = useState(false)

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, recordId: null })

    // Permissions list (Doctors With Access)
    const [permissions, setPermissions] = useState([])
    const [revokingId, setRevokingId] = useState(null)

    // Access Requests
    const [accessRequests, setAccessRequests] = useState([])

    useEffect(() => {
        if (user) {
            fetchRecords()
            fetchPermissions()
            fetchAccessRequests()
        }
    }, [user])

    const fetchRecords = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('patient_records')
                .select('*')
                .eq('patient_id', user.id)
                .order('uploaded_at', { ascending: false })
            if (error) throw error
            setRecords(data || [])
        } catch (err) {
            console.error('Fetch records error:', err)
            toast.error('Failed to load records')
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const { data, error } = await supabase
                .from('record_permissions')
                .select('*')
                .eq('patient_id', user.id)
                .eq('access_granted', true)
                .eq('access_revoked', false)
                .order('created_at', { ascending: false })
            if (error) throw error

            const doctorIds = [...new Set((data || []).map(p => p.doctor_id))]
            let doctorMap = {}
            if (doctorIds.length > 0) {
                const { data: docs } = await supabase
                    .from('doctors')
                    .select('id, full_name, specialty, hospital')
                    .in('id', doctorIds)
                doctorMap = (docs || []).reduce((acc, d) => {
                    acc[d.id] = d
                    return acc
                }, {})
            }

            const enriched = (data || []).map(perm => ({
                ...perm,
                doctor_name: doctorMap[perm.doctor_id]?.full_name || 'Unknown Doctor',
                doctor_specialty: doctorMap[perm.doctor_id]?.specialty || '',
                doctor_hospital: doctorMap[perm.doctor_id]?.hospital_name || '—'
            }))

            setPermissions(enriched)
        } catch (err) {
            console.error('Fetch permissions error:', err)
        }
    }

    const fetchAccessRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('access_requests')
                .select('*')
                .eq('patient_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
            if (error) throw error

            // Enrich with doctor names
            const doctorIds = [...new Set((data || []).map(r => r.doctor_id))]
            let doctorMap = {}
            if (doctorIds.length > 0) {
                const { data: docs } = await supabase
                    .from('doctors')
                    .select('id, full_name, specialty')
                    .in('id', doctorIds)
                doctorMap = (docs || []).reduce((acc, d) => {
                    acc[d.id] = d
                    return acc
                }, {})
            }

            const enriched = (data || []).map(req => ({
                ...req,
                doctor_name: doctorMap[req.doctor_id]?.full_name || 'Unknown Doctor',
                doctor_specialty: doctorMap[req.doctor_id]?.specialty || ''
            }))

            setAccessRequests(enriched)
        } catch (err) {
            console.error('Fetch access requests error:', err)
        }
    }

    const handleAccessResponse = async (requestId, doctorId, action, durationMinutes = 30) => {
        try {
            // Update request status
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({ status: action === 'deny' ? 'denied' : 'approved' })
                .eq('id', requestId)
            if (updateError) throw updateError

            if (action !== 'deny') {
                // Grant permission
                const expiresAt = new Date()
                expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes)

                const { error: permError } = await supabase
                    .from('record_permissions')
                    .insert({
                        patient_id: user.id,
                        doctor_id: doctorId,
                        expires_at: expiresAt.toISOString(),
                        access_granted: true,
                        access_revoked: false
                    })
                if (permError) throw permError

                toast.success(`Access granted for ${durationMinutes >= 1440 ? '24 hours' : '30 minutes'}`)
            } else {
                toast.success('Access request denied')
            }

            // Remove from list
            setAccessRequests(prev => prev.filter(r => r.id !== requestId))
            fetchPermissions()
        } catch (err) {
            toast.error('Failed to process request: ' + err.message)
        }
    }

    const handleFileUpload = async (file) => {
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB')
            return
        }

        setUploading(true)
        try {
            const fileName = `${user.id}/${Date.now()}_${file.name}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('medical-records')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Store the file path — we'll generate signed URLs when viewing
            const { error: dbError } = await supabase
                .from('patient_records')
                .insert({
                    patient_id: user.id,
                    file_url: fileName,
                    file_name: file.name,
                    record_type: selectedType
                })
            if (dbError) throw dbError

            toast.success('Record uploaded successfully!')
            fetchRecords()
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Failed to upload: ' + err.message)
        } finally {
            setUploading(false)
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

    const handleDrop = (e) => {
        e.preventDefault()
        setDragover(false)
        const file = e.dataTransfer?.files?.[0]
        if (file) handleFileUpload(file)
    }

    const handleDeleteRecord = async () => {
        const recordId = deleteConfirm.recordId
        if (!recordId) return

        try {
            const record = records.find(r => r.id === recordId)
            if (record?.file_url) {
                const urlParts = record.file_url.split('/medical-records/')
                if (urlParts[1]) {
                    await supabase.storage.from('medical-records').remove([urlParts[1]])
                }
            }

            const { error } = await supabase
                .from('patient_records')
                .delete()
                .eq('id', recordId)
            if (error) throw error

            setRecords(prev => prev.filter(r => r.id !== recordId))
            toast.success('Record deleted')
        } catch (err) {
            toast.error('Failed to delete: ' + err.message)
        }
        setDeleteConfirm({ isOpen: false, recordId: null })
    }

    const openShareModal = async () => {
        setShareModal(true)
        try {
            const { data, error } = await supabase.from('doctors').select('id, full_name, specialty, profile_photo, avatar_url')
            if (error) throw error
            setDoctors(data || [])
        } catch (err) {
            toast.error('Failed to load doctors')
        }
    }

    const handleShare = async () => {
        if (!selectedDoctor) {
            toast.error('Please select a doctor')
            return
        }
        setSharing(true)
        try {
            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + selectedDuration)

            const { error } = await supabase
                .from('record_permissions')
                .insert({
                    patient_id: user.id,
                    doctor_id: selectedDoctor,
                    expires_at: expiresAt.toISOString(),
                    access_granted: true,
                    access_revoked: false
                })
            if (error) throw error

            toast.success('Access granted successfully!')
            setShareModal(false)
            setSelectedDoctor(null)
            fetchPermissions()
        } catch (err) {
            toast.error('Failed to share: ' + err.message)
        } finally {
            setSharing(false)
        }
    }

    const cancelAccess = async (permId) => {
        setRevokingId(permId)
        try {
            const { error } = await supabase
                .from('record_permissions')
                .update({ access_revoked: true })
                .eq('id', permId)
            if (error) throw error

            setPermissions(prev => prev.filter(p => p.id !== permId))
            toast.success('Doctor access removed successfully.')
        } catch (err) {
            toast.error('Failed to revoke access: ' + err.message)
        } finally {
            setRevokingId(null)
        }
    }

    const getTypeInfo = (type) => RECORD_TYPES.find(t => t.value === type) || RECORD_TYPES[5]

    const formatDate = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        } catch { return d }
    }

    const formatShortDate = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        } catch { return d }
    }

    const isExpired = (expiresAt) => new Date(expiresAt) < new Date()

    return (
        <>
            <PageHeader
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Health Vault
                        <InfoTooltip text="A secure storage system where patients upload prescriptions, reports, and scans. Access can be granted to doctors temporarily." />
                    </span>
                }
                description="Securely store, manage, and share your medical records."
            />

            {/* Access Requests Section */}
            {accessRequests.length > 0 && (
                <SectionContainer>
                    <div>
                        <div className="section-header">
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={20} color="#F59E0B" /> Access Requests
                                <span style={{
                                    background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem',
                                    fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)'
                                }}>
                                    {accessRequests.length}
                                </span>
                            </h2>
                            <p className="section-subtitle">
                                Doctors requesting temporary access to your sensitive records
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <AnimatePresence>
                                {accessRequests.map(req => (
                                    <motion.div
                                        key={req.id}
                                        className="access-request-card"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="access-request-info">
                                            <h4>Dr. {req.doctor_name}</h4>
                                            <p>
                                                {req.doctor_specialty || 'General Practice'} •
                                                Requested {formatDate(req.created_at)}
                                            </p>
                                        </div>
                                        <div className="access-request-actions">
                                            <button
                                                className="btn-approve"
                                                onClick={() => handleAccessResponse(req.id, req.doctor_id, 'approve', 30)}
                                            >
                                                <Clock size={12} /> Allow 30 min
                                            </button>
                                            <button
                                                className="btn-approve"
                                                onClick={() => handleAccessResponse(req.id, req.doctor_id, 'approve', 1440)}
                                            >
                                                <Clock size={12} /> Allow 24 hr
                                            </button>
                                            <button
                                                className="btn-deny"
                                                onClick={() => handleAccessResponse(req.id, req.doctor_id, 'deny')}
                                            >
                                                <X size={12} /> Deny
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </SectionContainer>
            )}

            <SectionContainer>
                <div>
                    {/* Record Type Selector */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Record Type</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {RECORD_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    className={`care-toggle-btn ${selectedType === type.value ? 'active' : ''}`}
                                    onClick={() => setSelectedType(type.value)}
                                    style={selectedType === type.value ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(21, 101, 192, 0.3)' } : {}}
                                >
                                    {type.icon} {type.label}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Upload Area */}
                    <div
                        className={`vault-upload-area ${dragover ? 'dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
                        onDragLeave={() => setDragover(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="upload-icon">📁</div>
                        <h3>{uploading ? 'Uploading...' : 'Upload Medical Record'}</h3>
                        <p>Drag & drop or click to select a file (max 10MB)</p>
                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.5rem' }}>
                            Supported formats: PDF, JPG, PNG, DICOM
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(e.target.files?.[0])}
                        />
                    </div>
                </div>
            </SectionContainer>

            {/* Records List */}
            <SectionContainer className="bg-surface">
                <div>
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} /> My Records
                            </h2>
                            <p className="section-subtitle">
                                {loading ? 'Loading...' : `${records.length} record${records.length !== 1 ? 's' : ''} stored`}
                            </p>
                        </div>
                        <ActionButton variant="primary" onClick={openShareModal}>
                            <Share2 size={15} /> Share With Doctor
                        </ActionButton>
                    </div>

                    {loading && (
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading records...</p>
                        </div>
                    )}

                    {!loading && records.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">📂</div>
                            <h3>No Medical Records Uploaded Yet</h3>
                            <p style={{ maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                                Upload prescriptions or reports to start your health history.
                            </p>
                            <ActionButton
                                variant="primary"
                                style={{ marginTop: '1rem' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={15} /> Upload Record
                            </ActionButton>
                        </div>
                    )}

                    {!loading && records.length > 0 && (
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
                                                    {record.sensitive && (
                                                        <span style={{
                                                            marginLeft: '0.4rem', background: '#FDF2F8',
                                                            color: '#9D174D', padding: '0.1rem 0.4rem',
                                                            borderRadius: 'var(--radius-pill)', fontSize: '0.68rem',
                                                            fontWeight: 600
                                                        }}>
                                                            <Lock size={10} style={{ verticalAlign: 'middle', marginRight: '0.15rem' }} />
                                                            Sensitive
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="record-card-actions">
                                            <ActionButton
                                                variant="outline"
                                                style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                                                onClick={() => handleViewRecord(record.file_url)}
                                            >
                                                <Eye size={14} /> View
                                            </ActionButton>
                                            <ActionButton
                                                variant="outline"
                                                style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem', borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                                                onClick={() => setDeleteConfirm({ isOpen: true, recordId: record.id })}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </ActionButton>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SectionContainer>

            {/* ─── Doctors With Access — Table View ─── */}
            <SectionContainer>
                <div>
                    <div className="section-header">
                        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} /> Doctors With Access
                        </h2>
                        <p className="section-subtitle">
                            {permissions.length} doctor{permissions.length !== 1 ? 's' : ''} currently have access to your records
                        </p>
                    </div>

                    {permissions.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No doctors currently have access to your records.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <DataTable>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>Doctor Name</th>
                                        <th style={{ padding: '1rem' }}>Hospital</th>
                                        <th style={{ padding: '1rem' }}>Access Given Date</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissions.map(perm => {
                                        const expired = isExpired(perm.expires_at)
                                        return (
                                            <tr key={perm.id}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{perm.doctor_name}</div>
                                                    {perm.doctor_specialty && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{perm.doctor_specialty}</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{perm.doctor_hospital}</td>
                                                <td style={{ padding: '1rem' }}>{formatShortDate(perm.created_at)}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`expiry-badge ${expired ? 'expired' : 'active'}`}>
                                                        <Clock size={11} /> {expired ? 'Expired' : 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {!expired && (
                                                        <ActionButton
                                                            variant="outline"
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                                                            onClick={() => cancelAccess(perm.id)}
                                                            disabled={revokingId === perm.id}
                                                        >
                                                            <UserX size={13} /> {revokingId === perm.id ? 'Revoking...' : 'Cancel Access'}
                                                        </ActionButton>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </div>
            </SectionContainer>

            {/* Share Modal */}
            <AnimatePresence>
                {shareModal && (
                    <div className="modal-overlay" onClick={() => setShareModal(false)}>
                        <motion.div
                            className="modal-content"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '520px' }}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button className="modal-close" onClick={() => setShareModal(false)}>&times;</button>
                            <div className="modal-header">
                                <h2 className="modal-title">Share Records With Doctor</h2>
                                <p className="modal-subtitle">Select a doctor and set access duration</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Select Doctor</label>
                                <div className="doctor-select-list">
                                    {doctors.map(doc => (
                                        <div
                                            key={doc.id}
                                            className={`doctor-select-item ${selectedDoctor === doc.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedDoctor(doc.id)}
                                        >
                                            <img
                                                className="doctor-mini-avatar"
                                                src={doc.profile_photo || doc.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                                alt={doc.full_name}
                                                loading="lazy"
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.full_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.specialty || 'General Practice'}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {doctors.length === 0 && (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No doctors available</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Access Duration</label>
                                <div className="duration-options">
                                    {DURATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`duration-btn ${selectedDuration === opt.value ? 'active' : ''}`}
                                            onClick={() => setSelectedDuration(opt.value)}
                                        >
                                            <Clock size={14} style={{ marginBottom: '0.25rem' }} /><br />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ActionButton
                                variant="primary"
                                style={{ width: '100%', marginTop: '1.5rem' }}
                                onClick={handleShare}
                                disabled={sharing || !selectedDoctor}
                            >
                                {sharing ? 'Sharing...' : '🔐 Grant Secure Access'}
                            </ActionButton>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Record?"
                message="This will permanently delete this medical record. This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteRecord}
                onCancel={() => setDeleteConfirm({ isOpen: false, recordId: null })}
            />
        </>
    )
}
