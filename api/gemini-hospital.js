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
        const { symptoms, hospitals } = req.body

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms are required.' })
        }
        if (!Array.isArray(hospitals) || hospitals.length === 0) {
            return res.status(400).json({ error: 'Hospital list is required.' })
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        })

        const prompt = `You are an intelligent medical triage and hospital routing assistant. 
Based on the patient's symptoms and the list of nearby hospitals, select the BEST hospital for their condition.

Patient Symptoms: "${symptoms}"

Available Nearby Hospitals:
${JSON.stringify(hospitals, null, 2)}

Instructions:
1. Analyze the symptoms to determine the likely medical domain (e.g., Cardiology, Orthopedics, Emergency).
2. Find the hospital that has the matching 'specialties'.
3. If it sounds like a life-threatening emergency, prioritize hospitals with 'emergency: true'.
4. If multiple hospitals are suitable, prefer the one with the shortest distance.
5. Return exactly ONE recommended hospital ID and your reasoning.

Respond with a JSON object matching this exact schema:
{
  "recommendedHospitalId": "<uuid from the list>",
  "reasoning": "<Explanation of why this hospital is the best fit, mentioning the matching specialties and distance.>",
  "urgency": "Emergency" | "Urgent" | "Routine"
}`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        let parsed
        try {
            let clean = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
            const firstBrace = clean.indexOf('{')
            const lastBrace = clean.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                clean = clean.slice(firstBrace, lastBrace + 1)
            }
            parsed = JSON.parse(clean)
        } catch (e) {
            console.error('Failed to parse Gemini hospital response:', e)
            return res.status(500).json({ error: 'Failed to parse AI response.' })
        }

        return res.status(200).json({
            recommendedHospitalId: parsed.recommendedHospitalId || null,
            reasoning: parsed.reasoning || 'AI could not provide a clear recommendation.',
            urgency: ['Emergency', 'Urgent', 'Routine'].includes(parsed.urgency) ? parsed.urgency : 'Routine'
        })
    } catch (error) {
        console.error('Gemini Hospital Recommendation Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
