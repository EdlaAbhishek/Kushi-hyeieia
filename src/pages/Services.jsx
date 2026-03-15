import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Droplet, ScanLine, Upload, FileImage, X, Calendar, Shield, CheckCircle, ExternalLink, Info, Phone, Activity, TestTubes, Languages, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'
import LabTestModal from '../components/LabTestModal'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'

// ─── Helper: Extract text from PDF using pdfjs-dist ─────────────────
async function extractTextFromPDF(file) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
    }
    return fullText.trim()
}

// ─── Helper: Extract text from DOCX using mammoth ───────────────────
async function extractTextFromDOCX(file) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
}

export default function Services() {
    const { user, isDoctor } = useAuth()

    // ─── MODAL STATE ──────────────────────────────────────────────────
    const [isLabModalOpen, setIsLabModalOpen] = useState(false)

    // ─── PRESCRIPTION SCANNER STATE ───────────────────────────────────
    const [file, setFile] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState(null)
    const [originalResult, setOriginalResult] = useState(null) // English result for re-translation
    const [scanLang, setScanLang] = useState('en')
    const [translating, setTranslating] = useState(false)
    const fileInputRef = useRef(null)

    // ─── UI LABELS (static, minimal — kept for UI chrome only) ───────
    const scanLabels = {
        en: {
            analysisComplete: 'Analysis Complete',
            scanAnother: 'Scan Another',
            disclaimer: '⚠️ AI analysis may contain errors. Always follow the doctor\'s prescription.',
            processing: 'Analyzing Prescription...',
            processBtn: 'Analyze Document',
            dropText: 'Drop your prescription here or click to browse',
            fileInfo: 'Supports JPG, PNG, PDF, DOC, DOCX (Max 10MB)',
        },
        hi: {
            analysisComplete: 'विश्लेषण पूर्ण',
            scanAnother: 'दोबारा स्कैन करें',
            disclaimer: '⚠️ AI विश्लेषण में त्रुटियाँ हो सकती हैं। हमेशा डॉक्टर के नुस्खे का पालन करें।',
            processing: 'नुस्खा विश्लेषण हो रहा है...',
            processBtn: 'दस्तावेज़ विश्लेषण करें',
            dropText: 'अपना नुस्खा यहाँ डालें या ब्राउज़ करने के लिए क्लिक करें',
            fileInfo: 'JPG, PNG, PDF, DOC, DOCX सपोर्ट (अधिकतम 10MB)',
        },
        te: {
            analysisComplete: 'విశ్లేషణ పూర్తయింది',
            scanAnother: 'మళ్ళీ స్కాన్ చేయండి',
            disclaimer: '⚠️ AI విశ్లేషణలో తప్పులు ఉండవచ్చు. ఎల్లప్పుడూ డాక్టర్ ప్రిస్క్రిప్షన్ అనుసరించండి.',
            processing: 'ప్రిస్క్రిప్షన్ విశ్లేషిస్తోంది...',
            processBtn: 'డాక్యుమెంట్‌ను విశ్లేషించండి',
            dropText: 'మీ ప్రిస్క్రిప్షన్ ఇక్కడ డ్రాప్ చేయండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి',
            fileInfo: 'JPG, PNG, PDF, DOC, DOCX మద్దతు (గరిష్టం 10MB)',
        }
    }
    const t = scanLabels[scanLang] || scanLabels.en

    // ─── DYNAMIC AI TRANSLATION ──────────────────────────────────────
    const translateResult = useCallback(async (result, lang) => {
        if (lang === 'en') {
            setScanResult(result)
            return
        }
        setTranslating(true)
        try {
            const response = await fetch('/api/translate-prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: result, targetLanguage: lang })
            })
            if (response.ok) {
                const translated = await response.json()
                // Ensure document_type exists so the UI can render it.
                if (!translated.document_type) {
                    translated.document_type = translated.documentType || result.document_type || 'Prescription';
                }
                setScanResult(translated)
            } else {
                // If translation fails, show original with a warning
                toast.error('Translation failed. Showing results in English.', { position: 'bottom-center' })
                setScanResult(result)
            }
        } catch (err) {
            console.error('Translation error:', err)
            toast.error('Translation failed. Showing results in English.', { position: 'bottom-center' })
            setScanResult(result)
        } finally {
            setTranslating(false)
        }
    }, [])

    // ─── LANGUAGE CHANGE HANDLER ─────────────────────────────────────
    const handleLangChange = async (newLang) => {
        setScanLang(newLang)
        if (originalResult) {
            await translateResult(originalResult, newLang)
        }
    }

    // ─── FILE HELPERS ─────────────────────────────────────────────────
    const getFileTypeIcon = (file) => {
        if (!file) return null
        const ext = file.name.split('.').pop().toLowerCase()
        if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️'
        if (ext === 'pdf') return '📄'
        if (['doc', 'docx'].includes(ext)) return '📝'
        return '📄'
    }

    const isImageFile = (file) => {
        return file && (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(file.name.split('.').pop().toLowerCase()))
    }

    // ─── HANDLERS ─────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            const validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
            const ext = selected.name.split('.').pop().toLowerCase()

            if (!validTypes.includes(selected.type) && !validExtensions.includes(ext)) {
                toast.error('Please upload a JPG, PNG, PDF, DOC, or DOCX file.', { position: 'bottom-center' })
                return
            }
            // Validate file size (10MB max for documents)
            if (selected.size > 10 * 1024 * 1024) {
                toast.error('File exceeds 10MB limit.', { position: 'bottom-center' })
                return
            }
            if (file?.__previewUrl) URL.revokeObjectURL(file.__previewUrl)
            setFile(selected)
            setScanResult(null)
            setOriginalResult(null)
        }
    }

    const handleScan = async () => {
        if (!file) return
        setScanning(true)

        try {
            const ext = file.name.split('.').pop().toLowerCase()
            let response

            if (isImageFile(file)) {
                // ── PATH A: Image file → send binary to API ──
                const arrayBuffer = await file.arrayBuffer()
                response = await fetch('/api/analyze-prescription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: arrayBuffer
                })
            } else {
                // ── PATH B: PDF/DOC/DOCX → extract text client-side, send as JSON ──
                let extractedText = ''

                if (ext === 'pdf') {
                    try {
                        extractedText = await extractTextFromPDF(file)
                    } catch (err) {
                        console.error('PDF extraction error:', err)
                        toast.error('Failed to read PDF. The file may be scanned or corrupted.', { position: 'bottom-center' })
                        setScanning(false)
                        return
                    }
                } else if (['doc', 'docx'].includes(ext)) {
                    try {
                        extractedText = await extractTextFromDOCX(file)
                    } catch (err) {
                        console.error('DOCX extraction error:', err)
                        toast.error('Failed to read Word document. The file may be corrupted.', { position: 'bottom-center' })
                        setScanning(false)
                        return
                    }
                }

                if (!extractedText.trim()) {
                    toast.error('No readable text found in this document. Try uploading an image instead.', { position: 'bottom-center' })
                    setScanning(false)
                    return
                }

                response = await fetch('/api/analyze-prescription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ extractedText })
                })
            }

            if (response.ok) {
                const result = await response.json()
                if (result.document_type) {
                    setOriginalResult(result)
                    // If a non-English language is selected, translate immediately
                    if (scanLang !== 'en') {
                        await translateResult(result, scanLang)
                    } else {
                        setScanResult(result)
                    }
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
                : 'Unable to process the document. Please try a different file.'
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
                                        <input type="file" ref={fileInputRef} hidden accept="image/jpeg,image/png,image/jpg,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
                                        {file ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    {isImageFile(file) ? (
                                                        <img src={file.__previewUrl || (file.__previewUrl = URL.createObjectURL(file))} alt="Preview" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    ) : (
                                                        <div style={{ width: '120px', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#F8FAFC', border: '1px solid var(--border)' }}>
                                                            <span style={{ fontSize: '3rem' }}>{getFileTypeIcon(file)}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>{file.name.split('.').pop()}</span>
                                                        </div>
                                                    )}
                                                    <ActionButton variant="danger" className="btn-icon" style={{ position: 'absolute', top: '-8px', right: '-8px' }} onClick={(e) => { e.stopPropagation(); setFile(null); setOriginalResult(null); }}>
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
                                                    <select value={scanLang} onChange={(e) => handleLangChange(e.target.value)} disabled={translating} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#334155', cursor: translating ? 'wait' : 'pointer', outline: 'none' }}>
                                                        <option value="en">English</option>
                                                        <option value="hi">हिंदी</option>
                                                        <option value="te">తెలుగు</option>
                                                    </select>
                                                </div>
                                                {translating && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" />}
                                                <button className="btn btn-outline btn-sm" onClick={() => { setScanResult(null); setFile(null); setOriginalResult(null); }}>{t.scanAnother}</button>
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
                                                            ? `${scanResult.medicines.length} medicine(s) found.`
                                                            : 'Prescription detected, but specific medicines could not be clearly identified.'
                                                        }
                                                    </p>
                                                </div>
                                            ) : scanResult.document_type?.toLowerCase() !== 'general' ? (
                                                <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#0369A1', display: 'block', marginBottom: '0.25rem' }}>Summary:</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#0C4A6E', margin: 0 }}>
                                                        {scanResult.summary || 'Extracted details below.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #94A3B8' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Note:</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                                                        The system could not automatically structure this document. Please review the raw extracted text below.
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
                                                                        <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{med.name}</strong>
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
                                <Link to="/hospitals" className="service-side-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: '#F1F5F9', borderRadius: '6px' }}><Info size={18} /></div>
                                    <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Hospital Network</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1,000+ partner hospitals</div></div>
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
