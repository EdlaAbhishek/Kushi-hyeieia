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
                console.log(`[gemini-symptom] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`)
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
        const { age, gender, symptoms, temperature, bloodPressureSys, bloodPressureDia, heartRate, spo2, language } = req.body

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms are required.' })
        }

        // Build language instruction
        const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
        const langName = langMap[language] || ''
        const langInstruction = langName && language !== 'en'
            ? `\n\nIMPORTANT: Respond entirely in ${langName} (use ${language} script). Keep medical/scientific terms in English where necessary for clarity. All other text MUST be in ${langName}.`
            : ''

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        })

        const prompt = `You are an AI medical triage assistant. Analyze the patient's data and provide a comprehensive triage assessment.
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
  "possibleConditions": [
    {
      "condition": "<name of the possible medical condition>",
      "probability": "<High | Medium | Low>",
      "explanation": "<brief medical explanation of why this condition is suspected based on the symptoms>"
    }
  ],
  "medicalExplanation": "<a comprehensive paragraph explaining the overall medical assessment, connecting the symptoms to the possible conditions and triage level>",
  "explainability": [
    "<reasoning regarding specific symptom or vital>",
    "<another reasoning point>"
  ],
  "preliminaryCarePlan": [
    "<suggested test>",
    "<suggested lifestyle tip>",
    "<follow-up suggestion>"
  ]
}

Rules for possibleConditions:
- List 2-5 possible conditions dynamically based on the symptoms provided.
- Do NOT hardcode conditions. Derive them entirely from the patient's symptoms.
- Order by probability (most likely first).
- Each condition must have a unique, specific medical explanation.${langInstruction}`

        const result = await callWithRetry(() => model.generateContent(prompt))
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
            possibleConditions: Array.isArray(parsed.possibleConditions)
                ? parsed.possibleConditions
                    .filter(c => c && typeof c === 'object')
                    .map(c => ({
                        condition: typeof c.condition === 'string' ? c.condition : 'Unknown condition',
                        probability: ['High', 'Medium', 'Low'].includes(c.probability) ? c.probability : 'Medium',
                        explanation: typeof c.explanation === 'string' ? c.explanation : ''
                    }))
                : [],
            medicalExplanation: typeof parsed.medicalExplanation === 'string' ? parsed.medicalExplanation : '',
            explainability: Array.isArray(parsed.explainability) ? parsed.explainability.filter(e => typeof e === 'string') : [],
            preliminaryCarePlan: Array.isArray(parsed.preliminaryCarePlan) ? parsed.preliminaryCarePlan.filter(e => typeof e === 'string') : []
        }

        return res.status(200).json(safeResult)
    } catch (error) {
        console.error('Gemini Symptom Error:', error)
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('RESOURCE_EXHAUSTED')
        if (is429) {
            console.warn('Gemini Rate Limit Exceeded: Returning fallback mock triage response.');
            return res.status(200).json({
                triage: 'Routine',
                confidenceScore: 85,
                possibleConditions: [
                    { condition: 'Viral Infection (Mock Data due to AI Limit)', probability: 'High', explanation: 'Symptoms match common viral patterns.' },
                    { condition: 'Seasonal Allergies (Mock Data)', probability: 'Medium', explanation: 'Could be triggered by environmental factors.' }
                ],
                medicalExplanation: 'The AI service is currently at capacity (Free Tier limit). This is a mock response so you can still preview how the UI looks and functions! Usually, a detailed medical explanation would appear here based on your specific symptoms.',
                explainability: ['Based on reported symptoms', 'Considered age and vitals'],
                preliminaryCarePlan: ['Rest and hydrate', 'Monitor symptoms', 'This is a demo response, please try the AI again later!']
            });
        }
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

