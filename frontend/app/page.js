'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════════════
   AD POPUP — shows once per session, video ad with 10s forced watch
   ══════════════════════════════════════════════════════════════════════ */
function AdPopup({ onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [canClose, setCanClose] = useState(false);
  const videoRef = useRef(null);

  /* Start countdown on mount */
  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanClose(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  /* Auto-play video (muted so browsers allow it) */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    /* ── Backdrop ── */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* ── Modal ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          background: '#0f0f0f',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.15), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── Header bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(212, 175, 55, 0.06)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: '"DM Sans", sans-serif',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(212, 175, 55, 0.7)',
              fontWeight: 600,
            }}
          >
            Advertisement
          </span>

          {/* Close button — disabled for first 10 s */}
          {canClose ? (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                background: 'rgba(212, 175, 55, 0.1)',
                color: '#D4AF37',
                fontSize: '12px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(212,175,55,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ✕ Close
            </button>
          ) : (
            /* Countdown pill */
            <div
              style={{
                padding: '5px 14px',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '12px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                minWidth: '80px',
                textAlign: 'center',
              }}
            >
              Skip in {secondsLeft}s
            </div>
          )}
        </div>

        {/* ── Video ── */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            muted
            playsInline
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Gold corner badge */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
              color: '#000',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: '"DM Sans", sans-serif',
              letterSpacing: '0.1em',
              padding: '4px 10px',
              borderRadius: '6px',
              textTransform: 'uppercase',
            }}
          >
            Ad
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.4,
            }}
          >
            Experience Mingle Premium — connect instantly worldwide.
          </p>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              flexShrink: 0,
              padding: '8px 20px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8860B 100%)',
              color: '#000',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: '"DM Sans", sans-serif',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            Learn More ✦
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PARTICLE CANVAS — animated background
   ══════════════════════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const PARTICLE_COUNT = 80;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Connections */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(212,175,55,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      /* Dots */
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

/* ── Feature card ───────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-2 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="font-semibold text-white/90 text-sm">{title}</div>
      <div className="text-white/45 text-xs leading-relaxed">{desc}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  /* ── Ad popup: show once per session ── */
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('mingle_ad_shown')) {
      setShowAd(true);
      sessionStorage.setItem('mingle_ad_shown', 'true');
    }
  }, []);

  const handleCloseAd = () => setShowAd(false);

  const handleStart = () => {
    setIsLoading(true);
    router.push('/chat');
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--obsidian)' }}>

      {/* Noise grain */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Particle network */}
      <ParticleCanvas />

      {/* Background orbs */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          animation: 'orb1 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-15%',
          width: '50vw', height: '50vw', maxWidth: 650, maxHeight: 650,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,134,11,0.07) 0%, transparent 70%)',
          animation: 'orb2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
          animation: 'orb3 11s ease-in-out infinite',
        }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 max-w-2xl w-full">

        {/* Crown icon — uses .animate-float defined in globals.css */}
        <div
          className="animate-float mb-4"
          style={{ fontSize: 56, filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))', lineHeight: 1 }}
        >
          ♛
        </div>

        {/* Logo */}
        <h1
          className="font-bold mb-2"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 40%, #B8860B 80%, #FFD700 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 3s linear infinite',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Mingle
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
            color: 'rgba(212,175,55,0.75)',
            letterSpacing: '0.15em',
            marginBottom: '8px',
          }}
        >
          Connect. Explore. Mingle.
        </p>

        {/* Divider */}
        <div
          className="my-5 w-40"
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
        />

        {/* Subtext */}
        <p className="text-white/50 text-sm mb-8 max-w-md leading-relaxed">
          Meet strangers from around the world instantly. No sign‑up. No filters. Pure, anonymous connection.
        </p>

        {/* START button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="btn-gold rounded-full"
          style={{
            padding: '18px 64px',
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            letterSpacing: '0.2em',
            boxShadow: '0 0 30px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.2)',
            minWidth: 220,
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
          }}
          aria-label="Start video chat"
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <span style={{
                width: 20, height: 20,
                border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Connecting…
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              ✦ START ✦
            </span>
          )}
        </button>

        {/* Notice */}
        <p className="text-white/30 text-xs mt-4">
          By continuing you agree to our{' '}
          <span style={{ color: 'var(--gold-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
          {' '}and{' '}
          <span style={{ color: 'var(--gold-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Guidelines</span>
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mt-12 w-full max-w-lg">
          <FeatureCard icon="🌍" title="Worldwide"  desc="Connect with people from every corner of the globe instantly." delay={0}   />
          <FeatureCard icon="🔒" title="Anonymous"  desc="Zero sign-up. Your identity stays yours, always."              delay={100} />
          <FeatureCard icon="⚡" title="Instant"    desc="Match in seconds. No waiting, no queues."                      delay={200} />
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs mt-10 tracking-widest uppercase">
          © 2025 Mingle — All Rights Reserved
        </p>
      </div>

      {/* ── Ad popup (renders above everything, session-scoped) ── */}
      {showAd && <AdPopup onClose={handleCloseAd} />}
    </main>
  );
}
