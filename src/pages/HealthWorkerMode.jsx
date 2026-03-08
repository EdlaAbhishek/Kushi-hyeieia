import { useState } from 'react'
import { supabase } from '../services/supabase'
import { Save, Wifi, WifiOff, Users, Activity, Languages } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'

export default function HealthWorkerMode() {
    const [patientData, setPatientData] = useState({
        patient_name: '',
        patient_phone: '',
        village_name: '',
        blood_pressure: '',
        heart_rate: '',
        spo2: '',
        temperature: '',
        blood_glucose: '',
        notes: ''
    })

    const [isOfflineMode, setIsOfflineMode] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [language, setLanguage] = useState('en')

    const handleChange = (e) => {
        setPatientData({ ...patientData, [e.target.name]: e.target.value })
    }

    // Translations Dictionary
    const translations = {
        "Health Worker Mode": {
            hi: "स्वास्थ्य कार्यकर्ता मोड",
            te: "ఆరోగ్య కార్యకర్త మోడ్",
            bn: "স্বাস্থ্য কর্মী মোড",
            mr: "आरोग्य कार्यकर्ता मोड",
            ta: "சுகாதார பணியாளர் முறை"
        },
        "Remote primary care data entry (ASHA/Camp interface)": {
            hi: "दूरस्थ प्राथमिक देखभाल डेटा प्रविष्टि (आशा/शिविर इंटरफ़ेस)",
            te: "రిమోట్ ప్రైమరీ కేర్ డేటా ఎంట్రీ (ఆశా/క్యాంప్ ఇంటర్‌ఫేస్)",
            bn: "দূরবর্তী প্রাথমিক যত্নের ডেটা এন্ট্রি (আশা/ক্যাম্প ইন্টারফেস)",
            mr: "रिमोट प्राइमरी केअर डेटा एंट्री (आशा/कॅम्प इंटरफेस)",
            ta: "தொலைநிலை முதன்மை பராமரிப்பு தரவு உள்ளீடு"
        },
        "Patient Vitals Entry": {
            hi: "मरीज़ वाइटल्स प्रविष्टि",
            te: "రోగి ప్రాణాధార వివరాల నమోదు",
            bn: "রোগীর ভাইটালস এন্ট্রি",
            mr: "रुग्ण जीवनविषयक नोंद",
            ta: "நோயாளியின் முக்கிய தகவல்கள்"
        },
        "Patient Name": { hi: "मरीज़ का नाम", te: "రోగి పేరు", bn: "রোগীর নাম", mr: "रुग्णाचे नाव", ta: "நோயாளி பெயர்" },
        "Phone Number": { hi: "फ़ोन नंबर", te: "ఫోన్ నంబర్", bn: "ফোন নম্বর", mr: "फोन नंबर", ta: "தொலைபேசி எண்" },
        "Village/Location": { hi: "गाँव/स्थान", te: "గ్రామం/ప్రాంతం", bn: "গ্রাম/স্থান", mr: "गाव/स्थान", ta: "கிராமம்/இடம்" },
        "Blood Pressure": { hi: "रक्तचाप", te: "రక్తపోటు", bn: "রক্তচাপ", mr: "रक्तदाब", ta: "இரத்த அழுத்தம்" },
        "Heart Rate": { hi: "हृदय गति", te: "హృదయ స్పందనల వేగం", bn: "হৃদগতি", mr: "हृदय गती", ta: "இதய துடிப்பு" },
        "SpO2": { hi: "ऑक्सीजन", te: "ఆక్సిజన్", bn: "অক্সিজেন", mr: "ऑक्सिजन", ta: "ஆக்சிஜன்" },
        "Temperature": { hi: "तापमान", te: "ఉష్ణోగ్రత", bn: "তাপমাত্রা", mr: "तापमान", ta: "வெப்பநிலை" },
        "Blood Glucose": { hi: "रक्त शर्करा", te: "రక్తంలో చక్కెర", bn: "রক্তে শর্করা", mr: "रक्त शर्करा", ta: "இரத்த சர்க்கரை" },
        "Clinical Notes / Symptoms observed": {
            hi: "नैदानिक नोट्स / देखे गए लक्षण",
            te: "క్లినికల్ నోట్స్ / గమనించిన లక్షణాలు",
            bn: "ক্লিনিক্যাল নোট / লক্ষণ পরিলক্ষিত",
            mr: "क्लिनिकल नोट्स / दिसलेली लक्षणे",
            ta: "மருத்துவ குறிப்புகள் / கவனிக்கப்பட்ட அறிகுறிகள்"
        },
        "Cough, fever, weakness...": { hi: "खांसी, बुखार, कमजोरी...", te: "దగ్గు, జ్వరం, నీరసం...", bn: "কাশি, জ্বর, দুর্বলতা...", mr: "खोकला, ताप, अशक्तपणा...", ta: "இருமல், காய்ச்சல், பலவீனம்..." },
        "Save Patient Record": { hi: "मरीज़ रिकॉर्ड सहेजें", te: "రోగి రికార్డును సేవ్ చేయండి", bn: "রোগীর রেকর্ড সংরক্ষণ করুন", mr: "रुग्ण रेकॉर्ड जतन करा", ta: "நோயாளி சாதனையை சேமிக்கவும்" },
        "Saving...": { hi: "बचत...", te: "సేవ్ అవుతోంది...", bn: "সংরক্ষণ করা হচ্ছে...", mr: "जतन करत आहे...", ta: "சேமிக்கிறது..." },
        "Online": { hi: "ऑनलाइन", te: "ఆన్‌లైన్", bn: "অনলাইন", mr: "ऑनलाइन", ta: "ஆன்லைன்" },
        "Offline": { hi: "ऑफ़लाइन", te: "ఆఫ్‌లైన్", bn: "অফলাইন", mr: "ऑफलाइन", ta: "ஆஃப்லைன்" },
        "Please fill in at least Name and Village.": { hi: "कृपया कम से कम नाम और गांव भरें।", te: "దయచేసి కనీసం పేరు మరియు గ్రామాన్ని పూరించండి.", bn: "দয়া করে অন্তত নাম এবং গ্রাম পূরণ করুন।", mr: "कृपया किमान नाव आणि गाव भरा.", ta: "தயவுசெய்து குறைந்தபட்சம் பெயர் மற்றும் கிராமத்தை நிரப்பவும்." },
        "Saved offline. Will sync when connected.": { hi: "ऑफ़लाइन सहेजा गया। कनेक्ट होने पर सिंक हो जाएगा।", te: "ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది. కనెక్ట్ అయినప్పుడు సమకాలీకరించబడుతుంది.", bn: "অফলাইনে সংরক্ষিত। সংযুক্ত হলে সিঙ্ক হবে।", mr: "ऑफलाइन जतन केले. कनेक्ट झाल्यावर सिंक होईल.", ta: "ஆஃப்லைனில் சேமிக்கப்பட்டது. இணைக்கப்படும்போது ஒத்திசைக்கப்படும்." },
        "Patient vitals saved successfully to central database.": { hi: "मरीज़ के वाइटल्स मुख्य डेटाबेस में सफलतापूर्वक सहेजे गए।", te: "రోగి ప్రాణాధార వివరాలు కేంద్ర డేటాబేస్‌లో విజయవంతంగా సేవ్ చేయబడ్డాయి.", bn: "রোগীর ভাইটালগুলি মূল ডাটাবেসে সফলভাবে সংরক্ষিত হয়েছে।", mr: "रुग्णाचे जीवनविषयक केंद्रीय डेटाबेसमध्ये यशस्वीरित्या जतन केले.", ta: "நோயாளியின் முக்கிய தகவல்கள் மைய தரவுத்தளத்தில் வெற்றிகரமாக சேமிக்கப்பட்டன." },
        "records waiting to sync": { hi: "रिकॉर्ड सिंक होने की प्रतीक्षा में", te: "రికార్డులు సింక్ కోసం వేచి ఉన్నాయి", bn: "সিঙ্ক করার জন্য অপেক্ষমাণ রেকর্ড", mr: "सिंक होण्याच्या प्रतीक्षेत असलेले रेकॉर्ड", ta: "ஒத்திசைக்க காத்திருக்கும் பதிவுகள்" },
        "Sync Now": { hi: "अभी सिंक करें", te: "ఇప్పుడే సింక్ చేయండి", bn: "এখনই সিঙ্ক করুন", mr: "आता सिंक करा", ta: "இப்போது ஒத்திசைக்கவும்" }
    }

    const t = (enText) => {
        if (language === 'en') return enText
        return translations[enText]?.[language] || enText
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!patientData.patient_name || !patientData.village_name) {
            toast.error(t("Please fill in at least Name and Village."))
            return
        }

        setIsSubmitting(true)

        if (isOfflineMode) {
            // Save to localStorage for later sync
            const existingRecords = JSON.parse(localStorage.getItem('offlineVitals') || '[]')
            localStorage.setItem('offlineVitals', JSON.stringify([...existingRecords, { ...patientData, timestamp: new Date().toISOString() }]))
            toast.success(t("Saved offline. Will sync when connected."))
            setIsSubmitting(false)
            setPatientData({
                patient_name: '', patient_phone: '', village_name: '',
                blood_pressure: '', heart_rate: '', spo2: '', temperature: '', blood_glucose: '', notes: ''
            })
            return
        }

        try {
            const { error } = await supabase.from('vitals').insert([
                {
                    patient_name: patientData.patient_name,
                    patient_phone: patientData.patient_phone,
                    village_name: patientData.village_name,
                    blood_pressure: patientData.blood_pressure,
                    heart_rate: patientData.heart_rate ? parseInt(patientData.heart_rate) : null,
                    spo2: patientData.spo2 ? parseInt(patientData.spo2) : null,
                    temperature: patientData.temperature ? parseFloat(patientData.temperature) : null,
                    blood_glucose: patientData.blood_glucose ? parseInt(patientData.blood_glucose) : null,
                    notes: patientData.notes
                }
            ])

            if (error) {
                // Check if table exists
                if (error.code === '42P01') {
                    throw new Error("Vitals table does not exist. Please run the SQL script in Supabase.")
                }
                throw error
            }

            toast.success(t("Patient vitals saved successfully to central database."))
            setPatientData({
                patient_name: '', patient_phone: '', village_name: '',
                blood_pressure: '', heart_rate: '', spo2: '', temperature: '', blood_glucose: '', notes: ''
            })

        } catch (error) {
            console.error("Error saving vitals:", error)
            toast.error(error.message || "Failed to save vitals")
            // Provide fallback to offline
            toast("Falling back to offline mode storage.")
            const existingRecords = JSON.parse(localStorage.getItem('offlineVitals') || '[]')
            localStorage.setItem('offlineVitals', JSON.stringify([...existingRecords, { ...patientData, timestamp: new Date().toISOString() }]))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <PageHeader
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={28} />
                        {t("Health Worker Mode")}
                    </span>
                }
                description={t("Remote primary care data entry (ASHA/Camp interface)")}
                className="doctor-header"
                action={
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', fontSize: '0.85rem'
                        }}>
                            <Languages size={16} />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', outline: 'none',
                                    fontSize: 'inherit', color: '#fff', cursor: 'pointer',
                                    paddingRight: '0.5rem'
                                }}
                            >
                                <option value="en" style={{ color: '#000' }}>English</option>
                                <option value="hi" style={{ color: '#000' }}>हिंदी</option>
                                <option value="te" style={{ color: '#000' }}>తెలుగు</option>
                                <option value="bn" style={{ color: '#000' }}>বাংলা</option>
                                <option value="mr" style={{ color: '#000' }}>मराठी</option>
                                <option value="ta" style={{ color: '#000' }}>தமிழ்</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsOfflineMode(!isOfflineMode)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: isOfflineMode ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                                padding: '0.5rem 1rem', borderRadius: 'var(--radius)',
                                border: `1px solid ${isOfflineMode ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
                                color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600
                            }}
                            title={isOfflineMode ? "Click to go online" : "Click to enable offline mode"}
                        >
                            {isOfflineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
                            {t(isOfflineMode ? "Offline" : "Online")}
                        </button>
                    </div>
                }
            />

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

                <DashboardCard style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary)" />
                        {t("Patient Vitals Entry")}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                            {/* Demographics */}
                            <div className="form-group">
                                <label className="form-label">{t("Patient Name")} *</label>
                                <input type="text" className="form-control" name="patient_name" value={patientData.patient_name} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("Phone Number")} (Optional)</label>
                                <input type="tel" className="form-control" name="patient_phone" value={patientData.patient_phone} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("Village/Location")} *</label>
                                <input type="text" className="form-control" name="village_name" value={patientData.village_name} onChange={handleChange} required />
                            </div>

                            {/* Vitals */}
                            <div className="form-group">
                                <label className="form-label">{t("Blood Pressure")} (e.g. 120/80)</label>
                                <input type="text" className="form-control" name="blood_pressure" value={patientData.blood_pressure} onChange={handleChange} placeholder="SYS/DIA" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("Heart Rate")} (bpm)</label>
                                <input type="number" className="form-control" name="heart_rate" value={patientData.heart_rate} onChange={handleChange} placeholder="60-100" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("SpO2")} (%)</label>
                                <input type="number" className="form-control" name="spo2" value={patientData.spo2} onChange={handleChange} placeholder="95-100" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("Temperature")} (°F)</label>
                                <input type="number" step="0.1" className="form-control" name="temperature" value={patientData.temperature} onChange={handleChange} placeholder="98.6" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t("Blood Glucose")} (mg/dL)</label>
                                <input type="number" className="form-control" name="blood_glucose" value={patientData.blood_glucose} onChange={handleChange} placeholder="Fasting/Random" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="form-label">{t("Clinical Notes / Symptoms observed")}</label>
                            <textarea className="form-control" rows={4} name="notes" value={patientData.notes} onChange={handleChange} placeholder={t("Cough, fever, weakness...")}></textarea>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <ActionButton variant="primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }} disabled={isSubmitting}>
                                {isSubmitting ? <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> : <Save size={20} />}
                                {isSubmitting ? t("Saving...") : t("Save Patient Record")}
                            </ActionButton>
                        </div>
                    </form>
                </DashboardCard>

                {/* Sync Queue Banner (Mock) */}
                {JSON.parse(localStorage.getItem('offlineVitals') || '[]').length > 0 && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{JSON.parse(localStorage.getItem('offlineVitals') || '[]').length} {t("records waiting to sync")}</strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#B45309' }}>Connect to internet to push data to central database.</p>
                        </div>
                        <ActionButton variant="primary" style={{ background: '#D97706', borderColor: '#D97706' }} onClick={() => {
                            if (!isOfflineMode) {
                                toast("Simulating Sync Process...")
                                setTimeout(() => {
                                    localStorage.removeItem('offlineVitals')
                                    toast.success("All records synced successfully!")
                                    window.location.reload()
                                }, 1500)
                            } else {
                                toast.error("Turn off offline mode first to sync")
                            }
                        }}>
                            {t("Sync Now")}
                        </ActionButton>
                    </div>
                )}
            </div>
        </>
    )
}
