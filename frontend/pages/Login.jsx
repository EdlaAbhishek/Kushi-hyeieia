import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
            setLoading(false)
            setError(signInError.message)
            return
        }

        // Determine role and redirect accordingly
        const authUser = signInData?.user
        let userRole = 'patient'

        // 1. Check user_metadata (most reliable — set at signup)
        if (authUser?.user_metadata?.role) {
            userRole = authUser.user_metadata.role
        } else {
            // 2. Try profiles table
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .maybeSingle()
                if (profileData?.role) userRole = profileData.role
            } catch (e) {
                // ignore
            }

            // 3. Try doctors table
            if (userRole === 'patient') {
                try {
                    const { data: docData } = await supabase
                        .from('doctors')
                        .select('id')
                        .eq('id', authUser.id)
                        .maybeSingle()
                    if (docData) userRole = 'doctor'
                } catch (e) {
                    // ignore
                }
            }
        }

        setLoading(false)
        console.log('[Login] Detected role:', userRole, '→ redirecting')

        if (userRole === 'doctor') {
            navigate('/doctor-dashboard')
        } else {
            navigate('/dashboard')
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
