import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { MapPin, Navigation, Activity, Hospital, Star, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import InfoButton from '../components/ui/InfoButton'

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null
    const R = 6371 // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(1) // Distance in km
}

export default function HospitalRecommendation() {
    const [symptoms, setSymptoms] = useState('')
    const [userLocation, setUserLocation] = useState(null)
    const [locationError, setLocationError] = useState('')

    const [hospitals, setHospitals] = useState([])
    const [loadingHospitals, setLoadingHospitals] = useState(false)

    const [aiRecommendation, setAiRecommendation] = useState(null)
    const [loadingAi, setLoadingAi] = useState(false)
    const [aiError, setAiError] = useState('')
    const [fetchError, setFetchError] = useState('')

    // 1. Get User Location
    const getLocation = () => {
        setLocationError('')
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            },
            () => {
                setLocationError('Unable to retrieve your location. Please enable location services.')
            }
        )
    }

    // 2. Fetch Hospitals and Specializations when component mounts or location changes
    useEffect(() => {
        async function fetchHospitals() {
            setLoadingHospitals(true)
            try {
                // Fetch hospitals
                const { data: hospitalData, error: hospitalError } = await supabase
                    .from('hospitals')
                    .select('*')

                if (hospitalError) throw hospitalError

                // Fetch doctors to get specializations (gracefully skip if column missing)
                let doctorData = []
                try {
                    const { data, error: doctorError } = await supabase
                        .from('doctors')
                        .select('hospital_id, specialty')
                    if (!doctorError) doctorData = data || []
                } catch (e) {
                    console.warn('Could not fetch doctor specializations:', e)
                }

                // Map specializations to hospitals
                const hospitalsWithSpecialties = (hospitalData || []).map(hospital => {
                    const doctorsInHospital = doctorData.filter(d => d.hospital_id === hospital.id)
                    const specialties = [...new Set(doctorsInHospital.map(d => d.specialty).filter(Boolean))]

                    let distance = null
                    if (userLocation && hospital.lat && hospital.lng) {
                        distance = parseFloat(calculateDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng))
                    }

                    return {
                        ...hospital,
                        specialties,
                        distance
                    }
                })

                // Sort by distance if location available
                if (userLocation) {
                    hospitalsWithSpecialties.sort((a, b) => {
                        if (a.distance === null) return 1
                        if (b.distance === null) return -1
                        return a.distance - b.distance
                    })
                }

                setHospitals(hospitalsWithSpecialties)
                setFetchError('')
            } catch (err) {
                console.error("Error fetching hospitals:", err)
                setFetchError(err.message || 'Failed to load hospitals. The hospitals table may not exist in your Supabase instance.')
                setHospitals([])
            } finally {
                setLoadingHospitals(false)
            }
        }

        fetchHospitals()
    }, [userLocation])


    // 3. AI Analysis
    const handleGetRecommendation = async (e) => {
        e.preventDefault()
        if (!symptoms.trim() || hospitals.length === 0) return

        setAiError('')
        setAiRecommendation(null)
        setLoadingAi(true)

        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
            const model = import.meta.env.VITE_OPENROUTER_MODEL || "arcee-ai/trinity-large-preview:free"

            if (!apiKey) throw new Error("OpenRouter API key is missing.")

            // Prepare hospital data for the prompt (top 10 closest to save tokens)
            const availableHospitals = hospitals.slice(0, 10).map(h => ({
                id: h.id,
                name: h.name,
                distance: h.distance ? `${h.distance} km` : 'Unknown',
                emergency: h.emergency,
                specialties: h.specialties.length > 0 ? h.specialties.join(', ') : 'General Practice'
            }))

            const prompt = `
You are an intelligent medical triage and hospital routing assistant. 
Based on the patient's symptoms and the list of nearby hospitals, select the BEST hospital for their condition.

Patient Symptoms: "${symptoms}"

Available Nearby Hospitals:
${JSON.stringify(availableHospitals, null, 2)}

Instructions:
1. Analyze the symptoms to determine the likely medical domain (e.g., Cardiology, Orthopedics, Emergency).
2. Find the hospital that has the matching 'specialties'.
3. If it sounds like a life-threatening emergency, prioritize hospitals with 'emergency: true'.
4. If multiple hospitals are suitable, prefer the one with the shortest distance.
5. Return exactly ONE recommended hospital ID and your reasoning.

Respond ONLY with a valid JSON format EXACTLY like this (no markdown):
{
  "recommendedHospitalId": "<uuid from the list>",
  "reasoning": "<Explanation of why this hospital is the best fit, mentioning the matching specialties and distance.>",
  "urgency": "Emergency" | "Urgent" | "Routine"
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
                        { role: "system", content: "You are an AI Hospital Recommendation engine. Always output strictly valid JSON." },
                        { role: "user", content: prompt }
                    ]
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            const content = data.choices[0].message.content

            try {
                const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim()
                const jsonResult = JSON.parse(cleanedContent)

                if (!jsonResult.recommendedHospitalId) {
                    throw new Error("AI did not return a valid hospital ID.")
                }

                const recHospital = hospitals.find(h => h.id === jsonResult.recommendedHospitalId)

                if (recHospital) {
                    setAiRecommendation({
                        hospital: recHospital,
                        reasoning: jsonResult.reasoning,
                        urgency: jsonResult.urgency
                    })
                } else {
                    // Fallback if AI hallucinates an ID, pick the closest one
                    setAiRecommendation({
                        hospital: hospitals[0],
                        reasoning: "AI recommended a general facility based on your location. " + jsonResult.reasoning,
                        urgency: jsonResult.urgency
                    })
                }

            } catch (parseError) {
                console.error("Parse Error:", content)
                throw new Error("Failed to interpret AI response.")
            }

        } catch (err) {
            console.error("AI Error:", err)
            setAiError(err.message)
        } finally {
            setLoadingAi(false)
        }
    }

    return (
        <>
            <section className="page-header doctor-header">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Hospital size={28} />
                            Smart Hospital Finder
                        </h1>
                        <p className="page-subtitle">Find the best care based on your location and symptoms.</p>
                    </div>
                    <InfoButton content={{
                        en: {
                            title: 'Smart Hospital Finder',
                            helps: 'This tool helps you find the nearest hospitals equipped to handle your specific medical needs based on distance and specialization.',
                            usage: '1. Click "Use My Location" to find nearby facilities.\n2. Describe your symptoms if you want AI-powered matching.\n3. The list will rank hospitals by distance and match relevance.'
                        },
                        hi: {
                            title: 'स्मार्ट अस्पताल खोजक',
                            helps: 'यह टूल आपको दूरी और विशेषज्ञता के आधार पर आपकी विशिष्ट चिकित्सा आवश्यकताओं को संभालने के लिए सुसज्जित निकटतम अस्पतालों को खोजने में मदद करता है।',
                            usage: '1. नजदीकी सुविधाओं को खोजने के लिए "मेरे स्थान का उपयोग करें" पर क्लिक करें।\n2. यदि आप एआई-संचालित मिलान चाहते हैं तो अपने लक्षणों का वर्णन करें।\n3. सूची अस्पतालों को दूरी और मिलान प्रासंगिकता के आधार पर रैंक करेगी।'
                        },
                        te: {
                            title: 'స్మార్ట్ హాస్పిటల్ ఫైండర్',
                            helps: 'దూరం మరియు స్పెషలైజేషన్ ఆధారంగా మీ నిర్దిష్ట వైద్య అవసరాలను తీర్చగల సమీప ఆసుపత్రులను కనుగొనడంలో ఈ సాధనం మీకు సహాయపడుతుంది.',
                            usage: '1. సమీపంలోని ఆసుపత్రులను కనుగొనడానికి "నా స్థానాన్ని ఉపయోగించండి" క్లిక్ చేయండి.\n2. మీకు AI ఆధారిత మ్యాచింగ్ కావాలంటే మీ లక్షణాలను వివరించండి.\n3. జాబితా ఆసుపత్రులను దూరం మరియు సంబంధిత ప్రాముఖ్యత ఆధారంగా ర్యాంక్ చేస్తుంది.'
                        }
                    }} />
                </div>
            </section>

            <section className="section" style={{ paddingTop: '1.5rem' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                        {fetchError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <AlertCircle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
                                <div>
                                    <h4 style={{ color: '#991B1B', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Database Error</h4>
                                    <p style={{ color: '#B91C1C', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{fetchError}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                            {/* LEFT COLUMN: Input & Location */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
                                    <div>
                                        <h4 style={{ color: '#92400E', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>AI Disclaimer</h4>
                                        <p style={{ color: '#B45309', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>This mapping tool uses AI to suggest optimal care centers. This does <strong>not</strong> substitute direct medical judgement. If experiencing a life-threatening event, head directly to the nearest emergency room.</p>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={20} className="text-primary" /> Location
                                    </h2>

                                    {userLocation ? (
                                        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={18} /> Location detected. Finding hospitals near you.
                                        </div>
                                    ) : (
                                        <button onClick={getLocation} className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <Navigation size={18} /> Share My Location
                                        </button>
                                    )}

                                    {locationError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{locationError}</p>}

                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '1rem' }}>
                                        Your location helps us calculate accurate distances to medical facilities.
                                    </p>
                                </div>

                                <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={20} className="text-primary" /> Symptoms
                                    </h2>
                                    <form onSubmit={handleGetRecommendation} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <textarea
                                            className="form-control"
                                            rows={5}
                                            placeholder="Describe your symptoms in detail (e.g., severe headache, blurred vision, chest pain...)"
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            required
                                            style={{ marginBottom: '1rem', flex: 1 }}
                                        ></textarea>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loadingAi || loadingHospitals || !symptoms.trim()}
                                            style={{ width: '100%' }}
                                        >
                                            {loadingAi ? 'AI is analyzing...' : 'Get Recommendation'}
                                        </button>

                                        {aiError && (
                                            <div className="alert" style={{ marginTop: '1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                                                {aiError}
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: AI Output & Hospital List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* AI Recommendation Panel */}
                                {aiRecommendation && (
                                    <div className="card" style={{ padding: '1.5rem', border: '2px solid var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Star fill="currentColor" size={20} /> AI Recommended Hospital
                                            </h2>
                                            {aiRecommendation.urgency === 'Emergency' && (
                                                <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>Emergency</span>
                                            )}
                                        </div>

                                        <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{aiRecommendation.hospital.name}</h3>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <MapPin size={14} /> {aiRecommendation.hospital.city}
                                                </span>
                                                {aiRecommendation.hospital.distance && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-color)' }}>
                                                        <Navigation size={14} /> {aiRecommendation.hospital.distance} km away
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Reasoning</h4>
                                            <p style={{ fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{aiRecommendation.reasoning}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Nearby Hospitals List */}
                                <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
                                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Hospital size={18} className="text-primary" /> Nearby Facilities {hospitals.length > 0 && `(${hospitals.length})`}
                                    </h2>

                                    {loadingHospitals ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><LoadingSpinner /></div>
                                    ) : hospitals.length === 0 ? (
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No hospitals found in the database.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: aiRecommendation ? '300px' : '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                            {hospitals.map(hospital => (
                                                <div key={hospital.id} style={{
                                                    padding: '1rem',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    backgroundColor: aiRecommendation?.hospital.id === hospital.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{hospital.name}</h3>
                                                        {hospital.distance && (
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                                                                {hospital.distance} km
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>{hospital.address}</p>

                                                    {hospital.specialties && hospital.specialties.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                            {hospital.specialties.slice(0, 3).map((spec, i) => (
                                                                <span key={i} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', color: 'var(--text-light)' }}>
                                                                    {spec}
                                                                </span>
                                                            ))}
                                                            {hospital.specialties.length > 3 && (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>+{hospital.specialties.length - 3} more</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hospital.emergency && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626', fontSize: '0.8rem', fontWeight: 500, marginTop: '0.25rem' }}>
                                                            <AlertCircle size={14} /> 24/7 Emergency
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
