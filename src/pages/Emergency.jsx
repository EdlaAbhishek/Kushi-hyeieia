import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Droplet, Phone, Shield, Activity, MapPin, Users } from 'lucide-react'

export default function Emergency() {
    return (
        <div className="emergency-page">
            <section className="section" style={{ paddingTop: '2rem' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="emergency-badge"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', color: '#DC2626', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid #FEE2E2' }}
                        >
                            <Activity size={16} /> EMERGENCY PROTOCOL ACTIVE
                        </motion.div>
                        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                            Immediate Critical Care Activation
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                            This protocol bypasses standard triage and immediately flags your signal to the nearest integrated trauma center.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>

                        {/* Priority Ambulance */}
                        <motion.div
                            className="card emergency-card highlight"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ borderLeft: '5px solid #DC2626', padding: '2rem' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Phone size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Initiate Priority Ambulance</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Connect to central dispatch. GPS telemetry will be obtained automatically during call.
                            </p>
                            <a href="tel:112" className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Phone size={18} /> Call Dispatch (112)
                            </a>
                        </motion.div>

                        {/* Blood Requisition */}
                        <motion.div
                            className="card emergency-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ borderLeft: '5px solid #DC2626', padding: '2rem' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Droplet size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Urgent Blood Requisition</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Access our real-time donor network and hospital inventory hub.
                            </p>
                            <Link to="/dashboard/blood-donation" className="btn btn-outline" style={{ borderColor: '#DC2626', color: '#DC2626', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Droplet size={18} /> Find Blood Now
                            </Link>
                        </motion.div>

                        {/* ER Capability */}
                        <motion.div
                            className="card emergency-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ borderLeft: '5px solid #059669', padding: '2rem' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <MapPin size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Locate ER Capability</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Search for nearest Trauma Center with confirmed bed vacancy.
                            </p>
                            <Link to="/hospitals" className="btn btn-outline" style={{ borderColor: '#059669', color: '#059669', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <MapPin size={18} /> Search Nearby ER
                            </Link>
                        </motion.div>

                        {/* Next of Kin */}
                        <motion.div
                            className="card emergency-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{ borderLeft: '5px solid #2563EB', padding: '2rem' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Users size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Next-of-Kin Alert</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Transmit GPS coordinates and medical status to emergency contacts.
                            </p>
                            <button className="btn btn-outline" style={{ borderColor: '#2563EB', color: '#2563EB', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Users size={18} /> Send Instant Alert
                            </button>
                        </motion.div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid var(--border)' }}>
                        <Shield size={32} color="#059669" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verified & Secure Response</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                            All emergency signals are encrypted and handled by verified medical professionals. Your location data is only shared with authorized responders during active emergencies.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
