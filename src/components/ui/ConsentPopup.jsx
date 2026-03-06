import { useState, useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function ConsentPopup() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already accepted the consent
        const hasConsented = localStorage.getItem('khushi_hygieia_consent')
        if (!hasConsented) {
            setIsVisible(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('khushi_hygieia_consent', 'true')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            color: 'white',
            padding: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '800px' }}>
                <ShieldAlert size={32} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#fff' }}>Data Privacy & Security Consent</h3>
                    <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                        We use cookies, local storage, and AI processing to improve your experience. Health data entered into AI tools (Symptom Checker, Hospital REC) is processed solely for triage and is not used to train global AI models. By continuing to use Khushi Hygieia, you agree to our <a href="/security" style={{ color: '#38BDF8', textDecoration: 'underline' }}>Security & Privacy Policy</a>.
                    </p>
                </div>
            </div>
            <button
                onClick={handleAccept}
                className="btn btn-primary"
                style={{ background: '#10B981', color: '#fff', border: 'none', padding: '0.75rem 2rem', whiteSpace: 'nowrap' }}
            >
                Accept & Continue
            </button>
        </div>
    )
}
