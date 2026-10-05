// Clinical Knowledge Engine & Fallback Health Advisor for Kushi Hygieia
// Provides reliable, evidence-based health guidance and emergency detection
// in English, Hindi (हिंदी), and Telugu (తెలుగు)

export const EMERGENCY_PATTERNS = [
    /chest pain|heart attack|angina|pressure in chest/i,
    /can't breathe|difficulty breathing|shortness of breath|suffocating|choking|wheezing severe/i,
    /stroke|face drooping|arm weakness|slurred speech|sudden numbness|paralysis/i,
    /severe bleeding|uncontrolled bleeding|gushing blood|deep wound/i,
    /unconscious|fainted|unresponsive|passed out|seizure|convulsion/i,
    /severe allergic|anaphylaxis|throat swelling|lips swelling/i,
    /poison|swallowed chemical|overdose|snake bite/i,
    /high fever with stiff neck|hallucination|fever above 104|fever above 40/i
]

export function isEmergencyQuery(query) {
    if (!query) return false
    return EMERGENCY_PATTERNS.some(p => p.test(query))
}

const KNOWLEDGE_BASE = {
    emergency: {
        en: `🚨 **CRITICAL MEDICAL EMERGENCY DETECTED**

Please take immediate action:
1. **Call 108 (India Emergency Ambulance) or 112 immediately.**
2. If experiencing chest pain or stroke symptoms, **do NOT drive yourself** — have someone take you to the nearest emergency room.
3. Keep the patient sitting upright, loosen tight clothing, and keep them calm.
4. If the person is unresponsive and not breathing, begin CPR if trained.

*This AI assistant cannot treat emergencies. Please reach an emergency department right now.*`,
        hi: `🚨 **गंभीर आपातकालीन स्थिति (EMERGENCY)**

कृपया तुरंत यह कदम उठाएं:
1. **तुरंत 108 (एम्बुलेंस) या 112 पर कॉल करें।**
2. यदि सीने में दर्द या सांस लेने में गंभीर तकलीफ है, तो स्वयं गाड़ी न चलाएं। तुरंत नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।
3. मरीज को आराम से बैठाएं, तंग कपड़े ढीले करें और शांत रखें।

*यह AI सहायक आपात स्थिति का इलाज नहीं कर सकता। कृपया तुरंत अस्पताल जाएं।*`,
        te: `🚨 **తీవ్రమైన అత్యవసర పరిస్థితి (EMERGENCY)**

దయచేసి వెంటనే ఈ క్రింది చర్యలు తీసుకోండి:
1. **వెంటనే 108 (అంబులెన్స్) లేదా 112 కి కాల్ చేయండి.**
2. గుండె నొప్పి లేదా శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది ఉంటే స్వయంగా డ్రైవ్ చేయకండి. వెంటనే దగ్గరలోని ఎమర్జెన్సీ విభాగానికి వెళ్ళండి.
3. రోగిని సౌకర్యవంతంగా కూర్చోబెట్టి, వదులుగా ఉండే బట్టలు వేసి ప్రశాంతంగా ఉంచండి.

*దయచేసి ఆలస్యం చేయకుండా వెంటనే అత్యవసర వైద్య సహాయం పొందండి.*`
    },
    fever: {
        keywords: ['fever', 'temperature', 'chills', 'bukhar', 'jwaram', 'zwaram', 'pyrexia', 'body heat', 'warm'],
        en: `🌡️ **Guidance for Mild to Moderate Fever**

**Recommended Care Steps:**
- **Rest & Recovery:** Stay in bed and give your immune system time to fight the illness.
- **Hydration:** Drink plenty of fluids — water, coconut water, clear soups, and oral rehydration solution (ORS).
- **Cooling Down:** Wear lightweight, breathable cotton clothing. You may apply a lukewarm wet cloth to forehead.
- **Temperature Monitoring:** Check your temperature every 4-6 hours using a digital thermometer.

**When to consult a doctor immediately:**
- Temperature exceeds 103°F (39.4°C) or lasts more than 3 days.
- Accompanied by stiff neck, confusion, breathing difficulty, or rash.

*Consult a registered physician on Kushi Hygieia for personalized medical advice.*`,
        hi: `🌡️ **बुखार के लिए स्वास्थ्य मार्गदर्शन**

**देखभाल के उपाय:**
- **पर्याप्त आराम:** शरीर को संक्रमण से लड़ने के लिए पूरा आराम दें।
- **हाइड्रेशन (तरल पदार्थ):** खूब पानी, नारियल पानी, सूप और ORS पिएं ताकि डिहाइड्रेशन न हो।
- **हल्के कपड़े:** सूती और आरामदायक कपड़े पहनें। माथे पर सामान्य पानी की ठंडी पट्टी रख सकते हैं।
- **तापमान मापें:** हर 4-6 घंटे में थर्मामीटर से बुखार चेक करें।

**डॉक्टर से कब मिलें:**
- यदि बुखार 103°F (39.4°C) से अधिक हो या 3 दिन से अधिक समय तक रहे।
- यदि बुखार के साथ गर्दन में अकड़न, सांस लेने में तकलीफ या दाने हों।

*दवा लेने से पहले हमेशा डॉक्टर से परामर्श अवश्य लें।*`,
        te: `🌡️ **జ్వరం కోసం ఆరోగ్య మార్గదర్శకాలు**

**సంరక్షణ చర్యలు:**
- **విశ్రాంతి:** శరీరానికి పూర్తి విశ్రాంతి ఇవ్వండి.
- **ద్రవాలు ఎక్కువగా తీసుకోండి:** మంచి నీళ్లు, కొబ్బరి నీళ్లు, సూప్స్ మరియు ORS ద్రావణం త్రాగండి.
- **తేలికపాటి దుస్తులు:** కాటన్ దుస్తులు ధరించండి. నుదిటిపై చల్లని నీటి తడి గుడ్డను ఉంచవచ్చు.
- **ఉష్ణోగ్రతను గమనించండి:** ప్రతి 4-6 గంటలకు థర్మామీటర్‌తో జ్వరాన్ని పరీక్షించండి.

**వైద్యుడిని ఎప్పుడు సంప్రదించాలి:**
- జ్వరం 103°F కన్నా ఎక్కువ ఉన్నా లేదా 3 రోజులకు మించి కొనసాగినా.
- శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా మెడ పట్టేసినట్లు అనిపిస్తే వెంటనే వైద్యుడిని సంప్రదించండి.`
    },
    headache: {
        keywords: ['headache', 'migraine', 'head pain', 'sar dard', 'tala noppi', 'throbbing head'],
        en: `🧠 **Guidance for Headache & Migraine**

**Immediate Relief Tips:**
- **Rest in a Quiet, Dark Room:** Sensory overload often exacerbates headaches.
- **Hydrate:** Dehydration is one of the leading triggers for acute headaches.
- **Cold or Warm Compress:** Apply an ice pack wrapped in a cloth to forehead or temples, or warm compress to the neck.
- **Limit Screen Time:** Rest your eyes from phones, laptops, and bright lighting.

**Warning Signs (Seek Medical Attention):**
- Sudden, severe "thunderclap" headache (worst of your life).
- Headache with numbness, confusion, vision loss, or fever.

*If headaches are frequent or recurring, please book an appointment with a neurologist or physician.*`,
        hi: `🧠 **सिरदर्द और माइग्रेन के लिए मार्गदर्शन**

**आराम पाने के उपाय:**
- **शांत और अंधेरे कमरे में आराम करें:** तेज रोशनी और आवाज से दूर रहें।
- **पानी पिएं:** शरीर में पानी की कमी सिरदर्द का मुख्य कारण हो सकती है।
- **सिकाई करें:** माथे पर ठंडे कपड़े या आइस पैक की सिकाई करें।
- **स्क्रीन से दूरी:** मोबाइल और लैपटॉप से थोड़ी देर दूरी बनाएं।

**सावधानी:**
- यदि सिरदर्द अचानक और बहुत तेज हो या इसके साथ उल्टी, चक्कर या आंखों के आगे अंधेरा आए तो तुरंत डॉक्टर से मिलें।`,
        te: `🧠 **తలనొప్పి మరియు మైగ్రేన్ నివారణ సూచనలు**

**తక్షణ ఉపశమనం కోసం:**
- **చీకటి, ప్రశాంతమైన గదిలో విశ్రాంతి తీసుకోండి:** ఎక్కువ వెలుతురు, శబ్దాలకు దూరంగా ఉండండి.
- **మంచి నీళ్లు తాగండి:** డీహైడ్రేషన్ తలనొప్పికి ప్రధాన కారణం కావచ్చు.
- **నుదిటిపై చల్లని గుడ్డతో కాపడం:** ఐస్ ప్యాక్ లేదా చల్లని గుడ్డను నుదిటిపై ఉంచండి.
- **స్క్రీన్ సమయం తగ్గించండి:** మొబైల్, టీవీ లేదా కంప్యూటర్ స్క్రీన్లను చూడటం ఆపండి.

*తలనొప్పి తీవ్రంగా ఉన్నా లేదా తరచుగా వస్తున్నా వైద్యుడిని సంప్రదించండి.*`
    },
    cold_cough: {
        keywords: ['cold', 'cough', 'sore throat', 'runny nose', 'sneezing', 'khansi', 'jukam', 'daggu', 'jalubu', 'gontu noppi'],
        en: `🫁 **Guidance for Cold, Cough & Sore Throat**

**Self-Care Measures:**
- **Warm Salt Water Gargle:** Gargle with warm water mixed with 1/2 teaspoon of salt 2-3 times daily for throat relief.
- **Steam Inhalation:** Inhaling warm steam helps clear nasal congestion and soothe airways.
- **Warm Liquids:** Drink warm ginger-honey water, herbal teas, or warm turmeric milk (Haldi Doodh).
- **Adequate Sleep:** Aim for 8+ hours to help your respiratory tract recover.

**Consult a doctor if:**
- Cough produces thick green/yellow/bloody mucus or lasts >2 weeks.
- Wheezing or difficulty breathing develops.`,
        hi: `🫁 **सर्दी, खांसी और गले की खराश के लिए मार्गदर्शन**

**घरेलू देखभाल:**
- **नमक के गुनगुने पानी से गरारे:** दिन में 2-3 बार गुनगुने पानी में थोड़ा नमक डालकर गरारे करें।
- **भाप (Steam) लें:** नाक और छाती के कफ को ढीला करने के लिए भाप लें।
- **गर्म पेय पदार्थ:** गर्म पानी, अदरक-शहद का काढ़ा या हल्दी वाला दूध पिएं।
- **आराम:** पर्याप्त नींद लें ताकि शरीर जल्दी ठीक हो सके।

**डॉक्टर से परामर्श लें:**
- यदि खांसी 2 हफ्ते से ज्यादा रहे या सांस फूलने लगे।`,
        te: `🫁 **దగ్గు, జలుబు మరియు గొంతు నొప్పి కోసం సూచనలు**

**స్వీయ సంరక్షణ సూచనలు:**
- **గోరువెచ్చని ఉప్పు నీటితో గార్గ్లింగ్:** రోజుకు 2-3 సార్లు గోరువెచ్చని ఉప్పు నీటితో పుక్కిలించండి.
- **ఆవిరి పట్టడం (Steam Inhalation):** ముక్కు దిబ్బడ మరియు ఛాతీలో కఫం తగ్గడానికి ఆవిరి పట్టండి.
- **వెచ్చని ద్రవాలు:** అల్లం టీ, పసుపు పాలు లేదా గోరువెచ్చని నీరు త్రాగండి.

*దగ్గు 2 వారాలకు మించి కొనసాగితే వెంటనే వైద్యుడిని సంప్రదించండి.*`
    },
    stomach: {
        keywords: ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'pet dard', 'loose motion', 'kadupu noppi', 'acidity', 'gas'],
        en: `🥣 **Guidance for Stomach Upset, Acidity & Diarrhea**

**Recommended Measures:**
- **Hydration is Crucial:** For loose stools or vomiting, sip ORS (Oral Rehydration Solution) or coconut water continuously.
- **BRAT Diet:** Eat bland foods like Bananas, Rice, Applesauce, and Toast. Buttermilk with roasted cumin is gentle on digestion.
- **Avoid Irritants:** Stay away from spicy, greasy, deep-fried foods, dairy, caffeine, and alcohol.
- **Sit Upright:** For acid reflux, avoid lying down immediately after meals.

**Consult a Doctor If:**
- Severe sharp abdominal pain, inability to keep fluids down for 24 hours, blood in vomit/stool, or high fever.`,
        hi: `🥣 **पेट दर्द, अपच, गैस और दस्त के लिए मार्गदर्शन**

**देखभाल के सुझाव:**
- **ORS और तरल पदार्थ:** दस्त या उल्टी में शरीर से पानी की कमी न होने दें। ORS या नारियल पानी घूंट-घूंट पिएं।
- **हल्का सुपाच्य भोजन:** खिचड़ी, केला, दही-चावल या उबले आलू खाएं।
- **मसालेदार भोजन से बचें:** तली-भुनी, तीखी चीजों और चाय-कॉफी से परहेज करें।

**सावधानी:**
- यदि पेट में असहनीय दर्द हो, उल्टी/मल में खून आए या लगातार उल्टी हो रही हो तो तुरंत डॉक्टर से मिलें।`,
        te: `🥣 **కడుపు నొప్పి, ఎసిడిటీ మరియు విరేచనాల కోసం సూచనలు**

**సంరక్షణ చర్యలు:**
- **ORS ద్రావణం తాగండి:** నీరసం రాకుండా ORS లేదా కొబ్బరి నీళ్ళు తరచుగా కొద్ది కొద్దిగా తాగండి.
- **తేలికపాటి ఆహారం:** కిచిడీ, మజ్జిగ అన్నం, అరటిపండు వంటి సులభంగా జీర్ణమయ్యే ఆహారం తీసుకోండి.
- **కారం, నూనె పదార్థాలు వద్దు:** మసాలాలు, వేపుళ్ళు మరియు టీ, కాఫీలకు దూరంగా ఉండండి.

*తీవ్రమైన కడుపు నొప్పి లేదా రక్త విరేచనాలు ఉంటే వెంటనే ఆసుపత్రికి వెళ్ళండి.*`
    }
}

export function generateHealthGuidance(query, language = 'en') {
    const q = (query || '').toLowerCase().trim()
    const lang = ['hi', 'te'].includes(language) ? language : 'en'

    // 1. Check Emergency First
    if (isEmergencyQuery(q)) {
        return {
            content: KNOWLEDGE_BASE.emergency[lang],
            isEmergency: true
        }
    }

    // 2. Check Specific Symptom Match
    for (const [, item] of Object.entries(KNOWLEDGE_BASE)) {
        if (item.keywords && item.keywords.some(k => q.includes(k))) {
            return {
                content: item[lang] || item.en,
                isEmergency: false
            }
        }
    }

    // 3. General Health Guidance Fallback
    const generalResponses = {
        en: `Hello! I'm Kushi Care AI. I understand you're inquiring about your health: "${query}".

**General Health Guidelines:**
- **Monitor Your Symptoms:** Note when symptoms began, their severity, and any triggers.
- **Stay Hydrated & Rest:** Adequate hydration and 7-8 hours of sleep support your body's immune and recovery systems.
- **Avoid Self-Medication:** Do not take prescription medicines or antibiotics without a certified doctor's consultation.
- **Consult Our Doctors:** For an accurate clinical assessment, diagnosis, or prescription, please connect with a qualified doctor on Kushi Hygieia.

*If you experience sudden severe pain, chest tightness, or breathing difficulties, please call 108 immediately.*`,
        hi: `नमस्ते! मैं खुशी केयर AI हूँ। आपके स्वास्थ्य संबंधी प्रश्न: "${query}" के संबंध में:

**सामान्य स्वास्थ्य सलाह:**
- **लक्षणों पर ध्यान दें:** नोट करें कि समस्या कब शुरू हुई और कितनी गंभीर है।
- **भरपूर पानी और आराम:** शरीर को स्वस्थ रखने के लिए पर्याप्त पानी पिएं और 7-8 घंटे की अच्छी नींद लें।
- **बिना सलाह दवा न लें:** बिना डॉक्टर के परामर्श के कोई भी एंटीबायोटिक या नई दवा न लें।
- **डॉक्टर से संपर्क करें:** सटीक जांच और इलाज के लिए खुशी हाइजीआ (Kushi Hygieia) पर डॉक्टर से परामर्श लें।

*किसी भी गंभीर समस्या में तुरंत 108 पर कॉल करें।*`,
        te: `నమస్కారం! నేను ఖుషి కేర్ AI ని. మీ ఆరోగ్య సమస్య: "${query}" కి సంబంధించి:

**సాధారణ ఆరోగ్య సూచనలు:**
- **లక్షణాలను గమనించండి:** సమస్య ఎప్పుడు మొదలైందో, ఎంత తీవ్రంగా ఉందో గమనించండి.
- **తగినంత విశ్రాంతి & నీరు:** శరీరానికి తగినంత విశ్రాంతినివ్వండి మరియు రోజూ పుష్కలంగా నీరు త్రాగండి.
- **సొంత వైద్యం వద్దు:** డాక్టర్ సలహా లేకుండా మందులు వాడవద్దు.
- **డాక్టర్‌ను సంప్రదించండి:** ఖచ్చితమైన రోగ నిర్ధారణ మరియు చికిత్స కోసం ఖుషి హైజీయా ప్లాట్‌ఫామ్‌లోని అర్హతగల వైద్యులను సంప్రదించండి.

*తీవ్రమైన అత్యవసర సమయాల్లో వెంటనే 108 కి కాల్ చేయండి.*`
    }

    return {
        content: generalResponses[lang] || generalResponses.en,
        isEmergency: false
    }
}
