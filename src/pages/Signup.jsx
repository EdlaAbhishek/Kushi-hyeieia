import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { toast } from 'react-hot-toast'

export default function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()
    const { signup, loginWithGoogle, user, loading: authLoading, role: authRole } = useAuth()

    useEffect(() => {
        if (!authLoading && user && authRole) {
            if (authRole === 'admin') navigate('/admin-dashboard', { replace: true })
            else if (authRole === 'doctor') navigate('/doctor-dashboard', { replace: true })
            else navigate('/dashboard', { replace: true })
        }
    }, [user, authLoading, authRole, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const role = 'patient'
            const user = await signup({ full_name: name, email, password, role })

            setLoading(false)
            setSuccess('Account created! Redirecting to dashboard...')
            toast.success('Account created! Redirecting...')
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)
        } catch (err) {
            setError(err.message)
            toast.error(err.message || 'Signup failed')
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        try {
            await loginWithGoogle()
        } catch (err) {
            toast.error(err.message || 'Google Signup failed')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo"><img src="/assets/logo.png" alt="Khushi Hygieia" loading="lazy" /></div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-sub">Join India's trusted healthcare network</p>
                {error && <div id="signup-error" className="auth-error" role="alert">{error}</div>}
                {success && <div id="signup-success" className="auth-success" role="status">{success}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required aria-invalid={!!error} aria-describedby={error ? "signup-error" : undefined} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" required aria-invalid={!!error} aria-describedby={error ? "signup-error" : undefined} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                minLength={8}
                                required
                                aria-invalid={!!error}
                                aria-describedby={error ? "signup-error" : undefined}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="doctor-info-box">
                        <div style={{ color: 'var(--primary)', marginTop: '2px' }}>🩺</div>
                        <div>
                            <strong>Are you a Doctor?</strong><br />
                            Sign up here as a standard user. Once logged in, you can apply for a Doctor account from your Dashboard.
                        </div>
                    </div>

                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        {loading ? <LoadingSpinner size="small" text="Creating account..." /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: '#94A3B8', fontSize: '0.85rem' }}>
                    <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                    <span style={{ padding: '0 1rem' }}>Or</span>
                    <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                </div>

                <button
                    className="btn btn-outline auth-btn"
                    onClick={handleGoogleSignup}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', borderColor: '#CBD5E1', color: '#334155' }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <p className="auth-switch" style={{ marginTop: '1.5rem' }}>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    )
}
