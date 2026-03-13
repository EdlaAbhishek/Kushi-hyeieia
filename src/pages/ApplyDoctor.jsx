import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Stethoscope, CheckCircle, AlertTriangle, Building2, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import InfoTooltip from '../components/ui/InfoTooltip'
import ActionButton from '../components/ui/ActionButton'

const SPECIALTIES = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Gynecology', 'General Medicine',
    'Pediatrics', 'Oncology', 'Gastroenterology', 'Dermatology', 'ENT',
    'Pulmonology', 'Nephrology', 'Urology', 'Psychiatry', 'Ophthalmology',
    'Endocrinology', 'Rheumatology', 'Radiology', 'Anesthesiology', 'Other'
]

const TIME_SLOTS = [
    '08:00 AM – 12:00 PM',
    '09:00 AM – 01:00 PM',
    '10:00 AM – 02:00 PM',
    '02:00 PM – 06:00 PM',
    '04:00 PM – 08:00 PM',
    '06:00 PM – 10:00 PM',
    'Custom / Flexible'
]

export default function ApplyDoctor() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const [hospitals, setHospitals] = useState([])
    const [practiceType, setPracticeType] = useState('hospital') // hospital | clinic | both

    const [formData, setFormData] = useState({
        full_name: user?.user_metadata?.full_name || '',
        specialization: '',
        experience_years: '',
        license_number: '',
        hospital_affiliation: '',
        clinic_name: '',
        clinic_address: '',
        consultation_fee: '',
        available_days: [],
        available_timings: '',
        qualification: '',
        bio: ''
    })

    // Fetch hospitals for dropdown
    useEffect(() => {
        async function fetchHospitals() {
            try {
                const { data } = await supabase.from('hospitals').select('id, name, city')
                if (data && data.length > 0) {
                    setHospitals(data)
                }
            } catch (err) {
                console.warn('Could not fetch hospitals:', err.message)
            }
        }
        fetchHospitals()
    }, [])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            available_days: prev.available_days.includes(day)
                ? prev.available_days.filter(d => d !== day)
                : [...prev.available_days, day]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        // Validate
        if (!formData.full_name || !formData.specialization || !formData.license_number) {
            setError('Please fill all required fields.')
            setLoading(false)
            return
        }

        if (practiceType !== 'clinic' && !formData.hospital_affiliation) {
            setError('Please select a hospital affiliation.')
            setLoading(false)
            return
        }

        if (practiceType !== 'hospital' && (!formData.clinic_name || !formData.clinic_address)) {
            setError('Please provide your clinic name and address.')
            setLoading(false)
            return
        }

        try {
            if (!user) throw new Error("You must be logged in to apply.")

            const { error: insertError } = await supabase
                .from('doctor_applications')
                .insert({
                    user_id: user.id,
                    full_name: formData.full_name,
                    specialization: formData.specialization,
                    experience_years: parseInt(formData.experience_years) || 0,
                    license_number: formData.license_number,
                    hospital_affiliation: formData.hospital_affiliation,
                    clinic_name: formData.clinic_name || null,
                    clinic_address: formData.clinic_address || null,
                    consultation_fee: formData.consultation_fee ? parseInt(formData.consultation_fee) : null,
                    available_days: formData.available_days.length > 0 ? formData.available_days.join(', ') : null,
                    available_timings: formData.available_timings || null,
                    qualification: formData.qualification || null,
                    bio: formData.bio || null,
                    practice_type: practiceType
                })

            if (insertError) throw insertError

            setSuccess(true)
        } catch (err) {
            console.error("Application error:", err)
            setError(err.message || 'Failed to submit application.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 640, margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
                <CheckCircle size={56} color="#10B981" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '1rem' }}>Application Submitted Successfully</h2>
                <p style={{ color: '#64748B', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    Thank you for applying to join the Khushi Hygieia medical network.
                    Our AI-powered verification system will review your credentials and medical license.
                    Once approved, your profile will appear under your affiliated hospital automatically.
                </p>
                <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '1rem 1.25rem',
                    fontSize: '0.9rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}>
                    🤖 AI Verification typically completes within minutes
                </div>
            </motion.div>
        )
    }

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 680, margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1E293B' }}>Become a Doctor</h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Submit your medical credentials to join our verified doctor network.</p>
                    </div>
                </div>
                <InfoTooltip content={{
                    en: { title: 'Doctor Registration', helps: 'Register as a verified medical professional on the platform.', usage: 'Fill in your medical details, hospital/clinic information, and available timings. AI will verify your credentials for quick approval.' },
                    hi: { title: 'डॉक्टर पंजीकरण', helps: 'प्लेटफ़ॉर्म पर सत्यापित चिकित्सा पेशेवर के रूप में पंजीकरण करें।', usage: 'अपने चिकित्सा विवरण, अस्पताल/क्लिनिक की जानकारी और उपलब्ध समय भरें।' },
                    te: { title: 'డాక్టర్ నమోదు', helps: 'ప్లాట్‌ఫారమ్‌లో ధృవీకరించబడిన వైద్య నిపుణుడిగా నమోదు చేయండి.', usage: 'మీ వైద్య వివరాలు, ఆసుపత్రి/క్లినిక్ సమాచారం మరియు అందుబాటులో ఉన్న సమయాలను నమోదు చేయండి.' }
                }} />
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {error && (
                    <div className="auth-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong>Error</strong>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* ── Section 1: Personal & Medical Info ── */}
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Stethoscope size={18} color="var(--primary)" /> Personal & Medical Details
                        </h3>
                        
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Full Name (as on Medical License) *</label>
                            <input type="text" className="form-control" name="full_name" required value={formData.full_name} onChange={handleChange} placeholder="Dr. Full Name" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Department / Specialty *</label>
                                <select className="form-control" name="specialization" required value={formData.specialization} onChange={handleChange}>
                                    <option value="">Select Specialty</option>
                                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Qualification</label>
                                <input type="text" className="form-control" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. MBBS, MD, MS" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Years of Experience *</label>
                                <input type="number" className="form-control" name="experience_years" required min="0" max="60" value={formData.experience_years} onChange={handleChange} placeholder="e.g. 5" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Medical License No. *</label>
                                <input type="text" className="form-control" name="license_number" required value={formData.license_number} onChange={handleChange} placeholder="e.g. MCI-12345" />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Practice Type ── */}
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={18} color="var(--primary)" /> Where Do You Practice? *
                        </h3>

                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {[
                                { id: 'hospital', label: '🏥 Hospital', desc: 'I work at a hospital' },
                                { id: 'clinic', label: '🏨 Own Clinic', desc: 'I have my own clinic' },
                                { id: 'both', label: '🏥+🏨 Both', desc: 'Hospital + own clinic' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setPracticeType(opt.id)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: 12,
                                        border: practiceType === opt.id ? '2px solid var(--primary)' : '1.5px solid #E2E8F0',
                                        background: practiceType === opt.id ? '#EFF6FF' : '#fff',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{opt.label.split(' ')[0]}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: practiceType === opt.id ? 'var(--primary)' : '#1E293B' }}>
                                        {opt.label.split(' ').slice(1).join(' ')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>{opt.desc}</div>
                                </button>
                            ))}
                        </div>

                        {/* Hospital Selection */}
                        {(practiceType === 'hospital' || practiceType === 'both') && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Hospital Affiliation *</label>
                                {hospitals.length > 0 ? (
                                    <select className="form-control" name="hospital_affiliation" value={formData.hospital_affiliation} onChange={handleChange} required={practiceType !== 'clinic'}>
                                        <option value="">Select Hospital</option>
                                        {hospitals.map(h => (
                                            <option key={h.id} value={h.name}>{h.name} — {h.city}</option>
                                        ))}
                                        <option value="__other">Other (not listed)</option>
                                    </select>
                                ) : (
                                    <input type="text" className="form-control" name="hospital_affiliation" value={formData.hospital_affiliation} onChange={handleChange} placeholder="e.g. Apollo Hospitals, Chennai" required={practiceType !== 'clinic'} />
                                )}
                                {formData.hospital_affiliation === '__other' && (
                                    <input type="text" className="form-control" name="hospital_affiliation" style={{ marginTop: '0.5rem' }} value="" onChange={handleChange} placeholder="Type hospital name..." />
                                )}
                            </div>
                        )}

                        {/* Clinic Details */}
                        {(practiceType === 'clinic' || practiceType === 'both') && (
                            <>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Clinic / Practice Name *</label>
                                    <input type="text" className="form-control" name="clinic_name" value={formData.clinic_name} onChange={handleChange} placeholder="e.g. Sunrise Medical Centre" required={practiceType !== 'hospital'} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">
                                        <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        Clinic Address *
                                    </label>
                                    <textarea className="form-control" name="clinic_address" value={formData.clinic_address} onChange={handleChange} placeholder="Full address of your clinic..." rows={2} style={{ minHeight: 'auto' }} required={practiceType !== 'hospital'} />
                                </div>
                            </>
                        )}

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Consultation Fee (₹)</label>
                            <input type="number" className="form-control" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} placeholder="e.g. 500" min="0" />
                        </div>
                    </div>

                    {/* ── Section 3: Availability ── */}
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="var(--primary)" /> Availability & Timings
                        </h3>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Available Days</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        style={{
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: 20,
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            border: formData.available_days.includes(day) ? '2px solid var(--primary)' : '1.5px solid #E2E8F0',
                                            background: formData.available_days.includes(day) ? 'var(--primary)' : '#fff',
                                            color: formData.available_days.includes(day) ? '#fff' : '#475569',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Consultation Timings</label>
                            <select className="form-control" name="available_timings" value={formData.available_timings} onChange={handleChange}>
                                <option value="">Select Time Slot</option>
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── Section 4: Short Bio ── */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Short Bio / About You</label>
                        <textarea
                            className="form-control"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Write a brief introduction about your practice, areas of expertise, and approach to patient care..."
                            rows={3}
                            style={{ minHeight: 'auto' }}
                        />
                    </div>

                    {/* AI Verification Notice */}
                    <div style={{
                        background: '#F0F9FF',
                        border: '1px solid #BAE6FD',
                        borderRadius: 12,
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>🤖</span>
                        <div>
                            <strong style={{ fontSize: '0.9rem', color: '#0369A1' }}>AI-Powered Verification</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#0C4A6E', lineHeight: 1.5 }}>
                                Your credentials will be verified by our AI system against the National Medical Commission registry.
                                Valid license numbers are typically approved within minutes.
                            </p>
                        </div>
                    </div>

                    <ActionButton
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Submitting Application...' : '🩺 Submit for AI Verification'}
                    </ActionButton>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center' }}>
                    By submitting, you consent to credential verification. False applications may lead to permanent account suspension.
                </div>
            </div>
        </motion.div>
    )
}
