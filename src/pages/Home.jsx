import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { Video, Calendar, ShieldCheck, Stethoscope, HeartPulse, Clock, ArrowRight, Star, UserCheck, Building2, Smartphone } from 'lucide-react'

export default function Home() {
    const { user, isDoctor } = useAuth()

    return (
        <>
            {/* ─── HERO ─── */}
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <HeartPulse size={14} />
                            <span>Trusted by 50,000+ patients across India</span>
                        </div>
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
                                    <Link to="/doctor-dashboard" className="btn btn-primary">My Appointments <ArrowRight size={16} /></Link>
                                    <Link to="/hospitals" className="btn btn-outline">Hospital Network</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/patients" className="btn btn-primary">Book Appointment <ArrowRight size={16} /></Link>
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

            {/* ─── SERVICES GRID ─── */}
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
                                    <div className="card-icon"><Calendar size={22} /></div>
                                    <h3 className="card-title">My Appointments</h3>
                                    <p className="card-text">View and manage your patient appointments. Confirm, complete, or reschedule visits.</p>
                                </Link>
                                <Link to="/hospitals" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon"><Video size={22} /></div>
                                    <h3 className="card-title">Teleconsult Sessions</h3>
                                    <p className="card-text">Join video consultations with patients and manage online appointments.</p>
                                </Link>
                                <Link to="/doctor-dashboard" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon"><Stethoscope size={22} /></div>
                                    <h3 className="card-title">Post-Care Notes</h3>
                                    <p className="card-text">Add follow-up instructions and care notes for completed patient appointments.</p>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/hospitals" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon"><Video size={22} /></div>
                                    <h3 className="card-title">Teleconsultation</h3>
                                    <p className="card-text">Connect with certified specialists digitally with full electronic medical record integration.</p>
                                </Link>
                                <Link to="/doctors" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon"><Calendar size={22} /></div>
                                    <h3 className="card-title">Appointment Booking</h3>
                                    <p className="card-text">Schedule in-person visits to partner hospitals and clinics across India.</p>
                                </Link>
                                <Link to="/services" className="card" style={{ cursor: 'pointer' }}>
                                    <div className="card-icon"><ShieldCheck size={22} /></div>
                                    <h3 className="card-title">Insurance Processing</h3>
                                    <p className="card-text">Integrated claim processing and verification directly within the digital platform.</p>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            {!isDoctor && (
                <section className="section section-bg">
                    <div className="container">
                        <div className="section-header" style={{ textAlign: 'center' }}>
                            <h2 className="section-title">How It Works</h2>
                            <p className="section-subtitle">Get started in three simple steps — no paperwork, no waiting.</p>
                        </div>
                        <div className="grid-3">
                            <div className="step-card">
                                <div className="step-number">1</div>
                                <div className="step-icon"><UserCheck size={28} /></div>
                                <h3 className="step-title">Create Your Account</h3>
                                <p className="step-text">Sign up in under a minute. Your health profile is securely stored and encrypted.</p>
                            </div>
                            <div className="step-card">
                                <div className="step-number">2</div>
                                <div className="step-icon"><Stethoscope size={28} /></div>
                                <h3 className="step-title">Find the Right Doctor</h3>
                                <p className="step-text">Browse verified specialists, check availability, and book an appointment instantly.</p>
                            </div>
                            <div className="step-card">
                                <div className="step-number">3</div>
                                <div className="step-icon"><HeartPulse size={28} /></div>
                                <h3 className="step-title">Get Treated</h3>
                                <p className="step-text">Visit in-person or join a video consultation. Receive prescriptions and follow-ups digitally.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── WHY CHOOSE US ─── */}
            {!isDoctor && (
                <section className="section">
                    <div className="container grid-2" style={{ gap: '4rem' }}>
                        <div className="feature-visual">
                            <div className="feature-grid-visual">
                                <div className="fv-card fv-blue">
                                    <Building2 size={24} />
                                    <span>1000+ Hospitals</span>
                                </div>
                                <div className="fv-card fv-teal">
                                    <Stethoscope size={24} />
                                    <span>5000+ Doctors</span>
                                </div>
                                <div className="fv-card fv-amber">
                                    <Clock size={24} />
                                    <span>24/7 Support</span>
                                </div>
                                <div className="fv-card fv-rose">
                                    <ShieldCheck size={24} />
                                    <span>100% Secure</span>
                                </div>
                            </div>
                        </div>
                        <div className="split-content">
                            <h3 style={{ fontSize: '1.65rem', letterSpacing: '-0.03em' }}>Why 50,000+ patients choose Khushi Hygieia</h3>
                            <p>We are not just another healthcare app. We provide a complete healthcare ecosystem — from finding the right doctor to processing your insurance claim, all under one roof.</p>
                            <ul className="split-list">
                                <li><ShieldCheck size={20} /><span><strong>Verified Specialists</strong> — Every doctor is credential-checked and hospital-affiliated.</span></li>
                                <li><Smartphone size={20} /><span><strong>Works Everywhere</strong> — Fully responsive on mobile, tablet, and desktop.</span></li>
                                <li><Clock size={20} /><span><strong>Instant Booking</strong> — No phone calls. Book appointments in under 30 seconds.</span></li>
                            </ul>
                            <Link to="/doctors" className="btn btn-primary">Explore Doctors <ArrowRight size={16} /></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── TESTIMONIALS ─── */}
            {!isDoctor && (
                <section className="section section-bg">
                    <div className="container">
                        <div className="section-header" style={{ textAlign: 'center' }}>
                            <h2 className="section-title">What Our Patients Say</h2>
                            <p className="section-subtitle">Real experiences from real people across India.</p>
                        </div>
                        <div className="grid-3">
                            {[
                                { name: 'Priya Sharma', city: 'Mumbai', text: 'Booked a cardiologist in 2 minutes. The teleconsultation was seamless — felt like sitting in the clinic.', rating: 5 },
                                { name: 'Rajesh Kumar', city: 'Delhi', text: 'The prescription scanner is incredible. I just took a photo and it explained every medicine clearly.', rating: 5 },
                                { name: 'Anita Patel', city: 'Ahmedabad', text: 'Insurance verification was instant. No more running around with papers. Everything is digital now.', rating: 4 },
                            ].map((t, i) => (
                                <div className="testimonial-card" key={i}>
                                    <div className="testimonial-stars">
                                        {Array.from({ length: t.rating }).map((_, j) => (
                                            <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                                        ))}
                                    </div>
                                    <p className="testimonial-text">"{t.text}"</p>
                                    <div className="testimonial-author">
                                        <div className="testimonial-avatar">{t.name[0]}</div>
                                        <div>
                                            <strong className="testimonial-name">{t.name}</strong>
                                            <span className="testimonial-city">{t.city}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── CTA BANNER — only for guests ─── */}
            {!user && (
                <section className="cta-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <h2 className="cta-title">Ready to take control of your health?</h2>
                        <p className="cta-subtitle">Join thousands of patients who already trust Khushi Hygieia for their healthcare needs.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                Get Started — It's Free <ArrowRight size={16} />
                            </Link>
                            <Link to="/about" className="btn btn-outline" style={{ padding: '0.75rem 2rem', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </>
    )
}
