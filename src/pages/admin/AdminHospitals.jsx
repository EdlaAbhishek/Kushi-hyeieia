import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Building2, MapPin, Phone, Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminHospitals() {
    const [hospitals, setHospitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingHospital, setEditingHospital] = useState(null)
    const [formData, setFormData] = useState({
        name: '', city: '', state: '', address: '', phone: '', email: '',
        specialties: '', beds: '', emergency: false, verified: false
    })

    useEffect(() => { fetchHospitals() }, [])

    async function fetchHospitals() {
        setLoading(true)
        const { data, error } = await supabase
            .from('hospitals')
            .select('*')
            .order('name')
        if (error) {
            console.error('Error fetching hospitals:', error.message)
            toast.error('Failed to load hospitals')
        } else {
            setHospitals(data || [])
        }
        setLoading(false)
    }

    const filtered = hospitals.filter(h =>
        h.name?.toLowerCase().includes(search.toLowerCase()) ||
        h.city?.toLowerCase().includes(search.toLowerCase())
    )

    function openAdd() {
        setEditingHospital(null)
        setFormData({ name: '', city: '', state: '', address: '', phone: '', email: '', specialties: '', beds: '', emergency: false, verified: false })
        setShowModal(true)
    }

    function openEdit(h) {
        setEditingHospital(h)
        setFormData({
            name: h.name || '', city: h.city || '', state: h.state || '',
            address: h.address || '', phone: h.phone || '', email: h.email || '',
            specialties: (h.specialties || []).join(', '), beds: h.beds || '',
            emergency: h.emergency || false, verified: h.verified || false
        })
        setShowModal(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        const payload = {
            ...formData,
            beds: formData.beds ? parseInt(formData.beds) : null,
            specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : []
        }
        if (editingHospital) {
            const { error } = await supabase.from('hospitals').update(payload).eq('id', editingHospital.id)
            if (error) { toast.error('Failed to update hospital'); return }
            toast.success('Hospital updated')
        } else {
            const { error } = await supabase.from('hospitals').insert(payload)
            if (error) { toast.error('Failed to add hospital'); return }
            toast.success('Hospital added')
        }
        setShowModal(false)
        fetchHospitals()
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this hospital?')) return
        const { error } = await supabase.from('hospitals').delete().eq('id', id)
        if (error) { toast.error('Failed to delete hospital'); return }
        toast.success('Hospital deleted')
        fetchHospitals()
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                    <Building2 size={22} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Manage Hospitals
                </h2>
                <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Add Hospital
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                    className="form-control"
                    placeholder="Search hospitals..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading hospitals...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {search ? 'No hospitals match your search.' : 'No hospitals found. Add your first hospital!'}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {filtered.map(h => (
                        <div key={h.id} style={{
                            padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'var(--card-bg, #fff)', position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{h.name}</h3>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={13} /> {h.city}{h.state ? `, ${h.state}` : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '0.25rem' }} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.25rem' }} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {h.phone && <p style={{ margin: '0.35rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} /> {h.phone}</p>}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                {h.emergency && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', fontWeight: 600 }}>Emergency</span>}
                                {h.verified && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#F0FDF4', color: '#16A34A', fontWeight: 600 }}>Verified</span>}
                                {h.beds && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>{h.beds} beds</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{editingHospital ? 'Edit Hospital' : 'Add Hospital'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Hospital Name *</label>
                                <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input className="form-control" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input className="form-control" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Beds</label>
                                    <input className="form-control" type="number" value={formData.beds} onChange={e => setFormData({ ...formData, beds: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Specialties (comma separated)</label>
                                <input className="form-control" value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} placeholder="Cardiology, Orthopedics, ..." />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', margin: '0.75rem 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.emergency} onChange={e => setFormData({ ...formData, emergency: e.target.checked })} /> Emergency
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.verified} onChange={e => setFormData({ ...formData, verified: e.target.checked })} /> Verified
                                </label>
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                                {editingHospital ? 'Update Hospital' : 'Add Hospital'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
