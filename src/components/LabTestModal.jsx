import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, Activity, MapPin, Calendar, CheckSquare, X } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import { supabase } from '../services/supabase'

// Standard diagnostic tests available for booking
const AVAILABLE_TESTS = [
    { id: 'full-body', name: 'Full Body Checkup', prep: 'Fasting 10-12 hrs' },
    { id: 'thyroid', name: 'Thyroid Profile (T3, T4, TSH)', prep: 'No strict fasting' },
    { id: 'diabetes', name: 'Diabetes Screening (HbA1c & Fasting)', prep: 'Fasting 8-10 hrs' },
    { id: 'lipid', name: 'Lipid Profile', prep: 'Fasting 10-12 hrs' },
    { id: 'cbc', name: 'Complete Blood Count (CBC)', prep: 'No preparation required' },
    { id: 'lft-kft', name: 'Liver & Kidney Function Test', prep: 'No strict fasting' },
]

export default function LabTestModal({ isOpen, onClose }) {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [selectedTests, setSelectedTests] = useState([])
    const [formData, setFormData] = useState({
        patient_name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        preferred_date: '',
        preferred_time_slot: 'Morning (8 AM - 11 AM)',
        notes: ''
    })

    // Avoid rendering completely if not open and animation finished
    if (!isOpen && step === 1) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            handleClose()
        }
    }

    const handleClose = () => {
        onClose();
        // Reset after animation completes
        setTimeout(() => {
            setStep(1)
            setSelectedTests([])
        }, 500)
    }

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const toggleTest = (testId) => {
        setSelectedTests(prev =>
            prev.includes(testId)
                ? prev.filter(id => id !== testId)
                : [...prev, testId]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (selectedTests.length === 0) {
            toast.error("Please select at least one laboratory test.")
            return
        }

        if (!formData.patient_name || !formData.phone || !formData.address || !formData.preferred_date) {
            toast.error("Please fill in all required patient details.")
            return
        }

        setLoading(true)

        // Database request
        try {
            const selectedTestNames = AVAILABLE_TESTS
                .filter(t => selectedTests.includes(t.id))
                .map(t => t.name)

            const newBooking = {
                patient_id: user.id, // Link to the auth user
                patient_name: formData.patient_name,
                phone: formData.phone,
                address: formData.address,
                preferred_date: formData.preferred_date,
                preferred_time_slot: formData.preferred_time_slot,
                tests: selectedTestNames,
                status: 'pending'
            }

            const { error: insertError } = await supabase
                .from('lab_test_bookings')
                .insert(newBooking);

            if (insertError) throw insertError;

            setStep(3); // Success step
            toast.success("Home collection booked successfully!")
        } catch (error) {
            toast.error("Failed to book test. Please try again.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        WebkitBackdropFilter: 'blur(4px)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                        overflowY: 'auto'
                    }}
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: '#EFF6FF', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <Activity size={20} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Book Lab Tests</h3>
                            </div>
                            {!loading && step !== 3 && (
                                <button onClick={handleClose} className="btn-icon" style={{ padding: '0.25rem' }}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Content Area */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckSquare size={18} /> Select Diagnostic Tests
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {AVAILABLE_TESTS.map(test => (
                                            <div
                                                key={test.id}
                                                onClick={() => toggleTest(test.id)}
                                                style={{
                                                    border: `2px solid ${selectedTests.includes(test.id) ? 'var(--primary)' : 'var(--border)'}`,
                                                    borderRadius: '10px',
                                                    padding: '1rem',
                                                    cursor: 'pointer',
                                                    background: selectedTests.includes(test.id) ? '#EFF6FF' : '#fff',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.75rem'
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '4px',
                                                    border: `2px solid ${selectedTests.includes(test.id) ? 'var(--primary)' : '#CBD5E1'}`,
                                                    background: selectedTests.includes(test.id) ? 'var(--primary)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '0.1rem'
                                                }}>
                                                    {selectedTests.includes(test.id) && <CheckSquare size={12} color="#fff" strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B', marginBottom: '0.25rem' }}>{test.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prep: {test.prep}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
                                        </span>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setStep(2)}
                                            disabled={selectedTests.length === 0}
                                        >
                                            Continue to Details
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={18} /> Home Collection Details
                                        </h4>
                                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            &larr; Back to Tests
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Patient Name *</label>
                                            <input type="text" className="form-control" name="patient_name" value={formData.patient_name} onChange={handleChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number *</label>
                                            <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">Complete Address for Collection *</label>
                                        <textarea className="form-control" name="address" rows="2" value={formData.address} onChange={handleChange} placeholder="House/Flat No., Street, Area, Landmark" required></textarea>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Preferred Date *</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type="date" className="form-control" name="preferred_date" min={new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]} value={formData.preferred_date} onChange={handleChange} required style={{ paddingLeft: '2.5rem' }} />
                                                <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Time Slot *</label>
                                            <select className="form-control" name="preferred_time_slot" value={formData.preferred_time_slot} onChange={handleChange} required>
                                                <option>Morning (6 AM - 8 AM)</option>
                                                <option>Morning (8 AM - 11 AM)</option>
                                                <option>Afternoon (12 PM - 3 PM)</option>
                                                <option>Evening (4 PM - 7 PM)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                                        <label className="form-label">Additional Instructions (Optional)</label>
                                        <input type="text" className="form-control" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific requirements or landmarks..." />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="btn btn-outline" onClick={handleClose} style={{ flex: 1 }} disabled={loading}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                            {loading ? <LoadingSpinner size="small" text="Scheduling..." /> : 'Confirm Booking'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', padding: '2rem 1rem' }}
                                >
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', marginBottom: '1.5rem' }}>
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>Booking Confirmed!</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                                        Your lab tests have been scheduled. Our certified technician will arrive at <strong>{formData.address}</strong> on <strong>{formData.preferred_date}</strong> between <strong>{formData.preferred_time_slot}</strong> to collect the samples.
                                    </p>

                                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#1E293B', fontWeight: 600 }}>
                                            <Shield size={16} color="var(--primary)" /> Pre-Test Instructions
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                            <li>Please ensure you follow the fasting guidelines for your selected tests.</li>
                                            <li>Keep your ID proof ready for verification.</li>
                                            <li>Payment can be made online or directly to the technician via UPI/Cash.</li>
                                        </ul>
                                    </div>

                                    <button className="btn btn-primary" onClick={handleClose} style={{ minWidth: '200px' }}>
                                        Done
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
