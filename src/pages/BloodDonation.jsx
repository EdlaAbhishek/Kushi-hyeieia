import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Droplet, MapPin, Calendar, Phone, Mail, User, Shield, CheckCircle, UserPlus, Info } from 'lucide-react'

export default function BloodDonation() {
    const { user } = useAuth()

    // Donor List State
    const [donors, setDonors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filter State
    const [filterGroup, setFilterGroup] = useState('')
    const [filterLocation, setFilterLocation] = useState('')

    // Registration Form State
    const [isRegistering, setIsRegistering] = useState(false)
    const [formFields, setFormFields] = useState({
        blood_group: '',
        location: '',
        phone: '',
        show_name: true,
        contact_visible: false,
        available_until: ''
    })
    const [formStatus, setFormStatus] = useState({ loading: false, error: null, success: null })

    // Request Modal State
    const [requestModal, setRequestModal] = useState(null) // holds donor object
    const [reqFields, setReqFields] = useState({
        patient_name: '',
        patient_phone: '',
        message: ''
    })
    const [reqLoading, setReqLoading] = useState(false)
    const [reqError, setReqError] = useState(null)
    const [reqSuccess, setReqSuccess] = useState(null)

    // Initial Fetch
    useEffect(() => {
        fetchDonors()
    }, [])

    const fetchDonors = async () => {
        setLoading(true)
        setError(null)
        try {
            const today = new Date().toISOString().split('T')[0]

            let query = supabase
                .from('blood_donors')
                .select('*')
                .gte('available_until', today)
                .order('created_at', { ascending: false })

            const { data, error: fetchErr } = await query

            if (fetchErr) throw fetchErr
            setDonors(data || [])
        } catch (err) {
            console.error(err)
            setError(err.message)
            setDonors([])
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!user) {
            setFormStatus({ loading: false, error: 'You must be logged in to register as a donor.', success: null })
            return
        }

        setFormStatus({ loading: true, error: null, success: null })

        try {
            const { error: upsertError } = await supabase
                .from('blood_donors')
                .upsert({
                    user_id: user.id,
                    name: user.user_metadata?.full_name || user.email,
                    blood_group: formFields.blood_group,
                    location: formFields.location,
                    phone: formFields.phone,
                    show_name: formFields.show_name,
                    contact_visible: formFields.contact_visible,
                    available_until: formFields.available_until
                }, { onConflict: 'user_id' })

            if (upsertError) throw upsertError

            setFormStatus({ loading: false, error: null, success: 'Successfully registered as a donor!' })
            setIsRegistering(false)
            fetchDonors()
        } catch (err) {
            setFormStatus({ loading: false, error: err.message, success: null })
        }
    }

    const handleRequestSubmit = async (e) => {
        e.preventDefault()
        setReqLoading(true)
        setReqError(null)
        setReqSuccess(null)

        try {
            const { error: insertError } = await supabase
                .from('blood_requests')
                .insert({
                    donor_id: requestModal.id,
                    patient_name: reqFields.patient_name,
                    patient_phone: reqFields.patient_phone,
                    message: reqFields.message,
                    status: 'pending'
                })

            if (insertError) throw insertError

            setReqSuccess('Blood request sent successfully!')
            setTimeout(() => {
                setRequestModal(null)
                setReqSuccess(null)
                setReqFields({ patient_name: '', patient_phone: '', message: '' })
            }, 2000)
        } catch (err) {
            setReqError(err.message)
        } finally {
            setReqLoading(false)
        }
    }

    // Filter Logic
    const filteredDonors = donors.filter(d => {
        if (filterGroup && d.blood_group !== filterGroup) return false
        if (filterLocation && !d.location.toLowerCase().includes(filterLocation.toLowerCase())) return false
        return true
    })

    return (
        <>
            <section className="page-header" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)' }}>
                <div className="container">
                    <h1 className="page-title">Blood Donation Network</h1>
                    <p className="page-subtitle">Register to save lives or find critical blood donors in your area.</p>
                </div>
            </section>

            <section className="section bg-surface">
                <div className="container">

                    {/* Top Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                            <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
                                <label className="form-label">Blood Group</label>
                                <select className="form-control" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                                    <option value="">All Groups</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1, maxWidth: '400px' }}>
                                <label className="form-label">Location</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search city or area..."
                                        value={filterLocation}
                                        onChange={e => setFilterLocation(e.target.value)}
                                        style={{ paddingLeft: '38px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Register Toggle */}
                        {user && (
                            <button className="btn btn-primary" onClick={() => setIsRegistering(!isRegistering)} style={{ background: '#DC2626' }}>
                                <UserPlus size={18} /> {isRegistering ? 'Cancel Registration' : 'Register as Donor'}
                            </button>
                        )}
                    </div>

                    {/* Registration Form */}
                    {isRegistering && (
                        <div className="card" style={{ marginBottom: '3rem', borderLeft: '4px solid #DC2626' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div className="card-icon" style={{ margin: 0, background: '#FEF2F2', color: '#DC2626' }}>
                                    <Droplet size={22} />
                                </div>
                                <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Donor Registration Profile</h2>
                            </div>

                            {formStatus.error && <div className="auth-error">{formStatus.error}</div>}
                            {formStatus.success && <div className="auth-success" style={{ color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{formStatus.success}</div>}

                            <form onSubmit={handleRegister} className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
                                <div>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group *</label>
                                        <select className="form-control" required value={formFields.blood_group} onChange={e => setFormFields({ ...formFields, blood_group: e.target.value })}>
                                            <option value="" disabled>Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location / City *</label>
                                        <input type="text" className="form-control" required placeholder="e.g. Hyderabad, TS" value={formFields.location} onChange={e => setFormFields({ ...formFields, location: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Phone *</label>
                                        <input type="tel" className="form-control" required placeholder="+91 XXXXX XXXXX" value={formFields.phone} onChange={e => setFormFields({ ...formFields, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Available Until Date *</label>
                                        <input type="date" className="form-control" required min={new Date().toISOString().split('T')[0]} value={formFields.available_until} onChange={e => setFormFields({ ...formFields, available_until: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={18} /> Privacy Controls
                                        </h4>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formFields.show_name} onChange={e => setFormFields({ ...formFields, show_name: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>Show My Name Publicly</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If unchecked, you will appear as "Anonymous Donor".</div>
                                            </div>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formFields.contact_visible} onChange={e => setFormFields({ ...formFields, contact_visible: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>Show Phone Number</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If unchecked, patients must use the Request Contact form.</div>
                                            </div>
                                        </label>
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#DC2626' }} disabled={formStatus.loading}>
                                        {formStatus.loading ? 'Saving...' : 'Save Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="auth-error" style={{ marginBottom: '2rem' }}>
                            <strong>Database Error:</strong> {error}
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>If the table does not exist, you must create `blood_donors` in Supabase.</p>
                        </div>
                    )}

                    {/* Donor List */}
                    {loading ? (
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading donors...</p>
                        </div>
                    ) : filteredDonors.length === 0 ? (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                                <Droplet size={32} />
                            </div>
                            <h3>No Donors Found</h3>
                            <p>There are no active donors matching your criteria.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {filteredDonors.map(donor => (
                                <div key={donor.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {donor.blood_group}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.1rem' }}>
                                                    {donor.show_name ? donor.name : 'Anonymous Donor'}
                                                </h3>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <MapPin size={12} /> {donor.location}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                            <Calendar size={14} style={{ color: 'var(--primary)' }} />
                                            <span>Available until: <strong>{new Date(donor.available_until).toLocaleDateString()}</strong></span>
                                        </div>
                                        {donor.contact_visible ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                                <Phone size={14} style={{ color: '#059669' }} />
                                                <span style={{ fontWeight: 600 }}>{donor.phone}</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                                <Shield size={14} />
                                                <span>Contact details hidden</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn btn-outline"
                                        style={{ width: '100%', borderColor: '#DC2626', color: '#DC2626' }}
                                        onClick={() => setRequestModal(donor)}
                                    >
                                        Request Blood
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Request Modal */}
            {requestModal && (
                <div className="modal-overlay" onClick={() => !reqLoading && setRequestModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => !reqLoading && setRequestModal(null)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Request Blood Connection</h2>
                            <p className="modal-subtitle">
                                Send a request to {requestModal.show_name ? requestModal.name : 'this Anonymous Donor'}.
                            </p>
                        </div>

                        {reqSuccess && (
                            <div className="auth-success" style={{ textAlign: 'center' }}>
                                <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
                                <div>{reqSuccess}</div>
                            </div>
                        )}

                        {!reqSuccess && (
                            <form onSubmit={handleRequestSubmit}>
                                {reqError && <div className="auth-error">{reqError}</div>}

                                <div className="form-group">
                                    <label className="form-label">Patient / Contact Name *</label>
                                    <input type="text" className="form-control" required value={reqFields.patient_name} onChange={e => setReqFields({ ...reqFields, patient_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone *</label>
                                    <input type="tel" className="form-control" required value={reqFields.patient_phone} onChange={e => setReqFields({ ...reqFields, patient_phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message / Details *</label>
                                    <textarea className="form-control" rows={4} required placeholder="State hospital name, patient condition, urgency..." value={reqFields.message} onChange={e => setReqFields({ ...reqFields, message: e.target.value })} style={{ resize: 'vertical' }} />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#DC2626' }} disabled={reqLoading}>
                                        {reqLoading ? 'Sending Request...' : 'Send Request'}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => setRequestModal(null)} disabled={reqLoading}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
