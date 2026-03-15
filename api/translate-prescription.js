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
                console.log(`[translate-prescription] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`)
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
        const { content, targetLanguage } = req.body

        if (!content || !targetLanguage) {
            return res.status(400).json({ error: 'content and targetLanguage are required.' })
        }

        if (targetLanguage === 'en') {
            return res.status(200).json(content)
        }

        const langMap = {
            hi: 'Hindi',
            te: 'Telugu'
        }

        const langName = langMap[targetLanguage]
        if (!langName) {
            return res.status(400).json({ error: 'Unsupported language. Use: en, hi, te' })
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        })

        const prompt = `You are a professional medical translator. Translate the following medical prescription analysis result COMPLETELY into ${langName}.

Rules:
- Keep the EXACT same JSON structure and field names in English (keys stay in English)
- Translate ALL field VALUES into ${langName}, including:
  - Medicine/tablet names: transliterate into ${langName} script (e.g. "Paracetamol" → "${langName === 'Hindi' ? 'पैरासिटामोल' : 'పారాసిటమాల్'}")
  - Dosage and usage instructions: translate fully into ${langName}
  - Medicine type: translate (e.g. "Tablet" → "${langName === 'Hindi' ? 'गोली' : 'టాబ్లెట్'}", "Capsule" → "${langName === 'Hindi' ? 'कैप्सूल' : 'క్యాప్సూల్'}", "Syrup" → "${langName === 'Hindi' ? 'सिरप' : 'సిరప్'}")
  - Purpose and instructions: translate fully into ${langName}
  - Document type: translate into ${langName}
  - Patient name: keep as-is (do not translate proper nouns)
  - All other descriptive text: translate into ${langName}
- Keep "confidence" values as-is ("high", "medium", "low")
- The entire output should be readable by a ${langName}-speaking person who does not understand English

Input JSON to translate:
${JSON.stringify(content, null, 2)}

Return the translated JSON with the same structure.`

        const result = await callWithRetry(() => model.generateContent(prompt))
        const responseText = result.response.text()

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
            console.error('Translation parse error:', e)
            return res.status(500).json({ error: 'Failed to parse translated response.' })
        }

        return res.status(200).json(parsed)
    } catch (error) {
        console.error('Translation Error:', error)
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('RESOURCE_EXHAUSTED')
        if (is429) {
            return res.status(429).json({ error: 'Translation service is temporarily busy. Please wait a moment and try again.' })
        }
        return res.status(500).json({ error: error.message || 'Translation failed' })
    }
}

