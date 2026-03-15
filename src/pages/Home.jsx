import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { motion } from 'framer-motion'
import { Video, Calendar, ShieldCheck, Stethoscope, HeartPulse, Clock, ArrowRight, Star, UserCheck, Building2, Smartphone, Droplet } from 'lucide-react'
import SectionContainer from '../components/ui/SectionContainer'
import ActionButton from '../components/ui/ActionButton'

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
        { icon: HeartPulse, title: 'AI Symptom Checker', desc: 'Describe your symptoms and our AI instantly evaluates potential conditions and triage levels.', to: '/symptom-checker' },
        { icon: ShieldCheck, title: 'Prescription Scanner (Health Vault)', desc: 'Upload any prescription (PDF/Image). Our AI reads it and translates all medicines and instructions into your regional language.', to: '/services' },
        { icon: Building2, title: 'AI Chat Assistant', desc: 'Have general health queries? Chat with our dedicated AI healthcare assistant anytime.', to: '/ai-chat' },
    ]

    const doctorServices = [
        { icon: Calendar, title: 'Appointment Manager', desc: 'Manage your physical and video consultations, confirm bookings, and view patient history.', to: '/doctor-dashboard' },
        { icon: Stethoscope, title: 'Patient Care Tools', desc: 'Write digital prescriptions, add post-care notes, and manage medical records.', to: '/doctor-dashboard' },
        { icon: Building2, title: 'Hospital Affiliations', desc: 'Manage your primary and visiting hospital associations and department links.', to: '/doctor-dashboard' },
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
                            <span>Powered by Advanced AI Technology</span>
                        </div>
                        <h1 className="hero-title">
                            {isDoctor ? 'Doctor Command Center' : 'Your Personal AI Health Assistant'}
                        </h1>
                        <p className="hero-subtitle">
                            {isDoctor
                                ? 'Manage your appointments, teleconsultations, and patient care from one clinical dashboard.'
                                : 'Instantly analyze symptoms, decode medical prescriptions into your native language, and chat with a smart healthcare AI.'}
                        </p>
                        <div className="hero-actions">
                            {isDoctor ? (
                                <>
                                    <ActionButton to="/doctor-dashboard" variant="primary">My Appointments <ArrowRight size={16} /></ActionButton>
                                    <ActionButton to="/hospitals" variant="outline">Hospital Network</ActionButton>
                                </>
                            ) : (
                                <>
                                    <ActionButton to="/services" variant="primary">Scan Prescription <ArrowRight size={16} /></ActionButton>
                                    <ActionButton to="/symptom-checker" variant="outline">Check Symptoms</ActionButton>
                                </>
                            )}
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item"><h4>AI</h4><p>Driven Insights</p></div>
                            <div className="stat-item"><h4>3</h4><p>Languages</p></div>
                            <div className="stat-item"><h4>24/7</h4><p>Instant Support</p></div>
                        </div>
                    </motion.div>
                    <motion.div className="hero-img-wrap" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}>
                        <img src="/assets/hero.png" alt="Family consulting healthcare provider online using Khushi Hygieia app" loading="lazy" />
                    </motion.div>
                </div>
            </section>

            {/* ─── SERVICES — Feature Rows ─── */}
            <SectionContainer>
                <motion.div className="section-header" {...fadeUp}>
                    <h2 className="section-title">
                        {isDoctor ? 'Clinical Tools' : 'Core AI Capabilities'}
                    </h2>
                    <p className="section-subtitle">
                        {isDoctor
                            ? 'Quick access to your practice management tools.'
                            : 'Experience the future of healthcare with our cutting-edge AI features.'}
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
            </SectionContainer>

            {/* ─── HOW IT WORKS — Timeline ─── */}
            {!isDoctor && (
                <SectionContainer className="bg-surface">
                    <motion.div className="section-header" {...fadeUp}>
                        <h2 className="section-title">Seamless Patient Experience</h2>
                        <p className="section-subtitle">Empowering you with AI tools before you even step into a clinic.</p>
                    </motion.div>
                    <div className="timeline">
                        {[
                            { num: 1, icon: HeartPulse, title: 'Analyze Symptoms', desc: 'Use our AI Symptom Checker to get immediate insights and triage recommendations based on your symptoms.' },
                            { num: 2, icon: Calendar, title: 'Book an Appointment', desc: 'Need a doctor? Find top specialists in our network and book a hospital visit or video consultation seamlessly.' },
                            { num: 3, icon: ShieldCheck, title: 'Scan & Translate Prescriptions', desc: 'After your visit, upload your prescription. We extract the text and translate all instructions into your regional language (Hindi, Telugu, English).' },
                        ].map((step, i) => (
                            <motion.div className="timeline-step" key={step.num} {...stagger} transition={{ duration: 0.45, delay: i * 0.15, ease: 'easeOut' }}>
                                <div className="timeline-number">{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </SectionContainer>
            )}

            {/* ─── WHY CHOOSE US — Flat Layout ─── */}
            {!isDoctor && (
                <SectionContainer>
                    <div className="grid-2" style={{ gap: '4rem' }}>
                        <motion.div className="feature-visual" {...fadeUp}>
                            <div className="feature-grid-visual">
                                <div className="fv-card fv-blue"><ShieldCheck size={24} /><span>AI Translator</span></div>
                                <div className="fv-card fv-teal"><HeartPulse size={24} /><span>Symptom Checker</span></div>
                                <div className="fv-card fv-amber"><Stethoscope size={24} /><span>Virtual Assistant</span></div>
                                <div className="fv-card fv-rose"><Building2 size={24} /><span>Hospital Network</span></div>
                            </div>
                        </motion.div>
                        <motion.div className="split-content" {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
                            <h3 style={{ fontSize: '1.65rem', letterSpacing: '-0.03em' }}>A Smarter Way to Manage Health</h3>
                            <p>We combine advanced artificial intelligence with a robust hospital network to provide a complete, end-to-end healthcare ecosystem tailored for regional inclusivity.</p>
                            <ul className="split-list">
                                <li><ShieldCheck size={20} /><span><strong>Native Language Support</strong> — Break the medical jargon barrier with instant translations to Hindi and Telugu.</span></li>
                                <li><Smartphone size={20} /><span><strong>AI Precision</strong> — Smart OCR and GenAI models read and analyze your documents instantly.</span></li>
                                <li><Clock size={20} /><span><strong>All-In-One Platform</strong> — AI insights, telemedicine, and physical bookings in a single place.</span></li>
                            </ul>
                            <ActionButton to="/services" variant="primary">Try the Scanner <ArrowRight size={16} /></ActionButton>
                        </motion.div>
                    </div>
                </SectionContainer>
            )}

            {/* ─── TESTIMONIALS — Flat Quotes ─── */}
            {!isDoctor && (
                <SectionContainer className="bg-surface">
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
                </SectionContainer>
            )}

            {/* ─── CTA BANNER — only for guests ─── */}
            {!user && (
                <SectionContainer className="cta-section">
                    <div style={{ textAlign: 'center' }}>
                        <motion.h2 className="cta-title" {...fadeUp}>Ready to take control of your health?</motion.h2>
                        <motion.p className="cta-subtitle" {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>Join thousands of patients who already trust Khushi Hygieia for their healthcare needs.</motion.p>
                        <motion.div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }} {...fadeUp} transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}>
                            <ActionButton to="/signup" variant="primary" style={{ padding: '0.75rem 2rem' }}>
                                Get Started — It's Free <ArrowRight size={16} />
                            </ActionButton>
                            <ActionButton to="/about" variant="outline" style={{ padding: '0.75rem 2rem', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                                Learn More
                            </ActionButton>
                        </motion.div>
                    </div>
                </SectionContainer>
            )}
        </>
    )
}
