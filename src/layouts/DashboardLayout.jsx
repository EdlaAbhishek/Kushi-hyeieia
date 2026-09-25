import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import {
    Stethoscope, Calendar, Droplets, Users, MapPin,
    BarChart3, Activity, ChevronLeft, ChevronRight,
    HeartPulse, Hospital, FolderHeart, FileText,
    Ticket, Pill, Shield, HandHeart, Compass, Sparkles, HeartHandshake
} from 'lucide-react'

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const { isDoctor } = useAuth()

    const sidebarSections = isDoctor ? [
        {
            title: 'Clinical Operations',
            items: [
                { label: 'Dr. Dashboard', path: '/doctor-dashboard', icon: Activity, end: true },
                { label: 'OPD Queue', path: '/doctor-dashboard/queue', icon: Ticket },
                { label: 'Patients', path: '/doctor-dashboard/patients', icon: Users },
                { label: 'Patient Records', path: '/doctor-dashboard/patient-records', icon: FileText },
                { label: 'Prescriptions', path: '/doctor-dashboard/prescriptions', icon: Pill },
                { label: 'Community', path: '/doctor-dashboard/community', icon: HandHeart },
            ]
        },
        {
            title: 'Analytics & Tools',
            items: [
                { label: 'Health Worker Mode', path: '/doctor-dashboard/health-worker', icon: HeartPulse },
                { label: 'Smart Hospital REC', path: '/doctor-dashboard/hospital-rec', icon: Hospital },
                { label: 'Population Health', path: '/doctor-dashboard/population-health', icon: BarChart3 },
                { label: 'Analytics', path: '/doctor-dashboard/analytics', icon: Activity },
            ]
        }
    ] : [
        {
            title: 'Core Healthcare',
            items: [
                { label: 'Overview', path: '/dashboard', icon: Activity, end: true },
                { label: 'Appointments', path: '/dashboard/appointments', icon: Calendar },
                { label: 'OPD Queue', path: '/dashboard/queue', icon: Ticket },
                { label: 'Health Vault', path: '/dashboard/health-vault', icon: FolderHeart },
                { label: 'Health Journey', path: '/dashboard/health-journey', icon: Compass },
                { label: 'Medications', path: '/dashboard/medications', icon: Pill },
                { label: 'Insurance Center', path: '/dashboard/insurance', icon: Shield },
                { label: 'Care Circle', path: '/dashboard/care-circle', icon: HeartHandshake },
                { label: 'Community', path: '/dashboard/community', icon: HandHeart },
            ]
        },
        {
            title: 'Health Tools',
            items: [
                { label: 'Symptom Checker', path: '/dashboard/symptom-checker', icon: Stethoscope },
                { label: 'Blood Donation', path: '/dashboard/blood-donation', icon: Droplets },
                { label: 'Smart Hospital REC', path: '/dashboard/hospital-rec', icon: Hospital },
                { label: 'Become a Doctor', path: '/dashboard/apply-doctor', icon: Stethoscope },
            ]
        }
    ]

    return (
        <div className="dashboard-layout">
            <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${isDoctor ? 'doctor-sidebar' : 'patient-sidebar'}`}>
                <div className="sidebar-header">
                    {!collapsed && <h3>{isDoctor ? 'Clinical Console' : 'Health Portal'}</h3>}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {sidebarSections.map((section) => (
                        <div key={section.title} className="sidebar-section">
                            {!collapsed && <span className="sidebar-section-title">{section.title}</span>}
                            {section.items.map((item) => (
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
                    ))}
                </nav>
            </aside>

            <div className="dashboard-content">
                <Outlet />
            </div>
        </div>
    )
}
