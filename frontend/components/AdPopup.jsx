'use client';

import { useState } from 'react';

export default function AdPopup({ onClose }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(30, 27, 75, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fade-in-up"
        style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          width: '100%', maxWidth: 340,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(124,58,237,0.1)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(0,0,0,0.15)', color: 'white', fontSize: 16, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.target.style.background = 'rgba(0,0,0,0.35)')}
          onMouseLeave={(e) => (e.target.style.background = 'rgba(0,0,0,0.15)')}
        >
          ×
        </button>

        {/* Ad image placeholder */}
        <div style={{
          height: 180,
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

          <div style={{ fontSize: 40 }}>🎉</div>
          <p style={{ color: 'white', fontWeight: 800, fontSize: 18, textAlign: 'center', padding: '0 20px', letterSpacing: '-0.5px' }}>
            Premium Chat Experience
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', padding: '0 24px' }}>
            Meet people from 190+ countries
          </p>
          <div style={{
            position: 'absolute', top: 10, left: 12,
            background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 8px',
            color: 'white', fontSize: 11, fontWeight: 700,
          }}>
            AD
          </div>
        </div>

        {/* Ad content */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, textAlign: 'center', lineHeight: 1.5 }}>
            Upgrade your chat experience with exclusive features and priority matching.
          </p>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              display: 'block', width: '100%', padding: '11px',
              background: hov ? 'linear-gradient(135deg,#6d28d9,#5b21b6)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: 'white', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              textAlign: 'center', borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)', transition: 'all 0.15s',
              transform: hov ? 'translateY(-1px)' : 'none',
            }}
          >
            Open →
          </a>

          <button
            onClick={onClose}
            style={{
              display: 'block', width: '100%', marginTop: 8, padding: '8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            No thanks, continue to Mingle
          </button>
        </div>
      </div>
    </div>
  );
}
