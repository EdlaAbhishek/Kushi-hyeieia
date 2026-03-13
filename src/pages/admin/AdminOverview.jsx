import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, Stethoscope, Hospital, CalendarCheck, TrendingUp, Activity } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { motion } from 'framer-motion'
import DashboardCard from '../../components/ui/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import SectionContainer from '../../components/ui/SectionContainer'

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminOverview() {
    const [stats, setStats] = useState({ patients: 0, doctors: 0, hospitals: 0, todayAppts: 0 })
    const [statusData, setStatusData] = useState([])
    const [typeData, setTypeData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [pRes, dRes, hRes, aRes] = await Promise.all([
                supabase.from('patients').select('*', { count: 'exact', head: true }),
                supabase.from('doctors').select('*', { count: 'exact', head: true }),
                supabase.from('hospitals').select('*', { count: 'exact', head: true }),
                supabase.from('appointments').select('*')
            ])

            if (pRes.error) console.warn('Patients fetch error:', pRes.error.message)
            if (dRes.error) console.warn('Doctors fetch error:', dRes.error.message)
            if (hRes.error) console.warn('Hospitals fetch error:', hRes.error.message)
            if (aRes.error) console.warn('Appointments fetch error:', aRes.error.message)

            const today = new Date().toISOString().split('T')[0]
            const todayAppts = (aRes.data || []).filter(a => (a.date || a.appointment_date || '').startsWith(today)).length

            setStats({
                patients: pRes.count || 0,
                doctors: dRes.count || 0,
                hospitals: hRes.count || 0,
                todayAppts
            })

            // Status distribution
            const statusCounts = (aRes.data || []).reduce((acc, a) => {
                const s = a.status || 'unknown'
                acc[s] = (acc[s] || 0) + 1
                return acc
            }, {})
            setStatusData(Object.entries(statusCounts).map(([name, count]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1), count
            })))

            // Type distribution
            const typeCounts = (aRes.data || []).reduce((acc, a) => {
                const t = a.appointment_type === 'teleconsultation' ? 'Video Call' : a.appointment_type === 'in_person' ? 'In-Person' : (a.appointment_type || 'Unknown')
                acc[t] = (acc[t] || 0) + 1
                return acc
            }, {})
            setTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })))
        } catch (err) {
            console.error('Admin overview fetch error:', err)
        }
        setLoading(false)
    }

    const kpis = [
        { label: 'Total Patients', value: stats.patients, icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Total Doctors', value: stats.doctors, icon: Stethoscope, color: '#10B981', bg: '#F0FDF4' },
        { label: 'Total Hospitals', value: stats.hospitals, icon: Hospital, color: '#8B5CF6', bg: '#F5F3FF' },
        { label: 'Appointments Today', value: stats.todayAppts, icon: CalendarCheck, color: '#F59E0B', bg: '#FFFBEB' },
    ]

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp size={28} />
                        Admin Overview
                    </span>
                }
                description="Platform-wide analytics and key performance indicators."
            />

            <SectionContainer>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {kpis.map((kpi, i) => (
                            <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                                <DashboardCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: kpi.bg, padding: '0.75rem', borderRadius: '50%' }}>
                                        <kpi.icon size={24} color={kpi.color} />
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{kpi.value}</div>
                                    </div>
                                </DashboardCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                        <DashboardCard style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1E293B' }}>Appointment Status</h3>
                            <div style={{ height: 300 }}>
                                {statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data</div>}
                            </div>
                        </DashboardCard>

                        <DashboardCard style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1E293B' }}>Appointment Types</h3>
                            <div style={{ height: 300 }}>
                                {typeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={typeData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>No data</div>}
                            </div>
                        </DashboardCard>
                    </motion.div>
                </motion.div>
            </SectionContainer>
        </>
    )
}
