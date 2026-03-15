import { GoogleGenerativeAI } from '@google/generative-ai'

// Retry helper for rate-limit (429) errors
async function callWithRetry(fn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests') || err?.message?.includes('RESOURCE_EXHAUSTED')
            if (is429 && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000
                console.log(`[gemini-chat] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`)
                await new Promise(r => setTimeout(r, delay))
                continue
            }
            throw err
        }
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' })
    }

    try {
        const { messages, language } = req.body

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required.' })
        }

        // Build language instruction
        const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
        const langName = langMap[language] || ''
        const langInstruction = langName && language !== 'en'
            ? `\n\nIMPORTANT: The user prefers ${langName}. You MUST respond entirely in ${langName} (${language} script). Keep medical terms in English where necessary for clarity.`
            : ''

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

        // System instruction must be passed to getGenerativeModel, NOT to startChat
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: {
                parts: [{
                    text: `You are Khushi Care AI, a helpful, empathetic healthcare assistant for the Khushi Hygieia platform — an Indian healthcare app serving patients in English, Hindi, and Telugu.

Rules:
- Provide general health guidance, wellness tips, and first-aid information.
- NEVER diagnose conditions or prescribe medicines.
- Always remind users to consult a qualified doctor for medical concerns.
- Be warm, supportive, and culturally sensitive to Indian healthcare context.
- If someone describes an emergency (chest pain, difficulty breathing, severe bleeding), urgently advise them to call 108 (Indian emergency) or visit the nearest hospital immediately.
- Keep responses concise (under 300 words) unless the user asks for detailed information.${langInstruction}`
                }]
            }
        })

        // Convert messages to Gemini chat format
        const chatHistory = []
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i]
            const mappedRole = msg.role === 'user' ? 'user' : 'model'

            // Gemini history MUST start with a 'user' message
            if (chatHistory.length === 0 && mappedRole !== 'user') {
                continue
            }

            // Gemini history MUST strictly alternate between user and model
            if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === mappedRole) {
                chatHistory[chatHistory.length - 1].parts[0].text += '\n\n' + msg.content
                continue
            }

            chatHistory.push({
                role: mappedRole,
                parts: [{ text: msg.content }]
            })
        }

        const chat = model.startChat({ history: chatHistory })

        // Send the latest user message with retry
        const latestMessage = messages[messages.length - 1]
        const result = await callWithRetry(() => chat.sendMessage(latestMessage.content))
        const responseText = result.response.text()

        if (!responseText) {
            return res.status(500).json({ error: 'AI returned an empty response.' })
        }

        return res.status(200).json({ reply: responseText })
    } catch (error) {
        console.error('Gemini Chat Error:', error)
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('RESOURCE_EXHAUSTED')
        if (is429) {
            console.warn('Gemini Rate Limit Exceeded: Returning fallback mock response.');
            return res.status(200).json({ reply: 'I apologize, but my AI language model is currently receiving too many requests due to the Free Tier limit. For this demo, please imagine I gave a wonderful, tailored medical response here! You can try asking again in a few minutes.' })
        }
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
