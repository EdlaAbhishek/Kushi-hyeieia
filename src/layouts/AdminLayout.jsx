import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import {
    LayoutDashboard, Users, Hospital, Stethoscope, Calendar,
    ChevronLeft, ChevronRight, ShieldCheck, UserCog, LogOut
} from 'lucide-react'

const ADMIN_NAV = [
    { label: 'Overview', path: '/admin-dashboard', icon: LayoutDashboard, end: true },
    { label: 'Doctor Applications', path: '/admin-dashboard/applications', icon: UserCog },
    { label: 'Hospitals', path: '/admin-dashboard/hospitals', icon: Hospital },
    { label: 'Doctors', path: '/admin-dashboard/doctors', icon: Stethoscope },
    { label: 'Appointments', path: '/admin-dashboard/appointments', icon: Calendar },
    { label: 'Users', path: '/admin-dashboard/users', icon: Users },
]

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="dashboard-layout">
            <aside className={`dashboard-sidebar admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} color="#818CF8" />
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#E0E7FF' }}>Admin Panel</h3>
                        </div>
                    )}
                    {collapsed && <ShieldCheck size={20} color="#818CF8" />}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        {!collapsed && <span className="sidebar-section-title">Management</span>}
                        {ADMIN_NAV.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                                title={item.label}
                            >
                                <item.icon size={18} />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                        {!collapsed && <span className="sidebar-section-title">Account</span>}
                        <button
                            className="sidebar-link"
                            onClick={() => navigate('/')}
                            title="Back to Main Site"
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <Hospital size={18} />
                            {!collapsed && <span>Main Site</span>}
                        </button>
                        <button
                            className="sidebar-link"
                            onClick={signOut}
                            title="Sign Out"
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#F87171' }}
                        >
                            <LogOut size={18} />
                            {!collapsed && <span>Sign Out</span>}
                        </button>
                    </div>
                </nav>
            </aside>

            <div className="dashboard-content">
                <Outlet />
            </div>
        </div>
    )
}
