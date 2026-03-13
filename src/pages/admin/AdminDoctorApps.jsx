import { useState, useEffect } from 'react'
import { Users, ShieldCheck } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardCard from '../../components/ui/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import SectionContainer from '../../components/ui/SectionContainer'
import ActionButton from '../../components/ui/ActionButton'

export default function AdminDoctorApps() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => { fetchApplications() }, [])

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('doctor_applications')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setApplications(data || [])
        } catch (err) {
            console.error('Error fetching applications:', err)
        }
        setLoading(false)
    }

    const filtered = applications.filter(app => {
        if (statusFilter === 'all') return true
        return (app.status || 'pending') === statusFilter
    })

    const pendingCount = applications.filter(a => (a.status || 'pending') === 'pending').length
    const approvedCount = applications.filter(a => a.status === 'approved').length

    const statusBadge = (status) => {
        const s = status === 'approved'
            ? { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: '✓ Approved' }
            : { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: '⏳ Pending' }
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>{s.label}</span>
    }

    const handleApprove = async (app) => {
        try {
            // Try the RPC first
            const { error: rpcError } = await supabase.rpc('approve_doctor_application', { app_id: app.id })
            
            if (rpcError) {
                // If RPC doesn't exist or fails, do it manually
                console.warn('RPC fallback:', rpcError.message)
                
                // 1. Update the application status
                await supabase.from('doctor_applications').update({ status: 'approved' }).eq('id', app.id)
                
                // 2. Create or update the doctor record
                const { error: docError } = await supabase.from('doctors').upsert([{
                    user_id: app.user_id,
                    full_name: app.full_name,
                    name: app.full_name,
                    email: app.email,
                    specialty: app.specialization,
                    hospital_name: app.hospital_affiliation || '',
                    hospital: app.hospital_affiliation || '',
                    experience: parseInt(app.experience_years) || 0,
                    bio: app.bio || '',
                    license_number: app.license_number,
                    verified: true,
                    is_approved: true,
                    available: true,
                    consultation_fee: app.consultation_fee ? parseInt(app.consultation_fee) : null,
                    available_timings: app.available_timings || '',
                    qualification: app.qualification || ''
                }], { onConflict: 'user_id' })
                
                if (docError) throw docError
            }
            
            // Also ensure the doctor record has verified=true (even if RPC succeeded, it might not have set it)
            if (app.user_id) {
                await supabase.from('doctors').update({ verified: true, is_approved: true }).eq('user_id', app.user_id)
            }
            
            toast.success(`✅ Approved ${app.full_name}!`)
            fetchApplications()
        } catch (err) {
            toast.error('Approval failed: ' + err.message)
        }
    }

    const handleReject = async (app) => {
        if (!window.confirm(`Reject ${app.full_name}'s application? This will permanently delete it.`)) return
        await supabase.from('doctor_applications').delete().eq('id', app.id)
        toast.success('Application rejected.')
        fetchApplications()
    }

    const runAiVerify = async (app) => {
        try {
            await supabase.from('doctor_applications').update({ ai_verification_status: 'verifying' }).eq('id', app.id)
            fetchApplications()

            const prompt = `Verify this doctor application:\n- Name: ${app.full_name}\n- Specialty: ${app.specialization}\n- License: ${app.license_number}\n- Experience: ${app.experience_years} years\n- Hospital: ${app.hospital_affiliation || 'N/A'}\n- Qualification: ${app.qualification || 'N/A'}\n\nRespond VERIFIED or FLAGGED with a one-line explanation.`

            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, role: 'system' })
            })

            let aiResult = 'pending', aiNotes = 'AI unavailable — manual review required.'
            if (res.ok) {
                const data = await res.json()
                const reply = (data.reply || data.message || '').toUpperCase()
                aiResult = reply.includes('VERIFIED') ? 'verified' : reply.includes('FLAGGED') ? 'flagged' : 'pending'
                aiNotes = data.reply || data.message || 'No response.'
            }

            await supabase.from('doctor_applications').update({ ai_verification_status: aiResult, ai_verification_notes: aiNotes }).eq('id', app.id)
            toast.success(`AI: ${aiResult.toUpperCase()}`)
            fetchApplications()
        } catch (err) {
            console.error('AI verify error:', err)
            toast.error('AI verification failed.')
            await supabase.from('doctor_applications').update({ ai_verification_status: 'error', ai_verification_notes: err.message }).eq('id', app.id)
            fetchApplications()
        }
    }

    const aiBadge = (status) => {
        const m = {
            verified: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: '✓ Verified' },
            flagged: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: '⚠ Flagged' },
            verifying: { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', label: '⏳ Verifying' },
            error: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', label: '❌ Error' },
            pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: '🔄 Pending' }
        }
        const s = m[status] || m.pending
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>{s.label}</span>
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="loading-spinner"></div></div>

    return (
        <>
            <PageHeader
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><ShieldCheck size={28} /> Doctor Applications</span>}
                description={`${applications.length} total application${applications.length !== 1 ? 's' : ''} — ${pendingCount} pending, ${approvedCount} approved.`}
            />
            <SectionContainer>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Tab Filter */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {[{ key: 'all', label: `All (${applications.length})` }, { key: 'pending', label: `Pending (${pendingCount})` }, { key: 'approved', label: `Approved (${approvedCount})` }].map(tab => (
                            <button key={tab.key} onClick={() => setStatusFilter(tab.key)} style={{
                                padding: '0.5rem 1.2rem', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: statusFilter === tab.key ? 'var(--primary, #6366F1)' : '#F1F5F9',
                                color: statusFilter === tab.key ? '#fff' : '#475569'
                            }}>{tab.label}</button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <DashboardCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Users size={40} color="#94A3B8" style={{ margin: '0 auto 1.5rem' }} />
                            <h3 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>{statusFilter === 'pending' ? 'No pending applications' : 'No applications found'}</h3>
                            <p style={{ color: '#64748B' }}>New submissions will appear here.</p>
                        </DashboardCard>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {filtered.map(app => (
                                <DashboardCard key={app.id} style={{ padding: '1.5rem', borderLeft: app.status === 'approved' ? '4px solid #10B981' : '4px solid #F59E0B' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1E293B' }}>{app.full_name}</h3>
                                                {statusBadge(app.status)}
                                                {(app.status || 'pending') === 'pending' && aiBadge(app.ai_verification_status)}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#475569', fontSize: '0.88rem' }}>
                                                <span><strong>Specialty:</strong> {app.specialization}</span>
                                                {app.qualification && <span><strong>Qual:</strong> {app.qualification}</span>}
                                                <span><strong>Exp:</strong> {app.experience_years} yrs</span>
                                                <span><strong>License:</strong> <code style={{ background: '#F1F5F9', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>{app.license_number}</code></span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>

                                    {/* Details */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: 10, marginBottom: '1rem' }}>
                                        {app.hospital_affiliation && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>🏥 Hospital</strong>{app.hospital_affiliation}</div>}
                                        {app.clinic_name && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>🏨 Clinic</strong>{app.clinic_name}</div>}
                                        {app.clinic_address && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>📍 Address</strong>{app.clinic_address}</div>}
                                        {app.available_timings && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>🕐 Timings</strong>{app.available_timings}</div>}
                                        {app.available_days && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>📅 Days</strong>{app.available_days}</div>}
                                        {app.consultation_fee && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>💰 Fee</strong>₹{app.consultation_fee}</div>}
                                        {app.practice_type && <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#64748B', display: 'block' }}>📋 Type</strong><span style={{ textTransform: 'capitalize' }}>{app.practice_type}</span></div>}
                                    </div>

                                    {app.bio && <div style={{ padding: '0.75rem 1rem', background: '#F0F9FF', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#0C4A6E', borderLeft: '3px solid #0EA5E9' }}><strong>Bio:</strong> {app.bio}</div>}

                                    {app.ai_verification_notes && app.ai_verification_status !== 'pending' && (
                                        <div style={{ padding: '0.75rem 1rem', background: app.ai_verification_status === 'verified' ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem', color: '#475569', borderLeft: `3px solid ${app.ai_verification_status === 'verified' ? '#10B981' : '#EF4444'}` }}>
                                            <strong>🤖 AI:</strong> {app.ai_verification_notes}
                                        </div>
                                    )}

                                    {/* Only show action buttons for pending applications */}
                                    {(app.status || 'pending') === 'pending' ? (
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <ActionButton variant="outline" style={{ fontSize: '0.82rem', color: '#0369A1', borderColor: '#BAE6FD' }} onClick={() => runAiVerify(app)} disabled={app.ai_verification_status === 'verifying'}>
                                                🤖 {app.ai_verification_status === 'verifying' ? 'Verifying...' : 'AI Verify'}
                                            </ActionButton>
                                            <ActionButton variant="outline" style={{ fontSize: '0.82rem', color: '#EF4444', borderColor: '#FECACA' }} onClick={() => handleReject(app)}>✗ Reject</ActionButton>
                                            <ActionButton variant="primary" style={{ fontSize: '0.82rem' }} onClick={() => handleApprove(app)}>✓ Approve & Link</ActionButton>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>✓ This application has been approved</div>
                                    )}
                                </DashboardCard>
                            ))}
                        </div>
                    )}
                </motion.div>
            </SectionContainer>
        </>
    )
}
