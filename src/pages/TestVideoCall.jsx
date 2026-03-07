import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Peer from 'peerjs'
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TestVideoCall() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [myPeerId, setMyPeerId] = useState('')
    const [remotePeerId, setRemotePeerId] = useState('')
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [callActive, setCallActive] = useState(false)

    const peerInstance = useRef(null)
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const localStreamRef = useRef(null)
    const channelRef = useRef(null)

    useEffect(() => {
        const initTestSession = async () => {
            try {
                // Initialize PeerJS
                const peer = new Peer()
                peerInstance.current = peer

                peer.on('open', (id) => {
                    setMyPeerId(id)
                    // Once we have a Peer ID, connect to Supabase Broadcast to find the other tester
                    joinBroadcastChannel(id)
                })

                peer.on('call', (call) => {
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                        if (localVideoRef.current) localVideoRef.current.srcObject = stream
                        localStreamRef.current = stream
                        call.answer(stream)
                        call.on('stream', (remoteStream) => {
                            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
                            setCallActive(true)
                        })
                    })
                })

                setLoading(false)

                return () => {
                    if (channelRef.current) supabase.removeChannel(channelRef.current)
                    cleanup()
                }

            } catch (err) {
                console.error(err)
                toast.error("Failed to initialize video session.")
                navigate('/dashboard')
            }
        }

        initTestSession()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const joinBroadcastChannel = (id) => {
        // Create a universal test channel
        const channel = supabase.channel('test-video-room', {
            config: {
                broadcast: { self: false },
            },
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'peer-id-share' }, (payload) => {
                const incomingPeerId = payload.payload.peerId;
                if (incomingPeerId && incomingPeerId !== remotePeerId) {
                    setRemotePeerId(incomingPeerId);
                    if (!callActive) {
                        startCall(incomingPeerId);
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Periodically broadcast our presence so anyone joining gets it
                    setInterval(() => {
                        channel.send({
                            type: 'broadcast',
                            event: 'peer-id-share',
                            payload: { peerId: id },
                        });
                    }, 3000);
                }
            });
    }

    const startCall = (remoteId) => {
        if (!remoteId || callActive) return

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream
            localStreamRef.current = stream

            const call = peerInstance.current.call(remoteId, stream)

            call.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
                setCallActive(true)
            })
        }).catch(err => {
            console.error("Failed to get local stream", err);
            toast.error("Camera permissions denied");
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

    const endCall = () => {
        cleanupAndExit()
    }

    const cleanupAndExit = () => {
        cleanup()
        toast.success("Test Call Ended")
        navigate('/dashboard')
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#EF4444', padding: '0.5rem', borderRadius: '8px' }}>
                                <Activity size={20} color="#FFF" />
                            </div>
                            <div>
                                <h2 style={{ color: '#fff', margin: 0 }}>Video Call Tester Mode</h2>
                                <p style={{ color: '#F1F5F9', margin: 0, fontSize: '0.85rem' }}>Open this page in a second tab/device to simulate a remote caller.</p>
                            </div>
                        </div>
                        <div className="call-status">
                            {callActive ? (
                                <span className="status-live" style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '5px 10px', borderRadius: '20px', color: '#10B981', border: '1px solid #10B981' }}>● SECURE P2P LIVE</span>
                            ) : (
                                <span className="status-waiting" style={{ color: '#F59E0B' }}>WAITING FOR SOMEONE TO JOIN...</span>
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
                                <p>Waiting for another user to open the Test Page...</p>
                            </div>
                        )}
                    </div>
                    <div className="local-video-wrap">
                        <video ref={localVideoRef} autoPlay muted playsInline className="local-video" style={{ transform: 'scaleX(-1)' }} />
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
            <div className="loading-spinner" style={{ marginBottom: '1rem', borderColor: '#334155', borderTopColor: '#3B82F6' }}></div>
            <p style={{ color: '#fff' }}>Connecting to secure video session...</p>
        </div>
    )
}
