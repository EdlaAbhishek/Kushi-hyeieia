import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MessageSquare } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { toast } from 'react-hot-toast'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' }
}

export default function Contact() {
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const formRef = useRef(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setSent(true)
            toast.success('Your message has been sent successfully!')
            if (formRef.current) formRef.current.reset()
            setTimeout(() => setSent(false), 5000)
        } catch (err) {
            setError('Failed to send message. Please try again later.')
            toast.error('Failed to send message. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <section className="page-header"><div className="container"><h1 className="page-title">Contact Us</h1><p className="page-subtitle">We are here to help. Reach out anytime.</p></div></section>
            <section className="section">
                <div className="container grid-2">
                    <motion.div className="split-content" {...fadeUp}>
                        <h3>Get in Touch</h3>
                        <p>For general enquiries, partnership requests, or technical support, use the contact form or reach us directly.</p>
                        <ul className="split-list">
                            <li><Phone size={20} /><span>+91 1800-123-4567 (Toll Free)</span></li>
                            <li><Mail size={20} /><span>support@khushihygieia.com</span></li>
                            <li><MessageSquare size={20} /><span>Live chat available 24/7 in app</span></li>
                        </ul>
                    </motion.div>
                    <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-control" type="text" required placeholder="John Doe" disabled={loading} aria-label="Full Name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-control" type="email" required placeholder="john@example.com" disabled={loading} aria-label="Email Address" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input className="form-control" type="text" required placeholder="How can we help?" disabled={loading} aria-label="Subject" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea className="form-control" required rows="4" placeholder="Describe your issue..." disabled={loading} aria-label="Message content"></textarea>
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                {loading ? <LoadingSpinner size="small" text="Sending..." /> : 'Send Message'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </section>
        </>
    )
}
