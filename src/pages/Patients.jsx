import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'

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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            </div>
                            <h3 className="card-title">Book Appointment</h3>
                            <p className="card-text">Schedule visits with leading doctors across all medical specialties through our verified network.</p>
                            <Link to="/doctors" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>Search Doctors</Link>
                        </div>
                        <div className="card">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                            </div>
                            <h3 className="card-title">Medicine & Blood Locator</h3>
                            <p className="card-text">Real-time inventory checks for essential medicines and nearby blood donor availability.</p>
                            <Link to="/hospitals" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>Locate Resources</Link>
                        </div>
                        <div className="card">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            </div>
                            <h3 className="card-title">Electronic Health Records</h3>
                            <p className="card-text">Access your consultation history, lab reports, and prescriptions in a secure, encrypted vault.</p>
                            <Link to="/dashboard" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>My Dashboard</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Post Patient Care ─── */}
            <section className="section section-bg">
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
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>Condition tracking and vital sign monitoring</span></li>
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>Automated prescription refill alerts</span></li>
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>Seamless insurance claim processing</span></li>
                        </ul>
                        <Link to="/chat" className="btn btn-primary">Ask AI Assistant</Link>
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
