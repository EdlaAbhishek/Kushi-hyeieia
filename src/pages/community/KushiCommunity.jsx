import { useState, useEffect } from 'react'
import { useAuth } from '../../services/AuthContext'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart, Users, Calendar, MapPin, HandHeart, Star,
    CheckCircle, Award, Clock, AlertTriangle, Phone, ChevronRight
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import ActionButton from '../../components/ui/ActionButton'
import StatusBadge from '../../components/ui/StatusBadge'

const TASK_ICONS = {
    patient_escort: '🚶',
    wheelchair: '♿',
    navigation: '🗺️',
    elderly_assist: '👴',
    blood_donation: '🩸',
    health_camp: '🏕️',
    cleanliness: '🧹',
    medicine_pickup: '💊',
    awareness: '📢',
    rural_outreach: '🏘️',
    disaster_support: '🆘',
    document_assist: '📋',
    other: '📌'
}

const TASK_LABELS = {
    patient_escort: 'Patient Escort',
    wheelchair: 'Wheelchair Help',
    navigation: 'Hospital Navigation',
    elderly_assist: 'Elderly Assistance',
    blood_donation: 'Blood Donation',
    health_camp: 'Health Camp',
    cleanliness: 'Cleanliness Drive',
    medicine_pickup: 'Medicine Pickup',
    awareness: 'Health Awareness',
    rural_outreach: 'Rural Outreach',
    disaster_support: 'Disaster Support',
    document_assist: 'Document Help',
    other: 'Other'
}

export default function KushiCommunity() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [volunteer, setVolunteer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('tasks') // tasks | volunteer | request
    const [showRegister, setShowRegister] = useState(false)
    const [regForm, setRegForm] = useState({
        full_name: '', phone: '', skills: [], languages: ['Telugu', 'Hindi', 'English'], availability: 'weekdays'
    })
    const [requestForm, setRequestForm] = useState({ request_type: '', description: '', location: '' })

    const SKILL_OPTIONS = [
        'Patient Support', 'Wheelchair Help', 'Language Translation', 'First Aid',
        'Administrative Help', 'Driving', 'Elderly Care', 'Childcare', 'Technical Support'
    ]

    useEffect(() => {
        if (user) fetchAll()
    }, [user])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [taskRes, volRes] = await Promise.all([
                supabase.from('volunteer_tasks').select('*').eq('status', 'open').order('scheduled_date'),
                supabase.from('volunteers').select('*').eq('user_id', user.id).maybeSingle()
            ])
            setTasks(taskRes.data || [])
            setVolunteer(volRes.data || null)
        } catch (err) {
            console.warn('Error loading community data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('volunteers').insert([{
                user_id: user.id,
                full_name: regForm.full_name,
                phone: regForm.phone,
                skills: regForm.skills,
                languages: regForm.languages,
                availability: regForm.availability,
                verification_status: 'pending'
            }])
            if (error) throw error
            await logAudit({ userId: user.id, action: AUDIT_ACTIONS.VOLUNTEER_REGISTERED, entityType: 'volunteer', description: `Registered as volunteer: ${regForm.full_name}` }).catch(() => {})
            toast.success('Volunteer registration submitted! Verification pending.')
            setShowRegister(false)
            fetchAll()
        } catch (err) {
            toast.error('Registration failed. Please try again.')
        }
    }

    const handleAcceptTask = async (task) => {
        if (!volunteer) {
            toast.error('Please register as a volunteer first')
            setActiveTab('volunteer')
            return
        }
        try {
            const { error } = await supabase.from('volunteer_tasks')
                .update({ volunteer_id: volunteer.id, status: 'assigned' })
                .eq('id', task.id)
            if (error) throw error
            await logAudit({ userId: user.id, action: AUDIT_ACTIONS.TASK_ASSIGNED, entityType: 'volunteer_task', entityId: task.id, description: `Accepted: ${task.title}` }).catch(() => {})
            toast.success(`You accepted: ${task.title}`)
            fetchAll()
        } catch (err) {
            toast.error('Could not accept task')
        }
    }

    const handleRequestAssistance = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('assistance_requests').insert([{
                patient_id: user.id,
                request_type: requestForm.request_type,
                description: requestForm.description,
                location: requestForm.location,
                status: 'pending'
            }])
            if (error) throw error
            await logAudit({ userId: user.id, action: AUDIT_ACTIONS.ASSISTANCE_REQUESTED, entityType: 'assistance_request', description: `Assistance requested: ${requestForm.request_type}` }).catch(() => {})
            toast.success('Assistance request submitted! A volunteer will be matched shortly.')
            setRequestForm({ request_type: '', description: '', location: '' })
        } catch (err) {
            toast.error('Request failed. Please try again.')
        }
    }

    if (loading) {
        return (
            <>
                <PageHeader title="Kushi Community" description="Volunteer-driven assistance for a healthier community" />
                <div className="dashboard-loading"><div className="loading-spinner" /><p>Loading community...</p></div>
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Kushi Community"
                description="Volunteer-driven assistance for a healthier community"
            />

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem' }}>
                {/* Demo Banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1rem', background: '#FFFBEB',
                    border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem', color: '#92400E', fontWeight: 500,
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={15} />
                    <span><strong>Community Beta</strong> — Volunteer matching is simulated. Tasks shown are demonstrations of the platform's capabilities.</span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                            {tasks.length}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Open Tasks</div>
                    </DashboardCard>
                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>
                            {volunteer ? volunteer.completed_tasks : 0}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tasks Completed</div>
                    </DashboardCard>
                    <DashboardCard style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-heading)' }}>
                            {volunteer ? `${volunteer.volunteer_hours || 0}h` : '0h'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hours Donated</div>
                    </DashboardCard>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { key: 'tasks', label: '📋 Open Tasks' },
                        { key: 'volunteer', label: '🤝 My Volunteer Profile' },
                        { key: 'request', label: '🆘 Request Assistance' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`specialty-card ${activeTab === tab.key ? 'specialty-active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.length === 0 ? (
                            <div className="dashboard-empty">
                                <div className="dashboard-empty-icon">🤝</div>
                                <h3>No open tasks right now</h3>
                                <p>Check back soon or request assistance if you need help.</p>
                            </div>
                        ) : tasks.map(task => (
                            <DashboardCard key={task.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 'var(--radius-sm)',
                                            background: 'var(--primary-light)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                                        }}>
                                            {TASK_ICONS[task.task_type] || '📌'}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                                                {task.title}
                                            </h3>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                {task.description}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                {task.location && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <MapPin size={13} /> {task.location}
                                                    </span>
                                                )}
                                                {task.scheduled_date && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <Calendar size={13} /> {new Date(task.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        {task.scheduled_time && ` at ${task.scheduled_time}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ActionButton variant="primary" onClick={() => handleAcceptTask(task)} style={{ whiteSpace: 'nowrap' }}>
                                        <HandHeart size={16} /> Accept
                                    </ActionButton>
                                </div>
                                {task.is_demo && (
                                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#92400E', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        Demo task — for platform demonstration
                                    </div>
                                )}
                            </DashboardCard>
                        ))}
                    </div>
                )}

                {/* VOLUNTEER PROFILE TAB */}
                {activeTab === 'volunteer' && (
                    <div>
                        {volunteer ? (
                            <DashboardCard>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                            color: '#fff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem',
                                            fontFamily: 'var(--font-heading)'
                                        }}>
                                            {volunteer.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                                                {volunteer.full_name}
                                            </h3>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                Registered {new Date(volunteer.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={volunteer.is_verified ? 'healthy' : 'pending'}>
                                        {volunteer.is_verified ? 'Verified' : 'Pending Verification'}
                                    </StatusBadge>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Tasks Done</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{volunteer.completed_tasks}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Hours</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{volunteer.volunteer_hours || 0}h</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Reliability</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Star size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{volunteer.reliability_score || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {volunteer.skills?.length > 0 && (
                                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Skills</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {volunteer.skills.map(s => (
                                                <span key={s} className="spec-tag">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {volunteer.badges?.length > 0 && (
                                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Badges</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {volunteer.badges.map(b => (
                                                <span key={b} style={{ fontSize: '1.5rem' }}>{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </DashboardCard>
                        ) : (
                            <div className="dashboard-empty" style={{ maxWidth: 520, margin: '2rem auto' }}>
                                <div className="dashboard-empty-icon">🤝</div>
                                <h3>Not yet registered as a volunteer</h3>
                                <p>Join Kushi Community to help patients with non-clinical tasks at hospitals and community health initiatives.</p>
                                <ActionButton variant="primary" onClick={() => setShowRegister(true)} style={{ marginTop: '1rem' }}>
                                    <HandHeart size={16} /> Register as Volunteer
                                </ActionButton>
                            </div>
                        )}
                    </div>
                )}

                {/* REQUEST ASSISTANCE TAB */}
                {activeTab === 'request' && (
                    <DashboardCard title="Request Assistance" icon={Heart}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Need help with non-clinical tasks at the hospital? Submit a request and a volunteer will be matched to assist you.
                        </p>
                        <form onSubmit={handleRequestAssistance}>
                            <div className="form-group">
                                <label className="form-label">Type of Help Needed</label>
                                <select className="form-control" value={requestForm.request_type} onChange={e => setRequestForm(f => ({ ...f, request_type: e.target.value }))} required>
                                    <option value="">Select type</option>
                                    {Object.entries(TASK_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{TASK_ICONS[key]} {label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-control" placeholder="Describe what you need help with..." value={requestForm.description} onChange={e => setRequestForm(f => ({ ...f, description: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input className="form-control" placeholder="Hospital name, floor, or address" value={requestForm.location} onChange={e => setRequestForm(f => ({ ...f, location: e.target.value }))} />
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                                <Heart size={16} /> Submit Assistance Request
                            </button>
                        </form>
                    </DashboardCard>
                )}
            </div>

            {/* Register Modal */}
            <AnimatePresence>
                {showRegister && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegister(false)}>
                        <motion.div className="modal-content" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                            <button className="modal-close" onClick={() => setShowRegister(false)}>×</button>
                            <div className="modal-header">
                                <h3 className="modal-title">Volunteer Registration</h3>
                                <p className="modal-subtitle">Join Kushi Community as a verified volunteer</p>
                            </div>
                            <form onSubmit={handleRegister}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-control" value={regForm.full_name} onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input className="form-control" type="tel" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Skills (select all that apply)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {SKILL_OPTIONS.map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                className={`specialty-card ${regForm.skills.includes(skill) ? 'specialty-active' : ''}`}
                                                onClick={() => setRegForm(f => ({
                                                    ...f,
                                                    skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
                                                }))}
                                                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Availability</label>
                                    <select className="form-control" value={regForm.availability} onChange={e => setRegForm(f => ({ ...f, availability: e.target.value }))}>
                                        <option value="weekdays">Weekdays</option>
                                        <option value="weekends">Weekends</option>
                                        <option value="flexible">Flexible</option>
                                        <option value="evenings">Evenings only</option>
                                    </select>
                                </div>
                                <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                                    <HandHeart size={16} /> Register
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
