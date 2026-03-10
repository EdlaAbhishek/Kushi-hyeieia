import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load ALL env vars (including non-VITE_ ones) for the API handler
function loadAllEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env')
        const envContent = readFileSync(envPath, 'utf-8')
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eqIndex = trimmed.indexOf('=')
            if (eqIndex === -1) continue
            const key = trimmed.substring(0, eqIndex).trim()
            const value = trimmed.substring(eqIndex + 1).trim()
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    } catch (e) {
        console.warn('Could not load .env for API routes:', e.message)
    }
}

// Vite plugin to serve /api routes locally during development
function apiPlugin() {
    return {
        name: 'api-server',
        configureServer(server) {
            // Load env vars before setting up routes
            loadAllEnv()

            server.middlewares.use('/api/analyze-prescription', async (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Method not allowed' }))
                    return
                }

                try {
                    const { default: handler } = await import('./api/analyze-prescription.js')

                    const vercelRes = {
                        status(code) {
                            res.statusCode = code
                            return vercelRes
                        },
                        json(data) {
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify(data))
                            return vercelRes
                        },
                        setHeader(name, value) {
                            res.setHeader(name, value)
                            return vercelRes
                        },
                        send(data) {
                            res.end(data)
                            return vercelRes
                        }
                    }

                    await handler(req, vercelRes)
                } catch (err) {
                    console.error('API handler error:', err)
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Server error: ' + err.message }))
                }
            })
        }
    }
}

export default defineConfig({
    plugins: [react(), apiPlugin()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.js',
    }
})
