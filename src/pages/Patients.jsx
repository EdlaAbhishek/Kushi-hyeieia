import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Calendar, Package, FileText, Check, ArrowRight } from 'lucide-react'

export default function Patients() {
    const { user } = useAuth()
    const [completedAppts, setCompletedAppts] = useState([])
    const [loadingCare, setLoadingCare] = useState(true)

    useEffect(() => {
        async function fetchCompleted() {
            if (!user) { setLoadingCare(false); return }

            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, doctors(*)')
                    .eq('patient_id', user.id)
                    .eq('status', 'completed')
                    .limit(6)
                if (data) {
                    setCompletedAppts(data)
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
                    <div className="section-header">
                        <h2 className="section-title">Patient Services</h2>
                        <p className="section-subtitle">Everything you need to manage your health journey.</p>
                    </div>
                    <div className="grid-3">
                        <div className="card">
                            <div className="card-icon">
                                <Calendar size={22} />
                            </div>
                            <h3 className="card-title">Book Appointment</h3>
                            <p className="card-text">Schedule visits with leading doctors across all medical specialties through our verified network.</p>
                            <Link to="/doctors" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>Search Doctors <ArrowRight size={15} /></Link>
                        </div>
                        <div className="card">
                            <div className="card-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
                                <Package size={22} />
                            </div>
                            <h3 className="card-title">Medicine & Blood Locator</h3>
                            <p className="card-text">Real-time inventory checks for essential medicines and nearby blood donor availability.</p>
                            <Link to="/services" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>Locate Resources <ArrowRight size={15} /></Link>
                        </div>
                        <div className="card">
                            <div className="card-icon" style={{ background: '#FFF7ED', color: '#C2410C' }}>
                                <FileText size={22} />
                            </div>
                            <h3 className="card-title">Electronic Health Records</h3>
                            <p className="card-text">Access your consultation history, lab reports, and prescriptions in a secure, encrypted vault.</p>
                            <Link to="/dashboard" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>My Dashboard <ArrowRight size={15} /></Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Post Patient Care ─── */}
            <section className="section" style={{ background: '#F8FAFC' }}>
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Post Care & Recovery Support</h2>
                        <p className="section-subtitle">Follow-up care for your completed appointments.</p>
                    </div>

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
                        <div className="appointment-grid">
                            {completedAppts.map(appt => (
                                <div key={appt.id} className="postcare-card">
                                    <div className="postcare-card-header">
                                        <div>
                                            <h3 className="appointment-doctor-name">
                                                {appt.doctors?.full_name || 'Doctor'}
                                            </h3>
                                            <p className="appointment-doctor-specialty">
                                                {appt.doctors?.specialty || '—'}
                                            </p>
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── AI Health Analytics ─── */}
            <section className="section">
                <div className="container grid-2">
                    <div className="split-content">
                        <h3>AI-Powered Health Analytics</h3>
                        <p>Khushi Hygieia utilizes advanced analytics to provide diagnostic support and preventive health recommendations based on your historical health data.</p>
                        <ul className="split-list">
                            <li><Check size={20} /><span>Condition tracking and vital sign monitoring</span></li>
                            <li><Check size={20} /><span>Automated prescription refill alerts</span></li>
                            <li><Check size={20} /><span>Seamless insurance claim processing</span></li>
                        </ul>
                        <Link to="/chat" className="btn btn-primary">Ask AI Assistant <ArrowRight size={15} /></Link>
                    </div>
                    <div className="ai-preview-card">
                        <div className="ai-preview-header">
                            <span>🤖</span> Khushi Care AI
                        </div>
                        <div className="ai-preview-body">
                            <p className="ai-preview-msg ai-msg-bot">Hello! I can help you understand your health reports, medications, and recovery guidelines.</p>
                            <p className="ai-preview-msg ai-msg-user">What should I do after my cardiologist visit?</p>
                            <p className="ai-preview-msg ai-msg-bot">Continue any prescribed medications, monitor your blood pressure daily, and schedule a follow-up in 2 weeks...</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
