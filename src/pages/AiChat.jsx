import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../services/AuthContext'
import { Mic, MicOff, Volume2, VolumeX, Languages, Sparkles, AlertCircle, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { isEmergencyQuery } from '../services/healthAssistantService'

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
    const [activeSpeakingIndex, setActiveSpeakingIndex] = useState(null)
    const [ttsLoadingIndex, setTtsLoadingIndex] = useState(null)
    const recognitionRef = useRef(null)
    const currentUtteranceRef = useRef(null)
    const audioPlayerRef = useRef(null)
    const audioUrlRef = useRef(null)

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

    // ─── VOICE INPUT (Browser-Native Web Speech API with Permission Prompt) ─
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

    const startListening = useCallback(async () => {
        // Stop any active speech before listening
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            audioPlayerRef.current = null
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
        setActiveSpeakingIndex(null)

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            toast.error('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', { position: 'bottom-center' })
            return
        }

        // Request microphone permission to ensure prompt appears
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                stream.getTracks().forEach(t => t.stop())
            }
        } catch (permErr) {
            console.warn('Microphone permission not granted:', permErr)
            toast.error('Microphone permission required. Please enable it in browser settings.', { position: 'bottom-center', id: 'mic-perm' })
            return
        }

        try {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort() } catch { /* ignore */ }
            }

            const recognition = new SpeechRecognition()
            recognitionRef.current = recognition
            recognition.lang = langConfig[language]?.speechLang || 'en-IN'
            recognition.continuous = true
            recognition.interimResults = true

            let baseTranscript = input ? input.trim() + ' ' : ''

            recognition.onstart = () => {
                setIsListening(true)
                toast.success(`Listening (${langConfig[language]?.label})... Speak now`, { id: 'voice-status', position: 'bottom-center' })
            }

            recognition.onresult = (event) => {
                let interimTranscript = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        baseTranscript += transcript + ' '
                    } else {
                        interimTranscript += transcript
                    }
                }
                const fullText = (baseTranscript + interimTranscript).trim()
                if (fullText) {
                    setInput(fullText)
                }
            }

            recognition.onerror = (event) => {
                console.warn('Speech recognition event error:', event.error)
                if (event.error === 'not-allowed') {
                    setIsListening(false)
                    toast.error('Microphone access blocked. Click the lock icon in the address bar to allow.', { id: 'voice-status', position: 'bottom-center' })
                } else if (event.error === 'network') {
                    setIsListening(false)
                    toast.error('Speech recognition network issue.', { id: 'voice-status', position: 'bottom-center' })
                } else if (event.error !== 'no-speech') {
                    setIsListening(false)
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
            toast.error('Could not activate voice input. Please try again.', { position: 'bottom-center' })
        }
    }, [language, input])

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

    // ─── TEXT-TO-SPEECH (ElevenLabs Natural Voice AI with Multi-Tier Fallback) ─
    const stopSpeaking = useCallback(() => {
        if (audioPlayerRef.current) {
            try {
                audioPlayerRef.current.pause()
                audioPlayerRef.current.currentTime = 0
            } catch { /* ignore */ }
            audioPlayerRef.current = null
        }
        if (audioUrlRef.current) {
            try { URL.revokeObjectURL(audioUrlRef.current) } catch { /* ignore */ }
            audioUrlRef.current = null
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
        setActiveSpeakingIndex(null)
        setTtsLoadingIndex(null)
    }, [])

    const speakText = useCallback(async (text, index = 0) => {
        if (!text) return

        // If clicking currently playing audio, stop it
        if (activeSpeakingIndex === index) {
            stopSpeaking()
            return
        }

        stopSpeaking()
        stopListening()
        setTtsLoadingIndex(index)

        // Clean markdown symbols, emoji, links for natural fluid speech
        const cleanText = text
            .replace(/[*#`_~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[-•]\s*/g, '')
            .trim()

        if (!cleanText) {
            setTtsLoadingIndex(null)
            return
        }

        // Limit speech chunk size to ensure fast generation
        const textToSpeak = cleanText.length > 1000 ? cleanText.slice(0, 1000) + '...' : cleanText

        let audioBlob = null

        // Tier 1: Backend ElevenLabs serverless API route (/api/elevenlabs-tts)
        try {
            const res = await fetch('/api/elevenlabs-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSpeak,
                    voiceId: 'EXAVITQu4vr4xnSDxMaL',
                    modelId: 'eleven_multilingual_v2'
                })
            })

            if (res.ok) {
                audioBlob = await res.blob()
            }
        } catch (serverErr) {
            console.warn('[TTS] Backend route unavailable, trying direct ElevenLabs:', serverErr)
        }

        // Tier 2: Direct ElevenLabs API client-side fallback
        if (!audioBlob) {
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_3b2a17dc81908d60de2cf0136e95d420a7e5d3e90303caa1'
            const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
            const modelId = import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'

            if (apiKey) {
                try {
                    const clientRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                        method: 'POST',
                        headers: {
                            'xi-api-key': apiKey,
                            'Content-Type': 'application/json',
                            'Accept': 'audio/mpeg'
                        },
                        body: JSON.stringify({
                            text: textToSpeak,
                            model_id: modelId,
                            voice_settings: {
                                stability: 0.5,
                                similarity_boost: 0.75
                            }
                        })
                    })

                    if (clientRes.ok) {
                        audioBlob = await clientRes.blob()
                    }
                } catch (clientErr) {
                    console.warn('[TTS] Direct ElevenLabs API error:', clientErr)
                }
            }
        }

        // Play audio from ElevenLabs if audioBlob received
        if (audioBlob) {
            try {
                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current)
                }
                const audioUrl = URL.createObjectURL(audioBlob)
                audioUrlRef.current = audioUrl
                const audio = new Audio(audioUrl)
                audioPlayerRef.current = audio

                audio.onplay = () => {
                    setTtsLoadingIndex(null)
                    setActiveSpeakingIndex(index)
                }

                audio.onended = () => {
                    setActiveSpeakingIndex(null)
                    setTtsLoadingIndex(null)
                    if (audioUrlRef.current) {
                        URL.revokeObjectURL(audioUrlRef.current)
                        audioUrlRef.current = null
                    }
                }

                audio.onerror = (e) => {
                    console.warn('[TTS] Audio playback error:', e)
                    setActiveSpeakingIndex(null)
                    setTtsLoadingIndex(null)
                }

                await audio.play()
                return
            } catch (playErr) {
                console.warn('[TTS] Audio play() failed, falling back to browser synthesis:', playErr)
            }
        }

        // Tier 3: Browser-Native SpeechSynthesis Fallback
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                setTtsLoadingIndex(null)
                setActiveSpeakingIndex(index)

                const utterance = new SpeechSynthesisUtterance(textToSpeak)
                currentUtteranceRef.current = utterance

                const targetLang = langConfig[language]?.voiceLang || 'en-IN'
                utterance.lang = targetLang
                utterance.rate = 0.95
                utterance.pitch = 1.0

                const voices = window.speechSynthesis.getVoices()
                if (voices && voices.length > 0) {
                    const matchedVoice = voices.find(v => v.lang.startsWith(language) || v.lang.replace('_', '-').includes(targetLang))
                    if (matchedVoice) {
                        utterance.voice = matchedVoice
                    }
                }

                utterance.onend = () => setActiveSpeakingIndex(null)
                utterance.onerror = (e) => {
                    console.warn('Speech synthesis error:', e)
                    setActiveSpeakingIndex(null)
                }

                window.speechSynthesis.speak(utterance)
            } catch (err) {
                console.error('Speech synthesis execution failed:', err)
                setActiveSpeakingIndex(null)
                setTtsLoadingIndex(null)
                toast.error('Could not play voice guidance.')
            }
        } else {
            setTtsLoadingIndex(null)
            toast.error('Audio playback is not supported by your browser.', { position: 'bottom-center' })
        }
    }, [language, activeSpeakingIndex, stopSpeaking, stopListening])

    // Cancel speech on unmount
    useEffect(() => {
        return () => {
            stopSpeaking()
        }
    }, [stopSpeaking])

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
                                        {/* TTS Button for assistant messages (ElevenLabs Human-like Voice) */}
                                        {msg.role === 'assistant' && (
                                            <button
                                                type="button"
                                                onClick={() => speakText(msg.content, i)}
                                                disabled={ttsLoadingIndex === i}
                                                style={{
                                                    background: activeSpeakingIndex === i ? '#FEE2E2' : (ttsLoadingIndex === i ? '#F8FAFC' : '#F1F5F9'),
                                                    border: activeSpeakingIndex === i ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                                                    borderRadius: '6px',
                                                    padding: '0.25rem 0.65rem',
                                                    cursor: ttsLoadingIndex === i ? 'wait' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: activeSpeakingIndex === i ? '#DC2626' : '#475569',
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s'
                                                }}
                                                title={activeSpeakingIndex === i ? 'Stop audio' : 'Listen with ElevenLabs AI Voice'}
                                            >
                                                {ttsLoadingIndex === i ? (
                                                    <>
                                                        <span style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            border: '2px solid #94A3B8',
                                                            borderTopColor: '#0D9488',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite',
                                                            display: 'inline-block'
                                                        }}></span>
                                                        <span>Generating Voice...</span>
                                                    </>
                                                ) : activeSpeakingIndex === i ? (
                                                    <>
                                                        <VolumeX size={14} />
                                                        <span>Stop Audio</span>
                                                        <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'flex-end', height: '10px', marginLeft: '2px' }}>
                                                            <span style={{ width: '2px', height: '8px', background: '#DC2626', animation: 'equalizer 0.8s infinite ease-in-out' }}></span>
                                                            <span style={{ width: '2px', height: '12px', background: '#DC2626', animation: 'equalizer 0.8s 0.2s infinite ease-in-out' }}></span>
                                                            <span style={{ width: '2px', height: '6px', background: '#DC2626', animation: 'equalizer 0.8s 0.4s infinite ease-in-out' }}></span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Volume2 size={14} />
                                                        <span>Listen</span>
                                                        <span style={{ fontSize: '0.68rem', color: '#0D9488', background: '#CCFBF1', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>ElevenLabs</span>
                                                    </>
                                                )}
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

            {/* Inline keyframes for voice and mic animations */}
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
                    70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes equalizer {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>
        </>
    )
}
