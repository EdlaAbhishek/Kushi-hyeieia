import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { supabase } from '../services/supabase'

export default function UpdatePassword() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { updatePassword } = useAuth()

    useEffect(() => {
        // Check if we have a recovery session
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                // User is ready to update password
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await updatePassword(password)
            toast.success('Password updated successfully! Please log in.')
            navigate('/login')
        } catch (err) {
            setError(err.message || 'Failed to update password')
            toast.error(err.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo"><img src="/assets/logo.png" alt="Khushi Hygieia" loading="lazy" /></div>
                <h1 className="auth-title">Update Password</h1>
                <p className="auth-sub">Enter your new password below</p>
                {error && <div id="update-error" className="auth-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            className="form-control"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            required
                            aria-invalid={!!error}
                            aria-describedby={error ? "update-error" : undefined}
                        />
                    </div>
                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        {loading ? <LoadingSpinner size="small" text="Updating..." /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
