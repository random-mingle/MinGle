'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdPopup from '@/components/AdPopup';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://mingle-kfcz.onrender.com';

// ── Sub-components ─────────────────────────────────────────────────────────

function Sparkle({ style, size = 24, color = '#f472b6' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ position: 'absolute', ...style }}
      className="sparkle"
    >
      <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
    </svg>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div
      style={{
        borderBottom: '1px solid #ede9fe',
        padding: '14px 0',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{question}</span>
        <span
          style={{
            fontSize: 20,
            color: '#7c3aed',
            fontWeight: 300,
            lineHeight: 1,
            transform: isOpen ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          +
        </span>
      </div>
      {isOpen && (
        <p
          className="fade-in"
          style={{
            marginTop: 8,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.6,
            paddingRight: 16,
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mode, setMode]           = useState('video');
  const [interests, setInterests] = useState('');
  const [openFaq, setOpenFaq]     = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showAd, setShowAd]       = useState(false);
  const router = useRouter();

  // Connect socket just for online count
  useEffect(() => {
    let socket;
    const init = async () => {
      const { io } = await import('socket.io-client');
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socket.on('online-count', (count) => setOnlineCount(count));
    };
    init();

    // Show ad popup after 1.5 seconds
    const timer = setTimeout(() => setShowAd(true), 1500);

    return () => {
      socket?.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const handleStart = () => {
    const params = new URLSearchParams({ mode, interests });
    router.push(`/chat?${params.toString()}`);
  };

  const faqs = [
    {
      q: 'How does interest matching work?',
      a: 'Enter topics you care about and Mingle will try to connect you with someone who shares similar interests. Matching is instant and random within your interest group.',
    },
    {
      q: 'How does Mingle help keep chats safe?',
      a: 'Our moderation system monitors chats in real time. All users must agree to community guidelines before chatting. You can report and skip anyone at any time.',
    },
    {
      q: 'Why choose Mingle to chat with strangers online?',
      a: 'Mingle is completely free, requires no account, and connects you with real people from around the world instantly. It\'s the easiest way to meet new people online.',
    },
    {
      q: 'Can I use Mingle on my phone?',
      a: 'Yes! Mingle is fully optimized for mobile devices. Both text and video chat work seamlessly on Android and iOS.',
    },
  ];

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      label: 'Interest Based\nMatching',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      label: 'Active\nModeration',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      label: 'Global\nCommunity',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: 'Instant &\nAnonymous',
    },
  ];

  return (
    <>
      {/* ── Ad Popup ── */}
      {showAd && <AdPopup onClose={() => setShowAd(false)} />}

      {/* ── Page Wrapper ── */}
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f0ff 0%, #fdf2f8 50%, #f0f4ff 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Decorative Blobs ── */}
        <div
          style={{
            position: 'fixed',
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        {/* ── Sparkles ── */}
        <Sparkle style={{ top: 80, left: '18%' }} size={22} color="#f472b6" />
        <Sparkle style={{ top: 160, right: '22%' }} size={18} color="#c084fc" />
        <Sparkle style={{ bottom: 120, left: '12%' }} size={28} color="#f472b6" />
        <Sparkle style={{ bottom: 180, right: '15%' }} size={16} color="#a78bfa" />
        <Sparkle style={{ top: '40%', left: '6%' }} size={14} color="#f472b6" />
        <Sparkle style={{ top: '35%', right: '5%' }} size={20} color="#c084fc" />

        {/* ── Header ── */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
          }}
        >
          <Image src="/logo.png" alt="Mingle" width={110} height={40} style={{ objectFit: 'contain' }} />

          {/* Online Count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'white',
              borderRadius: 20,
              padding: '6px 14px',
              boxShadow: '0 2px 12px rgba(124,58,237,0.15)',
              fontSize: 13,
              fontWeight: 700,
              color: '#374151',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
              }}
            />
            <span style={{ color: '#7c3aed' }}>
              {onlineCount > 0 ? `${onlineCount.toLocaleString()}+` : '—'}
            </span>
            &nbsp;online
          </div>
        </header>

        {/* ── Main Content ── */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '90px 16px 40px',
          }}
        >
          {/* ── Card ── */}
          <div
            className="fade-in-up"
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 4px 40px rgba(124,58,237,0.10), 0 1px 3px rgba(0,0,0,0.06)',
              padding: '40px 44px',
              width: '100%',
              maxWidth: 560,
            }}
          >
            {/* Heading */}
            <h1
              style={{
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: '#1e1b4b',
                marginBottom: 10,
                letterSpacing: '-0.5px',
              }}
            >
              Chat with Strangers
            </h1>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Ready to meet someone new? Mingle makes it easy to chat with strangers
              in random video or text chats. It&apos;s simple, fast, and time to start mingling!
            </p>

            {/* Mode Toggle */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginBottom: 10, fontWeight: 600 }}>
              Start chatting
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setMode('text')}
                style={{
                  padding: '10px 36px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  background: mode === 'text' ? '#7c3aed' : '#ede9fe',
                  color: mode === 'text' ? 'white' : '#7c3aed',
                  transition: 'all 0.2s',
                }}
              >
                Text
              </button>
              <span style={{ color: '#9ca3af', fontSize: 13 }}>or</span>
              <button
                onClick={() => setMode('video')}
                style={{
                  padding: '10px 36px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  background: mode === 'video' ? '#7c3aed' : '#ede9fe',
                  color: mode === 'video' ? 'white' : '#7c3aed',
                  transition: 'all 0.2s',
                }}
              >
                Video
              </button>
            </div>

            {/* Interests */}
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>
              What do you want to talk about?
            </p>
            <input
              type="text"
              placeholder="Add your interests (optional)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #ede9fe',
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#374151',
                outline: 'none',
                marginBottom: 14,
                background: '#fafafa',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#a78bfa')}
              onBlur={(e) => (e.target.style.borderColor = '#ede9fe')}
            />

            {/* Start Button */}
            <button
              onClick={handleStart}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white',
                fontWeight: 800,
                fontSize: 16,
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginBottom: 14,
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(124,58,237,0.35)';
              }}
            >
              Start {mode === 'video' ? '📹' : '💬'} Chat
            </button>

            {/* Moderation Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: '8px 14px',
                marginBottom: 24,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600 }}>
                Chats are moderated. Please keep it respectful!
              </span>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 28 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: '#faf5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                      textAlign: 'center',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.3,
                    }}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1e1b4b', marginBottom: 4, textAlign: 'center' }}>
              Frequently Asked Questions
            </h2>
            <div>
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            © {new Date().getFullYear()} Mingle.com &nbsp;|&nbsp;
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Blog</a> &nbsp;|&nbsp;
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Rules</a> &nbsp;|&nbsp;
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</a> &nbsp;|&nbsp;
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</a>
          </footer>
        </main>
      </div>
    </>
  );
}
