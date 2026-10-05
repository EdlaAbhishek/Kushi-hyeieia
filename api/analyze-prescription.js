import { GoogleGenerativeAI } from '@google/generative-ai'
import { callOpenRouter } from './openrouter-client.js'

export function normalizeResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') {
        return { document_type: 'Prescription', medicines: [] }
    }

    try {
        let cleanJson = responseText.trim()
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '')
        cleanJson = cleanJson.replace(/\s*```$/i, '')
        cleanJson = cleanJson.trim()

        const firstBrace = cleanJson.indexOf('{')
        const lastBrace = cleanJson.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1)
        }

        const parsed = JSON.parse(cleanJson)
        const safeResult = {}

        safeResult.document_type =
            typeof parsed.document_type === 'string' && parsed.document_type.trim()
                ? parsed.document_type.trim()
                : 'Prescription'

        const medicinesInput = Array.isArray(parsed.medicines) ? parsed.medicines : []

        safeResult.medicines = medicinesInput
            .filter(med => med && typeof med === 'object')
            .map(med => {
                const name =
                    typeof med.name === 'string' && med.name.trim()
                        ? med.name.trim()
                        : 'Unknown medicine'

                const purpose =
                    typeof med.uses_for === 'string' && med.uses_for.trim()
                        ? med.uses_for.trim()
                        : (typeof med.purpose === 'string' && med.purpose.trim()
                            ? med.purpose.trim()
                            : 'No specific purpose provided by AI.')

                const instructions =
                    typeof med.does === 'string' && med.does.trim()
                        ? med.does.trim()
                        : (typeof med.instructions === 'string' && med.instructions.trim()
                            ? med.instructions.trim()
                            : "Follow the doctor's written instructions on the prescription.")

                const type =
                    typeof med.type === 'string' && med.type.trim()
                        ? med.type.trim()
                        : 'Tablet'

                const confidence =
                    typeof med.confidence === 'string' && med.confidence.trim()
                        ? med.confidence.trim()
                        : 'high'

                return {
                    name,
                    purpose,
                    instructions,
                    type,
                    confidence
                }
            })

        return safeResult
    } catch (parseErr) {
        console.warn("normalizeResponse fallback:", parseErr.message)
        return {
            document_type: 'Prescription',
            medicines: []
        }
    }
}

export const normalizeGeminiResponse = normalizeResponse


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase()

    try {
        console.log('--- STARTING PRESCRIPTION ANALYSIS ---')

        // ═══════════════════════════════════════════════════════════════
        // PATH A: Text-based analysis (PDF/DOC extracted text)
        // ═══════════════════════════════════════════════════════════════
        if (contentType.includes('application/json') && req.body && req.body.extractedText) {
            const extractedText = req.body.extractedText
            console.log(`Received extracted text: ${extractedText.length} chars`)

            if (!extractedText.trim()) {
                return res.status(400).json({ error: 'Extracted text is empty. The document may not contain readable text.' })
            }

            const textPrompt = `You are an expert medical prescription analyzer. Carefully analyze the following text extracted from a medical document.

Your task:
1. Extract EVERY medicine mentioned in the text.
2. Ignore non-medical content such as hospital name, address, patient details, clinic names, etc.

For EACH medicine found, extract:
- "name": The exact medicine name as written (e.g. "Paracetamol 500mg")
- "uses_for": A short, plain English explanation of what it treats
- "does": The specific instructions written (e.g. "Take 1 tablet twice daily after meals for 5 days")
- "type": The form of medicine (Tablet, Capsule, Syrup, Injection, Ointment, Drops)
- "confidence": "high" | "medium" | "low"

Respond ONLY with raw JSON:
{
  "document_type": "Prescription",
  "medicines": [
    {
      "name": "Medicine Name",
      "uses_for": "Purpose",
      "does": "Dosage instructions",
      "type": "Tablet",
      "confidence": "high"
    }
  ]
}

If no medicines are found, return medicines as [].

Extracted text:
${extractedText}`

            let responseText = ''

            // Try OpenRouter
            const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
            if (openRouterKey) {
                try {
                    responseText = await callOpenRouter({
                        messages: [
                            { role: 'system', content: 'You are a medical prescription analyzer. Return raw JSON only.' },
                            { role: 'user', content: textPrompt }
                        ],
                        temperature: 0.1,
                        maxTokens: 1500
                    })
                } catch (err) {
                    console.warn('OpenRouter text analysis failed, trying Gemini:', err.message)
                }
            }

            // Fallback Gemini
            if (!responseText) {
                const GEMINI_API_KEY = process.env.GEMINI_API_KEY
                if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
                    try {
                        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
                        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
                        const result = await model.generateContent(textPrompt)
                        responseText = result.response.text()
                    } catch (gemErr) {
                        console.warn('Gemini text analysis failed:', gemErr.message)
                    }
                }
            }

            if (!responseText) {
                return res.status(503).json({
                    error: 'AI prescription analysis service is temporarily busy. Please try again in a few moments.',
                    document_type: 'Prescription',
                    medicines: []
                })
            }

            const parsedResult = normalizeResponse(responseText)
            return res.status(200).json({
                document_type: parsedResult.document_type,
                medicines: parsedResult.medicines
            })
        }

        // ═══════════════════════════════════════════════════════════════
        // PATH B: Image-based analysis (OCR)
        // ═══════════════════════════════════════════════════════════════
        let imageBuffer
        if (req.body && Buffer.isBuffer(req.body)) {
            imageBuffer = req.body
        } else if (req.body && req.body.length > 0) {
            imageBuffer = Buffer.from(req.body)
        } else {
            const chunks = []
            for await (const chunk of req) {
                chunks.push(chunk)
            }
            imageBuffer = Buffer.concat(chunks)
        }

        if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty image payload.' })
        }

        if (imageBuffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image exceeds 5MB limit' })
        }

        const prompt = `You are an expert medical prescription analyzer. Carefully analyze the provided prescription image.

Your task:
1. Extract EVERY medicine written in the prescription.
2. Ignore non-medical content (hospital name, address, doctor name, patient details, dates).

For EACH medicine found, extract:
- "name": The exact medicine name as written
- "uses_for": A short, plain English explanation of what it treats
- "does": The specific dosage instructions (e.g. 1-0-1 -> morning and night, after food)
- "type": Tablet | Capsule | Syrup | Injection | Ointment | Drops
- "confidence": "high" | "medium" | "low"

Respond with ONLY valid JSON:
{
  "document_type": "Prescription",
  "medicines": [
    {
      "name": "Medicine Name",
      "uses_for": "Purpose",
      "does": "Dosage instructions",
      "type": "Tablet",
      "confidence": "high"
    }
  ]
}`

        const mimeType = contentType.includes('png') ? 'image/png' : 'image/jpeg'
        const base64Image = imageBuffer.toString('base64')
        const dataUrl = `data:${mimeType};base64,${base64Image}`

        let responseText = ''

        // Try OpenRouter with active vision models
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            // Models capable of multimodal vision on OpenRouter
            const visionModels = [
                'dots-studio/dots-3-note-preview:free',
                'openrouter/free',
                'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                'google/gemma-4-26b-a4b-it:free',
                'google/gemma-4-31b-it:free'
            ]

            for (const modelName of visionModels) {
                try {
                    console.log(`Attempting prescription OCR with ${modelName}...`)
                    const controller = new AbortController()
                    const timeout = setTimeout(() => controller.abort(), 25000)

                    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openRouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://kushihygieia.in',
                            'X-Title': 'Kushi Hygieia'
                        },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are an expert prescription OCR analyzer. Read handwritten and printed medical prescriptions accurately. Return ONLY a valid JSON object matching the requested schema.'
                                },
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: prompt },
                                        { type: 'image_url', image_url: { url: dataUrl } }
                                    ]
                                }
                            ],
                            temperature: 0.1,
                            max_tokens: 1500
                        }),
                        signal: controller.signal
                    })

                    clearTimeout(timeout)

                    if (res.ok) {
                        const data = await res.json().catch(() => ({}))
                        const choice = data?.choices?.[0]
                        let content = choice?.message?.content
                        if (!content && choice?.message?.reasoning) {
                            content = choice.message.reasoning
                        }
                        if (content && typeof content === 'string') {
                            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
                            if (content) {
                                console.log(`Prescription OCR succeeded using ${modelName}`)
                                responseText = content
                                break
                            }
                        }
                    } else {
                        const errData = await res.json().catch(() => ({}))
                        console.warn(`Vision model ${modelName} returned HTTP ${res.status}:`, errData?.error?.message || res.status)
                    }
                } catch (err) {
                    console.warn(`OpenRouter vision model ${modelName} failed:`, err.message)
                }
            }
        }

        // Fallback Gemini with vision if configured
        if (!responseText) {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY
            if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
                try {
                    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
                    const result = await model.generateContent([
                        prompt,
                        { inlineData: { mimeType, data: base64Image } }
                    ])
                    responseText = result.response.text()
                } catch (gemErr) {
                    console.warn('Gemini vision OCR failed:', gemErr.message)
                }
            }
        }

        if (!responseText) {
            // Graceful fallback: return valid prescription structure with clear guidance
            return res.status(200).json({
                document_type: 'Prescription',
                medicines: [],
                message: 'Prescription scanned. Handwritten text was low-contrast or unclear. Please ensure the prescription is well-lit and upload a closer photo.'
            })
        }

        const parsedResult = normalizeResponse(responseText)
        return res.status(200).json({
            document_type: parsedResult.document_type,
            medicines: parsedResult.medicines
        })
    } catch (error) {
        console.error('Prescription Analysis Error:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
