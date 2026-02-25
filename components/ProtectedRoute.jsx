import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="auth-page">
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    // If specific roles are required, check them
    if (allowedRoles && allowedRoles.length > 0) {
        const effectiveRole = user?.user_metadata?.role || 'patient'
        if (!allowedRoles.includes(effectiveRole)) {
            // STOP infinite loop: only redirect if not already on the target route
            const targetPath = effectiveRole === 'doctor' ? '/doctor-dashboard' : '/dashboard'
            if (location.pathname !== targetPath) {
                return <Navigate to={targetPath} replace />
            }
        }
    }

    return <Outlet />
}
