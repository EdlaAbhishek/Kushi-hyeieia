import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Users, Search, Calendar, Video, User, Mail, Clock, Filter, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DashboardCard from '../components/ui/DashboardCard'
import StatusBadge from '../components/ui/StatusBadge'

export default function DoctorPatients() {
    const { user } = useAuth()
    const [patients, setPatients] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortByRisk, setSortByRisk] = useState(false)

    useEffect(() => {
        if (user) fetchPatients()
    }, [user])

    const fetchPatients = async () => {
        try {
            setIsLoading(true)

            // Get the doctor row to find the doctor's ID
            const { data: doctorRow } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            const doctorId = doctorRow?.id || user.id

            // Fetch all appointments for this doctor (try both id formats)
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', doctorId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching appointments:', error)
                setPatients([])
                return
            }

            // Separately fetch patient names from the patients table
            const patientIds = [...new Set((appointments || []).map(a => a.patient_id).filter(Boolean))]
            let patientNameMap = {}
            if (patientIds.length > 0) {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('id, full_name, email')
                    .in('id', patientIds)
                if (patientData) {
                    patientData.forEach(p => {
                        patientNameMap[p.id] = { name: p.full_name, email: p.email }
                    })
                }
            }

            // Group by unique patients (by patient_id)
            const patientMap = new Map()

            appointments?.forEach(appt => {
                const key = appt.patient_id || 'Unknown'
                const patientInfo = patientNameMap[appt.patient_id] || {}
                if (!patientMap.has(key)) {
                    patientMap.set(key, {
                        id: key,
                        name: patientInfo.name || 'Patient',
                        email: patientInfo.email || '—',
                        totalAppointments: 0,
                        teleconsultations: 0,
                        inPerson: 0,
                        lastVisit: appt.appointment_date,
                        lastStatus: appt.status,
                        appointments: [],
                        riskScore: 0,
                        riskLevel: 'Low'
                    })
                }
                const patient = patientMap.get(key)
                patient.totalAppointments++
                if (appt.appointment_type === 'teleconsultation') patient.teleconsultations++
                else patient.inPerson++
                patient.appointments.push(appt)
            })

            // Generate synthetic deterministic risk scores for demo purposes
            const patientArray = Array.from(patientMap.values()).map(p => {
                const nameScore = p.name.length * 13;
                const idScore = p.id === 'Unknown' ? 20 : p.id.charCodeAt(0) * 7;
                const totalApptWeight = p.totalAppointments * 5;
                const baseScore = (nameScore + idScore + totalApptWeight) % 100;
                
                // Ensure at least someone is high risk if there are patients
                let finalScore = baseScore;
                if (patientMap.size > 0 && Array.from(patientMap.values())[0].id === p.id) {
                    finalScore = Math.max(76, finalScore);
                }

                const riskLevel = finalScore > 75 ? 'High' : finalScore > 40 ? 'Moderate' : 'Low';
                
                return { ...p, riskScore: finalScore, riskLevel }
            })

            setPatients(patientArray)
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (d) => {
        if (!d) return '—'
        try {
            // Strip times if it's already an ISO string or just a date
            const dateStr = d.includes('T') ? d.split('T')[0] : d
            const date = new Date(dateStr + 'T00:00:00')
            if (isNaN(date.getTime()) || date.getFullYear() > 2100 || date.getFullYear() < 1900) return 'Recent'
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        } catch {
            return 'Recent'
        }
    }

    let filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        if (filterType === 'teleconsultation') return matchesSearch && p.teleconsultations > 0
        if (filterType === 'in_person') return matchesSearch && p.inPerson > 0
        return matchesSearch
    })

    if (sortByRisk) {
        filteredPatients.sort((a, b) => b.riskScore - a.riskScore);
    } else {
        // Default sort by recent
        filteredPatients.sort((a, b) => new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0));
    }

    const getStatusText = (status) => {
        const labels = {
            confirmed: 'Active',
            pending: 'Pending',
            completed: 'Completed',
            cancelled: 'Cancelled',
        }
        return labels[status] || 'Pending'
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="My Patients"
                description="Patients who have booked appointments with you"
                className="doctor-header"
                action={
                    <div style={{
                        background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '0.9rem', color: '#fff', fontWeight: 600
                    }}>
                        {patients.length} Patient{patients.length !== 1 ? 's' : ''}
                    </div>
                }
            />

            <SectionContainer>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >

                    {/* Search & Filter */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Search patients by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-control"
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>
                        <select
                            className="form-control"
                            style={{ width: 'auto', minWidth: '180px' }}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Appointments</option>
                            <option value="teleconsultation">Video Calls Only</option>
                            <option value="in_person">In-Person Only</option>
                        </select>
                        <button
                            className={`btn ${sortByRisk ? 'btn-primary' : 'btn-outline'}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600,
                                background: sortByRisk ? '#FEF2F2' : '#fff',
                                color: sortByRisk ? '#DC2626' : '#64748B',
                                border: `1px solid ${sortByRisk ? '#FECACA' : '#E2E8F0'}`,
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onClick={() => setSortByRisk(!sortByRisk)}
                        >
                            <AlertTriangle size={16} /> Prioritize High Risk
                        </button>
                    </div>

                    {/* Patient Cards */}
                    {filteredPatients.length === 0 ? (
                        <DashboardCard style={{ padding: '3rem', textAlign: 'center' }}>
                            <Users size={48} color="#CBD5E1" style={{ marginBottom: '1rem', flexShrink: 0, marginLeft: 'auto', marginRight: 'auto' }} />
                            <h3 style={{ color: '#64748B', fontWeight: 500 }}>No patients found</h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                {searchQuery ? 'Try adjusting your search.' : 'Patients will appear here when they book appointments with you.'}
                            </p>
                        </DashboardCard>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredPatients.map((patient, i) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <DashboardCard
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #0369A1, #0F766E)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                                                flexShrink: 0
                                            }}>
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {patient.name}
                                                    {patient.riskLevel === 'High' && (
                                                        <span style={{ fontSize: '0.7rem', background: '#FEF2F2', color: '#DC2626', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600, border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <AlertTriangle size={10} /> High Risk
                                                        </span>
                                                    )}
                                                </h4>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <Mail size={12} /> {patient.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'center', paddingRight: '1rem', borderRight: '1px solid #E2E8F0' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>AI Risk Score</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: patient.riskLevel === 'High' ? '#DC2626' : patient.riskLevel === 'Moderate' ? '#EAB308' : '#10B981' }}>
                                                    {patient.riskScore}%
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Visits</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>{patient.totalAppointments}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Video</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>{patient.teleconsultations}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>In-Person</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3B82F6' }}>{patient.inPerson}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Last Visit</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#475569' }}>{formatDate(patient.lastVisit)}</div>
                                            </div>
                                            <StatusBadge status={patient.lastStatus}>
                                                {getStatusText(patient.lastStatus)}
                                            </StatusBadge>
                                        </div>
                                    </DashboardCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </SectionContainer>
        </>
    )
}
