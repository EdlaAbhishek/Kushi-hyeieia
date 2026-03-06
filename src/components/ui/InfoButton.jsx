import React, { useState } from 'react'
import { Info, X, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * InfoButton Component
 * Displays an "i" icon that opens a multilingual instruction modal.
 * 
 * @param {Object} content - Object containing translations { en: {}, hi: {}, te: {} }
 * Each translation object should have { title: string, helps: string, usage: string }
 */
export default function InfoButton({ content }) {
    const [isOpen, setIsOpen] = useState(false)
    const [lang, setLang] = useState('en') // 'en', 'hi', 'te'

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिन्दी' },
        { code: 'te', label: 'తెలుగు' }
    ]

    const getLangStrings = (code) => {
        switch (code) {
            case 'hi':
                return { helpsLabel: 'यह कैसे मदद करता है', usageLabel: 'कैसे उपयोग करें' }
            case 'te':
                return { helpsLabel: 'ఇది ఎలా సహాయపడుతుంది', usageLabel: 'ఎలా ఉపయోగించాలి' }
            default:
                return { helpsLabel: 'How it helps', usageLabel: 'How to use' }
        }
    }

    const t = content[lang] || content['en']
    const labels = getLangStrings(lang)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Information / जानकारी / సమాచారం"
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    flexShrink: 0
                }}
            >
                <Info size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="modal-overlay" onClick={() => setIsOpen(false)} style={{ zIndex: 1000 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="modal-content"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '500px', width: '90%', padding: '1.5rem' }}
                        >
                            <button className="modal-close" onClick={() => setIsOpen(false)}>&times;</button>

                            {/* Language Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                <Globe size={18} color="var(--text-muted)" />
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {languages.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => setLang(l.code)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '20px',
                                                border: `1px solid ${lang === l.code ? 'var(--primary)' : 'var(--border)'}`,
                                                background: lang === l.code ? '#EFF6FF' : '#fff',
                                                color: lang === l.code ? 'var(--primary)' : 'var(--text-main)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: lang === l.code ? 600 : 400,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <h2 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '1.5rem' }}>
                                {t.title}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                                        {labels.helpsLabel}
                                    </h3>
                                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        {t.helps}
                                    </p>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
                                        {labels.usageLabel}
                                    </h3>
                                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                                        {t.usage}
                                    </p>
                                </div>
                            </div>

                            <button className="btn btn-outline" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setIsOpen(false)}>
                                Close / बंद करें / మూసివేయు
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
