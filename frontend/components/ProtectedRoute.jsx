import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
    const { user, role, loading } = useAuth()

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
        const effectiveRole = role || 'patient'
        if (!allowedRoles.includes(effectiveRole)) {
            // Redirect to appropriate dashboard
            return <Navigate to={effectiveRole === 'doctor' ? '/doctor-dashboard' : '/dashboard'} replace />
        }
    }

    return <Outlet />
}
