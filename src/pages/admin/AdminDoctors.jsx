import { useState, useEffect } from 'react'
import { Stethoscope, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardCard from '../../components/ui/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import SectionContainer from '../../components/ui/SectionContainer'
import ActionButton from '../../components/ui/ActionButton'
import DataTable from '../../components/ui/DataTable'

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(true)
    const [editDoc, setEditDoc] = useState(null)
    const [form, setForm] = useState({})
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('')

    useEffect(() => { fetchDoctors() }, [])

    const fetchDoctors = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('doctors').select('*').order('full_name', { ascending: true })
        if (error) console.warn('Doctors fetch error:', error.message)
        setDoctors(data || [])
        setLoading(false)
    }

    const filtered = doctors.filter(d => {
        if (!filter) return true
        const q = filter.toLowerCase()
        const docName = (d.name || d.full_name || '').toLowerCase()
        return docName.includes(q) ||
               (d.specialty || '').toLowerCase().includes(q) ||
               (d.hospital_name || '').toLowerCase().includes(q)
    })

    const openEdit = (doc) => {
        setEditDoc(doc)
        setForm({
            name: doc.name || doc.full_name || '', specialty: doc.specialty || '', experience: doc.experience || '',
            hospital: doc.hospital_name || '', bio: doc.bio || '',
            available_timings: doc.available_timings || '', consultation_fee: doc.consultation_fee || ''
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.from('doctors').update({
                name: form.name, full_name: form.name, specialty: form.specialty, experience: parseInt(form.experience) || 0,
                hospital: form.hospital, hospital_name: form.hospital, bio: form.bio,
                available_timings: form.available_timings, consultation_fee: form.consultation_fee ? parseInt(form.consultation_fee) : null
            }).eq('id', editDoc.id)
            if (error) throw error
            toast.success('Doctor updated!')
            setEditDoc(null)
            fetchDoctors()
        } catch (err) { toast.error('Update failed: ' + err.message) }
        setSaving(false)
    }

    const toggleActive = async (doc) => {
        const newStatus = doc.verified === false ? true : false
        await supabase.from('doctors').update({ verified: newStatus }).eq('id', doc.id)
        toast.success(newStatus ? 'Doctor activated.' : 'Doctor deactivated.')
        fetchDoctors()
    }

    const handleDelete = async (doc) => {
        if (!window.confirm(`Remove Dr. ${doc.name}? This cannot be undone.`)) return
        await supabase.from('doctors').delete().eq('id', doc.id)
        toast.success('Doctor removed.')
        fetchDoctors()
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="loading-spinner"></div></div>

    return (
        <>
            <PageHeader
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Stethoscope size={28} /> Doctor Management</span>}
                description={`${doctors.length} registered doctor${doctors.length !== 1 ? 's' : ''}.`}
            />
            <SectionContainer>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
                        <input className="form-control" placeholder="Search by name, specialty, or hospital..." value={filter} onChange={e => setFilter(e.target.value)} />
                    </div>

                    {filtered.length === 0 ? (
                        <DashboardCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Stethoscope size={40} color="#94A3B8" style={{ margin: '0 auto 1.5rem' }} />
                            <h3 style={{ color: '#1E293B' }}>{filter ? 'No matching doctors' : 'No doctors yet'}</h3>
                            <p style={{ color: '#64748B' }}>Approved doctor applications will appear here.</p>
                        </DashboardCard>
                    ) : (
                        <div className="table-responsive">
                            <DataTable>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '1rem' }}>Doctor</th>
                                        <th style={{ padding: '1rem' }}>Specialty</th>
                                        <th style={{ padding: '1rem' }}>Hospital</th>
                                        <th style={{ padding: '1rem' }}>Exp</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(doc => (
                                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem' }}><strong>{doc.name || doc.full_name || '—'}</strong></td>
                                            <td style={{ padding: '1rem' }}>{doc.specialty || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{doc.hospital_name || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{doc.experience ? `${doc.experience} yrs` : '—'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                {doc.is_approved ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                                                        background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                                                        display: 'inline-flex', alignItems: 'center', gap: 4
                                                    }}>
                                                        ✓ Verified
                                                    </span>
                                                ) : doc.verified !== false ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                                                        background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
                                                    }}>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                                                        background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA'
                                                    }}>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => openEdit(doc)} style={{ background: '#EFF6FF', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', color: '#3B82F6' }} title="Edit"><Pencil size={16} /></button>
                                                    <button onClick={() => toggleActive(doc)} style={{ background: '#FFFBEB', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', color: '#D97706' }} title={doc.verified !== false ? 'Deactivate' : 'Activate'}>
                                                        {doc.verified !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(doc)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', color: '#EF4444' }} title="Remove"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </motion.div>
            </SectionContainer>

            {/* Edit Modal */}
            {editDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setEditDoc(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 500, width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditDoc(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', marginBottom: '1.5rem' }}>Edit Doctor</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Name</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Specialty</label><input className="form-control" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Experience (yrs)</label><input className="form-control" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Hospital</label><input className="form-control" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Timings</label><input className="form-control" value={form.available_timings} onChange={e => setForm({ ...form, available_timings: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Fee (₹)</label><input className="form-control" type="number" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: e.target.value })} /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Bio</label><textarea className="form-control" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2} style={{ minHeight: 'auto' }} /></div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <ActionButton variant="outline" onClick={() => setEditDoc(null)}>Cancel</ActionButton>
                                <ActionButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Update'}</ActionButton>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    )
}
