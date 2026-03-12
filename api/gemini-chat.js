import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' })
    }

    try {
        const { messages } = req.body

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required.' })
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

        // System instruction must be passed to getGenerativeModel, NOT to startChat
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: {
                parts: [{
                    text: `You are Khushi Care AI, a helpful, empathetic healthcare assistant for the Khushi Hygieia platform — an Indian healthcare app serving patients in English, Hindi, and Telugu.

Rules:
- Provide general health guidance, wellness tips, and first-aid information.
- NEVER diagnose conditions or prescribe medicines.
- Always remind users to consult a qualified doctor for medical concerns.
- Be warm, supportive, and culturally sensitive to Indian healthcare context.
- If someone describes an emergency (chest pain, difficulty breathing, severe bleeding), urgently advise them to call 108 (Indian emergency) or visit the nearest hospital immediately.
- Keep responses concise (under 300 words) unless the user asks for detailed information.`
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

        // Send the latest user message
        const latestMessage = messages[messages.length - 1]
        const result = await chat.sendMessage(latestMessage.content)
        const responseText = result.response.text()

        if (!responseText) {
            return res.status(500).json({ error: 'AI returned an empty response.' })
        }

        return res.status(200).json({ reply: responseText })
    } catch (error) {
        console.error('Gemini Chat Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
