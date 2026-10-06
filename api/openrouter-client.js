// Resilient OpenRouter Client for Kushi Hygieia Backend & Serverless Handlers
// Features automatic multi-model cascading across active free & standard models

const KNOWN_DEPRECATED_MODELS = new Set([
    'nex-agi/nex-n2.5-mini:free',
    'nex-agi/nex-n2.5-pro:free',
    'meta-llama/llama-3.3-70b-instruct:free'
])

const DEFAULT_RELIABLE_FALLBACKS = [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'liquid/lfm-2.5-2.6b:free',
    'openrouter/free',
    'deepseek/deepseek-chat'
]

export async function callOpenRouter({
    messages,
    model = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature = 0.2,
    maxTokens = 1500,
    responseFormat = null,
    reasoning = undefined,
    maxRetries = 1
}) {
    const apiKey = process.env.OPENROUTER_API_KEY ||
                   process.env.VITE_OPENROUTER_API_KEY

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured in environment')
    }

    // Build unique cascade list of models to try
    const rawCandidateList = [
        model,
        process.env.OPENROUTER_MODEL,
        process.env.VITE_OPENROUTER_MODEL,
        ...DEFAULT_RELIABLE_FALLBACKS
    ]

    const candidateModels = []
    const seen = new Set()
    for (const m of rawCandidateList) {
        if (m && !seen.has(m) && !KNOWN_DEPRECATED_MODELS.has(m)) {
            seen.add(m)
            candidateModels.push(m)
        }
    }

    let lastError = null

    for (const currentModel of candidateModels) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 20000)

                const payload = {
                    model: currentModel,
                    messages,
                    temperature,
                    max_tokens: maxTokens || 1500
                }

                if (reasoning !== undefined) {
                    payload.reasoning = reasoning
                }

                if (responseFormat) {
                    payload.response_format = responseFormat
                }

                const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://kushihygieia.in',
                        'X-Title': 'Kushi Hygieia'
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                })

                clearTimeout(timeout)

                const data = await res.json().catch(() => ({}))

                if (!res.ok) {
                    const status = res.status
                    const errMsg = data?.error?.message || `HTTP ${status}`
                    console.warn(`[OpenRouter] Model "${currentModel}" failed with status ${status}:`, errMsg)

                    // If model not found (404), out of credits (402), or rate-limited (429), break retry loop and try next model
                    if (status === 404 || status === 402 || status === 429) {
                        lastError = new Error(`Model ${currentModel} returned ${status}: ${errMsg}`)
                        break
                    }

                    // If response_format caused 400 (unsupported on this model), retry without responseFormat
                    if (status === 400 && responseFormat) {
                        responseFormat = null
                        continue
                    }

                    throw new Error(errMsg)
                }

                const choice = data?.choices?.[0]
                let content = choice?.message?.content

                // Some reasoning models return thinking in reasoning if content is not populated
                if (!content && choice?.message?.reasoning) {
                    content = choice.message.reasoning
                }

                if (typeof content === 'string') {
                    // Strip internal <think>...</think> tags if present
                    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
                }

                if (!content) {
                    throw new Error(`OpenRouter model ${currentModel} returned empty completion content.`)
                }

                return content
            } catch (err) {
                lastError = err
                console.warn(`[OpenRouter] Model "${currentModel}" attempt ${attempt + 1} error:`, err.message)
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 600 * (attempt + 1)))
                }
            }
        }
    }

    throw lastError || new Error('All OpenRouter models failed to respond.')
}
