import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Droplet, Phone, Shield, Activity, MapPin, Users } from 'lucide-react'
import SectionContainer from '../components/ui/SectionContainer'
import ActionButton from '../components/ui/ActionButton'
import DashboardCard from '../components/ui/DashboardCard'

export default function Emergency() {
    return (
        <div className="emergency-page">
            <SectionContainer style={{ paddingTop: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="emergency-badge"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', color: '#DC2626', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid #FEE2E2' }}
                    >
                        <Activity size={16} /> EMERGENCY PROTOCOL ACTIVE
                    </motion.div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '1rem' }}>
                        Immediate Critical Care Activation
                    </h1>
                    <p className="text-muted-foreground" style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                        This protocol bypasses standard triage and immediately flags your signal to the nearest integrated trauma center.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>

                    {/* Priority Ambulance */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <DashboardCard className="emergency-card highlight" style={{ borderLeft: '5px solid #DC2626' }}>
                            <div className="emergency-icon-wrapper">
                                <Phone size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Initiate Priority Ambulance</h3>
                            <p className="text-muted-foreground" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Connect to central dispatch. GPS telemetry will be obtained automatically during call.
                            </p>
                            <ActionButton to="tel:112" variant="danger" style={{ background: '#DC2626', borderColor: '#DC2626', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Phone size={18} /> Call Dispatch (112)
                            </ActionButton>
                        </DashboardCard>
                    </motion.div>

                    {/* Blood Requisition */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <DashboardCard className="emergency-card" style={{ borderLeft: '5px solid #DC2626' }}>
                            <div className="emergency-icon-wrapper">
                                <Droplet size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Urgent Blood Requisition</h3>
                            <p className="text-muted-foreground" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Access our real-time donor network and hospital inventory hub.
                            </p>
                            <ActionButton to="/dashboard/blood-donation" variant="outline" style={{ borderColor: '#DC2626', color: '#DC2626', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Droplet size={18} /> Find Blood Now
                            </ActionButton>
                        </DashboardCard>
                    </motion.div>

                    {/* ER Capability */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <DashboardCard className="emergency-card" style={{ borderLeft: '5px solid #059669' }}>
                            <div className="emergency-icon-wrapper-green">
                                <MapPin size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Locate ER Capability</h3>
                            <p className="text-muted-foreground" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Search for nearest Trauma Center with confirmed bed vacancy.
                            </p>
                            <ActionButton to="/hospitals" variant="outline" style={{ borderColor: '#059669', color: '#059669', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <MapPin size={18} /> Search Nearby ER
                            </ActionButton>
                        </DashboardCard>
                    </motion.div>

                    {/* Next of Kin */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <DashboardCard className="emergency-card" style={{ borderLeft: '5px solid #2563EB' }}>
                            <div className="emergency-icon-wrapper-blue">
                                <Users size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Next-of-Kin Alert</h3>
                            <p className="text-muted-foreground" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Transmit GPS coordinates and medical status to emergency contacts.
                            </p>
                            <ActionButton variant="outline" style={{ borderColor: '#2563EB', color: '#2563EB', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Users size={18} /> Send Instant Alert
                            </ActionButton>
                        </DashboardCard>
                    </motion.div>
                </div>

                <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    <Shield size={32} color="#059669" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verified & Secure Response</h4>
                    <p className="text-muted-foreground" style={{ fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                        All emergency signals are encrypted and handled by verified medical professionals. Your location data is only shared with authorized responders during active emergencies.
                    </p>
                </div>
            </SectionContainer>
        </div>
    )
}
