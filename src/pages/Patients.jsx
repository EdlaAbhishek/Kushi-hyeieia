import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Calendar, Package, FileText, Check, ArrowRight } from 'lucide-react'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' }
}

export default function Patients() {
    const { user, isDoctor } = useAuth()
    const [completedAppts, setCompletedAppts] = useState([])
    const [loadingCare, setLoadingCare] = useState(true)

    useEffect(() => {
        async function fetchCompleted() {
            if (!user) { setLoadingCare(false); return }

            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('patient_id', user.id)
                    .eq('status', 'completed')
                    .limit(6)
                if (data) {
                    // Separately fetch doctor details
                    const doctorIds = [...new Set(data.map(a => a.doctor_id).filter(Boolean))]
                    let doctorMap = {}
                    if (doctorIds.length > 0) {
                        const { data: doctorData } = await supabase
                            .from('doctors')
                            .select('id, full_name, specialty, hospital, hospital_name, profile_photo')
                            .in('id', doctorIds)
                        if (doctorData) {
                            doctorData.forEach(d => { doctorMap[d.id] = d })
                        }
                    }
                    setCompletedAppts(data.map(appt => ({ ...appt, doctors: doctorMap[appt.doctor_id] || null })))
                }
            } catch (err) {
                // Ignore error silently
            }
            setLoadingCare(false)
        }
        fetchCompleted()
    }, [user])

    const formatDate = (d) => {
        if (!d) return '—'
        return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const services = [
        { icon: Calendar, title: 'Book Appointment', desc: 'Schedule visits with leading doctors across all medical specialties through our verified network.', to: '/doctors', btnText: 'Search Doctors' },
        { icon: Package, title: 'Medicine & Blood Locator', desc: 'Real-time inventory checks for essential medicines and nearby blood donor availability.', to: '/services', btnText: 'Locate Resources' },
        // Only show dashboard link to patients
        ...(!isDoctor ? [{ icon: FileText, title: 'Electronic Health Records', desc: 'Access your consultation history, lab reports, and prescriptions in a secure, encrypted vault.', to: '/dashboard', btnText: 'My Dashboard' }] : []),
    ]

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Patient Portal</h1>
                    <p className="page-subtitle">Secure, fast, and comprehensive healthcare access.</p>
                </div>
            </section>

            {/* ─── Quick Actions ─── */}
            <section className="section">
                <div className="container">
                    <motion.div className="section-header" {...fadeUp}>
                        <h2 className="section-title">Patient Services</h2>
                        <p className="section-subtitle">Everything you need to manage your health journey.</p>
                    </motion.div>
                    <div style={{ maxWidth: '720px' }}>
                        {services.map((s, i) => (
                            <motion.div key={s.title} className="feature-row" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}>
                                <s.icon size={24} className="feature-icon" />
                                <div className="feature-content">
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                    <Link to={s.to} className="btn btn-outline" style={{ marginTop: '0.75rem' }}>{s.btnText} <ArrowRight size={15} /></Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Post Patient Care ─── */}
            <section className="section" style={{ background: 'var(--surface)' }}>
                <div className="container">
                    <motion.div className="section-header" {...fadeUp}>
                        <h2 className="section-title">Post Care & Recovery Support</h2>
                        <p className="section-subtitle">Follow-up care for your completed appointments.</p>
                    </motion.div>

                    {loadingCare && (
                        <div className="dashboard-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your care records...</p>
                        </div>
                    )}

                    {!loadingCare && completedAppts.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon">🩺</div>
                            <h3>No Post-Care Instructions Yet</h3>
                            <p>Once you complete appointments, post-care instructions and follow-up details will appear here.</p>
                            <Link to="/doctors" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>Book Appointment</Link>
                        </div>
                    )}

                    {!loadingCare && completedAppts.length > 0 && (
                        <div style={{ maxWidth: '720px' }}>
                            {completedAppts.map((appt, i) => (
                                <motion.div key={appt.id} className="postcare-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}>
                                    <div className="postcare-card-header">
                                        <div>
                                            <h3 className="appointment-doctor-name">{appt.doctors?.full_name || 'Doctor'}</h3>
                                            <p className="appointment-doctor-specialty">{appt.doctors?.specialty || '—'}</p>
                                        </div>
                                        <span className="status-badge status-completed">Completed</span>
                                    </div>
                                    <div className="postcare-card-body">
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Visit Date</span>
                                            <span className="appointment-value">{formatDate(appt.appointment_date)}</span>
                                        </div>
                                        <div className="appointment-detail">
                                            <span className="appointment-label">Hospital</span>
                                            <span className="appointment-value">{appt.doctors?.hospital_name || '—'}</span>
                                        </div>
                                        <div className="postcare-instructions">
                                            <span className="appointment-label">Post-Care Note</span>
                                            <p className="postcare-note-text">Follow up in 7 days. Continue prescribed medication. Contact the doctor if symptoms persist.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── AI Health Analytics ─── */}
            <section className="section">
                <div className="container grid-2">
                    <motion.div className="split-content" {...fadeUp}>
                        <h3>AI-Powered Health Analytics</h3>
                        <p>Khushi Hygieia utilizes advanced analytics to provide diagnostic support and preventive health recommendations based on your historical health data.</p>
                        <ul className="split-list">
                            <li><Check size={20} /><span>Condition tracking and vital sign monitoring</span></li>
                            <li><Check size={20} /><span>Automated prescription refill alerts</span></li>
                            <li><Check size={20} /><span>Seamless insurance claim processing</span></li>
                        </ul>
                        <Link to="/chat" className="btn btn-primary">Ask AI Assistant <ArrowRight size={15} /></Link>
                    </motion.div>
                    <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
                        <div className="ai-preview-card">
                            <div className="ai-preview-header"><span>🤖</span> Khushi Care AI</div>
                            <div className="ai-preview-body">
                                <p className="ai-preview-msg ai-msg-bot">Hello! I can help you understand your health reports, medications, and recovery guidelines.</p>
                                <p className="ai-preview-msg ai-msg-user">What should I do after my cardiologist visit?</p>
                                <p className="ai-preview-msg ai-msg-bot">Continue any prescribed medications, monitor your blood pressure daily, and schedule a follow-up in 2 weeks...</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    )
}
