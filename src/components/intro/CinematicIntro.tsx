'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticleEngine } from './useParticleEngine';
import { useAudioEngine } from './useAudioEngine';

type Phase = 'void' | 'explosion' | 'assembly' | 'typewriter' | 'split' | 'boot' | 'fade' | 'complete';

interface Props {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('void');
  const [taglineText, setTaglineText] = useState('');
  const [showChips, setShowChips] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const { playPhase } = useAudioEngine();
  const { startParticles, stopParticles, explode, assembleLogo } = useParticleEngine(canvasRef);

  // Phase timeline
  useEffect(() => {
    const sequence = [
      { phase: 'void' as Phase,       at: 0    },
      { phase: 'explosion' as Phase,  at: 1500 },
      { phase: 'assembly' as Phase,   at: 3000 },
      { phase: 'typewriter' as Phase, at: 5000 },
      { phase: 'split' as Phase,      at: 6500 },
      { phase: 'boot' as Phase,       at: 8000 },
      { phase: 'fade' as Phase,       at: 9000 },
      { phase: 'complete' as Phase,   at: 10000 },
    ];

    const timers = sequence.map(({ phase, at }) =>
      setTimeout(() => setPhase(phase), at)
    );

    startParticles();

    return () => {
      timers.forEach(clearTimeout);
      stopParticles();
    };
  }, []);

  // React to phase changes
  useEffect(() => {
    playPhase(phase);
    if (phase === 'explosion') explode();
    if (phase === 'assembly') assembleLogo();
    if (phase === 'typewriter') startTypewriter();
    if (phase === 'split') setSplitOpen(true);
    if (phase === 'fade') setFadeOut(true);
    if (phase === 'complete') onComplete();
  }, [phase]);

  // Typewriter effect
  const startTypewriter = () => {
    const text = 'Forensic Intelligence System';
    let i = 0;
    const interval = setInterval(() => {
      setTaglineText(text.slice(0, ++i));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => setShowChips(true), 500);
      }
    }, 55);
  };

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Logo Overlay */}
      <div className={`relative flex items-center gap-4 text-[#00F5FF] text-6xl md:text-8xl font-bold tracking-[0.08em] transition-opacity duration-500 ${phase === 'assembly' || phase === 'typewriter' || phase === 'split' ? 'opacity-100' : 'opacity-0'}`}>
        <span className="drop-shadow-[0_0_20px_rgba(0,245,255,0.8)]">⬡</span>
        <div className="flex">
          {'AIVENTRA'.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={(phase === 'assembly' || phase === 'typewriter' || phase === 'split') ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.4, ease: "easeOut" }}
              className="drop-shadow-[0_0_40px_rgba(0,245,255,0.4)]"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Tagline typewriter */}
      {(phase === 'typewriter' || phase === 'split') && (
        <div className="absolute top-[calc(50%+80px)] left-1/2 -translate-x-1/2 font-mono text-lg text-slate-400 whitespace-nowrap tracking-wider">
          <span>{taglineText}</span>
          <span className="ml-1 text-[#00F5FF] animate-pulse">█</span>
        </div>
      )}

      {/* Status chips */}
      {showChips && (
        <div className="absolute top-[calc(50%+120px)] left-1/2 -translate-x-1/2 flex gap-4">
          {['● LIVE SYSTEM', '■ AI CORE ACTIVE', '◆ SENSORS ONLINE'].map((chip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="px-3 py-1 border border-cyan-500/20 rounded text-[10px] text-[#00F5FF] font-mono tracking-widest"
            >
              {chip}
            </motion.div>
          ))}
        </div>
      )}

      {/* Split panels Reveal */}
      <div className={`fixed top-0 left-0 w-1/2 h-full bg-black z-[9998] transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${splitOpen ? '-translate-x-full' : 'translate-x-0'}`} />
      <div className={`fixed top-0 right-0 w-1/2 h-full bg-black z-[9998] transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${splitOpen ? 'translate-x-full' : 'translate-x-0'}`} />

      {/* Split Crack Line */}
      {phase === 'split' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3] }}
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-cyan-400 z-[9999] shadow-[0_0_20px_#00F5FF]"
        />
      )}

      {/* Skip button */}
      <button 
        onClick={handleSkip}
        className="fixed bottom-8 right-8 px-4 py-2 border border-white/10 rounded font-mono text-xs text-white/40 hover:text-cyan-400 hover:border-cyan-500/40 transition-all z-[10000]"
      >
        Skip intro
      </button>
    </div>
  );
}
