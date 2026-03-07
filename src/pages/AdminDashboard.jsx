import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { Users, Activity, AlertTriangle, HeartPulse, CalendarCheck, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../services/supabase'
import { motion } from 'framer-motion'

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
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (mode === 'analytics') {
            fetchAnalyticsData()
        } else {
            fetchDashboardData()
        }
    }, [mode])

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

    // ── System Analytics View ──
    if (mode === 'analytics') {
        return (
            <>
                <section className="page-header doctor-header">
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <TrendingUp size={28} />
                                System Analytics
                            </h1>
                            <p className="page-subtitle">Appointment metrics, consultation trends, and system usage.</p>
                        </div>
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
                    </div>
                </section>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 0 2rem 0' }}
                >

                    {/* Analytics KPI Cards */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
                    >
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%' }}>
                                <CalendarCheck size={24} color="#3B82F6" />
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Appointments</span>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.totalAppointments}</div>
                                <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>All time</div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '50%' }}>
                                <Activity size={24} color="#10B981" />
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Teleconsultations</span>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.teleconsultations}</div>
                                <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Video appointments</div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ background: '#F5F3FF', padding: '0.75rem', borderRadius: '50%' }}>
                                <Clock size={24} color="#8B5CF6" />
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Video Sessions</span>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{analyticsStats.videoSessions || 0}</div>
                                <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginTop: '0.25rem' }}>Completed calls</div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Charts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}
                    >
                        {/* Bar Chart: Appointment Status */}
                        <div className="card" style={{ padding: '1.5rem' }}>
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
                        </div>

                        {/* Pie Chart: Type Distribution */}
                        <div className="card" style={{ padding: '1.5rem' }}>
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
                        </div>
                    </motion.div>
                </motion.div>
            </>
        )
    }

    // ── Population Health View (default) ──
    return (
        <>
            <section className="page-header doctor-header">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Activity size={28} />
                            Population Health
                        </h1>
                        <p className="page-subtitle">Overview of hospital patient demographics and risk factors.</p>
                    </div>
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
                </div>
            </section>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 0 2rem 0' }}
            >

                {/* KPI Cards */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
                >
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%' }}>
                            <Users size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Patients</span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.totalPatients}</div>
                            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Active within network</div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: '#FEF2F2', padding: '0.75rem', borderRadius: '50%' }}>
                            <AlertTriangle size={24} color="#EF4444" />
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>High Risk Patients</span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.highRiskPatients}</div>
                            <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem' }}>Score &gt; 70</div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: '#F5F3FF', padding: '0.75rem', borderRadius: '50%' }}>
                            <HeartPulse size={24} color="#8B5CF6" />
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Screenings Done</span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{stats.screeningsDone}</div>
                            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>Awaiting review: {Math.floor(stats.screeningsDone * 0.15)}</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Charts ROW */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}
                >
                    {/* Bar Chart: Disease Distribution */}
                    <div className="card" style={{ padding: '1.5rem' }}>
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
                    </div>

                    {/* Pie Chart: Triage Levels */}
                    <div className="card" style={{ padding: '1.5rem' }}>
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
                    </div>
                </motion.div>
            </motion.div>
        </>
    )
}
