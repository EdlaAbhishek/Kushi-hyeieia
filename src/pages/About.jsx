export default function About() {
    return (
        <>
            <section className="page-header"><div className="container"><h1 className="page-title">About Khushi Hygieia</h1><p className="page-subtitle">Building India's most trusted digital healthcare infrastructure.</p></div></section>
            <section className="section">
                <div className="container grid-2">
                    <div className="split-content">
                        <h3>Our Mission</h3>
                        <p>Khushi Hygieia is committed to making quality healthcare accessible, affordable, and efficient for every Indian citizen through technology-driven solutions.</p>
                        <ul className="split-list">
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>Bridging the urban-rural healthcare divide</span></li>
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>AI-powered diagnostic and preventive care</span></li>
                            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>Secure, interoperable health data exchange</span></li>
                        </ul>
                    </div>
                    <div>
                        <div className="split-img" style={{ height: 300, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>Team Photo</div>
                    </div>
                </div>
            </section>
            <section className="section section-bg">
                <div className="container">
                    <h2 className="section-title">Leadership</h2>
                    <p className="section-subtitle">A team of healthcare professionals, engineers, and public health experts.</p>
                    <div className="grid-3">
                        {['Chief Executive Officer', 'Chief Medical Officer', 'Chief Technology Officer'].map(role => (
                            <div className="card" key={role}>
                                <h3 className="card-title">{role}</h3>
                                <p className="card-text">Bringing decades of experience in healthcare delivery and technology innovation.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
