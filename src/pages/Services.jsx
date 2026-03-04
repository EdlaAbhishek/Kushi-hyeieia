import { useState, useRef, useEffect } from 'react'
import { Droplet, MapPin, ScanLine, Upload, FileImage, X, Calendar, Phone, Shield, UserPlus, CheckCircle } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../services/supabase'
import { useAuth } from '../services/AuthContext'

export default function Services() {
    const { user } = useAuth()

    // ---- Blood Finder State ----
    const [bloodGroup, setBloodGroup] = useState('')
    const [city, setCity] = useState('')
    const [bloodLoading, setBloodLoading] = useState(false)
    const [bloodResults, setBloodResults] = useState(null)
    const [bloodError, setBloodError] = useState(null)

    const handleBloodSearch = async (e) => {
        e.preventDefault()
        setBloodLoading(true)
        setBloodResults(null)
        setBloodError(null)

        try {
            const { data, error } = await supabase
                .from('blood_inventory')
                .select('*')
                .eq('blood_group', bloodGroup)
                .ilike('city', `%${city}%`)
                .order('units', { ascending: false })

            if (error) throw error
            setBloodResults(data || [])
        } catch (err) {
            console.error('Blood search error:', err)
            setBloodError(err.message)
        } finally {
            setBloodLoading(false)
        }
    }

    // ---- Prescription Scanner State ----
    const [rxImage, setRxImage] = useState(null)
    const [rxPreview, setRxPreview] = useState(null)
    const [rxLoading, setRxLoading] = useState(false)
    const [rxResult, setRxResult] = useState('')
    const [rxError, setRxError] = useState('')
    const fileInputRef = useRef(null)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setRxError('')
        setRxResult('')

        if (!file.type.startsWith('image/')) {
            setRxError('Please upload an image file (JPG, PNG, etc.)')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setRxError('Image must be under 10 MB.')
            return
        }

        setRxImage(file)
        const reader = new FileReader()
        reader.onload = () => setRxPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const clearImage = () => {
        setRxImage(null)
        setRxPreview(null)
        setRxResult('')
        setRxError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleScanPrescription = async () => {
        if (!rxImage) return

        setRxLoading(true)
        setRxResult('')
        setRxError('')

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY
            if (!apiKey) throw new Error("Gemini API key is not configured.")

            const base64 = rxPreview.split(',')[1]
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

            const prompt = `You are a prescription analysis assistant. Analyze this prescription image and extract the following for each medicine listed:

1. **Medicine Name**
2. **Dosage** (e.g. 500mg)
3. **Frequency** (e.g. twice daily)
4. **Duration** (e.g. 5 days)
5. **Purpose / What it treats** (brief, 1 line)

Format each medicine as a numbered list. If you cannot read part of the prescription, say so clearly.
End with: "*Disclaimer: This is an AI analysis. Always verify with your prescribing doctor or pharmacist.*"`

            const imagePart = {
                inlineData: { data: base64, mimeType: rxImage.type }
            }

            const result = await model.generateContent([prompt, imagePart])
            setRxResult(result.response.text())
        } catch (err) {
            console.error(err)
            setRxError(err.message || 'Failed to analyze prescription.')
        } finally {
            setRxLoading(false)
        }
    }

    // ---- Blood Donation State ----
    const [donors, setDonors] = useState([])
    const [donorsLoading, setDonorsLoading] = useState(true)
    const [isRegistering, setIsRegistering] = useState(false)
    const [filterGroup, setFilterGroup] = useState('')
    const [filterLocation, setFilterLocation] = useState('')
    const [donorForm, setDonorForm] = useState({ blood_group: '', location: '', phone: '', show_name: true, contact_visible: false, available_until: '' })
    const [donorStatus, setDonorStatus] = useState({ loading: false, error: null, success: null })
    const [requestModal, setRequestModal] = useState(null)
    const [reqFields, setReqFields] = useState({ patient_name: '', patient_phone: '', message: '' })
    const [reqLoading, setReqLoading] = useState(false)
    const [reqError, setReqError] = useState(null)
    const [reqSuccess, setReqSuccess] = useState(null)

    const [broadcastRequests, setBroadcastRequests] = useState([])
    const [activeTab, setActiveTab] = useState('donors') // 'donors' or 'requests'
    const [broadcastModal, setBroadcastModal] = useState(false)
    const [broadcastFields, setBroadcastFields] = useState({ patient_name: '', patient_phone: '', blood_group: '', location: '', message: '' })

    useEffect(() => {
        fetchDonors()
        fetchBroadcasts()
    }, [])

    const fetchBroadcasts = async () => {
        try {
            const { data } = await supabase.from('blood_requests').select('*').is('donor_id', null).order('created_at', { ascending: false }).limit(20)
            setBroadcastRequests(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const fetchDonors = async () => {
        setDonorsLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase.from('blood_donors').select('*').gte('available_until', today).order('created_at', { ascending: false })
            setDonors(data || [])
        } catch (e) { setDonors([]) } finally { setDonorsLoading(false) }
    }

    const handleDonorRegister = async (e) => {
        e.preventDefault()
        if (!user) { setDonorStatus({ loading: false, error: 'You must be logged in to register.', success: null }); return }
        setDonorStatus({ loading: true, error: null, success: null })
        try {
            const { error } = await supabase.from('blood_donors').upsert({
                user_id: user.id, name: user.user_metadata?.full_name || user.email,
                blood_group: donorForm.blood_group, location: donorForm.location, phone: donorForm.phone,
                show_name: donorForm.show_name, contact_visible: donorForm.contact_visible, available_until: donorForm.available_until
            }, { onConflict: 'user_id' })
            if (error) throw error
            setDonorStatus({ loading: false, error: null, success: 'Registered as donor successfully!' })
            setIsRegistering(false)
            fetchDonors()
        } catch (err) { setDonorStatus({ loading: false, error: err.message, success: null }) }
    }

    const handleRequestSubmit = async (e) => {
        e.preventDefault()
        setReqLoading(true); setReqError(null); setReqSuccess(null)
        try {
            const { error } = await supabase.from('blood_requests').insert({ donor_id: requestModal.id, patient_name: reqFields.patient_name, patient_phone: reqFields.patient_phone, message: reqFields.message, status: 'pending' })
            if (error) throw error
            setReqSuccess('Request sent!')
            setTimeout(() => { setRequestModal(null); setReqSuccess(null); setReqFields({ patient_name: '', patient_phone: '', message: '' }) }, 2000)
        } catch (err) { setReqError(err.message) } finally { setReqLoading(false) }
    }

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault()
        setReqLoading(true); setReqError(null); setReqSuccess(null)
        try {
            const msg = `[URGENT: ${broadcastFields.blood_group} at ${broadcastFields.location}] ${broadcastFields.message}`
            const { error } = await supabase.from('blood_requests').insert({
                donor_id: null,
                patient_name: broadcastFields.patient_name,
                patient_phone: broadcastFields.patient_phone,
                message: msg,
                status: 'pending'
            })
            if (error) throw error
            setReqSuccess('Broadcast sent successfully!')
            setTimeout(() => {
                setBroadcastModal(false)
                setReqSuccess(null)
                setBroadcastFields({ patient_name: '', patient_phone: '', blood_group: '', location: '', message: '' })
                fetchBroadcasts()
            }, 2000)
        } catch (err) { setReqError(err.message) } finally { setReqLoading(false) }
    }

    const filteredDonors = donors.filter(d => {
        if (filterGroup && d.blood_group !== filterGroup) return false
        if (filterLocation && !d.location.toLowerCase().includes(filterLocation.toLowerCase())) return false
        return true
    })

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Digital Healthcare Services</h1>
                    <p className="page-subtitle">Interactive tools to manage your emergency and everyday health needs.</p>
                </div>
            </section>

            <section className="section bg-surface">
                <div className="container">
                    <div className="grid-2" style={{ alignItems: 'normal' }}>

                        {/* --- BLOOD FINDER --- */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div className="card-icon" style={{ margin: 0, background: '#FEF2F2', color: '#DC2626' }}>
                                    <Droplet size={22} />
                                </div>
                                <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Live Blood Finder</h2>
                            </div>
                            <p className="card-text" style={{ marginBottom: '1.5rem' }}>
                                Locate available blood units at nearby hospitals and blood banks in real-time.
                            </p>

                            <form onSubmit={handleBloodSearch} style={{ marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select
                                        className="form-control"
                                        value={bloodGroup}
                                        onChange={e => setBloodGroup(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City or Area</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Mumbai, Andheri"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            style={{ paddingLeft: '38px' }}
                                            required
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%' }} disabled={bloodLoading}>
                                    {bloodLoading ? 'Searching inventory...' : 'Search Availability'}
                                </button>
                            </form>

                            <div style={{ flex: 1 }}>
                                {bloodError && (
                                    <div className="auth-error" style={{ marginBottom: '1rem' }}>{bloodError}</div>
                                )}
                                {bloodResults && (
                                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-dark)', fontSize: '0.95rem' }}>Available at {bloodResults.length} locations</h4>
                                        {bloodResults.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No blood inventory found for this group in this area.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {bloodResults.map(res => (
                                                    <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                        <div>
                                                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{res.hospital_name}</strong>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.distance || 'Nearby'} • Updated {res.last_updated || 'recently'}</span>
                                                        </div>
                                                        <div style={{ textAlign: 'center', background: '#FEF2F2', color: '#DC2626', padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            {res.units} Units
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- PRESCRIPTION SCANNER --- */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div className="card-icon" style={{ margin: 0, background: '#EFF6FF', color: 'var(--primary)' }}>
                                    <ScanLine size={22} />
                                </div>
                                <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Prescription Scanner</h2>
                            </div>
                            <p className="card-text" style={{ marginBottom: '1.5rem' }}>
                                Upload a photo of your prescription and our AI will identify each medicine, its dosage, and what it's used for.
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            {!rxPreview && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: '12px',
                                        padding: '3rem 2rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#FAFBFC',
                                        transition: 'border-color 0.2s',
                                        marginBottom: '1rem'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                                    <p style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                                        Click to upload prescription
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        JPG, PNG up to 10 MB
                                    </p>
                                </div>
                            )}

                            {rxPreview && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                        <img
                                            src={rxPreview}
                                            alt="Prescription preview"
                                            style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        />
                                        <button
                                            onClick={clearImage}
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                border: 'none', borderRadius: '50%',
                                                width: '28px', height: '28px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <FileImage size={14} />
                                        <span>{rxImage?.name}</span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '0.75rem' }}
                                        onClick={handleScanPrescription}
                                        disabled={rxLoading}
                                    >
                                        {rxLoading ? 'Analyzing prescription...' : 'Scan & Identify Medicines'}
                                    </button>
                                </div>
                            )}

                            {rxError && (
                                <div className="auth-error" style={{ marginBottom: '1rem' }}>{rxError}</div>
                            )}

                            <div style={{ flex: 1 }}>
                                {rxResult && (
                                    <div style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <ScanLine size={16} />
                                            <span>Prescription Analysis</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                            {rxResult}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ─── BLOOD DONATION NETWORK ─── */}
            <section className="section">
                <div className="container">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#DC2626' }}>🩸</span> Blood Donation Network
                            </h2>
                            <p className="section-subtitle">Find donors, broadcast urgent requests, or register to help others.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-outline" style={{ borderColor: '#DC2626', color: '#DC2626' }} onClick={() => setBroadcastModal(true)}>
                                📢 Broadcast Request
                            </button>
                            {user && (
                                <button className="btn btn-primary" onClick={() => setIsRegistering(!isRegistering)} style={{ background: '#DC2626' }}>
                                    <UserPlus size={16} /> {isRegistering ? 'Cancel' : 'Register as Donor'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                        <button
                            className={`btn ${activeTab === 'donors' ? 'btn-primary' : 'btn-outline'}`}
                            style={activeTab === 'donors' ? { background: '#DC2626', borderColor: '#DC2626', borderRadius: '8px 8px 0 0' } : { border: 'none', color: 'var(--text-muted)' }}
                            onClick={() => setActiveTab('donors')}
                        >
                            Find Donors
                        </button>
                        <button
                            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
                            style={activeTab === 'requests' ? { background: '#DC2626', borderColor: '#DC2626', borderRadius: '8px 8px 0 0' } : { border: 'none', color: 'var(--text-muted)' }}
                            onClick={() => setActiveTab('requests')}
                        >
                            Public Requests ({broadcastRequests.length})
                        </button>
                    </div>

                    {/* Registration Form */}
                    {isRegistering && (
                        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #DC2626' }}>
                            <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-dark)' }}>Donor Registration</h3>
                            {donorStatus.error && <div className="auth-error">{donorStatus.error}</div>}
                            {donorStatus.success && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{donorStatus.success}</div>}
                            <form onSubmit={handleDonorRegister}>
                                <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Blood Group *</label>
                                        <select className="form-control" required value={donorForm.blood_group} onChange={e => setDonorForm({ ...donorForm, blood_group: e.target.value })}>
                                            <option value="" disabled>Select Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Location *</label>
                                        <input type="text" className="form-control" required placeholder="City / Area" value={donorForm.location} onChange={e => setDonorForm({ ...donorForm, location: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Phone *</label>
                                        <input type="tel" className="form-control" required placeholder="+91 XXXXX XXXXX" value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Available Until *</label>
                                        <input type="date" className="form-control" required min={new Date().toISOString().split('T')[0]} value={donorForm.available_until} onChange={e => setDonorForm({ ...donorForm, available_until: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                                        <input type="checkbox" checked={donorForm.show_name} onChange={e => setDonorForm({ ...donorForm, show_name: e.target.checked })} />
                                        Show my name publicly
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                                        <input type="checkbox" checked={donorForm.contact_visible} onChange={e => setDonorForm({ ...donorForm, contact_visible: e.target.checked })} />
                                        Show my phone number
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ background: '#DC2626' }} disabled={donorStatus.loading}>
                                    {donorStatus.loading ? 'Saving...' : 'Save Registration'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'donors' && (
                        <>
                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
                                    <label className="form-label">Filter by Group</label>
                                    <select className="form-control" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                                        <option value="">All Groups</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px', maxWidth: '360px' }}>
                                    <label className="form-label">Filter by Location</label>
                                    <input type="text" className="form-control" placeholder="Search city or area..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
                                </div>
                            </div>

                            {/* Donor List */}
                            {donorsLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading donors...</div>
                            ) : filteredDonors.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩸</p>
                                    <p>No active donors found for your criteria.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                                    {filteredDonors.map(donor => (
                                        <div key={donor.id} className="card" style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                                                    {donor.blood_group}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                                                        {donor.show_name ? donor.name : 'Anonymous Donor'}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <MapPin size={11} /> {donor.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={12} /> Available until {new Date(donor.available_until).toLocaleDateString()}
                                                </span>
                                                {donor.contact_visible ? (
                                                    <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={12} /> {donor.phone}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={12} /> Contact hidden</span>
                                                )}
                                            </div>
                                            {donor.user_id === user?.id ? (
                                                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#059669', fontWeight: 600, padding: '0.5rem', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                                                    ✓ Your Registration
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline" style={{ width: '100%', borderColor: '#DC2626', color: '#DC2626', fontSize: '0.82rem' }} onClick={() => setRequestModal(donor)}>
                                                    Request Blood
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <div>
                            {broadcastRequests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📢</p>
                                    <p>No active public blood requests right now.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
                                    {broadcastRequests.map(req => (
                                        <div key={req.id} className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #DC2626' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                <div style={{ fontSize: '1.5rem' }}>📢</div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.4' }}>{req.message}</h4>
                                                    <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Patient: {req.patient_name}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                                                            <Phone size={14} /> {req.patient_phone}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                                        Posted: {new Date(req.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <h2 className="modal-title">Request Blood</h2>
                            <p className="modal-subtitle">From: {requestModal.show_name ? requestModal.name : 'Anonymous Donor'} ({requestModal.blood_group})</p>
                        </div>
                        {reqSuccess ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#166534' }}>
                                <CheckCircle size={36} style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontWeight: 600 }}>{reqSuccess}</div>
                            </div>
                        ) : (
                            <form onSubmit={handleRequestSubmit}>
                                {reqError && <div className="auth-error">{reqError}</div>}
                                <div className="form-group"><label className="form-label">Your Name *</label><input type="text" className="form-control" required value={reqFields.patient_name} onChange={e => setReqFields({ ...reqFields, patient_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Your Phone *</label><input type="tel" className="form-control" required value={reqFields.patient_phone} onChange={e => setReqFields({ ...reqFields, patient_phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Message *</label><textarea className="form-control" rows={3} required placeholder="Hospital, patient condition, urgency..." value={reqFields.message} onChange={e => setReqFields({ ...reqFields, message: e.target.value })} style={{ resize: 'vertical' }} /></div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#DC2626' }} disabled={reqLoading}>{reqLoading ? 'Sending...' : 'Send Request'}</button>
                                    <button type="button" className="btn btn-outline" onClick={() => setRequestModal(null)} disabled={reqLoading}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {/* Broadcast Modal */}
            {broadcastModal && (
                <div className="modal-overlay" onClick={() => !reqLoading && setBroadcastModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => !reqLoading && setBroadcastModal(false)}>&times;</button>
                        <div className="modal-header">
                            <h2 className="modal-title">Broadcast Urgent Request</h2>
                            <p className="modal-subtitle">Post a public request for all donors to see.</p>
                        </div>
                        {reqSuccess ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#166534' }}>
                                <CheckCircle size={36} style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontWeight: 600 }}>{reqSuccess}</div>
                            </div>
                        ) : (
                            <form onSubmit={handleBroadcastSubmit}>
                                {reqError && <div className="auth-error">{reqError}</div>}
                                <div className="grid-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Required Blood Group *</label><select className="form-control" required value={broadcastFields.blood_group} onChange={e => setBroadcastFields({ ...broadcastFields, blood_group: e.target.value })}><option value="" disabled>Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Location (City/Hospital) *</label><input type="text" className="form-control" required value={broadcastFields.location} onChange={e => setBroadcastFields({ ...broadcastFields, location: e.target.value })} /></div>
                                </div>
                                <div className="grid-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Patient Name *</label><input type="text" className="form-control" required value={broadcastFields.patient_name} onChange={e => setBroadcastFields({ ...broadcastFields, patient_name: e.target.value })} /></div>
                                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Contact Phone *</label><input type="tel" className="form-control" required value={broadcastFields.patient_phone} onChange={e => setBroadcastFields({ ...broadcastFields, patient_phone: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Urgency & Message *</label><textarea className="form-control" rows={3} required placeholder="State urgency, patient condition..." value={broadcastFields.message} onChange={e => setBroadcastFields({ ...broadcastFields, message: e.target.value })} style={{ resize: 'vertical' }} /></div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#DC2626' }} disabled={reqLoading}>{reqLoading ? 'Broadcasting...' : 'Broadcast Request'}</button>
                                    <button type="button" className="btn btn-outline" onClick={() => setBroadcastModal(false)} disabled={reqLoading}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
