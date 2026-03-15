import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../services/AuthContext'
import { Mic, MicOff, Volume2, VolumeX, Languages } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AiChat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m Khushi Care AI, your healthcare assistant. How can I help you today?\n\n_I can provide general health guidance, but please remember to consult a doctor for medical concerns._'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [language, setLanguage] = useState('en')
    const messagesEndRef = useRef(null)

    // ─── VOICE STATE ──────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(false)
    const [ttsSupported, setTtsSupported] = useState(false)
    const recognitionRef = useRef(null)
    const synthRef = useRef(null)

    // ─── DETECT BROWSER SUPPORT ───────────────────────────────────────
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setSpeechSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = false
            recognitionRef.current = recognition
        }
        if (window.speechSynthesis) {
            setTtsSupported(true)
            synthRef.current = window.speechSynthesis
        }
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const userName = user?.user_metadata?.full_name || 'You'

    // ─── LANGUAGE MAP ─────────────────────────────────────────────────
    const langConfig = {
        en: { label: 'English', speechLang: 'en-IN', ttsLang: 'en' },
        hi: { label: 'हिंदी', speechLang: 'hi-IN', ttsLang: 'hi' },
        te: { label: 'తెలుగు', speechLang: 'te-IN', ttsLang: 'te' }
    }

    // ─── VOICE INPUT ──────────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (!recognitionRef.current) return

        const recognition = recognitionRef.current
        recognition.lang = langConfig[language]?.speechLang || 'en-IN'

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript
            setInput(prev => prev ? prev + ' ' + transcript : transcript)
            setIsListening(false)
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied. Please allow microphone permissions.', { position: 'bottom-center' })
            } else if (event.error !== 'aborted') {
                toast.error('Voice input failed. Please try again or type your message.', { position: 'bottom-center' })
            }
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        try {
            recognition.start()
            setIsListening(true)
        } catch (err) {
            console.error('Failed to start recognition:', err)
            toast.error('Voice input unavailable. Please type your message.', { position: 'bottom-center' })
            setIsListening(false)
        }
    }, [language])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        setIsListening(false)
    }, [])

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [isListening, startListening, stopListening])

    // ─── TEXT-TO-SPEECH ───────────────────────────────────────────────
    const speakText = useCallback((text) => {
        if (!synthRef.current) return

        // Cancel any ongoing speech
        synthRef.current.cancel()

        // Clean markdown formatting from text
        const cleanText = text
            .replace(/[_*#`~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim()

        if (!cleanText) return

        const utterance = new SpeechSynthesisUtterance(cleanText)

        // Try to find a matching voice
        const voices = synthRef.current.getVoices()
        const targetLang = langConfig[language]?.speechLang || 'en-IN'
        const matchingVoice = voices.find(v => v.lang === targetLang) ||
            voices.find(v => v.lang.startsWith(language)) ||
            voices.find(v => v.lang.startsWith('en'))

        if (matchingVoice) {
            utterance.voice = matchingVoice
        }
        utterance.lang = targetLang
        utterance.rate = 0.95
        utterance.pitch = 1

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        synthRef.current.speak(utterance)
    }, [language])

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel()
        }
        setIsSpeaking(false)
    }, [])

    // ─── SEND MESSAGE ─────────────────────────────────────────────────
    const handleSend = async (e) => {
        e.preventDefault()
        const trimmed = input.trim()
        if (!trimmed || loading) return

        // Stop any ongoing speech when user sends a new message
        stopSpeaking()

        const userMsg = { role: 'user', content: trimmed }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Server error: ${response.status}`)
            }

            const data = await response.json()
            if (!data.reply) throw new Error('AI returned an empty response. Please try again.')

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch (err) {
            console.error("AI Error:", err)
            // Show user-friendly error message
            let friendlyMessage = 'Something went wrong. Please try again in a moment.'
            if (err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('temporarily busy')) {
                friendlyMessage = '⏳ The AI is currently busy due to high demand. Please wait a few seconds and try again.'
            } else if (err.message?.includes('GEMINI_API_KEY')) {
                friendlyMessage = '⚙️ AI service is not configured. Please contact support.'
            } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
                friendlyMessage = '🌐 Network error. Please check your internet connection and try again.'
            }
            setMessages(prev => [...prev, { role: 'assistant', content: friendlyMessage, isError: true }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Khushi Care AI</h1>
                    <p className="page-subtitle">Your 24/7 healthcare assistant — get instant general medical guidance to your health queries.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {/* ─── LANGUAGE SELECTOR BAR ─── */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: '#F8FAFC',
                        borderRadius: '12px 12px 0 0',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderBottom: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                            <Languages size={16} />
                            <span style={{ fontWeight: 500 }}>Chat Language:</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{
                                    border: '1px solid #E2E8F0',
                                    background: '#fff',
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.85rem',
                                    color: '#334155',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                                <option value="te">తెలుగు</option>
                            </select>
                        </div>
                        {speechSupported && (
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Mic size={12} /> Voice enabled
                            </div>
                        )}
                    </div>

                    <div className="chat-container" style={{ borderRadius: '0 0 12px 12px' }}>
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'} ${msg.emergency ? 'chat-emergency' : ''}`}
                                >
                                    <span className="chat-sender">
                                        {msg.role === 'user' ? userName : '🤖 Khushi Care AI'}
                                    </span>
                                    <div className="chat-text">
                                        {msg.content.split('\n').map((line, j) => (
                                            <p key={j}>{line}</p>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                        {/* TTS Button for assistant messages */}
                                        {msg.role === 'assistant' && !msg.isError && ttsSupported && (
                                            <button
                                                onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '0.2rem 0.5rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.72rem',
                                                    color: isSpeaking ? '#EF4444' : '#64748B',
                                                    transition: 'all 0.2s'
                                                }}
                                                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                                            >
                                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </button>
                                        )}
                                        {/* Retry button for error messages */}
                                        {msg.isError && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                                onClick={() => {
                                                    const lastUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                                    if (lastUserMsg) {
                                                        setInput(lastUserMsg.content);
                                                        setMessages(messages.slice(0, i));
                                                    }
                                                }}
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="chat-bubble chat-assistant">
                                    <span className="chat-sender">🤖 Khushi Care AI</span>
                                    <div className="chat-typing">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-bar" onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* Mic Toggle */}
                            {speechSupported && (
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    style={{
                                        background: isListening ? '#EF4444' : '#F1F5F9',
                                        color: isListening ? '#fff' : '#64748B',
                                        border: isListening ? '2px solid #EF4444' : '1px solid #E2E8F0',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                        animation: isListening ? 'pulse 1.5s infinite' : 'none'
                                    }}
                                    title={isListening ? 'Stop recording' : 'Start voice input'}
                                    disabled={loading}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                            )}
                            <input
                                className="chat-input"
                                type="text"
                                placeholder={isListening ? 'Listening...' : 'Describe your symptoms or ask a health question...'}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                                maxLength={2000}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn btn-primary chat-send"
                                type="submit"
                                disabled={loading || !input.trim()}
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
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </>
    )
}
