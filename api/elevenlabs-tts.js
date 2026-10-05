// Serverless Handler for ElevenLabs Text-to-Speech (Kushi Hygieia)
// Converts healthcare text to realistic, compassionate human speech

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - Mature, Reassuring, Confident
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2' // State-of-the-art multilingual human-like voice

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { text, voiceId, modelId } = req.body || {}

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required for TTS conversion.' })
        }

        const apiKey = process.env.ELEVENLABS_API_KEY || 
                       process.env.VITE_ELEVENLABS_API_KEY ||
                       'sk_3b2a17dc81908d60de2cf0136e95d420a7e5d3e90303caa1'

        if (!apiKey) {
            return res.status(500).json({ error: 'ElevenLabs API key is not configured.' })
        }

        // Clean markdown, links, symbols for pristine natural speech
        const cleanedText = text
            .replace(/[*#`_~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[-•]\s*/g, '')
            .trim()

        if (!cleanedText) {
            return res.status(400).json({ error: 'No readable text after cleanup.' })
        }

        // Truncate to reasonable size for quick response
        const textToSpeak = cleanedText.length > 1000 ? cleanedText.slice(0, 1000) + '...' : cleanedText

        const selectedVoice = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
        const selectedModel = modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID

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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[ElevenLabs TTS] API error:', response.status, errorData)
            return res.status(response.status).json({
                error: errorData?.detail?.message || `ElevenLabs API error HTTP ${response.status}`
            })
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Content-Length', buffer.length)
        res.setHeader('Cache-Control', 'public, max-age=3600')
        return res.status(200).send(buffer)
    } catch (error) {
        console.error('[ElevenLabs TTS] Handler error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error in TTS' })
    }
}
