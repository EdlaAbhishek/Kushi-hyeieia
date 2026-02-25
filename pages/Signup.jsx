import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'

export default function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('patient')
    const [specialty, setSpecialty] = useState('')
    const [hospitalName, setHospitalName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()
    const { signup } = useAuth()

    const specialtyOptions = [
        'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
        'General Medicine', 'Neurology', 'Oncology', 'Ophthalmology',
        'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
        'Radiology', 'Surgery', 'Urology'
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (role === 'doctor') {
            if (!specialty) { setError('Please select a specialty.'); setLoading(false); return }
            if (!hospitalName.trim()) { setError('Please enter your hospital name.'); setLoading(false); return }
        }

        try {
            await signup({ full_name: name, email, password, role })

            if (role === 'doctor') {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase.from('doctors').insert([{
                        id: user.id,
                        full_name: name,
                        specialty,
                        hospital: hospitalName.trim(),
                        verified: false
                    }])
                }
            }

            setLoading(false)
            setSuccess('Account created! Redirecting to dashboard...')
            setTimeout(() => {
                if (role === 'doctor') {
                    navigate('/doctor-dashboard')
                } else {
                    navigate('/dashboard')
                }
            }, 2000)
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo"><img src="/assets/logo.png" alt="Khushi Hygieia" /></div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-sub">Join India's trusted healthcare network</p>
                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">I am a</label>
                        <div className="role-picker">
                            <button type="button" className={`role-option ${role === 'patient' ? 'role-active' : ''}`} onClick={() => setRole('patient')}>
                                🏥 Patient
                            </button>
                            <button type="button" className={`role-option ${role === 'doctor' ? 'role-active' : ''}`} onClick={() => setRole('doctor')}>
                                🩺 Doctor
                            </button>
                        </div>
                    </div>

                    {/* Doctor-specific fields */}
                    {role === 'doctor' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Specialty</label>
                                <select className="form-control" value={specialty} onChange={e => setSpecialty(e.target.value)} required>
                                    <option value="">Select your specialty</option>
                                    {specialtyOptions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hospital / Clinic Name</label>
                                <input className="form-control" type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="Apollo Hospital, Delhi" required />
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    )
}
