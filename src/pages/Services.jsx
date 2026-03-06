import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Droplet, ScanLine, Upload, FileImage, X, Calendar, Shield, CheckCircle, ExternalLink, Info, Phone, Activity, TestTubes } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import InfoButton from '../components/ui/InfoButton'

export default function Services() {
    const { user, isDoctor } = useAuth()

    // ─── PRESCRIPTION SCANNER STATE ───────────────────────────────────
    const [file, setFile] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState(null)
    const fileInputRef = useRef(null)

    // ─── HANDLERS ─────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            setFile(selected)
            setScanResult(null)
        }
    }

    const handleScan = async () => {
        if (!file) return
        setScanning(true)
        // Simulated AI Scan logic
        setTimeout(() => {
            setScanResult({
                medicines: [
                    { name: 'Amoxicillin 500mg', type: 'Antibiotic', dosage: '1 tablet every 8 hours', duration: '5 days' },
                    { name: 'Paracetamol 650mg', type: 'Pain Relief', dosage: '1 tablet as needed', duration: '3 days' }
                ],
                doctor_notes: 'Take medicines after food. Complete the antibiotic course.'
            })
            setScanning(false)
        }, 2000)
    }

    return (
        <div className="services-page">
            <section className="section bg-surface" style={{ paddingTop: 0 }}>
                <div className="container">

                    {/* Header */}
                    <div className="section-header" style={{ textAlign: 'left', marginBottom: '3rem' }}>
                        <h1 className="section-title">Specialized Medical Services</h1>
                        <p className="section-subtitle">Dedicated tools for prescriptions, blood services, and laboratory connections.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem', alignItems: 'start' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {/* ─── AICat (Internal Scanner) ─── */}
                            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="card-icon" style={{ margin: 0, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                            <ScanLine size={22} />
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Prescription Scanner</h2>
                                    </div>
                                    <InfoButton content={{
                                        en: { title: 'Prescription Scanner', helps: 'Helps you understand handwritten or printed prescriptions using AI.', usage: 'Upload a clear image of your prescription. Our AI will extract medicine names, dosages, and durations for your reference.' },
                                        hi: { title: 'प्रिस्क्रिप्शन स्कैनर', helps: 'AI का उपयोग करके हस्तलिखित या मुद्रित नुस्खों को समझने में आपकी मदद करता है।', usage: 'अपने नुస్ఖे की एक स्पष्ट छवि अपलोड करें। हमारा AI आपके संदर्भ के लिए दवा के नाम, खुराक और अवधि निकालेगा।' },
                                        te: { title: 'ప్రిస్క్రిప్షన్ స్కానర్', helps: 'AIని ఉపయోగించి చేతితో రాసిన లేదా ముద్రించిన ప్రిస్క్రిప్షన్లను అర్థం చేసుకోవడంలో మీకు సహాయపడుతుంది.', usage: 'మీ ప్రిస్క్రిప్షన్ యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి. మా AI మీ సూచన కోసం ఔషధాల పేర్లు, మోతాదులు మరియు వ్యవధిని సేకరిస్తుంది.' }
                                    }} />
                                </div>

                                {!scanResult ? (
                                    <div className="scan-dropzone" style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                                        {file ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <button className="btn btn-icon" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff' }} onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p style={{ fontWeight: 600 }}>{file.name}</p>
                                                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleScan(); }} disabled={scanning}>
                                                    {scanning ? 'Analyzing Prescription...' : 'Process Image'}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
                                                    <Upload size={32} color="var(--primary)" />
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Drop your prescription here or click to browse</p>
                                                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Supports JPG, PNG (Max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="scan-results" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={18} color="#059669" /> Analysis Complete
                                            </h3>
                                            <button className="btn btn-outline btn-sm" onClick={() => { setScanResult(null); setFile(null); }}>Scan Another</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {scanResult.medicines.map((med, idx) => (
                                                <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: '#fff' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <strong style={{ color: 'var(--primary)' }}>{med.name}</strong>
                                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#F1F5F9', borderRadius: '4px' }}>{med.type}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        <div><Calendar size={12} /> {med.duration}</div>
                                                        <div style={{ marginTop: '0.25rem' }}><FileImage size={12} /> {med.dosage}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
                                            <strong style={{ fontSize: '0.85rem', color: '#0369A1', display: 'block', marginBottom: '0.25rem' }}>AI Notes:</strong>
                                            <p style={{ fontSize: '0.85rem', color: '#0C4A6E', margin: 0 }}>{scanResult.doctor_notes}</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* ─── PATHOLOGY & DIAGNOSTICS ─── */}
                            <motion.div id="diagnostics" className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="card-icon" style={{ margin: 0, background: '#F0FDFA', color: '#0D9488' }}>
                                            <Droplet size={22} />
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Pathology & Diagnostics</h2>
                                    </div>
                                    <InfoButton content={{
                                        en: { title: 'Diagnostic Services', helps: 'Book blood tests and body checkups from home.', usage: 'Select a test or package, and our certified technician will visit your home for sample collection. Reports are delivered digitally.' },
                                        hi: { title: 'नैदानिक सेवाए', helps: 'घर से रक्त परीक्षण और शरीर की जांच बुक करें।', usage: 'एक परीक्षण या पैकेज चुनें, और हमारा प्रमाणित तकनीशियन नमूना संग्रह के लिए आपके घर आएगा। रिपोर्ट डिजिटल रूप से वितरित की जाती हैं।' },
                                        te: { title: 'డయాగ్నస్టిక్ సేవలు', helps: 'ఇంటి నుండి రక్త పరీక్షలు మరియు శరీర తనిఖీలను బుక్ చేసుకోండి.', usage: 'పరీక్షను లేదా ప్యాకేజీని ఎంచుకోండి, మా ధృవీకరించబడిన సాంకేతిక నిపుణుడు నమూనా సేకరణ కోసం మీ ఇంటిని సందర్శిస్తారు. నివేదికలు డిజిటల్‌గా అందించబడతాయి.' }
                                    }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                            Get NABL-certified lab reports with home sample collection. Verified technicians and state-of-the-art diagnostic equipment.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {['Full Body Checkup', 'Thyroid Profile', 'Diabetes Screening', 'Lipid Profile'].map(test => (
                                                <div key={test} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                                    <CheckCircle size={14} color="#10B981" /> {test}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Easy Booking</h4>
                                        <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => toast.success("Opening diagnostic selection...")}>
                                            Select Lab Tests
                                        </button>
                                        <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.75rem', color: '#94A3B8' }}>*Sample collection within 2 hours</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ─── BLOOD SERVICES CONSOLIDATED ─── */}
                            {!isDoctor && (
                                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <div className="card-icon" style={{ margin: 0, background: '#FEF2F2', color: '#DC2626' }}>
                                            <Droplet size={22} />
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Integrated Blood Services</h2>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                        Access the unified blood donation network to find donors, check hospital inventory, or post urgent requests.
                                    </p>
                                    <Link to="/dashboard/blood-donation" className="btn btn-primary" style={{ background: '#DC2626', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        Go to Blood Services Hub <ExternalLink size={18} />
                                    </Link>
                                </motion.div>
                            )}
                        </div>

                        {/* ─── SIDEBAR ─── */}
                        <aside>
                            <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Other Connected Services</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <a href="#diagnostics" className="service-side-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ padding: '0.5rem', background: '#F1F5F9', borderRadius: '6px' }}><Calendar size={18} /></div>
                                        <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Lab Tests</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Book doorstep samples</div></div>
                                    </a>
                                    <Link to="/doctors" className="service-side-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ padding: '0.5rem', background: '#F1F5F9', borderRadius: '6px' }}><Info size={18} /></div>
                                        <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Doctor Network</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5,000+ specialists</div></div>
                                    </Link>
                                    <Link to="/hospitals" className="service-side-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ padding: '0.5rem', background: '#F1F5F9', borderRadius: '6px' }}><Phone size={18} /></div>
                                        <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pharmacy Hub</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order medicines online</div></div>
                                    </Link>
                                </div>
                                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                                    <Shield size={24} color="#059669" style={{ marginBottom: '0.5rem' }} />
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Verified & Secure</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>All medical reports and data are encrypted end-to-end.</p>
                                </div>
                            </div>
                        </aside>

                    </div>
                </div>
            </section>
        </div>
    )
}
