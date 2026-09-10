import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { messages, language } = req.body || {}

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required.' })
        }

        // Build language instruction
        const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
        const langName = langMap[language] || ''
        const langInstruction = langName && language !== 'en'
            ? `\n\nIMPORTANT: The user prefers ${langName}. You MUST respond entirely in ${langName} (${language} script). Keep medical terms in English where necessary for clarity.`
            : ''

        const systemPrompt = `You are Khushi Care AI, a helpful, empathetic healthcare assistant for the Khushi Hygieia platform — an Indian healthcare app serving patients in English, Hindi, and Telugu.

Rules:
- Provide general health guidance, wellness tips, and first-aid information.
- NEVER diagnose conditions or prescribe medicines.
- Always remind users to consult a qualified doctor for medical concerns.
- Be warm, supportive, and culturally sensitive to Indian healthcare context.
- If someone describes an emergency (chest pain, difficulty breathing, severe bleeding), urgently advise them to call 108 (Indian emergency) or visit the nearest hospital immediately.
- Keep responses concise (under 300 words) unless the user asks for detailed information.${langInstruction}`

        // Try OpenRouter first (User's active key)
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            try {
                const formattedMessages = [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }))
                ]

                const reply = await callOpenRouter({
                    messages: formattedMessages,
                    temperature: 0.7,
                    maxTokens: 500
                })

                if (reply) {
                    return res.status(200).json({ reply })
                }
            } catch (openRouterErr) {
                console.warn('OpenRouter Chat failed, checking Gemini fallback:', openRouterErr.message)
            }
        }

        // Fallback to Gemini if configured
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY
        if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
            const lastMsg = messages[messages.length - 1]
            const result = await model.generateContent(lastMsg.content)
            return res.status(200).json({ reply: result.response.text() })
        }

        throw new Error('AI service currently unavailable. Please check your OpenRouter API key.')
    } catch (error) {
        console.error('Chat Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
