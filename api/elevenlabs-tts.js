// Multi-Language Healthcare Voice Engine for Kushi Hygieia
// Provides native Indic speech (Telugu & Hindi) via Google Indic Neural Voice
// and realistic English medical assistant speech via ElevenLabs AI Voice

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - Mature, Reassuring, Confident
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2'

// Helper for authentic native Indic pronunciation (Telugu & Hindi)
async function fetchIndicTTS(text, langCode) {
    const sentences = text.match(/[^.!?\n|।]+[.!?\n|।]*|[^.!?\n|।]+$/g) || [text]
    const buffers = []

    for (const s of sentences) {
        const trimmed = s.trim()
        if (!trimmed) continue

        // Chunk by ~170 characters to maintain natural inflection
        for (let i = 0; i < trimmed.length; i += 170) {
            const sub = trimmed.slice(i, i + 170)
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(sub)}&tl=${langCode}&client=tw-ob`
            try {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                })
                if (res.ok) {
                    const ab = await res.arrayBuffer()
                    buffers.push(Buffer.from(ab))
                }
            } catch (chunkErr) {
                console.warn(`[Indic TTS] Chunk fetch error for ${langCode}:`, chunkErr.message)
            }
        }
    }

    return buffers.length > 0 ? Buffer.concat(buffers) : null
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { text, voiceId, modelId, language } = req.body || {}

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required for TTS conversion.' })
        }

        // Clean markdown, brackets, urls, and special formatting
        const cleanedText = text
            .replace(/[*#`_~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[-•]\s*/g, '')
            .trim()

        if (!cleanedText) {
            return res.status(400).json({ error: 'No readable text after cleanup.' })
        }

        const textToSpeak = cleanedText.length > 1200 ? cleanedText.slice(0, 1200) + '...' : cleanedText

        // Detect Indic local scripts
        const isTelugu = /[\u0C00-\u0C7F]/.test(textToSpeak) || language === 'te'
        const isHindi = /[\u0900-\u097F]/.test(textToSpeak) || language === 'hi'

        // ─── 1. NATIVE INDIC LOCAL LANGUAGE VOICE (Telugu & Hindi) ───
        if (isTelugu || isHindi) {
            const langCode = isTelugu ? 'te' : 'hi'
            try {
                const indicAudio = await fetchIndicTTS(textToSpeak, langCode)
                if (indicAudio && indicAudio.length > 0) {
                    res.setHeader('Content-Type', 'audio/mpeg')
                    res.setHeader('Content-Length', indicAudio.length)
                    res.setHeader('Cache-Control', 'public, max-age=3600')
                    return res.status(200).send(indicAudio)
                }
            } catch (indicErr) {
                console.warn(`[TTS] Indic ${langCode} TTS generation error, attempting fallback:`, indicErr.message)
            }
        }

        // ─── 2. ELEVENLABS AI VOICE (English & Global Multilingual) ───
        const apiKey = process.env.ELEVENLABS_API_KEY || 
                       process.env.VITE_ELEVENLABS_API_KEY ||
                       'sk_3b2a17dc81908d60de2cf0136e95d420a7e5d3e90303caa1'

        const selectedVoice = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
        const selectedModel = modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID

        if (apiKey) {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                body: JSON.stringify({
                    text: textToSpeak,
                    model_id: selectedModel,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.2,
                        use_speaker_boost: true
                    }
                })
            })

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                res.setHeader('Content-Type', 'audio/mpeg')
                res.setHeader('Content-Length', buffer.length)
                res.setHeader('Cache-Control', 'public, max-age=3600')
                return res.status(200).send(buffer)
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.warn('[ElevenLabs TTS] API returned error:', response.status, errorData)
            }
        }

        // ─── 3. FALLBACK TO NATIVE ENGLISH TTS IF ELEVENLABS FAILS ───
        const fallbackAudio = await fetchIndicTTS(textToSpeak, 'en')
        if (fallbackAudio) {
            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Content-Length', fallbackAudio.length)
            return res.status(200).send(fallbackAudio)
        }

        return res.status(500).json({ error: 'Failed to generate voice audio.' })
    } catch (error) {
        console.error('[Healthcare TTS] Handler error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error in TTS' })
    }
}
