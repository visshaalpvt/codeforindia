/**
 * AIVENTRA Intro — Procedural Audio Engine
 * All sounds synthesized via Web Audio API (no audio files needed)
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Master gain (keeps everything from clipping) ───────────────────────────
function master(ac: AudioContext): GainNode {
  const g = ac.createGain();
  g.gain.value = 0.6;
  g.connect(ac.destination);
  return g;
}

// ─── Knife Throw / Whoosh ────────────────────────────────────────────────────
// A pitched noise burst that sweeps down like a blade cutting air
export function playKnifeThrow() {
  try {
    const ac = getCtx();
    const out = master(ac);
    const t = ac.currentTime;

    // White noise source
    const bufLen = ac.sampleRate * 0.35;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ac.createBufferSource();
    noise.buffer = buf;

    // Band-pass filter to give it a "whoosh" character
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3000, t);
    bp.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    bp.Q.value = 1.5;

    // Sharp volume envelope — fast attack, quick decay
    const env = ac.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1.2, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Pitch sweep oscillator layered on top for the metallic edge
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    const oscGain = ac.createGain();
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(bp);
    bp.connect(env);
    env.connect(out);
    osc.connect(oscGain);
    oscGain.connect(out);

    noise.start(t);
    noise.stop(t + 0.35);
    osc.start(t);
    osc.stop(t + 0.22);
  } catch (_) {}
}

// ─── Metallic Thud (for chips / UI drops) ───────────────────────────────────
export function playThud(pitch = 1) {
  try {
    const ac = getCtx();
    const out = master(ac);
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(40 * pitch, t + 0.12);

    const env = ac.createGain();
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    // Short noise click for attack transient
    const bufLen = ac.sampleRate * 0.04;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const click = ac.createBufferSource();
    click.buffer = buf;
    const clickGain = ac.createGain();
    clickGain.gain.value = 0.5;

    osc.connect(env); env.connect(out);
    click.connect(clickGain); clickGain.connect(out);

    osc.start(t); osc.stop(t + 0.18);
    click.start(t); click.stop(t + 0.05);
  } catch (_) {}
}

// ─── Crisp UI Ping (completion / divider) ───────────────────────────────────
export function playPing(freq = 1200) {
  try {
    const ac = getCtx();
    const out = master(ac);
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, t + 0.01);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.4);

    const env = ac.createGain();
    env.gain.setValueAtTime(0.7, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(env); env.connect(out);
    osc.start(t); osc.stop(t + 0.42);
  } catch (_) {}
}

// ─── Deep Power-On Rumble (initial boot) ─────────────────────────────────────
export function playBoot() {
  try {
    const ac = getCtx();
    const out = master(ac);
    const t = ac.currentTime;

    // Sub bass sweep
    const sub = ac.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(30, t);
    sub.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    const subGain = ac.createGain();
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.8, t + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    // High-pass noise layer
    const bufLen = ac.sampleRate * 0.6;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    sub.connect(subGain); subGain.connect(out);
    noise.connect(hp); hp.connect(noiseGain); noiseGain.connect(out);

    sub.start(t); sub.stop(t + 0.75);
    noise.start(t); noise.stop(t + 0.6);
  } catch (_) {}
}

// ─── Fast Swipe (logo letter by letter) ─────────────────────────────────────
export function playSwipe(i: number) {
  try {
    const ac = getCtx();
    const out = master(ac);
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'triangle';
    const base = 600 - i * 30;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.6, t + 0.07);

    const env = ac.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(env); env.connect(out);
    osc.start(t); osc.stop(t + 0.1);
  } catch (_) {}
}
