import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
    const { user, role, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="auth-page">
                <div className="loading-spinner"></div>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading your dashboard...</p>
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
