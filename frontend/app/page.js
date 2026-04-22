'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── Animated background canvas ────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
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

      // Draw connections
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

      // Draw particles
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
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

/* ── Feature card ───────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-2 hover:border-gold/30 transition-all duration-300 hover:shadow-gold-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="font-semibold text-white/90 text-sm">{title}</div>
      <div className="text-white/45 text-xs leading-relaxed font-sans">{desc}</div>
    </div>
  );
}

/* ── Main landing page ──────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    router.push('/chat');
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-obsidian">
      {/* Noise grain */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Particle network */}
      <ParticleCanvas />

      {/* Background orbs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-15%',
            width: '55vw',
            height: '55vw',
            maxWidth: 700,
            maxHeight: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            animation: 'orb1 14s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-15%',
            width: '50vw',
            height: '50vw',
            maxWidth: 650,
            maxHeight: 650,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,134,11,0.07) 0%, transparent 70%)',
            animation: 'orb2 18s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '40vw',
            height: '40vw',
            maxWidth: 500,
            maxHeight: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
            animation: 'orb3 11s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 max-w-2xl w-full">
        {/* Crown icon */}
        <div
          className="animate-float mb-4"
          style={{
            fontSize: 56,
            filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))',
            lineHeight: 1,
          }}
        >
          ♛
        </div>

        {/* Logo */}
        <h1
          className="font-display font-bold mb-2"
          style={{
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
          className="font-display italic mb-2"
          style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
            color: 'rgba(212,175,55,0.75)',
            letterSpacing: '0.15em',
          }}
        >
          Connect. Explore. Mingle.
        </p>

        {/* Gold divider */}
        <div
          className="my-5 w-40"
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
        />

        {/* Subtext */}
        <p className="text-white/50 text-sm mb-8 max-w-md leading-relaxed font-sans">
          Meet strangers from around the world instantly. No sign‑up. No filters. Pure, anonymous connection.
        </p>

        {/* START button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="btn-gold relative rounded-full text-black font-display font-bold tracking-widest overflow-hidden"
          style={{
            padding: '18px 64px',
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            letterSpacing: '0.2em',
            boxShadow: '0 0 30px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.2)',
            minWidth: 220,
          }}
          aria-label="Start video chat"
        >
          {isLoading ? (
            <span className="flex items-center gap-3 justify-center">
              <span
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(0,0,0,0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Connecting…
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              ✦ START ✦
            </span>
          )}
        </button>

        {/* Notice */}
        <p className="text-white/30 text-xs mt-4 font-sans">
          By continuing you agree to our{' '}
          <span className="text-gold-muted underline cursor-pointer hover:text-gold transition-colors">Terms</span>
          {' '}and{' '}
          <span className="text-gold-muted underline cursor-pointer hover:text-gold transition-colors">Guidelines</span>
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mt-12 w-full max-w-lg">
          <FeatureCard icon="🌍" title="Worldwide" desc="Connect with people from every corner of the globe instantly." delay={0} />
          <FeatureCard icon="🔒" title="Anonymous" desc="Zero sign-up. Your identity stays yours, always." delay={100} />
          <FeatureCard icon="⚡" title="Instant" desc="Match in seconds. No waiting, no queues." delay={200} />
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs mt-10 font-sans tracking-widest uppercase">
          © 2025 Mingle — All Rights Reserved
        </p>
      </div>
    </main>
  );
}
