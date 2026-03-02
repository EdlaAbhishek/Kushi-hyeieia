import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function MainLayout() {
    const { user, role, signOut, isDoctor } = useAuth()
    const userName = user?.user_metadata?.full_name || user?.email || ''

    const dashboardPath = isDoctor ? '/doctor-dashboard' : '/dashboard'

    return (
        <>
            <header className={`navbar ${isDoctor ? 'navbar-doctor' : ''}`}>
                <div className="container nav-container">
                    <NavLink to="/" className="logo">
                        <img src="/assets/logo.png" alt="Khushi Hygieia" />
                    </NavLink>
                    <nav className="nav-links">
                        <NavLink to="/" end>Home</NavLink>

                        {/* Patient nav */}
                        {!isDoctor && (
                            <>
                                <NavLink to="/patients">Patients</NavLink>
                                <NavLink to="/doctors">Doctors</NavLink>
                                <NavLink to="/hospitals">Hospitals</NavLink>
                                <NavLink to="/services">Services</NavLink>
                                <NavLink to="/chat">AI Chat</NavLink>
                            </>
                        )}

                        {/* Doctor nav */}
                        {isDoctor && (
                            <>
                                <NavLink to="/doctor-dashboard">My Appointments</NavLink>
                                <NavLink to="/hospitals">Hospitals</NavLink>
                            </>
                        )}

                        <NavLink to="/about">About</NavLink>
                        <NavLink to="/contact">Contact</NavLink>
                    </nav>
                    <div className="nav-actions">
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
