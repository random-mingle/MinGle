'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdOverlay from './AdOverlay';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://mingle-kfcz.onrender.com';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

/* ── Status Badge ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    idle:         { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Ready' },
    waiting:      { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', label: 'Connecting...' },
    connected:    { color: '#059669', bg: '#ecfdf5', dot: '#10b981', label: 'Connected' },
    disconnected: { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444', label: 'Disconnected' },
  };
  const c = map[status] || map.idle;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0,
        boxShadow: status === 'connected' ? `0 0 0 2px ${c.dot}44` : 'none',
      }} />
      {c.label}
    </div>
  );
}

/* ── Inline Ad Banner (laptop only) ──────────────────────────── */
function AdBannerInline({ onDismiss }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'linear-gradient(135deg,#faf5ff,#f5f0ff)',
      border: '1px solid #e9d5ff', borderRadius: 10,
      padding: '8px 12px', position: 'relative',
      // FIX: prevent any child from overflowing the banner box
      overflow: 'hidden',
      minWidth: 0,
    }}>
      <div style={{ position: 'absolute', top: 4, left: 7, background: '#e9d5ff', borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.05em' }}>AD</div>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌟</div>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#1e1b4b', margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Unlock Premium Features</p>
        <p style={{ fontSize: 11, color: '#6b7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>No ads · Priority matching · More</p>
      </div>
      <a href="#" onClick={e => e.preventDefault()} style={{ padding: '5px 12px', borderRadius: 7, textDecoration: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
        Open
      </a>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '0 0 0 4px', flexShrink: 0 }}>×</button>
    </div>
  );
}

/* ── Mobile Ad Popup ──────────────────────────────────────────── */
function AdPopupMobile({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(30,27,75,0.6)', backdropFilter: 'blur(6px)',
      padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ height: 150, background: 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 5, padding: '1px 6px', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 800 }}>AD</div>
          <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ fontSize: 36 }}>🌟</div>
          <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0 }}>Unlock Premium</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0 }}>No ads · Priority matching</p>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ display: 'block', padding: '10px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: 800, fontSize: 14, textAlign: 'center', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            Open →
          </a>
          <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 8, padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, fontFamily: 'inherit' }}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function ChatRoom() {
  const params    = useSearchParams();
  const router    = useRouter();
  const mode      = params.get('mode') || 'video';
  const interests = params.get('interests') || '';

  /* refs */
  const socketRef      = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef     = useRef(null);
  const partnerIdRef   = useRef(null);
  const nextCount      = useRef(0);
  const hideTimer      = useRef(null);
  // FIX: ref for input so we can refocus after send (keyboard stays open)
  const inputRef       = useRef(null);

  /* state */
  const [status,        setStatus]       = useState('idle');
  const [messages,      setMessages]     = useState([]);
  const [inputMsg,      setInputMsg]     = useState('');
  const [onlineCount,   setOnlineCount]  = useState(0);
  const [cameras,       setCameras]      = useState([]);
  const [microphones,   setMics]         = useState([]);
  const [selCam,        setSelCam]       = useState('');
  const [selMic,        setSelMic]       = useState('');
  const [showDevices,   setShowDevices]  = useState(false);
  const [showOverlayAd, setShowOverlayAd]= useState(false);
  const [showMobileAd,  setShowMobileAd] = useState(false);
  const [showAdBanner,  setShowAdBanner] = useState(true);
  const [isMuted,       setIsMuted]      = useState(false);
  const [isCamOff,      setIsCamOff]     = useState(false);
  const [facingMode,    setFacingMode]   = useState('user');
  const [remoteReady,   setRemoteReady]  = useState(false);
  const [isMobile,      setIsMobile]     = useState(false);
  // FIX: start hidden — shows on tap for 2s then hides again
  const [showCtrl,      setShowCtrl]     = useState(false);
  const [inputBottom,   setInputBottom]  = useState(0);
  // FIX: capture initial height once so keyboard never shifts the video layout
  const [appHeight,     setAppHeight]    = useState('100%');

  /* ── mobile detect + viewport listener ─────────────────────── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);

    // FIX: capture the true screen height BEFORE keyboard ever opens.
    // We store it once and use it as the root container height so the
    // layout never shrinks/scrolls when the soft keyboard appears.
    setAppHeight(window.innerHeight + 'px');

    // Show mobile ad after 1.5s
    const adTimer = setTimeout(() => {
      if (window.innerWidth < 640) setShowMobileAd(true);
    }, 3000);

    // VisualViewport: tracks keyboard height so the input bar slides
    // up above the keyboard while the rest of the layout stays frozen.
    const vv = window.visualViewport;
    const onVVResize = () => {
      if (vv) {
        const offset = window.innerHeight - vv.height - vv.offsetTop;
        setInputBottom(Math.max(0, offset));
      }
    };
    vv?.addEventListener('resize', onVVResize);
    vv?.addEventListener('scroll', onVVResize);

    return () => {
      window.removeEventListener('resize', check);
      clearTimeout(adTimer);
      vv?.removeEventListener('resize', onVVResize);
      vv?.removeEventListener('scroll', onVVResize);
    };
  }, []);

  /* ── settings/flip: show on tap, auto-hide after 2s ────────── */
  const showControlsBriefly = () => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 2000);
  };

  /* ── socket ─────────────────────────────────────────────────── */
  useEffect(() => {
    let socket;
    (async () => {
      const { io } = await import('socket.io-client');
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
      socketRef.current = socket;

      socket.on('online-count', setOnlineCount);
      socket.on('waiting',  () => { setStatus('waiting'); sys('Looking for a stranger…'); });
      socket.on('match',    async ({ role, partnerId }) => {
        partnerIdRef.current = partnerId;
        setStatus('connected'); setRemoteReady(false);
        sys('🎉 Connected! Say hello.');
        if (mode === 'video') await startWebRTC(role === 'initiator', partnerId);
      });
      socket.on('offer', async ({ offer, from }) => {
        if (!pcRef.current) await createPC(from);
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(ans);
        socket.emit('answer', { answer: ans, to: from });
      });
      socket.on('answer', async ({ answer }) => {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      });
      socket.on('ice-candidate', async ({ candidate }) => {
        try { if (candidate) await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });
      socket.on('chat-message', ({ message, timestamp }) => addMsg({ text: message, from: 'stranger', ts: timestamp }));
      socket.on('partner-left', () => {
        setStatus('disconnected'); setRemoteReady(false);
        sys('👋 Stranger left. Click Start to find someone new.');
        closePeer();
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });
    })();
    return () => { socket?.emit('leave'); socket?.disconnect(); closeAll(); };
    // eslint-disable-next-line
  }, []);

  useEffect(() => { if (mode === 'video') getLocalMedia(); enumDevices(); }, []); // eslint-disable-line
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'auto' }); }, [messages]);

  /* ── devices ─────────────────────────────────────────────────── */
  const enumDevices = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d => d.kind === 'videoinput');
      const mics = devs.filter(d => d.kind === 'audioinput');
      setCameras(cams); setMics(mics);
      if (cams[0]) setSelCam(cams[0].deviceId);
      if (mics[0]) setSelMic(mics[0].deviceId);
    } catch {}
  };

  /* ── media ───────────────────────────────────────────────────── */
  const getLocalMedia = async (camId, micId) => {
    try {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : { facingMode },
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; localVideoRef.current.play().catch(() => {}); }
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach(track => {
          const s = senders.find(x => x.track?.kind === track.kind);
          s ? s.replaceTrack(track) : pcRef.current.addTrack(track, stream);
        });
      }
    } catch (e) { console.error(e); }
  };

  /* ── webrtc ──────────────────────────────────────────────────── */
  const createPC = async (partnerId) => {
    closePeer();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.onicecandidate = ({ candidate }) => candidate && socketRef.current?.emit('ice-candidate', { candidate, to: partnerId });
    pc.ontrack = e => {
      setRemoteReady(true);
      if (remoteVideoRef.current && e.streams[0]) { remoteVideoRef.current.srcObject = e.streams[0]; remoteVideoRef.current.play().catch(() => {}); }
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) { setStatus('disconnected'); setRemoteReady(false); }
    };
    return pc;
  };
  const startWebRTC = async (isInit, pid) => {
    await createPC(pid);
    if (isInit) { const o = await pcRef.current.createOffer(); await pcRef.current.setLocalDescription(o); socketRef.current?.emit('offer', { offer: o, to: pid }); }
  };
  const closePeer = () => { try { pcRef.current?.close(); } catch {} pcRef.current = null; };
  const closeAll  = () => { closePeer(); localStreamRef.current?.getTracks().forEach(t => t.stop()); localStreamRef.current = null; };

  /* ── actions ─────────────────────────────────────────────────── */
  const addMsg = msg => setMessages(p => [...p, msg]);
  const sys    = text => addMsg({ text, from: 'system', ts: Date.now() });

  const handleStart = () => {
    setMessages([]); setStatus('waiting'); setRemoteReady(false);
    if (mode === 'video') getLocalMedia(selCam, selMic);
    socketRef.current?.emit('find-match', { mode, interests });
  };
  const handleNext = () => {
    nextCount.current += 1;
    if (nextCount.current % 4 === 0) setShowOverlayAd(true);
    socketRef.current?.emit('leave'); closePeer();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteReady(false); setMessages([]);
    setTimeout(() => socketRef.current?.emit('find-match', { mode, interests }), 300);
  };
  const handleStop = () => {
    socketRef.current?.emit('leave'); closePeer();
    setStatus('idle'); setRemoteReady(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    sys('Stopped. Click Start to find someone new.');
  };

  // FIX: after clearing the input, immediately refocus it so the keyboard
  // stays open between messages instead of closing and reopening each time.
  const handleSend = () => {
    if (!inputMsg.trim() || status !== 'connected') return;
    socketRef.current?.emit('chat-message', { message: inputMsg.trim() });
    addMsg({ text: inputMsg.trim(), from: 'me', ts: Date.now() });
    setInputMsg('');
    // Refocus so keyboard never dismisses between messages
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const toggleMute = () => { const a = localStreamRef.current?.getAudioTracks()[0]; if (a) { a.enabled = !a.enabled; setIsMuted(!a.enabled); } };
  const toggleCam  = () => { const v = localStreamRef.current?.getVideoTracks()[0]; if (v) { v.enabled = !v.enabled; setIsCamOff(!v.enabled); } };
  const flipCamera = async () => { const nf = facingMode === 'user' ? 'environment' : 'user'; setFacingMode(nf); await getLocalMedia(null, selMic); };
  const changeCam  = async id => { setSelCam(id);  await getLocalMedia(id, selMic); };
  const changeMic  = async id => { setSelMic(id);  await getLocalMedia(selCam, id); };

  /* ─── helpers ──────────────────────────────────────────────────*/
  const INPUT_H    = 56;
  const HEADER_H   = isMobile ? 46 : 52;
  const CONTROLS_H = isMobile ? 42 : 48;

  /* ══════════════════ RENDER ══════════════════════════════════ */
  return (
    <>
      {/* Global reset — kill ALL scroll, fix layout for keyboard */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bpop { 0%{transform:scale(0.82);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 3px; }
      `}</style>

      {/* Mobile ad popup */}
      {showMobileAd && isMobile && <AdPopupMobile onClose={() => setShowMobileAd(false)} />}

      {/*
       * ROOT WRAPPER
       * FIX: Instead of position:fixed+inset:0 (which resizes when Android keyboard opens),
       * we use position:fixed + captured appHeight so the layout is truly locked.
       * The input bar slides up independently using visualViewport offset.
       */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: appHeight,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d1a',
        fontFamily: 'Nunito, sans-serif',
        overflow: 'hidden',
      }}>

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <header style={{
          height: HEADER_H,
          flexShrink: 0,
          background: 'white',
          borderBottom: '1px solid #ede9fe',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
          boxShadow: '0 1px 10px rgba(124,58,237,0.08)',
          zIndex: 10,
        }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Image src="/logo.png" alt="Mingle" width={isMobile ? 70 : 88} height={28} style={{ objectFit: 'contain' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={status} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f5f0ff', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#374151' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ color: '#7c3aed' }}>{onlineCount > 0 ? `${onlineCount.toLocaleString()}+` : '–'}</span>
              <span> online</span>
            </div>
          </div>
        </header>

        {/* ══ AD BANNER — laptop only, contained inside box ═══════
         *  FIX: overflow:hidden + minWidth:0 so it never spreads outside
         */}
        {!isMobile && showAdBanner && (
          <div style={{
            flexShrink: 0,
            padding: '6px 12px',
            background: 'white',
            borderBottom: '1px solid #f3e8ff',
            overflow: 'hidden',  // ← keeps banner strictly inside
            minWidth: 0,
          }}>
            <AdBannerInline onDismiss={() => setShowAdBanner(false)} />
          </div>
        )}

        {/* ══ VIDEO SECTION — flex:3 so videos dominate the screen ═
         *  FIX: flex:3 (was flex:1) gives videos ~75% of remaining
         *  height vs the chat section's flex:1 (~25%).
         *  Tap anywhere on video area to reveal Settings/Flip for 2s.
         */}
        {mode === 'video' && (
          <div
           onTouchStart={showControlsBriefly}
            style={{
              flex: 3,           // ← FIX: was 1, now videos take more space
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 4 : 8,
              padding: isMobile ? '6px 6px 0' : '10px 10px 0',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {/* ── Stranger ── */}
            <div style={{
              flex: 1, position: 'relative',
              borderRadius: isMobile ? 10 : 14,
              overflow: 'hidden', background: '#1a1535',
              minHeight: 0,aspectRatio: '3 / 4',width: '100%',  
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <video ref={remoteVideoRef} autoPlay playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {!remoteReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 10 }}>
                  {status === 'waiting' ? (
                    <>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.12)', borderTop: '3px solid #a78bfa', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <span style={{ fontSize: 12, opacity: 0.3, fontWeight: 700 }}>Stranger</span>
                    </>
                  )}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 7, left: 9, background: 'rgba(0,0,0,0.4)', borderRadius: 5, padding: '2px 7px', color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700 }}>Stranger</div>
              <div style={{ position: 'absolute', bottom: 7, right: 9, color: 'rgba(255,255,255,0.18)', fontSize: 10, fontWeight: 800, pointerEvents: 'none' }}>mingle.com</div>
            </div>

            {/* ── My video ── */}
            <div style={{
              flex: 1, position: 'relative',
              borderRadius: isMobile ? 10 : 14,
              overflow: 'hidden', background: '#0f1724',
              minHeight: 0, aspectRatio: '3 / 4', width: '100%',  
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <video ref={localVideoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
              {isCamOff && (
                <div style={{ position: 'absolute', inset: 0, background: '#0f1724', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>Camera Off</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 7, left: 9, background: 'rgba(0,0,0,0.4)', borderRadius: 5, padding: '2px 7px', color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700 }}>You</div>

              {/* ── Settings / Flip — hidden by default, appear on tap for 2s
               *  FIX: showCtrl starts false, only shows after user taps video
               */}
              <div style={{
                position: 'absolute', top: 7, right: 7,
                display: 'flex', flexDirection: 'column', gap: 4,
                opacity: showCtrl ? 1 : 0,
                pointerEvents: showCtrl ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}>
                <button
                  onClick={e => { e.stopPropagation(); setShowDevices(d => !d); showControlsBriefly(); }}
                  style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 7, padding: '5px 10px', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ⚙️ <span>Settings</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); flipCamera(); showControlsBriefly(); }}
                  style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 7, padding: '5px 10px', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  🔄 <span>Flip</span>
                </button>
              </div>

              {/* ── Device dropdown ── */}
              {showDevices && (
                <div onClick={e => e.stopPropagation()} style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
                  display: 'flex', flexDirection: 'column', gap: 7,
                  padding: 12, borderRadius: 'inherit', zIndex: 20,
                }}>
                  <p style={{ margin: 0, color: '#a78bfa', fontSize: 11, fontWeight: 800 }}>📷 Camera</p>
                  <select value={selCam} onChange={e => changeCam(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #374151', fontSize: 11, background: '#1f2937', color: 'white', outline: 'none', cursor: 'pointer' }}>
                    {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0,8)}`}</option>)}
                  </select>
                  <p style={{ margin: 0, color: '#a78bfa', fontSize: 11, fontWeight: 800 }}>🎙️ Microphone</p>
                  <select value={selMic} onChange={e => changeMic(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #374151', fontSize: 11, background: '#1f2937', color: 'white', outline: 'none', cursor: 'pointer' }}>
                    {microphones.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0,8)}`}</option>)}
                  </select>
                  <button onClick={() => { setShowDevices(false); showControlsBriefly(); }} style={{ marginTop: 'auto', padding: '6px', borderRadius: 7, border: 'none', background: '#7c3aed', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CONTROLS BAR ════════════════════════════════════════ */}
        <div style={{
          height: CONTROLS_H,
          flexShrink: 0,
          background: 'white',
          borderTop: '1px solid #f0ebff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', gap: 6,
        }}>
          {/* media toggles */}
          {mode === 'video' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={toggleMute} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', background: isMuted ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#f3f4f6', color: isMuted ? 'white' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMuted
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
              </button>
              <button onClick={toggleCam} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', background: isCamOff ? '#fee2e2' : '#f3f4f6', color: isCamOff ? '#dc2626' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isCamOff
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>}
              </button>
            </div>
          )}

          {/* action buttons */}
          <div style={{ display: 'flex', gap: isMobile ? 5 : 7, marginLeft: 'auto' }}>
            {(['Start','Next ⏩','Stop ⏹']).map((label, i) => {
              const colors = [
                'linear-gradient(135deg,#7c3aed,#6d28d9)',
                'linear-gradient(135deg,#f59e0b,#d97706)',
                'linear-gradient(135deg,#ef4444,#dc2626)',
              ];
              const shadows = [
                '0 2px 10px rgba(124,58,237,0.4)',
                '0 2px 10px rgba(245,158,11,0.35)',
                '0 2px 10px rgba(239,68,68,0.35)',
              ];
              const handlers = [handleStart, handleNext, handleStop];
              const disabled = (i === 0 && status === 'waiting') || (i > 0 && status === 'idle');
              return (
                <button key={label} onClick={handlers[i]} disabled={disabled} style={{
                  padding: isMobile ? '6px 10px' : '7px 16px',
                  borderRadius: 9, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                  background: disabled ? '#e5e7eb' : colors[i],
                  color: disabled ? '#9ca3af' : 'white',
                  fontWeight: 800, fontSize: isMobile ? 11 : 12,
                  fontFamily: 'Nunito, sans-serif',
                  boxShadow: disabled ? 'none' : shadows[i],
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ CHAT MESSAGES — scrollable, fills remaining space (flex:1) ═
         *  FIX: This is flex:1 so it gets ~25% of remaining height while
         *  video gets flex:3 (~75%). No empty gap — content fills bottom.
         */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          background: '#f9f7ff',
          minHeight: 0,
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#c4b5fd', fontSize: 12, marginTop: 12, fontWeight: 600 }}>
              💬 Messages appear here
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.from === 'me' ? 'flex-end' : msg.from === 'system' ? 'center' : 'flex-start',
              animation: 'bpop 0.2s ease both',
            }}>
              {msg.from === 'system' ? (
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, background: '#f3f4f6', padding: '3px 10px', borderRadius: 20 }}>{msg.text}</span>
              ) : (
                <div style={{
                  maxWidth: '76%', padding: '7px 11px', borderRadius: 13, fontSize: 13, fontWeight: 600, wordBreak: 'break-word',
                  background: msg.from === 'me' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'white',
                  color: msg.from === 'me' ? 'white' : '#1f2937',
                  borderBottomRightRadius: msg.from === 'me' ? 3 : 13,
                  borderBottomLeftRadius: msg.from === 'stranger' ? 3 : 13,
                  boxShadow: msg.from === 'me' ? '0 2px 8px rgba(124,58,237,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
                }}>{msg.text}</div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* ══ INPUT BAR ════════════════════════════════════════════
         *  FIX (mobile): position:fixed + bottom:inputBottom keeps the
         *  input bar floating just above the keyboard. Videos stay frozen
         *  because the root is locked to the captured appHeight.
         *  FIX (desktop): stays in normal flex flow, no position change.
         */}
        <div style={{
          ...(isMobile ? {
            position: 'fixed',
            left: 0, right: 0,
            bottom: inputBottom,
          } : {
            flexShrink: 0,
          }),
          height: INPUT_H,
          background: 'white',
          borderTop: '1px solid #ede9fe',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 -2px 10px rgba(124,58,237,0.06)',
          zIndex: 30,
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={status === 'connected' ? 'Type a message...' : 'Click Start to chat...'}
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={status !== 'connected'}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 22,
              border: '1.5px solid #ede9fe',
              fontSize: 14,
              fontFamily: 'Nunito, sans-serif',
              outline: 'none',
              color: '#374151',
              background: status !== 'connected' ? '#fafafa' : 'white',
              opacity: status !== 'connected' ? 0.65 : 1,
              minWidth: 0,
            }}
            onFocus={e => (e.target.style.borderColor = '#a78bfa')}
            onBlur={e => (e.target.style.borderColor = '#ede9fe')}
          />
          {/* Start */}
          <button onClick={handleStart} style={{
            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white',
            fontWeight: 800, fontSize: 13, fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 2px 10px rgba(124,58,237,0.35)',
          }}>
            Start
          </button>
          {/* Send */}
          <button onClick={handleSend} disabled={status !== 'connected' || !inputMsg.trim()} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: status !== 'connected' || !inputMsg.trim() ? 0.4 : 1,
            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        {/* FIX: Spacer accounts for input bar height + keyboard offset
         *  so chat content is never hidden behind the fixed input bar */}
        {isMobile && <div style={{ height: INPUT_H + inputBottom, flexShrink: 0 }} />}

      </div>{/* end ROOT */}

      {showOverlayAd && <AdOverlay onClose={() => setShowOverlayAd(false)} />}
    </>
  );
}
