'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const CORRECT_PIN = '1099';
const PAD = ['1','2','3','4','5','6','7','8','9','CLR','0','⌫'];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [boot, setBoot] = useState(true);

  // Boot sequence
  useEffect(() => {
    const t = setTimeout(() => setBoot(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Already authenticated?
  useEffect(() => {
    if (document.cookie.includes('jarvis_auth=1')) router.replace('/tracker');
  }, [router]);

  const handleKey = useCallback((k: string) => {
    if (status === 'success' || boot) return;
    if (k === 'CLR') { setPin(''); setStatus('idle'); return; }
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setStatus('idle'); return; }
    if (pin.length >= 4) return;

    const next = pin + k;
    setPin(next);

    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setStatus('success');
        document.cookie = 'jarvis_auth=1; path=/; max-age=86400';
        setTimeout(() => router.push('/tracker'), 1600);
      } else {
        setAttempts(a => a + 1);
        setStatus('error');
        setGlitch(true);
        setTimeout(() => { setGlitch(false); setPin(''); setStatus('idle'); }, 900);
      }
    }
  }, [pin, status, boot, router]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === 'Backspace') handleKey('⌫');
      else if (e.key === 'Escape') handleKey('CLR');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const dotColor = status === 'error' ? '#ff3333' : status === 'success' ? '#00ff88' : '#00d4ff';

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.4; }
          97% { opacity: 1; }
          98% { opacity: 0.6; }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(0, 212, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        @keyframes success-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes boot-fade {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes grid-drift {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes hud-slide {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-fill {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes glitch-text {
          0% { clip-path: inset(0 0 90% 0); transform: skewX(0deg); }
          10% { clip-path: inset(10% 0 60% 0); transform: skewX(-4deg); }
          20% { clip-path: inset(50% 0 30% 0); transform: skewX(3deg); }
          30% { clip-path: inset(20% 0 70% 0); transform: skewX(-2deg); }
          40% { clip-path: inset(80% 0 5% 0); transform: skewX(4deg); }
          50%, 100% { clip-path: inset(0 0 0 0); transform: skewX(0deg); opacity: 0; }
        }
        .btn-pad {
          position: relative;
          background: rgba(0, 212, 255, 0.04);
          border: 1px solid rgba(0, 212, 255, 0.18);
          border-radius: 12px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.4rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          overflow: hidden;
          user-select: none;
        }
        .btn-pad::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(0,212,255,0.15) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .btn-pad:hover::before { opacity: 1; }
        .btn-pad:hover {
          border-color: rgba(0, 212, 255, 0.55);
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0,212,255,0.25), inset 0 0 20px rgba(0,212,255,0.05);
          transform: translateY(-1px);
        }
        .btn-pad:active {
          transform: scale(0.94) translateY(0);
          box-shadow: 0 0 8px rgba(0,212,255,0.5), inset 0 0 8px rgba(0,212,255,0.1);
        }
        .btn-clr { color: #94a3b8 !important; font-size: 0.85rem !important; letter-spacing: 0.1em; }
        .btn-del { color: #f87171 !important; font-size: 0.85rem !important; }
        .btn-del:hover { border-color: rgba(255,80,80,0.55) !important; color: #ff5555 !important; box-shadow: 0 0 20px rgba(255,80,80,0.25) !important; }
      `}</style>

      {/* Boot overlay */}
      {boot && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#080a0f',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'boot-fade 1.8s ease forwards',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ color: '#00d4ff', fontSize: '0.75rem', letterSpacing: '0.3em', opacity: 0.7 }}>
            JARVIS TACTICAL SYSTEM v4.1.0
          </div>
          <div style={{ color: '#1e293b', fontSize: '0.65rem', marginTop: '0.5rem', letterSpacing: '0.15em' }}>
            INITIALIZING SECURE CHANNEL...
          </div>
          <div style={{
            marginTop: '2rem',
            width: '200px', height: '2px',
            background: 'rgba(0,212,255,0.1)',
            borderRadius: '2px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: '100%',
              background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
              animation: 'scanline 1.2s ease-in-out',
            }} />
          </div>
        </div>
      )}

      {/* Full-screen wrapper — sits above sidebar/layout */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#080a0f',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
        animation: glitch ? 'flicker 0.3s ease' : undefined,
      }}>

        {/* Animated grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-drift 8s linear infinite',
        }} />

        {/* Radial center glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
          animation: 'scanline 4s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Corner HUD brackets */}
        {[
          { top: 16, left: 16, borderTop: '2px solid', borderLeft: '2px solid' },
          { top: 16, right: 16, borderTop: '2px solid', borderRight: '2px solid' },
          { bottom: 16, left: 16, borderBottom: '2px solid', borderLeft: '2px solid' },
          { bottom: 16, right: 16, borderBottom: '2px solid', borderRight: '2px solid' },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: 28, height: 28,
            borderColor: 'rgba(0,212,255,0.35)',
            ...s,
          }} />
        ))}

        {/* Top status bar */}
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          animation: 'hud-slide 0.6s ease 2s both',
        }}>
          <div style={{
            display: 'flex', gap: '2rem', alignItems: 'center',
            color: 'rgba(0,212,255,0.4)', fontSize: '0.6rem', letterSpacing: '0.2em',
          }}>
            <span>SYS:LOCKED</span>
            <span style={{ color: 'rgba(0,212,255,0.2)' }}>◆</span>
            <span>ENC:AES-256</span>
            <span style={{ color: 'rgba(0,212,255,0.2)' }}>◆</span>
            <span>CHAN:SECURE</span>
          </div>
        </div>

        {/* Bottom coordinates */}
        <div style={{
          position: 'absolute', bottom: 20, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          padding: '0 2rem',
          color: 'rgba(0,212,255,0.2)', fontSize: '0.55rem', letterSpacing: '0.15em',
          animation: 'hud-slide 0.6s ease 2s both',
        }}>
          <span>JARVIS:TACTICAL:OPERATIONS</span>
          <span>{attempts > 0 ? `AUTH ATTEMPTS: ${attempts}` : 'AWAITING AUTHENTICATION'}</span>
          <span>KERNEL:4.1.0-STABLE</span>
        </div>

        {/* Center card */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2.5rem',
          animation: 'hud-slide 0.5s ease 1.9s both',
        }}>

          {/* JARVIS logo & title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.7rem', letterSpacing: '0.45em',
              color: 'rgba(0,212,255,0.5)',
              marginBottom: '0.5rem',
            }}>
              ── CLASSIFIED SYSTEM ACCESS ──
            </div>
            <div style={{
              fontSize: '2.8rem', fontWeight: 700, letterSpacing: '0.25em',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0088ff 50%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))',
              lineHeight: 1,
            }}>
              JARVIS
            </div>
            <div style={{
              fontSize: '0.6rem', letterSpacing: '0.35em',
              color: 'rgba(0,212,255,0.4)',
              marginTop: '0.4rem',
            }}>
              TACTICAL INTELLIGENCE PLATFORM
            </div>
          </div>

          {/* PIN display ring */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem',
          }}>
            {/* Status message */}
            <div style={{
              fontSize: '0.65rem', letterSpacing: '0.25em',
              color: status === 'error' ? '#ff3333' : status === 'success' ? '#00ff88' : 'rgba(0,212,255,0.5)',
              height: '1rem',
              transition: 'color 0.2s',
              textShadow: status === 'error'
                ? '0 0 10px rgba(255,51,51,0.8)'
                : status === 'success'
                ? '0 0 10px rgba(0,255,136,0.8)'
                : 'none',
            }}>
              {status === 'error'
                ? '⚠ ACCESS DENIED — RETRY'
                : status === 'success'
                ? '✓ IDENTITY CONFIRMED — LOADING...'
                : pin.length === 0
                ? 'ENTER ACCESS CODE'
                : `${pin.length} OF 4 DIGITS`}
            </div>

            {/* PIN dots */}
            <div style={{
              display: 'flex', gap: '1.2rem', alignItems: 'center',
              animation: status === 'error' ? 'shake 0.6s ease' : status === 'success' ? 'success-pop 0.4s ease' : undefined,
            }}>
              {[0,1,2,3].map(i => {
                const filled = i < pin.length;
                return (
                  <div key={i} style={{
                    width: 18, height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${filled ? dotColor : 'rgba(0,212,255,0.25)'}`,
                    background: filled ? dotColor : 'transparent',
                    boxShadow: filled ? `0 0 12px ${dotColor}, 0 0 24px ${dotColor}55` : 'none',
                    transition: 'all 0.2s ease',
                    animation: filled ? 'dot-fill 0.2s ease' : undefined,
                  }} />
                );
              })}
            </div>
          </div>

          {/* Numpad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 72px)',
            gridTemplateRows: 'repeat(4, 64px)',
            gap: '12px',
          }}>
            {PAD.map((k) => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`btn-pad${k === 'CLR' ? ' btn-clr' : k === '⌫' ? ' btn-del' : ''}`}
                style={{ width: '100%', height: '100%' }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.2em',
            color: 'rgba(0,212,255,0.2)',
          }}>
            KEYBOARD INPUT SUPPORTED
          </div>
        </div>

        {/* Glitch overlay on error */}
        {glitch && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,0,0,0.04)',
            pointerEvents: 'none',
            animation: 'glitch-text 0.4s ease forwards',
          }} />
        )}

        {/* Success overlay */}
        {status === 'success' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,255,136,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'pulse-ring 1s ease',
          }} />
        )}
      </div>
    </>
  );
}
