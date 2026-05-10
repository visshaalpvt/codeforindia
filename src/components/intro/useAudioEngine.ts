'use client';

import { useRef, useCallback } from 'react';

export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGainRef.current = audioCtxRef.current.createGain();
    masterGainRef.current.gain.value = 0.55;
    masterGainRef.current.connect(audioCtxRef.current.destination);
  }, []);

  const playTone = useCallback((
    freq: number,
    type: OscillatorType,
    duration: number,
    gainPeak: number,
    delay: number = 0,
    freqEnd?: number
  ) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = type;
      const t = ctx.currentTime + delay / 1000;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration / 1000);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainPeak, t + 0.012);
      gain.gain.linearRampToValueAtTime(0, t + duration / 1000);
      osc.start(t);
      osc.stop(t + duration / 1000 + 0.05);
    } catch (e) { /* audio context may be suspended */ }
  }, []);

  const playWhiteNoise = useCallback((duration: number, gain: number, delay: number = 0) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    try {
      const bufferSize = Math.max(1, ctx.sampleRate * (duration / 1000));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(master);
      source.start(ctx.currentTime + delay / 1000);
    } catch (e) { /* ignore */ }
  }, []);

  const playVoidPhase = useCallback(() => {
    setTimeout(() => {
      playTone(35, 'sine', 800, 1.0);
      playTone(70, 'sine', 800, 0.5);
      playTone(140, 'sine', 400, 0.2);
      setTimeout(() => {
        playTone(180, 'sine', 600, 0.3, 0, 60);
        playWhiteNoise(300, 0.04);
      }, 400);
    }, 600);
  }, [playTone, playWhiteNoise]);

  const playDNAPhase = useCallback(() => {
    playTone(110, 'sine', 3000, 0.08, 0, 220);
    playTone(165, 'sine', 3000, 0.05, 200, 330);
    playTone(220, 'triangle', 2000, 0.04, 500);
    playWhiteNoise(3000, 0.015);
    for (let i = 0; i < 24; i++) {
      setTimeout(() => playTone(400 + i * 30, 'square', 20, 0.06), 1000 + i * 50);
    }
  }, [playTone, playWhiteNoise]);

  const playEvidencePhase = useCallback(() => {
    playTone(800, 'square', 100, 0.08);
    [0, 300, 300, 600, 600, 900].forEach((delay, i) => {
      setTimeout(() => {
        playTone(600 - i * 30, 'square', 60, 0.12);
        playTone(1200 - i * 60, 'triangle', 40, 0.06);
      }, delay + 800);
    });
    setTimeout(() => {
      playTone(200, 'sawtooth', 400, 0.08, 0, 800);
      playWhiteNoise(400, 0.03);
    }, 2000);
    setTimeout(() => {
      playTone(523, 'triangle', 150, 0.2);
      playTone(659, 'triangle', 150, 0.2, 80);
      playTone(783, 'triangle', 200, 0.25, 160);
    }, 3500);
  }, [playTone, playWhiteNoise]);

  const playMapPhase = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => playTone(300, 'square', 15, 0.04), i * 30);
    }
    const pinDelays = [0, 200, 400, 600, 800, 1000, 1200, 1400];
    pinDelays.forEach((d, i) => {
      setTimeout(() => {
        playTone(i % 2 === 0 ? 120 : 200, 'sine', 150, 0.15);
        playTone(i % 2 === 0 ? 240 : 400, 'triangle', 80, 0.08);
      }, 700 + d);
    });
    setTimeout(() => playTone(440, 'sine', 800, 0.04, 0, 880), 1600);
    setTimeout(() => {
      playTone(880, 'sawtooth', 200, 0.15);
      playTone(440, 'sawtooth', 200, 0.1, 100);
    }, 2500);
  }, [playTone]);

  const playAssemblyPhase = useCallback(() => {
    playTone(55, 'sine', 2500, 0.06);
    playTone(110, 'sine', 2500, 0.04);
    playTone(220, 'sine', 2000, 0.02, 500);
    for (let i = 0; i < 40; i++) {
      setTimeout(() => playTone(2000 - i * 30, 'square', 15, 0.03), 800 + i * 40);
    }
    setTimeout(() => {
      [
        { f: 523, d: 0, dur: 300 },
        { f: 659, d: 100, dur: 250 },
        { f: 783, d: 200, dur: 200 },
        { f: 1046, d: 300, dur: 400 },
      ].forEach(({ f, d, dur }) => playTone(f, 'triangle', dur, 0.3, d));
      playTone(65, 'sine', 400, 0.4, 0);
      [0, 150, 300].forEach(d => playTone(200, 'sine', 500, 0.1, d, 80));
    }, 3000);
  }, [playTone]);

  const playTaglinePhase = useCallback(() => {
    setTimeout(() => playTone(220, 'triangle', 200, 0.1), 1600);
  }, [playTone]);

  const playTypeClick = useCallback(() => {
    playTone(1200, 'square', 15, 0.06);
  }, [playTone]);

  const playSplitPhase = useCallback(() => {
    playTone(55, 'sine', 300, 0.2, 0, 110);
    setTimeout(() => {
      playTone(800, 'square', 40, 0.3);
      playWhiteNoise(200, 0.1);
    }, 200);
    setTimeout(() => playWhiteNoise(1000, 0.12), 300);
    setTimeout(() => {
      playTone(250, 'square', 40, 0.4);
      playTone(180, 'square', 60, 0.3, 30);
    }, 1300);
    setTimeout(() => {
      [
        { f: 261, d: 0 },
        { f: 329, d: 80 },
        { f: 392, d: 160 },
        { f: 523, d: 240 },
      ].forEach(({ f, d }) => playTone(f, 'triangle', 80, 0.25, d));
    }, 1500);
    setTimeout(() => playTone(110, 'sine', 2000, 0.04), 1800);
  }, [playTone, playWhiteNoise]);

  return {
    initAudio,
    playTone,
    playWhiteNoise,
    playVoidPhase,
    playDNAPhase,
    playEvidencePhase,
    playMapPhase,
    playAssemblyPhase,
    playTaglinePhase,
    playTypeClick,
    playSplitPhase,
  };
}
