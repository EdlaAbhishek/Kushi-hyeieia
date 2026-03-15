import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { AlertCircle, CheckCircle, Activity, Info, AlertTriangle, Stethoscope, Languages, Loader2, Phone, Calendar } from 'lucide-react'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'

export default function SymptomChecker() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        age: user?.user_metadata?.age || '',
        gender: user?.user_metadata?.gender || '',
        symptoms: '',
        temperature: '',
        bloodPressureSys: '',
        bloodPressureDia: '',
        heartRate: '',
        spo2: ''
    })

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [originalResult, setOriginalResult] = useState(null)
    const [error, setError] = useState('')
    const [language, setLanguage] = useState('en')
    const [translating, setTranslating] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // ─── TRANSLATION ──────────────────────────────────────────────────
    const translateResult = useCallback(async (resultData, lang) => {
        if (lang === 'en') {
            setResult(resultData)
            return
        }
        setTranslating(true)
        try {
            const response = await fetch('/api/translate-symptom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: resultData, targetLanguage: lang })
            })
            if (response.ok) {
                const translated = await response.json()
                setResult(translated)
            } else {
                toast.error('Translation failed. Showing results in English.', { position: 'bottom-center' })
                setResult(resultData)
            }
        } catch (err) {
            console.error('Translation error:', err)
            toast.error('Translation failed. Showing results in English.', { position: 'bottom-center' })
            setResult(resultData)
        } finally {
            setTranslating(false)
        }
    }, [])

    const handleLangChange = async (newLang) => {
        setLanguage(newLang)
        if (originalResult) {
            await translateResult(originalResult, newLang)
        }
    }

    // ─── ANALYZE SYMPTOMS ─────────────────────────────────────────────
    const analyzeSymptoms = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)
        setOriginalResult(null)
        setLoading(true)

        try {
            const response = await fetch('/api/gemini-symptom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    age: formData.age,
                    gender: formData.gender,
                    symptoms: formData.symptoms,
                    temperature: formData.temperature,
                    bloodPressureSys: formData.bloodPressureSys,
                    bloodPressureDia: formData.bloodPressureDia,
                    heartRate: formData.heartRate,
                    spo2: formData.spo2,
                    language
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Server error: ${response.status}`)
            }

            const jsonResult = await response.json()

            if (!jsonResult.triage || !jsonResult.confidenceScore) {
                throw new Error('Invalid response schema from AI.')
            }

            setOriginalResult(jsonResult)
            setResult(jsonResult)

        } catch (err) {
            console.error('AI Triage Error:', err)
            let friendlyMsg = err.message
            if (err.message?.includes('429') || err.message?.includes('Too Many') || err.message?.includes('temporarily busy')) {
                friendlyMsg = 'The AI service is temporarily busy due to high demand. Please wait a few seconds and try again.'
            }
            setError(friendlyMsg)
        } finally {
            setLoading(false)
        }
    }

    // ─── EMERGENCY BOOKING ────────────────────────────────────────────
    const handleUrgentBooking = () => {
        navigate('/hospitals', {
            state: {
                urgent: true,
                symptoms: formData.symptoms,
                triage: result?.triage,
                patientAge: formData.age,
                patientGender: formData.gender,
                confidenceScore: result?.confidenceScore,
                possibleConditions: result?.possibleConditions?.map(c => c.condition).join(', ')
            }
        })
    }

    // ─── HELPERS ──────────────────────────────────────────────────────
    const getTriageColor = (triage) => {
        switch (triage?.toLowerCase()) {
            case 'emergency': return '#EF4444'
            case 'urgent': return '#F59E0B'
            case 'routine': return '#10B981'
            default: return '#6B7280'
        }
    }

    const getTriageIcon = (triage) => {
        switch (triage?.toLowerCase()) {
            case 'emergency': return <AlertCircle size={24} />
            case 'urgent': return <Activity size={24} />
            case 'routine': return <CheckCircle size={24} />
            default: return <Info size={24} />
        }
    }

    const getProbabilityColor = (probability) => {
        switch (probability) {
            case 'High': return { bg: '#FEE2E2', text: '#991B1B', bar: '#EF4444' }
            case 'Medium': return { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' }
            case 'Low': return { bg: '#D1FAE5', text: '#065F46', bar: '#10B981' }
            default: return { bg: '#F1F5F9', text: '#475569', bar: '#94A3B8' }
        }
    }

    const getProbabilityWidth = (probability) => {
        switch (probability) {
            case 'High': return '85%'
            case 'Medium': return '55%'
            case 'Low': return '30%'
            default: return '40%'
        }
    }

    return (
        <>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container" style={{ maxWidth: '900px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Stethoscope size={24} color="var(--primary)" />
                            AI Symptom Checker
                        </h1>
                        <InfoTooltip content={{
                            en: { title: 'AI Symptom Checker', helps: 'This tool uses artificial intelligence to analyze your symptoms and suggest how urgently you need medical care.', usage: '1. Enter your age and gender.\n2. Describe your symptoms clearly.\n3. (Optional) Enter your vitals like temperature or blood pressure.\n4. Click "Analyze Symptoms" to get a triage recommendation.' },
                            hi: { title: 'एआई लक्षण चेकर', helps: 'यह टूल आपके लक्षणों का विश्लेषण करने और आपको कितनी जल्दी चिकित्सा देखभाल की आवश्यकता है, इसका सुझाव देने के लिए आर्टिफिशियल इंटेलिजेंस का उपयोग करता है।', usage: '1. अपनी उम्र और लिंग दर्ज करें।\n2. अपने लक्षणों का स्पष्ट रूप से वर्णन करें।\n3. (वैकल्पिक) तापमान या रक्तचाप जैसे अपने वाइटल दर्ज करें।\n4. ट्राइएज सिफ़ारिश पाने के लिए "लक्षणों का विश्लेषण करें" पर क्लिक करें।' },
                            te: { title: 'AI సింప్టమ్ చెకర్', helps: 'మీరు ఎంత త్వరగా వైద్య సహాయం పొందాలో సూచించడానికి మరియు మీ లక్షణాలను విశ్లేషించడానికి ఈ సాధనం ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI) ఉపయోగిస్తుంది.', usage: '1. మీ వయస్సు మరియు లింగాన్ని నమోదు చేయండి.\n2. మీ లక్షణాలను స్పష్టంగా వివరించండి.\n3. (ఐచ్ఛికం) ఉష్ణోగ్రత లేదా రక్తపోటు వంటి మీ వైటల్స్ నమోదు చేయండి.\n4. ట్రియాజ్ సిఫార్సును పొందడానికి "లక్షణాలను విశ్లేషించండి" క్లిక్ చేయండి.' }
                        }} />
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
                        <div>
                            <h4 style={{ color: '#92400E', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>AI Disclaimer</h4>
                            <p style={{ color: '#B45309', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>This tool uses generative Artificial Intelligence to suggest potential paths of care. This is a preliminary assessment and <strong>is not medical advice</strong>. If you are experiencing a life-threatening emergency, please call emergency services immediately.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {/* INPUT FORM */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Patient Details</h2>
                            <form onSubmit={analyzeSymptoms}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Age *</label>
                                        <input
                                            type="number"
                                            required
                                            className="form-control"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            min="0"
                                            max="120"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender *</label>
                                        <select required className="form-control" name="gender" value={formData.gender} onChange={handleChange}>
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Describe Symptoms *</label>
                                    <textarea
                                        required
                                        className="form-control"
                                        name="symptoms"
                                        value={formData.symptoms}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="E.g., Severe chest pain, shortness of breath, headache for 3 days..."
                                    />
                                </div>

                                <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Vitals (Optional)</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Temp (°F)</label>
                                        <input type="number" step="0.1" className="form-control" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="98.6" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Heart Rate (bpm)</label>
                                        <input type="number" className="form-control" name="heartRate" value={formData.heartRate} onChange={handleChange} placeholder="72" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">BP (Sys/Dia)</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input type="number" className="form-control" name="bloodPressureSys" value={formData.bloodPressureSys} onChange={handleChange} placeholder="120" style={{ marginBottom: 0 }} />
                                            <span>/</span>
                                            <input type="number" className="form-control" name="bloodPressureDia" value={formData.bloodPressureDia} onChange={handleChange} placeholder="80" style={{ marginBottom: 0 }} />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">SpO2 (%)</label>
                                        <input type="number" className="form-control" name="spo2" value={formData.spo2} onChange={handleChange} placeholder="98" style={{ marginBottom: 0 }} />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                                </button>

                                {error && (
                                    <div className="alert" style={{ marginTop: '1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '0.5rem' }}>
                                        {error}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* RESULT PANEL */}
                        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Triage Results</h2>
                                {result && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#F1F5F9', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
                                            <Languages size={14} color="#64748B" />
                                            <select value={language} onChange={(e) => handleLangChange(e.target.value)} disabled={translating} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#334155', cursor: translating ? 'wait' : 'pointer', outline: 'none' }}>
                                                <option value="en">English</option>
                                                <option value="hi">हिंदी</option>
                                                <option value="te">తెలుగు</option>
                                            </select>
                                        </div>
                                        {translating && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" />}
                                    </div>
                                )}
                            </div>

                            {!result && !loading && (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
                                    <Activity size={48} style={{ opacity: 0.2 }} />
                                    <p>Fill out the patient details & symptoms to get an AI triage assessment.</p>
                                </div>
                            )}

                            {loading && (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="chat-typing" style={{ padding: '1rem' }}>
                                        <span></span><span></span><span></span>
                                    </div>
                                    <p style={{ color: 'var(--text-light)' }}>AI is evaluating health risk...</p>
                                </div>
                            )}

                            {result && (
                                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                    {/* Triage Banner */}
                                    <div style={{
                                        backgroundColor: `${getTriageColor(result.triage)}15`,
                                        border: `1px solid ${getTriageColor(result.triage)}50`,
                                        borderRadius: '0.75rem',
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ color: getTriageColor(result.triage) }}>
                                            {getTriageIcon(result.triage)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: getTriageColor(result.triage) }}>
                                                {result.triage} Risk
                                            </h3>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-light)' }}>
                                                {result.confidenceScore}% Confidence Score
                                            </span>
                                        </div>
                                    </div>

                                    {/* ─── EMERGENCY TRIAGE ACTION PANEL ─── */}
                                    {(result.triage === 'Emergency' || result.triage === 'Urgent') && (
                                        <div style={{
                                            background: result.triage === 'Emergency'
                                                ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                                                : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                                            border: `2px solid ${result.triage === 'Emergency' ? '#EF4444' : '#F59E0B'}`,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <Phone size={20} color={result.triage === 'Emergency' ? '#B91C1C' : '#92400E'} />
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '1.05rem',
                                                    fontWeight: 700,
                                                    color: result.triage === 'Emergency' ? '#B91C1C' : '#92400E'
                                                }}>
                                                    {result.triage === 'Emergency'
                                                        ? '🚨 Immediate Medical Attention Recommended'
                                                        : '⚠️ Prompt Medical Consultation Advised'}
                                                </h4>
                                            </div>
                                            <p style={{
                                                fontSize: '0.88rem',
                                                color: result.triage === 'Emergency' ? '#991B1B' : '#78350F',
                                                margin: '0 0 1rem 0',
                                                lineHeight: 1.5
                                            }}>
                                                {result.triage === 'Emergency'
                                                    ? 'Based on your symptoms, this appears to be a high-risk situation. Please seek emergency care immediately. If this is life-threatening, call 108 (Indian Emergency) now.'
                                                    : 'Your symptoms suggest a condition that should be evaluated by a doctor soon. We recommend booking an appointment at the earliest convenience.'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleUrgentBooking}
                                                    style={{
                                                        background: result.triage === 'Emergency' ? '#DC2626' : '#D97706',
                                                        border: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontWeight: 600,
                                                        padding: '0.6rem 1.25rem'
                                                    }}
                                                >
                                                    <Calendar size={16} />
                                                    Book Urgent Appointment
                                                </button>
                                                {result.triage === 'Emergency' && (
                                                    <a
                                                        href="tel:108"
                                                        className="btn btn-outline"
                                                        style={{
                                                            borderColor: '#B91C1C',
                                                            color: '#B91C1C',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            fontWeight: 600,
                                                            padding: '0.6rem 1.25rem',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        <Phone size={16} />
                                                        Call 108 Emergency
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── POSSIBLE CONDITIONS ─── */}
                                    {result.possibleConditions && result.possibleConditions.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Stethoscope size={18} style={{ color: 'var(--primary)' }} /> Possible Conditions
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {result.possibleConditions.map((cond, idx) => {
                                                    const probColor = getProbabilityColor(cond.probability)
                                                    return (
                                                        <div key={idx} style={{
                                                            padding: '1rem',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '10px',
                                                            background: '#fff'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{cond.condition}</strong>
                                                                <span style={{
                                                                    background: probColor.bg,
                                                                    color: probColor.text,
                                                                    fontSize: '0.7rem',
                                                                    padding: '0.15rem 0.5rem',
                                                                    borderRadius: '999px',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {cond.probability} Probability
                                                                </span>
                                                            </div>
                                                            {/* Probability Bar */}
                                                            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', marginBottom: '0.6rem', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: getProbabilityWidth(cond.probability),
                                                                    background: probColor.bar,
                                                                    borderRadius: '3px',
                                                                    transition: 'width 0.8s ease'
                                                                }} />
                                                            </div>
                                                            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                                                {cond.explanation}
                                                            </p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── MEDICAL EXPLANATION ─── */}
                                    {result.medicalExplanation && (
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Info size={16} /> Medical Assessment
                                            </h4>
                                            <p style={{ fontSize: '0.88rem', color: '#0C4A6E', margin: 0, lineHeight: 1.6 }}>
                                                {result.medicalExplanation}
                                            </p>
                                        </div>
                                    )}

                                    {/* Explainability Panel */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Info size={18} style={{ color: 'var(--primary)' }} /> Explainable AI Panel
                                        </h4>
                                        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Factors influencing this decision:</p>
                                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {result.explainability?.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Care Plan */}
                                    {result.preliminaryCarePlan && result.preliminaryCarePlan.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Preliminary Care Plan</h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {result.preliminaryCarePlan.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
