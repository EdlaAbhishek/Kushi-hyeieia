import { motion } from 'framer-motion'
import { Check, Users, Brain, Shield } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' }
}

export default function About() {
    return (
        <>
            <PageHeader
                title="About Khushi Hygieia"
                description="Building India's most trusted digital healthcare infrastructure."
            />
            <SectionContainer>
                <div className="grid-2">
                    <motion.div className="split-content" {...fadeUp}>
                        <h3>Our Mission</h3>
                        <p>Khushi Hygieia is committed to making quality healthcare accessible, affordable, and efficient for every Indian citizen through technology-driven solutions.</p>
                        <ul className="split-list">
                            <li><Check size={20} /><span>Bridging the urban-rural healthcare divide</span></li>
                            <li><Brain size={20} /><span>AI-powered diagnostic and preventive care</span></li>
                            <li><Shield size={20} /><span>Secure, interoperable health data exchange</span></li>
                        </ul>
                    </motion.div>
                    <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
                        <div className="split-img" style={{ height: 300, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>Team Photo</div>
                    </motion.div>
                </div>
            </SectionContainer>
            <SectionContainer className="bg-surface">
                <div>
                    <motion.div {...fadeUp}>
                        <h2 className="section-title">Leadership</h2>
                        <p className="section-subtitle">A team of healthcare professionals, engineers, and public health experts.</p>
                    </motion.div>
                    <div style={{ marginTop: '2rem', maxWidth: '720px' }}>
                        {['Chief Executive Officer', 'Chief Medical Officer', 'Chief Technology Officer'].map((role, i) => (
                            <motion.div key={role} className="feature-row" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}>
                                <Users size={24} className="feature-icon" />
                                <div className="feature-content">
                                    <h3>{role}</h3>
                                    <p>Bringing decades of experience in healthcare delivery and technology innovation.</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </SectionContainer>
        </>
    )
}

