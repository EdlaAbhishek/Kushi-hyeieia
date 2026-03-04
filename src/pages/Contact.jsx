import { useState } from 'react'
import { Phone, Mail } from 'lucide-react'

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
                            <li><Phone size={20} /><span>+91 9999999999 (Toll Free)</span></li>
                            <li><Mail size={20} /><span>abhishekedla9133@gmail.com</span></li>
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
