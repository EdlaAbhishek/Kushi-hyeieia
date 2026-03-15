import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const testTranslation = async () => {
    try {
        console.log("Testing translation format locally...");
        const content = {
            documentType: "Doctor Prescription",
            medicines: [
                {
                    name: "Paracetamol 500mg",
                    type: "Tablet",
                    purpose: "Fever and mild pain relief",
                    instructions: "Take 1 tablet after meals, twice a day for 3 days."
                }
            ],
            confidence: "high"
        };
        
        const response = await fetch('http://localhost:3000/api/translate-prescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, targetLanguage: 'te' })
        });
        
        if (!response.ok) {
            console.error("API failed:", response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Success:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Test failed", e);
    }
}

testTranslation();
