import { describe, it, expect } from 'vitest'
import { normalizeGeminiResponse, normalizeResponse, ruleBasedPrescriptionParser } from './analyze-prescription.js'

describe('normalizeGeminiResponse / normalizeResponse', () => {
    it('parses clean JSON with medicines array', () => {
        const raw = JSON.stringify({
            document_type: 'Prescription',
            medicines: [
                {
                    name: 'Paracetamol',
                    purpose: 'Reduces fever',
                    instructions: 'Take one tablet twice a day',
                    type: 'Tablet'
                }
            ]
        })

        const result = normalizeGeminiResponse(raw)

        expect(result.document_type).toBe('Prescription')
        expect(Array.isArray(result.medicines)).toBe(true)
        expect(result.medicines).toHaveLength(1)
        expect(result.medicines[0]).toMatchObject({
            name: 'Paracetamol',
            purpose: 'Reduces fever',
            instructions: 'Take one tablet twice a day',
            type: 'Tablet',
            confidence: 'high'
        })
    })

    it('handles markdown fenced JSON and missing optional fields', () => {
        const raw = `
        \`\`\`json
        {
          "medicines": [
            {
              "name": "UnknownDrug"
            }
          ]
        }
        \`\`\`
        `

        const result = normalizeGeminiResponse(raw)

        expect(result.document_type).toBe('Prescription')
        expect(result.medicines).toHaveLength(1)
        const med = result.medicines[0]
        expect(med.name).toBe('UnknownDrug')
        expect(typeof med.purpose).toBe('string')
        expect(typeof med.instructions).toBe('string')
        expect(med.type).toBe('Tablet')
        expect(med.confidence).toBe('high')
    })

    it('returns empty medicines array when none provided', () => {
        const raw = JSON.stringify({
            document_type: 'Prescription'
        })

        const result = normalizeGeminiResponse(raw)
        expect(result.medicines).toEqual([])
    })

    it('strips <think> tags and handles reasoning prelude', () => {
        const raw = `<think>Step 1: check medicines...</think>
        \`\`\`json
        {
          "document_type": "Prescription",
          "summary": "Patient prescribed Dolo 650mg",
          "raw_text": "Tab Dolo 650mg 1-0-1",
          "medicines": [
            { "name": "Dolo 650mg", "type": "Tablet", "does": "1-0-1 after food" }
          ]
        }
        \`\`\``

        const result = normalizeResponse(raw)
        expect(result.document_type).toBe('Prescription')
        expect(result.medicines).toHaveLength(1)
        expect(result.medicines[0].name).toBe('Dolo 650mg')
    })

    it('salvages medicines from truncated JSON', () => {
        const truncated = `
        {
          "document_type": "Prescription",
          "medicines": [
            { "name": "Amoxicillin 500mg", "type": "Capsule", "uses_for": "Bacterial infection" },
            { "name": "Pantoprazole 40mg", "type": "Tablet"
        `

        const result = normalizeResponse(truncated)
        expect(result.medicines).toHaveLength(1)
        expect(result.medicines[0].name).toBe('Amoxicillin 500mg')
    })

    it('falls back to ruleBasedPrescriptionParser when AI finds 0 medicines but raw_text has prescriptions', () => {
        const raw = JSON.stringify({
            document_type: 'Prescription',
            raw_text: 'Rx: Tab Dolo 650mg 1-0-1 for 5 days after food\nCap Amoxicillin 500mg TDS for 7 days',
            medicines: []
        })

        const result = normalizeResponse(raw)
        expect(result.medicines.length).toBeGreaterThanOrEqual(1)
        expect(result.medicines.some(m => m.name.toLowerCase().includes('dolo'))).toBe(true)
    })
})
