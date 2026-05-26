'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VILLAGES, Village } from '@/lib/villages';

type VillageState = 'unlit' | 'lit' | 'funded';
type VillageWithState = Village & { state: VillageState };
type Pos = { x: number; y: number };
type Phrase = { id: number; x: number; y: number; text: string };
type Ember = { x: number; y: number; tx: number; ty: number; color: string };

// ─── Cursor Light ─────────────────────────────────────────────────────────────
function CursorLight({ scaleRef }: { scaleRef: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const el = ref.current;
      const scaler = scaleRef.current;
      if (!el || !scaler) return;
      // Convert screen coords to world coords (1440x900 canvas)
      const rect = scaler.getBoundingClientRect();
      const scale = rect.width / 1440;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.opacity = '1';
    };
    const leave = () => { if (ref.current) ref.current.style.opacity = '0'; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseleave', leave); };
  }, [scaleRef]);

  return (
    <div ref={ref} className="cursor-light" style={{ opacity: 0 }}>
      <div className="cursor-aura" />
      <div className="cursor-core" />
    </div>
  );
}

// ─── Ambient Music (Web Audio API) ───────────────────────────────────────────
function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
    master.connect(ctx.destination);
    gainRef.current = master;

    // Reverb via convolver
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const len = rate * 4;
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    convolver.buffer = buf;
    convolver.connect(master);

    const dry = ctx.createGain();
    dry.gain.value = 0.4;
    dry.connect(master);

    // Drone tones
    const tones = [
      { freq: 110, type: 'sine' as OscillatorType, gain: 0.4 },
      { freq: 165, type: 'sine' as OscillatorType, gain: 0.25 },
      { freq: 220, type: 'sine' as OscillatorType, gain: 0.18 },
      { freq: 275, type: 'sine' as OscillatorType, gain: 0.12 },
      { freq: 55, type: 'sine' as OscillatorType, gain: 0.3 },
    ];

    tones.forEach(({ freq, type, gain }, i) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      // Slow frequency drift
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.01;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const oscGain = ctx.createGain();
      oscGain.gain.value = gain * 0.12;
      osc.connect(oscGain);
      oscGain.connect(convolver);
      oscGain.connect(dry);
      osc.start();
    });

    // Bell-like ping every ~8s
    const ping = () => {
      if (!ctxRef.current) return;
      const c = ctxRef.current;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.frequency.value = 528 + Math.random() * 180;
      osc.type = 'sine';
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 4);
      osc.connect(g);
      g.connect(convolver);
      osc.start();
      osc.stop(c.currentTime + 4.5);
      setTimeout(ping, 7000 + Math.random() * 8000);
    };
    setTimeout(ping, 2000);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (!ctxRef.current) { start(); return; }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
      gainRef.current?.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1);
      setPlaying(true);
    } else {
      gainRef.current?.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => ctx.suspend(), 1100);
      setPlaying(false);
    }
  }, [start]);

  return { playing, toggle };
}

// ─── Flower of Life ───────────────────────────────────────────────────────────
function FlowerOfLife() {
  const r = 80;
  const positions: [number, number][] = [
    [0, 0],
    [r * Math.sqrt(3), 0], [-r * Math.sqrt(3), 0],
    [r * Math.sqrt(3) / 2, r * 1.5], [-r * Math.sqrt(3) / 2, r * 1.5],
    [r * Math.sqrt(3) / 2, -r * 1.5], [-r * Math.sqrt(3) / 2, -r * 1.5],
  ];
  return (
    <svg width="1400" height="1400" viewBox="-500 -500 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#e8c96d" strokeWidth="0.8">
        {positions.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (Math.PI / 9) * i;
          const x = Math.cos(a) * r * 2 * Math.sqrt(3) * 0.86;
          const y = Math.sin(a) * r * 2 * Math.sqrt(3) * 0.86;
          return <circle key={'o' + i} cx={x} cy={y} r={r} />;
        })}
        <circle cx="0" cy="0" r={r * 4} strokeWidth="1" />
        <circle cx="0" cy="0" r={r * 4.6} strokeWidth="0.5" />
      </g>
    </svg>
  );
}

// ─── Mandala ──────────────────────────────────────────────────────────────────
function Mandala({ progress }: { progress: number }) {
  const petals = 16;
  return (
    <svg viewBox="-110 -110 220 220" width="220" height="220" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#e8c96d" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#c9872a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mgInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity={0.6 + 0.4 * progress} />
          <stop offset="60%" stopColor="#e8c96d" stopOpacity={0.5 * progress + 0.1} />
          <stop offset="100%" stopColor="#c9872a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="100" fill="url(#mg)" opacity="0.55" />
      {Array.from({ length: petals }).map((_, i) => {
        const a = (Math.PI * 2 * i) / petals;
        const x = Math.cos(a) * 78, y = Math.sin(a) * 78;
        const lit = i < Math.round(petals * progress);
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${(a * 180) / Math.PI + 90})`}>
            <ellipse cx="0" cy="0" rx="6" ry="14"
              fill={lit ? '#fffbe8' : 'transparent'}
              stroke={lit ? '#fffbe8' : 'rgba(245,234,214,0.4)'}
              strokeWidth="0.8" opacity={lit ? 0.9 : 0.45}
              style={{ filter: lit ? 'drop-shadow(0 0 6px rgba(232,201,109,0.9))' : 'none' }} />
          </g>
        );
      })}
      {[60, 50, 40, 30].map((r, i) => (
        <circle key={r} cx="0" cy="0" r={r} fill="none"
          stroke="rgba(245,234,214,0.35)" strokeWidth={i === 0 ? 1 : 0.6}
          strokeDasharray={i === 1 ? '2 3' : undefined} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 8;
        return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30}
          x2={Math.cos(a) * 60} y2={Math.sin(a) * 60}
          stroke="rgba(245,234,214,0.3)" strokeWidth="0.6" />;
      })}
      <circle cx="0" cy="0" r="30" fill="url(#mgInner)" />
      <circle cx="0" cy="0" r="30" fill="none" stroke="#e8c96d" strokeWidth="1" opacity="0.7" />
      <polygon points="0,-22 19,11 -19,11" fill="none" stroke="rgba(255,251,232,0.6)" strokeWidth="0.6" />
      <polygon points="0,22 19,-11 -19,-11" fill="none" stroke="rgba(255,251,232,0.4)" strokeWidth="0.6" />
    </svg>
  );
}

// ─── Sun Rays ─────────────────────────────────────────────────────────────────
function SunRays() {
  return (
    <svg viewBox="-100 -100 200 200" width="220" height="220" style={{ width: '100%', height: '100%' }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 24;
        const long = i % 2 === 0;
        return <line key={i}
          x1={Math.cos(a) * 50} y1={Math.sin(a) * 50}
          x2={Math.cos(a) * (long ? 95 : 75)} y2={Math.sin(a) * (long ? 95 : 75)}
          stroke="#fffbe8" strokeWidth={long ? 1.2 : 0.6}
          opacity={long ? 0.9 : 0.6} strokeLinecap="round" />;
      })}
    </svg>
  );
}

// ─── Village Icons ────────────────────────────────────────────────────────────
const VICONS: Record<string, React.ReactNode> = {
  educacion: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 26 L32 14 L56 26 L32 38 Z" />
      <path d="M18 30 V44 C18 44 24 50 32 50 C40 50 46 44 46 44 V30" />
      <line x1="56" y1="26" x2="56" y2="40" />
      <circle cx="56" cy="42" r="2" fill="currentColor" stroke="none" />
      <line x1="32" y1="14" x2="32" y2="8" />
      <line x1="28" y1="10" x2="36" y2="10" />
    </svg>
  ),
  salud: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 52 C14 40 10 28 14 20 C18 12 26 12 32 22 C38 12 46 12 50 20 C54 28 50 40 32 52 Z" />
      <line x1="32" y1="30" x2="32" y2="42" strokeWidth="2.2" />
      <line x1="26" y1="36" x2="38" y2="36" strokeWidth="2.2" />
    </svg>
  ),
  arte: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 10 C19 10 8 20 8 34 C8 43 14 48 22 46 C26 45 27 40 24 37 C21 34 23 30 28 30 H38 C47 30 54 23 54 17 C54 12 44 10 32 10 Z" />
      <circle cx="22" cy="22" r="3" fill="currentColor" stroke="none" />
      <circle cx="32" cy="18" r="3" fill="currentColor" stroke="none" />
      <circle cx="42" cy="22" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  ambiente: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 12 C26 20 20 28 20 38 C20 44 25 50 32 50 C39 50 44 44 44 38 C44 28 38 20 32 12 Z" />
      <line x1="32" y1="26" x2="32" y2="54" />
      <path d="M32 36 L24 32" />
      <path d="M32 42 L40 38" />
    </svg>
  ),
  animal: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 22 C16 17 19 13 23 13 C26 13 28 16 28 19 L28 25" />
      <path d="M48 22 C48 17 45 13 41 13 C38 13 36 16 36 19 L36 25" />
      <path d="M20 32 C20 25 26 20 32 20 C38 20 44 25 44 32 C44 37 42 41 38 43 L38 49 C38 51 36 53 34 53 L30 53 C28 53 26 51 26 49 L26 43 C22 41 20 37 20 32 Z" />
      <circle cx="28" cy="31" r="2" fill="currentColor" stroke="none" />
      <circle cx="36" cy="31" r="2" fill="currentColor" stroke="none" />
      <path d="M29 38 C30 40 34 40 35 38" />
    </svg>
  ),
  comunidad: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22" cy="20" r="7" />
      <circle cx="42" cy="20" r="7" />
      <circle cx="32" cy="40" r="7" />
      <path d="M22 30 C15 33 11 40 10 50 H30" />
      <path d="M42 30 C49 33 53 40 54 50 H34" />
      <path d="M32 50 C25 50 21 55 20 60 H44 C43 55 39 50 32 50" />
    </svg>
  ),
};

// ─── Paths Layer ──────────────────────────────────────────────────────────────
function PathsLayer({ positions, hub, villages }: { positions: Pos[]; hub: Pos; villages: VillageWithState[] }) {
  return (
    <svg className="paths-svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8c96d" stopOpacity="0.0" />
          <stop offset="20%" stopColor="#e8c96d" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#fffbe8" stopOpacity="0.85" />
          <stop offset="80%" stopColor="#e8c96d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e8c96d" stopOpacity="0.0" />
        </linearGradient>
        <filter id="pathGlow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {positions.map((p, i) => {
        const v = villages[i];
        const lit = v.state !== 'unlit';
        const mx = (hub.x + p.x) / 2 + (p.y - hub.y) * 0.18;
        const my = (hub.y + p.y) / 2 - (p.x - hub.x) * 0.12;
        const d = `M ${hub.x} ${hub.y} Q ${mx} ${my} ${p.x} ${p.y}`;
        return (
          <g key={v.id}>
            <path d={d} stroke={lit ? '#e8c96d' : 'rgba(245,234,214,0.18)'}
              strokeWidth={lit ? 8 : 3} fill="none" opacity={lit ? 0.3 : 0.4} filter="url(#pathGlow)" />
            <path d={d}
              stroke={lit ? 'url(#pathGrad)' : 'rgba(245,234,214,0.22)'}
              strokeWidth={lit ? 2 : 0.8} fill="none"
              strokeDasharray={lit ? undefined : '4 5'} strokeLinecap="round" />
            {lit && <>
              <circle r="3" fill="#fffbe8" opacity="0.9">
                <animateMotion dur={`${4 + (i % 3)}s`} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" dur={`${4 + (i % 3)}s`} repeatCount="indefinite" />
              </circle>
              <circle r="5" fill="#e8c96d" opacity="0.4">
                <animateMotion dur={`${4 + (i % 3)}s`} repeatCount="indefinite" path={d} begin={`${(i % 3) * 0.5}s`} />
                <animate attributeName="opacity" values="0;0.5;0.5;0" dur={`${4 + (i % 3)}s`} repeatCount="indefinite" begin={`${(i % 3) * 0.5}s`} />
              </circle>
            </>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Particles Canvas ──────────────────────────────────────────────────────────
function Particles({ density = 1, embers }: { density?: number; embers: Ember[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<Ember[]>(embers);
  useEffect(() => { embersRef.current = embers; }, [embers]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    const ww = () => c.offsetWidth, hh = () => c.offsetHeight;
    const colors = ['#e8c96d', '#fffbe8', '#c9872a', '#f5ead6'];
    const N = Math.floor(100 * density);
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * ww(), y: Math.random() * hh(),
      vx: (Math.random() - 0.5) * 0.2, vy: -0.1 - Math.random() * 0.3,
      r: 0.5 + Math.random() * 2.5, a: 0.15 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      hue: colors[Math.floor(Math.random() * colors.length)],
    }));
    type Traveller = { x: number; y: number; tx: number; ty: number; t: number; dur: number; color: string; size: number };
    let travellers: Traveller[] = [];
    let lastEmbers = embersRef.current;
    let t = 0, raf: number;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, ww(), hh());
      if (embersRef.current !== lastEmbers) {
        embersRef.current.forEach((e) => {
          for (let i = 0; i < 18; i++) {
            travellers.push({ x: e.x + (Math.random()-0.5)*40, y: e.y + (Math.random()-0.5)*40, tx: e.tx, ty: e.ty, t: 0, dur: 1.2 + Math.random()*1.6, color: e.color, size: 1.5 + Math.random()*2.5 });
          }
        });
        lastEmbers = embersRef.current;
      }
      parts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.018;
        if (p.y < -10) { p.y = hh()+10; p.x = Math.random()*ww(); }
        if (p.x < -10) p.x = ww()+10;
        if (p.x > ww()+10) p.x = -10;
        const aa = p.a * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.beginPath(); ctx.fillStyle = p.hue; ctx.globalAlpha = aa;
        ctx.shadowColor = p.hue; ctx.shadowBlur = 12;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      });
      travellers = travellers.filter(tr => tr.t < 1);
      travellers.forEach((tr) => {
        tr.t += 0.016 / tr.dur;
        const e = 1 - Math.pow(1 - tr.t, 3);
        const cx = tr.x + (tr.tx - tr.x)*e, cy = tr.y + (tr.ty - tr.y)*e;
        const drift = Math.sin(t*4 + tr.x) * 8 * (1-tr.t);
        ctx.beginPath(); ctx.fillStyle = tr.color;
        ctx.globalAlpha = (1-tr.t)*0.9 + 0.1;
        ctx.shadowColor = tr.color; ctx.shadowBlur = 16;
        ctx.arc(cx+drift, cy, tr.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [density]);

  return <canvas ref={canvasRef} className="particles" />;
}

// ─── Village Node ─────────────────────────────────────────────────────────────
function VillageNode({ v, pos, selected, onSelect }: { v: VillageWithState; pos: Pos; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <div
      className={`village${selected ? ' selected' : ''}`}
      data-state={v.state}
      style={{ left: pos.x+'px', top: pos.y+'px', ['--v-color' as string]: v.color }}
      onClick={() => onSelect(v.id)}
    >
      <div className="v-aura" />
      <div className="v-rays"><SunRays /></div>
      <div className="v-disc">
        <div className="v-icon">{VICONS[v.id]}</div>
      </div>
      <div className="v-label">{v.name}</div>
      <div className="v-mini-progress">
        <span style={{ width: Math.min(100, (v.raised / v.target) * 100) + '%' }} />
      </div>
    </div>
  );
}

// ─── Detail Card ──────────────────────────────────────────────────────────────
function DetailCard({ v, pos, onClose, onDonate }: { v: VillageWithState; pos: Pos; onClose: () => void; onDonate: (id: string, amount: number) => void }) {
  const [amount, setAmount] = useState(500);
  const presets = [250, 500, 1000, 2500];
  const pct = Math.min(100, (v.raised / v.target) * 100);
  const W = 1440, H = 900, CARD_W = 360, CARD_H = 540, margin = 24, gap = 80;
  const isRight = pos.x >= W / 2;
  let left = isRight ? pos.x + gap : pos.x - CARD_W - gap;
  left = Math.min(Math.max(margin, left), W - CARD_W - margin);
  let top = pos.y - CARD_H / 2;
  top = Math.min(Math.max(100, top), H - CARD_H - margin);
  return (
    <div className="detail-card" style={{ left: left+'px', top: top+'px', ['--dc-color' as string]: v.color }}>
      <button className="dc-close" onClick={onClose}>✕</button>
      <div className="dc-eyebrow"><span className="dot" /> Aldea de {v.name}</div>
      <h2 className="dc-title">{v.name}</h2>
      <div className="dc-loc">{v.location}</div>
      <p className="dc-desc">{v.description} <em>{v.italic}</em></p>
      <div className="dc-stats">
        <div><div className="dc-stat-num">${v.raised.toLocaleString('es-MX')}</div><div className="dc-stat-lbl">Luz recibida</div></div>
        <div style={{ textAlign:'center' }}><div className="dc-stat-num">{v.supporters}</div><div className="dc-stat-lbl">Embajadores</div></div>
        <div style={{ textAlign:'right' }}><div className="dc-stat-num">{v.days}</div><div className="dc-stat-lbl">Días de luz</div></div>
      </div>
      <div className="dc-progress-track">
        <div className="dc-progress-fill" style={{ width: pct+'%' }} />
      </div>
      <div className="dc-progress-meta">
        <span>{Math.round(pct)}% iluminado</span>
        <span>Meta · ${v.target.toLocaleString('es-MX')}</span>
      </div>
      <div className="dc-divider" />
      <div className="dc-amounts">
        {presets.map((p) => (
          <button key={p} className={`dc-amount${amount === p ? ' active' : ''}`} onClick={() => setAmount(p)}>${p}</button>
        ))}
      </div>
      <button className="dc-cta" onClick={() => onDonate(v.id, amount)}>
        <span className="spark" /> Dona tu luz <span className="spark" />
      </button>
      <div className="dc-foot">
        <span>✦ Donación deducible de impuestos</span>
        <span>Mex · USD</span>
      </div>
    </div>
  );
}

// ─── World ────────────────────────────────────────────────────────────────────
export default function World() {
  const W = 1440, H = 900;
  const scalerRef = useRef<HTMLDivElement>(null);
  const { playing, toggle: toggleMusic } = useAmbientMusic();

  const [villages, setVillages] = useState<VillageWithState[]>(() =>
    VILLAGES.map((v) => {
      const pct = v.raised / v.target;
      return { ...v, state: pct >= 1 ? 'funded' : pct > 0.4 ? 'lit' : 'unlit' };
    })
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / W, window.innerHeight / H);
      if (scalerRef.current) scalerRef.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const hub: Pos = { x: W / 2, y: H * 0.55 };
  const radius = 290;

  const positions = useMemo<Pos[]>(() =>
    villages.map((v) => {
      const a = (v.angle * Math.PI) / 180;
      return { x: hub.x + Math.cos(a) * radius, y: hub.y + Math.sin(a) * radius * 0.78 };
    }),
    [villages]
  );

  const totalProgress = useMemo(() => {
    const t = villages.reduce((acc, v) => acc + v.target, 0);
    const r = villages.reduce((acc, v) => acc + v.raised, 0);
    return r / t;
  }, [villages]);

  const totalRaised = villages.reduce((a, v) => a + v.raised, 0);
  const totalSupporters = villages.reduce((a, v) => a + v.supporters, 0);
  const selected = villages.find((v) => v.id === selectedId);
  const selectedIdx = villages.findIndex((v) => v.id === selectedId);
  const selectedPos = selectedIdx >= 0 ? positions[selectedIdx] : null;

  const doDonate = useCallback((id: string, amount: number) => {
    const idx = villages.findIndex((v) => v.id === id);
    if (idx < 0) return;
    const p = positions[idx];
    setVillages((prev) => prev.map((v) => {
      if (v.id !== id) return v;
      const newRaised = v.raised + amount;
      const pct = newRaised / v.target;
      return { ...v, raised: newRaised, supporters: v.supporters + 1, state: pct >= 1 ? 'funded' : pct > 0.4 ? 'lit' : 'unlit' };
    }));
    const phrase: Phrase = {
      id: Date.now() + Math.random(), x: p.x, y: p.y - 30,
      text: amount >= 1000 ? 'Tu donación no es un número. Es luz que viaja.' : 'Es luz que viaja ✦',
    };
    setPhrases((ps) => [...ps, phrase]);
    setTimeout(() => setPhrases((ps) => ps.filter((x) => x.id !== phrase.id)), 4500);
    setEmbers([{ x: p.x, y: p.y, tx: hub.x, ty: hub.y, color: villages[idx].color }]);
  }, [positions, villages, hub.x, hub.y]);

  return (
    <div className="world-fit">
      <div className="world-scaler" ref={scalerRef}>
        <div className={`world${selectedId ? ' has-card' : ''}`}>
          <div className="canopy" />
          <div className="rays" />
          <div className="flower-of-life"><FlowerOfLife /></div>
          <div className="grain" />

          {/* Music button */}
          <button className="music-btn" onClick={toggleMusic} title={playing ? 'Silenciar' : 'Activar música'}>
            {playing ? '♫' : '♪'}
            <span>{playing ? 'Silenciar' : 'Música'}</span>
          </button>

          {/* Top nav */}
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark" />
              <div>
                <div className="brand-name">Embajadores</div>
                <div style={{ marginTop: '-4px' }}><span className="brand-sub">de la luz</span></div>
              </div>
            </div>
            <div className="nav-links">
              <a>El Mapa</a><a>Aldeas</a><a>Manifiesto</a><a>Embajadores</a>
            </div>
            <div className="lang-pill">ES · MXN ▾</div>
          </div>

          {/* Hero */}
          <div className="hero-eyebrow">
            <p className="kicker">~ El mapa vivo de la luz ~</p>
            <h1><span className="dash" />Envía Luz<span className="dash" /></h1>
          </div>

          {/* Side panels */}
          <div className="side-panel">
            <h3>Aldeas en flor</h3>
            {villages.map((v) => {
              const pct = Math.round((v.raised / v.target) * 100);
              return (
                <div key={v.id} className="sp-line">
                  <span className={`sp-dot${v.state !== 'unlit' ? ' on' : ''}`} style={{ ['--sp-color' as string]: v.color }} />
                  <span style={{ flex: 1 }}>{v.name}</span>
                  <span className="sp-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="right-panel">
            <span className="quote-mark">"</span>
            Las raíces no se ven, pero sostienen el bosque. No buscamos ser vistos. Buscamos sembrar.
            <span className="attr">— Manifiesto, Embajadores de la Luz</span>
          </div>

          {/* Map */}
          <div className="stage">
            <PathsLayer positions={positions} hub={hub} villages={villages} />

            <div className="hub" style={{ left: (hub.x - 140)+'px', top: (hub.y - 140)+'px' }}>
              <div className="hub-glow" />
              <div className="hub-mandala"><Mandala progress={totalProgress} /></div>
              <div className="hub-core">
                <div className="hub-label-sm">Casa Central</div>
                <div className="hub-pct">{Math.round(totalProgress * 100)}<sup>%</sup></div>
              </div>
              <div className="hub-caption">
                <div className="hcap-label">El Origen</div>
                <div className="hcap-sub">Luz total · 2026</div>
              </div>
            </div>

            {villages.map((v, i) => (
              <VillageNode key={v.id} v={v} pos={positions[i]}
                selected={selectedId === v.id}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />
            ))}
          </div>

          <Particles embers={embers} />

          {phrases.map((p) => (
            <div key={p.id} className="float-phrase" style={{ left: p.x+'px', top: p.y+'px' }}>
              {p.text}
            </div>
          ))}

          {selected && selectedPos && (
            <DetailCard v={selected} pos={selectedPos} onClose={() => setSelectedId(null)} onDonate={doDonate} />
          )}

          <div className="mobile-hint">
            <div className="phone" />
            <div>
              <div style={{ fontFamily: 'var(--font-script)', fontSize: 17, color: 'var(--gold)', lineHeight: 1 }}>Lleva la luz contigo</div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,234,214,0.6)', marginTop: 2 }}>iOS · Android</div>
            </div>
          </div>

          <div className="hud">
            <div className="hud-stat">
              <div className="hud-stat-lbl">Luz total recolectada</div>
              <div className="hud-stat-val">${totalRaised.toLocaleString('es-MX')} <span style={{ fontSize: 16, opacity: 0.6 }}>MXN</span></div>
              <div className="hud-stat-sub">Meta colectiva · ${villages.reduce((a, v) => a + v.target, 0).toLocaleString('es-MX')}</div>
            </div>
            <div className="hud-center">Toca una aldea para enviarle tu luz. Mira cómo viaja por las venas doradas del mapa.</div>
            <div className="hud-stat" style={{ textAlign: 'right', alignItems: 'flex-end' }}>
              <div className="hud-stat-lbl">Embajadores activos</div>
              <div className="hud-stat-val">{totalSupporters.toLocaleString('es-MX')}</div>
              <div className="hud-stat-sub">desde 14 países · creciendo</div>
            </div>
          </div>

          <div className="compass">
            <div className="compass-ring"><span className="compass-n">N</span></div>
          </div>

          <CursorLight scaleRef={scalerRef} />
        </div>
      </div>
    </div>
  );
}
