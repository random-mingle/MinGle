'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdBanner from './AdBanner';
import AdOverlay from './AdOverlay';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://mingle-kfcz.onrender.com';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const configs = {
    idle:         { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Ready' },
    waiting:      { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', label: 'Connecting...' },
    connected:    { color: '#059669', bg: '#ecfdf5', dot: '#10b981', label: 'Connected' },
    disconnected: { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444', label: 'Disconnected' },
  };
  const cfg = configs[status] || configs.idle;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cfg.dot,
        boxShadow: status === 'connected' ? `0 0 0 3px ${cfg.dot}33` : 'none',
      }} />
      {cfg.label}
    </div>
  );
}

// ── Icon Button ────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, children, danger = false, active = false, disabled = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : danger
          ? hov ? '#fca5a5' : '#fee2e2'
          : hov ? '#ede9fe' : '#f3f4f6',
        color: active ? 'white' : danger ? '#dc2626' : '#4b5563',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
        transform: hov && !disabled ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ChatRoom() {
  const params       = useSearchParams();
  const router       = useRouter();
  const mode         = params.get('mode') || 'video';
  const interests    = params.get('interests') || '';

  // Refs
  const socketRef        = useRef(null);
  const pcRef            = useRef(null);
  const localStreamRef   = useRef(null);
  const localVideoRef    = useRef(null);
  const remoteVideoRef   = useRef(null);
  const chatEndRef       = useRef(null);
  const partnerIdRef     = useRef(null);
  const nextClickCount   = useRef(0);
  const isInitiatorRef   = useRef(false);

  // State
  const [status, setStatus]           = useState('idle');
  const [messages, setMessages]       = useState([]);
  const [inputMsg, setInputMsg]       = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [cameras, setCameras]         = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [selectedCamera, setSelectedCamera]   = useState('');
  const [selectedMic, setSelectedMic]         = useState('');
  const [showDevices, setShowDevices]         = useState(false);
  const [showOverlayAd, setShowOverlayAd]     = useState(false);
  const [isMuted, setIsMuted]                 = useState(false);
  const [isCamOff, setIsCamOff]               = useState(false);
  const [facingMode, setFacingMode]           = useState('user');
  const [remoteReady, setRemoteReady]         = useState(false);

  // ── Init socket ────────────────────────────────────────────────────────
  useEffect(() => {
    let socket;
    const initSocket = async () => {
      const { io } = await import('socket.io-client');
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => console.log('[Socket] connected:', socket.id));
      socket.on('online-count', (n) => setOnlineCount(n));

      socket.on('waiting', () => {
        setStatus('waiting');
        addSystemMsg('Looking for a stranger...');
      });

      socket.on('match', async ({ role, partnerId }) => {
        partnerIdRef.current = partnerId;
        isInitiatorRef.current = role === 'initiator';
        setStatus('connected');
        setRemoteReady(false);
        addSystemMsg('🎉 Connected to a stranger! Say hello.');
        if (mode === 'video') await startWebRTC(role === 'initiator', partnerId);
      });

      socket.on('offer', async ({ offer, from }) => {
        if (!pcRef.current) await createPC(from);
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from });
      });

      socket.on('answer', async ({ answer }) => {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        try {
          if (candidate) await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });

      socket.on('chat-message', ({ message, timestamp }) => {
        addMsg({ text: message, from: 'stranger', ts: timestamp });
      });

      socket.on('partner-left', () => {
        setStatus('disconnected');
        setRemoteReady(false);
        addSystemMsg('👋 Stranger has left. Click Start to find someone new.');
        closePeer();
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });
    };

    initSocket();
    return () => {
      socket?.emit('leave');
      socket?.disconnect();
      closeAll();
    };
    // eslint-disable-next-line
  }, []);

  // ── Get local media ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'video') getLocalMedia();
    enumerateDevices();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Enumerate devices ─────────────────────────────────────────────────
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      setMicrophones(devices.filter(d => d.kind === 'audioinput'));
      const cam = devices.find(d => d.kind === 'videoinput');
      const mic = devices.find(d => d.kind === 'audioinput');
      if (cam) setSelectedCamera(cam.deviceId);
      if (mic) setSelectedMic(mic.deviceId);
    } catch {}
  };

  // ── Local media ───────────────────────────────────────────────────────
  const getLocalMedia = async (camId, micId) => {
    try {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      const constraints = {
        video: camId ? { deviceId: { exact: camId } } : { facingMode },
        audio: micId ? { deviceId: { exact: micId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Replace tracks in existing peer connection
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track);
          else pcRef.current.addTrack(track, stream);
        });
      }
    } catch (err) {
      console.error('[Media]', err);
    }
  };

  // ── WebRTC ────────────────────────────────────────────────────────────
  const createPC = async (partnerId) => {
    closePeer();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && partnerId) {
        socketRef.current?.emit('ice-candidate', { candidate, to: partnerId });
      }
    };

    pc.ontrack = (e) => {
      setRemoteReady(true);
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) {
        setStatus('disconnected');
        setRemoteReady(false);
      }
    };

    return pc;
  };

  const startWebRTC = async (isInitiator, partnerId) => {
    await createPC(partnerId);
    if (isInitiator) {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current?.emit('offer', { offer, to: partnerId });
    }
  };

  const closePeer = () => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
  };

  const closeAll = () => {
    closePeer();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
  };

  // ── Actions ───────────────────────────────────────────────────────────
  const addMsg = (msg) => setMessages(prev => [...prev, msg]);
  const addSystemMsg = (text) => addMsg({ text, from: 'system', ts: Date.now() });

  const handleStart = () => {
    setMessages([]);
    setStatus('waiting');
    setRemoteReady(false);
    if (mode === 'video') getLocalMedia(selectedCamera, selectedMic);
    socketRef.current?.emit('find-match', { mode, interests });
  };

  const handleNext = () => {
    nextClickCount.current += 1;
    if (nextClickCount.current % 4 === 0) setShowOverlayAd(true);

    socketRef.current?.emit('leave');
    closePeer();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteReady(false);
    setMessages([]);
    setTimeout(() => {
      socketRef.current?.emit('find-match', { mode, interests });
    }, 300);
  };

  const handleStop = () => {
    socketRef.current?.emit('leave');
    closePeer();
    setStatus('idle');
    setRemoteReady(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    addSystemMsg('Chat stopped. Click Start to find someone new.');
  };

  const handleSendMsg = () => {
    if (!inputMsg.trim() || status !== 'connected') return;
    socketRef.current?.emit('chat-message', { message: inputMsg.trim() });
    addMsg({ text: inputMsg.trim(), from: 'me', ts: Date.now() });
    setInputMsg('');
  };

  const toggleMute = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) { audio.enabled = !audio.enabled; setIsMuted(!audio.enabled); }
  };

  const toggleCam = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) { video.enabled = !video.enabled; setIsCamOff(!video.enabled); }
  };

  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    await getLocalMedia(null, selectedMic);
  };

  const handleCameraChange = async (deviceId) => {
    setSelectedCamera(deviceId);
    await getLocalMedia(deviceId, selectedMic);
  };

  const handleMicChange = async (deviceId) => {
    setSelectedMic(deviceId);
    await getLocalMedia(selectedCamera, deviceId);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f0ff 0%, #fdf2f8 50%, #f0f4ff 100%)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* ── Header ── */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #ede9fe',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
      }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Image src="/logo.png" alt="Mingle" width={90} height={34} style={{ objectFit: 'contain' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={status} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f5f0ff', borderRadius: 20, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, color: '#374151',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ color: '#7c3aed' }}>{onlineCount > 0 ? `${onlineCount.toLocaleString()}+` : '–'}</span>&nbsp;online
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap',
        }}>

          {/* ── Left: Video + Chat ── */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Video panels (only for video mode) */}
            {mode === 'video' && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                marginBottom: 12,
              }}>
                {/* Stranger video */}
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
                  background: '#1e1b4b', aspectRatio: '4/3',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                }}>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!remoteReady && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      color: 'white', gap: 8,
                    }}>
                      {status === 'waiting' ? (
                        <>
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: '3px solid rgba(255,255,255,0.2)',
                            borderTop: '3px solid #a78bfa',
                            animation: 'spin 1s linear infinite',
                          }} />
                          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                          <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                            <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                          <span style={{ fontSize: 13, opacity: 0.4, fontWeight: 600 }}>Stranger</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Watermark */}
                  <div style={{
                    position: 'absolute', bottom: 10, left: 12,
                    color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800,
                    pointerEvents: 'none', letterSpacing: '-0.5px',
                  }}>
                    mingle.com
                  </div>
                </div>

                {/* Self video */}
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
                  background: '#111827', aspectRatio: '4/3',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  {isCamOff && (
                    <div style={{
                      position: 'absolute', inset: 0, background: '#111827',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>Camera Off</span>
                    </div>
                  )}
                  {/* Device controls overlay */}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => setShowDevices(!showDevices)}
                      style={{
                        background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8,
                        padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        color: '#7c3aed', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={flipCamera}
                      style={{
                        background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8,
                        padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        color: '#7c3aed', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      🔄 Flip
                    </button>
                  </div>

                  {/* Device dropdown */}
                  {showDevices && (
                    <div className="fade-in" style={{
                      position: 'absolute', top: 8, left: 8, right: 8,
                      background: 'rgba(255,255,255,0.97)', borderRadius: 10, padding: 10,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 10,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', margin: '0 0 6px' }}>Camera</p>
                      <select
                        value={selectedCamera}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        style={{
                          width: '100%', padding: '5px 8px', borderRadius: 6, marginBottom: 8,
                          border: '1.5px solid #ede9fe', fontSize: 11, fontFamily: 'inherit',
                          color: '#374151', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0,6)}`}</option>)}
                      </select>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', margin: '0 0 6px' }}>Microphone</p>
                      <select
                        value={selectedMic}
                        onChange={(e) => handleMicChange(e.target.value)}
                        style={{
                          width: '100%', padding: '5px 8px', borderRadius: 6,
                          border: '1.5px solid #ede9fe', fontSize: 11, fontFamily: 'inherit',
                          color: '#374151', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {microphones.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0,6)}`}</option>)}
                      </select>
                      <button
                        onClick={() => setShowDevices(false)}
                        style={{
                          marginTop: 6, width: '100%', padding: '4px', borderRadius: 6,
                          border: 'none', background: '#7c3aed', color: 'white',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ── Chat ── */}
            <div style={{
              background: 'white', borderRadius: 14,
              boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '12px 16px',
                display: 'flex', flexDirection: 'column', gap: 8,
                minHeight: 180, maxHeight: 260,
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 13, marginTop: 20 }}>
                    💬 Messages appear here
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="bubble-pop"
                    style={{
                      display: 'flex',
                      justifyContent: msg.from === 'me' ? 'flex-end' : msg.from === 'system' ? 'center' : 'flex-start',
                    }}
                  >
                    {msg.from === 'system' ? (
                      <span style={{
                        fontSize: 12, color: '#9ca3af', fontWeight: 600,
                        background: '#f3f4f6', padding: '4px 10px', borderRadius: 20,
                      }}>
                        {msg.text}
                      </span>
                    ) : (
                      <div style={{
                        maxWidth: '78%', padding: '8px 12px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                        background: msg.from === 'me' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#f3f4f6',
                        color: msg.from === 'me' ? 'white' : '#1f2937',
                        borderBottomRightRadius: msg.from === 'me' ? 4 : 14,
                        borderBottomLeftRadius: msg.from === 'stranger' ? 4 : 14,
                        boxShadow: msg.from === 'me' ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                        wordBreak: 'break-word',
                      }}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              </div>

  {/* Input */}
<div
  style={{
    padding: '10px 12px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  }}
>
  <input
    type="text"
    placeholder={status === 'connected' ? 'Type a message...' : 'Click Start to chat...'}
    value={inputMsg}
    onChange={(e) => setInputMsg(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
    disabled={status !== 'connected'}
    style={{
      flex: 1,
      padding: '9px 14px',
      borderRadius: 22,
      border: '1.5px solid #ede9fe',
      fontSize: 14,
      fontFamily: 'inherit',
      outline: 'none',
      color: '#374151',
      background: status !== 'connected' ? '#fafafa' : 'white',
      opacity: status !== 'connected' ? 0.7 : 1,
    }}
    onFocus={(e) => (e.target.style.borderColor = '#a78bfa')}
    onBlur={(e) => (e.target.style.borderColor = '#ede9fe')}
  />

  {/* START BUTTON */}
  <button
    onClick={handleStart}
    style={{
      padding: '8px 16px',
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
      color: 'white',
      fontWeight: 800,
      fontSize: 13,
    }}
  >
    Start
  </button>

  {/* SEND BUTTON */}
  <button
    onClick={handleSendMsg}
    disabled={status !== 'connected' || !inputMsg.trim()}
    style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: status !== 'connected' || !inputMsg.trim() ? 0.5 : 1,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </button>
</div>

            {/* ── Ad Banner ── */}
            <AdBanner />
          </div>
        </div>
      </div>

      {/* ── Ad Overlay ── */}
      {showOverlayAd && <AdOverlay onClose={() => setShowOverlayAd(false)} />}
    </div>
  );
}
