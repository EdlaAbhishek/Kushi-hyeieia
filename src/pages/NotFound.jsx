import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
    return (
        <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <AlertCircle size={64} style={{ color: 'var(--primary)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
                <h1 className="page-title" style={{ marginBottom: '1rem' }}>404 - Page Not Found</h1>
                <p className="page-subtitle" style={{ marginBottom: '2rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Home size={18} /> Back to Home
                </Link>
            </div>
        </section>
    )
}
