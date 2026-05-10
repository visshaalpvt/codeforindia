'use client';

export function useAudioEngine() {
  let audioCtx: AudioContext | null = null;
  let masterGain: GainNode | null = null;

  const initAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5; // Slightly lower for comfort
    masterGain.connect(audioCtx.destination);
  };

  const playTone = (
    freq: number,
    type: OscillatorType,
    duration: number,
    gainPeak: number,
    delay: number = 0,
    freqEnd?: number
  ) => {
    if (!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = type;
    const t = audioCtx.currentTime + delay / 1000;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration / 1000);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + duration / 1000);
    osc.start(t);
    osc.stop(t + duration / 1000 + 0.05);
  };

  const playWhiteNoise = (duration: number, gain: number, delay: number = 0) => {
    if (!audioCtx || !masterGain) return;
    const bufferSize = audioCtx.sampleRate * (duration / 1000);
    const buffer = audioCtx.createBuffer(1, Math.max(1, bufferSize), audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = gain;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain!);
    source.start(audioCtx.currentTime + delay / 1000);
  };

  const playPhase = (phase: string) => {
    if (!audioCtx) initAudio();

    switch (phase) {
      case 'void':
        // Deep bass hit at 800ms
        setTimeout(() => {
          playTone(40, 'sine', 600, 0.9);
          playTone(80, 'sine', 600, 0.4);
          // Shockwave ring
          setTimeout(() => playTone(200, 'sine', 400, 0.3, 0, 80), 400);
        }, 800);
        break;

      case 'explosion':
        // Rising hum
        playTone(60, 'sawtooth', 1500, 0.15, 0, 200);
        // White noise electricity
        playWhiteNoise(1500, 0.03);
        // Spark clicks every 200ms
        [0, 200, 400, 600, 800, 1000, 1200].forEach(d =>
          playTone(800, 'square', 30, 0.1, d)
        );
        break;

      case 'assembly':
        // Letter snap clicks
        'AIVENTRA'.split('').forEach((_, i) =>
          playTone(400 + Math.random() * 400, 'square', 40, 0.2, i * 120)
        );
        // Power-on chime at ~1400ms
        setTimeout(() => {
          playTone(523, 'triangle', 80, 0.3, 0);
          playTone(659, 'triangle', 80, 0.3, 100);
          playTone(783, 'triangle', 200, 0.4, 200);
        }, 1400);
        break;

      case 'split':
        // Cinematic whoosh
        playWhiteNoise(1000, 0.15);
        // Lock-unlock clicks
        setTimeout(() => {
          playTone(300, 'square', 30, 0.3, 900);
          playTone(200, 'square', 40, 0.4, 950);
        }, 0);
        break;

      case 'boot':
        // Sweep noise
        playWhiteNoise(600, 0.1);
        // System ready chime
        setTimeout(() => {
          [
            { f: 261, d: 0 },
            { f: 329, d: 80 },
            { f: 392, d: 160 },
            { f: 523, d: 240 },
          ].forEach(({ f, d }) => playTone(f, 'triangle', 60, 0.25, d));
        }, 800);
        break;

      case 'fade':
        // Ambient pad fades in
        playTone(110, 'sine', 2000, 0.05);
        break;
    }
  };

  return { initAudio, playPhase };
}
