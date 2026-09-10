import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { symptoms, hospitals } = req.body || {}

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms are required.' })
        }
        if (!Array.isArray(hospitals) || hospitals.length === 0) {
            return res.status(400).json({ error: 'Hospital list is required.' })
        }

        const prompt = `You are an intelligent medical triage and hospital routing assistant. 
Based on the patient's symptoms and the list of nearby hospitals, select the BEST hospital for their condition.

Patient Symptoms: "${symptoms}"

Available Nearby Hospitals:
${JSON.stringify(hospitals.slice(0, 10), null, 2)}

Instructions:
1. Analyze the symptoms to determine the likely medical domain (e.g., Cardiology, Orthopedics, Emergency).
2. Find the hospital that has the matching 'specialties'.
3. If it sounds like a life-threatening emergency, prioritize hospitals with 'emergency: true'.
4. If multiple hospitals are suitable, prefer the one with the shortest distance.
5. Return exactly ONE recommended hospital ID and your reasoning.

Respond with ONLY a JSON object matching this schema:
{
  "recommendedHospitalId": "<uuid or id from the list>",
  "reasoning": "<Explanation of why this hospital is the best fit, mentioning the matching specialties and distance.>",
  "urgency": "Emergency" | "Urgent" | "Routine"
}`

        let responseText = ''

        // 1. Try OpenRouter
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            try {
                responseText = await callOpenRouter({
                    messages: [
                        { role: 'system', content: 'You are an AI hospital routing assistant. Output only valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    responseFormat: { type: 'json_object' },
                    temperature: 0.1,
                    maxTokens: 800
                })
            } catch (err) {
                console.warn('OpenRouter hospital routing failed, trying Gemini:', err.message)
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
            // Fallback to first hospital if AI is unavailable
            return res.status(200).json({
                recommendedHospitalId: hospitals[0]?.id || null,
                reasoning: 'Recommended based on proximity.',
                urgency: 'Routine'
            })
        }

        let clean = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const firstBrace = clean.indexOf('{')
        const lastBrace = clean.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            clean = clean.slice(firstBrace, lastBrace + 1)
        }
        const parsed = JSON.parse(clean)

        return res.status(200).json({
            recommendedHospitalId: parsed.recommendedHospitalId || hospitals[0]?.id || null,
            reasoning: parsed.reasoning || 'AI selected based on specialties and distance.',
            urgency: ['Emergency', 'Urgent', 'Routine'].includes(parsed.urgency) ? parsed.urgency : 'Routine'
        })
    } catch (error) {
        console.error('Hospital Recommendation Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
