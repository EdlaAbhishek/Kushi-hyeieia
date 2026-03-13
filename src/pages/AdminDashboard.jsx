import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { Users, Activity, AlertTriangle, HeartPulse, CalendarCheck, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../services/supabase'
import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import InfoTooltip from '../components/ui/InfoTooltip'
import ActionButton from '../components/ui/ActionButton'
import { toast } from 'react-hot-toast'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6']
const TRIAGE_COLORS = ['#34D399', '#FBBF24', '#F87171']

export default function AdminDashboard({ mode = 'population' }) {
    const [timeRange, setTimeRange] = useState('This Month')
    const [stats, setStats] = useState({
        totalPatients: 0,
        highRiskPatients: 0,
        screeningsDone: 0
    })
    const [analyticsStats, setAnalyticsStats] = useState({
        totalAppointments: 0,
        teleconsultations: 0,
        avgWaitTime: 0
    })
    const [diseaseData, setDiseaseData] = useState([])
    const [triageData, setTriageData] = useState([])
    const [appointmentTrend, setAppointmentTrend] = useState([])
    const [typeDistribution, setTypeDistribution] = useState([])
    const [applications, setApplications] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (mode === 'analytics') {
            fetchAnalyticsData()
        } else if (mode === 'applications') {
            fetchApplications()
        } else {
            fetchDashboardData()
        }
    }, [mode])

    const fetchApplications = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('doctor_applications')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            setApplications(data || [])
        } catch (err) {
            console.error("Error fetching applications:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)

            const { count: patientsCount, error: pError } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })

            let total = patientsCount || 0
            if (pError) console.warn("Could not fetch patients count:", pError)
            if (total === 0) {
                const { count } = await supabase.from('risk_scores').select('*', { count: 'exact', head: true })
                total = count || 0
            }

            const { count: highRiskCount } = await supabase
                .from('risk_scores')
                .select('*', { count: 'exact', head: true })
                .gt('score', 70)

            const { count: screeningsCount } = await supabase
                .from('triage_cases')
                .select('*', { count: 'exact', head: true })

            setStats({
                totalPatients: total,
                highRiskPatients: highRiskCount || 0,
                screeningsDone: screeningsCount || 0
            })

            const { data: risks } = await supabase.from('risk_scores').select('risk_type')
            if (risks) {
                const riskCounts = risks.reduce((acc, curr) => {
                    acc[curr.risk_type] = (acc[curr.risk_type] || 0) + 1
                    return acc
                }, {})
                setDiseaseData(Object.keys(riskCounts).map(key => ({ name: key, count: riskCounts[key] })))
            }

            const { data: triages } = await supabase.from('triage_cases').select('urgency')
            if (triages) {
                const triageCounts = triages.reduce((acc, curr) => {
                    acc[curr.urgency] = (acc[curr.urgency] || 0) + 1
                    return acc
                }, {})
                setTriageData(Object.keys(triageCounts).map(key => ({ name: key, value: triageCounts[key] })))
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true)

            // Fetch total appointments
            const { count: totalAppts } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })

            // Fetch teleconsultations
            const { count: teleAppts } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('appointment_type', 'teleconsultation')

            // Fetch video sessions count
            const { count: videoSessions } = await supabase
                .from('video_sessions')
                .select('*', { count: 'exact', head: true })

            setAnalyticsStats({
                totalAppointments: totalAppts || 0,
                teleconsultations: teleAppts || 0,
                videoSessions: videoSessions || 0
            })

            // Fetch appointment type distribution
            const { data: appts } = await supabase.from('appointments').select('appointment_type')
            if (appts) {
                const typeCounts = appts.reduce((acc, curr) => {
                    const type = curr.appointment_type || 'unknown'
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                }, {})
                setTypeDistribution(Object.keys(typeCounts).map(key => ({
                    name: key === 'teleconsultation' ? 'Video Call' : key === 'in_person' ? 'In-Person' : key,
                    value: typeCounts[key]
                })))
            }

            // Fetch appointment status distribution for trend
            const { data: statusAppts } = await supabase.from('appointments').select('status')
            if (statusAppts) {
                const statusCounts = statusAppts.reduce((acc, curr) => {
                    acc[curr.status] = (acc[curr.status] || 0) + 1
                    return acc
                }, {})
                setAppointmentTrend(Object.keys(statusCounts).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    count: statusCounts[key]
                })))
            }

        } catch (error) {
            console.error("Error fetching analytics data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    // ── AI Verification helper ──
    const runAiVerification = async (app) => {
        try {
            // Update status to verifying
            await supabase.from('doctor_applications')
                .update({ ai_verification_status: 'verifying' })
                .eq('id', app.id)

            // Call AI endpoint to verify credentials
            const prompt = `Verify this doctor application for a healthcare platform. Check if the details are reasonable and consistent:
- Name: ${app.full_name}
- Specialty: ${app.specialization}
- License: ${app.license_number}
- Experience: ${app.experience_years} years
- Hospital: ${app.hospital_affiliation || 'N/A'}
- Qualification: ${app.qualification || 'N/A'}

Respond with VERIFIED if the details look legitimate (valid license format, reasonable experience for specialty, etc), or FLAGGED if something looks suspicious. Add a one-line explanation.`

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, role: 'system' })
            })

            let aiResult = 'pending'
            let aiNotes = 'AI verification unavailable — manual review required.'

            if (response.ok) {
                const data = await response.json()
                const reply = (data.reply || data.message || '').toUpperCase()
                aiResult = reply.includes('VERIFIED') ? 'verified' : reply.includes('FLAGGED') ? 'flagged' : 'pending'
                aiNotes = data.reply || data.message || 'No response from AI.'
            }

            await supabase.from('doctor_applications')
                .update({ ai_verification_status: aiResult, ai_verification_notes: aiNotes })
                .eq('id', app.id)

            toast.success(`AI Verification: ${aiResult.toUpperCase()}`)
            fetchApplications()
        } catch (err) {
            console.error('AI Verification error:', err)
            toast.error('AI verification failed. You can still approve manually.')
            await supabase.from('doctor_applications')
                .update({ ai_verification_status: 'error', ai_verification_notes: err.message })
                .eq('id', app.id)
            fetchApplications()
        }
    }

    const getAiStatusBadge = (status) => {
        const styles = {
            verified: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: '✓ AI Verified' },
            flagged: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: '⚠ AI Flagged' },
            verifying: { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', label: '⏳ Verifying...' },
            error: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', label: '❌ Error' },
            pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: '🔄 Pending AI' }
        }
        const s = styles[status] || styles.pending
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>
                {s.label}
            </span>
        )
    }

    // ── Doctor Applications Review View ──
    if (mode === 'applications') {
        return (
            <>
                <PageHeader
                    title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users size={28} />
                            Doctor Applications
                            <InfoTooltip content={{
                                title: "Doctor Applications",
                                description: "Review credentials submitted by healthcare professionals. AI verification checks license validity automatically.",
                                usage: "Click 'AI Verify' to run an automated credential check, then approve or reject. Approved doctors are automatically linked to their hospital."
                            }} />
                        </span>
                    }
                    description="Review, AI-verify, and manage pending medical professional applications."
                />

                <SectionContainer>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {applications.length === 0 ? (
                            <DashboardCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <Users size={40} color="#94A3B8" style={{ margin: '0 auto 1.5rem' }} />
                                <h3 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>No pending applications</h3>
                                <p style={{ color: '#64748B' }}>New "Become a Doctor" submissions will appear here for your review.</p>
                            </DashboardCard>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {applications.map(app => (
                                    <DashboardCard key={app.id} style={{ padding: '1.75rem' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                    <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1E293B' }}>{app.full_name}</h3>
                                                    {getAiStatusBadge(app.ai_verification_status)}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', color: '#475569', fontSize: '0.88rem' }}>
                                                    <span><strong>Specialty:</strong> {app.specialization}</span>
                                                    {app.qualification && <span><strong>Qualification:</strong> {app.qualification}</span>}
                                                    <span><strong>Experience:</strong> {app.experience_years} yrs</span>
                                                    <span><strong>License:</strong> <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>{app.license_number}</code></span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'right', minWidth: '130px' }}>
                                                {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                <br />
                                                {new Date(app.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: 10, marginBottom: '1rem' }}>
                                            {app.hospital_affiliation && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>🏥 Hospital</strong>
                                                    <span style={{ color: '#1E293B' }}>{app.hospital_affiliation}</span>
                                                </div>
                                            )}
                                            {app.clinic_name && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>🏨 Clinic</strong>
                                                    <span style={{ color: '#1E293B' }}>{app.clinic_name}</span>
                                                </div>
                                            )}
                                            {app.clinic_address && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>📍 Clinic Address</strong>
                                                    <span style={{ color: '#1E293B' }}>{app.clinic_address}</span>
                                                </div>
                                            )}
                                            {app.available_timings && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>🕐 Timings</strong>
                                                    <span style={{ color: '#1E293B' }}>{app.available_timings}</span>
                                                </div>
                                            )}
                                            {app.available_days && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>📅 Available Days</strong>
                                                    <span style={{ color: '#1E293B' }}>{app.available_days}</span>
                                                </div>
                                            )}
                                            {app.consultation_fee && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>💰 Fee</strong>
                                                    <span style={{ color: '#1E293B' }}>₹{app.consultation_fee}</span>
                                                </div>
                                            )}
                                            {app.practice_type && (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#64748B', display: 'block', marginBottom: '0.15rem' }}>📋 Practice Type</strong>
                                                    <span style={{ color: '#1E293B', textTransform: 'capitalize' }}>{app.practice_type}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bio */}
                                        {app.bio && (
                                            <div style={{ padding: '0.75rem 1rem', background: '#F0F9FF', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#0C4A6E', borderLeft: '3px solid #0EA5E9' }}>
                                                <strong>Bio:</strong> {app.bio}
                                            </div>
                                        )}

                                        {/* AI Verification Notes */}
                                        {app.ai_verification_notes && app.ai_verification_status !== 'pending' && (
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                background: app.ai_verification_status === 'verified' ? '#F0FDF4' : app.ai_verification_status === 'flagged' ? '#FEF2F2' : '#F8FAFC',
                                                borderRadius: 8,
                                                marginBottom: '1rem',
                                                fontSize: '0.82rem',
                                                color: '#475569',
                                                borderLeft: `3px solid ${app.ai_verification_status === 'verified' ? '#10B981' : app.ai_verification_status === 'flagged' ? '#EF4444' : '#94A3B8'}`
                                            }}>
                                                <strong>🤖 AI Notes:</strong> {app.ai_verification_notes}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <ActionButton
                                                variant="outline"
                                                style={{ fontSize: '0.82rem', color: '#0369A1', borderColor: '#BAE6FD' }}
                                                onClick={() => runAiVerification(app)}
                                                disabled={app.ai_verification_status === 'verifying'}
                                            >
                                                🤖 {app.ai_verification_status === 'verifying' ? 'Verifying...' : 'AI Verify'}
                                            </ActionButton>
                                            <ActionButton variant="outline" style={{ fontSize: '0.82rem', color: '#EF4444', borderColor: '#FECACA' }} onClick={() => {
                                                if (window.confirm("Are you sure you want to reject this application? This will permanently delete it.")) {
                                                    supabase.from('doctor_applications').delete().eq('id', app.id).then(() => {
                                                        toast.success('Application rejected.')
                                                        fetchApplications()
                                                    });
                                                }
                                            }}>
                                                ✗ Reject
                                            </ActionButton>
                                            <ActionButton variant="primary" style={{ fontSize: '0.82rem' }} onClick={async () => {
                                                try {
                                                    const { error } = await supabase.rpc('approve_doctor_application', { app_id: app.id })
                                                    if (error) {
                                                        if (error.message.includes('Could not find the function')) {
                                                            toast.error("RPC function not found! Run the migration SQL in Supabase first.");
                                                            return;
                                                        }
                                                        throw error;
                                                    }
                                                    toast.success(`✅ Approved ${app.full_name}! They are now a doctor${app.hospital_affiliation ? ` at ${app.hospital_affiliation}` : ''}.`);
                                                    fetchApplications();
                                                } catch (err) {
                                                    console.error("RPC Error:", err);
                                                    toast.error("Approval failed: " + err.message);
                                                }
                                            }}>
                                                ✓ Approve & Link to Hospital
                                            </ActionButton>
                                        </div>
                                    </DashboardCard>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </SectionContainer>
            </>
        )
    }

    // ── System Analytics View ──
    if (mode === 'analytics') {
        return (
            <>
                <PageHeader
                    title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingUp size={28} />
                            System Analytics
                            <InfoTooltip content={{
                                title: "System Analytics",
                                description: "Comprehensive view of platform usage, appointment trends, and consultation types across the entire hospital network.",
                                usage: "Use the dropdown to filter by time range. Monitor teleconsultation vs in-person trends."
                            }} />
                        </span>
                    }
                    description="Appointment metrics, consultation trends, and system usage."
                    className="doctor-header"
                    action={
                        <select
                            className="form-control"
                            style={{ width: 'auto', minWidth: '150px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <option style={{ color: '#000' }}>This Week</option>
                            <option style={{ color: '#000' }}>This Month</option>
                            <option style={{ color: '#000' }}>This Quarter</option>
                            <option style={{ color: '#000' }}>This Year</option>
                        </select>
                    }
                />

                <SectionContainer>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >

                        {/* Analytics KPI Cards */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
                        >
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%' }}>
                                        <CalendarCheck size={24} color="#3B82F6" />
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Appointments</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.totalAppointments}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>All time</div>
                                    </div>
                                </DashboardCard>
                            </motion.div>

                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '50%' }}>
                                        <Activity size={24} color="#10B981" />
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Teleconsultations</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.teleconsultations}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Video appointments</div>
                                    </div>
                                </DashboardCard>
                            </motion.div>

                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: '#F5F3FF', padding: '0.75rem', borderRadius: '50%' }}>
                                        <Clock size={24} color="#8B5CF6" />
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Video Sessions</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.videoSessions || 0}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginTop: '0.25rem' }}>Completed calls</div>
                                    </div>
                                </DashboardCard>
                            </motion.div>
                        </motion.div>

                        {/* Charts */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}
                        >
                            {/* Bar Chart: Appointment Status */}
                            <DashboardCard style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Appointment Status Breakdown</h3>
                                <div style={{ height: 300 }}>
                                    {appointmentTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={appointmentTrend} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                                <Tooltip
                                                    cursor={{ fill: '#F1F5F9' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                                                    {appointmentTrend.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data available</div>
                                    )}
                                </div>
                            </DashboardCard>

                            {/* Pie Chart: Type Distribution */}
                            <DashboardCard style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Appointment Type Distribution</h3>
                                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {typeDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={typeDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {typeDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value) => [`${value} Appointments`, 'Count']}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data available</div>
                                    )}
                                </div>
                            </DashboardCard>
                        </motion.div>
                    </motion.div>
                </SectionContainer>
            </>
        )
    }

    // ── Population Health View (default) ──
    return (
        <>
            <PageHeader
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={28} />
                        Population Health
                        <InfoTooltip content={{
                            title: "Population Health",
                            description: "Aggregated health metrics and risk stratifications for the patient population to help identify public health trends.",
                            usage: "Monitor high-risk patient counts and disease distributions to allocate resources effectively."
                        }} />
                    </span>
                }
                description="Overview of hospital patient demographics and risk factors."
                className="doctor-header"
                action={
                    <select
                        className="form-control"
                        style={{ width: 'auto', minWidth: '150px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option style={{ color: '#000' }}>This Week</option>
                        <option style={{ color: '#000' }}>This Month</option>
                        <option style={{ color: '#000' }}>This Quarter</option>
                        <option style={{ color: '#000' }}>This Year</option>
                    </select>
                }
            />

            <SectionContainer>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >

                    {/* KPI Cards */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
                    >
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%' }}>
                                    <Users size={24} color="#3B82F6" />
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Patients</span>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.totalPatients}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Active within network</div>
                                </div>
                            </DashboardCard>
                        </motion.div>

                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: '#FEF2F2', padding: '0.75rem', borderRadius: '50%' }}>
                                    <AlertTriangle size={24} color="#EF4444" />
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>High Risk Patients</span>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.highRiskPatients}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem' }}>Score &gt; 70</div>
                                </div>
                            </DashboardCard>
                        </motion.div>

                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <DashboardCard className="stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: '#F5F3FF', padding: '0.75rem', borderRadius: '50%' }}>
                                    <HeartPulse size={24} color="#8B5CF6" />
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Screenings Done</span>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.screeningsDone}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Awaiting review: {Math.floor(stats.screeningsDone * 0.15)}</div>
                                </div>
                            </DashboardCard>
                        </motion.div>
                    </motion.div>

                    {/* Charts ROW */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}
                    >
                        {/* Bar Chart: Disease Distribution */}
                        <DashboardCard style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Disease Risk Distribution</h3>
                            <div style={{ height: 300 }}>
                                {diseaseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={diseaseData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                                                {diseaseData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data available</div>
                                )}
                            </div>
                        </DashboardCard>

                        {/* Pie Chart: Triage Levels */}
                        <DashboardCard style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Current Triage Status</h3>
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {triageData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={triageData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {triageData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={TRIAGE_COLORS[index % TRIAGE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`${value} Patients`, 'Count']}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data available</div>
                                )}
                            </div>
                        </DashboardCard>
                    </motion.div>
                </motion.div>
            </SectionContainer>
        </>
    )
}
