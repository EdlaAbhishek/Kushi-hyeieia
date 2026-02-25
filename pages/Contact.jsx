import { useState } from 'react'

export default function Contact() {
    const [sent, setSent] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setSent(true)
    }

    return (
        <>
            <section className="page-header"><div className="container"><h1 className="page-title">Contact Us</h1><p className="page-subtitle">We are here to help. Reach out anytime.</p></div></section>
            <section className="section">
                <div className="container grid-2">
                    <div className="split-content">
                        <h3>Get in Touch</h3>
                        <p>For general enquiries, partnership requests, or technical support, use the contact form or reach us directly.</p>
                        <ul className="split-list">
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.66 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0122 16.92z" /></svg><span>+91 1800-XXX-XXXX (Toll Free)</span></li>
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg><span>support@khushihygieia.in</span></li>
                        </ul>
                    </div>
                    <div className="form-card">
                        {sent ? (
                            <div className="auth-success">Your message has been sent. We will respond within 24 hours.</div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group"><label className="form-label">Name</label><input className="form-control" type="text" required /></div>
                                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" required /></div>
                                <div className="form-group"><label className="form-label">Subject</label><input className="form-control" type="text" required /></div>
                                <div className="form-group"><label className="form-label">Message</label><textarea className="form-control" required></textarea></div>
                                <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Send Message</button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}
