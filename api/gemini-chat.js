import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Emergency keywords detector
const EMERGENCY_PATTERNS = [
    /chest pain|heart attack|angina|pressure in chest/i,
    /can't breathe|difficulty breathing|shortness of breath|suffocating|choking|wheezing severe/i,
    /stroke|face drooping|arm weakness|slurred speech|sudden numbness|paralysis/i,
    /severe bleeding|uncontrolled bleeding|gushing blood|deep wound/i,
    /unconscious|fainted|unresponsive|passed out|seizure|convulsion/i,
    /severe allergic|anaphylaxis|throat swelling|lips swelling/i,
    /poison|swallowed chemical|overdose|snake bite/i
]

function generateClinicalFallback(userText, language = 'en') {
    const text = (userText || '').toLowerCase()
    const isEmergency = EMERGENCY_PATTERNS.some(p => p.test(text))

    if (isEmergency) {
        if (language === 'hi') {
            return `🚨 **आपातकालीन चेतावनी (EMERGENCY)**: आपकी स्थिति तुरंत चिकित्सकीय ध्यान मांगती है।\n\n1. **तुरंत 108 (एम्बुलेंस) या 112 पर कॉल करें।**\n2. स्वयं वाहन न चलाएं, नजदीकी अस्पताल के आपातकालीन वार्ड में जाएं।\n3. मरीज को सीधा और आरामदायक स्थिति में रखें।`
        }
        if (language === 'te') {
            return `🚨 **అత్యవసర హెచ్చరిక (EMERGENCY)**: మీ లక్షణాలకు తక్షణ వైద్య సహాయం అవసరం.\n\n1. **వెంటనే 108 లేదా 112 కి కాల్ చేయండి.**\n2. వెంటనే దగ్గరలోని ఆసుపత్రి ఎమర్జెన్సీ విభాగానికి వెళ్ళండి.\n3. రోగిని సౌకర్యవంతంగా కూర్చోబెట్టి ప్రశాంతంగా ఉంచండి.`
        }
        return `🚨 **CRITICAL MEDICAL EMERGENCY DETECTED**\n\n1. **Call 108 (India Emergency Ambulance) or 112 immediately.**\n2. Do NOT drive yourself — head to the nearest Emergency Room (ER) right away.\n3. Keep the patient in a comfortable seated position and stay calm.`
    }

    // Common symptoms fallback
    if (/fever|bukhar|jwaram|temperature|chills/i.test(text)) {
        if (language === 'hi') {
            return `🌡️ **बुखार के लिए मार्गदर्शन**:\n- पर्याप्त आराम करें और शरीर को डिहाइड्रेशन से बचाने के लिए पानी, सूप व ORS पिएं।\n- माथे पर सामान्य पानी की पट्टी रखें।\n- यदि बुखार 103°F से अधिक हो या 3 दिन से अधिक रहे, तो तुरंत Kushi Hygieia पर डॉक्टर से परामर्श लें।`
        }
        if (language === 'te') {
            return `🌡️ **జ్వరం కోసం సూచనలు**:\n- తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు, ORS మరియు కొబ్బరి నీళ్ళు త్రాగండి.\n- నుదిటిపై చల్లని గుడ్డతో కాపడం పెట్టండి.\n- జ్వరం 3 రోజులకు మించి ఉన్నా లేదా 103°F దాటినా ఖుషి హైజీయా వైద్యుడిని సంప్రదించండి.`
        }
        return `🌡️ **Fever Guidance**:\n- Get plenty of rest and hydrate frequently with water, clear broths, and ORS.\n- Wear light, breathable clothing.\n- If your fever exceeds 103°F (39.4°C) or lasts more than 3 days, please consult a qualified doctor on Kushi Hygieia.`
    }

    if (/headache|migraine|sar dard|tala noppi/i.test(text)) {
        if (language === 'hi') {
            return `🧠 **सिरदर्द और माइग्रेन के लिए मार्गदर्शन**:\n- एक शांत, अंधेरे कमरे में आराम करें।\n- खूब पानी पिएं (डिहाइड्रेशन सिरदर्द का मुख्य कारण है)।\n- माथे पर ठंडी सिकाई करें और मोबाइल/स्क्रीन से दूर रहें।`
        }
        if (language === 'te') {
            return `🧠 **తలనొప్పి కోసం సూచనలు**:\n- ప్రశాంతమైన, చీకటి గదిలో విశ్రాంతి తీసుకోండి.\n- తగినంత నీరు త్రాగండి మరియు స్క్రీన్ సమయాన్ని తగ్గించండి.\n- నుదిటిపై చల్లని గుడ్డతో కాపడం ఉంచండి.`
        }
        return `🧠 **Headache Relief Guidance**:\n- Rest in a quiet, dimly lit room to reduce sensory strain.\n- Drink a large glass of water, as mild dehydration commonly triggers headaches.\n- Apply a cool damp cloth to your forehead or temples.\n- If the headache is sudden and unusually severe, seek medical evaluation.`
    }

    if (language === 'hi') {
        return `नमस्ते! मैं Kushi Care AI हूँ। आपके स्वास्थ्य प्रश्न के लिए सामान्य मार्गदर्शन:\n- लक्षणों पर नज़र रखें और पर्याप्त आराम व पोषण लें।\n- बिना डॉक्टर की सलाह के कोई भी दवा न लें।\n- व्यक्तिगत और सटीक उपचार के लिए कृपया Kushi Hygieia पर पंजीकृत डॉक्टर से परामर्श करें।`
    }
    if (language === 'te') {
        return `నమస్కారం! నేను ఖుషి కేర్ AI ని. మీ ఆరోగ్య సమస్యకు సంబంధించిన సాధారణ సమాచారం:\n- శరీరానికి తగినంత విశ్రాంతినివ్వండి మరియు క్రమం తప్పకుండా నీరు త్రాగండి.\n- డాక్టర్ అనుమతి లేకుండా కొత్త మందులు వేసుకోకండి.\n- సరైన చికిత్స కొరకు ఖుషి హైజీయా ప్లాట్‌ఫామ్‌లోని వైద్యులను సంప్రదించండి.`
    }
    return `Hello! I'm Kushi Care AI, your healthcare assistant.\n\nFor your query, remember to prioritize rest, stay well-hydrated, and track your symptoms. For a definitive diagnosis and prescription, please book a consultation with our verified doctors on Kushi Hygieia.`
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { messages, language } = req.body || {}

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required.' })
        }

        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

        // Build language instruction
        const langMap = { hi: 'Hindi', te: 'Telugu', en: 'English' }
        const langName = langMap[language] || ''
        const langInstruction = langName && language !== 'en'
            ? `\n\nIMPORTANT: The user prefers ${langName}. You MUST respond entirely in ${langName} (${language} script). Keep medical terms in English where necessary for clarity.`
            : ''

        const systemPrompt = `You are Kushi Care AI, a helpful, empathetic healthcare assistant for the Kushi Hygieia platform — an Indian healthcare app serving patients in English, Hindi, and Telugu.

Rules:
- Provide general health guidance, wellness tips, and first-aid information.
- NEVER diagnose conditions or prescribe medicines.
- Always remind users to consult a qualified doctor for medical concerns.
- Be warm, supportive, and culturally sensitive to Indian healthcare context.
- If someone describes an emergency (chest pain, difficulty breathing, severe bleeding), urgently advise them to call 108 (Indian emergency) or visit the nearest hospital immediately.
- Keep responses concise (under 250 words) unless the user asks for detailed information.${langInstruction}`

        // 1. Try OpenRouter with resilient multi-model cascade
        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
        if (openRouterKey) {
            try {
                const formattedMessages = [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }))
                ]

                const reply = await callOpenRouter({
                    messages: formattedMessages,
                    temperature: 0.6,
                    maxTokens: 500
                })

                if (reply) {
                    return res.status(200).json({ reply })
                }
            } catch (openRouterErr) {
                console.warn('OpenRouter Chat failed, checking Gemini fallback:', openRouterErr.message)
            }
        }

        // 2. Fallback to Gemini if configured
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY
        if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
            try {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
                const result = await model.generateContent(lastUserMsg || 'Hello')
                return res.status(200).json({ reply: result.response.text() })
            } catch (geminiErr) {
                console.warn('Gemini fallback failed:', geminiErr.message)
            }
        }

        // 3. Resilient Clinical Knowledge Fallback (Ensures user is NEVER greeted with a broken 500 error)
        const fallbackReply = generateClinicalFallback(lastUserMsg, language)
        return res.status(200).json({ reply: fallbackReply })
    } catch (error) {
        console.error('Chat Error:', error)
        const fallback = generateClinicalFallback('', 'en')
        return res.status(200).json({ reply: fallback })
    }
}
