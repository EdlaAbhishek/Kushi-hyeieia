import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function MainLayout() {
    const { user, role, signOut, isDoctor } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const userName = user?.user_metadata?.full_name || user?.email || ''

    const dashboardPath = isDoctor ? '/doctor-dashboard' : '/dashboard'

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
    const closeMenu = () => setIsMobileMenuOpen(false)

    return (
        <>
            <header className={`navbar ${isDoctor ? 'navbar-doctor' : ''}`}>
                <div className="container nav-container">
                    <NavLink to="/" className="logo" onClick={closeMenu}>
                        <img src="/assets/logo.png" alt="Khushi Hygieia" />
                    </NavLink>

                    <button className="hamburger" onClick={toggleMenu}>
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    <nav className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                        <NavLink to="/" end onClick={closeMenu}>Home</NavLink>

                        {/* Patient nav */}
                        {!isDoctor && (
                            <>
                                <NavLink to="/patients" onClick={closeMenu}>Patients</NavLink>
                                <NavLink to="/doctors" onClick={closeMenu}>Doctors</NavLink>
                                <NavLink to="/hospitals" onClick={closeMenu}>Hospitals</NavLink>
                                <NavLink to="/insurance" onClick={closeMenu}>Insurance</NavLink>
                                <NavLink to="/services" onClick={closeMenu}>Services</NavLink>
                                <NavLink to="/chat" onClick={closeMenu}>AI Chat</NavLink>
                            </>
                        )}

                        {/* Doctor nav */}
                        {isDoctor && (
                            <>
                                <NavLink to="/doctor-dashboard" onClick={closeMenu}>My Appointments</NavLink>
                                <NavLink to="/hospitals" onClick={closeMenu}>Hospitals</NavLink>
                            </>
                        )}

                        <NavLink to="/about" onClick={closeMenu}>About</NavLink>
                        <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>

                        {/* Mobile Actions */}
                        <div className="mobile-actions">
                            {user && (
                                <>
                                    <NavLink to={dashboardPath} className="btn btn-primary" onClick={closeMenu}>
                                        {isDoctor ? 'Dr. Dashboard' : 'Dashboard'}
                                    </NavLink>
                                    <span className="nav-user">{userName}</span>
                                    <button className="btn btn-outline" onClick={() => { signOut(); closeMenu(); }}>Sign Out</button>
                                </>
                            )}
                            <NavLink to="/emergency" className="btn btn-emergency" onClick={closeMenu}>🚨 SOS</NavLink>
                        </div>
                    </nav>
                    <div className="nav-actions desktop-only">
                        {user && (
                            <>
                                <NavLink to={dashboardPath} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                                    {isDoctor ? 'Dr. Dashboard' : 'Dashboard'}
                                </NavLink>
                                <span className="nav-user">{userName}</span>
                                <button className="btn btn-outline" onClick={signOut} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Sign Out</button>
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
                        <div>
                            <h4 className="footer-heading">For Patients</h4>
                            <ul className="footer-links">
                                <li><NavLink to="/patients">Book Appointment</NavLink></li>
                                <li><NavLink to="/hospitals">Teleconsultation</NavLink></li>
                                <li><NavLink to="/patients">Health Records</NavLink></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="footer-heading">For Providers</h4>
                            <ul className="footer-links">
                                <li><NavLink to="/doctors">Join Network</NavLink></li>
                                <li><NavLink to="/hospitals">Hospital Integration</NavLink></li>
                                <li><NavLink to="/doctors">Provider Portal</NavLink></li>
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
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
