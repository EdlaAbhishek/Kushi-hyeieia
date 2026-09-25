import { useState, useEffect } from 'react'
import { useAuth } from '../../services/AuthContext'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, FileText, Upload, Plus, CheckCircle, XCircle, Clock,
    AlertTriangle, DollarSign, Building2, Calendar, ChevronRight, Eye, Download
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'

const CLAIM_STEPS = [
    { key: 'draft', label: 'Created', icon: FileText },
    { key: 'documents_uploaded', label: 'Documents', icon: Upload },
    { key: 'submitted', label: 'Submitted', icon: CheckCircle },
    { key: 'under_review', label: 'Under Review', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
    { key: 'settled', label: 'Settled', icon: DollarSign }
]

const PRE_AUTH_DOCS = [
    { key: 'prescription', label: 'Doctor Prescription', icon: '📋' },
    { key: 'diagnostic', label: 'Diagnostic Reports', icon: '🧪' },
    { key: 'insurance_card', label: 'Insurance Card', icon: '💳' },
    { key: 'id_proof', label: 'ID Proof', icon: '🪪' },
    { key: 'hospital_estimate', label: 'Hospital Estimate', icon: '🏥' }
]

export default function InsuranceCenter() {
    const { user } = useAuth()
    const [policies, setPolicies] = useState([])
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview') // overview | claims | preauth | documents
    const [showAddPolicy, setShowAddPolicy] = useState(false)
    const [preAuthChecks, setPreAuthChecks] = useState({
        prescription: false, diagnostic: false, insurance_card: false, id_proof: false, hospital_estimate: false
    })

    // Form state
    const [formData, setFormData] = useState({
        provider: '', policy_number: '', policy_type: 'Individual',
        sum_insured: '', valid_from: '', valid_until: ''
    })

    useEffect(() => {
        if (user) fetchAll()
    }, [user])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [polRes, claimRes] = await Promise.all([
                supabase.from('insurance_policies').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }),
                supabase.from('insurance_claims').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
            ])
            setPolicies(polRes.data || [])
            setClaims(claimRes.data || [])
        } catch (err) {
            console.warn('Error loading insurance:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddPolicy = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('insurance_policies').insert([{
                patient_id: user.id,
                ...formData,
                sum_insured: parseFloat(formData.sum_insured) || 0,
                status: 'active',
                is_demo: false
            }])
            if (error) throw error
            await logAudit({ userId: user.id, action: AUDIT_ACTIONS.POLICY_ADDED, entityType: 'insurance_policy', description: `Added ${formData.provider} policy` }).catch(() => {})
            toast.success('Policy added successfully')
            setShowAddPolicy(false)
            setFormData({ provider: '', policy_number: '', policy_type: 'Individual', sum_insured: '', valid_from: '', valid_until: '' })
            fetchAll()
        } catch (err) {
            toast.error('Could not add policy. Please try again.')
        }
    }

    const activePolicy = policies.find(p => p.status === 'active')
    const preAuthReady = Object.values(preAuthChecks).filter(Boolean).length
    const preAuthTotal = PRE_AUTH_DOCS.length

    const getClaimStepIndex = (status) => CLAIM_STEPS.findIndex(s => s.key === status)

    if (loading) {
        return (
            <>
                <PageHeader title="My Insurance" description="Manage your health insurance policies and claims" />
                <div className="dashboard-loading"><div className="loading-spinner" /><p>Loading insurance data...</p></div>
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="My Insurance"
                description="Manage your health insurance policies and claims"
                action={
                    <button className="btn btn-primary" onClick={() => setShowAddPolicy(true)} style={{ gap: '0.4rem' }}>
                        <Plus size={16} /> Add Policy
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
                    <span><strong>Demo Insurance Data</strong> — Verify all coverage details with your insurance provider. Kushi Hygieia does not guarantee insurance approval.</span>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'claims', label: 'Claims' },
                        { key: 'preauth', label: 'Pre-Authorization' },
                        { key: 'documents', label: 'Documents' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`specialty-card ${activeTab === tab.key ? 'specialty-active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div>
                        {policies.length === 0 ? (
                            <div className="dashboard-empty" style={{ maxWidth: 520, margin: '2rem auto' }}>
                                <div className="dashboard-empty-icon">🛡️</div>
                                <h3>No insurance policies added</h3>
                                <p>Add your health insurance policy to track coverage, submit claims, and manage documents.</p>
                                <ActionButton variant="primary" onClick={() => setShowAddPolicy(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Add Policy
                                </ActionButton>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {policies.map(policy => (
                                    <DashboardCard key={policy.id} style={{ position: 'relative', overflow: 'hidden' }}>
                                        {policy.is_demo && (
                                            <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.65rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>
                                                DEMO
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <Shield size={18} style={{ color: 'var(--primary)' }} />
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                                                        {policy.provider}
                                                    </h3>
                                                </div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                    {policy.policy_number} • {policy.policy_type}
                                                </div>
                                            </div>
                                            <StatusBadge status={policy.status === 'active' ? 'healthy' : policy.status === 'expired' ? 'danger' : 'warning'}>
                                                {policy.status}
                                            </StatusBadge>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Sum Insured</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                                                    ₹{(policy.sum_insured || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Valid Until</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                                    {policy.valid_until ? new Date(policy.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Status</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600, color: policy.status === 'active' ? '#059669' : '#DC2626' }}>
                                                    {policy.status === 'active' ? 'Active' : 'Expired'}
                                                </div>
                                            </div>
                                        </div>

                                        {policy.network_hospitals?.length > 0 && (
                                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Network Hospitals</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                    {policy.network_hospitals.map(h => (
                                                        <span key={h} style={{
                                                            padding: '0.2rem 0.6rem', background: 'var(--surface)',
                                                            borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                                                            color: 'var(--text-main)', border: '1px solid var(--border-light)'
                                                        }}>{h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </DashboardCard>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CLAIMS TAB */}
                {activeTab === 'claims' && (
                    <div>
                        {claims.length === 0 ? (
                            <div className="dashboard-empty" style={{ maxWidth: 520, margin: '2rem auto' }}>
                                <div className="dashboard-empty-icon">📄</div>
                                <h3>No claims yet</h3>
                                <p>Your insurance claims and their status will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {claims.map(claim => {
                                    const stepIdx = getClaimStepIndex(claim.status)
                                    return (
                                        <DashboardCard key={claim.id}>
                                            {claim.is_demo && (
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '0.5rem' }}>
                                                    DEMO DATA
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                                                        {claim.claim_number || 'Claim'}
                                                    </h3>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                        {claim.hospital_name} • {claim.treatment}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                                        ₹{(claim.claim_amount || 0).toLocaleString('en-IN')}
                                                    </div>
                                                    {claim.approved_amount && (
                                                        <div style={{ fontSize: '0.78rem', color: '#059669' }}>
                                                            Approved: ₹{claim.approved_amount.toLocaleString('en-IN')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Claim Timeline */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                                {CLAIM_STEPS.map((step, i) => {
                                                    const isCompleted = i <= stepIdx
                                                    const isCurrent = i === stepIdx
                                                    const StepIcon = step.icon
                                                    return (
                                                        <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                                            <div style={{
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                                                minWidth: 60
                                                            }}>
                                                                <div style={{
                                                                    width: 28, height: 28, borderRadius: '50%',
                                                                    background: isCompleted ? (isCurrent ? 'var(--primary)' : '#D1FAE5') : 'var(--surface)',
                                                                    border: `2px solid ${isCompleted ? (isCurrent ? 'var(--primary)' : '#10B981') : 'var(--border)'}`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    <StepIcon size={12} style={{ color: isCompleted ? (isCurrent ? '#fff' : '#059669') : 'var(--text-muted)' }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                            {i < CLAIM_STEPS.length - 1 && (
                                                                <div style={{ width: 20, height: 2, background: isCompleted ? '#10B981' : 'var(--border)', flexShrink: 0, marginTop: '-16px' }} />
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </DashboardCard>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* PRE-AUTH TAB */}
                {activeTab === 'preauth' && (
                    <DashboardCard title="Pre-Authorization Checklist" icon={CheckCircle}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Ensure all required documents are ready before requesting pre-authorization. Based on the information provided, estimated coverage details should be verified with your insurer.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {PRE_AUTH_DOCS.map(doc => (
                                <label key={doc.key} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.85rem 1rem', border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                    background: preAuthChecks[doc.key] ? '#F0FDF4' : '#fff',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={preAuthChecks[doc.key]}
                                        onChange={() => setPreAuthChecks(prev => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ fontSize: '1rem' }}>{doc.icon}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{doc.label}</span>
                                    {preAuthChecks[doc.key] && <CheckCircle size={16} style={{ color: '#10B981', marginLeft: 'auto' }} />}
                                </label>
                            ))}
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Progress</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: preAuthReady === preAuthTotal ? '#059669' : 'var(--primary)' }}>
                                    {preAuthReady} / {preAuthTotal} documents ready
                                </span>
                            </div>
                            <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${(preAuthReady / preAuthTotal) * 100}%`,
                                    background: preAuthReady === preAuthTotal ? '#10B981' : 'var(--primary)',
                                    borderRadius: 4, transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            This checklist is for your reference. Verify specific requirements with your insurance provider.
                        </div>
                    </DashboardCard>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === 'documents' && (
                    <DashboardCard title="Insurance Documents" icon={FileText}>
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">📂</div>
                            <h3>Your insurance documents will appear here</h3>
                            <p>Upload your insurance card, policy documents, and claim-related files for easy access.</p>
                            <ActionButton variant="primary" style={{ marginTop: '1rem' }}>
                                <Upload size={16} /> Upload Document
                            </ActionButton>
                        </div>
                    </DashboardCard>
                )}
            </div>

            {/* Add Policy Modal */}
            <AnimatePresence>
                {showAddPolicy && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddPolicy(false)}>
                        <motion.div className="modal-content" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                            <button className="modal-close" onClick={() => setShowAddPolicy(false)}>×</button>
                            <div className="modal-header">
                                <h3 className="modal-title">Add Insurance Policy</h3>
                            </div>
                            <form onSubmit={handleAddPolicy}>
                                <div className="form-group">
                                    <label className="form-label">Insurance Provider</label>
                                    <select className="form-control" value={formData.provider} onChange={e => setFormData(f => ({ ...f, provider: e.target.value }))} required>
                                        <option value="">Select provider</option>
                                        {['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Niva Bupa', 'Care Health', 'Aditya Birla', 'Bajaj Allianz', 'Other'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Policy Number</label>
                                    <input className="form-control" placeholder="e.g. P/2026/SH/00123" value={formData.policy_number} onChange={e => setFormData(f => ({ ...f, policy_number: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sum Insured (₹)</label>
                                    <input className="form-control" type="number" placeholder="e.g. 500000" value={formData.sum_insured} onChange={e => setFormData(f => ({ ...f, sum_insured: e.target.value }))} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Valid From</label>
                                        <input className="form-control" type="date" value={formData.valid_from} onChange={e => setFormData(f => ({ ...f, valid_from: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Valid Until</label>
                                        <input className="form-control" type="date" value={formData.valid_until} onChange={e => setFormData(f => ({ ...f, valid_until: e.target.value }))} />
                                    </div>
                                </div>
                                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                                    <Shield size={16} /> Add Policy
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
