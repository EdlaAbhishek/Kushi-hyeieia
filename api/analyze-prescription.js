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

        let documentType = 'general'
        const lowerData = extractedText.toLowerCase()

        // ── 6a. Document Classification ──

        // Keywords for classification
        const billKeywords = ['amount', 'total', '₹', 'rs.', 'invoice', 'bill', 'payment', 'receipt', 'balance', 'due']
        const labKeywords = ['hemoglobin', 'glucose', 'cholesterol', 'test result', 'report', 'reference range', 'pathology', 'laboratory']
        const rxKeywords = ['tablet', 'tab', 'mg', 'dosage', '1-0-1', 'od', 'bd', 'tds', 'rx', 'r/', 'doctor', 'clinic', 'syrup', 'cap']

        const scoreType = (keywords) => keywords.filter(kw => lowerData.includes(kw)).length

        const scores = {
            bill: scoreType(billKeywords),
            lab_report: scoreType(labKeywords),
            prescription: scoreType(rxKeywords)
        }

        // Determine dominant type based on highest score (needs at least 1 match)
        let maxScore = 0
        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score
                documentType = type
            }
        }

        // ── 6b. Contextual Extraction ──

        const extractedData = []
        let summaryText = 'Extracted text from the uploaded document.'

        if (documentType === 'prescription') {
            summaryText = 'Medical prescription detected. Extracted medicines and dosages are listed below.'

            // Re-implement heuristic medicine extraction
            const dosageRegex = /\b\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu|%)\b/i
            const frequencyRegex = /(?:\d+-\d+-\d+|\b(?:od|bd|tid|qid|sos|hs|stat|tds|once|twice|thrice)\b)/i
            let currentObject = null

            for (let i = 0; i < textLines.length; i++) {
                const line = textLines[i].trim()
                if (line.length < 3) continue

                // Soft match for medicine
                if (rxKeywords.some(kw => line.toLowerCase().startsWith(kw)) || dosageRegex.test(line)) {
                    if (currentObject) extractedData.push(currentObject)

                    let cleanName = line.replace(/^\d+[\.\)\-\]]\s*/, '').replace(dosageRegex, '').trim()

                    currentObject = {
                        name: cleanName || line,
                        dosage: line.match(dosageRegex)?.[0] || '—',
                        frequency: line.match(frequencyRegex)?.[0] || '—',
                        duration: '—'
                    }
                } else if (currentObject) {
                    if (currentObject.frequency === '—' && frequencyRegex.test(line)) {
                        currentObject.frequency = line.match(frequencyRegex)[0]
                    }
                }
            }
            if (currentObject) extractedData.push(currentObject)

        } else if (documentType === 'bill') {
            summaryText = 'Medical bill or receipt detected. Attempting to extract line items and amounts.'

            // Extract lines that look like: "Consultation Fee  500.00"
            const itemRegex = /^[a-zA-Z\s\-\.]+[\s\t]+(?:rs\.?|₹)?\s*(\d+(?:\.\d{2})?)$/i

            for (const line of textLines) {
                if (line.length < 5) continue
                const match = line.match(itemRegex)
                if (match) {
                    const amount = match[1]
                    const itemName = line.replace(match[0], '').replace(amount, '').trim()
                    // Don't push if the itemName is empty or just generic "total"
                    if (itemName.length > 2 && !itemName.toLowerCase().includes('total')) {
                        extractedData.push({
                            item: itemName,
                            amount: amount
                        })
                    }
                }

                // Specifically look for Total
                if (line.toLowerCase().includes('total') && /\d+/.test(line)) {
                    const totalMatch = line.match(/\d+(?:\.\d{2})?/)
                    if (totalMatch) {
                        extractedData.push({ item: 'TOTAL AMOUNT', amount: totalMatch[0] })
                    }
                }
            }

        } else if (documentType === 'lab_report') {
            summaryText = 'Diagnostic or lab report detected. Attempting to extract test results and values.'

            // Look for test lines with numbers: "Hemoglobin 14.2 g/dL"
            const testRegex = /^([a-zA-Z\s\-]+)[\s:]+(\d+(?:\.\d+)?)\s*([a-zA-Z\/%]+)?/

            for (const line of textLines) {
                if (line.length < 5) continue
                if (labKeywords.some(kw => line.toLowerCase().includes(kw))) {
                    const match = line.match(testRegex)
                    if (match && match[1].length > 3) {
                        extractedData.push({
                            test_name: match[1].trim(),
                            result: match[2].trim(),
                            unit: match[3] ? match[3].trim() : ''
                        })
                    }
                }
            }
        } else {
            // General Document
            summaryText = `General text document identified. Extracted ${textLines.length} lines of text. See raw output below.`
        }

        const parsedResult = {
            document_type: documentType,
            summary: summaryText,
            extracted_data: extractedData
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
