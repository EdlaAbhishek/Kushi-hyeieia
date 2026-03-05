import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { motion } from 'framer-motion'
import { Video, Calendar, ShieldCheck, Stethoscope, HeartPulse, Clock, ArrowRight, Star, UserCheck, Building2, Smartphone } from 'lucide-react'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' }
}

const stagger = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
}

export default function Home() {
    const { user, isDoctor } = useAuth()

    const patientServices = [
        { icon: Video, title: 'Teleconsultation', desc: 'Connect with certified specialists digitally with full electronic medical record integration.', to: '/hospitals' },
        { icon: Calendar, title: 'Appointment Booking', desc: 'Schedule in-person visits to partner hospitals and clinics across India.', to: '/doctors' },
        { icon: ShieldCheck, title: 'Insurance Processing', desc: 'Integrated claim processing and verification directly within the digital platform.', to: '/services' },
    ]

    const doctorServices = [
        { icon: Calendar, title: 'My Appointments', desc: 'View and manage your patient appointments. Confirm, complete, or reschedule visits.', to: '/doctor-dashboard' },
        { icon: Video, title: 'Teleconsult Sessions', desc: 'Join video consultations with patients and manage online appointments.', to: '/hospitals' },
        { icon: Stethoscope, title: 'Post-Care Notes', desc: 'Add follow-up instructions and care notes for completed patient appointments.', to: '/doctor-dashboard' },
    ]

    const services = isDoctor ? doctorServices : patientServices

    return (
        <>
            {/* ─── HERO ─── */}
            <section className="hero">
                <div className="container hero-grid">
                    <motion.div className="hero-content" {...fadeUp}>
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
                    </motion.div>
                    <motion.div className="hero-img-wrap" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}>
                        <img src="/assets/hero-family.png" alt="Family consulting healthcare provider online using Khushi Hygieia app" loading="lazy" />
                    </motion.div>
                </div>
            </section>

            {/* ─── SERVICES — Feature Rows ─── */}
            <section className="section">
                <div className="container">
                    <motion.div className="section-header" {...fadeUp}>
                        <h2 className="section-title">
                            {isDoctor ? 'Clinical Tools' : 'Comprehensive Medical Services'}
                        </h2>
                        <p className="section-subtitle">
                            {isDoctor
                                ? 'Quick access to your practice management tools.'
                                : 'Delivering enterprise-grade healthcare infrastructure directly to patients.'}
                        </p>
                    </motion.div>
                    <div style={{ maxWidth: '720px' }}>
                        {services.map((s, i) => (
                            <motion.div key={s.title} {...stagger} transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}>
                                <Link to={s.to} className="feature-row" style={{ textDecoration: 'none' }}>
                                    <s.icon size={24} className="feature-icon" />
                                    <div className="feature-content">
                                        <h3>{s.title}</h3>
                                        <p>{s.desc}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS — Timeline ─── */}
            {!isDoctor && (
                <section className="section" style={{ background: 'var(--surface)' }}>
                    <div className="container">
                        <motion.div className="section-header" {...fadeUp}>
                            <h2 className="section-title">How It Works</h2>
                            <p className="section-subtitle">Get started in three simple steps — no paperwork, no waiting.</p>
                        </motion.div>
                        <div className="timeline">
                            {[
                                { num: 1, icon: UserCheck, title: 'Create Your Account', desc: 'Sign up in under a minute. Your health profile is securely stored and encrypted.' },
                                { num: 2, icon: Stethoscope, title: 'Find the Right Doctor', desc: 'Browse verified specialists, check availability, and book an appointment instantly.' },
                                { num: 3, icon: HeartPulse, title: 'Get Treated', desc: 'Visit in-person or join a video consultation. Receive prescriptions and follow-ups digitally.' },
                            ].map((step, i) => (
                                <motion.div className="timeline-step" key={step.num} {...stagger} transition={{ duration: 0.45, delay: i * 0.15, ease: 'easeOut' }}>
                                    <div className="timeline-number">{step.num}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── WHY CHOOSE US — Flat Layout ─── */}
            {!isDoctor && (
                <section className="section">
                    <div className="container grid-2" style={{ gap: '4rem' }}>
                        <motion.div className="feature-visual" {...fadeUp}>
                            <div className="feature-grid-visual">
                                <div className="fv-card fv-blue"><Building2 size={24} /><span>1000+ Hospitals</span></div>
                                <div className="fv-card fv-teal"><Stethoscope size={24} /><span>5000+ Doctors</span></div>
                                <div className="fv-card fv-amber"><Clock size={24} /><span>24/7 Support</span></div>
                                <div className="fv-card fv-rose"><ShieldCheck size={24} /><span>100% Secure</span></div>
                            </div>
                        </motion.div>
                        <motion.div className="split-content" {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
                            <h3 style={{ fontSize: '1.65rem', letterSpacing: '-0.03em' }}>Why 50,000+ patients choose Khushi Hygieia</h3>
                            <p>We are not just another healthcare app. We provide a complete healthcare ecosystem — from finding the right doctor to processing your insurance claim, all under one roof.</p>
                            <ul className="split-list">
                                <li><ShieldCheck size={20} /><span><strong>Verified Specialists</strong> — Every doctor is credential-checked and hospital-affiliated.</span></li>
                                <li><Smartphone size={20} /><span><strong>Works Everywhere</strong> — Fully responsive on mobile, tablet, and desktop.</span></li>
                                <li><Clock size={20} /><span><strong>Instant Booking</strong> — No phone calls. Book appointments in under 30 seconds.</span></li>
                            </ul>
                            <Link to="/doctors" className="btn btn-primary">Explore Doctors <ArrowRight size={16} /></Link>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ─── TESTIMONIALS — Flat Quotes ─── */}
            {!isDoctor && (
                <section className="section" style={{ background: 'var(--surface)' }}>
                    <div className="container">
                        <motion.div className="section-header" {...fadeUp}>
                            <h2 className="section-title">What Our Patients Say</h2>
                            <p className="section-subtitle">Real experiences from real people across India.</p>
                        </motion.div>
                        <div style={{ maxWidth: '720px' }}>
                            {[
                                { name: 'Priya Sharma', city: 'Mumbai', text: 'Booked a cardiologist in 2 minutes. The teleconsultation was seamless — felt like sitting in the clinic.', rating: 5 },
                                { name: 'Rajesh Kumar', city: 'Delhi', text: 'The prescription scanner is incredible. I just took a photo and it explained every medicine clearly.', rating: 5 },
                                { name: 'Anita Patel', city: 'Ahmedabad', text: 'Insurance verification was instant. No more running around with papers. Everything is digital now.', rating: 4 },
                            ].map((t, i) => (
                                <motion.div className="testimonial-card" key={i} {...stagger} transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}>
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
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── CTA BANNER — only for guests ─── */}
            {!user && (
                <section className="cta-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <motion.h2 className="cta-title" {...fadeUp}>Ready to take control of your health?</motion.h2>
                        <motion.p className="cta-subtitle" {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>Join thousands of patients who already trust Khushi Hygieia for their healthcare needs.</motion.p>
                        <motion.div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }} {...fadeUp} transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                Get Started — It's Free <ArrowRight size={16} />
                            </Link>
                            <Link to="/about" className="btn btn-outline" style={{ padding: '0.75rem 2rem', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                                Learn More
                            </Link>
                        </motion.div>
                    </div>
                </section>
            )}
        </>
    )
}
