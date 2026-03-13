import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardCard from '../../components/ui/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import SectionContainer from '../../components/ui/SectionContainer'
import DataTable from '../../components/ui/DataTable'

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'cancelled', 'completed']
const statusStyle = (s) => {
    const m = {
        pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
        approved: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
        rejected: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
        cancelled: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
        completed: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
    }
    return m[s] || m.pending
}

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [searchQ, setSearchQ] = useState('')

    useEffect(() => { fetchAppointments() }, [])

    const fetchAppointments = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false })
        setAppointments(data || [])
        setLoading(false)
    }

    const filtered = appointments.filter(a => {
        const matchesStatus = !statusFilter || a.status === statusFilter
        const q = searchQ.toLowerCase()
        const matchesSearch = !q || (a.patient_name || '').toLowerCase().includes(q) || (a.doctor_name || '').toLowerCase().includes(q) || (a.hospital_name || '').toLowerCase().includes(q)
        return matchesStatus && matchesSearch
    })

    const updateStatus = async (appt, newStatus) => {
        try {
            const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appt.id)
            if (error) throw error
            toast.success(`Status → ${newStatus}`)
            fetchAppointments()
        } catch (err) { toast.error('Update failed: ' + err.message) }
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="loading-spinner"></div></div>

    return (
        <>
            <PageHeader
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Calendar size={28} /> Appointment Management</span>}
                description={`${appointments.length} total appointment${appointments.length !== 1 ? 's' : ''}.`}
            />
            <SectionContainer>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <input className="form-control" placeholder="Search patient, doctor, hospital..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ maxWidth: 320 }} />
                        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>

                    {/* Status Summary Chips */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(s => {
                            const count = appointments.filter(a => a.status === s).length
                            const st = statusStyle(s)
                            return (
                                <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)} style={{
                                    padding: '0.35rem 0.85rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                                    background: statusFilter === s ? st.color : st.bg, color: statusFilter === s ? '#fff' : st.color,
                                    border: `1px solid ${st.border}`, cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
                                </button>
                            )
                        })}
                    </div>

                    {filtered.length === 0 ? (
                        <DashboardCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Calendar size={40} color="#94A3B8" style={{ margin: '0 auto 1.5rem' }} />
                            <h3 style={{ color: '#1E293B' }}>No appointments found</h3>
                            <p style={{ color: '#64748B' }}>{statusFilter ? `No ${statusFilter} appointments.` : 'No appointments exist yet.'}</p>
                        </DashboardCard>
                    ) : (
                        <div className="table-responsive">
                            <DataTable>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '1rem' }}>Patient</th>
                                        <th style={{ padding: '1rem' }}>Doctor</th>
                                        <th style={{ padding: '1rem' }}>Hospital</th>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(a => {
                                        const st = statusStyle(a.status)
                                        return (
                                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '1rem' }}>{a.patient_name || '—'}</td>
                                                <td style={{ padding: '1rem' }}>{a.doctor_name || '—'}</td>
                                                <td style={{ padding: '1rem' }}>{a.hospital_name || '—'}</td>
                                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{(a.date || a.appointment_date) ? new Date(a.date || a.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                                        {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <select
                                                        className="form-control"
                                                        value={a.status || ''}
                                                        onChange={e => updateStatus(a, e.target.value)}
                                                        style={{ fontSize: '0.82rem', padding: '0.3rem 0.5rem', minWidth: 120, height: 'auto' }}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </motion.div>
            </SectionContainer>
        </>
    )
}
