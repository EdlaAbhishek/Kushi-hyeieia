import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Activity, Users, ArrowLeft, Star, BedDouble } from 'lucide-react';
import { supabase } from '../services/supabase';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Mock data to match the array in Hospitals.jsx
const mockHospitals = [
    { id: '1', name: 'Apollo Hospitals', city: 'Chennai', beds: '500+', emergency: true, teleconsult: true, rating: 4.8, address: 'Greams Lane, Off Greams Road, Chennai' },
    { id: '2', name: 'Fortis Healthcare', city: 'Mumbai', beds: '400+', emergency: true, teleconsult: true, rating: 4.7, address: 'Mulund Goregaon Link Road, Mumbai' },
    { id: '3', name: 'Max Super Speciality', city: 'New Delhi', beds: '350+', emergency: true, teleconsult: false, rating: 4.6, address: 'Press Enclave Road, Saket, New Delhi' },
    { id: '4', name: 'Narayana Health', city: 'Bangalore', beds: '300+', emergency: true, teleconsult: true, rating: 4.8, address: 'Bommasandra Industrial Area, Bangalore' },
    { id: '5', name: 'AIIMS Network', city: 'Pan-India', beds: '1000+', emergency: true, teleconsult: false, rating: 4.9, address: 'Ansari Nagar, New Delhi' },
];

export default function HospitalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);

    // Appointment state
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        // Simulate fetch based on ID mapping to the mock array or from DB later
        setLoading(true);
        setTimeout(() => {
            const found = mockHospitals.find(h => h.id === id || h.name.toLowerCase().replace(/\s+/g, '-') === id);

            if (found) {
                setHospital(found);
            } else {
                // Return a generic one if no exact match
                setHospital({
                    id: id,
                    name: decodeURIComponent(id).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    city: 'Metro City',
                    beds: '250+',
                    emergency: true,
                    teleconsult: true,
                    rating: 4.5,
                    address: 'Central Health District'
                });
            }
            setLoading(false);
        }, 600);
    }, [id]);

    const handleRequestAppointment = (e) => {
        e.preventDefault();
        setRequestLoading(true);

        // Mock submission
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: 'Submitting request...',
                success: 'Request submitted successfully. Our team will contact you shortly.',
                error: 'Submission failed.',
            }
        ).then(() => {
            setRequestLoading(false);
            e.target.reset();
        });
    };

    if (loading) {
        return (
            <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="section" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h2>Hospital Not Found</h2>
                <button className="btn btn-primary" onClick={() => navigate('/hospitals')} style={{ marginTop: '1rem' }}>
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <>
            <section className="section" style={{ paddingBottom: '1rem', paddingTop: '2rem' }}>
                <div className="container">
                    <Breadcrumbs items={[{ label: 'Hospitals', href: '/hospitals' }, { label: hospital?.name, href: '' }]} />
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    {/* Header Card */}
                    <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', md: { flexDirection: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <h1 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>{hospital.name}</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600, fontSize: '0.9rem' }}>
                                        <Star size={14} fill="currentColor" /> {hospital.rating}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '1.05rem', marginBottom: '1rem' }}>
                                    <MapPin size={18} /> {hospital.address}, {hospital.city}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {hospital.emergency && (
                                        <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Activity size={14} /> 24/7 Emergency
                                        </span>
                                    )}
                                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.35rem 0.85rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <BedDouble size={14} /> {hospital.beds} Beds
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px', flexDirection: 'column' }}>
                                <button className="btn btn-primary" onClick={() => document.getElementById('appointment-form').scrollIntoView({ behavior: 'smooth' })}>
                                    Request Appointment
                                </button>
                                <button className="btn btn-outline" onClick={() => setShowContact(!showContact)}>
                                    Contact Hospital
                                </button>
                            </div>
                        </div>

                        {showContact && (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Emergency Helpline</p>
                                        <p style={{ fontWeight: 600, color: '#0F172A' }}>+91 1800-123-4567</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginBottom: '0.1rem' }}>Email Support</p>
                                        <p style={{ fontWeight: 600, color: '#0F172A' }}>contact@{hospital.name.toLowerCase().replace(/\s+/g, '')}.com</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', md: { gridTemplateColumns: '2fr 1fr' } }}>

                        {/* Main Content Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A' }}>Departments & Specialties</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Gastroenterology'].map(dept => (
                                        <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                            <span style={{ fontWeight: 500, color: '#1E293B' }}>{dept}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0F172A' }}>Facilities Overview</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: 44, height: 44, background: '#F0FDFA', color: '#0D9488', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ color: '#0F172A', marginBottom: '0.25rem' }}>ICU Facilities</h4>
                                            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>State-of-the-art intensive care units with advanced monitoring.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: 44, height: 44, background: '#EFF6FF', color: '#3B82F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ color: '#0F172A', marginBottom: '0.25rem' }}>Expert Panel</h4>
                                            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>Over 150+ specialized doctors and surgeons available.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: 44, height: 44, background: '#FDF4FF', color: '#C026D3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ color: '#0F172A', marginBottom: '0.25rem' }}>24/7 Pharmacy</h4>
                                            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>In-house pharmacy open round the clock for all medications.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Request Appointment Form */}
                        <div id="appointment-form" style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', height: 'fit-content' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0F172A' }}>Request Appointment</h2>
                            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '2rem' }}>Fill details and our hospital coordination team will call you back.</p>



                            <form onSubmit={handleRequestAppointment}>
                                <div className="form-group">
                                    <label className="form-label">Patient Name</label>
                                    <input type="text" className="form-control" required placeholder="Full Name" aria-label="Patient Full Name" disabled={requestLoading} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number</label>
                                    <input type="tel" className="form-control" required placeholder="+91 XXXXX XXXXX" aria-label="Contact Number" disabled={requestLoading} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Select Department</label>
                                    <select className="form-control" required defaultValue="">
                                        <option value="" disabled>Choose department...</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="General">General Physician</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preferred Date</label>
                                    <input type="date" className="form-control" required min={new Date().toISOString().split('T')[0]} aria-label="Preferred Appointment Date" disabled={requestLoading} />
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={requestLoading}>
                                    {requestLoading ? <LoadingSpinner size="small" text="Submitting..." /> : 'Submit Request'}
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}
