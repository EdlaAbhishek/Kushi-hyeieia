import { describe, it, expect } from 'vitest'
import { normalizeGeminiResponse } from './analyze-prescription.js'

describe('normalizeGeminiResponse', () => {
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
})

