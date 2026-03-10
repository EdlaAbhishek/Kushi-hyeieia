export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT
    const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY

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

        // ── 6. Parsing logic: Extract medicines from Azure OCR text lines ──

        let parsedResult = { medicines: [], doctor_notes: '' }

        const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY
        const OPENROUTER_MODEL = process.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'

        if (OPENROUTER_API_KEY && extractedText.length > 5) {
            const prompt = `You are a medical AI assistant parsing OCR data from a messy handwritten prescription or hospital receipt.
Extract the medicines and doctor's notes from the text below.
Format your response as a pure JSON object matching this structure EXACTLY:
{
  "medicines": [
    {
      "name": "Clean Medicine Name (e.g. Paracetamol, Eltroxin, Amtocal)",
      "dosage": "Dosage (e.g. 500mg, 50-2+2+2)",
      "frequency": "Frequency (e.g. 1-0-1, OD, bd)",
      "duration": "Duration (e.g. 5 days, 1 week)",
      "notes": "Identify if it's a Tablet/Capsule/Syrup AND briefly explain its medical use (e.g. 'Tablet. Used for Thyroid management.')"
    }
  ],
  "doctor_notes": "Any doctor's notes, diagnosis, patient details, or instructions found. If it's a bill/receipt with no clear medicines, briefly explain the document type here and leave the medicines array empty."
}

ONLY output pure JSON. Do not include markdown blocks, backticks, or any other text. Strip the JSON wrapper before answering.

OCR TEXT:
${extractedText}
`
            try {
                const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: OPENROUTER_MODEL,
                        messages: [{ role: 'user', content: prompt }]
                    })
                })

                if (openRouterResponse.ok) {
                    const openRouterData = await openRouterResponse.json()
                    const aiText = openRouterData.choices[0].message.content
                    // Clean markdown wrapping if AI returns it
                    const jsonText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim()
                    parsedResult = JSON.parse(jsonText)
                } else {
                    console.error('OpenRouter API error:', await openRouterResponse.text())
                    throw new Error('OpenRouter API failed')
                }
            } catch (err) {
                console.error('LLM Parsing failed:', err)
                parsedResult.doctor_notes = 'Advanced AI processing failed. Please review the raw extracted text below.'
            }
        }

        if (!parsedResult.medicines || parsedResult.medicines.length === 0) {
            if (!parsedResult.doctor_notes) {
                parsedResult.doctor_notes = 'No distinct medicines were found. Please ensure the image is a clear prescription, not a receipt or report.'
            }
            parsedResult.medicines = []
        }

        // Add raw_text so frontend can show it if needed
        parsedResult.raw_text = extractedText

        return res.status(200).json(parsedResult)

    } catch (error) {
        console.error('Prescription analysis error:', error)
        console.error('Stack trace:', error.stack)
        return res.status(500).json({
            error: 'Backend execution failed: ' + error.message,
            stack: error.stack
        })
    }
}

// Disable body parser so we can read raw binary data
export const config = {
    api: {
        bodyParser: false
    }
}
