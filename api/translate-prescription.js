import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { content, targetLanguage } = req.body || {}

        if (!content || !targetLanguage) {
            return res.status(400).json({ error: 'content and targetLanguage are required.' })
        }

        if (targetLanguage === 'en') {
            return res.status(200).json(content)
        }

        const langMap = {
            hi: 'Hindi',
            te: 'Telugu'
        }

        const langName = langMap[targetLanguage]
        if (!langName) {
            return res.status(400).json({ error: 'Unsupported language. Use: en, hi, te' })
        }

        const prompt = `You are a professional medical translator. Translate the following medical prescription analysis result COMPLETELY into ${langName}.

Rules:
- Keep the EXACT same JSON structure and field names in English (keys stay in English)
- Translate ALL field VALUES into ${langName}, including:
  - Medicine/tablet names: transliterate into ${langName} script
  - Dosage and usage instructions: translate fully into ${langName}
  - Purpose: translate fully into ${langName}
- Keep "confidence" values as-is ("high", "medium", "low")

Input JSON to translate:
${JSON.stringify(content, null, 2)}

Return ONLY valid JSON.`

        let responseText = ''

        // 1. Try OpenRouter
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            try {
                responseText = await callOpenRouter({
                    messages: [
                        { role: 'system', content: 'You are a medical prescription translator. Return only valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    responseFormat: { type: 'json_object' },
                    temperature: 0.1,
                    maxTokens: 1500
                })
            } catch (err) {
                console.warn('OpenRouter prescription translation failed, trying Gemini:', err.message)
            }
        }

        // 2. Fallback to Gemini
        if (!responseText) {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY
            if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    generationConfig: { responseMimeType: 'application/json' }
                })
                const result = await model.generateContent(prompt)
                responseText = result.response.text()
            }
        }

        if (!responseText) {
            return res.status(200).json(content)
        }

        let clean = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const firstBrace = clean.indexOf('{')
        const lastBrace = clean.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            clean = clean.slice(firstBrace, lastBrace + 1)
        }
        const parsed = JSON.parse(clean)

        if (!parsed.document_type && parsed.documentType) {
            parsed.document_type = parsed.documentType
        } else if (!parsed.document_type && content.document_type) {
            parsed.document_type = content.document_type
        }

        return res.status(200).json(parsed)
    } catch (error) {
        console.error('Prescription Translation Error:', error)
        if (req.body?.content) {
            return res.status(200).json(req.body.content)
        }
        return res.status(500).json({ error: error.message || 'Translation failed' })
    }
}
