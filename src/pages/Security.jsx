import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Lock, FileKey, EyeOff, Activity, CheckCircle, Server, Database } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' }
}

export default function Security() {
    return (
        <>
            <PageHeader
                title="Privacy & Security Center"
                description="We take your health data seriously. Learn about our zero-trust architecture, encryption standards, and compliance measures."
            />

            <SectionContainer>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <motion.div style={{ textAlign: 'center', marginBottom: '3rem' }} {...fadeUp}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1.5rem', background: '#F0FDF4', color: '#16A34A',
                            borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem',
                            border: '1px solid #BBF7D0', marginBottom: '1.5rem'
                        }}>
                            <Shield size={18} /> Zero-Trust Architecture Enabled
                        </div>
                        <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '1rem', fontWeight: 800 }}>
                            Enterprise-Grade Health Security
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.7, maxWidth: '700px', margin: '0 auto' }}>
                            Khushi Hygieia uses state-of-the-art cryptographic protocols to ensure your Protected Health Information (PHI) is isolated, encrypted, and accessible only to authorized personnel.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            style={{ background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#F8FAFC', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                                <Database size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '0.75rem', fontWeight: 700 }}>End-to-End Encryption</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>All patient data, medical records, and vitals are encrypted at rest using AES-256 and in transit using rigorous TLS 1.3 cryptographic protocols. We utilize Supabase's secure vault features for sensitive attributes.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            style={{ background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid #FECACA' }}>
                                <EyeOff size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '0.75rem', fontWeight: 700 }}>Row Level Security (RLS)</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Our database enforces strict PostgreSQL Row Level Security. Doctors can only see data for patients they have active appointments with. Patients solely control access to their private health vaults.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                            style={{ background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid #FEF3C7' }}>
                                <FileKey size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '0.75rem', fontWeight: 700 }}>Strict Access Auditing</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Every document viewed, generated, or downloaded produces a cryptographic hash and timestamp on our server logs. Suspicious bulk access triggers immediate automated lockdown procedures.</p>
                        </motion.div>
                    </div>

                    {/* Live Compliance Monitor UI */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            background: '#0F172A',
                            borderRadius: '24px',
                            padding: '3rem',
                            color: '#fff',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative background grid */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '2.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Security Protocol Status</h3>
                                    <p style={{ color: '#94A3B8', fontSize: '1.1rem', margin: 0 }}>System-wide compliance monitoring</p>
                                </div>
                                <div style={{ background: '#064E3B', border: '1px solid #047857', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#34D399' }}>
                                    <Activity size={18} /> Normal Operations
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
                                <div>
                                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Network Encryption</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                                        <CheckCircle size={20} color="#10B981" /> Active (TLS 1.3)
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Row Level Security (RLS)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                                        <CheckCircle size={20} color="#10B981" /> 100% Policy Match
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>RBAC Auth Engine</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                                        <CheckCircle size={20} color="#10B981" /> JWT Enforced
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Database State</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                                        <Server size={20} color="#3B82F6" /> Multi-AZ Replication
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </SectionContainer>
        </>
    )
}
