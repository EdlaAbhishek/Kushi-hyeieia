// Shared OpenRouter Client for Khushi Hygieia Backend Handlers

export async function callOpenRouter({
    messages,
    model = process.env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free',
    temperature = 0.3,
    maxTokens = 1500,
    responseFormat = null,
    maxRetries = 2
}) {
    const apiKey = process.env.OPENROUTER_API_KEY ||
                   process.env.VITE_OPENROUTER_API_KEY

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured in .env')
    }

    const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
    }

    if (responseFormat) {
        payload.response_format = responseFormat
    }

    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 25000)

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://khushihygieia.in',
                    'X-Title': 'Khushi Hygieia'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            })

            clearTimeout(timeout)

            const data = await res.json()

            if (!res.ok) {
                console.error(`[OpenRouter] HTTP ${res.status}:`, data)
                throw new Error(data?.error?.message || `OpenRouter API returned HTTP ${res.status}`)
            }

            const content = data?.choices?.[0]?.message?.content
            if (!content) {
                throw new Error('OpenRouter returned empty completion content.')
            }

            return content.trim()
        } catch (err) {
            lastError = err
            console.warn(`[OpenRouter] Attempt ${attempt + 1} failed:`, err.message)
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            }
        }
    }

    throw lastError || new Error('OpenRouter request failed after retries')
}
