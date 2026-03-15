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
                console.log(`[analyze-prescription] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`)
                await new Promise(r => setTimeout(r, delay))
                continue
            }
            throw err
        }
    }
}

/**
 * Normalize and safely parse Gemini's JSON response.
 * Handles markdown fences, prose wrapping, and missing fields.
 */
function normalizeGeminiResponse(rawText) {
    if (typeof rawText !== 'string') {
        throw new Error('Gemini response must be a string')
    }

    // Strip markdown fences and trim
    let cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()

    // Slice to outermost braces
    const firstBrace = cleanJson.indexOf('{')
    const lastBrace = cleanJson.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.slice(firstBrace, lastBrace + 1)
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
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured in environment variables.' })
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase()

    try {
        console.log('--- STARTING GEMINI PRO PRESCRIPTION ANALYSIS ---')

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        // ═══════════════════════════════════════════════════════════════
        // PATH A: Text-based analysis (PDF/DOC extracted text sent as JSON)
        // ═══════════════════════════════════════════════════════════════
        if (contentType.includes('application/json') && req.body && req.body.extractedText) {
            const extractedText = req.body.extractedText
            console.log(`Received extracted text: ${extractedText.length} chars`)

            if (!extractedText.trim()) {
                return res.status(400).json({ error: 'Extracted text is empty. The document may not contain readable text.' })
            }

            const textPrompt = `You are an expert medical prescription analyzer. Carefully analyze the following text extracted from a medical document (PDF or Word document).

Your task:
1. Extract EVERY medicine mentioned in the text. Do NOT hardcode or assume any medicine names — extract them dynamically from the text.
2. Ignore non-medical content such as hospital name, address, patient details, clinic names, bill numbers, signatures, dates, and any headers/footers.

For EACH medicine found, extract:
- "name": The exact medicine name as written (e.g. "Paracetamol 500mg", "Amoxicillin 250mg")
- "uses_for": A short, plain English explanation of what the medicine does in the body and what symptoms/conditions it treats
- "does": The specific instructions written for this medicine. Convert dosage patterns into clear human-readable instructions:
  * "1-0-1" means "Take 1 tablet in the morning and 1 tablet at night"
  * "1-1-1" means "Take 1 tablet in the morning, 1 in the afternoon, and 1 at night"
  * "0-0-1" means "Take 1 tablet at night only"
  * "SOS" means "Take only when needed"
  * "OD" means "Once daily"
  * "BD" means "Twice daily"
  * "TID" means "Three times daily"
  Include duration if mentioned. Include food instructions if specified.
- "type": The form of medicine (Tablet, Capsule, Syrup, Injection, Ointment, Drops). Default to "Tablet" if unclear.
- "confidence": "high" if clearly readable, "medium" if partially readable, "low" if guessed.

Respond ONLY with raw JSON (no markdown code blocks, no explanation text):

{
  "document_type": "Prescription",
  "medicines": [
    {
      "name": "Medicine Name",
      "uses_for": "What the medicine does in the body",
      "does": "Clear instructions from the prescription",
      "type": "Form of medicine",
      "confidence": "high"
    }
  ]
}

If the text contains no medicines, return medicines as an empty array [].

Here is the extracted text:
---
${extractedText}
---`

            const result = await callWithRetry(() => model.generateContent(textPrompt))
            const responseText = result.response.text()
            console.log('Gemini Text Analysis Response (truncated):', responseText.slice(0, 2000))

            let parsedResult
            try {
                parsedResult = normalizeGeminiResponse(responseText)
            } catch (e) {
                console.error('Failed to parse Gemini JSON output:', e)
                return res.status(500).json({ error: 'Failed to process the AI response securely.' })
            }

            return res.status(200).json({
                document_type: parsedResult.document_type,
                medicines: parsedResult.medicines
            })
        }

        // ═══════════════════════════════════════════════════════════════
        // PATH B: Image-based analysis (existing OCR flow — UNCHANGED)
        // ═══════════════════════════════════════════════════════════════
        const allowedContentTypes = ['application/octet-stream', 'image/jpeg', 'image/png', 'image/jpg']
        if (contentType && !contentType.includes('application/json') && !allowedContentTypes.some(type => contentType.startsWith(type))) {
            return res.status(400).json({ error: 'Unsupported content type. Please upload a JPG, PNG image, PDF, or Word document.' })
        }

        // ── 1. Read image from request ──
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

        if (!Buffer.isBuffer(imageBuffer)) {
            return res.status(400).json({ error: 'Invalid image payload. Please upload a valid image file.' })
        }

        console.log(`Received image buffer: ${imageBuffer.length} bytes`)

        if (imageBuffer.length === 0) {
            return res.status(400).json({ error: 'No image data received' })
        }
        if (imageBuffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image exceeds 5MB limit' })
        }

        // ── 2. Call Gemini 2.5 Flash (prescription image analysis) ──
        console.log('Sending to Gemini 2.5 Flash...')

        const prompt = `You are an expert medical prescription analyzer. Carefully analyze the provided prescription image.

Your task:
1. Extract EVERY medicine written in the prescription. Do NOT hardcode or assume any medicine names — extract them dynamically from the image.
2. Ignore non-medical content such as hospital name, address, patient details, clinic names, bill numbers, signatures, dates, and any printed headers/footers.

For EACH medicine found, extract:
- "name": The exact medicine name as written (e.g. "Paracetamol 500mg", "Amoxicillin 250mg")
- "uses_for": A short, plain English explanation of what the medicine does in the body and what symptoms/conditions it treats (e.g. "Reduces fever and relieves mild to moderate pain")
- "does": The specific instructions written in the prescription for this medicine. Convert dosage patterns into clear human-readable instructions:
  * "1-0-1" means "Take 1 tablet in the morning and 1 tablet at night"
  * "1-1-1" means "Take 1 tablet in the morning, 1 in the afternoon, and 1 at night"
  * "0-0-1" means "Take 1 tablet at night only"
  * "2+2+2" means "Take 2 tablets in the morning, 2 in the afternoon, and 2 at night"
  * "SOS" means "Take only when needed"
  * "OD" means "Once daily"
  * "BD" means "Twice daily"
  * "TID" means "Three times daily"
  Include duration if mentioned (e.g. "for 5 days", "for 2 weeks"). Include food instructions if specified (e.g. "after food", "before meals").
- "type": The form of medicine (Tablet, Capsule, Syrup, Injection, Ointment, Drops). Default to "Tablet" if unclear.
- "confidence": "high" if clearly readable, "medium" if partially readable, "low" if guessed.

Respond ONLY with raw JSON (no markdown code blocks, no explanation text):

{
  "document_type": "Prescription",
  "medicines": [
    {
      "name": "Medicine Name",
      "uses_for": "What the medicine does in the body",
      "does": "Clear instructions from the prescription",
      "type": "Form of medicine",
      "confidence": "high"
    }
  ]
}

If the image is completely unreadable or contains no medicines, return medicines as an empty array [].`

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: contentType.startsWith('image/') ? contentType : 'image/jpeg'
            }
        }

        const result = await callWithRetry(() => model.generateContent([prompt, imagePart]))
        const responseText = result.response.text()

        console.log('Gemini Pro Raw Response (truncated):', responseText.slice(0, 2000))

        // ── 3. Parse and normalize JSON ──
        let parsedResult
        try {
            parsedResult = normalizeGeminiResponse(responseText)
        } catch (e) {
            console.error('Failed to parse Gemini JSON output:', e)
            return res.status(500).json({ error: 'Failed to process the AI response securely.' })
        }

        console.log('Gemini Pro Final Result:', JSON.stringify(parsedResult).slice(0, 1000))

        return res.status(200).json({
            document_type: parsedResult.document_type,
            medicines: parsedResult.medicines
        })
    } catch (error) {
        console.error('Prescription Analysis Error:', error)
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('RESOURCE_EXHAUSTED')
        if (is429) {
            return res.status(429).json({ error: 'The AI service is temporarily busy due to high demand. Please wait a moment and try again.' })
        }
        return res.status(500).json({ error: error.message || 'Internal server error analyzing image' })
    }
}

export const config = {
    api: {
        bodyParser: false
    }
}

export { normalizeGeminiResponse }
