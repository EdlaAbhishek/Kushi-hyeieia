import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Stethoscope, CheckCircle, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import InfoButton from '../components/ui/InfoButton'

export default function ApplyDoctor() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        full_name: user?.user_metadata?.full_name || '',
        specialization: '',
        experience_years: '',
        license_number: '',
        hospital_affiliation: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (!user) throw new Error("You must be logged in to apply.")

            const { error: insertError } = await supabase
                .from('doctor_applications')
                .insert({
                    user_id: user.id,
                    full_name: formData.full_name,
                    specialization: formData.specialization,
                    experience_years: parseInt(formData.experience_years),
                    license_number: formData.license_number,
                    hospital_affiliation: formData.hospital_affiliation
                })

            if (insertError) throw insertError

            setSuccess(true)
        } catch (err) {
            console.error("Application error:", err)
            setError(err.message || 'Failed to submit application. Make sure the doctor_applications table exists in Supabase.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
                <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '1rem' }}>Application Submitted</h2>
                <p style={{ color: '#64748B', lineHeight: 1.6 }}>
                    Thank you for applying to join the Kushi Hygieia medical network.
                    Our administration team will review your credentials and medical license number shortly.
                    Once approved, your account role will be automatically upgraded to Doctor.
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1E293B' }}>Apply for Doctor Role</h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Submit your credentials for verification to access the medical dashboard.</p>
                    </div>
                </div>
                <InfoButton content={{
                    en: { title: 'Doctor Verification', helps: 'This process guards the platform to ensure only certified medical professionals can interact with patients as clinical experts.', usage: 'Enter your name exactly as it appears on your medical license. Provide your specialization, years of experience, and registration number. An administrator will review your credentials within 24-48 hours.' },
                    hi: { title: 'डॉक्टर सत्यापन', helps: 'यह प्रक्रिया प्लेटफ़ॉर्म की सुरक्षा करती है ताकि यह सुनिश्चित हो सके कि केवल प्रमाणित चिकित्सा पेशेवर ही रोगियों के साथ विशेषज्ञ के रूप में बातचीत कर सकें।', usage: 'अपना नाम ठीक वैसे ही दर्ज करें जैसा यह आपके मेडिकल लाइसेंस पर दिखाई देता है। अपनी विशेषज्ञता, अनुभव के वर्ष और पंजीकरण संख्या प्रदान करें। 24-48 घंटों के भीतर एक प्रशासक आपकी साख की समीक्षा करेगा।' },
                    te: { title: 'డాక్టర్ ధృవీకరణ', helps: 'ధృవీకరించబడిన వైద్య నిపుణులు మాత్రమే క్లినికల్ నిపుణులుగా రోగులతో ఇంటరాక్ట్ అయ్యేలా ఈ ప్రక్రియ ప్లాట్‌ఫారమ్‌ను రక్షిస్తుంది.', usage: 'మీ వైద్య లైసెన్స్‌లో ఉన్న విధంగానే మీ పేరును నమోదు చేయండి. మీ స్పెషలైజేషన్, అనుభవ సంవత్సరాలు మరియు రిజిస్ట్రేషన్ నంబర్‌ను అందించండి. 24-48 గంటల్లో నిర్వాహకుడు మీ ఆధారాలను సమీక్షిస్తారు.' }
                }} />
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {error && (
                    <div className="auth-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong>Application Failed</strong>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name exactly as on Medical License *</label>
                        <input type="text" className="form-control" name="full_name" required value={formData.full_name} onChange={handleChange} placeholder="Dr. John Doe" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Specialization *</label>
                            <input type="text" className="form-control" name="specialization" required value={formData.specialization} onChange={handleChange} placeholder="e.g. Cardiology" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Years of Experience *</label>
                            <input type="number" className="form-control" name="experience_years" required min="0" value={formData.experience_years} onChange={handleChange} placeholder="e.g. 5" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Medical Registration / License No. *</label>
                        <input type="text" className="form-control" name="license_number" required value={formData.license_number} onChange={handleChange} placeholder="e.g. MCI-12345" />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Primary Hospital Affiliation</label>
                        <input type="text" className="form-control" name="hospital_affiliation" value={formData.hospital_affiliation} onChange={handleChange} placeholder="e.g. Apollo Hospitals (Optional)" />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
                        {loading ? 'Submitting...' : 'Submit Credentials for Review'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
                    By submitting this form, you consent to our verification procedure. False applications may lead to permanent account suspension.
                </div>
            </div>
        </motion.div>
    )
}
