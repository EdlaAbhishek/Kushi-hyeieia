import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../services/AuthContext'
import { Mic, MicOff, Volume2, VolumeX, Languages, Sparkles, AlertCircle, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AiChat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m Kushi Care AI, your healthcare assistant. How can I help you today?\n\n_I can provide general health guidance, symptom triage, and wellness tips. Please consult a registered doctor on Kushi Hygieia for medical treatment._'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [language, setLanguage] = useState('en')
    const messagesEndRef = useRef(null)

    // ─── VOICE STATE ──────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const recognitionRef = useRef(null)
    const currentUtteranceRef = useRef(null)
    const audioPlayerRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, loading])

    const userName = user?.user_metadata?.full_name || 'You'

    // ─── LANGUAGE MAP ─────────────────────────────────────────────────
    const langConfig = {
        en: { label: 'English', speechLang: 'en-IN', voiceLang: 'en-IN' },
        hi: { label: 'हिंदी', speechLang: 'hi-IN', voiceLang: 'hi-IN' },
        te: { label: 'తెలుగు', speechLang: 'te-IN', voiceLang: 'te-IN' }
    }

    // ─── VOICE INPUT (Browser-Native Web Speech API with Cloud Fallback) ─
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch {
                // Ignore if already stopped
            }
        }
        setIsListening(false)
    }, [])

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (SpeechRecognition) {
            try {
                if (recognitionRef.current) {
                    try { recognitionRef.current.abort() } catch { /* ignore */ }
                }

                const recognition = new SpeechRecognition()
                recognitionRef.current = recognition
                recognition.lang = langConfig[language]?.speechLang || 'en-IN'
                recognition.continuous = false
                recognition.interimResults = true

                recognition.onstart = () => {
                    setIsListening(true)
                    toast.success('Listening... Speak now', { id: 'voice-status', position: 'bottom-center' })
                }

                recognition.onresult = (event) => {
                    let transcript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript
                    }
                    if (transcript) {
                        setInput(prev => {
                            // If user is speaking, replace interim or append
                            const base = prev.trim()
                            return base ? `${base} ${transcript}` : transcript
                        })
                    }
                }

                recognition.onerror = (event) => {
                    console.warn('Speech recognition event error:', event.error)
                    setIsListening(false)
                    if (event.error === 'not-allowed') {
                        toast.error('Microphone permission denied.', { id: 'voice-status', position: 'bottom-center' })
                    } else if (event.error !== 'no-speech') {
                        toast.error(`Voice error: ${event.error}`, { id: 'voice-status', position: 'bottom-center' })
                    }
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognition.start()
            } catch (err) {
                console.error('Speech recognition start failed:', err)
                setIsListening(false)
                toast.error('Could not start voice recognition.', { position: 'bottom-center' })
            }
        } else {
            toast.error('Voice recognition is not supported in this browser. Please use Chrome or Edge.', { position: 'bottom-center' })
        }
    }, [language])

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [isListening, startListening, stopListening])

    // Clean up recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort() } catch { /* ignore */ }
            }
        }
    }, [])

    // ─── TEXT-TO-SPEECH (Browser-Native SpeechSynthesis) ──────────────
    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            audioPlayerRef.current.currentTime = 0
        }
        setIsSpeaking(false)
    }, [])

    const speakText = useCallback((text) => {
        if (!text) return
        stopSpeaking()

        // Clean markdown symbols, emoji, asterisks, brackets
        const cleanText = text
            .replace(/[*#`_~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .trim()

        if (!cleanText) return

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance(cleanText)
                currentUtteranceRef.current = utterance

                const targetLang = langConfig[language]?.voiceLang || 'en-IN'
                utterance.lang = targetLang
                utterance.rate = 0.95
                utterance.pitch = 1.0

                // Attempt to select voice matching language
                const voices = window.speechSynthesis.getVoices()
                if (voices && voices.length > 0) {
                    const matchedVoice = voices.find(v => v.lang.startsWith(language) || v.lang.replace('_', '-').includes(targetLang))
                    if (matchedVoice) {
                        utterance.voice = matchedVoice
                    }
                }

                utterance.onstart = () => setIsSpeaking(true)
                utterance.onend = () => setIsSpeaking(false)
                utterance.onerror = (e) => {
                    console.warn('Speech synthesis error:', e)
                    setIsSpeaking(false)
                }

                window.speechSynthesis.speak(utterance)
                setIsSpeaking(true)
            } catch (err) {
                console.error('Speech synthesis execution failed:', err)
                setIsSpeaking(false)
            }
        } else {
            toast.error('Text-to-speech is not supported by your browser.', { position: 'bottom-center' })
        }
    }, [language, stopSpeaking])

    // Cancel speech on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    // ─── CLEAR CHAT ───────────────────────────────────────────────────
    const handleClearChat = () => {
        stopSpeaking()
        stopListening()
        setMessages([
            {
                role: 'assistant',
                content: 'Chat cleared. How can I help you today?\n\n_Ask any health question or describe your symptoms for guidance._'
            }
        ])
        setInput('')
    }

    // ─── SEND MESSAGE ─────────────────────────────────────────────────
    const handleSend = async (e, directText = null) => {
        if (e && e.preventDefault) e.preventDefault()
        const textToSend = directText || input
        const trimmed = textToSend.trim()
        if (!trimmed || loading) return

        stopSpeaking()
        stopListening()

        const userMsg = { role: 'user', content: trimmed }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        const isEmergency = isEmergencyQuery(trimmed)

        try {
            let replyText = ''

            // 1. Try serverless backend route (/api/gemini-chat)
            try {
                const response = await fetch('/api/gemini-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: newMessages.map(m => ({
                            role: m.role,
                            content: m.content
                        })),
                        language
                    })
                })

                if (response.ok) {
                    const data = await response.json().catch(() => null)
                    if (data?.reply) {
                        replyText = data.reply
                    }
                }
            } catch (serverErr) {
                console.warn('[Kushi AI] Backend API route not responding, initiating resilient fallback:', serverErr.message)
            }

            // 2. Direct client-side OpenRouter fallback with active model cascade
            if (!replyText) {
                const clientKey = import.meta.env.VITE_OPENROUTER_API_KEY
                if (clientKey) {
                    const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
                    const langName = langMap[language] || ''
                    const langInstruction = langName && language !== 'en'
                        ? `\n\nIMPORTANT: Respond entirely in ${langName} (${language} script). Keep medical terms in English where needed for clarity.`
                        : ''

                    const candidateModels = [
                        import.meta.env.VITE_OPENROUTER_MODEL,
                        'nvidia/nemotron-3-ultra-550b-a55b:free',
                        'qwen/qwen3.8-27b:free',
                        'liquid/lfm-2.5-2.6b:free',
                        'google/gemma-4-26b-a4b-it:free',
                        'nvidia/nemotron-3.5-lightning:free'
                    ].filter(m => m && !m.includes('nex-agi'))

                    for (const modelName of candidateModels) {
                        try {
                            const clientRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${clientKey}`,
                                    'Content-Type': 'application/json',
                                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://kushihygieia.in',
                                    'X-Title': 'Kushi Hygieia'
                                },
                                body: JSON.stringify({
                                    model: modelName,
                                    messages: [
                                        {
                                            role: 'system',
                                            content: `You are Kushi Care AI, a helpful, empathetic healthcare assistant for the Kushi Hygieia platform. Provide general health guidance, wellness tips, and first-aid information. Never diagnose conditions or prescribe medicines. Always advise consulting a qualified doctor.${langInstruction}`
                                        },
                                        ...newMessages.slice(-6).map(m => ({
                                            role: m.role === 'user' ? 'user' : 'assistant',
                                            content: m.content
                                        }))
                                    ],
                                    max_tokens: 500
                                })
                            })

                            if (clientRes.ok) {
                                const cData = await clientRes.json().catch(() => ({}))
                                const choice = cData?.choices?.[0]
                                let raw = choice?.message?.content || choice?.message?.reasoning
                                if (raw) {
                                    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
                                    if (raw) {
                                        replyText = raw
                                        break
                                    }
                                }
                            }
                        } catch (directModelErr) {
                            console.warn(`[Kushi AI] Direct model ${modelName} error:`, directModelErr.message)
                        }
                    }
                }
            }

            // 3. Clinical Knowledge Engine Fallback (guarantees a safe, accurate response even offline)
            if (!replyText) {
                const guidance = generateHealthGuidance(trimmed, language)
                replyText = guidance.content
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: replyText,
                    emergency: isEmergency
                }
            ])
        } catch (err) {
            console.error('[Kushi AI Error]:', err)
            // Emergency / Clinical emergency-proof response
            const guidance = generateHealthGuidance(trimmed, language)
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: guidance.content,
                    emergency: guidance.isEmergency
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    // ─── SUGGESTED PROMPT CHIPS ───────────────────────────────────────
    const promptChips = {
        en: [
            '🌡️ I have a mild fever',
            '🧠 Quick remedies for headache',
            '🫁 Sore throat & dry cough',
            '🥣 Stomach acidity relief',
            '🚨 Emergency signs to watch for'
        ],
        hi: [
            '🌡️ मुझे हल्का बुखार है',
            '🧠 सिरदर्द से तुरंत आराम',
            '🫁 गले में खराश और खांसी',
            '🥣 पेट में गैस और अपच'
        ],
        te: [
            '🌡️ నాకు జ్వరం ఉంది, ఏమి చేయాలి?',
            '🧠 తలనొప్పి నివారణ చిట్కాలు',
            '🫁 గొంతు నొప్పి మరియు దగ్గు',
            '🥣 కడుపు నొప్పి మరియు ఎసిడిటీ'
        ]
    }

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Sparkles size={28} style={{ color: 'var(--primary, #0D9488)' }} />
                                Kushi Care AI
                            </h1>
                            <p className="page-subtitle">Your 24/7 intelligent healthcare assistant — instant symptom triage & medical guidance.</p>
                        </div>
                        <button
                            onClick={handleClearChat}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            title="Start a new conversation"
                        >
                            <Trash2 size={15} /> New Chat
                        </button>
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: '1rem' }}>
                <div className="container">
                    {/* ─── LANGUAGE & STATUS BAR ─── */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1.25rem',
                        background: '#F8FAFC',
                        borderRadius: '14px 14px 0 0',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderBottom: 'none',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#475569' }}>
                            <Languages size={18} style={{ color: 'var(--primary, #0D9488)' }} />
                            <span style={{ fontWeight: 600 }}>Chat Language:</span>
                            <select
                                value={language}
                                onChange={(e) => {
                                    setLanguage(e.target.value)
                                    stopSpeaking()
                                }}
                                style={{
                                    border: '1px solid #CBD5E1',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.85rem',
                                    color: '#1E293B',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontWeight: 500
                                }}
                            >
                                <option value="en">English (India)</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10B981', fontWeight: 500 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                                AI Ready
                            </span>
                            {isListening && (
                                <span style={{ color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite', display: 'inline-block' }}></span>
                                    Listening...
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ─── CHAT CONTAINER ─── */}
                    <div className="chat-container" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
                        <div className="chat-messages" style={{ minHeight: '380px', maxHeight: '580px', overflowY: 'auto' }}>
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'} ${msg.emergency ? 'chat-emergency' : ''}`}
                                    style={msg.emergency ? { borderLeft: '4px solid #EF4444', background: '#FEF2F2' } : {}}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <span className="chat-sender" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            {msg.role === 'user' ? userName : '🤖 Kushi Care AI'}
                                            {msg.emergency && (
                                                <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <AlertCircle size={13} /> EMERGENCY
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="chat-text">
                                        {msg.content.split('\n').map((line, j) => (
                                            <p key={j} style={{ margin: '0.25rem 0' }}>{line}</p>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {/* TTS Button for assistant messages */}
                                        {msg.role === 'assistant' && (
                                            <button
                                                type="button"
                                                onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                                                style={{
                                                    background: isSpeaking ? '#FEE2E2' : '#F1F5F9',
                                                    border: isSpeaking ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                                                    borderRadius: '6px',
                                                    padding: '0.25rem 0.6rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    fontSize: '0.75rem',
                                                    color: isSpeaking ? '#DC2626' : '#475569',
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s'
                                                }}
                                                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                                            >
                                                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                {isSpeaking ? 'Stop Audio' : 'Listen'}
                                            </button>
                                        )}

                                        {/* Retry option if needed */}
                                        {msg.isError && (
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                onClick={() => {
                                                    const lastUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                                    if (lastUserMsg) {
                                                        handleSend(null, lastUserMsg.content);
                                                    }
                                                }}
                                            >
                                                <RotateCcw size={12} /> Retry
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="chat-bubble chat-assistant">
                                    <span className="chat-sender">🤖 Kushi Care AI</span>
                                    <div className="chat-typing" style={{ marginTop: '0.4rem' }}>
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── SUGGESTED PROMPT CHIPS ─── */}
                        {messages.length <= 2 && (
                            <div style={{
                                padding: '0.6rem 1rem',
                                background: '#F8FAFC',
                                borderTop: '1px solid #F1F5F9',
                                display: 'flex',
                                gap: '0.4rem',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', marginRight: '0.2rem' }}>
                                    Suggestions:
                                </span>
                                {(promptChips[language] || promptChips.en).map((chip, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSend(null, chip.replace(/^[^\s]+\s/, ''))}
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '16px',
                                            padding: '0.25rem 0.65rem',
                                            fontSize: '0.76rem',
                                            color: '#334155',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #0D9488)'; e.currentTarget.style.color = 'var(--primary, #0D9488)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155' }}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ─── CHAT INPUT BAR ─── */}
                        <form className="chat-input-bar" onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.85rem 1rem' }}>
                            {/* Voice Input Toggle Button */}
                            <button
                                type="button"
                                onClick={toggleListening}
                                style={{
                                    background: isListening ? '#EF4444' : '#F1F5F9',
                                    color: isListening ? '#FFFFFF' : '#475569',
                                    border: isListening ? '2px solid #DC2626' : '1px solid #CBD5E1',
                                    borderRadius: '50%',
                                    width: '42px',
                                    height: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                    animation: isListening ? 'pulse 1.5s infinite' : 'none'
                                }}
                                title={isListening ? 'Stop recording voice' : 'Start voice input (Speak)'}
                                disabled={loading}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <input
                                className="chat-input"
                                type="text"
                                placeholder={isListening ? 'Listening to your voice...' : 'Ask a health question or describe your symptoms...'}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                                maxLength={2000}
                                style={{ flex: 1, padding: '0.65rem 0.9rem', fontSize: '0.92rem' }}
                            />

                            <button
                                className="btn btn-primary chat-send"
                                type="submit"
                                disabled={loading || !input.trim()}
                                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}
                            >
                                {loading ? '...' : 'Send'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Inline keyframe for mic pulse animation */}
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
                    70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </>
    )
}
