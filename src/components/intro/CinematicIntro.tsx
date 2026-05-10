'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './intro.css';
import { useAudioEngine } from './useAudioEngine';
import { useParticleEngine } from './useParticleEngine';

type Phase = 'void' | 'dna' | 'evidence' | 'map' | 'assembly' | 'tagline' | 'split' | 'complete';

const PHASE_TIMELINE: { phase: Phase; at: number }[] = [
  { phase: 'void',     at: 0     },
  { phase: 'dna',      at: 2000  },
  { phase: 'evidence', at: 5000  },
  { phase: 'map',      at: 9000  },
  { phase: 'assembly', at: 12000 },
  { phase: 'tagline',  at: 16000 },
  { phase: 'split',    at: 18000 },
  { phase: 'complete', at: 20000 },
];

const EVIDENCE_CARDS = [
  {
    dir: 'from-left', variant: 'cyan',
    content: `◈ FINGERPRINT\nPattern: Whorl\nMatch: 94.7%\nSource: Scene E-003\nStatus: ANALYZING..`
  },
  {
    dir: 'from-right', variant: 'amber',
    content: `◉ GPS LOG\n13.0827°N 80.2707°E\nTimestamp: 02:17 AM\nAccuracy: ±8m\nFLAGGED: ANOMALY`
  },
  {
    dir: 'from-top', variant: 'red',
    content: `▣ CCTV FEED-03\nCamera: Gate B\nDetection: 02:15 AM\nConfidence: 87%\n⚠ TAMPERING RISK`
  },
  {
    dir: 'from-bot', variant: 'cyan',
    content: `⬡ TOXICOLOGY\nEthanol: 0.08 BAC\nDiazepam: trace\nGHB: negative\nStatus: COMPLETE`
  },
  {
    dir: 'from-tl', variant: 'cyan',
    content: `⏱ TIME OF DEATH\n12:30AM – 03:45AM\nPMI: 18-21 hours\nConfidence: 82%\nMethod: Henssge+IoT`
  },
  {
    dir: 'from-br', variant: 'red',
    content: `⚡ RISK SCORE\n████████████ 82/100\nCRITICAL\nAnomalies: 7\nRecalculating...`
  },
];

const MAP_PINS = [
  { x: '45%', y: '48%', label: 'CRIME SCENE', color: '#EF4444', size: 14, delay: 0 },
  { x: '52%', y: '44%', label: 'CCTV-03', color: '#00F5FF', size: 8, delay: 200 },
  { x: '41%', y: '51%', label: 'GPS LOG-001', color: '#F59E0B', size: 8, delay: 400 },
  { x: '55%', y: '52%', label: 'EVIDENCE E-007', color: '#00F5FF', size: 6, delay: 600 },
  { x: '38%', y: '46%', label: 'WITNESS W-001', color: '#10B981', size: 6, delay: 800 },
  { x: '48%', y: '55%', label: 'SUSPECT LAST LOC', color: '#EF4444', size: 10, delay: 1000 },
  { x: '60%', y: '49%', label: 'DEVICE PING', color: '#8B5CF6', size: 6, delay: 1200 },
  { x: '43%', y: '58%', label: 'BODY FOUND', color: '#EF4444', size: 12, delay: 1400 },
];

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('void');
  const [fadeOut, setFadeOut] = useState(false);

  // Evidence phase
  const [showCards, setShowCards] = useState(false);
  const [cardsLocked, setCardsLocked] = useState(false);

  // Map phase
  const [showMap, setShowMap] = useState(false);
  const [pinsVisible, setPinsVisible] = useState(0);
  const [showRisk, setShowRisk] = useState(false);
  const [riskCount, setRiskCount] = useState(0);

  // Assembly phase
  const [showLogoDOM, setShowLogoDOM] = useState(false);
  const [showScanlines, setShowScanlines] = useState(false);

  // Tagline phase
  const [tagline, setTagline] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showCaseBar, setShowCaseBar] = useState(false);

  // Split phase
  const [showCrack, setShowCrack] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const audio = useAudioEngine();
  const particles = useParticleEngine(canvasRef);

  // ── Phase Timeline ──
  useEffect(() => {
    audio.initAudio();
    particles.startLoop();

    const timers = PHASE_TIMELINE.map(({ phase, at }) =>
      setTimeout(() => setPhase(phase), at)
    );

    const onKey = () => handleSkip();
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      timers.forEach(clearTimeout);
      particles.stopLoop();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // ── Phase Handlers ──
  useEffect(() => {
    switch (phase) {
      case 'void': runVoid(); break;
      case 'dna': runDNA(); break;
      case 'evidence': runEvidence(); break;
      case 'map': runMap(); break;
      case 'assembly': runAssembly(); break;
      case 'tagline': runTagline(); break;
      case 'split': runSplit(); break;
      case 'complete': onComplete(); break;
    }
  }, [phase]);

  const runVoid = () => {
    audio.playVoidPhase();
    setTimeout(() => particles.triggerShockwaves(), 1200);
  };

  const runDNA = () => {
    audio.playDNAPhase();
    particles.startDNA();
  };

  const runEvidence = () => {
    audio.playEvidencePhase();
    particles.explode();
    setTimeout(() => setShowCards(true), 400);
    setTimeout(() => setCardsLocked(true), 2500);
  };

  const runMap = () => {
    audio.playMapPhase();
    setShowCards(false);
    setCardsLocked(false);
    setTimeout(() => {
      setShowMap(true);
      // Drop pins progressively
      MAP_PINS.forEach((pin, i) => {
        setTimeout(() => setPinsVisible(i + 1), pin.delay + 600);
      });
    }, 400);
    // Risk counter
    setTimeout(() => {
      setShowRisk(true);
      let n = 0;
      const iv = setInterval(() => {
        n++;
        setRiskCount(n);
        if (n >= 82) clearInterval(iv);
      }, 600 / 82);
    }, 1500);
  };

  const runAssembly = () => {
    audio.playAssemblyPhase();
    setShowMap(false); setShowRisk(false); setPinsVisible(0);
    setShowScanlines(true);
    particles.assembleLogo();
    setTimeout(() => setShowLogoDOM(true), 2200);
  };

  const runTagline = () => {
    audio.playTaglinePhase();
    setShowScanlines(false);
    setShowCursor(true);
    const text = 'Forensic Intelligence System';
    let i = 0;
    const iv = setInterval(() => {
      setTagline(text.slice(0, ++i));
      audio.playTypeClick();
      if (i >= text.length) {
        clearInterval(iv);
        setTimeout(() => setShowSubtitle(true), 300);
        setTimeout(() => setShowChips(true), 800);
        setTimeout(() => setShowCaseBar(true), 1400);
      }
    }, 45);
  };

  const runSplit = () => {
    audio.playSplitPhase();
    setShowCrack(true);
    setTimeout(() => { setShowCrack(false); setSplitOpen(true); }, 300);
  };

  const handleSkip = useCallback(() => {
    setFadeOut(true);
    setTimeout(onComplete, 500);
  }, [onComplete]);

  const riskColor = riskCount < 40 ? '#10B981' : riskCount < 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className={`intro-root${fadeOut ? ' fading' : ''}`}>
      <canvas ref={canvasRef} className="intro-canvas" />
      {showScanlines && <div className="scanline-overlay" />}

      {/* ── DNA LABELS ── */}
      <AnimatePresence>
        {phase === 'dna' && (
          <div className="dna-labels">
            {[
              { cls: 'tl', label: '[ ATCG-4471-XX ]', delay: 1.0 },
              { cls: 'tr', label: '[ PMI: 18-21h ]', delay: 1.1 },
              { cls: 'bl', label: '[ MATCH: 94% ]', delay: 1.2 },
              { cls: 'br', label: '[ SAMPLE: B-007 ]', delay: 1.3 },
            ].map(({ cls, label, delay }) => (
              <div
                key={cls}
                className={`dna-label ${cls}`}
                style={{ animationDelay: `${delay}s` }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── EVIDENCE CARDS ── */}
      <AnimatePresence>
        {showCards && (
          <div className="evidence-grid">
            {EVIDENCE_CARDS.map((card, i) => (
              <div
                key={i}
                className={`evidence-card ${card.variant} ${card.dir}${cardsLocked ? ' locked' : ''}`}
              >
                {card.content}
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── MAP ── */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {MAP_PINS.slice(0, pinsVisible).map((pin, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute flex flex-col items-center"
                style={{ left: pin.x, top: pin.y, transform: 'translate(-50%,-50%)' }}
              >
                <div
                  className="rounded-full animate-pulse"
                  style={{
                    width: pin.size, height: pin.size,
                    background: pin.color,
                    boxShadow: `0 0 ${pin.size * 2}px ${pin.color}`,
                  }}
                />
                <span
                  className="font-mono text-[8px] mt-1 whitespace-nowrap"
                  style={{ color: pin.color, opacity: 0.8 }}
                >
                  {pin.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RISK COUNTER ── */}
      <AnimatePresence>
        {showRisk && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="risk-counter"
          >
            <div className="risk-label-top">RISK SCORE</div>
            <div className="risk-number" style={{ color: riskColor }}>
              {String(riskCount).padStart(2, '0')}
            </div>
            <div className="risk-status" style={{ color: riskColor }}>
              {riskCount >= 70 ? 'CRITICAL' : riskCount >= 40 ? 'ELEVATED' : 'NOMINAL'}
            </div>
            <div className="risk-bar">
              <div
                className="risk-fill"
                style={{ width: `${riskCount}%`, backgroundColor: riskColor }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOGO DOM ── */}
      <AnimatePresence>
        {showLogoDOM && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="intro-logo"
          >
            <span className="logo-hex">⬡</span>
            {'AIVENTRA'.split('').map((ch, i) => (
              <span
                key={i}
                className="logo-char"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                {ch}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TAGLINE ── */}
      <AnimatePresence>
        {(phase === 'tagline' || phase === 'split') && (
          <div className="intro-tagline-block">
            <div className="tagline-main">
              {tagline}
              {showCursor && <span className="tagline-cursor">█</span>}
            </div>

            {showSubtitle && (
              <div className="tagline-sub">AI · Forensics · IoT · Intelligence</div>
            )}

            {showChips && (
              <div className="chips-row">
                {[
                  '● GEMMA AI ACTIVE',
                  '■ IoT SENSORS: 8/10',
                  '◆ RISK SCORE: 82',
                  '▲ ANOMALIES: 7',
                ].map((chip, i) => (
                  <div
                    key={i}
                    className="chip"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {chip}
                  </div>
                ))}
              </div>
            )}

            {showCaseBar && (
              <div className="case-bar">
                ▸ ACTIVE CASE: CI-2025-014 · Industrial District Homicide ·{' '}
                <span style={{ color: '#EF4444' }}>CRITICAL</span>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ── SPLIT PANELS ── */}
      {showCrack && <div className="crack-line" />}
      <div className={`split-panel left${splitOpen ? ' open' : ''}`} />
      <div className={`split-panel right${splitOpen ? ' open' : ''}`} />

      {/* ── SKIP ── */}
      <button className="skip-btn" onClick={handleSkip} aria-label="Skip intro">
        Skip ↗
      </button>

      <div role="status" aria-live="polite" className="sr-only">
        AIVENTRA Forensic Intelligence System loading. Press any key to skip.
      </div>
    </div>
  );
}
