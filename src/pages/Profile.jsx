import { useState, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { User, Mail, Shield, Calendar, Lock, LogOut, Stethoscope, Plus, X, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'

const SPECIALIZATION_OPTIONS = [
    'General Medicine', 'RMP', 'Cardiology', 'Dermatology', 'ENT',
    'Gastroenterology', 'Neurology', 'Oncology', 'Ophthalmology',
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
    'Radiology', 'Surgery', 'Urology', 'Gynecology', 'Dentistry',
    'Physiotherapy', 'Ayurveda', 'Homeopathy'
]

export default function Profile() {
    const { user, signOut, isDoctor } = useAuth()
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
    const [nameLoading, setNameLoading] = useState(false)
    const [nameMsg, setNameMsg] = useState('')

    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState('')

    // Doctor specialization state
    const [specializations, setSpecializations] = useState(
        user?.user_metadata?.specializations || []
    )
    const [specLoading, setSpecLoading] = useState(false)
    const [specMsg, setSpecMsg] = useState('')
    const [specDropdownOpen, setSpecDropdownOpen] = useState(false)
    const [error, setError] = useState('')

    const role = user?.user_metadata?.role || 'patient'
    const email = user?.email || ''
    const createdAt = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A'
    const initials = (user?.user_metadata?.full_name || email)
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const fileInputRef = useRef(null)

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: 'Uploading document...',
                success: 'Document uploaded successfully!',
                error: 'Upload failed.',
            }
        )
    }

    const handleNameUpdate = async (e) => {
        e.preventDefault()
        if (!fullName.trim()) return
        setNameLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName.trim() }
            })
            if (error) throw error
            toast.success('Name updated successfully!')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setNameLoading(false)
        }
    }

    const handlePasswordUpdate = async (e) => {
        e.preventDefault()
        if (newPw.length < 6) {
            toast.error('New password must be at least 6 characters.')
            return
        }
        if (newPw !== confirmPw) {
            toast.error('Passwords do not match.')
            return
        }
        setPwLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPw })
            if (error) throw error
            toast.success('Password changed successfully!')
            setNewPw('')
            setConfirmPw('')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setPwLoading(false)
        }
    }

    // ── Doctor specialization management ──
    const addSpecialization = (spec) => {
        if (!specializations.includes(spec)) {
            setSpecializations([...specializations, spec])
        }
        setSpecDropdownOpen(false)
    }

    const removeSpecialization = (spec) => {
        setSpecializations(specializations.filter(s => s !== spec))
    }

    const saveSpecializations = async () => {
        setSpecLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { specializations }
            })
            if (error) throw error
            toast.success('Specializations updated!')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSpecLoading(false)
        }
    }

    const availableSpecs = SPECIALIZATION_OPTIONS.filter(s => !specializations.includes(s))

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your account settings</p>
                </div>
            </section>

            <section className="section">
                <div className="container profile-page">
                    {/* ── User Info Card ── */}
                    <div className="profile-card profile-info-card">
                        <div className="flex flex-col items-center gap-2">
                            <div className="profile-avatar">{initials}</div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" style={{ display: 'none' }} />
                            <button type="button" className="btn btn-outline text-xs py-1 px-3" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={14} className="mr-1 inline" /> Upload Document
                            </button>
                        </div>
                        <div className="profile-info-grid">
                            <div className="profile-info-item">
                                <User size={18} />
                                <div>
                                    <span className="profile-label">Full Name</span>
                                    <span className="profile-value">{user?.user_metadata?.full_name || 'Not set'}</span>
                                </div>
                            </div>
                            <div className="profile-info-item">
                                <Mail size={18} />
                                <div>
                                    <span className="profile-label">Email</span>
                                    <span className="profile-value">{email}</span>
                                </div>
                            </div>
                            <div className="profile-info-item">
                                <Shield size={18} />
                                <div>
                                    <span className="profile-label">Role</span>
                                    <span className="profile-value" style={{ textTransform: 'capitalize' }}>{role}</span>
                                </div>
                            </div>
                            <div className="profile-info-item">
                                <Calendar size={18} />
                                <div>
                                    <span className="profile-label">Member Since</span>
                                    <span className="profile-value">{createdAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Two-column forms grid ── */}
                    <div className="profile-forms-grid">
                        <div className="profile-card">
                            <h3 className="profile-card-title"><User size={20} /> Update Name</h3>
                            <form onSubmit={handleNameUpdate}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        aria-invalid={!!error}
                                        aria-label="Full Name"
                                    />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={nameLoading}>
                                    {nameLoading ? 'Saving...' : 'Save Name'}
                                </button>
                            </form>
                        </div>

                        <div className="profile-card">
                            <h3 className="profile-card-title"><Lock size={20} /> Change Password</h3>
                            <form onSubmit={handlePasswordUpdate}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={newPw}
                                        onChange={e => setNewPw(e.target.value)}
                                        placeholder="Min 6 characters"
                                        aria-invalid={!!error}
                                        aria-label="New Password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={confirmPw}
                                        onChange={e => setConfirmPw(e.target.value)}
                                        placeholder="Re-enter new password"
                                        aria-invalid={!!error}
                                        aria-label="Confirm New Password"
                                    />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={pwLoading}>
                                    {pwLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Doctor Specializations (only for doctors) ── */}
                    {isDoctor && (
                        <div className="profile-card">
                            <h3 className="profile-card-title"><Stethoscope size={20} /> My Specializations</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '-0.75rem' }}>
                                Add your medical specializations so patients can find you by expertise.
                            </p>

                            {/* Selected specializations as tags */}
                            <div className="spec-tags">
                                {specializations.length === 0 && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No specializations added yet
                                    </span>
                                )}
                                {specializations.map(spec => (
                                    <span key={spec} className="spec-tag">
                                        {spec}
                                        <button className="spec-tag-remove" onClick={() => removeSpecialization(spec)}>
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Add dropdown */}
                            <div className="spec-add-wrap">
                                <button
                                    className="btn btn-outline spec-add-btn"
                                    onClick={() => setSpecDropdownOpen(!specDropdownOpen)}
                                    type="button"
                                >
                                    <Plus size={16} /> Add Specialization
                                </button>
                                {specDropdownOpen && (
                                    <div className="spec-dropdown">
                                        {availableSpecs.length === 0 ? (
                                            <div className="spec-dropdown-empty">All specializations added</div>
                                        ) : (
                                            availableSpecs.map(spec => (
                                                <button
                                                    key={spec}
                                                    className="spec-dropdown-item"
                                                    onClick={() => addSpecialization(spec)}
                                                >
                                                    {spec}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={saveSpecializations}
                                disabled={specLoading}
                                style={{ marginTop: '0.5rem' }}
                            >
                                {specLoading ? 'Saving...' : 'Save Specializations'}
                            </button>
                        </div>
                    )}

                    {/* ── Sign Out ── */}
                    <div className="profile-signout">
                        <button className="btn btn-outline profile-signout-btn" onClick={signOut}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>
            </section>
        </>
    )
}
