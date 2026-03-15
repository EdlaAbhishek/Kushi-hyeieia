import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MapPin, Navigation, Video, Building2, Search, AlertCircle, Calendar } from 'lucide-react'
import SkeletonLoader from '../components/SkeletonLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import InfoTooltip from '../components/ui/InfoTooltip'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DataTable from '../components/ui/DataTable'
import ActionButton from '../components/ui/ActionButton'

export default function Hospitals() {
    const { user, isDoctor } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const urgentContext = location.state || {}

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
            console.log('[Hospitals] Fetching from Supabase...')
            const { data, error } = await supabase
                .from('hospitals')
                .select('*')

            if (error) {
                console.error('[Hospitals] Supabase query error:', error)
                throw error
            }

            console.log('[Hospitals] Supabase returned', data?.length, 'hospitals:', data)

            if (data && data.length > 0) {
                const supaHospitals = data.map(h => ({
                    id: h.id,
                    name: h.name || 'Unknown Hospital',
                    city: h.city || h.address || 'India',
                    beds: h.beds ? `${h.beds}+` : '200+',
                    emergency: h.emergency !== false,
                    teleconsult: h.teleconsult === true,
                    fromDB: true,
                }))

                // Only show DB hospitals, no fallbacks mixed in
                setHospitals(supaHospitals)
            } else {
                console.warn('[Hospitals] No hospitals in DB')
                setHospitals([])
            }
        } catch (err) {
            console.warn('[Hospitals] Could not fetch from database:', err.message)
            setHospitals([])
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
        padding: '0.6rem 1.25rem',
        borderRadius: '8px',
        border: `1px solid ${active ? '#0369A1' : '#E2E8F0'}`,
        background: active ? '#0369A1' : '#F8FAFC',
        color: active ? '#fff' : '#475569',
        fontWeight: 500,
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.15s ease',
    })

    return (
        <>
            <PageHeader
                title={urgentContext.urgent ? '🚨 Urgent — Find a Hospital' : 'Hospital Network'}
                description={urgentContext.urgent ? 'Select a hospital to book an urgent appointment based on your triage assessment.' : `${hospitals.length} integrated hospital partners nationwide.`}
            />

            <SectionContainer>
                <div>
                    {/* ─── URGENT TRIAGE BANNER ─── */}
                    {urgentContext.urgent && (
                        <div style={{
                            background: urgentContext.triage === 'Emergency'
                                ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                                : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                            border: `2px solid ${urgentContext.triage === 'Emergency' ? '#EF4444' : '#F59E0B'}`,
                            borderRadius: '12px',
                            padding: '1.25rem 1.5rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <AlertCircle size={24} color={urgentContext.triage === 'Emergency' ? '#B91C1C' : '#92400E'} style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: urgentContext.triage === 'Emergency' ? '#B91C1C' : '#92400E' }}>
                                    {urgentContext.triage} Triage — Select a hospital to book your appointment
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: urgentContext.triage === 'Emergency' ? '#991B1B' : '#78350F', lineHeight: 1.5 }}>
                                    Symptoms: {urgentContext.symptoms?.slice(0, 120)}{urgentContext.symptoms?.length > 120 ? '...' : ''}
                                    {urgentContext.possibleConditions && ` · Possible: ${urgentContext.possibleConditions.slice(0, 80)}`}
                                </p>
                            </div>
                        </div>
                    )}

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

                    <div className="search-bar" style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '450px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter location or hospital name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0.75rem 1rem 0.75rem 2.75rem' }}
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
                                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Hospital</th>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Location</th>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Capacity</th>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Facilities</th>
                                        <th style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Action</th>
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
                                            <tr key={hospitalId + '-' + i} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1.25rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '1rem' }}>{h.name}</div>
                                                </td>
                                                <td style={{ padding: '1.25rem', color: '#475569' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <MapPin size={14} color="#94A3B8" /> {h.city}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.25rem', color: '#475569' }}>{h.beds}</td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    {h.teleconsult ? (
                                                        <span style={{
                                                            fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px',
                                                            background: '#F0FDF4', color: '#16A34A', fontWeight: 500,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #BBF7D0'
                                                        }}>
                                                            <Video size={14} /> Video Call
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px',
                                                            background: '#F8FAFC', color: '#475569', fontWeight: 500,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #E2E8F0'
                                                        }}>
                                                            <Building2 size={14} /> In-Person
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    {h.emergency && <span style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 500, background: '#FEF2F2', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #FECACA' }}>24/7 Emergency</span>}
                                                </td>
                                                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ background: '#0F766E', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500, fontSize: '0.85rem' }}
                                                        onClick={() => navigate(`/hospitals/${hospitalId}`, { state: urgentContext.urgent ? urgentContext : undefined })}
                                                    >
                                                        {isDoctor ? 'View Details' : 'Book Appointment'}
                                                    </button>
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
