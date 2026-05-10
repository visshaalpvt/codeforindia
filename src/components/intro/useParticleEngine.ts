'use client';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  color: string;
  type: 'dot' | 'hex';
  friction: number;
  life: number; decay: number;
  targetX?: number; targetY?: number;
  assembling?: boolean;
}

export function useParticleEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  let particles: Particle[] = [];
  let animFrame: number;
  let mode: 'explode' | 'assemble' | 'idle' = 'idle';

  const getLogoPositions = (canvas: HTMLCanvasElement): {targetX: number, targetY: number}[] => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = 200;
    const offCtx = offCanvas.getContext('2d')!;
    offCtx.fillStyle = '#fff';
    offCtx.font = `700 ${Math.min(96, canvas.width / 10)}px "Space Grotesk", sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText('⬡  AIVENTRA', canvas.width / 2, 100);
    
    const data = offCtx.getImageData(0, 0, canvas.width, 200).data;
    const positions = [];
    const step = 4; // Particle density
    for (let x = 0; x < canvas.width; x += step) {
      for (let y = 0; y < 200; y += step) {
        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          positions.push({ targetX: x, targetY: canvas.height / 2 - 100 + y });
        }
      }
    }
    return positions;
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections (only for nearby active particles)
    if (mode !== 'idle') {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < Math.min(i + 15, particles.length); j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(0, 245, 255, ${0.12 * (1 - dist/100) * a.opacity})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    // Draw particles
    particles.forEach(p => {
      if (mode === 'assemble' && p.targetX !== undefined) {
        const ease = 0.07;
        p.x += (p.targetX - p.x) * ease;
        p.y += (p.targetY! - p.y) * ease;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.life -= p.decay;
        p.opacity = p.life;
      }

      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.type === 'hex') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          i === 0
            ? ctx.moveTo(p.x + p.size * Math.cos(a), p.y + p.size * Math.sin(a))
            : ctx.lineTo(p.x + p.size * Math.cos(a), p.y + p.size * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    });

    // Clean up dead particles (only in explode mode)
    if (mode === 'explode') {
      particles = particles.filter(p => p.life > 0);
    }
  };

  const startParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      draw(ctx, canvas);
      animFrame = requestAnimationFrame(loop);
    };
    loop();
  };

  const stopParticles = () => {
    cancelAnimationFrame(animFrame);
  };

  const explode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    mode = 'explode';
    const cx = canvas.width / 2, cy = canvas.height / 2;

    for (let i = 0; i < 220; i++) {
      const angle = (Math.PI * 2 * i) / 220 + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2.5,
        opacity: 1, life: 1,
        color: Math.random() > 0.6 ? '#00F5FF' : '#ffffff',
        type: Math.random() > 0.85 ? 'hex' : 'dot',
        friction: 0.96,
        decay: 0.004 + Math.random() * 0.003
      });
    }
  };

  const assembleLogo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    mode = 'assemble';
    const logoPositions = getLogoPositions(canvas);

    logoPositions.forEach((pos, i) => {
      if (i < particles.length) {
        particles[i].targetX = pos.targetX;
        particles[i].targetY = pos.targetY;
        particles[i].opacity = 1;
        particles[i].color = '#00F5FF';
        particles[i].size = 1.5;
      } else {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0, vy: 0,
          targetX: pos.targetX, targetY: pos.targetY,
          size: 1.5, opacity: 1, life: 1, decay: 0,
          color: '#00F5FF', type: 'dot', friction: 1
        });
      }
    });

    particles = particles.slice(0, logoPositions.length);
  };

  return { startParticles, stopParticles, explode, assembleLogo };
}
