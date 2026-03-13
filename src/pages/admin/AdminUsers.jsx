import { useState, useEffect } from 'react'
import { Users, Shield } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardCard from '../../components/ui/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import SectionContainer from '../../components/ui/SectionContainer'
import DataTable from '../../components/ui/DataTable'

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQ, setSearchQ] = useState('')

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Fetch from patients table (all users have a record here)
            const { data: patients } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
            // Try to also fetch doctors to map roles
            const { data: doctors } = await supabase.from('doctors').select('user_id')
            const doctorIds = new Set((doctors || []).map(d => d.user_id))

            const merged = (patients || []).map(p => ({
                ...p,
                role: doctorIds.has(p.id) ? 'doctor' : (p.role || 'patient')
            }))
            setUsers(merged)
        } catch (err) {
            console.error('Error fetching users:', err)
        }
        setLoading(false)
    }

    const filtered = users.filter(u => {
        if (!searchQ) return true
        const q = searchQ.toLowerCase()
        return (u.full_name || u.name || '').toLowerCase().includes(q) ||
               (u.email || '').toLowerCase().includes(q) ||
               (u.role || '').toLowerCase().includes(q)
    })

    const changeRole = async (user, newRole) => {
        try {
            // Update in patients table
            await supabase.from('patients').update({ role: newRole }).eq('id', user.id)
            toast.success(`${user.full_name || user.email} → ${newRole}`)
            fetchUsers()
        } catch (err) {
            toast.error('Role update failed: ' + err.message)
        }
    }

    const roleBadge = (role) => {
        const m = {
            admin: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
            doctor: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
            patient: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' }
        }
        const s = m[role] || m.patient
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>{role}</span>
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="loading-spinner"></div></div>

    return (
        <>
            <PageHeader
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Users size={28} /> User Management</span>}
                description={`${users.length} registered user${users.length !== 1 ? 's' : ''} on the platform.`}
            />
            <SectionContainer>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
                        <input className="form-control" placeholder="Search by name, email, or role..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total', count: users.length, color: '#6366F1', bg: '#F5F3FF' },
                            { label: 'Patients', count: users.filter(u => u.role === 'patient').length, color: '#3B82F6', bg: '#EFF6FF' },
                            { label: 'Doctors', count: users.filter(u => u.role === 'doctor').length, color: '#10B981', bg: '#F0FDF4' },
                            { label: 'Admins', count: users.filter(u => u.role === 'admin').length, color: '#8B5CF6', bg: '#F5F3FF' },
                        ].map(s => (
                            <DashboardCard key={s.label} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, background: s.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={18} color={s.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>{s.count}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            </DashboardCard>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <DashboardCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Users size={40} color="#94A3B8" style={{ margin: '0 auto 1.5rem' }} />
                            <h3 style={{ color: '#1E293B' }}>No users found</h3>
                        </DashboardCard>
                    ) : (
                        <div className="table-responsive">
                            <DataTable>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Role</th>
                                        <th style={{ padding: '1rem' }}>Joined</th>
                                        <th style={{ padding: '1rem' }}>Change Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem' }}><strong>{u.full_name || u.name || '—'}</strong></td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748B' }}>{u.email || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{roleBadge(u.role || 'patient')}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#94A3B8' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <select className="form-control" value={u.role || 'patient'} onChange={e => changeRole(u, e.target.value)} style={{ fontSize: '0.82rem', padding: '0.3rem 0.5rem', minWidth: 110, height: 'auto' }}>
                                                    <option value="patient">Patient</option>
                                                    <option value="doctor">Doctor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </motion.div>
            </SectionContainer>
        </>
    )
}
