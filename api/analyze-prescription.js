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

        // Expanded keywords that typically indicate a medicine line
        const medicineKeywords = [
            'tab', 'cap', 'syr', 'inj', 'oint', 'drp', 'gel', 'cream',
            'tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops',
            'lotion', 'powder', 'suspension', 'spray', 'inhaler', 'patch',
            'rx', 'r/', 'rp'
        ]

        // Common Indian drug names (partial matches)
        const commonDrugNames = [
            'paracetamol', 'amoxicillin', 'azithromycin', 'ciprofloxacin', 'metformin',
            'omeprazole', 'pantoprazole', 'ranitidine', 'cetirizine', 'montelukast',
            'atorvastatin', 'amlodipine', 'losartan', 'telmisartan', 'metoprolol',
            'aspirin', 'clopidogrel', 'diclofenac', 'ibuprofen', 'aceclofenac',
            'doxycycline', 'levofloxacin', 'ofloxacin', 'cefixime', 'augmentin',
            'amoxyclav', 'cephalexin', 'norfloxacin', 'metronidazole', 'fluconazole',
            'domperidone', 'ondansetron', 'rabeprazole', 'esomeprazole', 'sucralfate',
            'multivitamin', 'vitamin', 'calcium', 'iron', 'folic', 'zinc',
            'prednisone', 'prednisolone', 'dexamethasone', 'hydrocortisone',
            'insulin', 'glimepiride', 'sitagliptin', 'vildagliptin',
            'salbutamol', 'budesonide', 'levosalbutamol', 'deriphylline',
            'phenylephrine', 'chlorpheniramine', 'dextromethorphan', 'guaifenesin',
            'crocin', 'dolo', 'combiflam', 'disprin', 'saridon', 'allegra',
            'pan', 'shelcal', 'becosules', 'limcee', 'evion', 'zincovit',
            'eltroxin', 'thyronorm', 'ecosprin'
        ]

        const frequencyRegex = /(?:\d+-\d+-\d+|\b(?:od|bd|tid|qid|sos|hs|stat|tds|once|twice|thrice)\b)/i
        const dosageRegex = /\b\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu|%)\b/i
        const durationRegex = /\b(?:for\s+)?(\d+\s+(?:day|week|month)s?)\b/i

        // Check if a line looks like a medicine
        const isMedicineLine = (line) => {
            const lower = line.toLowerCase().trim()
            // Starts with medicine keyword
            if (medicineKeywords.some(kw => lower.startsWith(kw + ' ') || lower.startsWith(kw + '.') || lower.startsWith(kw + '\t') || lower === kw)) return true
            // Contains a known drug name
            if (commonDrugNames.some(drug => lower.includes(drug))) return true
            // Starts with a number followed by a period/bracket (numbered list: "1.", "1)", "1-")
            if (/^\d+[\.\)\-\]]\s*.+/i.test(line) && (dosageRegex.test(line) || medicineKeywords.some(kw => lower.includes(kw)))) return true
            // Contains dosage AND is not just a number/date/phone
            if (dosageRegex.test(line) && line.length > 5 && line.length < 80 && !frequencyRegex.test(line)) return true
            return false
        }

        // Lines to skip (headers, footers, hospital info)
        const isNoiseLine = (line) => {
            const lower = line.toLowerCase()
            const noisePatterns = [
                'hospital', 'clinic', 'dr.', 'doctor', 'mbbs', 'md', 'ms',
                'reg no', 'registration', 'mobile:', 'phone:', 'email:',
                'address', 'consultation', 'opd', 'ipd', 'date:', 'time:',
                'patient name', 'age:', 'gender:', 'token', 'receipt',
                'www.', 'http', '.com', '.in', '.org',
                'corporate', 'identity', 'cin:', 'registered office',
                'for appointment', 'emergency', 'valid for',
                'scan here', 'scan to book', 'previous investigation'
            ]
            return noisePatterns.some(p => lower.includes(p))
        }

        for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i].trim()
            if (!line || line.length < 3) continue

            const lowerLine = line.toLowerCase()

            if (isMedicineLine(line)) {
                // Push previous medicine
                if (currentMedicine) {
                    medicines.push(currentMedicine)
                }

                // Clean up the name: remove numbering prefix like "1." or "1)"
                let cleanName = line.replace(/^\d+[\.\)\-\]]\s*/, '').trim()
                // Remove dosage from name display
                cleanName = cleanName.replace(dosageRegex, '').trim()
                // Remove trailing/leading punctuation
                cleanName = cleanName.replace(/^[\-\.\,\:]+|[\-\.\,\:]+$/g, '').trim()

                currentMedicine = {
                    name: cleanName || line,
                    dosage: '—',
                    frequency: '—',
                    duration: '—',
                    notes: ''
                }

                // Extract dosage from same line
                const dosageMatch = line.match(dosageRegex)
                if (dosageMatch) currentMedicine.dosage = dosageMatch[0]

                // Extract frequency from same line
                const freqMatch = line.match(frequencyRegex)
                if (freqMatch) currentMedicine.frequency = freqMatch[0]

                // Extract duration from same line
                const durMatch = line.match(durationRegex)
                if (durMatch) currentMedicine.duration = durMatch[1]

                // Check for food instructions on same line
                if (lowerLine.includes('after food') || lowerLine.includes('before food') || lowerLine.includes('with food') || lowerLine.includes('empty stomach')) {
                    const foodMatch = lowerLine.match(/(after food|before food|with food|empty stomach)/i)
                    if (foodMatch) currentMedicine.notes = foodMatch[0]
                }
            }
            else if (currentMedicine) {
                // Continue building current medicine from next lines
                let matchedAnything = false

                const freqMatch = line.match(frequencyRegex)
                if (freqMatch && currentMedicine.frequency === '—') {
                    currentMedicine.frequency = freqMatch[0]
                    matchedAnything = true
                }

                const durMatch = line.match(durationRegex)
                if (durMatch && currentMedicine.duration === '—') {
                    currentMedicine.duration = durMatch[1]
                    matchedAnything = true
                }

                if (lowerLine.includes('after food') || lowerLine.includes('before food') || lowerLine.includes('with food') || lowerLine.includes('empty stomach') || lowerLine.includes('bf') || lowerLine.includes('af')) {
                    currentMedicine.notes += (currentMedicine.notes ? ', ' : '') + line
                    matchedAnything = true
                }

                if (!matchedAnything && !isNoiseLine(line)) {
                    // Short lines near a medicine are likely instructions
                    if (line.length < 40) {
                        currentMedicine.notes += (currentMedicine.notes ? ', ' : '') + line
                    } else {
                        doctorNotes.push(line)
                    }
                }
            } else {
                // Not part of any medicine — skip noise lines
                if (!isNoiseLine(line) && line.length > 3) {
                    doctorNotes.push(line)
                }
            }
        }

        // Push the last one
        if (currentMedicine) {
            medicines.push(currentMedicine)
        }

        const parsedResult = {
            medicines: medicines,
            doctor_notes: medicines.length === 0
                ? 'No distinct medicines were found. Please ensure the image is a clear prescription, not a receipt or report.'
                : (doctorNotes.length > 0 ? doctorNotes.join('. ') : 'No specific patient notes detected.')
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
