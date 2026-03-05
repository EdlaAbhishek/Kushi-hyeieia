import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Insurance() {
    const [policyNumber, setPolicyNumber] = useState('')
    const [provider, setProvider] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const providers = [
        "Star Health",
        "HDFC ERGO",
        "ICICI Lombard",
        "Niva Bupa",
        "Care Health",
        "Aditya Birla"
    ]

    const handleVerify = (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        // Mock a network request delay
        setTimeout(() => {
            setLoading(false)
            // Generate a fake deterministic response based on the policy number length
            if (policyNumber.length < 5) {
                setResult({
                    status: 'invalid',
                    message: "Invalid Policy Number. Please check your document and try again."
                })
            } else {
                setResult({
                    status: 'active',
                    holder: "Verified Patient",
                    coverage: "₹5,00,000",
                    utilized: "₹45,000",
                    remaining: "₹4,55,000",
                    cashless: true
                })
            }
        }, 1500)
    }

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Insurance Integration</h1>
                    <p className="page-subtitle">Instantly verify your health insurance policy for cashless treatments.</p>
                </div>
            </section>

            <section className="section section-bg">
                <div className="container">
                    <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                        {/* LEFT COLUMN: Verification Form */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                <h3 className="section-title" style={{ fontSize: '1.4rem' }}>Verify Policy</h3>
                                <p className="section-subtitle">Enter your details below to check active coverage.</p>
                            </div>

                            <form onSubmit={handleVerify}>
                                <div className="form-group">
                                    <label className="form-label">Insurance Provider</label>
                                    <select
                                        className="form-control"
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select your provider</option>
                                        {providers.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Policy Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. P/123456/01/2026/00"
                                        value={policyNumber}
                                        onChange={(e) => setPolicyNumber(e.target.value)}
                                        required
                                        aria-invalid={result?.status === 'invalid' ? 'true' : 'false'}
                                    />
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                    {loading ? <LoadingSpinner size="small" text="Connecting..." /> : 'Verify Coverage'}
                                </button>
                            </form>
                        </motion.div>

                        {/* RIGHT COLUMN: Results Display */}
                        <div>
                            {loading && (
                                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                                    <ShieldCheck size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem', animation: 'pulse 2s infinite' }} />
                                    <h3 style={{ color: 'var(--text-dark)' }}>Verifying credentials...</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Communicating securely with {provider || "your provider"}.</p>
                                </div>
                            )}

                            {!loading && result && result.status === 'invalid' && (
                                <div className="card" style={{ borderLeft: '4px solid var(--emergency)' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        <AlertTriangle color="var(--emergency)" size={28} />
                                        <div>
                                            <h3 style={{ color: 'var(--emergency)', marginBottom: '0.25rem' }}>Verification Failed</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{result.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!loading && result && result.status === 'active' && (
                                <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <CheckCircle color="#10B981" size={32} />
                                        <div>
                                            <h3 style={{ color: '#10B981', marginBottom: '0.25rem' }}>Policy Active</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your {provider} policy is verified and eligible for cashless claims.</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Policy Holder:</span>
                                            <strong style={{ color: 'var(--text-dark)' }}>{result.holder}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Total Coverage:</span>
                                            <strong style={{ color: 'var(--text-dark)' }}>{result.coverage}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Amount Utilized:</span>
                                            <strong style={{ color: 'var(--emergency)' }}>{result.utilized}</strong>
                                        </div>
                                        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Available Balance:</span>
                                            <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{result.remaining}</strong>
                                        </div>
                                    </div>
                                    {result.cashless && (
                                        <div style={{ marginTop: '1.5rem', background: '#F0FDF4', color: '#166534', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
                                            ✓ Pre-authorized for immediate cashless admission.
                                        </div>
                                    )}
                                </div>
                            )}

                            {!loading && !result && (
                                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'transparent', boxShadow: 'none', border: '2px dashed var(--border)' }}>
                                    <ShieldCheck size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                                    <p style={{ color: 'var(--text-muted)' }}>Your verified policy details will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
