export default function Emergency() {
    return (
        <div className="emergency-red">
            <section className="section">
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--emergency)', marginBottom: '0.5rem' }}>Immediate Critical Care Activation</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>This protocol bypasses standard triage and immediately flags your signal to the nearest integrated trauma center.</p>
                    </div>
                    <div className="emergency-grid">
                        <div className="card emergency-card">
                            <div className="emergency-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.66 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0122 16.92z" /></svg>
                            </div>
                            <h3 className="card-title">Initiate Priority Ambulance</h3>
                            <p className="card-text">Connect to central dispatch. GPS telemetry will be obtained automatically during call.</p>
                            <br /><a href="tel:112" className="btn btn-emergency">Dispatch Hotline</a>
                        </div>
                        <div className="card emergency-card">
                            <div className="emergency-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
                            </div>
                            <h3 className="card-title">Locate ER Capability</h3>
                            <p className="card-text">Search for the nearest Level 1/2 Trauma Center with confirmed bed vacancy.</p>
                            <br /><button className="btn btn-emergency">Find Hospitals</button>
                        </div>
                        <div className="card emergency-card">
                            <div className="emergency-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                            </div>
                            <h3 className="card-title">Urgent Blood Requisition</h3>
                            <p className="card-text">Broadcast requirement for specific blood groups across verified local donor networks.</p>
                            <br /><button className="btn btn-emergency">Query Inventory</button>
                        </div>
                        <div className="card emergency-card">
                            <div className="emergency-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48"><path d="M16 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                            </div>
                            <h3 className="card-title">Next-of-Kin Broadcast</h3>
                            <p className="card-text">Transmit GPS coordinates and medical status to registered emergency contacts instantly.</p>
                            <br /><button className="btn btn-emergency">Send Alert</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
