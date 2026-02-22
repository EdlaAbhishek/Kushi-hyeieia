import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function Home() {
    const { isDoctor } = useAuth()

    return (
        <>
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            {isDoctor ? 'Doctor Command Center' : 'Healthcare for Every Indian'}
                        </h1>
                        <p className="hero-subtitle">
                            {isDoctor
                                ? 'Manage your appointments, teleconsultations, and patient care from one clinical dashboard.'
                                : 'Connecting patients, doctors, and hospitals through AI-powered healthcare solutions accessible across India.'}
                        </p>
                        <div className="hero-actions">
                            {isDoctor ? (
                                <>
                                    <Link to="/doctor-dashboard" className="btn btn-primary">My Appointments</Link>
                                    <Link to="/hospitals" className="btn btn-outline">Hospital Network</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/patients" className="btn btn-primary">Book Appointment</Link>
                                    <Link to="/hospitals" className="btn btn-outline">Find Hospital</Link>
                                </>
                            )}
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item"><h4>50K+</h4><p>Active Users</p></div>
                            <div className="stat-item"><h4>1K+</h4><p>Partner Hospitals</p></div>
                            <div className="stat-item"><h4>5K+</h4><p>Verified Doctors</p></div>
                        </div>
                    </div>
                    <div className="hero-img-wrap">
                        <img src="/assets/hero-family.png" alt="Indian family consulting doctor online" />
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            {isDoctor ? 'Clinical Tools' : 'Comprehensive Medical Services'}
                        </h2>
                        <p className="section-subtitle">
                            {isDoctor
                                ? 'Quick access to your practice management tools.'
                                : 'Delivering enterprise-grade healthcare infrastructure directly to patients.'}
                        </p>
                    </div>
                    <div className="grid-3">
                        {isDoctor ? (
                            <>
                                <Link to="/doctor-dashboard" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    </div>
                                    <h3 className="card-title">My Appointments</h3>
                                    <p className="card-text">View and manage your patient appointments. Confirm, complete, or reschedule visits.</p>
                                </Link>
                                <Link to="/hospitals" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    </div>
                                    <h3 className="card-title">Teleconsult Sessions</h3>
                                    <p className="card-text">Join video consultations with patients and manage online appointments.</p>
                                </Link>
                                <Link to="/doctor-dashboard" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                    </div>
                                    <h3 className="card-title">Post-Care Notes</h3>
                                    <p className="card-text">Add follow-up instructions and care notes for completed patient appointments.</p>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/hospitals" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    </div>
                                    <h3 className="card-title">Teleconsultation</h3>
                                    <p className="card-text">Connect with certified specialists digitally with full electronic medical record integration.</p>
                                </Link>
                                <Link to="/doctors" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    </div>
                                    <h3 className="card-title">Appointment Booking</h3>
                                    <p className="card-text">Schedule in-person visits to partner hospitals and clinics across India.</p>
                                </Link>
                                <Link to="/services" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                                    </div>
                                    <h3 className="card-title">Insurance Processing</h3>
                                    <p className="card-text">Integrated claim processing and verification directly within the digital platform.</p>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}
