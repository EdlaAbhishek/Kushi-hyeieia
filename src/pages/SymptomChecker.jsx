import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { AlertCircle, CheckCircle, Activity, Info, AlertTriangle, Stethoscope } from 'lucide-react'
import InfoButton from '../components/ui/InfoButton'

export default function SymptomChecker() {
    const { user } = useAuth()

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
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const analyzeSymptoms = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)
        setLoading(true)

        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
            const model = import.meta.env.VITE_OPENROUTER_MODEL || "arcee-ai/trinity-large-preview:free"

            if (!apiKey) throw new Error("OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.")

            // Construct the prompt
            const prompt = `
You are an AI medical triage assistant. Analyze the patient's data and provide a triage assessment.
DO NOT provide medical advice.

Patient Data:
- Age: ${formData.age}
- Gender: ${formData.gender}
- Symptoms: ${formData.symptoms}
- Temperature: ${formData.temperature ? formData.temperature + ' °F' : 'Not provided'}
- Blood Pressure: ${formData.bloodPressureSys && formData.bloodPressureDia ? `${formData.bloodPressureSys}/${formData.bloodPressureDia} mmHg` : 'Not provided'}
- Heart Rate: ${formData.heartRate ? formData.heartRate + ' bpm' : 'Not provided'}
- SpO2: ${formData.spo2 ? formData.spo2 + '%' : 'Not provided'}

Respond ONLY with a valid JSON format EXACTLY like this (no markdown, no other text):
{
  "triage": "Emergency" | "Urgent" | "Routine",
  "confidenceScore": <integer between 0 and 100>,
  "explainability": [
    "<reasoning regarding specific symptom or vital>",
    "<another reasoning point>"
  ],
  "preliminaryCarePlan": [
    "<suggested test>",
    "<suggested lifestyle tip>",
    "<follow-up suggestion>"
  ]
}
`

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-OpenRouter-Title": "Khushi Hygieia",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": model,
                    "temperature": 0.1,
                    "response_format": { "type": "json_object" },
                    "messages": [
                        { role: "system", content: "You are an AI Symptom Checker. Always output strictly valid JSON matching the requested schema." },
                        { role: "user", content: prompt }
                    ]
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            const content = data.choices[0].message.content

            // Try to parse JSON
            try {
                // Remove potential markdown code blocks if the model ignored instructions
                const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim()
                const jsonResult = JSON.parse(cleanedContent)

                if (!jsonResult.triage || !jsonResult.confidenceScore) {
                    throw new Error("Invalid response schema from AI.")
                }

                setResult(jsonResult)
            } catch (parseError) {
                console.error("Failed to parse JSON:", content);
                throw new Error("Failed to interpret AI response. Please try again.")
            }

        } catch (err) {
            console.error("AI Triage Error:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getTriageColor = (triage) => {
        switch (triage?.toLowerCase()) {
            case 'emergency': return '#EF4444' // Red
            case 'urgent': return '#F59E0B' // Yellow
            case 'routine': return '#10B981' // Green
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

    return (
        <>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container" style={{ maxWidth: '900px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Stethoscope size={24} color="var(--primary)" />
                            AI Symptom Checker
                        </h1>
                        <InfoButton content={{
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
                                            className="form-input"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            min="0"
                                            max="120"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender *</label>
                                        <select required className="form-input" name="gender" value={formData.gender} onChange={handleChange}>
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
                                        className="form-input"
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
                                        <input type="number" step="0.1" className="form-input" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="98.6" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Heart Rate (bpm)</label>
                                        <input type="number" className="form-input" name="heartRate" value={formData.heartRate} onChange={handleChange} placeholder="72" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">BP (Sys/Dia)</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input type="number" className="form-input" name="bloodPressureSys" value={formData.bloodPressureSys} onChange={handleChange} placeholder="120" style={{ marginBottom: 0 }} />
                                            <span>/</span>
                                            <input type="number" className="form-input" name="bloodPressureDia" value={formData.bloodPressureDia} onChange={handleChange} placeholder="80" style={{ marginBottom: 0 }} />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">SpO2 (%)</label>
                                        <input type="number" className="form-input" name="spo2" value={formData.spo2} onChange={handleChange} placeholder="98" style={{ marginBottom: 0 }} />
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
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Triage Results</h2>

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
