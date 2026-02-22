/**
 * backend/controllers/aiController.js
 * Healthcare AI chatbot with Gemini integration.
 * - Emergency keyword detection (bypasses AI)
 * - Google Gemini API for general health guidance
 * - Mandatory healthcare disclaimer on every response
 */

const config = require('../config');

// ── Emergency Keywords ──────────────────────────────────────
const EMERGENCY_KEYWORDS = [
    'chest pain',
    'heart attack',
    'stroke',
    'severe bleeding',
    'breathing difficulty',
    'unconscious',
    'not breathing',
    'cannot breathe',
    'choking',
    'seizure',
];

const EMERGENCY_RESPONSE = {
    reply: '⚠️ This may be a medical emergency. Please call emergency services (112) immediately or use the Emergency SOS feature on our platform. Do not delay seeking help.',
    emergency: true,
};

const DISCLAIMER = '\n\n_Disclaimer: This is not a medical diagnosis. Please consult a qualified healthcare professional for any health concerns._';

const SYSTEM_INSTRUCTION = `You are Khushi Care AI, the healthcare assistant for Khushi Hygieia — a professional hospital platform in India.

Rules you MUST follow:
1. Provide general health guidance only.
2. NEVER diagnose a condition.  
3. NEVER prescribe medication or dosages.
4. NEVER claim to be a doctor.
5. Always recommend consulting a qualified healthcare professional.
6. Keep responses concise (under 200 words).
7. Respond in a calm, structured, professional medical tone.
8. If the user describes serious symptoms, advise them to visit a hospital.`;

const FALLBACK_REPLY = 'I apologize, but I am temporarily unable to process your request. Please try again shortly, or contact our support team for assistance.' + DISCLAIMER;

// ── Gemini API URL builder ──────────────────────────────────
function getGeminiUrl(apiKey) {
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
}

// ── Main Chat Handler ───────────────────────────────────────
async function chat(req, res, next) {
    try {
        const { message, context = [] } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const lower = message.toLowerCase().trim();

        // ① Emergency escalation — respond instantly, skip AI
        if (EMERGENCY_KEYWORDS.some(kw => lower.includes(kw))) {
            return res.json(EMERGENCY_RESPONSE);
        }

        // ② Validate API key exists
        const apiKey = config.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({
                reply: FALLBACK_REPLY,
                emergency: false,
                error: 'AI service is not configured.',
            });
        }

        // ③ Build conversation for Gemini
        const conversationParts = [];

        // Add prior context (if any)
        if (Array.isArray(context)) {
            context.forEach(msg => {
                if (msg.role && msg.content) {
                    conversationParts.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    });
                }
            });
        }

        // Add current user message
        conversationParts.push({
            role: 'user',
            parts: [{ text: message }],
        });

        // ④ Call Gemini API
        const geminiRes = await fetch(getGeminiUrl(apiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                contents: conversationParts,
                generationConfig: {
                    maxOutputTokens: 512,
                    temperature: 0.4,
                    topP: 0.9,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errorBody = await geminiRes.text().catch(() => 'Unknown error');
            throw new Error(`Gemini API error ${geminiRes.status}: ${errorBody}`);
        }

        const data = await geminiRes.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!aiText) {
            throw new Error('Empty response from Gemini.');
        }

        // ⑤ Append mandatory disclaimer
        const reply = aiText + DISCLAIMER;

        return res.json({ reply, emergency: false });
    } catch (err) {
        // Safe fallback — never crash, never expose internals
        if (config.NODE_ENV === 'development') {
            console.error('AI Controller Error:', err.message);
        }
        return res.json({ reply: FALLBACK_REPLY, emergency: false });
    }
}

module.exports = { chat };
