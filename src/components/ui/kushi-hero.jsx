import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import {
    FileHeart, Pill, ShieldCheck,
    UsersRound, Clock, HeartHandshake, ArrowRight, Sparkles,
    Shield, CheckCircle2
} from 'lucide-react'
import GradientWave from './kushi-hero-utils/gradient-wave'
import Marquee from './kushi-hero-utils/marquee'
import ActionButton from './ActionButton'
import familyHeroBg from '../../assets/family-hero.jpg'

// Three visual feature phrases
const FEATURE_PILLARS = [
    { title: 'Connected Care', desc: 'Seamless clinical handoffs' },
    { title: 'Smart Health Records', desc: 'FHIR-ready personal vault' },
    { title: 'Continuous Support', desc: 'Family circle & community' }
]

// Bottom Marquee capabilities with feature navigation routes
const HEALTH_CAPABILITIES = [
    {
        name: 'Health Vault',
        designation: 'Personal Health Records',
        description: 'Store and access reports, prescriptions and medical documents securely.',
        icon: FileHeart,
        to: '/dashboard/health-vault',
        doctorTo: '/doctor-dashboard/patient-records'
    },
    {
        name: 'Smart OPD Queue',
        designation: 'Digital Token & Wait Time',
        description: 'Join hospital queues digitally and track your place in real time.',
        icon: Clock,
        to: '/queue',
        doctorTo: '/doctor-queue'
    },
    {
        name: 'Medication Care',
        designation: 'Prescription & Reminders',
        description: 'Turn doctor-issued prescriptions into understandable medication schedules.',
        icon: Pill,
        to: '/medications',
        doctorTo: '/doctor-dashboard/prescriptions'
    },
    {
        name: 'Insurance Center',
        designation: 'Policies & Claims',
        description: 'Keep insurance documents, claims and pre-authorization information together.',
        icon: ShieldCheck,
        to: '/insurance',
        doctorTo: '/dashboard/insurance'
    },
    {
        name: 'Kushi Community',
        designation: 'Patient Assistance',
        description: 'Connect patients with verified non-clinical community support.',
        icon: UsersRound,
        to: '/community',
        doctorTo: '/doctor-dashboard/community'
    },
    {
        name: 'Care Circle',
        designation: 'Trusted Family Support',
        description: 'Share selected healthcare information with people you trust.',
        icon: HeartHandshake,
        to: '/care-circle',
        doctorTo: '/care-circle'
    }
]

// Subtle animation transitions
const containerMotion = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
}

export default function KushiHero() {
    const { user, isDoctor } = useAuth()
    const primaryLink = isDoctor ? '/doctor-dashboard' : user ? '/dashboard' : '/services'

    const capabilities = React.useMemo(() => {
        return HEALTH_CAPABILITIES.map(item => ({
            ...item,
            to: isDoctor ? (item.doctorTo || item.to) : item.to
        }))
    }, [isDoctor])

    return (
        <section
            className="kushi-hero-section"
            style={{
                position: 'relative',
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                paddingTop: '5rem',
                paddingBottom: '2.5rem'
            }}
        >
            {/* 1. Atmospheric Wave Background (Clean, minimal page background) */}
            <GradientWave />

            {/* 2. Central Hero Container */}
            <div
                className="container"
                style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '1100px',
                    margin: '0 auto',
                    padding: '0 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                {/* Main Hero Panel with Glassmorphism & Background Image INSIDE Card Only */}
                <motion.div
                    className="kushi-hero-panel"
                    variants={containerMotion}
                    initial="hidden"
                    animate="visible"
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '920px',
                        overflow: 'hidden',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.64)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.85)',
                        padding: '3rem 2.5rem 2.5rem 2.5rem',
                        boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    {/* Layer 1: Background Image Layer (100% visibility, crisp details, no blur) */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${familyHeroBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 20%',
                            opacity: 1,
                            filter: 'none',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Layer 2: Soft Luminous Overlay for Text Contrast without Diminishing Image Visibility */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.26) 45%, rgba(255, 255, 255, 0.46) 100%)',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Layer 3: Content Layer (fully sharp heading, description, buttons) */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        {/* MIDDLE: Large Headline */}
                        <h1
                            className="kushi-hero-headline"
                            style={{
                                margin: '0 0 1.25rem 0',
                                fontSize: 'clamp(2.1rem, 4.8vw, 3.4rem)',
                                fontWeight: 800,
                                lineHeight: 1.15,
                                letterSpacing: '-0.03em',
                                color: 'var(--text-dark)',
                                fontFamily: 'var(--font-heading)',
                                textShadow: '0 2px 14px rgba(255, 255, 255, 0.95), 0 0 4px rgba(255, 255, 255, 0.9)'
                            }}
                        >
                            Connected Healthcare.<br />
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, #1565C0 0%, #0D9488 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 2px 10px rgba(255, 255, 255, 0.9))'
                                }}
                            >
                                One Continuous Health Journey.
                            </span>
                        </h1>

                        {/* SUPPORTING: Short Explanation */}
                        <p
                            className="kushi-hero-supporting"
                            style={{
                                maxWidth: '720px',
                                margin: '0 0 2rem 0',
                                fontSize: 'clamp(0.95rem, 1.8vw, 1.12rem)',
                                lineHeight: 1.6,
                                color: '#0F172A',
                                fontWeight: 600,
                                textShadow: '0 1px 10px rgba(255, 255, 255, 0.95), 0 0 4px rgba(255, 255, 255, 0.9)'
                            }}
                        >
                            From appointments and OPD queues to prescriptions, lab reports, medication reminders,
                            insurance and community care, Kushi Hygieia brings your healthcare journey together in one secure platform.
                        </p>

                        {/* CTAs: Primary & Secondary */}
                        <div
                            className="kushi-hero-ctas"
                            style={{
                                display: 'flex',
                                gap: '0.85rem',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                marginBottom: 0
                            }}
                        >
                            <ActionButton
                                to={primaryLink}
                                variant="primary"
                                style={{
                                    padding: '0.75rem 1.65rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(21, 101, 192, 0.25)'
                                }}
                            >
                                Explore Kushi Hygieia <ArrowRight size={16} />
                            </ActionButton>

                            <ActionButton
                                to="/health-journey"
                                variant="outline"
                                style={{
                                    padding: '0.75rem 1.65rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                View Health Journey
                            </ActionButton>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Three Visual Feature Pillars */}
                <motion.div
                    className="kushi-feature-pillars"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.5rem',
                        width: '100%',
                        maxWidth: '880px',
                        marginTop: '2.5rem',
                        marginBottom: '1.5rem'
                    }}
                >
                    {FEATURE_PILLARS.map((pillar, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                borderRadius: 'var(--radius)',
                                padding: '1rem 1.25rem',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <h4
                                    style={{
                                        margin: '0 0 0.15rem 0',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        color: 'var(--text-dark)'
                                    }}
                                >
                                    {pillar.title}
                                </h4>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: '0.78rem',
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    {pillar.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* 4. Bottom Horizontal Capabilities Marquee */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: '100%',
                    marginTop: '1rem'
                }}
            >
                <Marquee items={capabilities} speed={36} pauseOnHover={true} />
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    .kushi-hero-panel {
                        padding: 2rem 1.25rem 1.75rem 1.25rem !important;
                        border-radius: 18px !important;
                    }
                    .kushi-hero-headline {
                        margin-bottom: 0.85rem !important;
                    }
                    .kushi-hero-supporting {
                        margin-bottom: 1.5rem !important;
                    }
                    .kushi-hero-ctas {
                        margin-bottom: 1.75rem !important;
                        flex-direction: column;
                        width: 100%;
                    }
                    .kushi-hero-ctas a,
                    .kushi-hero-ctas button {
                        width: 100% !important;
                        justify-content: center;
                    }
                    .kushi-feature-pillars {
                        grid-template-columns: 1fr !important;
                        gap: 0.75rem !important;
                        margin-top: 1.5rem !important;
                    }
                }
            `}</style>
        </section>
    )
}
