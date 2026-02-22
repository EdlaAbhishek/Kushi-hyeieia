import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'

export default function AiChat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m Khushi Care AI, your healthcare assistant. How can I help you today?\n\n_I can provide general health guidance, but please remember to consult a doctor for medical concerns._'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const userName = user?.user_metadata?.full_name || 'You'

    const handleSend = async (e) => {
        e.preventDefault()
        const trimmed = input.trim()
        if (!trimmed || loading) return

        const userMsg = { role: 'user', content: trimmed }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            // Build context from last 10 messages for conversation memory
            const context = messages.slice(-10).map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }))

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, context })
            })

            const data = await res.json()

            const assistantMsg = {
                role: 'assistant',
                content: data.reply || 'Sorry, I could not process that request.',
                emergency: data.emergency || false
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please check that the backend server is running and try again.'
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Khushi Care AI</h1>
                    <p className="page-subtitle">Your 24/7 healthcare assistant — general guidance only.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="chat-container">
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'} ${msg.emergency ? 'chat-emergency' : ''}`}
                                >
                                    <span className="chat-sender">
                                        {msg.role === 'user' ? userName : '🤖 Khushi Care AI'}
                                    </span>
                                    <div className="chat-text">
                                        {msg.content.split('\n').map((line, j) => (
                                            <p key={j}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="chat-bubble chat-assistant">
                                    <span className="chat-sender">🤖 Khushi Care AI</span>
                                    <div className="chat-typing">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-bar" onSubmit={handleSend}>
                            <input
                                className="chat-input"
                                type="text"
                                placeholder="Describe your symptoms or ask a health question..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                                maxLength={2000}
                            />
                            <button
                                className="btn btn-primary chat-send"
                                type="submit"
                                disabled={loading || !input.trim()}
                            >
                                {loading ? '...' : 'Send'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </>
    )
}
