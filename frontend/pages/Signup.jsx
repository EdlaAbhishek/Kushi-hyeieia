import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

        // Validate doctor fields
        if (role === 'doctor') {
            if (!specialty) { setError('Please select a specialty.'); setLoading(false); return }
            if (!hospitalName.trim()) { setError('Please enter your hospital name.'); setLoading(false); return }
        }

        // 1. Sign up with Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, role } },
        })

        if (signUpError) {
            setLoading(false)
            setError(signUpError.message)
            return
        }

        const userId = signUpData?.user?.id
        if (!userId) {
            setLoading(false)
            setError('Account created but user ID not returned. Please sign in.')
            setTimeout(() => navigate('/login'), 2000)
            return
        }

        // 2. Create profile row
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: name,
            email,
            role
        }, { onConflict: 'id' })

        if (profileError) {
            console.warn('Profile insert warning:', profileError.message)
        }

        // 3. If doctor → create doctors table row
        if (role === 'doctor') {
            const { error: doctorError } = await supabase.from('doctors').insert({
                id: userId,
                full_name: name,
                specialty,
                hospital_name: hospitalName.trim(),
                available: true,
                teleconsultation_available: true
            })

            if (doctorError) {
                console.error('Doctor row insert error:', doctorError.message)
                // Don't block signup — profile is already created
                if (doctorError.code === '42501') {
                    console.warn('RLS blocked doctor insert. Row may need manual creation.')
                }
            } else {
                console.log('Doctor profile created successfully')
            }
        }

        setLoading(false)
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setTimeout(() => navigate('/login'), 3000)
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
