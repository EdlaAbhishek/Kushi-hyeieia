import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { supabase } from '../services/supabase'
import { MapPin, Navigation } from 'lucide-react'
import SkeletonLoader from '../components/SkeletonLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import InfoButton from '../components/ui/InfoButton'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import SectionContainer from '../components/ui/SectionContainer'
import DataTable from '../components/ui/DataTable'
import ActionButton from '../components/ui/ActionButton'

export default function Hospitals() {
    const { user, isDoctor } = useAuth()
    const navigate = useNavigate()

    const hospitals = [
        { name: 'Apollo Hospitals', city: 'Chennai', beds: '500+', emergency: true, teleconsult: true },
        { name: 'Fortis Healthcare', city: 'Mumbai', beds: '400+', emergency: true, teleconsult: true },
        { name: 'Max Super Speciality', city: 'New Delhi', beds: '350+', emergency: true, teleconsult: false },
        { name: 'Narayana Health', city: 'Bangalore', beds: '300+', emergency: true, teleconsult: true },
        { name: 'AIIMS Network', city: 'Pan-India', beds: '1000+', emergency: true, teleconsult: false },
    ]

    const [searchQuery, setSearchQuery] = useState('')

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            <PageHeader
                title="Hospital Network"
                description="1,000+ integrated hospital partners nationwide."
            />

            {/* ─── Hospital Directory ─── */}
            <SectionContainer>
                <div>
                    <Breadcrumbs items={[{ label: 'Hospitals', href: '/hospitals' }]} />
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="section-title">Hospital Directory</h2>
                            <p className="section-subtitle">Partner hospitals across India with emergency and teleconsultation availability.</p>
                        </div>
                        <InfoButton content={{
                            en: { title: 'Hospital Network', helps: 'Find nearby hospitals and check their facilities.', usage: 'Search hospitals by city or name. You can see bed capacity, emergency status, and book appointments directly.' },
                            hi: { title: 'अस्पताल नेटवर्क', helps: 'आस-पास के अस्पतालों को खोजें और उनकी सुविधाओं की जांच करें।', usage: 'शहर या नाम के आधार पर अस्पतालों की खोज करें। आप बेड क्षमता, आपातकालीन स्थिति देख सकते हैं और सीधे अपॉइंटमेंट बुक कर सकते हैं।' },
                            te: { title: 'ఆసుపత్రి నెట్‌వర్క్', helps: 'సమీపంలోని ఆసుపత్రులను కనుగొనండి మరియు వారి సౌకర్యాలను తనిఖీ చేయండి.', usage: 'నగరం లేదా పేరు ద్వారా ఆసుపత్రుల కోసం శోధించండి. మీరు బెడ్ సామర్థ్యం, అత్యవసర స్థితిని చూడవచ్చు మరియు నేరుగా అపాయింట్‌మెంట్‌లను బుక్ చేసుకోవచ్చు.' }
                        }} />
                    </div>

                    <div className="search-bar" style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search hospitals by name or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="table-responsive">
                        <DataTable>
                            <thead>
                                <tr>
                                    <th>Hospital</th>
                                    <th>Location</th>
                                    <th>Capacity</th>
                                    <th>Facilities</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHospitals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                                            <div className="dashboard-empty-icon" style={{ margin: '0 auto 1rem' }}>🔍</div>
                                            <h3 style={{ marginBottom: '0.5rem', color: '#1E293B', fontSize: '1.2rem', fontWeight: 600 }}>No hospitals found</h3>
                                            <p style={{ color: '#64748B' }}>We couldn't find any hospitals matching your search criteria.</p>
                                        </td>
                                    </tr>
                                ) : filteredHospitals.map((h, i) => {
                                    const hospitalId = h.name.toLowerCase().replace(/\s+/g, '-');
                                    return (
                                        <tr key={h.name}>
                                            <td>
                                                <strong>{h.name}</strong>
                                                {h.teleconsult && <div style={{ fontSize: '0.7rem', color: '#10B981', display: 'inline-block', marginLeft: '0.5rem', background: '#F0FDFA', padding: '2px 6px', borderRadius: '4px' }}>📹 Video Consult</div>}
                                            </td>
                                            <td>{h.city}</td>
                                            <td>{h.beds}</td>
                                            <td>
                                                {h.emergency && <span className="status-badge status-confirmed" style={{ fontSize: '0.7rem' }}>24/7 Emergency</span>}
                                            </td>
                                            <td>
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
                </div>
            </SectionContainer>
        </>
    )
}
