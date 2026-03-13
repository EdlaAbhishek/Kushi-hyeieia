import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MapPin, Navigation, Video, Building2 } from 'lucide-react'
import SkeletonLoader from '../components/SkeletonLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DataTable from '../components/ui/DataTable'
import ActionButton from '../components/ui/ActionButton'

// Fallback hospitals when Supabase data is unavailable
const FALLBACK_HOSPITALS = [
    { name: 'Apollo Hospitals', city: 'Chennai', beds: '500+', emergency: true, teleconsult: true },
    { name: 'Fortis Healthcare', city: 'Mumbai', beds: '400+', emergency: true, teleconsult: true },
    { name: 'Max Super Speciality', city: 'New Delhi', beds: '350+', emergency: true, teleconsult: false },
    { name: 'Narayana Health', city: 'Bangalore', beds: '300+', emergency: true, teleconsult: true },
    { name: 'AIIMS Network', city: 'Pan-India', beds: '1000+', emergency: true, teleconsult: false },
    { name: 'KIMS Hospital', city: 'Secunderabad', beds: '350+', emergency: true, teleconsult: true },
    { name: 'Yashoda Hospitals', city: 'Hyderabad', beds: '400+', emergency: true, teleconsult: true },
    { name: 'Manipal Hospitals', city: 'Bangalore', beds: '600+', emergency: true, teleconsult: true },
    { name: 'Medanta – The Medicity', city: 'Gurugram', beds: '1250+', emergency: true, teleconsult: true },
    { name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', beds: '750+', emergency: true, teleconsult: true },
]

export default function Hospitals() {
    const { user, isDoctor } = useAuth()
    const navigate = useNavigate()

    const [hospitals, setHospitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'video-call' | 'normal'

    useEffect(() => {
        fetchHospitals()
    }, [])

    const fetchHospitals = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('hospitals')
                .select('*')

            if (error) throw error

            if (data && data.length > 0) {
                const supaHospitals = data.map(h => ({
                    id: h.id,
                    name: h.name || 'Unknown Hospital',
                    city: h.city || h.address || 'India',
                    beds: h.beds ? `${h.beds}+` : '200+',
                    emergency: h.emergency !== false,
                    teleconsult: h.teleconsult || false,
                    fromDB: true,
                }))

                const supaNames = new Set(supaHospitals.map(h => h.name.toLowerCase()))
                const uniqueFallbacks = FALLBACK_HOSPITALS.filter(h => !supaNames.has(h.name.toLowerCase()))
                setHospitals([...supaHospitals, ...uniqueFallbacks])
            } else {
                setHospitals(FALLBACK_HOSPITALS)
            }
        } catch (err) {
            console.warn('Could not fetch hospitals from database, using fallback data:', err.message)
            setHospitals(FALLBACK_HOSPITALS)
        } finally {
            setLoading(false)
        }
    }

    const filteredHospitals = hospitals.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.city.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType =
            typeFilter === 'all' ? true :
            typeFilter === 'video-call' ? h.teleconsult === true :
            typeFilter === 'normal' ? !h.teleconsult :
            true
        return matchesSearch && matchesType
    })

    const filterPillStyle = (active) => ({
        padding: '0.5rem 1.25rem',
        borderRadius: '100px',
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: active ? 'var(--primary)' : '#fff',
        color: active ? '#fff' : 'var(--text-main)',
        fontWeight: 600,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
    })

    return (
        <>
            <PageHeader
                title="Hospital Network"
                description={`${hospitals.length} integrated hospital partners nationwide.`}
            />

            <SectionContainer>
                <div>
                    <Breadcrumbs items={[{ label: 'Hospitals', href: '/hospitals' }]} />
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="section-title">Hospital Directory</h2>
                            <p className="section-subtitle">Partner hospitals across India with emergency and teleconsultation availability.</p>
                        </div>
                        <InfoTooltip content={{
                            en: { title: 'Hospital Network', helps: 'Find nearby hospitals and check their facilities.', usage: 'Search hospitals by city or name. Filter by type: Video Call hospitals offer teleconsultation, Normal clinics are for in-person visits only.' },
                            hi: { title: 'अस्पताल नेटवर्क', helps: 'आस-पास के अस्पतालों को खोजें और उनकी सुविधाओं की जांच करें।', usage: 'शहर या नाम के आधार पर अस्पतालों की खोज करें।' },
                            te: { title: 'ఆసుపత్రి నెట్‌వర్క్', helps: 'సమీపంలోని ఆసుపత్రులను కనుగొనండి.', usage: 'నగరం లేదా పేరు ద్వారా ఆసుపత్రుల కోసం శోధించండి.' }
                        }} />
                    </div>

                    <div className="search-bar" style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '400px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter location or hospital name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Type Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <button
                            style={filterPillStyle(typeFilter === 'all')}
                            onClick={() => setTypeFilter('all')}
                        >
                            All Hospitals
                        </button>
                        <button
                            style={filterPillStyle(typeFilter === 'video-call')}
                            onClick={() => setTypeFilter('video-call')}
                        >
                            <Video size={15} /> Video Call
                        </button>
                        <button
                            style={filterPillStyle(typeFilter === 'normal')}
                            onClick={() => setTypeFilter('normal')}
                        >
                            <Building2 size={15} /> Normal Clinics
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
                            <div className="loading-spinner"></div>
                            <p style={{ marginLeft: '1rem', color: '#64748B' }}>Loading hospitals...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <DataTable>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Hospital</th>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Location</th>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Capacity</th>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Type</th>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Facilities</th>
                                        <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-main)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHospitals.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                                <div className="dashboard-empty-icon" style={{ margin: '0 auto 1rem' }}>🔍</div>
                                                <h3 style={{ marginBottom: '0.5rem', color: '#1E293B', fontSize: '1.2rem', fontWeight: 600 }}>No hospitals found</h3>
                                                <p style={{ color: '#64748B' }}>We couldn't find any hospitals matching your search criteria.</p>
                                            </td>
                                        </tr>
                                    ) : filteredHospitals.map((h, i) => {
                                        const hospitalId = h.id || h.name.toLowerCase().replace(/\s+/g, '-');
                                        return (
                                            <tr key={hospitalId + '-' + i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <strong>{h.name}</strong>
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>{h.city}</td>
                                                <td style={{ padding: '1.25rem 1rem' }}>{h.beds}</td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    {h.teleconsult ? (
                                                        <span style={{
                                                            fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                            background: '#F0FDF4', color: '#16A34A', fontWeight: 600,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                                                        }}>
                                                            <Video size={11} /> Video Call
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                            background: '#EFF6FF', color: '#2563EB', fontWeight: 600,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                                                        }}>
                                                            <Building2 size={11} /> Normal Clinic
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    {h.emergency && <span className="status-badge status-confirmed" style={{ fontSize: '0.7rem' }}>24/7 Emergency</span>}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <ActionButton
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/hospitals/${hospitalId}`)}
                                                    >
                                                        {isDoctor ? 'View Details' : 'Book Appointment'}
                                                    </ActionButton>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        </div>
                    )}
                </div>
            </SectionContainer>
        </>
    )
}
