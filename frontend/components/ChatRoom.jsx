'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

/* ── WebRTC ICE config (free Google STUN + public TURN fallback) ───── */
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },

    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

/* ── Icons (inline SVGs to keep zero-deps) ──────────────────────────── */
const Icons = {
  Next: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  ),
  MicOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  VideoOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Video: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Flag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

/* ── Waiting overlay ─────────────────────────────────────────────────── */
function WaitingOverlay({ onCancel }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* Pulsing crown */}
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(212,175,55,0.3)',
            animation: 'spin 2s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            border: '2px solid rgba(212,175,55,0.15)',
            animation: 'spin 3s linear infinite reverse',
          }}
        />
        
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#D4AF37', fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600 }}>
          Finding your match…
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, fontFamily: '"DM Sans", sans-serif' }}>
          Connecting you with someone new
        </p>
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#D4AF37',
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        style={{
          marginTop: 8,
          padding: '10px 28px',
          borderRadius: 50,
          border: '1px solid rgba(212,175,55,0.3)',
          background: 'transparent',
          color: 'rgba(212,175,55,0.7)',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: '"DM Sans", sans-serif',
          letterSpacing: '0.05em',
          transition: 'all 0.2s',
        }}
      >
        Cancel
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

/* ── Report modal ─────────────────────────────────────────────────────── */
function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const reasons = ['Inappropriate content', 'Harassment', 'Nudity / Sexual content', 'Spam / Bot', 'Underage user', 'Other'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 20,
          padding: '28px 24px',
          maxWidth: 360,
          width: '100%',
          boxShadow: '0 0 40px rgba(212,175,55,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: '"Playfair Display", serif', color: '#D4AF37', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          Report User
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20, fontFamily: '"DM Sans", sans-serif' }}>
          Help keep Mingle safe. Select a reason:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: reason === r ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                background: reason === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                color: reason === r ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: '"DM Sans", sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => reason && onSubmit(reason)}
            disabled={!reason}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: reason ? 'linear-gradient(135deg, #D4AF37, #B8860B)' : 'rgba(255,255,255,0.1)',
              color: reason ? '#000' : 'rgba(255,255,255,0.3)',
              cursor: reason ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s',
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ChatRoom ────────────────────────────────────────────────────── */
export default function ChatRoom() {
  const [isTyping, setIsTyping] = useState(false);

  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState('idle'); // idle | waiting | connected
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState('');


  // ── Refs ───────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const partnerIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const statusRef = useRef('idle');
  const inputRef = useRef(null);
  // FIX: ref to clear typing timeout properly
  const typingTimeoutRef = useRef(null);

  // Keep statusRef in sync
  useEffect(() => { statusRef.current = status; }, [status]);

  // ── Mobile detection ───────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Scroll to bottom on new messages ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-attach local stream
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, []); // 🔥 only once run

  // ── Initialise media + socket on mount ────────────────────────────
  useEffect(() => {
    initMedia();
    initSocket();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Media ──────────────────────────────────────────────────────── */
  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      setMediaReady(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

    } catch (err) {
      console.error('Media error:', err);
      setMediaError(
        err.name === 'NotAllowedError'
          ? 'Camera/Microphone permission denied. Please allow access and refresh.'
          : 'Could not access camera/microphone. Please check your device.',
      );
    }
  };

  /* ── Socket ─────────────────────────────────────────────────────── */
  const initSocket = () => {
    const BACKEND = "https://mingle-kfcz.onrender.com";
    const socket = io(BACKEND, {
      transports: ['websocket'],

      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[Socket] connected:', socket.id));
    socket.on('disconnect', () => console.log('[Socket] disconnected'));

    socket.on('online_count', (n) => setOnlineCount(n));

    socket.on('waiting', () => setStatus('waiting'));

    socket.on('matched', async ({ initiator, partnerId }) => {
      console.log('[Matched]', { initiator, partnerId });
      partnerIdRef.current = partnerId;
      setStatus('connected');
      setMessages([]);
      await createPC(initiator, partnerId);
    });

    socket.on('signal', async ({ signal, from }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          remoteDescSetRef.current = true;
          await flushCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { signal: answer, to: from });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          remoteDescSetRef.current = true;
          await flushCandidates(pc);
        } else if (signal.candidate !== undefined) {
          // ICE candidate
          if (remoteDescSetRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(signal)).catch(() => {});
          } else {
            pendingCandidatesRef.current.push(signal);
          }
        }
      } catch (err) {
        console.error('[Signal error]', err);
      }
    });

    socket.on('message', ({ text }) => {
      setMessages((prev) => [
        ...prev,
        { text, from: 'stranger', id: `${Date.now()}-${Math.random()}` },
      ]);
    });

    // FIX: missing typing listener — isTyping state was never set to true
    socket.on('typing', () => {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    });

    socket.on('partner_disconnected', () => {
      closePC();

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setStatus('waiting');

      // 🔥 NEW ADD (IMPORTANT)
      addSysMsg('Stranger disconnected... finding new one 🔄');

      socket.emit('find_match'); // auto next
    });

    socket.on('find_match_trigger', () => {
      socket.emit('find_match');
    });

    socket.on('report_received', () => {
      setShowReport(false);
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    });
  };

  const flushCandidates = async (pc) => {
    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    pendingCandidatesRef.current = [];
  };

  /* ── Peer Connection ────────────────────────────────────────────── */
  const createPC = async (initiator, partnerId) => {
    closePC();
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        pc.addTrack(t, localStreamRef.current);
      });
    }

    // Receive remote stream
    pc.ontrack = ({ streams }) => {
      if (streams[0] && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };

    // Send ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current && partnerId) {
        socketRef.current.emit('signal', {
          signal: candidate.toJSON(),
          to: partnerId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[PC state]', pc.connectionState);
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    if (initiator) {
      // 🔥 VIDEO QUALITY BOOST
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');

      if (sender) {
        const params = sender.getParameters();

        if (!params.encodings) {
          params.encodings = [{}];
        }

        params.encodings[0].maxBitrate = 1500000; // 1.5 Mbps

        sender.setParameters(params);
      }
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('signal', { signal: offer, to: partnerId });
    }
  };

  const closePC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    closePC();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
  }, [closePC]);

  /* ── Helpers ────────────────────────────────────────────────────── */
  const addSysMsg = (text) => {
    setMessages((prev) => [
      ...prev,
      { text, from: 'system', id: `sys-${Date.now()}-${Math.random()}` },
    ]);
  };

  /* ── Controls ───────────────────────────────────────────────────── */
  const handleStart = () => {
    // FIX: Removed the early-return guard that silently blocked clicks on mobile.
    // Previously: if (!mediaReady && !mediaError) return
    // Problem: on Android/iPhone the camera permission dialog is async —
    // user clicks START before mediaReady=true, nothing happened with zero feedback.
    // createPC already null-checks localStreamRef so missing media is safe.
    socketRef.current?.emit('find_match');
    setMessages([]);
    setStatus('waiting');
  };

  const handleNext = () => {
    closePC();

    // video clear
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // chat clear
    setMessages([]);

    // status update
    setStatus('waiting');

    // message
    addSysMsg('🔎 Finding new stranger...');

    // find new match
    socketRef.current.emit('find_match');
  };

  const handleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted((v) => !v);
    }
  };

  const handleVideoOff = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff((v) => !v);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || status !== 'connected') return;
    if (text.length > 500) return;
    setMessages((prev) => [
      ...prev,
      { text, from: 'me', id: `me-${Date.now()}-${Math.random()}` },
    ]);
    socketRef.current?.emit('message', { text });
    setInputText('');
    inputRef.current?.focus();
  };

  const handleReport = (reason) => {
    socketRef.current?.emit('report', { reason });
    setShowReport(false);
    setReportSent(true);
    setTimeout(() => setReportSent(false), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Control buttons config ─────────────────────────────────────── */
  const controls = [
    {
      key: 'next',
      label: 'Next',
      icon: <Icons.Next />,
      onClick: status === 'idle' ? handleStart : handleNext,
      className: 'ctrl-btn',
      title: status === 'idle' ? 'Start' : 'Next stranger',
    },
    {
      key: 'mute',
      label: isMuted ? 'Unmute' : 'Mute',
      icon: isMuted ? <Icons.MicOff /> : <Icons.Mic />,
      onClick: handleMute,
      className: `ctrl-btn ${isMuted ? 'active' : ''}`,
      title: isMuted ? 'Unmute microphone' : 'Mute microphone',
    },
    {
      key: 'video',
      label: isVideoOff ? 'Vid On' : 'Vid Off',
      icon: isVideoOff ? <Icons.VideoOff /> : <Icons.Video />,
      onClick: handleVideoOff,
      className: `ctrl-btn ${isVideoOff ? 'active' : ''}`,
      title: isVideoOff ? 'Turn video on' : 'Turn video off',
    },
    {
      key: 'report',
      label: 'Report',
      icon: <Icons.Flag />,
      onClick: () => status === 'connected' && setShowReport(true),
      className: 'ctrl-btn danger',
      title: 'Report this user',
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {/* ── Noise overlay ──── */}
      <div className="noise-overlay" aria-hidden />

      {/* ── Ad Banner ──────────────────────────────────────────────── */}
      <div
        style={{
          height: 68,
          flexShrink: 0,
          background: 'rgba(10,10,10,0.92)',
          borderBottom: '1px solid rgba(212,175,55,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 8,
            transition: 'background 0.2s',
          }}
          title="Back to home"
        >
         
          <span
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 20,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFD700, #D4AF37, #B8860B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Mingle
          </span>
        </button>

        {/* Ad space */}
        <div
          style={{
            flex: 1,
            margin: '0 12px',
            height: 44,
            borderRadius: 8,
            border: '1px dashed rgba(212,175,55,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(212,175,55,0.25)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: '"DM Sans", sans-serif',
            maxWidth: 480,
          }}
        >
          Ad Space
        </div>

        {/* Online counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
            <div style={{ position: 'absolute', inset: 1, borderRadius: '50%', background: '#22c55e' }} />
          </div>
         
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>


  {/* 🔥 CENTER LOGO — only show after connected */}
  {status === 'connected' && (
    <div
      style={{
        position: 'absolute',
        top: isMobile ? '5%' : '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        pointerEvents: 'auto',
      }}
    >
      {/* Desktop logo */}
      {!isMobile && (
        <img
          src="/logo.png"
          style={{
            width: '100px',
            opacity: 0.9,
          }}
        />
      )}

      {/* Mobile split logo */}
      {isMobile && (
        <div style={{ position: 'relative', width: 120, height: 50 }}>

          {/* TOP HALF */}
          <img
            src="/logo.png"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: 'inset(0 0 50% 0)',
            }}
          />

          {/* BOTTOM HALF */}
          <img
            src="/logo.png"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: 'inset(50% 0 0 0)',
            }}
          />

        </div>
      )}
    </div>
  )}
  
        {/* ── MOBILE layout ────────────────────────────────────────── */}
        {isMobile ? (
          <div style={{
  width: '100%',
  height: '100%',        /* FIX #1: was 100dvh — caused double-height inside flex:1 parent */
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
}}>
            {/* Top half: Stranger video */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#111',
                borderBottom: '1px solid rgba(212,175,55,0.15)',
                overflow: 'hidden',
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'scaleX(-1) translateZ(0)',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden',
                  imageRendering: 'auto'
                }}
              />
             
              {/* Placeholder when no stream */}
              {status !== 'connected' && (
                <div
                  className="video-placeholder"
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <span style={{ fontSize: 48, opacity: 0.15 }}>👤</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    {status === 'waiting' ? 'Searching…' : 'Waiting for match'}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom half: Self video */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#0e0e0e',
                overflow: 'hidden',
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: "#000",
                  display: 'block',
                 transform: 'scaleX(-1) translateZ(0)',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden',
                  filter: isVideoOff ? 'brightness(0)' : 'none',
                }}
              />
            
              {isVideoOff && (
                <div className="video-placeholder" style={{ position: 'absolute', inset: 0 }}>
                  <span style={{ fontSize: 36, opacity: 0.3 }}>🎥</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Camera off</span>
                </div>
              )}
            </div>

            {/* Chat overlay — left side, over both videos */}
           <MobileChatOverlay messages={messages} />

            {/* Right-side control buttons — floating over videos */}
            <div
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 30,
              }}
            >
              {controls.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onClick}
                  className={c.className}
                  title={c.title}
                >
                  {c.icon}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── DESKTOP layout ──────────────────────────────────────── */
          <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  position: 'relative',
  overflow: 'hidden'   // 🔥 add this line
}}>

            {/* Left video: Stranger */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#111',
                borderRight: 'none',
                overflow: 'hidden',
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'scaleX(-1) translateZ(0)',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden',
                }}
              />
            
              {status !== 'connected' && (
                <div className="video-placeholder" style={{ position: 'absolute', inset: 0 }}>
                  <span style={{ fontSize: 64, opacity: 0.1 }}>👤</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    {status === 'waiting' ? 'Finding a match…' : 'Press Start to begin'}
                  </span>
                </div>
              )}

              {/* Chat overlay on stranger video */}
              <DesktopChatOverlay messages={messages} />
            </div>

            {/* Right video: You */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#0e0e0e',
                overflow: 'hidden',
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: "#000",
                  display: 'block',
                transform: 'scaleX(-1) translateZ(0)',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden',
                  filter: isVideoOff ? 'brightness(0)' : 'none',
                }}
              />
              
              {isVideoOff && (
                <div className="video-placeholder" style={{ position: 'absolute', inset: 0 }}>
                  <span style={{ fontSize: 52, opacity: 0.2 }}>🎥</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Camera off</span>
                </div>
              )}

              {/* Control buttons — right side of right video */}
              <div
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  zIndex: 30,
                }}
              >
                {controls.map((c) => (
                  <button
                    key={c.key}
                    onClick={c.onClick}
                    className={c.className}
                    title={c.title}
                  >
                    {c.icon}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Idle overlay (START screen) */}
        {status === 'idle' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10,10,10,0.88)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
               pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
           
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 28,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FFD700, #D4AF37, #B8860B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 8,
                }}
              >
                Ready to Mingle?
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                {mediaError || 'Click Start to connect with a random stranger'}
              </p>
            </div>
            {!mediaError && (
              <button
                onClick={handleStart}
                className="btn-gold"
                style={{
                  padding: '16px 52px',
                  borderRadius: 50,
                  fontSize: 16,
                  boxShadow: '0 0 30px rgba(212,175,55,0.5)',
                  letterSpacing: '0.18em',
                  // FIX: visually indicate loading state — never silently unresponsive
                  opacity: mediaReady ? 1 : 0.75,
                  cursor: 'pointer',
                }}
              >
                {mediaReady ? '✦ START ✦' : '⏳ Starting…'}
              </button>
            )}
            {mediaError && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '14px 40px',
                  borderRadius: 50,
                  border: '1px solid rgba(212,175,55,0.4)',
                  background: 'transparent',
                  color: '#D4AF37',
                  cursor: 'pointer',
                  fontSize: 14,
                  letterSpacing: '0.08em',
                }}
              >
                Retry Permissions
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Chat input bar + typing indicator (FIX: wrapped together so typing shows above input) ── */}
      <div style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  zIndex: 999,
  background: 'rgba(10,10,10,0.95)',
  /* FIX #5: iPhone home-indicator safe area — prevents input bar from
     sitting on top of system UI on notched/gesture-nav iPhones */
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  boxSizing: 'border-box',
}}>
        {isTyping && (
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic',
            padding: '4px 16px 0',
          }}>
            Stranger is typing...
          </div>
        )}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(10,10,10,0.95)',
          
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);

              if (socketRef.current && partnerIdRef.current) {
                socketRef.current.emit('typing');
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              status === 'connected'
                ? 'Type a message… '
                : 'Connect to start chatting'
            }
            disabled={status !== 'connected'}
            maxLength={500}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 50,
              fontSize: 14,
              opacity: status !== 'connected' ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={status !== 'connected' || !inputText.trim()}
            className="btn-gold"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: (status !== 'connected' || !inputText.trim()) ? 0.4 : 1,
              cursor: (status !== 'connected' || !inputText.trim()) ? 'not-allowed' : 'pointer',
            }}
            aria-label="Send message"
          >
            <Icons.Send />
          </button>
        </div>
      </div>

      {/* ── Report modal ─────────────────────────────────────────────── */}
      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} onSubmit={handleReport} />
      )}

      {/* ── Report toast ─────────────────────────────────────────────── */}
      {reportSent && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderTop: '1px solid rgba(212,175,55,0.12)',
            color: '#D4AF37',
            padding: '10px 24px',
            borderRadius: 50,
            fontSize: 13,
            zIndex: 300,
            backdropFilter: 'blur(12px)',
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          ✓ Report submitted. Thank you!
        </div>
      )}

      {/* ── CSS keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-40px) scale(1.1); }
          66% { transform: translate(-30px,30px) scale(0.95); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-50px,60px) scale(1.05); }
          66% { transform: translate(40px,-20px) scale(0.9); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}

/* ── Mobile chat overlay (floats over videos, left side) ─────────────── */
function MobileChatOverlay({ messages }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    /*
     * FIX #3 + #6: Two-div pattern:
     *   OUTER — handles absolute positioning, masking, and overflow:hidden clip.
     *           bottom:70px clears the fixed input bar (~60px) so messages
     *           never hide behind it. pointerEvents:none so the transparent
     *           area doesn't eat touch events meant for control buttons.
     *   INNER — owns the actual overflowY:auto scroll, touch momentum, and
     *           flex layout. pointerEvents:auto re-enables interaction here.
     *   SPACER — flex:'1 0 0' (flex-shrink:0 !) so it never collapses when
     *           messages overflow, keeping the push-to-bottom effect intact.
     */
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 60,
        bottom: 70,          /* FIX: leaves room above fixed input bar */
        width: '72%',
        maxWidth: 280,
        zIndex: 999,
        pointerEvents: 'none',   /* FIX: outer is transparent to touches */
        overflow: 'hidden',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
      }}
    >
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 8px 12px',
          pointerEvents: 'auto',   /* FIX: re-enable touches only on scroll area */
          WebkitOverflowScrolling: 'touch',  /* FIX: iOS momentum scrolling */
        }}
      >
        {/* Spacer: flex-shrink:0 keeps push-to-bottom working even when messages overflow */}
        <div style={{ flex: '1 0 0' }} />
        {messages.slice(-20).map((m) => (
          <MessageBubble key={m.id} msg={m} compact />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ── Desktop chat overlay (floats over stranger video) ───────────────── */
function DesktopChatOverlay({ messages }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    /*
     * FIX #4: Same two-div pattern as mobile.
     * bottom:0 is correct here — the parent panel has overflow:hidden which
     * clips the overlay at the panel boundary. paddingBottom:80px in the
     * inner scroll div creates dead-scroll space so the last message appears
     * above the fixed input bar (the panel itself extends behind it).
     */
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        top: 60,
       left: 0,
width: '35%',
maxWidth: 340,
        zIndex: 20,
        pointerEvents: 'auto',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          padding: '12px 10px 80px',   /* paddingBottom clears fixed input bar */
         
          WebkitOverflowScrolling: 'touch',  /* FIX: iOS momentum scrolling */
        }}
      >
        <div style={{ flex: '1 0 0' }} />
        {messages.slice(-20).map((m) => (
          <MessageBubble key={m.id} msg={m} compact={false} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────────────────── */
function MessageBubble({ msg, compact }) {
  const base = {
    padding: compact ? '6px 10px' : '8px 12px',
    borderRadius: 12,
    fontSize: compact ? 12 : 13,
    lineHeight: 1.4,
    maxWidth: '90%',
    wordBreak: 'break-word',
    fontFamily: '"DM Sans", sans-serif',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    animation: 'fadeSlide 0.2s ease-out',
    pointerEvents: 'auto',
  };

  if (msg.from === 'system') {
    return (
      <div style={{
        ...base,
        alignSelf: 'center',
        background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.2)',
        color: 'rgba(212,175,55,0.7)',
        fontStyle: 'italic',
        fontSize: compact ? 11 : 12,
        textAlign: 'center',
        borderRadius: 20,
      }}>
        {msg.text}
      </div>
    );
  }

  if (msg.from === 'me') {
    return (
    <div style={{
  ...base,
  alignSelf: 'flex-end',
  background: '#D4AF37',
  color: '#000',
  fontWeight: 600,
  border: '1px solid rgba(212,175,55,0.35)',
  borderRadius: '14px 14px 4px 14px',
  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
}}>
        {msg.text}
      </div>
    );
  }

  return (
    <div style={{
      ...base,
      alignSelf: 'flex-start',
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '14px 14px 14px 4px',
      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    }}>
      <span style={{ color: 'rgba(212,175,55,0.7)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 2 }}>
        STRANGER
      </span>
      {msg.text}
    </div>
  );
}
