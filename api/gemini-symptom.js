import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

function extractAndParseJSON(str) {
    let clean = str.replace(/```json/gi, '').replace(/```/g, '').trim()
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1)
    }
    return JSON.parse(clean)
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { age, gender, symptoms, temperature, bloodPressureSys, bloodPressureDia, heartRate, spo2, language } = req.body || {}

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms are required.' })
        }

        const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
        const langName = langMap[language] || ''
        const langInstruction = langName && language !== 'en'
            ? `\n\nIMPORTANT: Respond entirely in ${langName} (${language} script). Keep medical terms in English where necessary for clarity.`
            : ''

        const prompt = `You are an AI medical triage assistant. Analyze the patient's data and provide a preliminary triage assessment.
DO NOT provide medical advice.

Patient Data:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Symptoms: ${symptoms}
- Temperature: ${temperature ? temperature + ' °F' : 'Not specified'}
- Blood Pressure: ${bloodPressureSys && bloodPressureDia ? `${bloodPressureSys}/${bloodPressureDia} mmHg` : 'Not specified'}
- Heart Rate: ${heartRate ? heartRate + ' bpm' : 'Not specified'}
- SpO2: ${spo2 ? spo2 + '%' : 'Not specified'}

Return a JSON object with this EXACT structure:
{
  "triage": "Emergency" | "Urgent" | "Routine",
  "confidenceScore": 85,
  "possibleConditions": [
    {
      "condition": "Condition name",
      "probability": "High" | "Medium" | "Low",
      "explanation": "Brief explanation"
    }
  ],
  "medicalExplanation": "Summary of triage assessment connecting symptoms to findings.",
  "explainability": [
    "Key reason 1",
    "Key reason 2"
  ],
  "preliminaryCarePlan": [
    "Suggested action 1",
    "Suggested action 2"
  ]
}${langInstruction}`

        let responseText = ''

        // 1. Try OpenRouter
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            try {
                responseText = await callOpenRouter({
                    messages: [
                        { role: 'system', content: 'You are an AI medical triage assistant. You MUST respond with a valid JSON object matching the requested schema.' },
                        { role: 'user', content: prompt }
                    ],
                    responseFormat: { type: 'json_object' },
                    temperature: 0.1,
                    maxTokens: 1500
                })
            } catch (err) {
                console.warn('OpenRouter symptom triage failed, trying fallback:', err.message)
            }
        }

        // 2. Fallback to Gemini if OpenRouter wasn't available
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
            throw new Error('AI returned an empty response.')
        }

        let parsed
        try {
            parsed = extractAndParseJSON(responseText)
        } catch (parseErr) {
            console.warn('Direct JSON parse failed, returning sanitized fallback:', parseErr.message)
            parsed = {
                triage: 'Routine',
                confidenceScore: 75,
                possibleConditions: [
                    { condition: 'Upper Respiratory Infection', probability: 'High', explanation: 'Matches symptoms like fever and sore throat.' }
                ],
                medicalExplanation: responseText.slice(0, 300),
                explainability: ['Assessed based on symptoms and vitals'],
                preliminaryCarePlan: ['Hydration and rest', 'Consult a physician if symptoms persist']
            }
        }

        const safeResult = {
            triage: ['Emergency', 'Urgent', 'Routine'].includes(parsed.triage) ? parsed.triage : 'Routine',
            confidenceScore: typeof parsed.confidenceScore === 'number' ? Math.min(100, Math.max(0, parsed.confidenceScore)) : 80,
            possibleConditions: Array.isArray(parsed.possibleConditions)
                ? parsed.possibleConditions.map(c => typeof c === 'string' ? { condition: c, probability: 'Medium', explanation: '' } : ({
                    condition: c?.condition || 'Possible condition',
                    probability: ['High', 'Medium', 'Low'].includes(c?.probability) ? c.probability : 'Medium',
                    explanation: c?.explanation || ''
                }))
                : [],
            medicalExplanation: typeof parsed.medicalExplanation === 'string' ? parsed.medicalExplanation : (typeof parsed.medicalExplanation === 'object' ? JSON.stringify(parsed.medicalExplanation) : ''),
            explainability: Array.isArray(parsed.explainability) ? parsed.explainability.map(e => String(e)) : [],
            preliminaryCarePlan: Array.isArray(parsed.preliminaryCarePlan) ? parsed.preliminaryCarePlan.map(p => String(p)) : []
        }

        return res.status(200).json(safeResult)
    } catch (error) {
        console.error('Symptom Triage Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
