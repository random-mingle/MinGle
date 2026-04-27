'use client';

import { useState } from 'react';

export default function AdBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fade-in"
      style={{
        marginTop: 10, borderRadius: 12, overflow: 'hidden',
        border: '1px solid #ede9fe', background: 'white',
        boxShadow: '0 2px 8px rgba(124,58,237,0.06)', position: 'relative',
      }}
    >
      {/* AD label */}
      <div style={{
        position: 'absolute', top: 6, left: 8,
        background: '#f3f4f6', borderRadius: 4, padding: '1px 5px',
        fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em',
      }}>
        AD
      </div>

      {/* Close */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', top: 5, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: 16, lineHeight: 1, fontWeight: 700, padding: 2,
        }}
      >
        ×
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', paddingTop: 22 }}>
        {/* Icon */}
        <div style={{
          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          🌟
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', margin: '0 0 2px' }}>
            Unlock Premium Features
          </p>
          <p style={{ fontSize: 11.5, color: '#6b7280', margin: 0 }}>
            No ads, priority matching & more
          </p>
        </div>

        {/* CTA */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            padding: '7px 14px', borderRadius: 8, textDecoration: 'none', flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color: 'white', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
          }}
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
