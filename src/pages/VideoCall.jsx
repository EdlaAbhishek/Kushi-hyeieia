import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Peer } from 'peerjs';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Settings, Activity } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../services/AuthContext';
import { toast } from 'react-hot-toast';

export default function VideoCall() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [peer, setPeer] = useState(null);
    const [myPeerId, setMyPeerId] = useState('');
    const [remotePeerId, setRemotePeerId] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [callActive, setCallActive] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    // Media states
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Refs
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const myStreamRef = useRef(null);
    const currentCallRef = useRef(null);

    // 1. Fetch Session Data
    useEffect(() => {
        async function fetchSession() {
            setLoading(true);
            try {
                if (!user) {
                    toast.error("You must be logged in.");
                    navigate('/');
                    return;
                }

                const { data, error } = await supabase
                    .from('video_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Session not found");

                setSessionData(data);

                // Initialize PeerJS only after we know the session exists
                initializePeer(data);
            } catch (err) {
                console.error("Session error:", err);
                toast.error("Could not load video session.");
                navigate('/dashboard');
            }
        }
        fetchSession();

        // Cleanup component unmount — only stop media, don't navigate
        return () => {
            if (currentCallRef.current) currentCallRef.current.close();
            if (myStreamRef.current) myStreamRef.current.getTracks().forEach(t => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, user, navigate]);

    // 2. Initialize PeerJS & Local Stream
    const initializePeer = async (session) => {
        let stream = null;

        // Try video + audio first, then audio only, then proceed without media
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e1) {
            console.warn("Camera+mic denied, trying audio only:", e1);
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                setIsVideoOff(true);
                setMediaError('camera');
            } catch (e2) {
                console.warn("Audio also denied:", e2);
                setMediaError('all');
            }
        }

        if (stream) {
            myStreamRef.current = stream;
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
        }

        try {
            // Create Peer
            const newPeer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });

            newPeer.on('open', async (id) => {
                setMyPeerId(id);
                setPeer(newPeer);

                // Register our ID in Supabase so the other person can find us
                const isDoctor = user.id === session.doctor_id;
                const updateField = isDoctor ? { doctor_peer_id: id } : { patient_peer_id: id };

                await supabase
                    .from('video_sessions')
                    .update(updateField)
                    .eq('id', sessionId);

                setLoading(false);
            });

            // Answer incoming calls automatically
            newPeer.on('call', (incomingCall) => {
                incomingCall.answer(stream || new MediaStream());
                currentCallRef.current = incomingCall;
                setCallActive(true);

                incomingCall.on('stream', (remoteStream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                });

                incomingCall.on('close', () => {
                    endCall();
                })
            });

            newPeer.on('error', (err) => {
                console.error("PeerJS Error:", err);
                toast.error(`Connection error: ${err.type}`);
            });

        } catch (err) {
            console.error("PeerJS init error:", err);
            toast.error("Could not initialize video connection.");
            setLoading(false);
        }
    };

    // 3. Listen for the other party's Peer ID via Supabase Realtime
    useEffect(() => {
        if (!sessionData || !myPeerId || !peer || callActive) return;

        const isDoctor = user.id === sessionData.doctor_id;

        // Check immediately if the other party is already there
        const opponentId = isDoctor ? sessionData.patient_peer_id : sessionData.doctor_peer_id;
        if (opponentId && opponentId !== remotePeerId) {
            setRemotePeerId(opponentId);
            initiateCall(opponentId);
        }

        // Subscribe to changes to see if they join later
        const channel = supabase
            .channel(`video_session_${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'video_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    const newOpponentId = isDoctor ? payload.new.patient_peer_id : payload.new.doctor_peer_id;

                    if (newOpponentId && newOpponentId !== remotePeerId && !callActive) {
                        setRemotePeerId(newOpponentId);
                        initiateCall(newOpponentId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myPeerId, sessionData, peer, callActive]);

    const initiateCall = (targetPeerId) => {
        if (!peer || !myStreamRef.current) return;

        toast.success("Connecting to other participant...");
        const call = peer.call(targetPeerId, myStreamRef.current);
        currentCallRef.current = call;
        setCallActive(true);

        call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        call.on('close', () => {
            endCall();
        })
    };

    // 4. Media Controls
    const toggleMute = () => {
        if (myStreamRef.current) {
            const audioTrack = myStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (myStreamRef.current) {
            const videoTrack = myStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = async () => {
        if (currentCallRef.current) {
            currentCallRef.current.close();
        }
        if (peer) {
            peer.destroy();
        }
        if (myStreamRef.current) {
            myStreamRef.current.getTracks().forEach(track => track.stop());
        }

        setCallActive(false);

        // Update database status
        try {
            await supabase
                .from('video_sessions')
                .update({ status: 'completed' })
                .eq('id', sessionId);

            if (sessionData && sessionData.appointment_id) {
                await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', sessionData.appointment_id);
            }
        } catch (e) {
            console.error(e)
        }

        // Route doctor back to doctor-dashboard, patient to regular dashboard
        const isDoctor = user && sessionData && user.id === sessionData.doctor_id;
        navigate(isDoctor ? '/doctor-dashboard' : '/dashboard');
        toast("Call ended.", { icon: '👋' });
    };

    // UI RENDER
    return (
        <div style={{ backgroundColor: '#0F172A', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <header style={{ padding: '1rem 2rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FFF' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                        <Activity size={20} color="#FFF" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Secure Teleconsultation</h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>End-to-end encrypted connection</p>
                    </div>
                </div>
                <div>
                    {callActive ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 2s infinite' }}></span>
                            <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>LIVE</span>
                        </div>
                    ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                            <span style={{ color: '#F59E0B', fontSize: '0.85rem', fontWeight: 600 }}>WAITING...</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Media permissions banner */}
            {mediaError && (
                <div style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: mediaError === 'all' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    borderBottom: `1px solid ${mediaError === 'all' ? '#EF4444' : '#F59E0B'}`,
                    display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>{mediaError === 'all' ? '🔇' : '📷'}</span>
                    <span style={{ color: '#FFF', fontSize: '0.9rem' }}>
                        {mediaError === 'all'
                            ? 'Camera & microphone are blocked.'
                            : 'Camera is blocked (audio only).'
                        }
                        {' '}Click the <strong>🔒 lock icon</strong> in your address bar → Allow Camera & Microphone → Reload this page.
                    </span>
                </div>
            )}

            {/* Main Video Area */}
            <main style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
                        <div className="loading-spinner" style={{ borderColor: '#334155', borderTopColor: 'var(--primary)', width: '40px', height: '40px', marginBottom: '1rem' }}></div>
                        <p>Initializing secure camera environment...</p>
                    </div>
                ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Remote Video (Big) */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#000',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}>
                            {!callActive ? (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', backgroundImage: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)' }}>
                                    <div style={{ background: '#334155', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                                        <Phone style={{ width: '40px', height: '40px', color: '#94A3B8' }} />
                                    </div>
                                    <h3 style={{ color: '#FFF', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 500 }}>Waiting for participant to join...</h3>
                                    <p style={{ maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
                                        The call will connect automatically once the other party opens their link.
                                    </p>
                                </div>
                            ) : null}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Local Video (PiP) */}
                        <div style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '24px',
                            width: '280px',
                            height: '180px',
                            backgroundColor: '#1E293B',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
                            border: '3px solid rgba(255, 255, 255, 0.1)',
                            zIndex: 10,
                            transition: 'all 0.3s ease'
                        }}>
                            {isVideoOff && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155' }}>
                                    <VideoOff size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Camera Off</span>
                                </div>
                            )}
                            <video
                                ref={myVideoRef}
                                autoPlay
                                playsInline
                                muted // ALWAYS MUTE LOCAL VIDEO OR IT WILL ECHO
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} // Mirror local video
                            />
                            <div style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '4px 10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                                You {isMuted && <MicOff size={14} color="#EF4444" />}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Controls */}
            <footer style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid #334155', zIndex: 10 }}>
                <button
                    onClick={toggleMute}
                    style={{
                        width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        backgroundColor: isMuted ? '#EF4444' : '#334155',
                        color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: isMuted ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    style={{
                        width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        backgroundColor: isVideoOff ? '#EF4444' : '#334155',
                        color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: isVideoOff ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={endCall}
                    style={{
                        width: '72px', height: '72px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        backgroundColor: '#EF4444',
                        color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.5)'
                    }}
                    title="End Consultation"
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    <PhoneOff size={32} />
                </button>

                <button
                    style={{
                        width: '56px', height: '56px', borderRadius: '50%', border: '1px solid #334155', cursor: 'not-allowed',
                        backgroundColor: 'transparent',
                        color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Settings (Coming Soon)"
                >
                    <Settings size={24} />
                </button>
            </footer>
        </div>
    );
}
