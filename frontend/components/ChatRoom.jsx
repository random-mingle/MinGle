'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

const BACKEND = 'https://mingle-kfcz.onrender.com';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

/* ══════════════════════════════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════════════════════════════ */
const Ic = {
  Next:     ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>,
  MicOff:   ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Mic:      ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  VideoOff: ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Video:    ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Flag:     ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Send:     ({ s=17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Chat:     ({ s=19 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Close:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

/* ══════════════════════════════════════════════════════════════════════
   GLOBAL STYLES
   ══════════════════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @keyframes spin      { to { transform:rotate(360deg); } }
    @keyframes ping      { 75%,100% { transform:scale(2.2); opacity:0; } }
    @keyframes waitPulse { 0%,100% { opacity:.3; transform:scale(.75); } 50% { opacity:1; transform:scale(1.2); } }
    @keyframes msgIn     { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes msgInMe   { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:translateX(0); } }
    @keyframes modalIn   { from { opacity:0; transform:scale(.95) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes toastIn   { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @keyframes shimmer   { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    @keyframes float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
    @keyframes adPulse   { 0%,100% { opacity:.5; } 50% { opacity:.9; } }
    @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
    @keyframes orb1      { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(40px,-28px) scale(1.08); } }
    @keyframes orb2      { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-28px,36px) scale(.92); } }

    .msg-in    { animation:msgIn   .2s ease-out both; }
    .msg-in-me { animation:msgInMe .2s ease-out both; }

    /* Control button base */
    .cb { transition:background .18s, border-color .18s, transform .13s, box-shadow .18s; }
    .cb:hover  { background:rgba(212,175,55,.16) !important; border-color:rgba(212,175,55,.55) !important; box-shadow:0 0 18px rgba(212,175,55,.28) !important; transform:scale(1.07) !important; }
    .cb:active { transform:scale(.94) !important; }
    .cb.on     { background:rgba(212,175,55,.2) !important; border-color:rgba(212,175,55,.65) !important; color:#FFD700 !important; }
    .cb.danger:hover { background:rgba(220,50,50,.18) !important; border-color:rgba(220,50,50,.5) !important; box-shadow:0 0 18px rgba(220,50,50,.28) !important; color:#ff7070 !important; }

    .next-glow { transition:transform .22s, box-shadow .22s; }
    .next-glow:hover  { transform:translateY(-2px) scale(1.05) !important; box-shadow:0 0 40px rgba(212,175,55,.7), 0 0 70px rgba(212,175,55,.22) !important; }
    .next-glow:active { transform:scale(.96) !important; }

    /* Chat input focus ring */
    .ci:focus { border-color:rgba(212,175,55,.7) !important; box-shadow:0 0 0 3px rgba(212,175,55,.1) !important; }

    /* Report reason hover */
    .rr:hover { background:rgba(212,175,55,.09) !important; border-color:rgba(212,175,55,.3) !important; color:rgba(255,255,255,.85) !important; }

    /* Remote video smooth fade */
    .remote-vid { transition:opacity .42s ease; }

    video { display:block; }
    *::-webkit-scrollbar { width:3px; }
    *::-webkit-scrollbar-track { background:transparent; }
    *::-webkit-scrollbar-thumb { background:rgba(212,175,55,.3); border-radius:3px; }
    *::-webkit-scrollbar-thumb:hover { background:rgba(212,175,55,.55); }
  `}</style>
);

/* ══════════════════════════════════════════════════════════════════════
   REPORT MODAL
   ══════════════════════════════════════════════════════════════════════ */
function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const reasons = ['Inappropriate content','Harassment / Bullying','Nudity / Sexual content','Spam / Bot','Underage user','Other'];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.82)', backdropFilter:'blur(10px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'rgba(12,12,12,.99)', border:'1px solid rgba(212,175,55,.18)', borderRadius:22, padding:'26px 22px', maxWidth:370, width:'100%', boxShadow:'0 0 60px rgba(0,0,0,.7)', animation:'modalIn .22s ease-out both' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', color:'#D4AF37', fontSize:19, fontWeight:700, marginBottom:3 }}>Report User</h3>
            <p style={{ color:'rgba(255,255,255,.35)', fontSize:12 }}>Select a reason to report:</p>
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:5, cursor:'pointer', color:'rgba(255,255,255,.5)', display:'flex', transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.12)'; e.currentTarget.style.color='#fff';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='rgba(255,255,255,.5)';}}>
            <Ic.Close />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
          {reasons.map(r => (
            <button key={r} onClick={() => setReason(r)} className="rr"
              style={{ padding:'10px 13px', borderRadius:11, border: reason===r ? '1.5px solid rgba(212,175,55,.65)' : '1px solid rgba(255,255,255,.08)', background: reason===r ? 'rgba(212,175,55,.13)' : 'rgba(255,255,255,.025)', color: reason===r ? '#D4AF37' : 'rgba(255,255,255,.5)', cursor:'pointer', textAlign:'left', fontSize:13, display:'flex', alignItems:'center', gap:9, transition:'all .15s' }}>
              <div style={{ width:15, height:15, borderRadius:'50%', border: reason===r ? '2px solid #D4AF37' : '2px solid rgba(255,255,255,.2)', background: reason===r ? 'rgba(212,175,55,.25)' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                {reason===r && <div style={{ width:5, height:5, borderRadius:'50%', background:'#D4AF37' }} />}
              </div>
              {r}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:9 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'12px', borderRadius:11, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.4)', cursor:'pointer', fontSize:13, transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='rgba(255,255,255,.7)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.4)';}}>
            Cancel
          </button>
          <button onClick={() => reason && onSubmit(reason)} disabled={!reason}
            style={{ flex:1, padding:'12px', borderRadius:11, border:'none', background: reason ? 'linear-gradient(135deg,#D4AF37,#B8860B)' : 'rgba(255,255,255,.07)', color: reason ? '#000' : 'rgba(255,255,255,.25)', cursor: reason ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:13, transition:'all .2s', letterSpacing:'.04em' }}>
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
   ══════════════════════════════════════════════════════════════════════ */
function Bubble({ msg, compact }) {
  const fs = compact ? 12 : 13;
  const pd = compact ? '6px 10px' : '8px 13px';

  if (msg.from === 'system') return (
    <div className="msg-in" style={{ alignSelf:'center', background:'rgba(212,175,55,.07)', border:'1px solid rgba(212,175,55,.16)', color:'rgba(212,175,55,.75)', fontStyle:'italic', fontSize: compact ? 11 : 12, padding:'4px 13px', borderRadius:20, maxWidth:'90%', textAlign:'center', backdropFilter:'blur(4px)', lineHeight:1.5 }}>
      {msg.text}
    </div>
  );

  if (msg.from === 'me') return (
    <div className="msg-in msg-in-me" style={{ alignSelf:'flex-end', background:'linear-gradient(135deg,#D4AF37,#B8860B)', color:'#000', fontWeight:600, fontSize:fs, padding:pd, borderRadius:'15px 15px 3px 15px', maxWidth:'80%', overflowWrap:'break-word', whiteSpace:'pre-wrap', lineHeight:1.45, boxShadow:'0 2px 10px rgba(212,175,55,.22)' }}>
      {msg.text}
    </div>
  );

  return (
    <div className="msg-in" style={{ alignSelf:'flex-start', background:'rgba(255,255,255,.09)', border:'1px solid rgba(255,255,255,.1)', backdropFilter:'blur(8px)', color:'#fff', fontSize:fs, padding:pd, borderRadius:'15px 15px 15px 3px', maxWidth:'80%', overflowWrap:'break-word', whiteSpace:'pre-wrap', lineHeight:1.45 }}>
      {msg.text}
    </div>
  );
}

/* ── Typing indicator ── */
const TypingDots = () => (
  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 4px 5px', fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>
    <div style={{ display:'flex', gap:3 }}>
      {[0,1,2].map(i => <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:'rgba(212,175,55,.6)', animation:`waitPulse 1s ease-in-out ${i*.18}s infinite` }} />)}
    </div>
    Stranger is typing…
  </div>
);

/* ── Chat input row ── */
function ChatInput({ inputRef, value, onChange, onKeyDown, onSend, status }) {
  const canSend = status === 'connected' && value.trim();
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input ref={inputRef} type="text" value={value} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={status === 'connected' ? 'Type a message…' : 'Connect to chat'}
        disabled={status !== 'connected'} maxLength={500} className="ci"
        style={{ flex:1, padding:'11px 15px', borderRadius:50, background:'rgba(16,16,16,.95)', border:'1.5px solid rgba(212,175,55,.2)', color:'#fff', fontSize:13, outline:'none', opacity: status !== 'connected' ? .5 : 1, transition:'border-color .2s, box-shadow .2s' }} />
      <button onClick={onSend} disabled={!canSend}
        style={{ width:40, height:40, borderRadius:'50%', border:'none', background: canSend ? 'linear-gradient(135deg,#D4AF37,#B8860B)' : 'rgba(212,175,55,.12)', color: canSend ? '#000' : 'rgba(212,175,55,.35)', display:'flex', alignItems:'center', justifyContent:'center', cursor: canSend ? 'pointer' : 'not-allowed', flexShrink:0, transition:'all .2s', boxShadow: canSend ? '0 2px 12px rgba(212,175,55,.28)' : 'none' }}>
        <Ic.Send />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CHAT PANEL  (desktop overlay + mobile drawer)
   ══════════════════════════════════════════════════════════════════════ */
function ChatPanel({ messages, inputText, setInputText, onSend, onKeyDown, inputRef, status, isTyping, socketRef, partnerIdRef, typingEmitRef, keyboardHeight, isMobile, isOpen, onToggle }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const handleChange = (e) => {
    setInputText(e.target.value);
    const now = Date.now();
    if (socketRef.current && partnerIdRef.current && now - typingEmitRef.current > 1500) {
      socketRef.current.emit('typing');
      typingEmitRef.current = now;
    }
  };

  const MsgList = ({ compact }) => (
    <>
      <div style={{ flex:'1 0 0' }} />
      {messages.slice(-30).map(m => <Bubble key={m.id} msg={m} compact={compact} />)}
      <div ref={endRef} />
    </>
  );

  /* ── Desktop ── */
  if (!isMobile) return (
    <div style={{ position:'absolute', left:0, top:0, bottom:0, width:285, zIndex:30, display:'flex', flexDirection:'column', pointerEvents:'none' }}>
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:5, padding:'70px 10px 10px', scrollbarWidth:'none', pointerEvents:'auto' }}>
        <MsgList />
      </div>
      <div style={{ padding:'10px', pointerEvents:'auto', background:'linear-gradient(180deg,transparent,rgba(8,8,8,.72))' }}>
        {isTyping && <TypingDots />}
        <ChatInput inputRef={inputRef} value={inputText} onChange={handleChange} onKeyDown={onKeyDown} onSend={onSend} status={status} />
      </div>
    </div>
  );

  /* ── Mobile ── */
  const hasNew = messages.some(m => m.from !== 'system');
  return (
    <>
      {/* Chat FAB */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{ position:'fixed', bottom: keyboardHeight+72, left:14, zIndex:1001, width:42, height:42, borderRadius:'50%', background:'rgba(10,10,10,.88)', border:'1px solid rgba(212,175,55,.32)', backdropFilter:'blur(12px)', color:'#D4AF37', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 14px rgba(0,0,0,.4)' }}>
        <Ic.Chat />
        {hasNew && !isOpen && <div style={{ position:'absolute', top:-2, right:-2, width:9, height:9, borderRadius:'50%', background:'#D4AF37', border:'1.5px solid #0A0A0A' }} />}
      </button>

      {/* Floating bubble preview */}
      {!isOpen && (
        <div style={{ position:'fixed', left:0, top:58, bottom: keyboardHeight+80, width:'62%', maxWidth:245, zIndex:20, pointerEvents:'none', overflow:'hidden' }}>
          <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:4, padding:'8px 10px 10px' }}>
            {messages.slice(-7).map(m => <Bubble key={m.id} msg={m} compact />)}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div onClick={onToggle} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,.45)', backdropFilter:'blur(3px)' }} />}

      {/* Drawer */}
      <div style={{ position:'fixed', left:0, right:0, bottom: keyboardHeight, height:'58vh', zIndex:350, background:'rgba(11,11,11,.98)', border:'1px solid rgba(212,175,55,.13)', borderBottom:'none', borderRadius:'18px 18px 0 0', display:'flex', flexDirection:'column', transform: isOpen ? 'translateY(0)' : 'translateY(105%)', transition:'transform .28s cubic-bezier(.4,0,.2,1)', boxShadow:'0 -8px 36px rgba(0,0,0,.5)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px 9px', borderBottom:'1px solid rgba(212,175,55,.1)', flexShrink:0, position:'relative' }}>
          <div style={{ position:'absolute', top:7, left:'50%', transform:'translateX(-50%)', width:34, height:4, borderRadius:2, background:'rgba(255,255,255,.13)' }} />
          <span style={{ color:'rgba(255,255,255,.45)', fontSize:12, fontWeight:600, letterSpacing:'.05em' }}>CHAT</span>
          <button onClick={onToggle} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer', display:'flex' }}><Ic.Close /></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, padding:'9px 13px', scrollbarWidth:'none' }}>
          <MsgList />
        </div>
        <div style={{ padding:'8px 13px 14px', flexShrink:0 }}>
          {isTyping && <TypingDots />}
          <ChatInput inputRef={inputRef} value={inputText} onChange={handleChange} onKeyDown={onKeyDown} onSend={onSend} status={status} />
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   WAITING OVERLAY  — fades in/out, never blocks when invisible
   ══════════════════════════════════════════════════════════════════════ */
function WaitingOverlay({ onCancel, visible }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(8,8,8,.9)', backdropFilter:'blur(14px)', zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition:'opacity .35s ease' }}>
      {/* Spinning rings */}
      <div style={{ position:'relative', width:80, height:80 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ position:'absolute', inset: i*13, borderRadius:'50%', border:`1.5px solid rgba(212,175,55,${.5-i*.14})`, animation:`spin ${1.5+i*.7}s linear infinite ${i%2?'reverse':''}` }} />
        ))}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 10px rgba(212,175,55,.8)' }} />
        </div>
      </div>

      <div style={{ textAlign:'center' }}>
        <p style={{ fontFamily:'"Playfair Display",serif', color:'#D4AF37', fontSize:17, fontWeight:600, marginBottom:5, letterSpacing:'.02em' }}>Finding your match…</p>
        <p style={{ color:'rgba(255,255,255,.32)', fontSize:12 }}>Connecting you with someone new</p>
      </div>

      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', animation:`waitPulse 1.4s ease-in-out ${i*.22}s infinite` }} />)}
      </div>

      <button onClick={onCancel}
        style={{ marginTop:2, padding:'7px 24px', borderRadius:50, border:'1px solid rgba(212,175,55,.22)', background:'transparent', color:'rgba(255,255,255,.38)', cursor:'pointer', fontSize:12, letterSpacing:'.06em', transition:'all .2s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,.5)'; e.currentTarget.style.color='#D4AF37';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,.22)'; e.currentTarget.style.color='rgba(255,255,255,.38)';}}>
        Cancel
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FLOATING CONTROLS
   ══════════════════════════════════════════════════════════════════════ */
function Controls({ isMuted, isVideoOff, onMute, onVideo, onReport, onNext, status, visible, isMobile }) {
  const sz = isMobile ? 44 : 50;
  const base = {
    width:sz, height:sz, borderRadius:'50%',
    background:'rgba(8,8,8,.82)', border:'1px solid rgba(212,175,55,.22)',
    backdropFilter:'blur(14px)', color:'#C9A227',
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', flexShrink:0, boxShadow:'0 4px 18px rgba(0,0,0,.4)',
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 10 : 13, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition:'opacity .28s ease' }}>

      <button onClick={onMute} className={`cb${isMuted ? ' on' : ''}`}
        style={{ ...base, ...(isMuted ? { background:'rgba(212,175,55,.18)', borderColor:'rgba(212,175,55,.6)', color:'#FFD700' } : {}) }}
        title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? <Ic.MicOff /> : <Ic.Mic />}
      </button>

      {/* NEXT — gold, larger, shimmer */}
      <button onClick={onNext} className="next-glow"
        style={{ ...base, width: isMobile ? 54 : 62, height: isMobile ? 54 : 62, background:'linear-gradient(135deg,#D4AF37 0%,#FFD700 50%,#B8860B 100%)', border:'none', color:'#000', boxShadow:'0 0 26px rgba(212,175,55,.45), 0 4px 18px rgba(0,0,0,.5)', overflow:'hidden', position:'relative' }}
        title={status === 'idle' ? 'Start' : 'Next stranger'}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)', backgroundSize:'200% 100%', animation:'shimmer 2.4s linear infinite', borderRadius:'50%' }} />
        <Ic.Next s={24} />
      </button>

      <button onClick={onVideo} className={`cb${isVideoOff ? ' on' : ''}`}
        style={{ ...base, ...(isVideoOff ? { background:'rgba(212,175,55,.18)', borderColor:'rgba(212,175,55,.6)', color:'#FFD700' } : {}) }}
        title={isVideoOff ? 'Video on' : 'Video off'}>
        {isVideoOff ? <Ic.VideoOff /> : <Ic.Video />}
      </button>

      <button onClick={() => status === 'connected' && onReport()} className="cb danger"
        style={{ ...base, opacity: status === 'connected' ? 1 : .35, cursor: status === 'connected' ? 'pointer' : 'not-allowed' }}
        title="Report user">
        <Ic.Flag />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PiP — local video
   ══════════════════════════════════════════════════════════════════════ */
function PiP({ videoRef, isVideoOff, isMobile }) {
  return (
    <div style={{ position:'absolute', bottom: isMobile ? 82 : 94, right:14, width: isMobile ? 94 : 150, height: isMobile ? 130 : 106, borderRadius:13, overflow:'hidden', border:'1.5px solid rgba(212,175,55,.36)', boxShadow:'0 4px 22px rgba(0,0,0,.6)', zIndex:40 }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1) translateZ(0)', backfaceVisibility:'hidden', filter: isVideoOff ? 'brightness(0)' : 'none', background:'#000' }} />
      {isVideoOff && (
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#111,#1a1a1a)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5 }}>
          <span style={{ fontSize:22, opacity:.2 }}>🎥</span>
          <span style={{ color:'rgba(255,255,255,.2)', fontSize:10, letterSpacing:'.04em' }}>OFF</span>
        </div>
      )}
      <div style={{ position:'absolute', bottom:5, left:7, background:'rgba(0,0,0,.55)', backdropFilter:'blur(4px)', borderRadius:4, padding:'2px 6px', fontSize:9, color:'rgba(255,255,255,.65)', fontWeight:700, letterSpacing:'.06em' }}>YOU</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   START OVERLAY
   ══════════════════════════════════════════════════════════════════════ */
function StartOverlay({ onStart, mediaReady, mediaError }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(18,14,6,.96) 0%,rgba(5,5,5,.98) 100%)', zIndex:100, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:22, overflow:'hidden', animation:'fadeIn .3s ease both' }}>
      {/* Ambient orbs */}
      <div aria-hidden style={{ position:'absolute', top:'10%', left:'8%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(212,175,55,.05) 0%,transparent 70%)', animation:'orb1 8s ease-in-out infinite', pointerEvents:'none' }} />
      <div aria-hidden style={{ position:'absolute', bottom:'12%', right:'8%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(184,134,11,.04) 0%,transparent 70%)', animation:'orb2 10s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ animation:'float 3.5s ease-in-out infinite' }}>
        <img src="/logo.png" alt="Mingle" style={{ height:50, objectFit:'contain' }} />
      </div>

      <div style={{ textAlign:'center', maxWidth:290, padding:'0 20px' }}>
        <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:27, fontWeight:700, background:'linear-gradient(135deg,#FFD700,#D4AF37,#B8860B)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:8, lineHeight:1.2 }}>
          Ready to Mingle?
        </h2>
        <p style={{ color:'rgba(255,255,255,.32)', fontSize:13, lineHeight:1.6 }}>
          {mediaError || 'Connect instantly with strangers worldwide'}
        </p>
      </div>

      {!mediaError ? (
        <button onClick={onStart}
          style={{ padding:'15px 50px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#D4AF37,#FFD700 50%,#B8860B)', color:'#000', fontWeight:700, fontSize:15, letterSpacing:'.16em', textTransform:'uppercase', cursor: mediaReady ? 'pointer' : 'not-allowed', opacity: mediaReady ? 1 : .65, boxShadow: mediaReady ? '0 0 34px rgba(212,175,55,.48), 0 8px 28px rgba(0,0,0,.5)' : '0 8px 28px rgba(0,0,0,.5)', transition:'all .28s' }}
          onMouseEnter={e => { if(mediaReady){ e.currentTarget.style.transform='translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow='0 0 52px rgba(212,175,55,.62), 0 12px 32px rgba(0,0,0,.5)'; }}}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow = mediaReady ? '0 0 34px rgba(212,175,55,.48), 0 8px 28px rgba(0,0,0,.5)' : ''; }}>
          {mediaReady ? '✦ START ✦' : '⏳ Starting…'}
        </button>
      ) : (
        <button onClick={() => window.location.reload()}
          style={{ padding:'13px 36px', borderRadius:50, border:'1.5px solid rgba(212,175,55,.4)', background:'transparent', color:'#D4AF37', cursor:'pointer', fontSize:13, letterSpacing:'.07em', transition:'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,55,.1)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          Retry Permissions
        </button>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ message }) {
  return (
    <div style={{ position:'fixed', bottom:94, left:'50%', zIndex:500, background:'rgba(8,8,8,.92)', backdropFilter:'blur(14px)', border:'1px solid rgba(212,175,55,.32)', borderRadius:50, padding:'9px 20px', color:'#D4AF37', fontSize:12, display:'flex', alignItems:'center', gap:7, boxShadow:'0 4px 22px rgba(0,0,0,.5)', animation:'toastIn .22s ease-out both', whiteSpace:'nowrap' }}>
      <span style={{ opacity:.8 }}>✓</span> {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN — ChatRoom
   ══════════════════════════════════════════════════════════════════════ */
export default function ChatRoom() {
  const router = useRouter();

  /* ── VH fix (only on orientation change, not keyboard) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const set = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * .01}px`);
    set();
    let pw = window.innerWidth;
    const fn = () => { if (window.innerWidth !== pw) { pw = window.innerWidth; set(); } };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* ── State ── */
  const [status, setStatus]           = useState('idle');
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState('');
  const [isMuted, setIsMuted]         = useState(false);
  const [isVideoOff, setIsVideoOff]   = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReport, setShowReport]   = useState(false);
  const [reportSent, setReportSent]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [mediaReady, setMediaReady]   = useState(false);
  const [mediaError, setMediaError]   = useState('');
  const [isTyping, setIsTyping]       = useState(false);
  const [showCtrl, setShowCtrl]       = useState(true);
  const [chatOpen, setChatOpen]       = useState(false);
  const [kbHeight, setKbHeight]       = useState(0);
  // Remote video opacity — animates 0→1 on new connection, 1→0 on disconnect
  const [remoteOpacity, setRemoteOpacity] = useState(0);

  /* ── Refs ── */
  const socketRef      = useRef(null);
  const pcRef          = useRef(null);
  const localStream    = useRef(null);
  const partnerIdRef   = useRef(null);
  const localVidRef    = useRef(null);
  const remoteVidRef   = useRef(null);
  const statusRef      = useRef('idle');
  const inputRef       = useRef(null);
  const typingTimer    = useRef(null);
  const typingEmit     = useRef(0);
  const ctrlTimer      = useRef(null);
  const pendingICE     = useRef([]);
  const remoteDescSet  = useRef(false);

  useEffect(() => { statusRef.current = status; }, [status]);

  /* ── Mobile detection ── */
  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768);
    chk();
    window.addEventListener('resize', chk);
    return () => window.removeEventListener('resize', chk);
  }, []);

  /* ── Keyboard height via visualViewport ── */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const update = () => {
      const vv = window.visualViewport;
      setKbHeight(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    update();
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  /* ── Controls: always visible desktop, auto-hide mobile ── */
  useEffect(() => {
    if (!isMobile) { setShowCtrl(true); return; }
    setShowCtrl(true);
    clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setShowCtrl(false), 4000);
  }, [isMobile]);

  /* ── Init on mount ── */
  useEffect(() => {
    initMedia();
    initSocket();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Media ── */
  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:'user', width:{ ideal:640 }, height:{ ideal:480 }, frameRate:{ ideal:24 } },
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true },
      });
      localStream.current = stream;
      setMediaReady(true);
      if (localVidRef.current) localVidRef.current.srcObject = stream;
    } catch (err) {
      setMediaError(
        err.name === 'NotAllowedError'
          ? 'Camera / Microphone permission denied. Allow access and refresh.'
          : 'Could not access camera or microphone. Check your device.'
      );
    }
  };

  /* ── Socket ── */
  const initSocket = () => {
    const socket = io(BACKEND, {
      transports: ['polling', 'websocket'],
      reconnection: true, reconnectionAttempts: 5,
      timeout: 20000, forceNew: true, upgrade: true,
    });
    socketRef.current = socket;

    socket.on('connect',       () => console.log('[Socket] connected:', socket.id));
    socket.on('disconnect',    () => console.log('[Socket] disconnected'));
    socket.on('connect_error', (e) => console.log('[Socket] error:', e.message));
    socket.on('online_count',  (n) => setOnlineCount(n));
    socket.on('waiting',       () => setStatus('waiting'));

    socket.on('matched', async ({ initiator, partnerId }) => {
      partnerIdRef.current = partnerId;
      // Fade old video out first
      setRemoteOpacity(0);
      setTimeout(() => {
  if (remoteVidRef.current) {
    remoteVidRef.current.srcObject = null;
  }
}, 450); // 🔥 increase delay
      setStatus('connected');
      setMessages([]);
      // Short delay then show system message (lets fade-out play)
      setTimeout(() => addSysMsg('🟢 Connected to a stranger'), 280);
      await createPC(initiator, partnerId);
    });

    socket.on('signal', async ({ signal, from }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          remoteDescSet.current = true;
          await flushICE(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { signal: answer, to: from });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          remoteDescSet.current = true;
          await flushICE(pc);
        } else if (signal.candidate !== undefined) {
          if (remoteDescSet.current) await pc.addIceCandidate(new RTCIceCandidate(signal)).catch(() => {});
          else pendingICE.current.push(signal);
        }
      } catch (e) { console.error('[Signal]', e); }
    });

    socket.on('message', ({ text }) => {
      setMessages(p => [...p, { text, from:'stranger', id:`${Date.now()}-${Math.random()}` }]);
    });

    socket.on('typing', () => {
      setIsTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 2200);
    });

    socket.on('partner_disconnected', () => {
      closePC();
      // Fade out remote video
      setRemoteOpacity(0);
      if (remoteVidRef.current) remoteVidRef.current.srcObject = null;
      setStatus('waiting');
      addSysMsg('🔴 Stranger disconnected — finding next…');
      socket.emit('find_match');
    });

    socket.on('find_match_trigger', () => socket.emit('find_match'));

    socket.on('report_received', () => {
      setShowReport(false);
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    });
  };

  const flushICE = async (pc) => {
    for (const c of pendingICE.current) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    pendingICE.current = [];
  };

  /* ── Peer connection ── */
  const createPC = async (initiator, partnerId) => {
    closePC();
    remoteDescSet.current = false;
    pendingICE.current    = [];

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    localStream.current?.getTracks().forEach(t => pc.addTrack(t, localStream.current));

    pc.ontrack = ({ streams }) => {
      if (streams[0] && remoteVidRef.current) {
        remoteVidRef.current.srcObject = streams[0];
        // Critical: call play() explicitly — prevents black screen on Safari/iOS
        remoteVidRef.current.play().catch(() => {});
        // Fade in remote video
        setTimeout(() => setRemoteOpacity(1), 60);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current && partnerId)
        socketRef.current.emit('signal', { signal: candidate.toJSON(), to: partnerId });
    };

    pc.onconnectionstatechange = () => {
      console.log('[PC]', pc.connectionState);
      if (pc.connectionState === 'failed') pc.restartIce();
    };

    if (initiator) {
      const offer = await pc.createOffer({ offerToReceiveVideo:true, offerToReceiveAudio:true });
      await pc.setLocalDescription(offer);
      // Boost video bitrate
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        const params = sender.getParameters();
        if (!params.encodings?.length) params.encodings = [{}];
        params.encodings[0].maxBitrate = 1_500_000;
        sender.setParameters(params).catch(() => {});
      }
      socketRef.current?.emit('signal', { signal: offer, to: partnerId });
    }
  };

  const closePC = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    remoteDescSet.current = false;
    pendingICE.current    = [];
  }, []);

  const cleanup = useCallback(() => {
    closePC();
    localStream.current?.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
  }, [closePC]);

  /* ── Helpers ── */
  const addSysMsg = (text) => setMessages(p => [...p, { text, from:'system', id:`sys-${Date.now()}-${Math.random()}` }]);

  const handleStart = () => { socketRef.current?.emit('find_match'); setMessages([]); setStatus('waiting'); };

  const handleNext = () => {
    closePC();
    setRemoteOpacity(0);
    if (remoteVidRef.current) remoteVidRef.current.srcObject = null;
    setMessages([]);
    setStatus('waiting');
    addSysMsg('🔎 Finding next stranger…');
    socketRef.current?.emit('find_match');
  };

  const handleCancelWaiting = () => { socketRef.current?.emit('next'); setStatus('idle'); setMessages([]); };

  const handleMute = () => {
    const t = localStream.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(v => !v); }
  };

  const handleVideoOff = () => {
    const t = localStream.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(v => !v); }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || status !== 'connected' || text.length > 500) return;
    setMessages(p => [...p, { text, from:'me', id:`me-${Date.now()}-${Math.random()}` }]);
    socketRef.current?.emit('message', { text });
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleReport = (reason) => {
    socketRef.current?.emit('report', { reason });
    setShowReport(false);
    setReportSent(true);
    setTimeout(() => setReportSent(false), 3000);
  };

  const handleTouch = () => {
    if (!isMobile) return;
    setShowCtrl(true);
    clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setShowCtrl(false), 3500);
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{ width:'100%', height:'calc(var(--vh,1vh)*100)', position:'fixed', inset:0, background:'#080808', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'"DM Sans",sans-serif' }}
      onClick={handleTouch}
      onTouchStart={handleTouch}
    >
      <GlobalStyles />
      <div className="noise-overlay" aria-hidden />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:58, zIndex:60, background:'linear-gradient(180deg,rgba(6,6,6,.9) 0%,transparent 100%)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', pointerEvents:'none' }}>

        <button onClick={() => router.push('/')}
          style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:8, pointerEvents:'auto', transition:'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='.7'} onMouseLeave={e => e.currentTarget.style.opacity='1'} title="Home">
          <img src="/logo.png" alt="Mingle" style={{ height:34, objectFit:'contain' }} />
        </button>

        {/* Ad slot */}
        <div style={{ flex:1, margin:'0 14px', maxWidth:300, height:30, borderRadius:6, border:'1px dashed rgba(212,175,55,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(212,175,55,.18)', fontSize:10, letterSpacing:'.13em', textTransform:'uppercase', animation:'adPulse 4s ease-in-out infinite', pointerEvents:'auto' }}>
          Ad Space
        </div>

        {/* Online pill */}
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(8,8,8,.72)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.07)', borderRadius:20, padding:'5px 11px', pointerEvents:'auto' }}>
          <div style={{ position:'relative', width:7, height:7 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'ping 1.4s ease-in-out infinite' }} />
            <div style={{ position:'absolute', inset:1, borderRadius:'50%', background:'#22c55e' }} />
          </div>
          <span style={{ color:'rgba(255,255,255,.5)', fontSize:11, whiteSpace:'nowrap' }}>{onlineCount.toLocaleString()} online</span>
        </div>
      </div>

      {/* ── Full-screen video area ──────────────────────────────────── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {/* Dark background */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0c0c0c,#141414)' }} />

        {/* Remote video — fills screen, fades in/out */}
        <video ref={remoteVidRef} autoPlay playsInline className="remote-vid"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1) translateZ(0)', backfaceVisibility:'hidden', opacity: remoteOpacity }} />

        {/* Placeholder silhouette */}
        {status !== 'connected' && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:1 }}>
            <span style={{ fontSize: isMobile ? 56 : 76, opacity:.05 }}>👤</span>
          </div>
        )}

        {/* Waiting overlay — uses opacity transition, never blocks when invisible */}
        <WaitingOverlay onCancel={handleCancelWaiting} visible={status === 'waiting'} />

        {/* Chat panel */}
        <ChatPanel
          messages={messages} inputText={inputText} setInputText={setInputText}
          onSend={handleSend} onKeyDown={handleKeyDown} inputRef={inputRef}
          status={status} isTyping={isTyping}
          socketRef={socketRef} partnerIdRef={partnerIdRef} typingEmitRef={typingEmit}
          keyboardHeight={kbHeight} isMobile={isMobile}
          isOpen={chatOpen} onToggle={() => setChatOpen(v => !v)}
        />

        {/* PiP local video */}
        <PiP videoRef={localVidRef} isVideoOff={isVideoOff} isMobile={isMobile} />

        {/* Logo watermark when connected */}
        {status === 'connected' && (
          <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', zIndex:5, pointerEvents:'none', animation:'fadeIn .4s ease both' }}>
            <img src="/logo.png" alt="" style={{ height: isMobile ? 26 : 34, opacity:.28, objectFit:'contain' }} />
          </div>
        )}

        {/* Controls — centered at bottom */}
        <div style={{ position:'absolute', bottom: kbHeight + (isMobile ? 12 : 20), left:0, right:0, display:'flex', justifyContent:'center', zIndex:50 }}>
          <Controls
            isMuted={isMuted} isVideoOff={isVideoOff}
            onMute={handleMute} onVideo={handleVideoOff}
            onReport={() => setShowReport(true)}
            onNext={status === 'idle' ? handleStart : handleNext}
            status={status} visible={showCtrl} isMobile={isMobile}
          />
        </div>

        {/* Start overlay */}
        {status === 'idle' && <StartOverlay onStart={handleStart} mediaReady={mediaReady} mediaError={mediaError} />}
      </div>

      {/* Modals & toasts */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} onSubmit={handleReport} />}
      {reportSent  && <Toast message="Report submitted — thank you!" />}
    </div>
  );
}
