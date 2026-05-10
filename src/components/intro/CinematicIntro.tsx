'use client';

import { useEffect, useState } from 'react';
import './intro.css';
import {
  playBoot,
  playKnifeThrow,
  playThud,
  playPing,
  playSwipe,
} from './audioEffects';

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ── Boot sound on mount ──
    playBoot();

    // ── Stage progression ──
    const t1 = setTimeout(() => {
      setStage(1);
      playKnifeThrow();                        // logo flies in
    }, 300);

    const t2 = setTimeout(() => {
      setStage(2);
      playPing(900);                            // divider ping
    }, 1200);

    const t3 = setTimeout(() => {
      setStage(3);
      // Staggered thuds for each chip
      [0, 120, 240, 360].forEach((delay, i) => {
        setTimeout(() => playThud(0.9 + i * 0.15), delay);
      });
    }, 2200);

    const t4 = setTimeout(() => {
      setStage(4);
      playKnifeThrow();                         // case bar swoosh
    }, 3000);

    const t5 = setTimeout(() => {
      playPing(1400);                           // completion ping
      handleSkip();
    }, 5000);

    // ── Per-letter swipe sounds for logo chars ──
    'AIVENTRA'.split('').forEach((_, i) => {
      setTimeout(() => playSwipe(i), 300 + i * 60 + 80);
    });

    // ── Progress bar ──
    const start = Date.now();
    const duration = 5000;
    const iv = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(iv);
    }, 30);

    const onKey = () => handleSkip();
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearInterval(iv);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div className={`ci-root${fadeOut ? ' ci-fading' : ''}`}>

      {/* Animated grid background */}
      <div className="ci-grid" />

      {/* Corner scanlines */}
      <div className="ci-scanlines" />

      {/* Glow orbs */}
      <div className="ci-orb ci-orb1" />
      <div className="ci-orb ci-orb2" />
      <div className="ci-orb ci-orb3" />

      {/* Corner brackets */}
      <div className="ci-corner ci-corner-tl" />
      <div className="ci-corner ci-corner-tr" />
      <div className="ci-corner ci-corner-bl" />
      <div className="ci-corner ci-corner-br" />

      {/* Main center content */}
      <div className="ci-center">

        {/* Logo */}
        <div className={`ci-logo${stage >= 1 ? ' ci-visible' : ''}`}>
          <span className="ci-logo-hex">⬡</span>
          {'AIVENTRA'.split('').map((ch, i) => (
            <span
              key={i}
              className="ci-logo-char"
              style={{ animationDelay: `${i * 60 + 300}ms` }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Divider line */}
        <div className={`ci-divider${stage >= 2 ? ' ci-divider-open' : ''}`} />

        {/* Tagline */}
        <div className={`ci-tagline${stage >= 2 ? ' ci-visible' : ''}`}>
          Forensic Intelligence System
        </div>

        {/* Subtitle */}
        <div className={`ci-subtitle${stage >= 2 ? ' ci-visible' : ''}`}>
          AI · Forensics · IoT · Intelligence
        </div>

        {/* Status chips */}
        {stage >= 3 && (
          <div className="ci-chips">
            {[
              { icon: '●', label: 'GEMMA AI ACTIVE',   color: '#00F5FF' },
              { icon: '■', label: 'IoT SENSORS: 8/10', color: '#10B981' },
              { icon: '◆', label: 'RISK SCORE: 82',    color: '#F59E0B' },
              { icon: '▲', label: 'ANOMALIES: 7',      color: '#EF4444' },
            ].map((chip, i) => (
              <div
                key={i}
                className="ci-chip"
                style={{
                  animationDelay: `${i * 120}ms`,
                  borderColor: chip.color + '44',
                  color: chip.color,
                }}
              >
                {chip.icon} {chip.label}
              </div>
            ))}
          </div>
        )}

        {/* Case bar */}
        {stage >= 4 && (
          <div className="ci-casebar">
            ▸ ACTIVE CASE: CI-2025-014 · Industrial District Homicide ·{' '}
            <span style={{ color: '#EF4444' }}>CRITICAL</span>
          </div>
        )}

      </div>

      {/* Bottom HUD */}
      <div className="ci-hud">
        <div className="ci-hud-left">
          <span className="ci-blink">◉</span> SYSTEM BOOT
        </div>
        <div className="ci-progress-wrap">
          <div className="ci-progress-bar">
            <div className="ci-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ci-progress-pct">{Math.round(progress)}%</div>
        </div>
        <div className="ci-hud-right">
          v2.5.1 · SECURE
        </div>
      </div>

      {/* Skip button */}
      <button className="ci-skip" onClick={handleSkip}>
        Skip ↗
      </button>
    </div>
  );
}
