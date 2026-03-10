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

        const medicines = []
        let currentMedicine = null
        let doctorNotes = []

        // Common patterns
        const medicineKeywords = ['tab', 'cap', 'syr', 'inj', 'oint', 'drp', 'tablet', 'capsule', 'syrup', 'injection']
        const frequencyRegex = /(?:\d+-\d+-\d+|\b(?:od|bd|tid|qid|sos|hs|stat)\b)/i
        const dosageRegex = /\b\d+(?:\.\d+)?(?:mg|ml|g|mcg|iu)\b/i
        const durationRegex = /\b(?:for\s+)?(\d+\s+(?:day|week|month)s?)\b/i

        for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i].trim()
            if (!line) continue

            const lowerLine = line.toLowerCase()

            // Check if this line looks like a medicine name (starts with clinical keyword or feels like a noun phrase)
            const startsWithKeyword = medicineKeywords.some(kw => lowerLine.startsWith(kw))
            // Only consider it a new medicine if it's the start, or it explicitly has a typical drug name format
            // Often OCR separates "Tab Paracetamol 500mg" or "Paracetamol 500mg"

            if (startsWithKeyword || (dosageRegex.test(line) && !frequencyRegex.test(line) && line.length > 5)) {
                // If we were building a medicine, push it
                if (currentMedicine) {
                    medicines.push(currentMedicine)
                }

                currentMedicine = {
                    name: line.replace(dosageRegex, '').trim(), // Remove dosage from name if present
                    dosage: '—',
                    frequency: '—',
                    duration: '—',
                    notes: ''
                }

                // Try to extract dosage from the current line
                const dosageMatch = line.match(dosageRegex)
                if (dosageMatch) {
                    currentMedicine.dosage = dosageMatch[0]
                }
            }
            else if (currentMedicine) {
                // Look for frequency/duration in subsequent lines
                let matchedPattern = false

                const freqMatch = line.match(frequencyRegex)
                if (freqMatch) {
                    currentMedicine.frequency = freqMatch[0]
                    matchedPattern = true
                }

                const durMatch = line.match(durationRegex)
                if (durMatch) {
                    currentMedicine.duration = durMatch[1]
                    matchedPattern = true
                }

                // If it wasn't a frequency/duration but we already have a medicine active, it might be an instruction/note
                if (!matchedPattern) {
                    // Check if it's another dosage format or loose text
                    if (lowerLine.includes('after food') || lowerLine.includes('before food') || lowerLine.includes('bf') || lowerLine.includes('af')) {
                        currentMedicine.notes += (currentMedicine.notes ? ' ' : '') + line
                    } else if (line.length > 3) {
                        // Could be doctor note instead
                        doctorNotes.push(line)
                    }
                }
            } else {
                // Not attached to a medicine, likely doctor notes/patient info
                if (line.length > 3) {
                    doctorNotes.push(line)
                }
            }
        }

        // Push the last one
        if (currentMedicine) {
            medicines.push(currentMedicine)
        }

        const parsedResult = {
            medicines: medicines.length > 0 ? medicines : [{
                name: 'Raw Prescription Text',
                dosage: '—',
                frequency: '—',
                duration: '—',
                notes: extractedText
            }],
            doctor_notes: doctorNotes.length > 0 ? doctorNotes.join('. ') : 'No specific patient notes detected.'
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
