import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
    const { user, role, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div
                className="auth-page"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                        className="loading-spinner"
                        style={{
                            margin: '0 auto 1.25rem',
                            width: 44,
                            height: 44,
                            borderWidth: 3.5
                        }}
                    ></div>
                    <p
                        style={{
                            color: 'var(--text-muted)',
                            margin: 0,
                            fontWeight: 500,
                            fontSize: '1rem',
                            letterSpacing: '0.01em'
                        }}
                    >
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    // If specific roles are required, check them
    if (allowedRoles && allowedRoles.length > 0) {
        const effectiveRole = role || user?.user_metadata?.role || 'patient'
        if (!allowedRoles.includes(effectiveRole)) {
            // Redirect to the correct dashboard for this user's role
            const targetPath = effectiveRole === 'admin' ? '/admin-dashboard' : effectiveRole === 'doctor' ? '/doctor-dashboard' : '/dashboard'
            // Prevent infinite loop: only redirect if not already on a sub-path of the target
            if (!location.pathname.startsWith(targetPath)) {
                return <Navigate to={targetPath} replace />
            }
        }
    }

    return <Outlet />
}
