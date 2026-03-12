import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Droplet, MapPin, Search, Megaphone, UserPlus, Shield, Phone } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import InfoTooltip from '../components/ui/InfoTooltip'

export default function BloodDonation() {
    const { user } = useAuth()

    // Tab State
    const [activeTab, setActiveTab] = useState('donors') // 'donors' | 'inventory' | 'broadcasts'

    // ─── TAB 1: DONORS ──────────────────────────────────────────────────
    const [donors, setDonors] = useState([])
    const [donorsLoading, setDonorsLoading] = useState(true)
    const [donorsError, setDonorsError] = useState(null)
    const [filterGroup, setFilterGroup] = useState('')
    const [filterLocation, setFilterLocation] = useState('')

    // Registration Form
    const [isRegistering, setIsRegistering] = useState(false)
    const [formFields, setFormFields] = useState({
        blood_group: '', location: '', phone: '', show_name: true, contact_visible: false, available_until: ''
    })
    const [formStatus, setFormStatus] = useState({ loading: false, error: null, success: null })

    // Private Request Modal
    const [requestModal, setRequestModal] = useState(null)
    const [reqFields, setReqFields] = useState({ patient_name: '', patient_phone: '', message: '' })
    const [reqLoading, setReqLoading] = useState(false)
    const [reqError, setReqError] = useState(null)
    const [reqSuccess, setReqSuccess] = useState(null)

    // ─── TAB 2: HOSPITAL INVENTORY ─────────────────────────────────────
    const [invGroup, setInvGroup] = useState('')
    const [invCity, setInvCity] = useState('')
    const [invLoading, setInvLoading] = useState(false)
    const [invResults, setInvResults] = useState(null)
    const [invError, setInvError] = useState(null)

    // ─── TAB 3: BROADCAST REQUESTS ────────────────────────────────────
    const [broadcasts, setBroadcasts] = useState([])
    const [broadcastsLoading, setBroadcastsLoading] = useState(true)
    const [broadcastModal, setBroadcastModal] = useState(false)
    const [broadcastFields, setBroadcastFields] = useState({
        patient_name: '', patient_phone: '', blood_group: '', location: '', message: ''
    })

    // ─── EFFECTS ───────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'donors') fetchDonors()
        if (activeTab === 'broadcasts') fetchBroadcasts()
    }, [activeTab])

    // ─── SHARED LOGIC ──────────────────────────────────────────────────
    const fetchDonors = async () => {
        setDonorsLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const { data, error } = await supabase.from('blood_donors').select('*').gte('available_until', today).order('created_at', { ascending: false })
            if (error) throw error
            setDonors(data || [])
        } catch (err) { setDonorsError(err.message) } finally { setDonorsLoading(false) }
    }

    const fetchBroadcasts = async () => {
        setBroadcastsLoading(true)
        try {
            const { data, error } = await supabase.from('blood_requests').select('*').is('donor_id', null).order('created_at', { ascending: false }).limit(20)
            if (error) throw error
            setBroadcasts(data || [])
        } catch (err) { console.error(err) } finally { setBroadcastsLoading(false) }
    }

    // ─── HANDLERS ─────────────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault()
        if (!user) return setFormStatus({ loading: false, error: 'Log in to register.', success: null })
        setFormStatus({ loading: true, error: null, success: null })
        try {
            const { error } = await supabase.from('blood_donors').upsert({
                user_id: user.id, name: user.user_metadata?.full_name || user.email,
                blood_group: formFields.blood_group, location: formFields.location, phone: formFields.phone,
                show_name: formFields.show_name, contact_visible: formFields.contact_visible, available_until: formFields.available_until
            }, { onConflict: 'user_id' })
            if (error) throw error
            setFormStatus({ loading: false, error: null, success: 'Successfully registered!' })
            setIsRegistering(false); fetchDonors()
        } catch (err) { setFormStatus({ loading: false, error: err.message, success: null }) }
    }

    const handleInventorySearch = async (e) => {
        e.preventDefault()
        setInvLoading(true); setInvResults(null); setInvError(null)
        try {
            const { data, error } = await supabase.from('blood_inventory').select('*').eq('blood_group', invGroup).ilike('city', `%${invCity}%`).order('units', { ascending: false })
            if (error) throw error
            setInvResults(data || [])
        } catch (err) { setInvError(err.message) } finally { setInvLoading(false) }
    }

    const handleRequestSubmit = async (e) => {
        e.preventDefault()
        setReqLoading(true); setReqError(null); setReqSuccess(null)
        try {
            const { error } = await supabase.from('blood_requests').insert({
                donor_id: requestModal.id, patient_name: reqFields.patient_name, patient_phone: reqFields.patient_phone, message: reqFields.message, status: 'pending'
            })
            if (error) throw error
            setReqSuccess('Request sent successfully!')
            setTimeout(() => { setRequestModal(null); setReqSuccess(null); setReqFields({ patient_name: '', patient_phone: '', message: '' }) }, 2000)
        } catch (err) { setReqError(err.message) } finally { setReqLoading(false) }
    }

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault()
        setReqLoading(true); setReqError(null); setReqSuccess(null)
        try {
            const msg = `[URGENT: ${broadcastFields.blood_group} at ${broadcastFields.location}] ${broadcastFields.message}`
            const { error } = await supabase.from('blood_requests').insert({
                donor_id: null, patient_name: broadcastFields.patient_name, patient_phone: broadcastFields.patient_phone, message: msg, status: 'pending'
            })
            if (error) throw error
            setReqSuccess('Broadcast sent!')
            setTimeout(() => { setBroadcastModal(false); setReqSuccess(null); setBroadcastFields({ patient_name: '', patient_phone: '', blood_group: '', location: '', message: '' }); fetchBroadcasts() }, 2000)
        } catch (err) { setReqError(err.message) } finally { setReqLoading(false) }
    }

    const filteredDonors = donors.filter(d => {
        if (filterGroup && d.blood_group !== filterGroup) return false
        if (filterLocation && !d.location.toLowerCase().includes(filterLocation.toLowerCase())) return false
        return true
    })

    return (
        <div className="blood-donation-page">
            <PageHeader
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Droplet size={28} color="#EF4444" />
                        Blood Donation Network
                    </span>
                }
                description="Connect with nearby donors or check hospital blood inventory."
                className="doctor-header"
                action={
                    <InfoTooltip content={{
                        en: { title: 'Blood Donation Network', helps: 'One-stop hub for blood donors, hospital inventory, and urgent public broadcasts.', usage: '1. Find Donors: Search for volunteers nearby.\n2. Hospital Inventory: Check live stock in hospitals.\n3. Broadcasts: Post or view urgent requests for help.' },
                        hi: { title: 'रक्तदान नेटवर्क', helps: 'रक्त दाताओं, अस्पताल सूची और तत्काल सार्वजनिक प्रसारण के लिए वन-स्टॉप हब।', usage: '1. दाता खोजें: पास के स्वयंसेवकों को खोजें।\n2. अस्पताल सूची: अस्पतालों में लाइव स्टॉक की जांच करें।\n3. प्रसारण: मदद के लिए तत्काल अनुरोध पोस्ट करें या देखें।' },
                        te: { title: 'రక్త దాన నెట్‌వర్క్', helps: 'రక్తదాతలు, ఆసుపత్రి ఇన్వెంటరీ మరియు అత్యవసర బహిరంగ ప్రసారాల కోసం వన్-స్టాప్ హబ్.', usage: '1. దాతలను కనుగొనండి: సమీపంలోని వాలంటీర్ల కోసం వెతకండి.\n2. హాస్పిటల్ ఇన్వెంటరీ: ఆసుపత్రులలో లైవ్ స్టాక్‌ను తనిఖీ చేయండి.\n3. ప్రసారాలు: సహాయం కోసం అత్యవసర అభ్యర్థనలను పోస్ట్ చేయండి లేదా వీక్షించండి.' }
                    }} />
                }
            />

            <SectionContainer>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
                    {[
                        { id: 'donors', label: 'Find Donors', icon: UserPlus },
                        { id: 'inventory', label: 'Hospital Inventory', icon: Search },
                        { id: 'broadcasts', label: 'Public Requests', icon: Megaphone }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab.id ? '#DC2626' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid #DC2626' : '2px solid transparent',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* 1. DONORS TAB */}
                {activeTab === 'donors' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                                <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
                                    <label className="form-label">Blood Group</label>
                                    <select className="form-control" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                                        <option value="">All Groups</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1, maxWidth: '400px' }}>
                                    <label className="form-label">Location</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input type="text" className="form-control" placeholder="Search city or area..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ paddingLeft: '38px' }} />
                                    </div>
                                </div>
                            </div>
                            {user && (
                                <ActionButton
                                    variant="primary"
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    style={{ background: '#DC2626', borderColor: '#DC2626' }}
                                >
                                    <UserPlus size={18} /> {isRegistering ? 'Cancel Registration' : 'Register as Donor'}
                                </ActionButton>
                            )}
                        </div>

                        {isRegistering && (
                            <DashboardCard style={{ marginBottom: '3rem', borderLeft: '5px solid #DC2626' }}>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Donor Registration Profile</h3>
                                <form onSubmit={handleRegister} className="grid-2" style={{ gap: '1.5rem' }}>
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Blood Group *</label>
                                            <select className="form-control" required value={formFields.blood_group} onChange={e => setFormFields({ ...formFields, blood_group: e.target.value })}>
                                                <option value="" disabled>Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Location *</label>
                                            <input type="text" className="form-control" required value={formFields.location} onChange={e => setFormFields({ ...formFields, location: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone *</label>
                                            <input type="tel" className="form-control" required value={formFields.phone} onChange={e => setFormFields({ ...formFields, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Available Until *</label>
                                            <input type="date" className="form-control" required min={new Date().toISOString().split('T')[0]} value={formFields.available_until} onChange={e => setFormFields({ ...formFields, available_until: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> Privacy & Visibility</h4>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}>
                                                <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={formFields.show_name} onChange={e => setFormFields({ ...formFields, show_name: e.target.checked })} />
                                                <span style={{ fontSize: '0.95rem' }}>Show my name publicly</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                                <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={formFields.contact_visible} onChange={e => setFormFields({ ...formFields, contact_visible: e.target.checked })} />
                                                <span style={{ fontSize: '0.95rem' }}>Show my phone number</span>
                                            </label>
                                        </div>
                                        <ActionButton type="submit" variant="primary" style={{ width: '100%', background: '#DC2626', borderColor: '#DC2626' }} disabled={formStatus.loading}>
                                            {formStatus.loading ? 'Saving...' : 'Save Registration'}
                                        </ActionButton>
                                        {formStatus.error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>{formStatus.error}</p>}
                                        {formStatus.success && <p style={{ color: '#059669', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>{formStatus.success}</p>}
                                    </div>
                                </form>
                            </DashboardCard>
                        )}

                        {donorsLoading ? (
                            <div className="dashboard-loading"><div className="loading-spinner"></div></div>
                        ) : filteredDonors.length === 0 ? (
                            <DashboardCard style={{ padding: '3rem', textAlign: 'center' }}>
                                <h3 style={{ color: 'var(--text-muted)' }}>No Donors Available</h3>
                                <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters or location.</p>
                            </DashboardCard>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {filteredDonors.map(donor => (
                                    <DashboardCard key={donor.id} style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{donor.blood_group}</div>
                                            <div>
                                                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{donor.show_name ? donor.name : 'Anonymous Donor'}</h3>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <MapPin size={14} /> {donor.location}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                            {donor.contact_visible ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 600 }}>
                                                    <Phone size={16} /> {donor.phone}
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Shield size={16} /> Contact details hidden
                                                </div>
                                            )}
                                        </div>
                                        <ActionButton
                                            variant="outline"
                                            style={{ width: '100%', borderColor: '#DC2626', color: '#DC2626' }}
                                            onClick={() => setRequestModal(donor)}
                                        >
                                            Request Blood
                                        </ActionButton>
                                    </DashboardCard>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* 2. INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <DashboardCard style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Search size={22} color="#DC2626" /> Hospital Blood Inventory
                            </h2>
                            <form onSubmit={handleInventorySearch}>
                                <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group</label>
                                        <select className="form-control" required value={invGroup} onChange={e => setInvGroup(e.target.value)}>
                                            <option value="" disabled>Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input type="text" className="form-control" required placeholder="e.g. Mumbai" value={invCity} onChange={e => setInvCity(e.target.value)} />
                                    </div>
                                </div>
                                <ActionButton
                                    variant="primary"
                                    type="submit"
                                    style={{ width: '100%', background: '#DC2626', borderColor: '#DC2626' }}
                                    disabled={invLoading}
                                >
                                    {invLoading ? 'Searching...' : 'Check Availability'}
                                </ActionButton>
                            </form>
                        </DashboardCard>

                        {invError && <div className="auth-error">{invError}</div>}
                        {invResults && (
                            <DashboardCard>
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Available Units</h3>
                                </div>
                                {invResults.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No units found in this city matching your selection.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {invResults.map(res => (
                                            <div key={res.id} style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                                                <div>
                                                    <strong>{res.hospital_name}</strong>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        {res.city} • Updated {new Date(res.updated_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {res.units} Units
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashboardCard>
                        )}
                    </div>
                )}

                {/* 3. BROADCASTS TAB */}
                {activeTab === 'broadcasts' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Megaphone size={22} color="#DC2626" /> Active Public Requests
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Urgent requirements across the network.</p>
                            </div>
                            <ActionButton variant="primary" style={{ background: '#DC2626', borderColor: '#DC2626' }} onClick={() => setBroadcastModal(true)}>
                                Post Broadcast
                            </ActionButton>
                        </div>

                        {broadcastsLoading ? (
                            <div className="dashboard-loading"><div className="loading-spinner"></div></div>
                        ) : broadcasts.length === 0 ? (
                            <DashboardCard style={{ padding: '3rem', textAlign: 'center' }}>
                                <h3 style={{ color: 'var(--text-muted)' }}>No Active Broadcasts</h3>
                                <p style={{ fontSize: '0.9rem' }}>There are currently no urgent blood requests.</p>
                            </DashboardCard>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {broadcasts.map(req => (
                                    <DashboardCard key={req.id} style={{ padding: '1.5rem', borderLeft: '5px solid #DC2626' }}>
                                        <h4 style={{ marginBottom: '1.25rem', lineHeight: '1.5', fontSize: '1.05rem', fontWeight: 600 }}>{req.message}</h4>
                                        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Patient: {req.patient_name}</div>
                                            <div style={{ color: '#059669', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Phone size={16} /> {req.patient_phone}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Search size={12} /> Posted: {new Date(req.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    </DashboardCard>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </SectionContainer>

            {/* MODALS */}
            {requestModal && (
                <div className="modal-overlay" onClick={() => !reqLoading && setRequestModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setRequestModal(null)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Request Blood Connection</h2>
                            <p className="modal-subtitle">Send a request to {requestModal.name || 'this donor'}</p>
                        </div>
                        {reqSuccess ? <div className="auth-success" style={{ margin: '1rem 0' }}>{reqSuccess}</div> : (
                            <form onSubmit={handleRequestSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Your Name</label>
                                    <input type="text" className="form-control" required value={reqFields.patient_name} onChange={e => setReqFields({ ...reqFields, patient_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Your Phone</label>
                                    <input type="tel" className="form-control" required value={reqFields.patient_phone} onChange={e => setReqFields({ ...reqFields, patient_phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea className="form-control" rows={3} required placeholder="Detailed location and urgency..." value={reqFields.message} onChange={e => setReqFields({ ...reqFields, message: e.target.value })} />
                                </div>
                                <ActionButton type="submit" variant="primary" style={{ width: '100%', background: '#DC2626', borderColor: '#DC2626' }} disabled={reqLoading}>
                                    {reqLoading ? 'Sending...' : 'Send Request'}
                                </ActionButton>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {broadcastModal && (
                <div className="modal-overlay" onClick={() => !reqLoading && setBroadcastModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setBroadcastModal(false)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Broadcast Urgent Request</h2>
                            <p className="modal-subtitle">This will be visible to all users in the network.</p>
                        </div>
                        {reqSuccess ? <div className="auth-success" style={{ margin: '1rem 0' }}>{reqSuccess}</div> : (
                            <form onSubmit={handleBroadcastSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Blood Group *</label>
                                        <select className="form-control" required value={broadcastFields.blood_group} onChange={e => setBroadcastFields({ ...broadcastFields, blood_group: e.target.value })}>
                                            <option value="" disabled>Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Location *</label>
                                        <input type="text" className="form-control" required placeholder="City/Hospital" value={broadcastFields.location} onChange={e => setBroadcastFields({ ...broadcastFields, location: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Patient Name *</label>
                                    <input type="text" className="form-control" required value={broadcastFields.patient_name} onChange={e => setBroadcastFields({ ...broadcastFields, patient_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone *</label>
                                    <input type="tel" className="form-control" required value={broadcastFields.patient_phone} onChange={e => setBroadcastFields({ ...broadcastFields, patient_phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Urgency Message *</label>
                                    <textarea className="form-control" rows={3} required placeholder="Units required, hospital details, contact person..." value={broadcastFields.message} onChange={e => setBroadcastFields({ ...broadcastFields, message: e.target.value })} />
                                </div>
                                <ActionButton type="submit" variant="primary" style={{ width: '100%', background: '#DC2626', borderColor: '#DC2626' }} disabled={reqLoading}>
                                    {reqLoading ? 'Broadcasting...' : 'Broadcast Request'}
                                </ActionButton>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
