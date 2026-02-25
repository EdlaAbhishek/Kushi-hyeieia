import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Ensure the API key is provided
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        let prompt = `You are Khushi Care AI, a healthcare assistant.\n\n`;
        if (context && context.length > 0) {
            prompt += "Previous conversation:\n";
            context.forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
            prompt += "\n";
        }
        prompt += `user: ${message}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Simple mock check for emergency keywords
        const isEmergency = /heart attack|stroke|severe bleeding|chest pain|difficulty breathing|suicide/i.test(message);

        return res.status(200).json({
            reply: response.text(),
            emergency: isEmergency
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
