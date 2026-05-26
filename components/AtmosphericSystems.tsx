'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WispParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  phaseSpeed: number;
}

interface ClothFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  length: number;
  width: number;
  alpha: number;
  phase: number;
  speed: number;
}

interface BurstFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  length: number;
  width: number;
  alpha: number;
  t: number; // 0 → 1 lifetime progress
}

// ─── Village Hover Context ────────────────────────────────────────────────────

interface VillageHoverContextValue {
  triggerBurst: (villageId: string, x: number, y: number) => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
}

export const VillageHoverContext = createContext<VillageHoverContextValue>({
  triggerBurst: () => {},
  registerCanvas: () => {},
});

export function useVillageHover() {
  return useContext(VillageHoverContext);
}

// ─── 1. JourneyFog ────────────────────────────────────────────────────────────
// Canvas volumetric fog layer — 8-12 soft radial gradient wisps drifting slowly.

export function JourneyFog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const ww = () => canvas.offsetWidth;
    const hh = () => canvas.offsetHeight;

    // Build 10 wisps with random initial state
    const COUNT = 10;
    const wisps: WispParticle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * ww(),
      y: Math.random() * hh(),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.04,
      radius: 80 + Math.random() * 120, // 80–200px
      alpha: 0.015 + Math.random() * 0.025, // very subtle
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.003 + Math.random() * 0.004,
    }));

    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, ww(), hh());

      const W = ww();
      const H = hh();

      wisps.forEach((w) => {
        // Drift
        w.x += w.vx;
        w.y += w.vy;
        w.phase += w.phaseSpeed;

        // Wrap around edges
        if (w.x < -w.radius) w.x = W + w.radius;
        if (w.x > W + w.radius) w.x = -w.radius;
        if (w.y < -w.radius) w.y = H + w.radius;
        if (w.y > H + w.radius) w.y = -w.radius;

        // Pulse alpha softly
        const pulseAlpha = w.alpha * (0.6 + 0.4 * Math.sin(w.phase));

        // Radial gradient: dark forest green center → warm haze at edge
        const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.radius);
        grad.addColorStop(0, `rgba(12, 35, 20, ${pulseAlpha * 0.4})`);
        grad.addColorStop(0.4, `rgba(30, 55, 30, ${pulseAlpha * 0.25})`);
        grad.addColorStop(0.75, `rgba(180, 140, 60, ${pulseAlpha * 0.12})`);
        grad.addColorStop(1, `rgba(255, 220, 120, 0.0)`);

        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        zIndex: 2,
      }}
    />
  );
}

// ─── 2. ClothParticles ────────────────────────────────────────────────────────
// Journey's signature floating cloth/fabric fragments — golden ribbons drifting upward.

export function ClothParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const ww = () => canvas.offsetWidth;
    const hh = () => canvas.offsetHeight;

    // Golden cloth color palette
    const COLORS = [
      'rgba(232, 201, 109, 0.6)',
      'rgba(255, 235, 150, 0.5)',
      'rgba(255, 251, 232, 0.3)',
      'rgba(210, 175, 80, 0.55)',
      'rgba(245, 220, 130, 0.45)',
    ];

    const COUNT = 18;
    const makeFragment = (spawnAtBottom: boolean): ClothFragment => ({
      x: Math.random() * ww(),
      y: spawnAtBottom ? hh() + Math.random() * 40 : Math.random() * hh(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.25 + Math.random() * 0.5), // upward drift
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      length: 8 + Math.random() * 6, // 8–14px
      width: 2 + Math.random() * 2,  // 2–4px
      alpha: 0.3 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.2,
    });

    const fragments: ClothFragment[] = Array.from({ length: COUNT }, () =>
      makeFragment(false)
    );

    let t = 0;
    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, ww(), hh());
      t += 0.016;

      const W = ww();
      const H = hh();
      const colorIdx = Math.floor(Math.random() * COLORS.length); // won't change per frame, just pre-pick

      fragments.forEach((f, i) => {
        // Sinusoidal horizontal sway
        f.x += Math.sin(t * f.speed + f.phase) * 0.3 + f.vx;
        f.y += f.vy;
        f.rotation += f.rotationSpeed;
        f.phase += 0.01;

        // Respawn at bottom when exits top
        if (f.y < -f.length - 10) {
          const fresh = makeFragment(true);
          fragments[i] = fresh;
          return;
        }

        // Wrap horizontal
        if (f.x < -20) f.x = W + 20;
        if (f.x > W + 20) f.x = -20;

        // Draw ribbon shape
        const color = COLORS[i % COLORS.length];
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = f.alpha * (0.7 + 0.3 * Math.sin(f.phase));
        ctx.fillStyle = color;
        ctx.shadowColor = 'rgba(232, 201, 109, 0.4)';
        ctx.shadowBlur = 6;
        // Elongated ribbon: fillRect centered
        ctx.fillRect(-f.width / 2, -f.length / 2, f.width, f.length);
        ctx.restore();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}

// ─── 3. LightRays ─────────────────────────────────────────────────────────────
// SVG crepuscular light rays emanating from the hub center.

interface LightRaysProps {
  /** Center X in pixels — pass hub.x */
  cx?: number;
  /** Center Y in pixels — pass hub.y */
  cy?: number;
}

export function LightRays({ cx, cy }: LightRaysProps) {
  const [dims, setDims] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const W = dims.w;
  const H = dims.h;
  const centerX = cx ?? W / 2;
  const centerY = cy ?? H * 0.5;
  const minDim = Math.min(W, H);

  // 8 base rays + 4 brighter pulsing rays
  const BASE_COUNT = 8;
  const PULSE_COUNT = 4;

  // Base rays: equal angular spacing, varying length 30–60% of minDim
  const baseRays = Array.from({ length: BASE_COUNT }, (_, i) => {
    const angle = ((Math.PI * 2) / BASE_COUNT) * i;
    const length = minDim * (0.30 + (i % 3) * 0.10); // 30–50%
    const strokeWidth = 1 + (i % 3); // 1–3px
    return {
      angle,
      length,
      strokeWidth,
      x2: centerX + Math.cos(angle) * length,
      y2: centerY + Math.sin(angle) * length,
    };
  });

  // 4 brighter rays offset by 22.5°, pulsing opacity
  const pulseRays = Array.from({ length: PULSE_COUNT }, (_, i) => {
    const angle = ((Math.PI * 2) / PULSE_COUNT) * i + Math.PI / 8;
    const length = minDim * 0.55;
    const duration = 4 + i * 1.3; // 4–8.2s staggered
    const delay = i * 1.1;
    return {
      angle,
      length,
      duration,
      delay,
      x2: centerX + Math.cos(angle) * length,
      y2: centerY + Math.sin(angle) * length,
    };
  });

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <style>{`
        @keyframes rays-spin {
          from { transform-origin: ${centerX}px ${centerY}px; transform: rotate(0deg); }
          to   { transform-origin: ${centerX}px ${centerY}px; transform: rotate(360deg); }
        }
        @keyframes ray-pulse-0 {
          0%,100% { opacity: 0.02; }
          50%     { opacity: 0.10; }
        }
        @keyframes ray-pulse-1 {
          0%,100% { opacity: 0.02; }
          50%     { opacity: 0.08; }
        }
        @keyframes ray-pulse-2 {
          0%,100% { opacity: 0.03; }
          50%     { opacity: 0.09; }
        }
        @keyframes ray-pulse-3 {
          0%,100% { opacity: 0.02; }
          50%     { opacity: 0.07; }
        }
      `}</style>

      {/* Spinning base rays group */}
      <g
        style={{
          animation: 'rays-spin 120s linear infinite',
          transformOrigin: `${centerX}px ${centerY}px`,
        }}
      >
        {baseRays.map((r, i) => (
          <line
            key={`base-${i}`}
            x1={centerX}
            y1={centerY}
            x2={r.x2}
            y2={r.y2}
            stroke="rgba(232,201,109,0.06)"
            strokeWidth={r.strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Pulsing brighter rays — static angle, just opacity animation */}
      {pulseRays.map((r, i) => (
        <line
          key={`pulse-${i}`}
          x1={centerX}
          y1={centerY}
          x2={r.x2}
          y2={r.y2}
          stroke="rgba(255,235,150,1)"
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            animation: `ray-pulse-${i} ${r.duration}s ease-in-out ${r.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}

// ─── 4. VillageBurstCanvas + Provider ─────────────────────────────────────────
// Imperative canvas for burst fragments on village hover/tap.
// Wrap your world in <VillageHoverProvider> and call triggerBurst from VillageNode.

interface ActiveBurst {
  fragments: BurstFragment[];
  startTime: number;
}

export function VillageHoverProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstsRef = useRef<ActiveBurst[]>([]);
  const rafRef = useRef<number>(0);
  const isAnimating = useRef(false);

  const startLoop = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const tick = (now: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W * dpr, H * dpr);

      // Filter out expired bursts (> 0.8s)
      burstsRef.current = burstsRef.current.filter(
        (b) => now - b.startTime < 800
      );

      if (burstsRef.current.length === 0) {
        isAnimating.current = false;
        return;
      }

      burstsRef.current.forEach((burst) => {
        const age = (now - burst.startTime) / 800; // 0→1

        burst.fragments.forEach((f) => {
          // Ease out movement
          const eased = 1 - Math.pow(1 - age, 2);
          const cx = f.x + f.vx * eased * 60;
          const cy = f.y + f.vy * eased * 60;
          f.rotation += f.rotationSpeed;

          const alpha = f.alpha * (1 - age);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(f.rotation);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = 'rgba(232, 201, 109, 1)';
          ctx.shadowColor = 'rgba(255, 220, 100, 0.8)';
          ctx.shadowBlur = 8;
          ctx.fillRect(-f.width / 2, -f.length / 2, f.width, f.length);
          ctx.restore();
        });
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const triggerBurst = useCallback(
    (villageId: string, x: number, y: number) => {
      const FRAG_COUNT = 6;
      const fragments: BurstFragment[] = Array.from(
        { length: FRAG_COUNT },
        (_, i) => {
          // 60° apart
          const angle = ((Math.PI * 2) / FRAG_COUNT) * i - Math.PI / 2;
          const speed = 1.2 + Math.random() * 0.8;
          return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.18,
            length: 10 + Math.random() * 6,
            width: 2.5 + Math.random() * 2,
            alpha: 0.7 + Math.random() * 0.3,
            t: 0,
          };
        }
      );

      burstsRef.current.push({ fragments, startTime: performance.now() });
      startLoop();
    },
    [startLoop]
  );

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    // no-op — the internal canvasRef handles it
  }, []);

  // Resize canvas on mount and window resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <VillageHoverContext.Provider value={{ triggerBurst, registerCanvas }}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
    </VillageHoverContext.Provider>
  );
}
