import { Link } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export default function NotFound() {
    return (
        <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)' }}>
            <div className="container" style={{ textAlign: 'center', background: '#fff', padding: '4rem 2rem', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.5)' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
                    <Compass size={64} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', opacity: 0.2 }} />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700 }}>Lost in Space?</h2>
                <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    We can't seem to find the page you're looking for. It might have been moved, deleted, or perhaps it never existed at all.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1.05rem', borderRadius: '100px' }}>
                        <Home size={18} /> Take Me Home
                    </Link>
                </div>
            </div>
        </section>
    )
}
