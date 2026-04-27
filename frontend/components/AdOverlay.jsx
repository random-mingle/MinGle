'use client';

import { useState, useEffect } from 'react';

export default function AdOverlay({ onClose }) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanSkip(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const CIRCUMFERENCE = 2 * Math.PI * 20; // r=20

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        className="fade-in-up"
        style={{
          background: '#111827', borderRadius: 18, overflow: 'hidden',
          width: '100%', maxWidth: 420,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)', position: 'relative',
        }}
      >
        {/* Skip button */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1 }}>
          {canSkip ? (
            <button
              onClick={onClose}
              className="fade-in"
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'white', color: '#1e1b4b', fontWeight: 800, fontSize: 13,
                fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              Skip Ad ⏩
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="23" cy="23" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle
                  cx="23" cy="23" r="20" fill="none"
                  stroke="#a78bfa" strokeWidth="3"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * (5 - countdown) / 5)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <text
                  x="23" y="23"
                  textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize="13" fontWeight="bold"
                  style={{ transform: 'rotate(90deg)', transformOrigin: '23px 23px' }}
                >
                  {countdown}
                </text>
              </svg>
            </div>
          )}
        </div>

        {/* Video ad placeholder */}
        <div style={{
          height: 220,
          background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated rings */}
          <div style={{
            position: 'absolute', width: 200, height: 200, borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.15)',
            animation: 'spin 8s linear infinite',
          }} />
          <div style={{
            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.1)',
            animation: 'spin 5s linear infinite reverse',
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {/* Play icon */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0 }}>Advertisement</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>Your ad could be here</p>

          {/* AD badge */}
          <div style={{
            position: 'absolute', top: 10, left: 12,
            background: 'rgba(255,255,255,0.15)', borderRadius: 5, padding: '2px 7px',
            color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700,
          }}>
            AD
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: '0 0 2px' }}>Sponsored Content</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Advertisement • Mingle Partner</p>
          </div>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
              flexShrink: 0,
            }}
          >
            Visit →
          </a>
        </div>
      </div>
    </div>
  );
}
