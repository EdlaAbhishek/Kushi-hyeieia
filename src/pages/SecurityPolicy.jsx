import { Shield, Lock, Eye, FileText } from 'lucide-react'

export default function SecurityPolicy() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <Shield size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h1 style={{ fontSize: '2.5rem', color: 'var(--text-color)', marginBottom: '1rem' }}>Security & Privacy Policy</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Learn how Khushi Hygieia protects your health data and ensures safe AI interactions.</p>
            </div>

            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={24} color="var(--primary)" /> Data Encryption & Storage
                </h2>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                    All patient data stored on Khushi Hygieia is secured using industry-standard AES-256 encryption at rest. Data transmitted between your browser and our servers is protected by TLS 1.3 encryption.
                </p>
                <p style={{ lineHeight: 1.6 }}>
                    We utilize Supabase infrastructure which adheres to strict security standards, ensuring your personal health information (PHI) is isolated and protected against unauthorized access.
                </p>
            </div>

            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={24} color="#059669" /> AI Usage Transparency
                </h2>
                <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                    Khushi Hygieia uses advanced Artificial Intelligence models (such as Gemini/OpenRouter) to provide symptom analysis and hospital recommendations.
                </p>
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#B91C1C', fontSize: '1rem', marginBottom: '0.5rem' }}>Important Medical Disclaimer</h3>
                    <p style={{ color: '#991B1B', fontSize: '0.9rem', margin: 0 }}>
                        The AI features provided on this platform are for informational and preliminary triage purposes only. They are <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                    </p>
                </div>
                <p style={{ lineHeight: 1.6 }}>
                    When using AI features, anonymized symptom data is processed to generate recommendations. We do not use your personal identifiable information (PII) to train third-party AI models.
                </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={24} color="#8B5CF6" /> User Rights & Consent
                </h2>
                <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                    <li><strong>Right to Access:</strong> You can request a copy of all health data associated with your account.</li>
                    <li><strong>Right to Deletion:</strong> You may request the permanent deletion of your account and associated vitals at any time.</li>
                    <li><strong>Explicit Consent:</strong> We require your explicit consent before processing any health data through our AI engines.</li>
                </ul>
            </div>

            <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Last updated: March 2026
            </p>
        </div>
    )
}
