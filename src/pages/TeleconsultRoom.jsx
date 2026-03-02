import { useParams, Link } from 'react-router-dom'

export default function TeleconsultRoom() {
    const { appointmentId } = useParams()

    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">📹 Teleconsultation Room</h1>
                    <p className="page-subtitle">Session ID: {appointmentId?.slice(0, 8)}...</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="teleconsult-room">
                        <div className="teleconsult-video-area">
                            <div className="teleconsult-video-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 64, height: 64, opacity: 0.4 }}>
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                <h3>Waiting for Doctor</h3>
                                <p>Your doctor will join the video session shortly. Please ensure your camera and microphone are enabled.</p>
                            </div>
                        </div>
                        <div className="teleconsult-controls">
                            <button className="btn btn-primary" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                                Microphone
                            </button>
                            <button className="btn btn-primary" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                Camera
                            </button>
                            <Link to="/dashboard" className="btn btn-emergency">
                                End Session
                            </Link>
                        </div>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                            This is a placeholder session room. Full WebRTC video calling will be integrated in a future release.
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}
