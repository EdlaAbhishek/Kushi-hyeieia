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
        const { age, gender, symptoms, temperature, bloodPressureSys, bloodPressureDia, heartRate, spo2 } = req.body

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms are required.' })
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        })

        const prompt = `You are an AI medical triage assistant. Analyze the patient's data and provide a triage assessment.
DO NOT provide medical advice. This is only for preliminary triage categorization.

Patient Data:
- Age: ${age || 'Not provided'}
- Gender: ${gender || 'Not provided'}
- Symptoms: ${symptoms}
- Temperature: ${temperature ? temperature + ' °F' : 'Not provided'}
- Blood Pressure: ${bloodPressureSys && bloodPressureDia ? `${bloodPressureSys}/${bloodPressureDia} mmHg` : 'Not provided'}
- Heart Rate: ${heartRate ? heartRate + ' bpm' : 'Not provided'}
- SpO2: ${spo2 ? spo2 + '%' : 'Not provided'}

Respond with a JSON object matching this exact schema:
{
  "triage": "Emergency" | "Urgent" | "Routine",
  "confidenceScore": <integer between 0 and 100>,
  "explainability": [
    "<reasoning regarding specific symptom or vital>",
    "<another reasoning point>"
  ],
  "preliminaryCarePlan": [
    "<suggested test>",
    "<suggested lifestyle tip>",
    "<follow-up suggestion>"
  ]
}`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        if (!responseText) {
            return res.status(500).json({ error: 'AI returned an empty response.' })
        }

        // Parse the JSON response
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
            console.error('Failed to parse Gemini symptom response:', e)
            return res.status(500).json({ error: 'Failed to parse AI response.' })
        }

        // Validate and sanitize
        const safeResult = {
            triage: ['Emergency', 'Urgent', 'Routine'].includes(parsed.triage) ? parsed.triage : 'Routine',
            confidenceScore: typeof parsed.confidenceScore === 'number' ? Math.min(100, Math.max(0, parsed.confidenceScore)) : 50,
            explainability: Array.isArray(parsed.explainability) ? parsed.explainability.filter(e => typeof e === 'string') : [],
            preliminaryCarePlan: Array.isArray(parsed.preliminaryCarePlan) ? parsed.preliminaryCarePlan.filter(e => typeof e === 'string') : []
        }

        return res.status(200).json(safeResult)
    } catch (error) {
        console.error('Gemini Symptom Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
