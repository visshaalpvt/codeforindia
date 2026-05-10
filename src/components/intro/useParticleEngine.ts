'use client';

import React from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  ax: number; ay: number;
  size: number; opacity: number;
  color: string;
  type: 'dot' | 'hex';
  friction: number;
  life: number; decay: number;
  targetX?: number; targetY?: number;
}

interface Shockwave {
  r: number; maxR: number; opacity: number; speed: number;
}

export function useParticleEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  let particles: Particle[] = [];
  let shockwaves: Shockwave[] = [];
  let animFrame: number = 0;
  let mode: 'idle' | 'dna' | 'explode' | 'assemble' = 'idle';
  let dnaRotation = 0;
  let buildProgress = 0;
  let buildStart = 0;
  let logoPositions: { targetX: number; targetY: number }[] = [];

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

  // ---- DNA Helix Drawing ----
  const drawDNA = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const H = canvas.height * 0.65;
    const W = isMobile() ? 50 : 80;
    const DOTS = isMobile() ? 30 : 60;
    const RUNGS = isMobile() ? 12 : 24;

    for (let i = 0; i < DOTS; i++) {
      const frac = i / DOTS;
      // Only draw within build progress range (grows from center)
      if (Math.abs(frac - 0.5) > progress * 0.5) continue;
      const t = frac * Math.PI * 4;
      const y = (cy - H / 2) + frac * H;
      const x1 = cx + W * Math.sin(t + dnaRotation);
      const x2 = cx + W * Math.sin(t + dnaRotation + Math.PI);
      const z1 = Math.sin(t + dnaRotation);
      const z2 = Math.sin(t + dnaRotation + Math.PI);
      const s1 = 1.5 + (z1 + 1) * 2;
      const s2 = 1.5 + (z2 + 1) * 2;
      const a1 = 0.35 + (z1 + 1) * 0.3;
      const a2 = 0.35 + (z2 + 1) * 0.3;

      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00F5FF';
      ctx.fillStyle = `rgba(0,245,255,${a1})`;
      ctx.beginPath(); ctx.arc(x1, y, s1, 0, Math.PI * 2); ctx.fill();

      ctx.shadowColor = '#F59E0B';
      ctx.fillStyle = `rgba(245,158,11,${a2})`;
      ctx.beginPath(); ctx.arc(x2, y, s2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (let r = 0; r < RUNGS; r++) {
      const frac = r / RUNGS;
      if (Math.abs(frac - 0.5) > progress * 0.5) continue;
      const t = frac * Math.PI * 4;
      const y = (cy - H / 2) + frac * H;
      const x1 = cx + W * Math.sin(t + dnaRotation);
      const x2 = cx + W * Math.sin(t + dnaRotation + Math.PI);
      const z = Math.sin(t + dnaRotation);
      const a = 0.12 + (z + 1) * 0.08;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${a * 1.5})`;
      ctx.beginPath(); ctx.arc((x1 + x2) / 2, y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  };

  // ---- Shockwave Drawing ----
  const drawShockwaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    shockwaves = shockwaves.filter(sw => sw.opacity > 0.01);
    shockwaves.forEach(sw => {
      ctx.beginPath();
      ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,245,255,${sw.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      sw.r += sw.speed;
      sw.opacity *= 0.92;
    });
  };

  // ---- Particle Connections ----
  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < Math.min(i + 12, particles.length); j++) {
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 90) {
          ctx.strokeStyle = `rgba(0,245,255,${0.1 * (1 - dist / 90) * a.opacity})`;
          ctx.lineWidth = 0.3;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
  };

  // ---- Draw Particles ----
  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    particles.forEach(p => {
      if (mode === 'assemble' && p.targetX !== undefined) {
        p.ax = (p.targetX - p.x) * 0.008;
        p.ay = (p.targetY! - p.y) * 0.008;
        p.vx = (p.vx + p.ax) * 0.88;
        p.vy = (p.vy + p.ay) * 0.88;
        p.x += p.vx; p.y += p.vy;
      } else {
        p.x += p.vx; p.y += p.vy;
        p.vx *= p.friction; p.vy *= p.friction;
        p.life -= p.decay;
        p.opacity = Math.max(0, p.life);
      }

      if (p.opacity <= 0) return;
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      if (p.type === 'hex') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          i === 0
            ? ctx.moveTo(p.x + p.size * Math.cos(a), p.y + p.size * Math.sin(a))
            : ctx.lineTo(p.x + p.size * Math.cos(a), p.y + p.size * Math.sin(a));
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    if (mode === 'explode') {
      particles = particles.filter(p => p.life > 0.01);
    }
  };

  // ---- Main Render Loop ----
  const startLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      ctx.fillStyle = mode === 'assemble' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawShockwaves(ctx, canvas);

      if (mode === 'dna') {
        const elapsed = Date.now() - buildStart;
        buildProgress = Math.min(1, elapsed / 1000);
        drawDNA(ctx, canvas, buildProgress);
        dnaRotation += 0.018;
      }

      if (mode === 'explode' || mode === 'assemble') {
        drawConnections(ctx);
        drawParticles(ctx, canvas);
      }

      animFrame = requestAnimationFrame(loop);
    };
    loop();
  };

  const stopLoop = () => cancelAnimationFrame(animFrame);

  // ---- Triggers ----
  const triggerShockwaves = () => {
    shockwaves.push({ r: 0, maxR: 60, opacity: 1, speed: 3 });
    setTimeout(() => shockwaves.push({ r: 0, maxR: 120, opacity: 0.7, speed: 3.5 }), 100);
    setTimeout(() => shockwaves.push({ r: 0, maxR: 200, opacity: 0.4, speed: 4 }), 200);
  };

  const startDNA = () => {
    mode = 'dna';
    buildStart = Date.now();
    buildProgress = 0;
  };

  const explode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    mode = 'explode';
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const MAX = isMobile() ? 300 : 600;
    for (let i = 0; i < MAX; i++) {
      const angle = (Math.PI * 2 * i) / MAX + (Math.random() - 0.5) * 0.3;
      const speed = 1 + Math.random() * 6;
      particles.push({
        x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        ax: 0, ay: 0,
        size: 1 + Math.random() * 2.5,
        opacity: 1, life: 1,
        color: Math.random() > 0.55 ? '#00F5FF' : Math.random() > 0.5 ? '#F59E0B' : '#ffffff',
        type: Math.random() > 0.82 ? 'hex' : 'dot',
        friction: 0.96, decay: 0.003 + Math.random() * 0.003
      });
    }
  };

  const getLogoPositions = (canvas: HTMLCanvasElement) => {
    const off = document.createElement('canvas');
    off.width = canvas.width; off.height = 300;
    const ctx = off.getContext('2d')!;
    const fs = Math.min(isMobile() ? 48 : 96, canvas.width / 9);
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⬡  AIVENTRA', canvas.width / 2, 150);
    const data = ctx.getImageData(0, 0, canvas.width, 300).data;
    const step = isMobile() ? 5 : 3;
    const pos: { targetX: number; targetY: number }[] = [];
    for (let x = 0; x < canvas.width; x += step)
      for (let y = 0; y < 300; y += step)
        if (data[(y * canvas.width + x) * 4 + 3] > 128)
          pos.push({ targetX: x, targetY: canvas.height / 2 - 150 + y });
    return pos;
  };

  const assembleLogo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    mode = 'assemble';
    logoPositions = getLogoPositions(canvas);
    logoPositions.forEach((pos, i) => {
      if (i < particles.length) {
        particles[i].targetX = pos.targetX;
        particles[i].targetY = pos.targetY;
        particles[i].opacity = 1; particles[i].life = 1;
        particles[i].color = '#00F5FF'; particles[i].size = 1.5;
        particles[i].vx *= 0.3; particles[i].vy *= 0.3;
      } else {
        particles.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          vx: 0, vy: 0, ax: 0, ay: 0,
          targetX: pos.targetX, targetY: pos.targetY,
          size: 1.5, opacity: 1, life: 1, decay: 0,
          color: '#00F5FF', type: 'dot', friction: 1
        });
      }
    });
    particles = particles.slice(0, logoPositions.length);
  };

  const resetParticles = () => { particles = []; shockwaves = []; mode = 'idle'; };

  return { startLoop, stopLoop, triggerShockwaves, startDNA, explode, assembleLogo, resetParticles };
}
