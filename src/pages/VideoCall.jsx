import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../services/AuthContext'
import Peer from 'peerjs'
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function VideoCall() {
    const { sessionId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [peerId, setPeerId] = useState('')
    const [remotePeerId, setRemotePeerId] = useState('')
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [sessionData, setSessionData] = useState(null)
    const [callActive, setCallActive] = useState(false)

    const peerInstance = useRef(null)
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const localStreamRef = useRef(null)

    useEffect(() => {
        if (!user || !sessionId) return

        const initSession = async () => {
            try {
                // Fetch session metadata
                const { data, error } = await supabase
                    .from('video_sessions')
                    .select('*, doctor_id, patient_id')
                    .eq('id', sessionId)
                    .single()

                if (error) throw error
                setSessionData(data)

                const isDoctor = user.id === data.doctor_id
                const isPatient = user.id === data.patient_id

                if (!isDoctor && !isPatient) {
                    toast.error("Unauthorized access to this session.")
                    navigate('/dashboard')
                    return
                }

                // Initialize PeerJS
                const peer = new Peer()
                peerInstance.current = peer

                peer.on('open', (id) => {
                    setPeerId(id)
                    // Update session with peerId
                    updatePeerIdInDB(id, isDoctor)
                })

                peer.on('call', (call) => {
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                        localVideoRef.current.srcObject = stream
                        localStreamRef.current = stream
                        call.answer(stream)
                        call.on('stream', (remoteStream) => {
                            remoteVideoRef.current.srcObject = remoteStream
                            setCallActive(true)
                        })
                    })
                })

                // Listen for peer ID updates in DB
                const channel = supabase
                    .channel(`session-${sessionId}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'video_sessions', filter: `id=eq.${sessionId}` },
                        (payload) => {
                            const newPeerId = isDoctor ? payload.new.patient_peer_id : payload.new.doctor_peer_id
                            if (newPeerId && newPeerId !== remotePeerId) {
                                setRemotePeerId(newPeerId)
                                if (!callActive) {
                                    startCall(newPeerId)
                                }
                            }
                            if (payload.new.status === 'completed') {
                                cleanupAndExit()
                            }
                        }
                    )
                    .subscribe()

                setLoading(false)

                return () => {
                    supabase.removeChannel(channel)
                    cleanup()
                }

            } catch (err) {
                console.error(err)
                toast.error("Failed to initialize video session.")
                navigate('/dashboard')
            }
        }

        initSession()
    }, [user, sessionId])

    const updatePeerIdInDB = async (id, isDoctor) => {
        const updateData = isDoctor ? { doctor_peer_id: id } : { patient_peer_id: id }
        await supabase.from('video_sessions').update(updateData).eq('id', sessionId)
    }

    const startCall = (remoteId) => {
        if (!remoteId) return

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            localVideoRef.current.srcObject = stream
            localStreamRef.current = stream
            const call = peerInstance.current.call(remoteId, stream)
            call.on('stream', (remoteStream) => {
                remoteVideoRef.current.srcObject = remoteStream
                setCallActive(true)
            })
        })
    }

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => (track.enabled = !track.enabled))
            setIsMuted(!isMuted)
        }
    }

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => (track.enabled = !track.enabled))
            setIsVideoOff(!isVideoOff)
        }
    }

    const endCall = async () => {
        if (window.confirm("Are you sure you want to end this consultation?")) {
            await supabase.from('video_sessions').update({ status: 'completed' }).eq('id', sessionId)
            // Also update appointment status
            if (sessionData?.appointment_id) {
                await supabase.from('appointments').update({ status: 'completed' }).eq('id', sessionData.appointment_id)
            }
            cleanupAndExit()
        }
    }

    const cleanupAndExit = () => {
        cleanup()
        toast.success("Consultation ended.")
        navigate(user?.user_metadata?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard')
    }

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
        }
        if (peerInstance.current) {
            peerInstance.current.destroy()
        }
    }

    if (loading) return <div className="video-loading"><LoadingSpinner /></div>

    return (
        <div className="video-call-container">
            <div className="video-header">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: '#fff', margin: 0 }}>Consultation in Progress</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Session ID: {sessionId}</p>
                        </div>
                        <div className="call-status">
                            {callActive ? (
                                <span className="status-live">● LIVE</span>
                            ) : (
                                <span className="status-waiting">WAITING FOR OTHER PARTICIPANT...</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="video-main">
                <div className="video-grid">
                    <div className="remote-video-wrap">
                        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                        {!callActive && (
                            <div className="remote-placeholder">
                                <User size={80} color="rgba(255,255,255,0.1)" />
                                <p>Waiting for participant...</p>
                            </div>
                        )}
                    </div>
                    <div className="local-video-wrap">
                        <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
                        <div className="local-label">You</div>
                    </div>
                </div>
            </div>

            <div className="video-footer">
                <div className="controls-set">
                    <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <MicOff /> : <Mic />}
                    </button>
                    <button className={`control-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo} title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}>
                        {isVideoOff ? <VideoOff /> : <Video />}
                    </button>
                    <button className="control-btn end-call-btn" onClick={endCall} title="End Call">
                        <PhoneOff />
                    </button>
                </div>
            </div>

            <style>{`
                .video-call-container {
                    height: 100vh;
                    background: #0F172A;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: var(--font);
                }
                .video-header {
                    padding: 1rem 0;
                    background: rgba(15, 23, 42, 0.8);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    z-index: 10;
                }
                .video-main {
                    flex: 1;
                    position: relative;
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .video-grid {
                    width: 100%;
                    height: 100%;
                    max-width: 1200px;
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    position: relative;
                }
                .remote-video-wrap {
                    width: 100%;
                    height: 100%;
                    background: #1E293B;
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                }
                .remote-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .remote-placeholder {
                    text-align: center;
                    color: rgba(255,255,255,0.4);
                }
                .local-video-wrap {
                    position: absolute;
                    bottom: 24px;
                    right: 24px;
                    width: 240px;
                    height: 160px;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid rgba(255,255,255,0.2);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    z-index: 5;
                    transition: all 0.3s;
                }
                .local-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .local-label {
                    position: absolute;
                    bottom: 8px;
                    left: 8px;
                    background: rgba(0,0,0,0.5);
                    color: #fff;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }
                .video-footer {
                    padding: 1.5rem;
                    background: rgba(15, 23, 42, 0.9);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    z-index: 10;
                }
                .controls-set {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                }
                .control-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: #334155;
                    border: none;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .control-btn:hover {
                    background: #475569;
                    transform: scale(1.1);
                }
                .control-btn.active {
                    background: var(--emergency);
                }
                .end-call-btn {
                    background: var(--emergency);
                }
                .end-call-btn:hover {
                    background: #B91C1C;
                }
                .status-live {
                    color: #10B981;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                .status-waiting {
                    color: #F59E0B;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .video-loading {
                    height: 100vh;
                    background: #0F172A;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    )
}

function LoadingSpinner() {
    return (
        <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
            <p style={{ color: '#fff' }}>Connecting to secure video session...</p>
        </div>
    )
}
