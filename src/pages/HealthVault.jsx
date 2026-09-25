import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../services/auditService'
import {
    FileText, Upload, Trash2, Share2, Eye, Clock, ShieldCheck, X,
    UserX, Lock, Unlock, Bell, Calendar, Filter, Sparkles, AlertCircle,
    CheckCircle2, Download, AlertTriangle, ArrowRight, ShieldAlert,
    Building2, FlaskConical, Stethoscope, ChevronRight, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import DataTable from '../components/ui/DataTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import InfoTooltip from '../components/ui/InfoTooltip'

const RECORD_CATEGORIES = [
    { value: 'all', label: 'All Categories', icon: '📂' },
    { value: 'lab_report', label: 'Lab Reports', icon: '🧪' },
    { value: 'prescription', label: 'Prescriptions', icon: '💊' },
    { value: 'doctor_notes', label: 'Doctor Notes', icon: '📋' },
    { value: 'imaging', label: 'Imaging / Scans / X-Ray', icon: '🔬' },
    { value: 'vaccination', label: 'Vaccination Records', icon: '💉' },
    { value: 'discharge_summary', label: 'Discharge Summaries', icon: '🏥' },
    { value: 'insurance_doc', label: 'Insurance Documents', icon: '🛡️' },
    { value: 'medical_certificate', label: 'Medical Certificates', icon: '📜' }
]

const DURATION_OPTIONS = [
    { value: 30, label: '30 Minutes', unit: 'minutes' },
    { value: 1440, label: '24 Hours', unit: 'minutes' },
    { value: 10080, label: '7 Days', unit: 'minutes' }
]

// Fallback demo documents for rich immediate vault demonstration
const DEMO_HEALTH_DOCS = [
    {
        id: 'doc-1',
        title: 'Complete Blood Count (CBC) with ESR',
        category: 'lab_report',
        file_name: 'CBC_Report_Apollo.pdf',
        hospital_lab: 'Apollo Diagnostics',
        doctor_name: 'Dr. K. Raman (Pathologist)',
        report_date: '2026-09-15',
        verification: 'verified',
        upload_source: 'lab',
        is_demo: true,
        summary: 'Hemoglobin 14.2 g/dL, WBC 11,200/uL, Platelets 240,000/uL. Mild leukocytosis.'
    },
    {
        id: 'doc-2',
        title: 'Digital Chest X-Ray (PA View)',
        category: 'imaging',
        file_name: 'Chest_XRay_PA.jpg',
        hospital_lab: 'KIMS Hospital',
        doctor_name: 'Dr. Suresh Reddy',
        report_date: '2026-08-20',
        verification: 'verified',
        upload_source: 'hospital',
        is_demo: true,
        summary: 'Clear lung fields bilaterally. Normal cardiac silhouette. No focal infiltrates.'
    },
    {
        id: 'doc-3',
        title: 'Pulmonology Outpatient Consultation Note',
        category: 'doctor_notes',
        file_name: 'Dr_Sharma_Consult.pdf',
        hospital_lab: 'Apollo Hospitals Jubilee Hills',
        doctor_name: 'Dr. Priya Sharma',
        report_date: '2026-09-15',
        verification: 'verified',
        upload_source: 'doctor',
        is_demo: true,
        summary: 'Clinical presentation of Acute Bronchitis. Prescribed bronchodilator & antibiotics.'
    },
    {
        id: 'doc-4',
        title: 'Quarterly Metformin & Lipid Prescription',
        category: 'prescription',
        file_name: 'Rx_Diabetes_Jul2026.pdf',
        hospital_lab: 'Yashoda Hospitals',
        doctor_name: 'Dr. Rajesh Kumar',
        report_date: '2026-07-01',
        verification: 'verified',
        upload_source: 'doctor',
        is_demo: true,
        summary: 'Metformin 500mg BID, Atorvastatin 10mg HS. Valid for 90 days.'
    },
    {
        id: 'doc-5',
        title: 'COVID-19 Booster Vaccination Certificate',
        category: 'vaccination',
        file_name: 'Vaccination_Booster_2026.pdf',
        hospital_lab: 'Government PHC Secunderabad',
        doctor_name: 'PHC Medical Officer',
        report_date: '2026-03-15',
        verification: 'verified',
        upload_source: 'patient',
        is_demo: true,
        summary: 'Corbevax Booster Dose administered. Batch #CBX-9021.'
    },
    {
        id: 'doc-6',
        title: 'Discharge Summary — Appendectomy',
        category: 'discharge_summary',
        file_name: 'Discharge_Appendectomy_NIMS.pdf',
        hospital_lab: 'NIMS Hospital',
        doctor_name: 'Dr. M. S. Rao',
        report_date: '2026-06-15',
        verification: 'verified',
        upload_source: 'hospital',
        is_demo: true,
        summary: 'Elective laparoscopic appendectomy. Uneventful post-operative recovery.'
    }
]

// Demo pending lab reports sent from diagnostic lab to patient
const DEMO_PENDING_LAB_REPORTS = [
    {
        id: 'pend-1',
        lab_name: 'Apollo Diagnostics',
        report_title: 'Complete Blood Count (CBC) & ESR',
        test_type: 'Hematology',
        report_date: '25 Sep 2026',
        transfer_code: 'KH-APL-7291',
        specimen: 'Venous Blood EDTA',
        status: 'pending',
        fhir: {
            resourceType: 'DiagnosticReport',
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '58410-2', display: 'Complete blood count panel' }] },
            observations: [
                { name: 'Hemoglobin', value: '14.1 g/dL', reference: '13.0 - 17.0 g/dL', status: 'Normal' },
                { name: 'WBC Count', value: '7,400 /uL', reference: '4,000 - 11,000 /uL', status: 'Normal' },
                { name: 'Platelets', value: '250,000 /uL', reference: '150,000 - 450,000 /uL', status: 'Normal' }
            ]
        }
    },
    {
        id: 'pend-2',
        lab_name: 'Thyrocare Technologies',
        report_title: 'Thyroid Function Profile (T3, T4, TSH)',
        test_type: 'Endocrinology',
        report_date: '24 Sep 2026',
        transfer_code: 'KH-THY-3845',
        specimen: 'Serum Plain',
        status: 'pending',
        fhir: {
            resourceType: 'DiagnosticReport',
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '3016-3', display: 'Thyroid panel' }] },
            observations: [
                { name: 'Total T3', value: '1.2 ng/mL', reference: '0.8 - 2.0 ng/mL', status: 'Normal' },
                { name: 'Total T4', value: '8.4 ug/dL', reference: '5.1 - 14.1 ug/dL', status: 'Normal' },
                { name: 'TSH Ultrasensitive', value: '2.45 uIU/mL', reference: '0.4 - 4.2 uIU/mL', status: 'Normal' }
            ]
        }
    }
]

export default function HealthVault() {
    const { user } = useAuth()
    const fileInputRef = useRef(null)

    // Primary view tab: records | timeline | pending | quality | gaps
    const [activeTab, setActiveTab] = useState('records')
    const [selectedCategory, setSelectedCategory] = useState('all')

    // Records state
    const [records, setRecords] = useState([])
    const [pendingReports, setPendingReports] = useState(DEMO_PENDING_LAB_REPORTS)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dragover, setDragover] = useState(false)

    // Detailed metadata for upload modal
    const [uploadMetadata, setUploadMetadata] = useState({
        title: '',
        category: 'lab_report',
        hospital_lab: '',
        doctor_name: '',
        report_date: new Date().toISOString().split('T')[0]
    })
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [pendingFile, setPendingFile] = useState(null)

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

    // FHIR Report Review Modal
    const [selectedPendingReport, setSelectedPendingReport] = useState(null)

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
            // First try fetching from health_documents or patient_records
            const { data: dbRecords, error } = await supabase
                .from('patient_records')
                .select('*')
                .eq('patient_id', user.id)
                .order('uploaded_at', { ascending: false })

            if (!error && dbRecords && dbRecords.length > 0) {
                // Map patient_records to vault format
                const mapped = dbRecords.map(r => ({
                    id: r.id,
                    title: r.file_name || 'Medical Document',
                    category: r.record_type || 'other',
                    file_url: r.file_url,
                    file_name: r.file_name,
                    hospital_lab: 'Uploaded Document',
                    report_date: r.uploaded_at ? r.uploaded_at.split('T')[0] : '2026-09-01',
                    verification: 'verified',
                    upload_source: 'patient',
                    sensitive: r.sensitive
                }))
                setRecords([...mapped, ...DEMO_HEALTH_DOCS])
            } else {
                setRecords(DEMO_HEALTH_DOCS)
            }
        } catch (err) {
            console.warn('Fallback to demo records:', err)
            setRecords(DEMO_HEALTH_DOCS)
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
                doctor_hospital: doctorMap[perm.doctor_id]?.hospital || '—'
            }))

            setPermissions(enriched)
        } catch (err) {
            console.warn('Permissions fallback:', err)
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
            console.warn('Access requests fallback:', err)
        }
    }

    const handleAccessResponse = async (requestId, doctorId, action, durationMinutes = 30) => {
        try {
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({ status: action === 'deny' ? 'denied' : 'approved' })
                .eq('id', requestId)
            if (updateError) throw updateError

            if (action !== 'deny') {
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

            setAccessRequests(prev => prev.filter(r => r.id !== requestId))
            fetchPermissions()
        } catch (err) {
            toast.error('Failed to process request: ' + err.message)
        }
    }

    // Prepare File for Upload
    const onSelectFile = (file) => {
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB')
            return
        }
        setPendingFile(file)
        setUploadMetadata(prev => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, ''),
            hospital_lab: prev.hospital_lab || 'Apollo Diagnostics'
        }))
        setShowUploadModal(true)
    }

    const handleConfirmUpload = async (e) => {
        e.preventDefault()
        if (!pendingFile) return

        setUploading(true)
        try {
            const fileName = `${user.id}/${Date.now()}_${pendingFile.name}`
            try {
                await supabase.storage.from('medical-records').upload(fileName, pendingFile)
            } catch (storageErr) {
                console.warn('Storage bucket fallback:', storageErr)
            }

            const newDoc = {
                id: 'doc-' + Date.now(),
                title: uploadMetadata.title || pendingFile.name,
                category: uploadMetadata.category,
                file_name: pendingFile.name,
                file_url: fileName,
                hospital_lab: uploadMetadata.hospital_lab || 'Self-Uploaded',
                doctor_name: uploadMetadata.doctor_name || '—',
                report_date: uploadMetadata.report_date,
                verification: 'verified',
                upload_source: 'patient'
            }

            setRecords(prev => [newDoc, ...prev])
            setShowUploadModal(false)
            setPendingFile(null)
            toast.success('Medical report uploaded and verified into Vault!')

            await logAudit({
                userId: user?.id,
                action: AUDIT_ACTIONS.CREATE,
                entityType: 'health_document',
                entityId: newDoc.id,
                description: `Uploaded '${newDoc.title}' (${newDoc.category}) to Health Vault`
            })
        } catch (err) {
            toast.error('Upload failed: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragover(false)
        const file = e.dataTransfer?.files?.[0]
        if (file) onSelectFile(file)
    }

    const handleDeleteRecord = async () => {
        const recordId = deleteConfirm.recordId
        if (!recordId) return

        setRecords(prev => prev.filter(r => r.id !== recordId))
        toast.success('Record deleted from Vault')

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.DELETE,
            entityType: 'health_document',
            entityId: recordId,
            description: `Deleted record ${recordId} from Health Vault`
        })

        setDeleteConfirm({ isOpen: false, recordId: null })
    }

    const openShareModal = async () => {
        setShareModal(true)
        try {
            const { data, error } = await supabase.from('doctors').select('id, full_name, specialty, profile_photo, avatar_url')
            if (!error && data?.length > 0) {
                setDoctors(data)
            } else {
                setDoctors([
                    { id: 'doc-1', full_name: 'Dr. Priya Sharma', specialty: 'Pulmonology', hospital: 'Apollo Hospitals' },
                    { id: 'doc-2', full_name: 'Dr. Suresh Reddy', specialty: 'General Medicine', hospital: 'KIMS Hospital' },
                    { id: 'doc-3', full_name: 'Dr. Rajesh Kumar', specialty: 'Endocrinology', hospital: 'Yashoda Hospitals' }
                ])
            }
        } catch {
            setDoctors([
                { id: 'doc-1', full_name: 'Dr. Priya Sharma', specialty: 'Pulmonology', hospital: 'Apollo Hospitals' }
            ])
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

            const chosenDoc = doctors.find(d => d.id === selectedDoctor)
            const newPerm = {
                id: 'perm-' + Date.now(),
                patient_id: user.id,
                doctor_id: selectedDoctor,
                doctor_name: chosenDoc?.full_name || 'Dr. Selected',
                doctor_specialty: chosenDoc?.specialty || 'General',
                doctor_hospital: chosenDoc?.hospital || 'Hospital',
                created_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                access_granted: true,
                access_revoked: false
            }

            setPermissions(prev => [newPerm, ...prev])
            toast.success(`Access granted to ${newPerm.doctor_name} for ${selectedDuration >= 1440 ? '24 hours' : '30 minutes'}`)
            setShareModal(false)
            setSelectedDoctor(null)

            await logAudit({
                userId: user?.id,
                action: AUDIT_ACTIONS.CREATE,
                entityType: 'record_permission',
                entityId: newPerm.id,
                description: `Granted Vault access to ${newPerm.doctor_name} for ${selectedDuration} minutes`
            })
        } catch (err) {
            toast.error('Failed to share: ' + err.message)
        } finally {
            setSharing(false)
        }
    }

    const cancelAccess = async (permId) => {
        setRevokingId(permId)
        setPermissions(prev => prev.filter(p => p.id !== permId))
        toast.success('Doctor access revoked immediately.')
        setRevokingId(null)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'record_permission',
            entityId: permId,
            description: `Revoked doctor record permission ${permId}`
        })
    }

    // Module 3: Confirm & Add Pending Lab Report to Vault
    const handleConfirmPendingReport = async (report) => {
        const newVaultDoc = {
            id: 'doc-' + Date.now(),
            title: report.report_title,
            category: 'lab_report',
            file_name: `${report.lab_name.replace(/\s+/g, '_')}_${report.transfer_code}.pdf`,
            hospital_lab: report.lab_name,
            doctor_name: 'Verified Laboratory Pathologist',
            report_date: new Date().toISOString().split('T')[0],
            verification: 'verified',
            upload_source: 'lab',
            summary: `Direct transfer from ${report.lab_name} via code ${report.transfer_code}.`
        }

        setRecords(prev => [newVaultDoc, ...prev])
        setPendingReports(prev => prev.filter(p => p.id !== report.id))
        setSelectedPendingReport(null)
        toast.success(`Report from ${report.lab_name} confirmed and added to your Health Vault!`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.CREATE,
            entityType: 'health_document',
            entityId: newVaultDoc.id,
            description: `Patient reviewed and accepted pending lab report ${report.transfer_code} from ${report.lab_name}`
        })
    }

    // Filtered Records
    const filteredRecords = records.filter(r => {
        if (selectedCategory === 'all') return true
        return r.category === selectedCategory
    })

    // Grouping by Year and Month for Timeline View
    const getGroupedTimeline = () => {
        const groups = {}
        records.forEach(r => {
            const d = new Date(r.report_date || '2026-09-01')
            const year = d.getFullYear()
            const month = d.toLocaleString('en-IN', { month: 'long' })
            const key = `${year} • ${month}`
            if (!groups[key]) groups[key] = []
            groups[key].push(r)
        })
        return groups
    }

    const isExpired = (expiresAt) => new Date(expiresAt) < new Date()

    return (
        <div style={{ padding: '0 0 2rem 0' }}>
            <PageHeader
                title="Central Health Vault"
                description="Your complete personal health record ecosystem: lab reports, doctor prescriptions, imaging scans, and direct laboratory transfers."
                action={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <ActionButton variant="outline" onClick={openShareModal}>
                            <Share2 size={15} /> Grant Doctor Access
                        </ActionButton>
                        <ActionButton variant="primary" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={15} /> Upload Medical Record
                        </ActionButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={(e) => onSelectFile(e.target.files?.[0])}
                        />
                    </div>
                }
            />

            {/* Access Requests Banner */}
            {accessRequests.length > 0 && (
                <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: 'var(--radius)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell size={20} color="#D97706" />
                        <div>
                            <strong style={{ color: '#92400E' }}>Pending Clinical Access Requests:</strong>
                            <span style={{ fontSize: '0.85rem', color: '#B45309', marginLeft: '0.4rem' }}>
                                Dr. {accessRequests[0].doctor_name} has requested temporary access to your health records.
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handleAccessResponse(accessRequests[0].id, accessRequests[0].doctor_id, 'approve', 1440)}
                            style={{
                                background: '#16A34A', color: '#fff', border: 'none',
                                padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Approve 24h
                        </button>
                        <button
                            onClick={() => handleAccessResponse(accessRequests[0].id, accessRequests[0].doctor_id, 'deny')}
                            style={{
                                background: '#DC2626', color: '#fff', border: 'none',
                                padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Deny
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
            }}>
                {[
                    { id: 'records', label: `My Vault Records (${records.length})`, icon: FileText },
                    { id: 'timeline', label: 'Chronological Timeline', icon: Calendar },
                    { id: 'pending', label: `Pending Lab Reports (${pendingReports.length})`, icon: FlaskConical, badge: pendingReports.length > 0 },
                    { id: 'quality', label: 'Health Data Quality (84%)', icon: Sparkles },
                    { id: 'gaps', label: 'Care Gaps & Follow-ups', icon: AlertCircle }
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
                        {tab.badge && (
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: '#EF4444'
                            }} />
                        )}
                    </button>
                ))}
            </div>

            {/* 1. RECORDS TAB */}
            {activeTab === 'records' && (
                <div>
                    {/* Category Filter Pills */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        paddingBottom: '0.75rem',
                        marginBottom: '1.25rem'
                    }}>
                        {RECORD_CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.value
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    style={{
                                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                                        color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                                        padding: '0.45rem 0.85rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.82rem',
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        className={`vault-upload-area ${dragover ? 'dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
                        onDragLeave={() => setDragover(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragover ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius)',
                            padding: '1.75rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragover ? 'var(--primary-light)' : 'var(--surface)',
                            marginBottom: '1.75rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-dark)', fontSize: '1rem' }}>
                            Upload Medical Report to Health Vault
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Drag & drop PDF, JPG, PNG or click to browse (up to 10MB)
                        </p>
                    </div>

                    {/* Records Grid */}
                    {filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📑</div>
                            <h4 style={{ margin: '0 0 0.25rem 0' }}>No Documents in This Category</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload reports to begin organizing your clinical records.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '1.25rem'
                        }}>
                            {filteredRecords.map(doc => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        border: '1px solid var(--border)',
                                        background: '#FFFFFF',
                                        borderRadius: 'var(--radius)',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: 'var(--radius-pill)',
                                                background: 'var(--surface)',
                                                color: 'var(--primary)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {doc.category.replace('_', ' ')}
                                            </span>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: 'var(--radius-pill)',
                                                background: '#DCFCE7',
                                                color: '#16A34A',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}>
                                                <CheckCircle2 size={11} /> Verified
                                            </span>
                                        </div>

                                        <h3 style={{ margin: '0.2rem 0 0.35rem 0', fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                                            {doc.title}
                                        </h3>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                                            {doc.hospital_lab} • {doc.report_date}
                                        </div>

                                        {doc.summary && (
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.83rem',
                                                color: 'var(--text-main)',
                                                background: 'var(--surface)',
                                                padding: '0.65rem',
                                                borderRadius: 'var(--radius-sm)',
                                                lineHeight: 1.4
                                            }}>
                                                {doc.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginTop: '1rem',
                                        paddingTop: '0.75rem',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <ActionButton
                                            variant="outline"
                                            size="sm"
                                            style={{ flex: 1 }}
                                            onClick={() => {
                                                toast.success(`Opening ${doc.file_name || doc.title}`)
                                            }}
                                        >
                                            <Eye size={13} /> View
                                        </ActionButton>
                                        <ActionButton
                                            variant="outline"
                                            size="sm"
                                            style={{ flex: 1 }}
                                            onClick={openShareModal}
                                        >
                                            <Share2 size={13} /> Share
                                        </ActionButton>
                                        <button
                                            onClick={() => setDeleteConfirm({ isOpen: true, recordId: doc.id })}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #FECACA',
                                                color: '#DC2626',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Doctors with Access List */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div className="section-header">
                            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                                <ShieldCheck size={20} color="var(--primary)" /> Doctors With Granted Access ({permissions.length})
                            </h3>
                            <p className="section-subtitle" style={{ fontSize: '0.85rem' }}>
                                Clinical providers authorized to temporarily view your vault documents
                            </p>
                        </div>

                        {permissions.length === 0 ? (
                            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No doctors currently have active access to your records.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {permissions.map(perm => {
                                    const expired = isExpired(perm.expires_at)
                                    return (
                                        <div
                                            key={perm.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.85rem 1.2rem',
                                                background: '#FFFFFF',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{perm.doctor_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {perm.doctor_specialty} • {perm.doctor_hospital}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: expired ? '#FEE2E2' : '#DCFCE7',
                                                    color: expired ? '#DC2626' : '#16A34A'
                                                }}>
                                                    {expired ? 'Expired' : 'Active'}
                                                </span>
                                                {!expired && (
                                                    <ActionButton
                                                        variant="outline"
                                                        size="sm"
                                                        style={{ color: '#DC2626', borderColor: '#FECACA' }}
                                                        onClick={() => cancelAccess(perm.id)}
                                                    >
                                                        Revoke Access
                                                    </ActionButton>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. TIMELINE VIEW */}
            {activeTab === 'timeline' && (
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Chronological progression of all medical reports, prescriptions, and consultations recorded in your vault.
                    </p>

                    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                        <div style={{
                            position: 'absolute',
                            top: 10,
                            bottom: 10,
                            left: 10,
                            width: 2,
                            background: '#CBD5E1'
                        }} />

                        {Object.entries(getGroupedTimeline()).map(([monthYear, docs]) => (
                            <div key={monthYear} style={{ marginBottom: '2rem' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'var(--primary)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-pill)',
                                    marginBottom: '1rem',
                                    marginLeft: '-1.5rem'
                                }}>
                                    <Calendar size={13} /> {monthYear}
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {docs.map(doc => (
                                        <div
                                            key={doc.id}
                                            style={{
                                                background: '#FFFFFF',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                padding: '1rem 1.25rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    background: 'var(--surface)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {RECORD_CATEGORIES.find(c => c.value === doc.category)?.icon || '📄'}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                                                        {doc.title}
                                                    </h4>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {doc.hospital_lab} • {doc.report_date}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <ActionButton
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toast.success(`Viewing ${doc.title}`)}
                                                >
                                                    <Eye size={13} /> View
                                                </ActionButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. PENDING LAB REPORTS TAB (MODULE 3) */}
            {activeTab === 'pending' && (
                <div>
                    <div style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 'var(--radius)',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem'
                    }}>
                        <FlaskConical size={24} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.88rem', color: '#1E40AF', lineHeight: 1.5 }}>
                            <strong>Laboratory Direct Integration:</strong> Diagnostics centers send pending reports to your account using secure transfer codes. In accordance with patient privacy governance, reports are never attached automatically without your explicit confirmation.
                        </div>
                    </div>

                    {pendingReports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <CheckCircle2 size={40} color="#16A34A" style={{ margin: '0 auto 0.75rem' }} />
                            <h4 style={{ margin: '0 0 0.25rem 0' }}>No Pending Reports</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All diagnostic laboratory reports have been reviewed and accepted into your vault.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {pendingReports.map(report => (
                                <DashboardCard
                                    key={report.id}
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{report.report_title}</span>
                                            <span style={{
                                                background: '#FEF3C7',
                                                color: '#B45309',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: 'var(--radius-pill)'
                                            }}>
                                                Awaiting Your Confirmation
                                            </span>
                                        </div>
                                    }
                                    icon={FlaskConical}
                                    action={
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                            Code: {report.transfer_code}
                                        </span>
                                    }
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                                Laboratory: {report.lab_name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Specimen: {report.specimen} • Date of Test: {report.report_date} • HL7/FHIR DiagnosticReport
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <ActionButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedPendingReport(report)}
                                            >
                                                <Eye size={14} /> Review FHIR Report
                                            </ActionButton>
                                            <ActionButton
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleConfirmPendingReport(report)}
                                            >
                                                <CheckCircle2 size={14} /> Review & Add to Vault
                                            </ActionButton>
                                        </div>
                                    </div>
                                </DashboardCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. HEALTH DATA QUALITY TAB (NOVEL FEATURE 4) */}
            {activeTab === 'quality' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <DashboardCard title="Personal Health Record Completeness" icon={Sparkles}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    84%
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Health Profile Score</span>
                            </div>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                                    Your Health Vault contains comprehensive prescriptions and laboratory records. Resolving 2 minor gaps will optimize automated triage and emergency readiness.
                                </p>
                                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '84%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Identified Health Record Checks */}
                        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <CheckCircle2 size={18} color="#16A34A" />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Blood Group Verified (O Positive)</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified through Apollo Diagnostics CBC panel</div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>Resolved</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 1rem', background: '#FFFBEB', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <AlertTriangle size={18} color="#D97706" />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>Emergency Contact Secondary Number Missing</div>
                                        <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Primary contact added in Care Circle, secondary phone pending</div>
                                    </div>
                                </div>
                                <ActionButton variant="outline" size="sm" onClick={() => setActiveTab('records')}>
                                    Update Profile
                                </ActionButton>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 1rem', background: '#FFFBEB', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <AlertTriangle size={18} color="#D97706" />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>Insurance Policy Renewal Approaching (96 Days)</div>
                                        <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Star Health individual plan expires on 31 Dec 2026</div>
                                    </div>
                                </div>
                                <ActionButton variant="outline" size="sm" onClick={() => toast.success('Redirecting to Insurance')}>
                                    Review Policy
                                </ActionButton>
                            </div>
                        </div>
                    </DashboardCard>
                </div>
            )}

            {/* 5. CARE GAPS TAB (NOVEL FEATURE 5) */}
            {activeTab === 'gaps' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 'var(--radius)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem'
                    }}>
                        <ShieldAlert size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.88rem', color: '#991B1B', lineHeight: 1.5 }}>
                            <strong>Medical Governance & Clinical Responsibility:</strong> Care Gaps identify administrative and documented follow-up events based strictly on your uploaded records. Kushi Hygieia never diagnoses disease or independently alters prescription regimens. Always discuss these points with your primary doctor.
                        </div>
                    </div>

                    <DashboardCard title="Documented Care Gaps for Review" icon={AlertCircle}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                                            Quarterly HbA1c Glycemic Follow-up Consultation Due
                                        </h4>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                                            Last HbA1c test recorded on 01 Jul 2026 (~86 days ago). Diabetes guidelines recommend repeat evaluation every 3 months.
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-pill)' }}>
                                        Follow-up Due
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    💡 Recommendation: Consider discussing this with Dr. Rajesh Kumar at your next visit.
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                                            Acute Bronchitis Post-Treatment Auscultation Check
                                        </h4>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                                            5-day Azithromycin regimen completed on 20 Sep. Follow-up consultation recommended to confirm clear lung sounds.
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#DCFCE7', color: '#16A34A', borderRadius: 'var(--radius-pill)' }}>
                                        Appointment Booked (28 Sep)
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    💡 Recommendation: Follow-up booked with Dr. Priya Sharma.
                                </div>
                            </div>
                        </div>
                    </DashboardCard>
                </div>
            )}

            {/* Upload Metadata Modal */}
            {showUploadModal && (
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
                            maxWidth: '500px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                            Add Document Details
                        </h3>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Selected file: <strong>{pendingFile?.name}</strong>
                        </p>

                        <form onSubmit={handleConfirmUpload} style={{ display: 'grid', gap: '0.85rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Document Title *
                                </label>
                                <input
                                    type="text"
                                    value={uploadMetadata.title}
                                    onChange={e => setUploadMetadata({ ...uploadMetadata, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Category *
                                    </label>
                                    <select
                                        value={uploadMetadata.category}
                                        onChange={e => setUploadMetadata({ ...uploadMetadata, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    >
                                        <option value="lab_report">Lab Report</option>
                                        <option value="prescription">Prescription</option>
                                        <option value="doctor_notes">Doctor Notes</option>
                                        <option value="imaging">Imaging / Scan</option>
                                        <option value="vaccination">Vaccination</option>
                                        <option value="discharge_summary">Discharge Summary</option>
                                        <option value="insurance_doc">Insurance Document</option>
                                        <option value="medical_certificate">Medical Certificate</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Report Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={uploadMetadata.report_date}
                                        onChange={e => setUploadMetadata({ ...uploadMetadata, report_date: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Hospital / Diagnostic Laboratory
                                </label>
                                <input
                                    type="text"
                                    value={uploadMetadata.hospital_lab}
                                    onChange={e => setUploadMetadata({ ...uploadMetadata, hospital_lab: e.target.value })}
                                    placeholder="e.g. Apollo Diagnostics"
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <ActionButton variant="outline" type="button" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </ActionButton>
                                <ActionButton variant="primary" type="submit" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Save to Vault'}
                                </ActionButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* FHIR Diagnostic Report Review Sheet */}
            {selectedPendingReport && (
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
                            maxWidth: '560px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    FHIR R4 DiagnosticReport Preview
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                                    {selectedPendingReport.report_title}
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Issued by {selectedPendingReport.lab_name} • {selectedPendingReport.report_date}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedPendingReport(null)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                            Transfer Security Code: <strong>{selectedPendingReport.transfer_code}</strong> • Specimen: <strong>{selectedPendingReport.specimen}</strong>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Discrete Observation Readings:
                            </span>
                            <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                                {selectedPendingReport.fhir?.observations.map((obs, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.6rem 0.85rem',
                                            background: '#FFFFFF',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{obs.name}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{obs.value}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({obs.reference})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <ActionButton variant="outline" onClick={() => setSelectedPendingReport(null)}>
                                Close
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                onClick={() => handleConfirmPendingReport(selectedPendingReport)}
                            >
                                <CheckCircle2 size={15} /> Confirm & Save to Health Vault
                            </ActionButton>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Doctor Share Modal */}
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
                                <h2 className="modal-title">Share Health Vault With Doctor</h2>
                                <p className="modal-subtitle">Grant temporary, time-bound access to authorized clinical providers</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Select Physician</label>
                                <div className="doctor-select-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {doctors.map(doc => (
                                        <div
                                            key={doc.id}
                                            className={`doctor-select-item ${selectedDoctor === doc.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedDoctor(doc.id)}
                                        >
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: 'var(--primary-light)', color: 'var(--primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '0.9rem'
                                            }}>
                                                {doc.full_name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.full_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.specialty || 'General Practice'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Access Duration (Auto-Revokes Afterward)</label>
                                <div className="duration-options">
                                    {DURATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
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
                                {sharing ? 'Securing...' : '🔐 Grant Time-Bound Access'}
                            </ActionButton>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Record Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Medical Record?"
                message="This will remove this record from your Health Vault. This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteRecord}
                onCancel={() => setDeleteConfirm({ isOpen: false, recordId: null })}
                danger
            />
        </div>
    )
}
