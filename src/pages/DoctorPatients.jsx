import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { Users, Search, Calendar, Video, User, Mail, Clock, Filter } from 'lucide-react'
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

            // Group by unique patients (by patient_id or patient_name)
            const patientMap = new Map()

            appointments?.forEach(appt => {
                const key = appt.patient_id || appt.patient_name || 'Unknown'
                if (!patientMap.has(key)) {
                    patientMap.set(key, {
                        id: key,
                        name: appt.patient_name || 'Unknown Patient',
                        email: appt.patient_email || '—',
                        totalAppointments: 0,
                        teleconsultations: 0,
                        inPerson: 0,
                        lastVisit: appt.appointment_date,
                        lastStatus: appt.status,
                        appointments: []
                    })
                }
                const patient = patientMap.get(key)
                patient.totalAppointments++
                if (appt.appointment_type === 'teleconsultation') patient.teleconsultations++
                else patient.inPerson++
                patient.appointments.push(appt)
            })

            setPatients(Array.from(patientMap.values()))
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

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        if (filterType === 'teleconsultation') return matchesSearch && p.teleconsultations > 0
        if (filterType === 'in_person') return matchesSearch && p.inPerson > 0
        return matchesSearch
    })

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
                                                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                                                flexShrink: 0
                                            }}>
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>{patient.name}</h4>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <Mail size={12} /> {patient.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
