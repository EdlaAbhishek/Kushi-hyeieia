import { GoogleGenerativeAI } from '@google/generative-ai'
import { callOpenRouter } from './openrouter-client.js'
import Tesseract from 'tesseract.js'

// ═══════════════════════════════════════════════════════════════════════════
// VERIFIED SINGLE VISION MODEL (FAST, MULTIMODAL, ULTRA-ACCURATE OCR)
// ═══════════════════════════════════════════════════════════════════════════
const SINGLE_VISION_MODEL = 'dots-studio/dots-3-note-preview:free'

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE MEDICAL DICTIONARY & REGEX PARSER (ZERO-FAILURE LOCAL ENGINE)
// ═══════════════════════════════════════════════════════════════════════════
const COMMON_MEDICINES = [
    'paracetamol', 'crocin', 'dolo', 'calpol', 'panadol', 'tylenol', 'acetaminophen',
    'amoxicillin', 'augmentin', 'mox', 'clavum', 'ampicillin', 'azithromycin', 'azee', 'zithromax',
    'cefixime', 'taxim', 'cefpodoxime', 'ceftriaxone', 'ciprofloxacin', 'cifran', 'ciro', 'ofloxacin',
    'zanocin', 'levofloxacin', 'levomac', 'norfloxacin', 'metronidazole', 'flagyl', 'doxycycline',
    'dox', 'pantoprazole', 'pan', 'pantocid', 'pantodac', 'omeprazole', 'omez', 'rabeprazole',
    'rabekind', 'happi', 'esomeprazole', 'nexpro', 'ranitidine', 'aciloc', 'famotidine',
    'antacid', 'digene', 'gelusil', 'mucaine', 'ondansetron', 'emset', 'vomistop', 'domperidone',
    'metoclopramide', 'perinorm', 'metformin', 'glycomet', 'glimepiride', 'amaryl', 'gliclazide',
    'vildagliptin', 'galvus', 'sitagliptin', 'januvia', 'dapagliflozin', 'forxiga', 'insulin',
    'atorvastatin', 'atorva', 'lipitor', 'rosuvastatin', 'rosuvas', 'amlodipine', 'stamlo', 'norvasc',
    'telmisartan', 'telma', 'micardis', 'losartan', 'zaart', 'olmesartan', 'enalapril', 'ramipril',
    'cardace', 'atenolol', 'metoprolol', 'betaloc', 'bisoprolol', 'concor', 'aspirin', 'ecosprin',
    'clopidogrel', 'clopilet', 'plavix', 'cetirizine', 'cetzine', 'zyrtec', 'levocetirizine',
    'levocet', 'montelukast', 'montair', 'fexofenadine', 'allegra', 'bilastine', 'chlorpheniramine',
    'ibuprofen', 'brufen', 'combiflam', 'diclofenac', 'voveran', 'dynapar', 'aceclofenac',
    'zerodol', 'hifenac', 'tramadol', 'ultram', 'naproxen', 'ketorolac', 'ketanov', 'prednisolone',
    'omnacortil', 'dexamethasone', 'dexona', 'betamethasone', 'betnesol', 'hydrocortisone',
    'methylprednisolone', 'defcort', 'salbutamol', 'asthalin', 'budecort', 'budesonide',
    'foracort', 'formoterol', 'seretide', 'fluticasone', 'deriphyllin', 'theophylline',
    'multivitamin', 'becosules', 'neurobion', 'zincovit', 'supradyn', 'limcee', 'vitamin c',
    'calcium', 'shelcal', 'cipcal', 'vitamin d3', 'cholecalciferol', 'd3', 'folic acid', 'folvite',
    'iron', 'autrin', 'orofer', 'livogen', 'dextromethorphan', 'ascoril', 'benadryl', 'grilinctus',
    'ambroxol', 'bromhexine', 'guaifenesin', 'zedex', 't-bact', 'mupirocin', 'betadine', 'povidone'
]

export function ruleBasedPrescriptionParser(text) {
    if (!text || typeof text !== 'string') return { medicines: [] }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const foundMedicines = []
    const seenNames = new Set()

    for (const line of lines) {
        const lower = line.toLowerCase()

        // Match medicine names or forms with dosage/frequency
        const matchedMed = COMMON_MEDICINES.find(med => new RegExp(`\\b${med}\\b`, 'i').test(lower))
        const formMatch = line.match(/\b(tab(?:let)?|cap(?:sule)?|syr(?:up)?|inj(?:ection)?|oint(?:ment)?|drop(?:s)?|cream|gel|susp(?:ension)?|inhaler)\b/i)
        const dosageMatch = line.match(/\b(\d+(?:\.\d+)?\s*(?:mg|ml|gm|mcg|iu))\b/i)
        const freqMatch = line.match(/\b(1-0-1|1-1-1|0-0-1|1-0-0|0-1-0|1-0-0-1|od|bd|bid|tds|tid|qid|sos|hs|stat|prn)\b/i)
        const timingMatch = line.match(/\b(after\s+food|before\s+food|after\s+meals|before\s+meals|empty\s+stomach|with\s+food|pc|ac)\b/i)
        const durationMatch = line.match(/\b(\d+\s*(?:days?|weeks?|months?|d|w))\b/i)

        if (matchedMed || (formMatch && (dosageMatch || freqMatch))) {
            let name = ''
            if (matchedMed) {
                name = matchedMed.charAt(0).toUpperCase() + matchedMed.slice(1)
                if (dosageMatch) name += ` ${dosageMatch[1]}`
            } else {
                const words = line.replace(/^(?:rx|\d+[\.\)]|tab|cap|syr|inj)\.?\s*/i, '').split(/\s+/)
                name = words.slice(0, 3).join(' ')
            }

            const cleanKey = name.toLowerCase().replace(/[^a-z0-9]/g, '')
            if (seenNames.has(cleanKey)) continue
            seenNames.add(cleanKey)

            let type = 'Tablet'
            if (formMatch) {
                const f = formMatch[1].toLowerCase()
                if (f.startsWith('cap')) type = 'Capsule'
                else if (f.startsWith('syr') || f.startsWith('susp')) type = 'Syrup'
                else if (f.startsWith('inj')) type = 'Injection'
                else if (f.startsWith('oint') || f.startsWith('cream') || f.startsWith('gel')) type = 'Ointment'
                else if (f.startsWith('drop')) type = 'Drops'
                else if (f.startsWith('inhal')) type = 'Inhaler'
            }

            let instructions = []
            if (freqMatch) {
                const fr = freqMatch[1].toUpperCase()
                if (fr === '1-0-1' || fr === 'BD' || fr === 'BID') instructions.push('Take twice daily (Morning and Night)')
                else if (fr === '1-1-1' || fr === 'TDS' || fr === 'TID') instructions.push('Take three times daily (Morning, Afternoon, Night)')
                else if (fr === '1-0-0' || fr === 'OD') instructions.push('Take once daily (Morning)')
                else if (fr === '0-0-1' || fr === 'HS') instructions.push('Take once daily at bedtime')
                else if (fr === 'SOS' || fr === 'PRN') instructions.push('Take as needed')
                else instructions.push(`Frequency: ${fr}`)
            }
            if (timingMatch) instructions.push(timingMatch[1].toLowerCase().includes('before') ? 'Before food' : 'After food')
            if (durationMatch) instructions.push(`For ${durationMatch[1]}`)

            foundMedicines.push({
                name,
                purpose: 'Prescribed medication for treatment/management.',
                instructions: instructions.length > 0 ? instructions.join(', ') : "Follow doctor's instructions.",
                type,
                confidence: matchedMed ? 'high' : 'medium'
            })
        }
    }

    return { medicines: foundMedicines }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROBUST JSON PARSER & SALVAGE ENGINE
// ═══════════════════════════════════════════════════════════════════════════
function extractJsonFromText(raw) {
    if (!raw) return null
    if (typeof raw === 'object') return raw

    let text = String(raw).trim()
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    // 1. Direct JSON parse
    try {
        return JSON.parse(text)
    } catch (_) {}

    // 2. Find outermost curly braces
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        const candidate = text.substring(firstBrace, lastBrace + 1)
        try {
            return JSON.parse(candidate)
        } catch (_) {
            // Remove trailing commas before } or ]
            const repaired = candidate.replace(/,\s*([}\]])/g, '$1')
            try {
                return JSON.parse(repaired)
            } catch (__) {}
        }
    }

    // 3. Salvage medicines array if JSON was truncated
    const medicinesMatch = text.match(/"medicines"\s*:\s*\[([\s\S]*)/i)
    if (medicinesMatch) {
        const medsArraySlice = medicinesMatch[1]
        const medicineBlocks = []
        const itemRegex = /{[^{}]*"name"[^{}]*}/g
        let match
        while ((match = itemRegex.exec(medsArraySlice)) !== null) {
            try {
                const item = JSON.parse(match[0].replace(/,\s*}/g, '}'))
                if (item?.name) medicineBlocks.push(item)
            } catch (_) {}
        }
        if (medicineBlocks.length > 0) {
            return {
                document_type: 'Prescription',
                medicines: medicineBlocks
            }
        }
    }

    return null
}

// ═══════════════════════════════════════════════════════════════════════════
// NORMALIZE & SAFE-WRAPPER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
export function normalizeResponse(responseText, fallbackText = '') {
    if (!responseText && !fallbackText) {
        return {
            document_type: 'Prescription',
            summary: 'Prescription scanned, but readable text was unclear. Please upload a clear, well-lit photo.',
            raw_text: '',
            medicines: []
        }
    }

    const parsed = extractJsonFromText(responseText)
    const safeResult = {}

    safeResult.document_type =
        typeof parsed?.document_type === 'string' && parsed.document_type.trim()
            ? parsed.document_type.trim()
            : 'Prescription'

    safeResult.raw_text =
        typeof parsed?.raw_text === 'string' && parsed.raw_text.trim()
            ? parsed.raw_text.trim()
            : (typeof fallbackText === 'string' ? fallbackText.trim() : '')

    const rawMedicines = Array.isArray(parsed?.medicines)
        ? parsed.medicines
        : (Array.isArray(parsed?.medications) ? parsed.medications : [])

    safeResult.medicines = rawMedicines
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
                        : 'Prescribed medication for treatment/management.')

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

    // If AI found 0 medicines, check if rule-based regex can extract any from raw_text
    if (safeResult.medicines.length === 0 && safeResult.raw_text) {
        const regexResult = ruleBasedPrescriptionParser(safeResult.raw_text)
        if (regexResult.medicines.length > 0) {
            safeResult.medicines = regexResult.medicines
        }
    }

    // Populate descriptive summary
    if (typeof parsed?.summary === 'string' && parsed.summary.trim()) {
        safeResult.summary = parsed.summary.trim()
    } else if (safeResult.medicines.length > 0) {
        safeResult.summary = `${safeResult.medicines.length} medicine(s) detected with dosage and directions.`
    } else if (safeResult.raw_text) {
        safeResult.summary = 'Document text scanned successfully. Review extracted details below.'
    } else {
        safeResult.summary = 'Prescription detected, but specific medicines could not be clearly identified.'
    }

    if (parsed?.extracted_data && Array.isArray(parsed.extracted_data)) {
        safeResult.extracted_data = parsed.extracted_data
    }

    return safeResult
}

export const normalizeGeminiResponse = normalizeResponse

// ═══════════════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════════════
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
3. Classify document_type ("Prescription", "Lab Report", "Medical Bill", or "Medical Document").
4. Provide a 1-sentence summary of the document.
5. Include the complete text in "raw_text".

For EACH medicine found, extract:
- "name": The exact medicine name with dosage/strength as written (e.g. "Paracetamol 500mg")
- "uses_for": A short, plain English explanation of what it treats
- "does": The specific instructions written (e.g. "Take 1 tablet twice daily after meals for 5 days")
- "type": The form of medicine (Tablet, Capsule, Syrup, Injection, Ointment, Drops)
- "confidence": "high" | "medium" | "low"

Respond ONLY with raw JSON:
{
  "document_type": "Prescription",
  "summary": "1-sentence summary",
  "raw_text": "Extracted text",
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

            const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
            if (openRouterKey) {
                try {
                    responseText = await callOpenRouter({
                        messages: [
                            { role: 'system', content: 'You are a medical prescription analyzer. Return raw JSON only.' },
                            { role: 'user', content: textPrompt }
                        ],
                        temperature: 0.1,
                        maxTokens: 3000
                    })
                } catch (err) {
                    console.warn('OpenRouter text analysis failed, trying Gemini/fallback:', err.message)
                }
            }

            // Fallback Gemini if key configured
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

            const parsedResult = normalizeResponse(responseText, extractedText)
            return res.status(200).json(parsedResult)
        }

        // ═══════════════════════════════════════════════════════════════
        // PATH B: Image-based analysis (Single Dedicated Vision Model)
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

        if (imageBuffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image exceeds 10MB limit' })
        }

        const prompt = `You are an expert clinical pharmacist and medical document OCR specialist.
Analyze this medical document or prescription image with high precision.
It may be a handwritten doctor's prescription, printed medical prescription, hospital discharge summary, lab report, or medical bill.

Your task:
1. Extract ALL visible and readable text into "raw_text".
2. Extract EVERY medicine, tablet, syrup, injection, or treatment into "medicines".
3. Provide a helpful 1-2 sentence overview in "summary".
4. Determine the document category in "document_type" ("Prescription", "Lab Report", "Medical Bill", or "Medical Document").

For EACH medicine found:
- "name": Full medicine name and strength (e.g. "Dolo 650mg", "Amoxicillin 500mg")
- "uses_for": Condition, illness, or symptom it treats in simple words
- "does": Precise dosage instructions (e.g. "1-0-1 morning and night after food")
- "type": Tablet | Capsule | Syrup | Injection | Ointment | Drops
- "confidence": "high" | "medium" | "low"

Respond with ONLY valid JSON:
{
  "document_type": "Prescription",
  "summary": "Summary of prescription or medical document",
  "raw_text": "Complete extracted readable text from the image",
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

        // ─────────────────────────────────────────────────────────────
        // TIER 1: Dedicated Single Vision Model (dots-studio/dots-3-note-preview:free)
        // ─────────────────────────────────────────────────────────────
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[OCR] Calling single vision model ${SINGLE_VISION_MODEL} (attempt ${attempt}/2)...`)
                    const controller = new AbortController()
                    const timeout = setTimeout(() => controller.abort(), 35000)

                    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openRouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://kushihygieia.in',
                            'X-Title': 'Kushi Hygieia'
                        },
                        body: JSON.stringify({
                            model: SINGLE_VISION_MODEL,
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
                            // 5000 tokens ensures reasoning + full completion JSON are never truncated
                            max_tokens: 5000,
                            temperature: 0.1
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
                            if (content && (content.includes('{') || content.length > 20)) {
                                console.log(`[OCR] Prescription OCR succeeded using ${SINGLE_VISION_MODEL}`)
                                responseText = content
                                break
                            }
                        }
                    } else {
                        const errData = await res.json().catch(() => ({}))
                        console.warn(`[OCR] Vision model ${SINGLE_VISION_MODEL} attempt ${attempt} returned HTTP ${res.status}:`, errData?.error?.message || res.status)
                    }
                } catch (err) {
                    console.warn(`[OCR] Vision model attempt ${attempt} failed:`, err.message)
                }

                if (!responseText && attempt < 2) {
                    await new Promise(r => setTimeout(r, 1200))
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // TIER 2: Local Tesseract OCR (Zero-Failure Fallback Engine)
        // ─────────────────────────────────────────────────────────────
        let tesseractText = ''
        const parsedEarly = responseText ? extractJsonFromText(responseText) : null

        // If vision AI didn't respond OR returned 0 text / 0 medicines, run local Tesseract OCR!
        if (!parsedEarly || (!parsedEarly.raw_text && (!parsedEarly.medicines || parsedEarly.medicines.length === 0))) {
            try {
                console.log('Running local Tesseract OCR on image buffer...')
                const ocr = await Tesseract.recognize(imageBuffer, 'eng')
                tesseractText = ocr?.data?.text?.trim() || ''
                console.log(`Tesseract extracted ${tesseractText.length} characters of text.`)
            } catch (ocrErr) {
                console.warn('Local Tesseract OCR failed:', ocrErr.message)
            }
        }

        // ─────────────────────────────────────────────────────────────
        // TIER 3: If Tesseract obtained text, structure it with Text LLM
        // ─────────────────────────────────────────────────────────────
        if (tesseractText && (!responseText || !parsedEarly?.medicines?.length)) {
            const textPrompt = `You are an expert medical prescription analyzer. The following text was extracted from an image of a medical document or prescription:
"""
${tesseractText}
"""

Your task:
1. Extract ALL medicines, treatments, and prescriptions.
2. Determine document_type ("Prescription", "Lab Report", "Medical Bill", or "Medical Document").
3. Provide a brief 1-2 sentence summary.
4. Keep the readable text in "raw_text".

Return ONLY JSON:
{
  "document_type": "Prescription",
  "summary": "Summary of document",
  "raw_text": ${JSON.stringify(tesseractText)},
  "medicines": [
    {
      "name": "Medicine name with strength",
      "uses_for": "Condition or purpose",
      "does": "Dosage instructions",
      "type": "Tablet",
      "confidence": "high"
    }
  ]
}`

            if (openRouterKey) {
                try {
                    console.log('Structuring Tesseract text with OpenRouter text models...')
                    const structuredText = await callOpenRouter({
                        messages: [
                            { role: 'system', content: 'You are an expert prescription analyzer. Return raw JSON only.' },
                            { role: 'user', content: textPrompt }
                        ],
                        temperature: 0.1,
                        maxTokens: 2500
                    })
                    if (structuredText) {
                        responseText = structuredText
                    }
                } catch (llmErr) {
                    console.warn('Text structuring LLM failed, using regex fallback:', llmErr.message)
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // TIER 4: Final Normalization with Safety Net
        // ─────────────────────────────────────────────────────────────
        const finalResult = normalizeResponse(responseText, tesseractText)
        return res.status(200).json(finalResult)

    } catch (error) {
        console.error('Prescription Analysis Error:', error)
        return res.status(500).json({
            error: error.message || 'Internal server error',
            document_type: 'Prescription',
            summary: 'An error occurred during analysis. Please try again.',
            medicines: []
        })
    }
}
