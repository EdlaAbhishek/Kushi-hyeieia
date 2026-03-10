export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT
    const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!AZURE_VISION_ENDPOINT || !AZURE_VISION_KEY) {
        return res.status(500).json({ error: 'Azure Vision credentials not configured' })
    }

    try {
        // ── 1. Get the image buffer from request body ──
        const chunks = []
        for await (const chunk of req) {
            chunks.push(chunk)
        }
        const imageBuffer = Buffer.concat(chunks)

        if (imageBuffer.length === 0) {
            return res.status(400).json({ error: 'No image data received' })
        }

        if (imageBuffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image exceeds 5MB limit' })
        }

        // ── 2. Send image to Azure Vision Read API ──
        const analyzeUrl = `${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`

        const analyzeResponse = await fetch(analyzeUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
                'Content-Type': 'application/octet-stream'
            },
            body: imageBuffer
        })

        if (!analyzeResponse.ok) {
            const errorBody = await analyzeResponse.text()
            console.error('Azure Vision analyze error:', analyzeResponse.status, errorBody)
            return res.status(502).json({
                error: 'Unable to read the prescription clearly. Please upload a clearer image.'
            })
        }

        // ── 3. Get the operation-location URL to poll for results ──
        const operationLocation = analyzeResponse.headers.get('operation-location')
        if (!operationLocation) {
            return res.status(502).json({ error: 'Azure Vision did not return an operation URL' })
        }

        // ── 4. Poll for OCR results (max 10 attempts, 1s apart) ──
        let ocrResult = null
        for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const resultResponse = await fetch(operationLocation, {
                headers: { 'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY }
            })

            if (!resultResponse.ok) {
                continue
            }

            const resultData = await resultResponse.json()

            if (resultData.status === 'succeeded') {
                ocrResult = resultData
                break
            } else if (resultData.status === 'failed') {
                return res.status(502).json({
                    error: 'Unable to read the prescription clearly. Please upload a clearer image.'
                })
            }
            // status is 'running' or 'notStarted' — keep polling
        }

        if (!ocrResult) {
            return res.status(504).json({ error: 'OCR processing timed out. Please try again.' })
        }

        // ── 5. Extract text lines from OCR result ──
        const textLines = []
        const readResults = ocrResult.analyzeResult?.readResults || []
        for (const page of readResults) {
            for (const line of page.lines || []) {
                textLines.push(line.text)
            }
        }

        const extractedText = textLines.join('\n')

        if (!extractedText.trim()) {
            return res.status(200).json({
                medicines: [],
                doctor_notes: 'Could not read prescription. Please upload a clearer image.',
                raw_text: ''
            })
        }

        // ── 6. AI Interpretation: Send extracted text to Gemini ──
        const prompt = `You are a precise medical prescription interpreter. Below is OCR-extracted text from a prescription image.

EXTRACTED TEXT:
${extractedText}

CRITICAL RULES:
- Extract ONLY medicines and information that are clearly present in the text
- Do NOT invent, guess, or hallucinate any medicines or dosages
- If a word is unclear, write it as "[unclear]"
- Extract medicine name, dosage, frequency, duration, and any notes for each medicine

Return ONLY a valid JSON object with this structure:
{
  "medicines": [
    { "name": "Medicine name", "dosage": "e.g. 500mg", "frequency": "e.g. 1-0-1", "duration": "e.g. 5 days", "notes": "e.g. After food" }
  ],
  "doctor_notes": "Patient condition, diagnosis, advice, follow-up instructions. If none visible, write 'No additional notes found.'"
}
Do not include \`\`\`json or any other formatting. Return only the raw JSON.`

        let parsedResult = null

        // Try Gemini first
        if (GEMINI_API_KEY) {
            try {
                const geminiResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0 }
                        })
                    }
                )

                if (geminiResponse.ok) {
                    const geminiData = await geminiResponse.json()
                    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
                    if (text) {
                        const cleanText = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
                        const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                            parsedResult = JSON.parse(jsonMatch[0])
                        }
                    }
                }
            } catch (geminiErr) {
                console.warn('Gemini interpretation failed:', geminiErr.message)
            }
        }

        // Fallback: return raw text as a single "medicine" entry
        if (!parsedResult || !parsedResult.medicines) {
            parsedResult = {
                medicines: [{
                    name: 'Raw Prescription Text',
                    dosage: '—',
                    frequency: '—',
                    duration: '—',
                    notes: extractedText
                }],
                doctor_notes: 'AI interpretation unavailable. Showing raw OCR text.'
            }
        }

        // Add raw_text so frontend can show it if needed
        parsedResult.raw_text = extractedText

        return res.status(200).json(parsedResult)

    } catch (error) {
        console.error('Prescription analysis error:', error)
        return res.status(500).json({
            error: 'Unable to read the prescription clearly. Please upload a clearer image.'
        })
    }
}

// Disable body parser so we can read raw binary data
export const config = {
    api: {
        bodyParser: false
    }
}
