import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Activity, Stethoscope, Ticket, FileText, FlaskConical,
    Pill, Calendar, ShieldCheck, ChevronRight, CheckCircle2,
    Clock, AlertCircle, ArrowRight, ExternalLink, Download, Share2,
    HeartPulse, Sparkles
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import { useNavigate } from 'react-router-dom'

// Pre-configured episodic journeys demonstrating connected healthcare
const EPISODES = [
    {
        id: 'ep-1',
        title: 'Acute Bronchitis & Respiratory Infection',
        dateRange: '15 Sep 2026 – Present',
        status: 'In Progress (85%)',
        doctor: 'Dr. Priya Sharma',
        hospital: 'Apollo Hospitals Jubilee Hills',
        summary: 'From initial cough symptoms logged via AI checker to consultation, diagnostics, 5-day antibiotic adherence, and insurance claim.',
        steps: [
            {
                id: 'step-1',
                title: 'Symptom Triage Logged',
                category: 'Symptoms',
                icon: HeartPulse,
                date: '15 Sep 2026, 09:30 AM',
                status: 'completed',
                summary: 'Persistent dry cough, evening low-grade fever (99.6°F), and chest discomfort logged via Kushi AI Symptom Checker.',
                details: {
                    reportedSymptoms: ['Dry Cough', 'Fever', 'Throat irritation'],
                    riskLevel: 'Moderate',
                    aiGuidance: 'Consult a Pulmonologist or General Physician within 24 hours. Triage report attached to patient profile.',
                    linkText: 'View Symptom Checker',
                    linkPath: '/dashboard/symptom-checker'
                }
            },
            {
                id: 'step-2',
                title: 'OPD Digital Token Generated',
                category: 'OPD Queue',
                icon: Ticket,
                date: '15 Sep 2026, 10:15 AM',
                status: 'completed',
                summary: 'Token A-119 issued for Department of Pulmonology at Apollo Hospitals Jubilee Hills. Real-time wait tracked.',
                details: {
                    hospital: 'Apollo Hospitals Jubilee Hills',
                    department: 'Pulmonology',
                    token: 'A-119',
                    waitTime: '26 minutes (waited in cafeteria per smart suggestion)',
                    linkText: 'View OPD Queue',
                    linkPath: '/queue'
                }
            },
            {
                id: 'step-3',
                title: 'Doctor In-Chamber Consultation',
                category: 'Consultation',
                icon: Stethoscope,
                date: '15 Sep 2026, 10:48 AM',
                status: 'completed',
                summary: 'Clinical examination by Dr. Priya Sharma. Bilateral ronchi noted, no signs of acute consolidations. Diagnosed as Acute Bronchitis.',
                details: {
                    doctor: 'Dr. Priya Sharma (MD, FCCP)',
                    diagnosis: 'Acute Bronchitis (J20.9)',
                    clinicalNotes: 'Chest wheeze noted. Prescribed 5-day antibiotic course and bronchodilator. Ordered CBC and PA Chest X-Ray.',
                    linkText: 'View Appointments',
                    linkPath: '/dashboard/appointments'
                }
            },
            {
                id: 'step-4',
                title: 'Prescription Issued & Transferred',
                category: 'Prescription',
                icon: FileText,
                date: '15 Sep 2026, 11:05 AM',
                status: 'completed',
                summary: 'Digital prescription generated with 3 medications. Automatically parsed and scheduled into Medication Center.',
                details: {
                    medications: [
                        'Azithromycin 500mg — 1 tab OD after lunch x 5 days',
                        'Montelukast 10mg + Levocetirizine 5mg — 1 tab HS x 10 days',
                        'Ambroxol Syrup 30mg/5ml — 10ml TDS after meals x 5 days'
                    ],
                    linkText: 'View Prescription in Vault',
                    linkPath: '/dashboard/health-vault'
                }
            },
            {
                id: 'step-5',
                title: 'Diagnostic Lab Test Performed',
                category: 'Lab Test',
                icon: FlaskConical,
                date: '15 Sep 2026, 11:30 AM',
                status: 'completed',
                summary: 'Complete Blood Count (CBC) and Digital Chest X-Ray (PA View) collected at Apollo Diagnostics.',
                details: {
                    lab: 'Apollo Diagnostics Laboratory',
                    tests: ['Complete Blood Count with ESR', 'Chest X-Ray Digital PA View'],
                    transferCode: 'KH-APL-7291',
                    linkText: 'View Pending Reports',
                    linkPath: '/dashboard/health-vault'
                }
            },
            {
                id: 'step-6',
                title: 'Lab Report Verified & Added to Vault',
                category: 'Health Vault',
                icon: FileText,
                date: '16 Sep 2026, 04:15 PM',
                status: 'completed',
                summary: 'Apollo Diagnostics uploaded digital report. Patient reviewed and confirmed addition to Health Vault.',
                details: {
                    findings: 'WBC 11,200/uL (mildly elevated); Chest X-Ray clear of infiltrate or consolidation.',
                    verification: 'Clinically verified by Dr. K. Raman (Pathologist)',
                    linkText: 'Open Report in Vault',
                    linkPath: '/dashboard/health-vault'
                }
            },
            {
                id: 'step-7',
                title: 'Medication Adherence Tracking',
                category: 'Medication',
                icon: Pill,
                date: '15 Sep – 20 Sep 2026',
                status: 'completed',
                summary: 'Full 5-day antibiotic course completed with 94% on-time adherence. Reminders logged via Kushi Medication Center.',
                details: {
                    adherenceRate: '94% On-time doses',
                    missedDoses: '0 missed doses recorded',
                    linkText: 'Open Medication Center',
                    linkPath: '/medications'
                }
            },
            {
                id: 'step-8',
                title: 'Follow-Up Consultation Scheduled',
                category: 'Follow-up',
                icon: Calendar,
                date: '28 Sep 2026, 11:00 AM',
                status: 'scheduled',
                summary: 'Scheduled follow-up with Dr. Priya Sharma to verify complete symptom resolution and clear auscultation.',
                details: {
                    appointmentType: 'In-Clinic Follow-up',
                    doctor: 'Dr. Priya Sharma',
                    status: 'Confirmed for 28 Sep 2026',
                    linkText: 'Manage Appointment',
                    linkPath: '/dashboard/appointments'
                }
            },
            {
                id: 'step-9',
                title: 'Cashless Insurance Claim Settled',
                category: 'Insurance',
                icon: ShieldCheck,
                date: '22 Sep 2026, 02:40 PM',
                status: 'completed',
                summary: 'Pre-authorized OPD diagnostic claim CLM-2026-09-00127 settled for ₹3,450 by Star Health Insurance.',
                details: {
                    claimNumber: 'CLM-2026-09-00127',
                    provider: 'Star Health & Allied Insurance',
                    amountClaimed: '₹3,450',
                    amountApproved: '₹3,450 (100% cashless)',
                    linkText: 'View in Insurance Center',
                    linkPath: '/insurance'
                }
            }
        ]
    },
    {
        id: 'ep-2',
        title: 'Quarterly Diabetes Care & Metabolic Review',
        dateRange: '01 Jul – 10 Jul 2026',
        status: 'Completed',
        doctor: 'Dr. Rajesh Kumar',
        hospital: 'Yashoda Hospitals',
        summary: 'Routine HbA1c screening, endocrinologist review, Metformin dosage confirmation, and lifestyle wellness plan.',
        steps: [
            {
                id: 'step-201',
                title: 'Routine HbA1c & Fasting Glucose',
                category: 'Lab Test',
                icon: FlaskConical,
                date: '01 Jul 2026',
                status: 'completed',
                summary: 'Fasting glucose: 118 mg/dL; HbA1c: 6.8% (Target < 7.0%).',
                details: { lab: 'Thyrocare', linkPath: '/dashboard/health-vault', linkText: 'View Report' }
            },
            {
                id: 'step-202',
                title: 'Endocrine Consultation',
                category: 'Consultation',
                icon: Stethoscope,
                date: '03 Jul 2026',
                status: 'completed',
                summary: 'Dr. Rajesh Kumar confirmed good glycemic control; continued Metformin 500mg BID.',
                details: { doctor: 'Dr. Rajesh Kumar', linkPath: '/medications', linkText: 'View Schedule' }
            },
            {
                id: 'step-203',
                title: 'Medication Schedule Renewed',
                category: 'Medication',
                icon: Pill,
                date: '03 Jul 2026',
                status: 'completed',
                summary: '90-day medication schedule renewed in Medication Center with smart reminders.',
                details: { linkPath: '/medications', linkText: 'Medication Center' }
            }
        ]
    }
]

export default function HealthJourney() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [selectedEpisode, setSelectedEpisode] = useState(EPISODES[0])
    const [activeStepModal, setActiveStepModal] = useState(null)

    const completedSteps = selectedEpisode.steps.filter(s => s.status === 'completed').length
    const totalSteps = selectedEpisode.steps.length
    const progressPercent = Math.round((completedSteps / totalSteps) * 100)

    return (
        <div style={{ padding: '0 0 2rem 0' }}>
            <PageHeader
                title="Unified Health Journey"
                description="Connect your symptoms, OPD tokens, doctor consultations, prescriptions, lab reports, medications, and insurance claims in one continuous chronological narrative."
                action={
                    <ActionButton variant="outline" onClick={() => window.print()}>
                        <Download size={15} /> Export Health Summary
                    </ActionButton>
                }
            />

            {/* Episode Selector Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                {EPISODES.map(ep => {
                    const isSelected = selectedEpisode.id === ep.id
                    return (
                        <div
                            key={ep.id}
                            onClick={() => setSelectedEpisode(ep)}
                            style={{
                                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                                borderRadius: 'var(--radius)',
                                padding: '0.9rem 1.25rem',
                                cursor: 'pointer',
                                minWidth: '280px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 'var(--radius-pill)',
                                    background: isSelected ? 'var(--primary)' : '#E2E8F0',
                                    color: isSelected ? '#FFFFFF' : 'var(--text-dark)'
                                }}>
                                    {ep.dateRange}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>
                                    {ep.status}
                                </span>
                            </div>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                                {ep.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {ep.doctor} • {ep.hospital}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Episode Overview Card */}
            <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                marginBottom: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{
                                background: '#E0F2FE',
                                color: '#0369A1',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-pill)'
                            }}>
                                Connected Clinical Pathway
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedEpisode.dateRange}</span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.3rem 0' }}>
                            {selectedEpisode.title}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', maxWidth: '750px', lineHeight: 1.5 }}>
                            {selectedEpisode.summary}
                        </p>
                    </div>

                    <div style={{ minWidth: '180px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EPISODE COMPLETION</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {progressPercent}%
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>
                    </div>
                </div>

                {/* Journey Milestone Sequence Visualizer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    overflowX: 'auto',
                    gap: '0.5rem'
                }}>
                    {selectedEpisode.steps.map((step, idx) => (
                        <div
                            key={step.id}
                            onClick={() => setActiveStepModal(step)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: step.status === 'completed' ? '#16A34A' : '#E2E8F0',
                                color: step.status === 'completed' ? '#FFFFFF' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                {idx + 1}
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                {step.category}
                            </span>
                            {idx < selectedEpisode.steps.length - 1 && (
                                <ChevronRight size={14} color="#94A3B8" style={{ margin: '0 4px' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Vertical Interactive Timeline */}
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                {/* Timeline connector line */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    bottom: '20px',
                    left: '23px',
                    width: '3px',
                    background: '#E2E8F0'
                }} />

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {selectedEpisode.steps.map((step, index) => {
                        const StepIcon = step.icon
                        const isCompleted = step.status === 'completed'

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{ position: 'relative' }}
                            >
                                {/* Milestone Node Dot */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-2rem',
                                    top: '16px',
                                    transform: 'translateX(-50%)',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: isCompleted ? 'var(--primary)' : '#F1F5F9',
                                    border: '3px solid #FFFFFF',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isCompleted ? '#FFFFFF' : '#64748B',
                                    zIndex: 2
                                }}>
                                    <StepIcon size={16} />
                                </div>

                                {/* Step Detail Card */}
                                <div
                                    onClick={() => setActiveStepModal(step)}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: 'var(--surface)',
                                                    color: 'var(--primary)'
                                                }}>
                                                    {step.category}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {step.date}
                                                </span>
                                            </div>
                                            <h3 style={{ margin: '0.25rem 0 0.4rem 0', fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                                                {step.title}
                                            </h3>
                                        </div>

                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: 'var(--radius-pill)',
                                            background: isCompleted ? '#DCFCE7' : '#FEF3C7',
                                            color: isCompleted ? '#16A34A' : '#D97706'
                                        }}>
                                            {isCompleted ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                            {isCompleted ? 'Completed' : 'Scheduled'}
                                        </span>
                                    </div>

                                    <p style={{ margin: '0.4rem 0 0.8rem 0', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                        {step.summary}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            View clinical details & linked record <ChevronRight size={14} />
                                        </span>
                                        {step.details?.linkPath && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(step.details.linkPath)
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                {step.details.linkText} <ExternalLink size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Step Detail Drawer/Modal */}
            {activeStepModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius)',
                            maxWidth: '560px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                    {activeStepModal.category} • Milestone Detail
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                                    {activeStepModal.title}
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeStepModal.date}</span>
                            </div>
                            <button
                                onClick={() => setActiveStepModal(null)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1rem',
                            marginBottom: '1.25rem',
                            fontSize: '0.88rem',
                            lineHeight: 1.5
                        }}>
                            {activeStepModal.summary}
                        </div>

                        {/* Structured Details */}
                        {activeStepModal.details && (
                            <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.6rem', fontSize: '0.85rem' }}>
                                {Object.entries(activeStepModal.details).map(([key, val]) => {
                                    if (key === 'linkPath' || key === 'linkText') return null
                                    return (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                {key.replace(/([A-Z])/g, ' $1')}:
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-dark)', maxWidth: '300px', textAlign: 'right' }}>
                                                {Array.isArray(val) ? val.join(', ') : val}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <ActionButton variant="outline" onClick={() => setActiveStepModal(null)}>
                                Close
                            </ActionButton>
                            {activeStepModal.details?.linkPath && (
                                <ActionButton
                                    variant="primary"
                                    onClick={() => {
                                        const path = activeStepModal.details.linkPath
                                        setActiveStepModal(null)
                                        navigate(path)
                                    }}
                                >
                                    {activeStepModal.details.linkText} <ArrowRight size={14} />
                                </ActionButton>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
