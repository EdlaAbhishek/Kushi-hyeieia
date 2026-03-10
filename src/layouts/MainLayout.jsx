import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { useState } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import ScrollToTop from '../components/ScrollToTop'

export default function MainLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, role, signOut, isDoctor } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const userName = user?.user_metadata?.full_name || user?.email || ''

    const dashboardPath = isDoctor ? '/doctor-dashboard' : '/dashboard'
    const isDoctorDashboardRelated = isDoctor && ['/patients', '/services'].includes(location.pathname)

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
    const closeMenu = () => setIsMobileMenuOpen(false)

    const handleSignOut = async () => {
        try {
            closeMenu()
            await signOut()
        } catch (err) {
            console.error("Sign out error:", err)
        } finally {
            // Always navigate to login, even if sign out fails
            navigate('/login')
        }
    }

    return (
        <>
            <ScrollToTop />
            <header className="navbar">
                <div className="container nav-container">
                    <NavLink to="/" className="logo" onClick={closeMenu}>
                        <img src="/assets/logo.png" alt="Khushi Hygieia" loading="lazy" />
                    </NavLink>

                    <button className="hamburger" onClick={toggleMenu}>
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    <nav className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                        <NavLink to="/" end onClick={closeMenu}>Home</NavLink>

                        {/* Patient nav — clean 6 items */}
                        {!isDoctor && (
                            <>
                                <NavLink to="/doctors" onClick={closeMenu}>Doctors</NavLink>
                                <NavLink to="/hospitals" onClick={closeMenu}>Hospitals</NavLink>
                                <NavLink to="/services" onClick={closeMenu}>Services</NavLink>
                                <NavLink to="/chat" onClick={closeMenu}>AI Assistant</NavLink>
                            </>
                        )}

                        {/* Doctor nav — clean */}
                        {isDoctor && (
                            <>
                                <NavLink to="/doctor-dashboard/patients" onClick={closeMenu}>My Patients</NavLink>
                                <NavLink to="/hospitals" onClick={closeMenu}>Hospitals</NavLink>
                                <NavLink to="/doctors" onClick={closeMenu}>Doctor Network</NavLink>
                                <NavLink to="/chat" onClick={closeMenu}>AI Assistant</NavLink>
                            </>
                        )}

                        {/* Mobile Actions */}
                        <div className="mobile-actions">
                            {user && (
                                <>
                                    {!isDoctorDashboardRelated && (
                                        <NavLink to={dashboardPath} className="btn btn-primary" onClick={closeMenu}>
                                            {isDoctor ? 'Dr. Dashboard' : 'Dashboard'}
                                        </NavLink>
                                    )}
                                    <NavLink to="/profile" className="nav-user" onClick={closeMenu}>
                                        <User size={16} /> {userName}
                                    </NavLink>
                                    <button className="btn btn-outline" onClick={handleSignOut} style={{ justifyContent: 'center', borderColor: '#EF4444', color: '#EF4444' }}>
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </>
                            )}
                            <NavLink to="/emergency" className="btn btn-emergency" onClick={closeMenu}>🚨 SOS</NavLink>
                        </div>
                    </nav>
                    <div className="nav-actions desktop-only">
                        {user && (
                            <>
                                {!isDoctorDashboardRelated && (
                                    <NavLink to={dashboardPath} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                                        {isDoctor ? 'Dr. Dashboard' : 'Dashboard'}
                                    </NavLink>
                                )}
                                <NavLink to="/profile" className="nav-user">
                                    <User size={16} /> {userName}
                                </NavLink>
                                <button className="btn btn-outline" onClick={handleSignOut} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderColor: '#EF4444', color: '#EF4444' }}>
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </>
                        )}
                        <NavLink to="/emergency" className="btn btn-emergency" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>🚨 SOS</NavLink>
                    </div>
                </div>
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h2>Khushi Hygieia</h2>
                            <p>Professional healthcare infrastructure providing accessible medical solutions across India.</p>
                        </div>
                        {!isDoctor && (
                            <div>
                                <h4 className="footer-heading">For Patients</h4>
                                <ul className="footer-links">
                                    <li><NavLink to="/doctors">Book Appointment</NavLink></li>
                                    <li><NavLink to="/services">Teleconsultation</NavLink></li>
                                    <li><NavLink to="/dashboard">Health Records</NavLink></li>
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="footer-heading">For Providers</h4>
                            <ul className="footer-links">
                                <li><NavLink to="/doctor-dashboard">Join Network</NavLink></li>
                                <li><NavLink to="/hospitals">Hospital Integration</NavLink></li>
                                <li><NavLink to="/doctor-dashboard">Provider Portal</NavLink></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="footer-heading">Support</h4>
                            <ul className="footer-links">
                                <li><NavLink to="/contact">Contact Us</NavLink></li>
                                <li><NavLink to="/emergency">Emergency Info</NavLink></li>
                                <li><NavLink to="/about">About Us</NavLink></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 Khushi Hygieia Healthcare Platform. All rights reserved.</p>
                        <div className="footer-bottom-links">
                            <NavLink to="/security">Privacy Policy</NavLink>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
