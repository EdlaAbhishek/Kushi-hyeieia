import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Droplet, ScanLine, Upload, FileImage, X, Calendar, Shield, CheckCircle, ExternalLink, Info, Phone, Activity, TestTubes, Languages, FileText } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'
import LabTestModal from '../components/LabTestModal'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'

export default function Services() {
    const { user, isDoctor } = useAuth()

    // ─── MODAL STATE ──────────────────────────────────────────────────
    const [isLabModalOpen, setIsLabModalOpen] = useState(false)

    // ─── PRESCRIPTION SCANNER STATE ───────────────────────────────────
    const [file, setFile] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState(null)
    const [scanLang, setScanLang] = useState('en')
    const fileInputRef = useRef(null)

    // ─── SCAN RESULT TRANSLATIONS ────────────────────────────────────
    const scanLabels = {
        en: {
            analysisComplete: 'Analysis Complete',
            scanAnother: 'Scan Another',
            dosage: 'Dosage',
            frequency: 'Frequency',
            duration: 'Duration',
            notes: 'Notes',
            aiNotes: 'AI Notes',
            disclaimer: '⚠️ AI analysis may contain errors. Always follow the doctor\'s prescription.',
            processing: 'Analyzing Prescription...',
            processBtn: 'Process Image',
            dropText: 'Drop your prescription here or click to browse',
            fileInfo: 'Supports JPG, PNG (Max 5MB)',
            medicineType: 'Type',
            purpose: 'Purpose',
            correctedFrom: 'OCR Corrected from',
            unverifiedMsg: 'Drug information unavailable but detected in prescription.',
            verified: 'Verified',
            unverified: 'Unverified'
        },
        hi: {
            analysisComplete: 'विश्लेषण पूर्ण',
            scanAnother: 'दोबारा स्कैन करें',
            dosage: 'खुराक',
            frequency: 'आवृत्ति',
            duration: 'अवधि',
            notes: 'टिप्पणी',
            aiNotes: 'AI नोट्स',
            disclaimer: '⚠️ AI विश्लेषण में त्रुटियाँ हो सकती हैं। हमेशा डॉक्टर के नुस्खे का पालन करें।',
            processing: 'नुस्खा विश्लेषण हो रहा है...',
            processBtn: 'छवि प्रोसेस करें',
            dropText: 'अपना नुस्खा यहाँ डालें या ब्राउज़ करने के लिए क्लिक करें',
            fileInfo: 'JPG, PNG सपोर्ट (अधिकतम 5MB)',
            medicineType: 'प्रकार',
            purpose: 'उद्देश्य',
            correctedFrom: 'OCR सुधार',
            unverifiedMsg: 'दवा की जानकारी अनुपलब्ध है लेकिन नुस्खे में पाई गई।',
            verified: 'सत्यापित',
            unverified: 'असत्यापित'
        },
        te: {
            analysisComplete: 'విశ్లేషణ పూర్తయింది',
            scanAnother: 'మళ్ళీ స్కాన్ చేయండి',
            dosage: 'మోతాదు',
            frequency: 'తరచుదనం',
            duration: 'వ్యవధి',
            notes: 'గమనికలు',
            aiNotes: 'AI గమనికలు',
            disclaimer: '⚠️ AI విశ్లేషణలో తప్పులు ఉండవచ్చు. ఎల్లప్పుడూ డాక్టర్ ప్రిస్క్రిప్షన్ అనుసరించండి.',
            processing: 'ప్రిస్క్రిప్షన్ విశ్లేషిస్తోంది...',
            processBtn: 'చిత్రాన్ని ప్రాసెస్ చేయండి',
            dropText: 'మీ ప్రిస్క్రిప్షన్ ఇక్కడ డ్రాప్ చేయండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి',
            fileInfo: 'JPG, PNG మద్దతు (గరిష్టం 5MB)',
            medicineType: 'రకం',
            purpose: 'ఉద్దేశ్యం',
            correctedFrom: 'OCR సరిదిద్దబడింది',
            unverifiedMsg: 'ఔషధ సమాచారం అందుబాటులో లేదు కానీ ప్రిస్క్రిప్షన్‌లో గుర్తించబడింది.',
            verified: 'ధృవీకరించబడింది',
            unverified: 'ధృవీకరించబడలేదు'
        }
    }
    const t = scanLabels[scanLang] || scanLabels.en

    // ─── CONTENT TRANSLATION (translate actual medicine data) ────────
    const medicalTerms = {
        hi: {
            // Frequency patterns
            'od': 'दिन में एक बार', 'bd': 'दिन में दो बार', 'tid': 'दिन में तीन बार',
            'qid': 'दिन में चार बार', 'sos': 'ज़रूरत पर', 'hs': 'सोने से पहले', 'stat': 'तुरंत',
            // Instructions
            'after food': 'खाने के बाद', 'before food': 'खाने से पहले',
            'with food': 'खाने के साथ', 'empty stomach': 'खाली पेट',
            'morning': 'सुबह', 'evening': 'शाम', 'night': 'रात',
            // Duration units
            'days': 'दिन', 'day': 'दिन', 'weeks': 'सप्ताह', 'week': 'सप्ताह',
            'months': 'महीने', 'month': 'महीना',
            // Fallback text from backend
            'Raw Prescription Text': 'कच्चा नुस्खा टेक्स्ट',
            'No specific patient notes detected.': 'कोई विशेष रोगी नोट नहीं मिले।',
            'Could not read prescription. Please upload a clearer image.': 'नुस्खा नहीं पढ़ा जा सका। कृपया स्पष्ट छवि अपलोड करें।',
            'No distinct medicines were found. Please ensure the image is a clear prescription, not a receipt or report.': 'कोई दवा नहीं मिली। कृपया सुनिश्चित करें कि छवि एक स्पष्ट नुस्खा है, रसीद या रिपोर्ट नहीं।',
            'No Medicines Detected': 'कोई दवा नहीं मिली',
            // Medicine types
            'tab': 'गोली', 'tablet': 'गोली', 'cap': 'कैप्सूल', 'capsule': 'कैप्सूल',
            'syr': 'सिरप', 'syrup': 'सिरप', 'inj': 'इंजेक्शन', 'injection': 'इंजेक्शन',
            'oint': 'मलहम', 'drp': 'ड्रॉप',
            'for': 'के लिए'
        },
        te: {
            // Frequency patterns
            'od': 'రోజుకు ఒకసారి', 'bd': 'రోజుకు రెండుసార్లు', 'tid': 'రోజుకు మూడుసార్లు',
            'qid': 'రోజుకు నాలుగుసార్లు', 'sos': 'అవసరమైనప్పుడు', 'hs': 'నిద్రపోయే ముందు', 'stat': 'వెంటనే',
            // Instructions
            'after food': 'భోజనం తర్వాత', 'before food': 'భోజనానికి ముందు',
            'with food': 'భోజనంతో', 'empty stomach': 'ఖాళీ కడుపుతో',
            'morning': 'ఉదయం', 'evening': 'సాయంత్రం', 'night': 'రాత్రి',
            // Duration units
            'days': 'రోజులు', 'day': 'రోజు', 'weeks': 'వారాలు', 'week': 'వారం',
            'months': 'నెలలు', 'month': 'నెల',
            // Fallback text from backend
            'Raw Prescription Text': 'ముడి ప్రిస్క్రిప్షన్ టెక్స్ట్',
            'No specific patient notes detected.': 'ప్రత్యేక రోగి గమనికలు కనుగొనబడలేదు.',
            'Could not read prescription. Please upload a clearer image.': 'ప్రిస్క్రిప్షన్ చదవలేకపోయింది. దయచేసి స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి.',
            'No distinct medicines were found. Please ensure the image is a clear prescription, not a receipt or report.': 'ఎలాంటి మందులు కనుగొనబడలేదు. దయచేసి చిత్రం స్పష్టమైన ప్రిస్క్రిప్షన్ అని నిర్ధారించుకోండి, రసీదు లేదా నివేదిక కాదు.',
            'No Medicines Detected': 'మందులు కనుగొనబడలేదు',
            // Medicine types
            'tab': 'టాబ్లెట్', 'tablet': 'టాబ్లెట్', 'cap': 'క్యాప్సూల్', 'capsule': 'క్యాప్సూల్',
            'syr': 'సిరప్', 'syrup': 'సిరప్', 'inj': 'ఇంజెక్షన్', 'injection': 'ఇంజెక్షన్',
            'oint': 'మలహం', 'drp': 'డ్రాప్',
            'for': 'కోసం'
        }
    }

    // Translate a frequency like "1-0-1" into local language
    const translateFrequency = (freq, lang) => {
        if (lang === 'en' || !freq || freq === '—') return freq
        const dict = medicalTerms[lang]
        if (!dict) return freq
        // Exact match first (od, bd, etc.)
        const lowerFreq = freq.toLowerCase().trim()
        if (dict[lowerFreq]) return dict[lowerFreq]
        // Pattern like "1-0-1" → translate to local
        const match = freq.match(/^(\d)-(\d)-(\d)$/)
        if (match) {
            const parts = lang === 'hi'
                ? ['सुबह', 'दोपहर', 'रात']
                : ['ఉదయం', 'మధ్యాహ్నం', 'రాత్రి']
            const labels = []
            if (match[1] !== '0') labels.push(`${parts[0]} ${match[1]}`)
            if (match[2] !== '0') labels.push(`${parts[1]} ${match[2]}`)
            if (match[3] !== '0') labels.push(`${parts[2]} ${match[3]}`)
            return labels.join(', ') || freq
        }
        return freq
    }

    // Translate duration like "5 days" or "2 weeks"
    const translateDuration = (dur, lang) => {
        if (lang === 'en' || !dur || dur === '—') return dur
        const dict = medicalTerms[lang]
        if (!dict) return dur
        let translated = dur
        // Replace "for" keyword
        translated = translated.replace(/\bfor\b/gi, dict['for'] || 'for')
        // Replace duration units
        for (const unit of ['days', 'day', 'weeks', 'week', 'months', 'month']) {
            const regex = new RegExp(`\\b${unit}\\b`, 'gi')
            translated = translated.replace(regex, dict[unit] || unit)
        }
        return translated
    }

    // Translate notes/instructions
    const translateNotes = (notes, lang) => {
        if (lang === 'en' || !notes || notes === '—') return notes
        const dict = medicalTerms[lang]
        if (!dict) return notes
        let translated = notes
        // Direct match for full phrases
        if (dict[notes]) return dict[notes]
        // Replace known instruction phrases
        for (const phrase of ['after food', 'before food', 'with food', 'empty stomach', 'morning', 'evening', 'night']) {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi')
            translated = translated.replace(regex, dict[phrase] || phrase)
        }
        return translated
    }

    // Translate medicine name prefix (Tab → गोली etc.)
    const translateMedicineName = (name, lang) => {
        if (lang === 'en' || !name) return name
        const dict = medicalTerms[lang]
        if (!dict) return name
        if (dict[name]) return dict[name]
        // Replace prefix like "Tab " → "గోలీ "
        for (const prefix of ['tablet', 'tab', 'capsule', 'cap', 'syrup', 'syr', 'injection', 'inj', 'oint', 'drp']) {
            const regex = new RegExp(`^${prefix}\\b\\.?\\s*`, 'i')
            if (regex.test(name)) {
                return name.replace(regex, dict[prefix] + ' ')
            }
        }
        return name
    }

    // ─── HANDLERS ─────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
            if (!validTypes.includes(selected.type)) {
                toast.error('Please upload a JPG or PNG image.', { position: 'bottom-center' })
                return
            }
            // Validate file size (5MB max)
            if (selected.size > 5 * 1024 * 1024) {
                toast.error('Image exceeds 5MB limit. Please upload a smaller image.', { position: 'bottom-center' })
                return
            }
            if (file?.__previewUrl) URL.revokeObjectURL(file.__previewUrl)
            setFile(selected)
            setScanResult(null)
        }
    }

    const handleScan = async () => {
        if (!file) return
        setScanning(true)

        try {
            // ── PRIMARY: Azure Vision OCR via /api/analyze-prescription ──
            const arrayBuffer = await file.arrayBuffer()
            const response = await fetch('/api/analyze-prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: arrayBuffer
            })

            if (response.ok) {
                const result = await response.json()

                // Allow the new general document structure and exact prescription structure to pass through
                if (result.document_type) {
                    setScanResult(result)
                    return
                }
            } else {
                const errData = await response.json().catch(() => ({}))
                console.warn('API failed:', response.status, errData)
                throw new Error(errData.error || 'Failed to analyze prescription.')
            }

        } catch (error) {
            console.error('Prescription Scan Error:', error)
            const errorMsg = error.message && !error.message.includes('fetch')
                ? error.message
                : 'Unable to clearly interpret the prescription. Please upload a clearer image.'
            toast.error(errorMsg, { position: 'bottom-center' })
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="services-page">
            <PageHeader
                title="Specialized Medical Services"
                description="Dedicated tools for prescriptions, blood services, and laboratory connections."
            />
            <SectionContainer className="bg-surface" style={{ paddingTop: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem', alignItems: 'start' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* ─── AICat (Internal Scanner) ─── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <DashboardCard
                                title="AI Prescription Scanner"
                                icon={ScanLine}
                                action={<InfoTooltip content={{
                                    en: { title: 'Prescription Scanner', helps: 'Helps you understand handwritten or printed prescriptions using AI.', usage: 'Upload a clear image of your prescription. Our AI will extract medicine names, dosages, and durations for your reference.' },
                                    hi: { title: 'प्रिस्क्रिप्शन स्कैनर', helps: 'AI का उपयोग करके हस्तलिखित या मुद्रित नुस्खों को समझने में आपकी मदद करता है।', usage: 'अपने नुस्खे की एक स्पष्ट छवि अपलोड करें। हमारा AI आपके संदर्भ के लिए दवा के नाम, खुराक और अवधि निकालेगा।' },
                                    te: { title: 'ప్రిస్క్రిప్షన్ స్కానర్', helps: 'AIని ఉపయోగించి చేతితో రాసిన లేదా ముద్రించిన ప్రిస్క్రిప్షన్లను అర్థం చేసుకోవడంలో మీకు సహాయపడుతుంది.', usage: 'మీ ప్రిస్క్రిప్షన్ యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి. మా AI మీ సూచన కోసం ఔషధాల పేర్లు, మోతాదులు మరియు వ్యవధిని సేకరిస్తుంది.' }
                                }} />}
                            >

                                {!scanResult ? (
                                    <div className="scan-dropzone" style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                                        <input type="file" ref={fileInputRef} hidden accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} />
                                        {file ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img src={file.__previewUrl || (file.__previewUrl = URL.createObjectURL(file))} alt="Preview" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <ActionButton variant="danger" className="btn-icon" style={{ position: 'absolute', top: '-8px', right: '-8px' }} onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                                        <X size={14} />
                                                    </ActionButton>
                                                </div>
                                                <p style={{ fontWeight: 600 }}>{file.name}</p>
                                                <ActionButton variant="primary" onClick={(e) => { e.stopPropagation(); handleScan(); }} disabled={scanning}>
                                                    {scanning ? t.processing : t.processBtn}
                                                </ActionButton>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
                                                    <Upload size={32} color="var(--primary)" />
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t.dropText}</p>
                                                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{t.fileInfo}</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="scan-results" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={18} color="#059669" /> {t.analysisComplete}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#F1F5F9', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
                                                    <Languages size={14} color="#64748B" />
                                                    <select value={scanLang} onChange={(e) => setScanLang(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', outline: 'none' }}>
                                                        <option value="en">English</option>
                                                        <option value="hi">हिंदी</option>
                                                        <option value="te">తెలుగు</option>
                                                    </select>
                                                </div>
                                                <button className="btn btn-outline btn-sm" onClick={() => { setScanResult(null); setFile(null); }}>{t.scanAnother}</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block' }}>Document Type:</strong>
                                                    <span style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 'bold', textTransform: 'capitalize' }}>{scanResult.document_type.replace('_', ' ')}</span>
                                                </div>
                                                <FileText size={24} color="#64748B" />
                                            </div>

                                            {scanResult.document_type?.toLowerCase() === 'prescription' ? (
                                                <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#0369A1', display: 'block', marginBottom: '0.25rem' }}>Summary:</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#0C4A6E', margin: 0 }}>
                                                        {scanResult.medicines && scanResult.medicines.length > 0 
                                                            ? (scanLang === 'en' ? `Found ${scanResult.medicines.length} medicine(s) in your prescription.` : (scanLang === 'hi' ? `आपके नुस्खे में ${scanResult.medicines.length} दवा(एं) मिलीं।` : `మీ ప్రిస్క్రిప్షన్‌లో ${scanResult.medicines.length} మందు(లు) కనుగొనబడ్డాయి.`))
                                                            : (scanLang === 'en' ? 'Prescription detected, but specific medicines could not be clearly identified.' : (scanLang === 'hi' ? 'नुस्खा मिला, लेकिन विशिष्ट दवाओं की स्पष्ट पहचान नहीं हो सकी।' : 'ప్రిస్క్రిప్షన్ కనుగొనబడింది, కానీ నిర్దిష్ట మందులను స్పష్టంగా గుర్తించలేకపోయింది.'))
                                                        }
                                                    </p>
                                                </div>
                                            ) : scanResult.document_type?.toLowerCase() !== 'general' ? (
                                                <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#0369A1', display: 'block', marginBottom: '0.25rem' }}>Summary:</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#0C4A6E', margin: 0 }}>
                                                        {scanResult.summary ? translateNotes(scanResult.summary, scanLang) : 'Extracted details below.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #94A3B8' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Note:</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                                                        {scanLang === 'en' ? 'The system could not automatically structure this document. Please review the raw extracted text below.' : (scanLang === 'hi' ? 'सिस्टम इस दस्तावेज़ को स्वचालित रूप से स्वरूपित नहीं कर सका। कृपया नीचे दिए गए मूल रूप से निकाले गए पाठ की समीक्षा करें।' : 'సిస్టమ్ ఈ పత్రాన్ని స్వయంచాలకంగా ఫార్మాట్ చేయలేకపోయింది. దయచేసి దిగువన తీసిన ముడి వచనాన్ని సమీక్షించండి.')}
                                                    </p>
                                                </div>
                                            )}

                                            {/* ─── PRESCRIPTION: Medicine Cards ─── */}
                                            {scanResult.document_type?.toLowerCase() === 'prescription' && scanResult.medicines && scanResult.medicines.length > 0 && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <h4 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        💊 Detected Medicines ({scanResult.medicines.length})
                                                    </h4>

                                                    {scanResult.medicines.map((med, idx) => {
                                                        const confidenceColors = {
                                                            high: { bg: '#D1FAE5', text: '#065F46', border: '#10B981', label: '✓ High Confidence' },
                                                            medium: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B', label: '~ Medium Confidence' },
                                                            low: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', label: '? Low Confidence' }
                                                        }
                                                        const conf = confidenceColors[med.confidence] || confidenceColors.low

                                                        return (
                                                            <div key={idx} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: '#FFFFFF', marginBottom: '1rem', borderLeft: `4px solid #3B82F6` }}>
                                                                {/* Header: Name + Badges */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                        <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{translateMedicineName(med.name, scanLang)}</strong>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: conf.bg, color: conf.text, fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                                                                            {conf.label}
                                                                        </span>
                                                                    </div>
                                                                    <span style={{ background: '#E2E8F0', color: '#475569', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 500 }}>
                                                                        {med.type}
                                                                    </span>
                                                                </div>

                                                                {/* Uses for */}
                                                                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, marginBottom: '0.6rem' }}>
                                                                    <strong style={{ color: '#475569' }}>Uses for:</strong>{' '}
                                                                    <span style={{ color: '#0F172A' }}>{med.purpose}</span>
                                                                </div>

                                                                {/* Does */}
                                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                                    {med.instructions && (
                                                                        <div><strong>Does:</strong> {med.instructions}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* ─── PRESCRIPTION: Fallback if empty ─── */}
                                            {scanResult.document_type?.toLowerCase() === 'prescription' && (!scanResult.medicines || scanResult.medicines.length === 0) && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #94A3B8' }}>
                                                        <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Extracted Text:</strong>
                                                        <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {scanResult.raw_text || "The image was processed, but no readable text was returned by the scanner."}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ─── BILL ─── */}
                                            {scanResult.document_type === 'bill' && scanResult.extracted_data && scanResult.extracted_data.length > 0 && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <h4 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                        Extracted Information
                                                    </h4>
                                                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                                            <thead style={{ background: '#F8FAFC' }}>
                                                                <tr>
                                                                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>Item</th>
                                                                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {scanResult.extracted_data.map((item, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <td style={{ padding: '0.75rem 1rem', fontWeight: item.item === 'TOTAL AMOUNT' ? 'bold' : 'normal' }}>{item.item}</td>
                                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: item.item === 'TOTAL AMOUNT' ? 'bold' : 'normal', color: item.item === 'TOTAL AMOUNT' ? 'var(--primary)' : 'inherit' }}>₹{item.amount}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ─── LAB REPORT ─── */}
                                            {scanResult.document_type === 'lab_report' && scanResult.extracted_data && scanResult.extracted_data.length > 0 && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <h4 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                        Extracted Information
                                                    </h4>
                                                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                                            <thead style={{ background: '#F8FAFC' }}>
                                                                <tr>
                                                                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>Test Name</th>
                                                                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Result</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {scanResult.extracted_data.map((item, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: '500' }}>{item.test_name}</td>
                                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{item.result} {item.unit}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {scanResult.raw_text && (
                                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Raw Extracted Text:</strong>
                                                <pre style={{ margin: 0, padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                                                    {scanResult.raw_text}
                                                </pre>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid #F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={16} color="#D97706" />
                                            <p style={{ fontSize: '0.8rem', color: '#92400E', margin: 0 }}>{t.disclaimer}</p>
                                        </div>
                                    </div>
                                )}
                            </DashboardCard>
                        </motion.div>

                        {/* ─── PATHOLOGY & DIAGNOSTICS ─── */}
                        <motion.div id="diagnostics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <DashboardCard
                                title="Pathology & Diagnostics"
                                icon={Droplet}
                                action={<InfoTooltip content={{
                                    en: { title: 'Diagnostic Services', helps: 'Book blood tests and body checkups from home.', usage: 'Select a test or package, and our certified technician will visit your home for sample collection. Reports are delivered digitally.' },
                                    hi: { title: 'नैदानिक सेवाए', helps: 'घर से रक्त परीक्षण और शरीर की जांच बुक करें।', usage: 'एक परीक्षण या पैकेज चुनें, और हमारा प्रमाणित तकनीशियन नमूना संग्रह के लिए आपके घर आएगा। रिपोर्ट डिजिटल रूप से वितरित की जाती हैं।' },
                                    te: { title: 'డయాగ్నస్టిక్ సేవలు', helps: 'ఇంటి నుండి రక్త పరీక్షలు మరియు శరీర తనిఖీలను బుక్ చేసుకోండి.', usage: 'పరీక్షను లేదా ప్యాకేజీని ఎంచుకోండి, మా ధృవీకరించబడిన సాంకేతిక నిపుణుడు నమూనా సేకరణ కోసం మీ ఇంటిని సందర్శిస్తారు. నివేదికలు డిజిటల్‌గా అందించబడతాయి.' }
                                }} />}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                            Get NABL-certified lab reports with home sample collection. Verified technicians and state-of-the-art diagnostic equipment.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                            {['Full Body Checkup', 'Thyroid Profile', 'Diabetes Screening', 'Lipid Profile'].map(test => (
                                                <div key={test} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                                    <CheckCircle size={14} color="#10B981" /> {test}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', width: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>Easy Booking</h4>
                                        <ActionButton variant="primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem' }} onClick={() => setIsLabModalOpen(true)}>
                                            Select Lab Tests
                                        </ActionButton>
                                        <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.75rem', color: '#94A3B8' }}>*Sample collection within 2 hours</p>
                                    </div>
                                </div>
                            </DashboardCard>
                        </motion.div>

                        {/* ─── BLOOD SERVICES CONSOLIDATED ─── */}
                        {!isDoctor && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <DashboardCard title="Integrated Blood Services" icon={Droplet}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                        Access the unified blood donation network to find donors, check hospital inventory, or post urgent requests.
                                    </p>
                                    <ActionButton to="/dashboard/blood-donation" variant="danger" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        Go to Blood Services Hub <ExternalLink size={18} />
                                    </ActionButton>
                                </DashboardCard>
                            </motion.div>
                        )}
                    </div>

                    {/* ─── SIDEBAR ─── */}
                    <aside>
                        <DashboardCard title="Other Connected Services" style={{ position: 'sticky', top: '2rem' }}>
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
                        </DashboardCard>
                    </aside>

                </div>
            </SectionContainer>

            <LabTestModal
                isOpen={isLabModalOpen}
                onClose={() => setIsLabModalOpen(false)}
            />
        </div>
    )
}
