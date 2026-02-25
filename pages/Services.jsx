export default function Services() {
    const items = [
        { title: 'Teleconsultation', desc: 'Video consultations with certified physicians from any location.' },
        { title: 'Lab Test Booking', desc: 'Schedule pathology and radiology tests at partner diagnostic centres.' },
        { title: 'Prescription Delivery', desc: 'Doorstep delivery of prescribed medications through verified pharmacies.' },
        { title: 'Health Checkup Packages', desc: 'Comprehensive preventive health screening programmes.' },
        { title: 'Insurance Integration', desc: 'Cashless claim processing across major insurance providers.' },
        { title: 'Mental Health Support', desc: 'Confidential counselling and psychiatric consultations.' },
    ]
    return (
        <>
            <section className="page-header"><div className="container"><h1 className="page-title">Our Services</h1><p className="page-subtitle">End-to-end healthcare services for patients and providers.</p></div></section>
            <section className="section">
                <div className="container">
                    <div className="grid-3">
                        {items.map(s => (
                            <div className="card" key={s.title}>
                                <h3 className="card-title">{s.title}</h3>
                                <p className="card-text">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
