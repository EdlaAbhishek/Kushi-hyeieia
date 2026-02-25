import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const user = await login(email, password)
            const role = user?.user_metadata?.role || 'patient'
            if (role === 'doctor') {
                navigate('/doctor-dashboard')
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.message || 'Login failed')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo"><img src="/assets/logo.png" alt="Khushi Hygieia" /></div>
                <h1 className="auth-title">Sign In</h1>
                <p className="auth-sub">Access your healthcare dashboard</p>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
                    </div>
                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="auth-switch">Don't have an account? <Link to="/signup">Create one</Link></p>
            </div>
        </div>
    )
}
