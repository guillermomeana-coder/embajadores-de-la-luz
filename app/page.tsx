'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VILLAGES, Village } from '@/lib/villages';
import { VILLAGE_SVGS } from '@/lib/villageSvgs';
import {
  JourneyFog,
  ClothParticles,
  LightRays,
  VillageHoverProvider,
  useVillageHover,
} from '@/components/AtmosphericSystems';

type VillageState = 'unlit' | 'lit' | 'funded';
type VillageWithState = Village & { state: VillageState };
type Pos = { x: number; y: number };
type Phrase = { id: number; x: number; y: number; text: string };
type Ember = { x: number; y: number; tx: number; ty: number; color: string };

// ─── Audio Engine ─────────────────────────────────────────────────────────────
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctxRef.current = new AC();
      // iOS unlock: play a zero-duration silent buffer immediately in the gesture
      try {
        const buf = ctxRef.current.createBuffer(1, 1, 22050);
        const src = ctxRef.current.createBufferSource();
        src.buffer = buf;
        src.connect(ctxRef.current.destination);
        src.start(0);
      } catch (_) {}
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playClick = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 660;
    osc.type = 'sine';
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  }, [getCtx]);

  const playHover = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 440;
    osc.type = 'sine';
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  }, [getCtx]);

  const playDonate = useCallback(() => {
    const ctx = getCtx();
    const freqs = [523, 659, 784, 1047, 1318];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.7);
    });
  }, [getCtx]);

  const toggleMusic = useCallback(() => {
    const ctx = getCtx();
    if (!musicGainRef.current) {
      // Build ambient drone
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
      master.connect(ctx.destination);
      musicGainRef.current = master;

      const tones = [
        { freq: 110, vol: 0.5 }, { freq: 165, vol: 0.3 },
        { freq: 220, vol: 0.25 }, { freq: 330, vol: 0.15 },
        { freq: 55, vol: 0.4 },
      ];
      tones.forEach(({ freq, vol }, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.02;
        const lfoG = ctx.createGain();
        lfoG.gain.value = freq * 0.006;
        lfo.connect(lfoG); lfoG.connect(osc.frequency); lfo.start();
        const g = ctx.createGain();
        g.gain.value = vol * 0.18;
        osc.connect(g); g.connect(master); osc.start();
      });

      // Singing bowl pings
      const ping = () => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') return;
        const c = ctxRef.current;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.frequency.value = 432 + Math.random() * 300;
        osc.type = 'sine';
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 5);
        osc.connect(g); g.connect(master);
        osc.start(); osc.stop(c.currentTime + 5.5);
        setTimeout(ping, 5000 + Math.random() * 7000);
      };
      setTimeout(ping, 1500);
      setMusicPlaying(true);
    } else {
      const g = musicGainRef.current;
      if (musicPlaying) {
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setMusicPlaying(false);
      } else {
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);
        setMusicPlaying(true);
      }
    }
  }, [getCtx, musicPlaying]);

  const playPageTurn = useCallback(() => {
    const ctx = getCtx();
    // Paper page turn: two soft high-frequency noise swishes
    const makeSwish = (startTime: number, dur: number, vol: number) => {
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      // High-pass: paper is mostly 3–8kHz, remove low rumble
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 2800; hpf.Q.value = 0.5;
      // Shelf to soften harshness above 8kHz
      const shelf = ctx.createBiquadFilter();
      shelf.type = 'highshelf'; shelf.frequency.value = 7000; shelf.gain.value = -10;
      const g = ctx.createGain();
      // Bell-curve envelope: gentle rise then fall — no sharp attack
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(vol, startTime + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
      src.connect(hpf); hpf.connect(shelf); shelf.connect(g); g.connect(ctx.destination);
      src.start(startTime); src.stop(startTime + dur + 0.05);
    };
    // First swish: page lifting (softer)
    makeSwish(ctx.currentTime, 0.28, 0.055);
    // Second swish: page landing (slightly louder, slightly later)
    makeSwish(ctx.currentTime + 0.22, 0.32, 0.07);
  }, [getCtx]);

  const playBell = useCallback(() => {
    const ctx = getCtx();
    // soft crystal bowl — 528 Hz (healing frequency)
    const freqs = [528, 792, 1056];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.04;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08 / (i + 1), t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 4);
    });
  }, [getCtx]);

  return { playClick, playHover, playDonate, toggleMusic, musicPlaying, playBell, playPageTurn };
}

// ─── Cursor Light ─────────────────────────────────────────────────────────────
function CursorLight({ scaleRef }: { scaleRef: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const el = ref.current;
      const scaler = scaleRef.current;
      if (!el || !scaler) return;
      const rect = scaler.getBoundingClientRect();
      el.style.left = (e.clientX - rect.left) + 'px';
      el.style.top = (e.clientY - rect.top) + 'px';
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

// ─── Manifiesto Book Modal ────────────────────────────────────────────────────

// Animated Flower of Life SVG — circles draw in sequentially
function BookFlowerOfLife() {
  const r = 28;
  const cx = 60, cy = 60;
  const offsets: [number, number][] = [
    [0, 0],
    [r, 0], [-r, 0],
    [r / 2, r * 0.866], [-r / 2, r * 0.866],
    [r / 2, -r * 0.866], [-r / 2, -r * 0.866],
  ];
  const totalLen = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" width="100" height="100" fill="none" className="book-fol-svg">
      <defs>
        <radialGradient id="folGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#c9872a" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Outer boundary */}
      <circle cx={cx} cy={cy} r={56} stroke="#c9872a" strokeWidth="0.6" opacity="0.3"
        style={{strokeDasharray: 2*Math.PI*56, strokeDashoffset: 2*Math.PI*56,
          animation: 'fol-draw 0.6s ease forwards 1.6s'}}/>
      {/* Inner petals — each delays slightly */}
      {offsets.map(([ox, oy], i) => (
        <circle key={i} cx={cx + ox} cy={cy + oy} r={r}
          stroke="#e8c96d" strokeWidth="0.9" opacity="0.75"
          style={{
            strokeDasharray: totalLen,
            strokeDashoffset: totalLen,
            animation: `fol-draw 0.5s ease forwards ${0.1 + i * 0.18}s`,
          }}
        />
      ))}
      {/* Center dot glow */}
      <circle cx={cx} cy={cy} r={4} fill="#e8c96d" opacity="0"
        style={{animation: 'fol-dot 0.4s ease forwards 1.5s'}}/>
      <circle cx={cx} cy={cy} r={4} fill="url(#folGlow)" opacity="0"
        style={{animation: 'fol-dot 0.4s ease forwards 1.5s'}}/>
    </svg>
  );
}

// Candle flame SVG
function CandleFlame() {
  return (
    <svg viewBox="0 0 24 36" width="18" height="26" className="book-candle-svg">
      <defs>
        <radialGradient id="flameGrad" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#fffbe8"/>
          <stop offset="40%" stopColor="#f5a623"/>
          <stop offset="100%" stopColor="#c9872a" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Wick */}
      <line x1="12" y1="30" x2="12" y2="26" stroke="#2a1d10" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Outer flame */}
      <path d="M12 4 C16 10 18 16 16 22 C14 27 10 27 8 22 C6 16 8 10 12 4 Z"
        fill="url(#flameGrad)" className="book-flame-outer"/>
      {/* Inner bright core */}
      <path d="M12 10 C14 14 14.5 19 13 22 C11.5 25 10.5 24 9.5 22 C8.5 19 9 14 12 10 Z"
        fill="#fffbe8" opacity="0.85" className="book-flame-inner"/>
      {/* Candle body */}
      <rect x="9" y="29" width="6" height="7" rx="0.5" fill="#f2e4c8"/>
      <rect x="9" y="29" width="6" height="2" rx="0.5" fill="#c9872a" opacity="0.3"/>
    </svg>
  );
}

// Hexagram seal SVG
function HexagramSeal() {
  // Two overlapping equilateral triangles
  const r = 18;
  const up = Array.from({length:3}).map((_,i)=>{
    const a = (Math.PI*2*i/3) - Math.PI/2;
    return `${24+Math.cos(a)*r},${24+Math.sin(a)*r}`;
  }).join(' ');
  const down = Array.from({length:3}).map((_,i)=>{
    const a = (Math.PI*2*i/3) + Math.PI/2;
    return `${24+Math.cos(a)*r},${24+Math.sin(a)*r}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" className="book-hexagram">
      <defs>
        <filter id="hexGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <polygon points={up} fill="none" stroke="#c9872a" strokeWidth="1.2" opacity="0.85" filter="url(#hexGlow)"/>
      <polygon points={down} fill="none" stroke="#e8c96d" strokeWidth="1" opacity="0.7" filter="url(#hexGlow)"/>
      <circle cx="24" cy="24" r="3" fill="#e8c96d" opacity="0.8"/>
    </svg>
  );
}

// Dust particles canvas inside book
function BookDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth, H = c.offsetHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.scale(dpr, dpr);
    const particles = Array.from({length: 12}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: -(0.15 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 0.2,
      r: 0.8 + Math.random() * 1.8,
      alpha: 0.08 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      sway: 0.3 + Math.random() * 0.6,
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.y += p.vy;
        p.phase += 0.025;
        p.x += p.vx + Math.sin(p.phase) * p.sway * 0.012;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        const pulse = 0.6 + 0.4 * Math.sin(p.phase);
        ctx.beginPath();
        ctx.fillStyle = '#e8c96d';
        ctx.globalAlpha = p.alpha * pulse;
        ctx.shadowColor = '#e8c96d';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="book-dust-canvas"/>;
}

function ManifiestoBook({ onClose, playPageTurn }: { onClose: () => void; playPageTurn: () => void }) {
  const [phase, setPhase] = useState<'closed'|'opening'|'open'|'closing'>('closed');

  useEffect(() => {
    // Phase 1: book appears from spine angle
    const t1 = setTimeout(() => setPhase('opening'), 50);
    // Phase 2: cover flips open, content reveals
    const t2 = setTimeout(() => { playPageTurn(); setPhase('open'); }, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    setPhase('closing');
    setTimeout(onClose, 700);
  };

  return (
    <div className={`book-overlay book-overlay--${phase}`} onClick={close}>
      {/* Candle ambient glow */}
      <div className="book-candle-glow"/>

      {/* SVG grain filter definition */}
      <svg width="0" height="0" style={{position:'absolute'}}>
        <defs>
          <filter id="book-grain-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feBlend in="SourceGraphic" mode="multiply"/>
          </filter>
        </defs>
      </svg>

      <div className={`book book--${phase}`} onClick={e => e.stopPropagation()}>
        <BookDust/>

        {/* Leather cover — flips open */}
        <div className={`book-cover book-cover--${phase}`}>
          <div className="book-cover-ornament book-cover-ornament--tl"/>
          <div className="book-cover-ornament book-cover-ornament--tr"/>
          <div className="book-cover-ornament book-cover-ornament--bl"/>
          <div className="book-cover-ornament book-cover-ornament--br"/>
          <div className="book-cover-title">
            <span>Embajadores</span>
            <em>de la Luz</em>
          </div>
        </div>

        {/* Spine */}
        <div className="book-spine">
          <div className="book-spine-text">Manifiesto · 2026</div>
        </div>

        {/* Close button */}
        <button className="book-close" onClick={close} aria-label="Cerrar">✕</button>

        {/* Left page — illuminated manuscript */}
        <div className="book-page book-left">
          <div className="book-page-grain"/>

          {/* Inner binding shadow */}
          <div className="book-binding-shadow book-binding-shadow--left"/>

          <div className="book-left-inner">
            {/* Candle flame above FOL */}
            <div className="book-candle-wrap">
              <CandleFlame/>
            </div>

            {/* Animated Flower of Life */}
            <div className="book-ornament">
              <BookFlowerOfLife/>
            </div>

            {/* Title block */}
            <div className="book-left-eyebrow">EMBAJADORES</div>
            <div className="book-left-script">de la Luz</div>

            {/* Golden rule */}
            <div className="book-left-rule">
              <span className="book-left-rule-line"/>
              <span className="book-left-rule-diamond">✦</span>
              <span className="book-left-rule-line"/>
            </div>

            {/* Sub heading */}
            <div className="book-left-sub">
              MANIFIESTO<br/>
              <span className="book-left-sub-year">FUNDACIONAL · 2026</span>
            </div>

            {/* Diamond divider */}
            <div className="book-left-divider">
              <span className="book-divider-line"/>
              <span className="book-divider-diamond">✦</span>
              <span className="book-divider-line"/>
            </div>

            {/* Quote */}
            <p className="book-left-verse">
              "Las raíces<br/>
              no se ven,<br/>
              pero sostienen<br/>
              el bosque."
            </p>
            <p className="book-left-attr">— Sebastián,<br/><em>Co-Fundador</em></p>
          </div>
        </div>

        {/* Right page — manifesto text */}
        <div className="book-page book-right">
          <div className="book-page-grain"/>
          <div className="book-binding-shadow book-binding-shadow--right"/>

          <div className="book-right-inner">
            {/* Chapter I with drop cap */}
            <h2 className="book-chapter">I. El Origen</h2>
            <p className="book-body book-body--dropcap">
              <span className="book-dropcap">N</span>o somos una organización tradicional. No venimos a construir estructuras de poder ni a acumular reconocimiento. Somos una red de personas que eligieron sembrar en silencio.
            </p>

            <div className="book-ornament-sep">✦</div>

            <h2 className="book-chapter">II. La Estructura Viva</h2>
            <p className="book-body">
              Cada acción que tomamos es una raíz que crece. No buscamos ser vistos. Buscamos que lo que plantamos florezca mucho después de que nos hayamos ido. La organización es viva porque respira con las personas que la conforman.
            </p>

            <div className="book-ornament-sep">✦</div>

            <h2 className="book-chapter">III. La Luz como Acto</h2>
            <p className="book-body">
              Enviar luz no es una metáfora. Es una decisión. Es elegir, en el momento en que podrías ignorar, hacer algo. Cada donación, cada acto de presencia, cada aldea iluminada es una prueba de que el mundo puede cambiar desde adentro.
            </p>

            <div className="book-ornament-sep">✦</div>

            <h2 className="book-chapter">IV. El Compromiso</h2>
            <p className="book-body">
              Se ingresa por invitación. Se permanece por coherencia. No pedimos perfección — pedimos autenticidad. Un embajador de la luz no necesita anunciarlo. Lo demuestra.
            </p>

            {/* Closing seal */}
            <div className="book-seal">
              <HexagramSeal/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Intro — timing constants ──────────────────────────────────────────────────
const INTRO_TIMINGS = {
  BLACK_END:        800,
  FOL_INNER_START:  800,
  FOL_INNER_END:   1800,
  FOL_OUTER_START: 1800,
  FOL_OUTER_END:   2800,
  TITLE_START:     3000,
  TITLE_SUB_DELAY:  400,
  BARS_LIFT:       5000,
  BARS_DONE:       6000,
  PHRASE_HOLD:     2200,
  PHRASE_LAST:     3500,
  PHRASE_FADE:      700,
};

const INTRO_PHRASES = [
  { text: 'No es una organización tradicional.', gold: false, italic: false },
  { text: 'Es una estructura viva.', gold: true, italic: false },
  { text: 'No buscamos ser vistos.', gold: false, italic: false },
  { text: 'Buscamos sembrar.', gold: true, italic: false },
  { text: 'Cada acción es una luz encendida en el mundo.', gold: false, italic: false },
  { text: '"Las raíces no se ven, pero sostienen el bosque."', gold: true, italic: true },
];

type IntroPhase = 'black' | 'fol-drawing' | 'title' | 'bars-lifting' | 'phrases' | 'button';

// FOL circle definitions
const FOL_R = 30;
const FOL_CIRCLES: Array<{ cx: number; cy: number; group: 'inner' | 'outer' | 'boundary' }> = [
  { cx: 0,              cy: 0,                group: 'inner' },
  { cx: FOL_R,          cy: 0,                group: 'inner' },
  { cx: FOL_R * 0.5,    cy: FOL_R * 0.866,    group: 'inner' },
  { cx: -FOL_R * 0.5,   cy: FOL_R * 0.866,    group: 'inner' },
  { cx: -FOL_R,         cy: 0,                group: 'inner' },
  { cx: -FOL_R * 0.5,   cy: -FOL_R * 0.866,   group: 'inner' },
  { cx: FOL_R * 0.5,    cy: -FOL_R * 0.866,   group: 'inner' },
  { cx: FOL_R * 2,      cy: 0,                group: 'outer' },
  { cx: FOL_R,          cy: FOL_R * 1.732,    group: 'outer' },
  { cx: -FOL_R,         cy: FOL_R * 1.732,    group: 'outer' },
  { cx: -FOL_R * 2,     cy: 0,                group: 'outer' },
  { cx: -FOL_R,         cy: -FOL_R * 1.732,   group: 'outer' },
  { cx: FOL_R,          cy: -FOL_R * 1.732,   group: 'outer' },
  { cx: 0,              cy: 0,                group: 'boundary' },
];
const BOUNDARY_R = FOL_R * 2.07;
const CIRC = 2 * Math.PI * FOL_R;
const BOUNDARY_CIRC = 2 * Math.PI * BOUNDARY_R;
const DIAMOND_ANGLES = [0, 60, 120, 180, 240, 300].map(d => (d * Math.PI) / 180);

// ─── Starfield + cloth ribbons canvas ─────────────────────────────────────────
function IntroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width  = window.innerWidth  * dpr;
      c.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    const ww = () => window.innerWidth;
    const hh = () => window.innerHeight;

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * ww(), y: Math.random() * hh() * 0.6,
      r: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.012,
      base: 0.15 + Math.random() * 0.5,
    }));

    const ribbons = Array.from({ length: 8 }, () => ({
      x: Math.random() * ww(),
      y: hh() + Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.3 + Math.random() * 0.5),
      phase: Math.random() * Math.PI * 2,
      len: 20 + Math.random() * 40,
      a: 0.15 + Math.random() * 0.25,
      hue: Math.random() < 0.7 ? '#e8c96d' : '#fffbe8',
    }));

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, ww(), hh());
      stars.forEach(s => {
        s.phase += s.speed;
        const alpha = s.base * (0.4 + 0.6 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.fillStyle = '#e8c96d';
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#e8c96d'; ctx.shadowBlur = 6;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ribbons.forEach(r => {
        r.x += r.vx + Math.sin(r.phase) * 0.3;
        r.y += r.vy;
        r.phase += 0.025;
        if (r.y < -r.len - 20) { r.y = hh() + 20; r.x = Math.random() * ww(); }
        const dx = Math.sin(r.phase) * 8;
        ctx.beginPath();
        ctx.strokeStyle = r.hue;
        ctx.globalAlpha = r.a * (0.5 + 0.5 * Math.sin(r.phase * 0.5));
        ctx.shadowColor = r.hue; ctx.shadowBlur = 8;
        ctx.lineWidth = 1;
        ctx.moveTo(r.x, r.y);
        ctx.bezierCurveTo(r.x + dx, r.y + r.len * 0.33, r.x - dx, r.y + r.len * 0.66, r.x + dx * 0.5, r.y + r.len);
        ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="intro-canvas" />;
}

// ─── Flower of Life — sequential stroke-draw ─────────────────────────────────
function IntroFOL({ phase }: { phase: IntroPhase }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'black') return;
    startRef.current = Date.now() - (INTRO_TIMINGS.FOL_INNER_START);
    let raf: number;
    const animate = () => {
      setElapsed(Date.now() - (startRef.current!));
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const getProgress = (idx: number): number => {
    const circle = FOL_CIRCLES[idx];
    if (circle.group === 'inner') {
      const perCircle = 1000 / 7;
      const start = idx * perCircle;
      return Math.min(1, Math.max(0, (elapsed - start) / (perCircle + 200)));
    } else if (circle.group === 'outer') {
      const outerIdx = idx - 7;
      const perCircle = 1000 / 6;
      const start = 1000 + outerIdx * perCircle;
      return Math.min(1, Math.max(0, (elapsed - start) / (perCircle + 200)));
    } else {
      return Math.min(1, Math.max(0, (elapsed - 1800) / 400));
    }
  };

  const allDone = elapsed > 2200;
  const glowProgress = allDone ? Math.min(1, (elapsed - 2200) / 800) : 0;
  const showDiamonds = elapsed > 2500;
  const rotationDeg = allDone ? ((elapsed - 2200) / 30000) * 360 : 0;

  // Responsive size
  const [size, setSize] = useState(140);
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 110 : 140);
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const vb = 72;

  return (
    <div
      className={`intro-fol-wrap${allDone ? ' fol-complete' : ''}`}
      style={{ '--fol-glow': glowProgress } as React.CSSProperties}
    >
      <svg
        className="intro-fol"
        viewBox={`-${vb} -${vb} ${vb * 2} ${vb * 2}`}
        width={size} height={size}
        fill="none"
      >
        <defs>
          <clipPath id="fol-intro-clip">
            <circle cx="0" cy="0" r={vb - 1} />
          </clipPath>
        </defs>

        {/* Clipped circle group */}
        <g clipPath="url(#fol-intro-clip)">
          {FOL_CIRCLES.slice(0, 13).map((c, i) => {
            const r = c.group === 'boundary' ? BOUNDARY_R : FOL_R;
            const circ = c.group === 'boundary' ? BOUNDARY_CIRC : CIRC;
            const prog = getProgress(i);
            const strokeW = c.group === 'boundary' ? 1.1 : 0.6;
            const opacity = c.group === 'inner' ? 0.92 : c.group === 'outer' ? 0.72 : 0.85;
            return (
              <circle
                key={i}
                cx={c.cx} cy={c.cy} r={r}
                stroke="#e8c96d"
                strokeWidth={strokeW}
                opacity={opacity}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - prog)}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Outer 6 group — slow spin after drawing */}
        <g style={{ transform: `rotate(${rotationDeg}deg)`, transformOrigin: '0 0' }}>
          {allDone && [1, 2].map(i => (
            <circle key={`gr-${i}`} cx="0" cy="0" r={FOL_R * 2.1 + i * 4}
              stroke={`rgba(232,201,109,${0.05 / i})`} strokeWidth="0.4" />
          ))}
        </g>

        {/* 6 diamond markers at outer circle intersections */}
        {showDiamonds && DIAMOND_ANGLES.map((angle, i) => {
          const x = Math.cos(angle) * FOL_R * 2;
          const y = Math.sin(angle) * FOL_R * 2;
          const dp = Math.min(1, (elapsed - 2500 - i * 60) / 300);
          return (
            <g key={`dm-${i}`} opacity={dp} transform={`translate(${x},${y})`}>
              <polygon points="0,-3.5 2.5,0 0,3.5 -2.5,0" fill="#e8c96d" opacity="0.9"
                style={{ filter: 'drop-shadow(0 0 3px rgba(232,201,109,0.9))' }} />
            </g>
          );
        })}

        {/* Glow overlay — intensifies on completion */}
        {glowProgress > 0 && (
          <circle cx="0" cy="0" r={vb}
            fill={`rgba(232,201,109,${glowProgress * 0.04})`}
            style={{ filter: `blur(${glowProgress * 8}px)` }} />
        )}
      </svg>
    </div>
  );
}

// ─── Intro Screen ────────────────────────────────────────────────────────────
function IntroScreen({ onEnter, playClick, toggleMusic, musicPlaying, playHover, playBell }: {
  onEnter: () => void; playClick: () => void;
  toggleMusic: () => void; musicPlaying: boolean;
  playHover: () => void; playBell: () => void;
}) {
  const [phase, setPhase] = useState<IntroPhase>('black');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);
  const [showFinalText, setShowFinalText] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [barsLifted, setBarsLifted] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const musicStarted = useRef(false);

  // Start music on first user gesture
  useEffect(() => {
    const start = () => {
      if (!musicStarted.current && !musicPlaying) {
        musicStarted.current = true;
        toggleMusic();
        playBell();
      }
    };
    window.addEventListener('mousemove', start, { once: true });
    window.addEventListener('click', start, { once: true });
    window.addEventListener('touchstart', start, { once: true, passive: true });
    return () => {
      window.removeEventListener('mousemove', start);
      window.removeEventListener('click', start);
      window.removeEventListener('touchstart', start);
    };
  }, [toggleMusic, musicPlaying, playBell]);

  // Cursor tracking
  useEffect(() => {
    const move = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // Phase state machine
  useEffect(() => {
    const T = INTRO_TIMINGS;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('fol-drawing'), T.BLACK_END));
    timers.push(setTimeout(() => { setPhase('title'); setTitleVisible(true); }, T.TITLE_START));
    timers.push(setTimeout(() => setSubVisible(true), T.TITLE_START + T.TITLE_SUB_DELAY));
    timers.push(setTimeout(() => { setPhase('bars-lifting'); setBarsLifted(true); }, T.BARS_LIFT));
    timers.push(setTimeout(() => setPhase('phrases'), T.BARS_DONE));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Phrase cycling
  useEffect(() => {
    if (phase !== 'phrases') return;
    if (phraseIdx >= INTRO_PHRASES.length) {
      setTimeout(() => setShowFinalText(true), 300);
      setTimeout(() => setShowBtn(true), 900);
      setPhase('button');
      return;
    }
    const isLast = phraseIdx === INTRO_PHRASES.length - 1;
    const hold = isLast ? INTRO_TIMINGS.PHRASE_LAST : INTRO_TIMINGS.PHRASE_HOLD;
    const timer = setTimeout(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setPhraseIdx(i => i + 1);
        setPhraseVisible(true);
        playBell();
      }, INTRO_TIMINGS.PHRASE_FADE);
    }, hold);
    return () => clearTimeout(timer);
  }, [phraseIdx, phase, playBell]);

  const handleEnter = () => {
    setFlashActive(true);
    playClick();
    setTimeout(() => onEnter(), 420);
  };

  const phrase = INTRO_PHRASES[phraseIdx];
  const showPhrases = phase === 'phrases' && !showFinalText;

  return (
    <div className={`intro${barsLifted ? ' bars-lifted' : ''}`}>
      {/* Custom cursor */}
      <div
        className="cursor-light"
        style={{ position: 'fixed', left: cursorPos.x, top: cursorPos.y, opacity: 1, zIndex: 10001 }}
      >
        <div className="cursor-aura" />
        <div className="cursor-core" />
      </div>

      {/* Enter flash */}
      {flashActive && <div className="intro-flash" />}

      {/* Cinematic bars — top and bottom */}
      <div className="intro-bar-top" />
      <div className="intro-bar-bottom" />

      {/* Background: Journey gradient */}
      <div className="intro-bg" />
      <IntroStarfield />

      {/* All centered content */}
      <div className="intro-content">

        {/* Flower of Life */}
        {phase !== 'black' && <IntroFOL phase={phase} />}

        {/* Logo block */}
        <div className={`intro-logo${titleVisible ? ' logo-visible' : ''}`}>
          <div className={`intro-title${titleVisible ? ' title-in' : ''}`}>
            EMBAJADORES
          </div>
          <div className={`intro-sub${subVisible ? ' sub-in' : ''}`}>
            de la Luz
          </div>
        </div>

        {/* Ornamental divider */}
        {(phase === 'phrases' || phase === 'button') && (
          <div className="intro-divider-ornament">
            <span className="intro-divider-line" />
            <span className="intro-divider-diamond">✦</span>
            <span className="intro-divider-line" />
          </div>
        )}

        {/* Phrase */}
        {showPhrases && (
          <p
            className={`intro-phrase${phraseVisible ? ' phrase-in' : ' phrase-out'}`}
            style={{
              fontStyle: phrase?.italic ? 'italic' : 'normal',
              color: phrase?.gold ? 'var(--gold)' : 'var(--cream)',
            }}
          >
            {phrase?.text}
          </p>
        )}

        {/* Final text */}
        {showFinalText && (
          <div className="intro-final final-in">
            <p className="intro-final-main">
              Una red de luces encendidas alrededor del mundo.
            </p>
            <p className="intro-final-sub">
              Ingresas por invitación. Permaneces por coherencia.
            </p>
          </div>
        )}

        {/* Enter button */}
        {showBtn && (
          <button
            className="intro-enter"
            onMouseEnter={playHover}
            onClick={handleEnter}
          >
            ✦ INGRESAR AL MAPA
          </button>
        )}
      </div>

      {/* Music toggle */}
      <button
        className="intro-music-btn"
        onClick={toggleMusic}
        title={musicPlaying ? 'Silenciar' : 'Activar música'}
      >
        {musicPlaying ? '♫' : '♪'}
      </button>
    </div>
  );
}

// ─── Screen Flash ─────────────────────────────────────────────────────────────
function ScreenFlash({ trigger }: { trigger: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    setTimeout(() => setVisible(false), 600);
  }, [trigger]);
  return visible ? <div className="screen-flash" /> : null;
}

// ─── Flower of Life ───────────────────────────────────────────────────────────
function FlowerOfLife() {
  const r = 80;
  const positions: [number, number][] = [
    [0,0],[r*Math.sqrt(3),0],[-r*Math.sqrt(3),0],
    [r*Math.sqrt(3)/2,r*1.5],[-r*Math.sqrt(3)/2,r*1.5],
    [r*Math.sqrt(3)/2,-r*1.5],[-r*Math.sqrt(3)/2,-r*1.5],
  ];
  return (
    <svg width="1400" height="1400" viewBox="-500 -500 1000 1000">
      <g fill="none" stroke="#e8c96d" strokeWidth="0.8">
        {positions.map(([x,y],i) => <circle key={i} cx={x} cy={y} r={r}/>)}
        {Array.from({length:18}).map((_,i)=>{const a=(Math.PI/9)*i;return<circle key={'o'+i} cx={Math.cos(a)*r*2*Math.sqrt(3)*0.86} cy={Math.sin(a)*r*2*Math.sqrt(3)*0.86} r={r}/>;})}
        <circle cx="0" cy="0" r={r*4} strokeWidth="1"/>
        <circle cx="0" cy="0" r={r*4.6} strokeWidth="0.5"/>
      </g>
    </svg>
  );
}

// ─── Mandala ──────────────────────────────────────────────────────────────────
function Mandala({ progress }: { progress: number }) {
  const petals = 11;
  return (
    <svg viewBox="-110 -110 220 220" width="220" height="220" style={{width:'100%',height:'100%'}}>
      <defs>
        <radialGradient id="mg"><stop offset="0%" stopColor="#fffbe8" stopOpacity="0.95"/><stop offset="40%" stopColor="#e8c96d" stopOpacity="0.7"/><stop offset="100%" stopColor="#c9872a" stopOpacity="0"/></radialGradient>
        <radialGradient id="mgI"><stop offset="0%" stopColor="#fffbe8" stopOpacity={0.6+0.4*progress}/><stop offset="60%" stopColor="#e8c96d" stopOpacity={0.5*progress+0.1}/><stop offset="100%" stopColor="#c9872a" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="0" cy="0" r="100" fill="url(#mg)" opacity="0.55"/>
      {Array.from({length:petals}).map((_,i)=>{
        const a=(Math.PI*2*i)/petals;
        const x=Math.cos(a)*78, y=Math.sin(a)*78;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${(a*180)/Math.PI+90})`}>
            <ellipse cx="0" cy="0" rx="7" ry="16"
              fill="#fffbe8" stroke="#fffbe8" strokeWidth="0.5"
              opacity="0.92"
              style={{filter:'drop-shadow(0 0 8px rgba(232,201,109,1)) drop-shadow(0 0 16px rgba(255,251,232,0.6))'}}/>
          </g>
        );
      })}
      {[60,50,40,30].map((r,i)=><circle key={r} cx="0" cy="0" r={r} fill="none" stroke="rgba(245,234,214,0.35)" strokeWidth={i===0?1:0.6} strokeDasharray={i===1?'2 3':undefined}/>)}
      {Array.from({length:8}).map((_,i)=>{const a=(Math.PI*2*i)/8;return<line key={i} x1={Math.cos(a)*30} y1={Math.sin(a)*30} x2={Math.cos(a)*60} y2={Math.sin(a)*60} stroke="rgba(245,234,214,0.3)" strokeWidth="0.6"/>;})}
      <circle cx="0" cy="0" r="30" fill="url(#mgI)"/>
      <circle cx="0" cy="0" r="30" fill="none" stroke="#e8c96d" strokeWidth="1" opacity="0.7"/>
      <polygon points="0,-22 19,11 -19,11" fill="none" stroke="rgba(255,251,232,0.6)" strokeWidth="0.6"/>
      <polygon points="0,22 19,-11 -19,-11" fill="none" stroke="rgba(255,251,232,0.4)" strokeWidth="0.6"/>
    </svg>
  );
}

// ─── Sun Rays ─────────────────────────────────────────────────────────────────
function SunRays() {
  return (
    <svg viewBox="-100 -100 200 200" style={{width:'100%',height:'100%'}}>
      {Array.from({length:24}).map((_,i)=>{const a=(Math.PI*2*i)/24;const long=i%2===0;return<line key={i} x1={Math.cos(a)*50} y1={Math.sin(a)*50} x2={Math.cos(a)*(long?95:72)} y2={Math.sin(a)*(long?95:72)} stroke="#fffbe8" strokeWidth={long?1.5:0.8} opacity={long?0.9:0.5} strokeLinecap="round"/>;})}
    </svg>
  );
}

// ─── Village Building SVGs — Journey-style ancient ruins ─────────────────────
function VillageBuilding({ id }: { id: string }) {
  return <div className="v-building-svg" dangerouslySetInnerHTML={{ __html: VILLAGE_SVGS[id] ?? '' }} />;
}

// Legacy fallback (kept for reference but not used)
const _BUILDINGS_LEGACY: Record<string, React.ReactNode> = {
  educacion: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Foundation step */}
      <rect x="8" y="68" width="74" height="6" fill="currentColor" opacity="0.55" rx="1"/>
      <rect x="14" y="64" width="62" height="6" fill="currentColor" opacity="0.35" rx="1"/>
      {/* Building body */}
      <rect x="16" y="38" width="58" height="28" fill="currentColor" opacity="0.12" rx="1"/>
      {/* Pediment / triangular roof */}
      <polygon points="45,11 9,38 81,38" fill="currentColor" opacity="0.48"/>
      <polygon points="45,13 10,38 80,38" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55"/>
      {/* Flag + pole */}
      <line x1="45" y1="3" x2="45" y2="13" stroke="currentColor" strokeWidth="2" opacity="0.75"/>
      <polygon points="45,3 64,8 45,13" fill="currentColor" opacity="0.8"/>
      {/* Columns (4) */}
      <rect x="20" y="38" width="6" height="28" fill="currentColor" opacity="0.6" rx="0.5"/>
      <rect x="33" y="38" width="6" height="28" fill="currentColor" opacity="0.6" rx="0.5"/>
      <rect x="51" y="38" width="6" height="28" fill="currentColor" opacity="0.6" rx="0.5"/>
      <rect x="64" y="38" width="6" height="28" fill="currentColor" opacity="0.6" rx="0.5"/>
      {/* Arched central door */}
      <path d="M36 66 L36 51 Q45 44 54 51 L54 66" fill="currentColor" opacity="0.65"/>
      {/* Side windows */}
      <rect x="21" y="43" width="9" height="7" fill="currentColor" opacity="0.45" rx="0.5"/>
      <rect x="60" y="43" width="9" height="7" fill="currentColor" opacity="0.45" rx="0.5"/>
    </svg>
  ),
  salud: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Base */}
      <rect x="6" y="69" width="78" height="5" fill="currentColor" opacity="0.5" rx="1"/>
      {/* Building body */}
      <rect x="10" y="26" width="70" height="45" fill="currentColor" opacity="0.1" rx="2"/>
      {/* Flat roof + parapet */}
      <rect x="8" y="20" width="74" height="8" fill="currentColor" opacity="0.45" rx="1"/>
      <rect x="6" y="17" width="78" height="5" fill="currentColor" opacity="0.25" rx="1"/>
      {/* Large cross (medical) */}
      <rect x="31" y="33" width="28" height="10" fill="currentColor" opacity="0.92" rx="1"/>
      <rect x="40" y="24" width="10" height="28" fill="currentColor" opacity="0.92" rx="1"/>
      {/* Arched entrance */}
      <path d="M32 74 L32 57 Q45 50 58 57 L58 74" fill="currentColor" opacity="0.55"/>
      {/* Windows (4 total) */}
      <rect x="12" y="30" width="15" height="11" fill="currentColor" opacity="0.32" rx="0.5"/>
      <rect x="63" y="30" width="15" height="11" fill="currentColor" opacity="0.32" rx="0.5"/>
      <rect x="12" y="47" width="15" height="11" fill="currentColor" opacity="0.32" rx="0.5"/>
      <rect x="63" y="47" width="15" height="11" fill="currentColor" opacity="0.32" rx="0.5"/>
    </svg>
  ),
  arte: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Ground base */}
      <rect x="6" y="70" width="78" height="4" fill="currentColor" opacity="0.4" rx="1"/>
      {/* Dome (amphitheater) */}
      <path d="M10 48 Q45 6 80 48" fill="currentColor" opacity="0.32"/>
      <path d="M10 48 Q45 8 80 48" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55"/>
      {/* Building body */}
      <rect x="10" y="48" width="70" height="24" fill="currentColor" opacity="0.1" rx="1"/>
      {/* Main arch / proscenium */}
      <path d="M26 74 L26 57 Q45 43 64 57 L64 74" fill="currentColor" opacity="0.52"/>
      {/* Side columns */}
      <line x1="10" y1="48" x2="10" y2="74" stroke="currentColor" strokeWidth="4" opacity="0.45" strokeLinecap="round"/>
      <line x1="80" y1="48" x2="80" y2="74" stroke="currentColor" strokeWidth="4" opacity="0.45" strokeLinecap="round"/>
      {/* Side arched windows */}
      <path d="M12 58 Q19 52 26 58" fill="currentColor" opacity="0.42"/>
      <rect x="12" y="58" width="14" height="10" fill="currentColor" opacity="0.28" rx="0.5"/>
      <path d="M64 58 Q71 52 78 58" fill="currentColor" opacity="0.42"/>
      <rect x="64" y="58" width="14" height="10" fill="currentColor" opacity="0.28" rx="0.5"/>
      {/* Star ornament at dome top */}
      <circle cx="45" cy="17" r="7" fill="currentColor" opacity="0.6"/>
      <line x1="45" y1="10" x2="45" y2="24" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"/>
      <line x1="38" y1="17" x2="52" y2="17" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"/>
    </svg>
  ),
  ambiente: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Ground shadow */}
      <ellipse cx="45" cy="75" rx="38" ry="5" fill="currentColor" opacity="0.22"/>
      {/* Left tree (layered pine) */}
      <polygon points="20,65 7,65 13.5,50 7,50 20,32 33,50 26.5,50 33,65" fill="currentColor" opacity="0.34"/>
      <rect x="17" y="65" width="7" height="8" fill="currentColor" opacity="0.48" rx="0.5"/>
      {/* Center tree (tallest) */}
      <polygon points="45,68 30,68 37,52 30,52 45,24 60,52 53,52 60,68" fill="currentColor" opacity="0.52"/>
      <rect x="42" y="68" width="7" height="7" fill="currentColor" opacity="0.58" rx="0.5"/>
      {/* Right tree */}
      <polygon points="70,65 57,65 63.5,50 57,50 70,32 83,50 76.5,50 83,65" fill="currentColor" opacity="0.34"/>
      <rect x="67" y="65" width="7" height="8" fill="currentColor" opacity="0.48" rx="0.5"/>
      {/* Floating sparkles */}
      <circle cx="26" cy="22" r="2.5" fill="currentColor" opacity="0.65"/>
      <circle cx="64" cy="18" r="2" fill="currentColor" opacity="0.65"/>
      <circle cx="45" cy="12" r="3.5" fill="currentColor" opacity="0.75"/>
      <circle cx="12" cy="38" r="1.5" fill="currentColor" opacity="0.42"/>
      <circle cx="78" cy="36" r="1.5" fill="currentColor" opacity="0.42"/>
    </svg>
  ),
  animal: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Base */}
      <rect x="8" y="70" width="74" height="5" fill="currentColor" opacity="0.45" rx="1"/>
      {/* Barn body */}
      <rect x="12" y="44" width="66" height="28" fill="currentColor" opacity="0.13" rx="1"/>
      {/* Barn roof (pentagon) */}
      <polygon points="45,12 8,44 82,44" fill="currentColor" opacity="0.44"/>
      <polygon points="45,14 9,44 81,44" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      {/* Loft arch window */}
      <path d="M32 34 Q45 25 58 34" fill="currentColor" opacity="0.52"/>
      <rect x="32" y="34" width="26" height="10" fill="currentColor" opacity="0.42" rx="0.5"/>
      {/* Double main doors */}
      <rect x="26" y="52" width="16" height="20" fill="currentColor" opacity="0.55" rx="0.5"/>
      <rect x="48" y="52" width="16" height="20" fill="currentColor" opacity="0.55" rx="0.5"/>
      <line x1="45" y1="52" x2="45" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
      {/* Side windows */}
      <rect x="14" y="50" width="10" height="8" fill="currentColor" opacity="0.38" rx="0.5"/>
      <rect x="66" y="50" width="10" height="8" fill="currentColor" opacity="0.38" rx="0.5"/>
      {/* Heart / paw on door */}
      <circle cx="34" cy="58" r="3.5" fill="currentColor" opacity="0.72"/>
      <circle cx="56" cy="58" r="3.5" fill="currentColor" opacity="0.72"/>
      <path d="M28 62 Q45 74 62 62" fill="currentColor" opacity="0.52"/>
    </svg>
  ),
  comunidad: (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Ground */}
      <rect x="4" y="70" width="82" height="4" fill="currentColor" opacity="0.4" rx="1"/>
      {/* Left house */}
      <rect x="4" y="48" width="24" height="24" fill="currentColor" opacity="0.13" rx="1"/>
      <polygon points="16,26 2,48 30,48" fill="currentColor" opacity="0.38"/>
      <rect x="10" y="57" width="12" height="15" fill="currentColor" opacity="0.48" rx="0.5"/>
      <rect x="5" y="51" width="8" height="7" fill="currentColor" opacity="0.35" rx="0.5"/>
      <rect x="19" y="51" width="8" height="7" fill="currentColor" opacity="0.35" rx="0.5"/>
      {/* Center church / hall (tallest) */}
      <rect x="29" y="35" width="32" height="37" fill="currentColor" opacity="0.18" rx="1"/>
      <polygon points="45,7 26,35 64,35" fill="currentColor" opacity="0.54"/>
      {/* Steeple */}
      <line x1="45" y1="2" x2="45" y2="9" stroke="currentColor" strokeWidth="2.5" opacity="0.78"/>
      <line x1="40" y1="6" x2="50" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.65"/>
      {/* Center door */}
      <rect x="38" y="54" width="14" height="18" fill="currentColor" opacity="0.62" rx="0.5"/>
      {/* Center windows */}
      <rect x="31" y="41" width="11" height="9" fill="currentColor" opacity="0.4" rx="0.5"/>
      <rect x="48" y="41" width="11" height="9" fill="currentColor" opacity="0.4" rx="0.5"/>
      {/* Right house */}
      <rect x="62" y="48" width="24" height="24" fill="currentColor" opacity="0.13" rx="1"/>
      <polygon points="74,26 60,48 88,48" fill="currentColor" opacity="0.38"/>
      <rect x="68" y="57" width="12" height="15" fill="currentColor" opacity="0.48" rx="0.5"/>
      <rect x="63" y="51" width="8" height="7" fill="currentColor" opacity="0.35" rx="0.5"/>
      <rect x="77" y="51" width="8" height="7" fill="currentColor" opacity="0.35" rx="0.5"/>
    </svg>
  ),
};
void _BUILDINGS_LEGACY; // suppress unused warning

// ─── Paths Layer ──────────────────────────────────────────────────────────────
function PathsLayer({ positions, hub, villages, W, H }: { positions: Pos[]; hub: Pos; villages: VillageWithState[]; W: number; H: number }) {
  return (
    <svg className="paths-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8c96d" stopOpacity="0"/>
          <stop offset="30%" stopColor="#fffbe8" stopOpacity="0.9"/>
          <stop offset="70%" stopColor="#fffbe8" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#e8c96d" stopOpacity="0"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      {positions.map((p, i) => {
        const v = villages[i];
        const lit = v.state !== 'unlit';
        const mx = (hub.x+p.x)/2+(p.y-hub.y)*0.15;
        const my = (hub.y+p.y)/2-(p.x-hub.x)*0.1;
        const d = `M ${hub.x} ${hub.y} Q ${mx} ${my} ${p.x} ${p.y}`;
        return (
          <g key={v.id}>
            <path d={d} stroke={lit?'#e8c96d':'rgba(245,234,214,0.12)'} strokeWidth={lit?10:2} fill="none" opacity={lit?0.25:0.3} filter="url(#glow)"/>
            <path d={d} stroke={lit?'url(#pg)':'rgba(245,234,214,0.2)'} strokeWidth={lit?2:0.6} fill="none" strokeDasharray={lit?undefined:'5 6'} strokeLinecap="round"/>
            {lit && <>
              {/* Journey-style symbol: a glowing dash, not a dot */}
              <g>
                <animateMotion dur={`${3+i*0.7}s`} repeatCount="indefinite" path={d} rotate="auto"/>
                {/* Elongated dash — 6px × 3px with rounded ends */}
                <rect x="-3" y="-1.5" width="6" height="3" rx="1.5"
                  fill="#fffbe8"
                  style={{filter:'drop-shadow(0 0 5px rgba(255,251,232,0.95)) drop-shadow(0 0 12px rgba(232,201,109,0.7))'}}/>
                <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${3+i*0.7}s`} repeatCount="indefinite"/>
              </g>
              {/* Trailing glow dot — slightly behind, softer */}
              <g opacity="0.4">
                <animateMotion dur={`${3+i*0.7}s`} repeatCount="indefinite" path={d} rotate="auto" begin={`${0.12+i*0.02}s`}/>
                <ellipse cx="0" cy="0" rx="8" ry="3" fill="#e8c96d"
                  style={{filter:'blur(3px)'}}/>
              </g>
            </>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles({ density=1, embers }: { density?: number; embers: Ember[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<Ember[]>(embers);
  useEffect(() => { embersRef.current = embers; }, [embers]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio||1;
    const resize = () => { c.width=c.offsetWidth*dpr; c.height=c.offsetHeight*dpr; ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr); };
    resize(); window.addEventListener('resize', resize);
    const ww=()=>c.offsetWidth, hh=()=>c.offsetHeight;
    const colors=['#e8c96d','#fffbe8','#c9872a','#f5ead6'];
    const N=Math.floor(120*density);
    const parts=Array.from({length:N},()=>({x:Math.random()*ww(),y:Math.random()*hh(),vx:(Math.random()-.5)*.2,vy:-.1-Math.random()*.35,r:.4+Math.random()*2.5,a:.1+Math.random()*.7,phase:Math.random()*Math.PI*2,hue:colors[Math.floor(Math.random()*colors.length)]}));
    type T={x:number,y:number,tx:number,ty:number,t:number,dur:number,color:string,size:number};
    let trav:T[]=[]; let lastE=embersRef.current; let t=0,raf:number;
    const tick=()=>{
      t+=.016; ctx.clearRect(0,0,ww(),hh());
      if(embersRef.current!==lastE){embersRef.current.forEach(e=>{for(let i=0;i<22;i++)trav.push({x:e.x+(Math.random()-.5)*50,y:e.y+(Math.random()-.5)*50,tx:e.tx,ty:e.ty,t:0,dur:1+Math.random()*2,color:e.color,size:1.5+Math.random()*3});});lastE=embersRef.current;}
      parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.phase+=.018;if(p.y<-10){p.y=hh()+10;p.x=Math.random()*ww();}if(p.x<-10)p.x=ww()+10;if(p.x>ww()+10)p.x=-10;const aa=p.a*(.5+.5*Math.sin(p.phase));ctx.beginPath();ctx.fillStyle=p.hue;ctx.globalAlpha=aa;ctx.shadowColor=p.hue;ctx.shadowBlur=12;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
      trav=trav.filter(tr=>tr.t<1);
      trav.forEach(tr=>{tr.t+=.016/tr.dur;const e=1-Math.pow(1-tr.t,3);const cx=tr.x+(tr.tx-tr.x)*e,cy=tr.y+(tr.ty-tr.y)*e;const drift=Math.sin(t*4+tr.x)*10*(1-tr.t);ctx.beginPath();ctx.fillStyle=tr.color;ctx.globalAlpha=(1-tr.t)*.9+.1;ctx.shadowColor=tr.color;ctx.shadowBlur=18;ctx.arc(cx+drift,cy,tr.size,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;ctx.shadowBlur=0;raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[density]);
  return <canvas ref={canvasRef} className="particles"/>;
}

// ─── Village Node (game-style hex tile) ───────────────────────────────────────
function VillageNode({ v, pos, selected, onSelect, onHover }: {
  v: VillageWithState; pos: Pos; selected: boolean;
  onSelect: (id: string) => void; onHover: () => void;
}) {
  const pct = Math.min(100, (v.raised / v.target) * 100);
  const { triggerBurst } = useVillageHover();

  const handleHover = useCallback(() => {
    onHover();
    triggerBurst(v.id, pos.x, pos.y);
  }, [onHover, triggerBurst, v.id, pos.x, pos.y]);

  return (
    <div
      className={`village${selected ? ' selected' : ''}`}
      data-state={v.state}
      style={{ left: pos.x+'px', top: pos.y+'px', color: v.color } as React.CSSProperties}
      onClick={() => onSelect(v.id)}
      onMouseEnter={handleHover}
      onTouchStart={() => triggerBurst(v.id, pos.x, pos.y)}
    >
      {/* Outer glow ring */}
      <div className="v-outer-glow" />

      {/* Sun rays for funded */}
      <div className="v-rays"><SunRays /></div>

      {/* Progress ring (SVG) */}
      <svg className="v-ring" viewBox="0 0 140 140" width="158" height="158">
        <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(245,234,214,0.07)" strokeWidth="4"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(245,234,214,0.04)" strokeWidth="1" strokeDasharray="3 5"/>
        <circle cx="70" cy="70" r="62" fill="none"
          stroke={v.color} strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 62}`}
          strokeDashoffset={2 * Math.PI * 62 * (1 - pct / 100)}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${v.color})`, transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Tick marks */}
        {Array.from({length:12}).map((_,i)=>{
          const a=(Math.PI*2*i)/12-(Math.PI/2);
          const r1=66, r2=70;
          return <line key={i} x1={70+Math.cos(a)*r1} y1={70+Math.sin(a)*r1} x2={70+Math.cos(a)*r2} y2={70+Math.sin(a)*r2} stroke="rgba(245,234,214,0.2)" strokeWidth="1"/>;
        })}
      </svg>

      {/* Terrain ground patch */}
      <div className="v-terrain" />

      {/* Hex tile disc */}
      <div className="v-hex">
        <div className="v-building" style={{ color: v.state === 'unlit' ? 'rgba(245,234,214,0.25)' : v.color }}>
          <VillageBuilding id={v.id} />
        </div>
      </div>

      {/* Label */}
      <div className="v-label">{v.name}</div>

      {/* Level badge */}
      <div className="v-badge" style={{ background: v.state === 'funded' ? v.color : 'rgba(12,31,21,0.85)', borderColor: v.color }}>
        {v.state === 'funded' ? '✦' : v.state === 'lit' ? '◈' : '◇'}
      </div>
    </div>
  );
}

// ─── Detail Card ──────────────────────────────────────────────────────────────
function DetailCard({ v, pos, onClose, onDonate, W, H }: {
  v: VillageWithState; pos: Pos; onClose: () => void; onDonate: (id: string, amount: number) => void; W: number; H: number;
}) {
  const [amount, setAmount] = useState(500);
  const presets = [250, 500, 1000, 2500];
  const pct = Math.min(100, (v.raised / v.target) * 100);
  const CW=360,CH=540,margin=20,gap=80;
  const isRight = pos.x >= W/2;
  let left = isRight ? pos.x+gap : pos.x-CW-gap;
  left = Math.min(Math.max(margin, left), W-CW-margin);
  let top = pos.y-CH/2;
  top = Math.min(Math.max(90, top), H-CH-margin);
  return (
    <div className="detail-card" style={{ left:left+'px', top:top+'px', ['--dc-color' as keyof React.CSSProperties]: v.color } as React.CSSProperties}>
      <button className="dc-close" onClick={onClose}>✕</button>
      <div className="dc-eyebrow"><span className="dot" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }} /> Aldea de {v.name}</div>
      <h2 className="dc-title">{v.name}</h2>
      <div className="dc-loc">{v.location}</div>
      <p className="dc-desc">{v.description} <em>{v.italic}</em></p>
      <div className="dc-stats">
        <div><div className="dc-stat-num">${v.raised.toLocaleString('es-MX')}</div><div className="dc-stat-lbl">Luz recibida</div></div>
        <div style={{textAlign:'center'}}><div className="dc-stat-num">{v.supporters}</div><div className="dc-stat-lbl">Embajadores</div></div>
        <div style={{textAlign:'right'}}><div className="dc-stat-num">{v.days}</div><div className="dc-stat-lbl">Días de luz</div></div>
      </div>
      <div className="dc-progress-track">
        <div className="dc-progress-fill" style={{ width: pct+'%', background: `linear-gradient(90deg, ${v.color}, #fffbe8)` }}/>
      </div>
      <div className="dc-progress-meta"><span>{Math.round(pct)}% iluminado</span><span>Meta · ${v.target.toLocaleString('es-MX')}</span></div>
      <div className="dc-divider"/>
      <div className="dc-amounts">
        {presets.map(p=><button key={p} className={`dc-amount${amount===p?' active':''}`} onClick={()=>setAmount(p)}>${p}</button>)}
      </div>
      <button className="dc-cta" onClick={()=>onDonate(v.id,amount)} style={{ background: `linear-gradient(135deg, ${v.color}, #c9872a)` }}>
        <span className="spark"/>
        Envía tu luz · ${amount}
        <span className="spark"/>
      </button>
      <div className="dc-foot"><span>✦ Donación deducible de impuestos</span><span>Mex · USD</span></div>
    </div>
  );
}

// ─── Journey Ruins Silhouettes (replaces jungle ForestEdges) ─────────────────
// Ancient temple ruins, broken columns, sand dunes — Journey desert aesthetic
function ForestEdges() {
  return (
    <svg className="forest-edges" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ruinGradL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#0a0806" stopOpacity="1"/>
          <stop offset="100%" stopColor="#06040e" stopOpacity="0.85"/>
        </linearGradient>
        <linearGradient id="ruinGradR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#06040e" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#0a0806" stopOpacity="1"/>
        </linearGradient>
      </defs>

      {/* ── LEFT: rock cliff face + broken columns ── */}
      <path d="M0,900 L0,0 L210,0 L195,55 Q220,38 240,52 L245,0 L320,0 L320,900 Z"
        fill="#0a0806" opacity="0"/>
      {/* Main cliff body */}
      <path d="M0,900 L0,0 L165,0 Q148,42 152,95 Q178,72 175,130 Q148,112 145,175 Q168,155 165,215 Q142,198 140,260 Q160,242 158,310 Q138,292 135,365 Q155,348 152,420 Q134,402 130,480 Q148,462 146,540 Q128,522 125,600 Q140,583 138,660 Q120,643 116,722 Q130,705 128,780 Q108,764 102,840 L80,900 Z"
        fill="url(#ruinGradL)" opacity="0.98"/>
      <path d="M0,900 L0,0 L105,0 Q90,55 88,115 Q110,95 107,155 Q85,138 82,200 Q100,182 97,248 Q78,230 74,300 Q90,282 87,355 Q70,337 66,410 Q80,393 77,470 Q60,453 56,530 Q68,513 65,590 Q50,573 45,650 Q58,633 53,710 Q40,693 36,772 Q46,756 42,840 L20,900 Z"
        fill="#07050d" opacity="1"/>
      {/* Left broken columns */}
      <rect x="50"  y="0" width="16" height="285" fill="#0d0907" opacity="0.94" rx="1"/>
      <rect x="48"  y="0" width="20" height="7"   fill="#181208" opacity="0.88"/>
      <rect x="42"  y="90"  width="32" height="5" fill="#181208" opacity="0.80" rx="1"/>
      <rect x="44"  y="188" width="28" height="4" fill="#161008" opacity="0.75" rx="1"/>
      <rect x="110" y="0"  width="12" height="195" fill="#0d0907" opacity="0.88" rx="1"/>
      <rect x="108" y="95" width="16" height="4"  fill="#181208" opacity="0.75" rx="1"/>
      {/* Glowing inscription fissures */}
      <line x1="54" y1="115" x2="60" y2="148" stroke="rgba(232,175,55,0.13)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="59" y1="148" x2="55" y2="180" stroke="rgba(232,175,55,0.08)" strokeWidth="1"   strokeLinecap="round"/>
      {/* Left dune floor */}
      <path d="M0,900 L0,720 Q38,692 82,712 Q120,675 162,700 Q195,668 230,688 L250,900 Z"
        fill="#08060c" opacity="0.96"/>
      <path d="M0,900 L0,810 Q45,790 88,808 Q130,782 175,800 Q205,778 240,793 L260,900 Z"
        fill="#0a0808" opacity="1"/>
      {/* Rubble */}
      <rect x="14"  y="648" width="22" height="11" fill="#0e0a06" opacity="0.88" rx="1" transform="rotate(-3 14 648)"/>
      <rect x="58"  y="668" width="16" height="9"  fill="#0d0907" opacity="0.84" rx="1" transform="rotate(2 58 668)"/>
      <rect x="100" y="678" width="26" height="10" fill="#0c0806" opacity="0.86" rx="1" transform="rotate(-1.5 100 678)"/>

      {/* ── RIGHT: temple arch ruin + dune ── */}
      <path d="M1440,900 L1440,0 L1275,0 Q1292,42 1288,95 Q1262,72 1265,130 Q1292,112 1295,175 Q1272,155 1275,215 Q1298,198 1300,260 Q1280,242 1282,310 Q1302,292 1305,365 Q1285,348 1288,420 Q1306,402 1310,480 Q1292,462 1294,540 Q1312,522 1315,600 Q1300,583 1302,660 Q1320,643 1324,722 Q1310,705 1312,780 Q1332,764 1338,840 L1360,900 Z"
        fill="url(#ruinGradR)" opacity="0.98"/>
      <path d="M1440,900 L1440,0 L1335,0 Q1350,55 1352,115 Q1330,95 1333,155 Q1355,138 1358,200 Q1340,182 1343,248 Q1362,230 1366,300 Q1350,282 1353,355 Q1370,337 1374,410 Q1360,393 1363,470 Q1380,453 1384,530 Q1372,513 1375,590 Q1390,573 1395,650 Q1382,633 1387,710 Q1400,693 1404,772 Q1394,756 1398,840 L1420,900 Z"
        fill="#07050d" opacity="1"/>
      {/* Right broken column */}
      <rect x="1374" y="0"  width="16" height="268" fill="#0d0907" opacity="0.94" rx="1"/>
      <rect x="1372" y="0"  width="20" height="7"   fill="#181208" opacity="0.88"/>
      <rect x="1366" y="85"  width="32" height="5"  fill="#181208" opacity="0.80" rx="1"/>
      <rect x="1368" y="180" width="28" height="4"  fill="#161008" opacity="0.75" rx="1"/>
      <rect x="1318" y="0"  width="12" height="210" fill="#0d0907" opacity="0.88" rx="1"/>
      <rect x="1316" y="105" width="16" height="4"  fill="#181208" opacity="0.75" rx="1"/>
      {/* Arch lintel between columns — broken at center */}
      <path d="M1318,0 L1318,82 Q1346,64 1374,82 L1374,0"
        fill="none" stroke="#0e0907" strokeWidth="13" opacity="0.90"/>
      <path d="M1320,0 L1320,79 Q1347,62 1374,79"
        fill="none" stroke="#181208" strokeWidth="3.5" opacity="0.72"/>
      {/* Inscription glow on right column */}
      <line x1="1376" y1="130" x2="1382" y2="162" stroke="rgba(232,175,55,0.11)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Right dune */}
      <path d="M1440,900 L1440,720 Q1402,692 1358,712 Q1320,675 1278,700 Q1245,668 1210,688 L1190,900 Z"
        fill="#08060c" opacity="0.96"/>
      <path d="M1440,900 L1440,810 Q1395,790 1352,808 Q1310,782 1265,800 Q1235,778 1200,793 L1180,900 Z"
        fill="#0a0808" opacity="1"/>
      {/* Rubble right */}
      <rect x="1360" y="648" width="22" height="11" fill="#0e0a06" opacity="0.88" rx="1" transform="rotate(3 1360 648)"/>
      <rect x="1318" y="662" width="18" height="10" fill="#0d0907" opacity="0.84" rx="1" transform="rotate(-2 1318 662)"/>
      <rect x="1268" y="675" width="26" height="10" fill="#0c0806" opacity="0.86" rx="1" transform="rotate(1.5 1268 675)"/>

      {/* ── BOTTOM: desert ground — sand dunes + buried ruins ── */}
      <path d="M0,900 L0,820 Q120,790 205,808 Q295,776 385,800 Q475,772 565,796 Q645,775 720,796 Q795,775 875,796 Q965,772 1055,800 Q1145,776 1235,808 Q1320,790 1440,820 L1440,900 Z"
        fill="#07060c" opacity="0.96"/>
      <path d="M0,900 L0,860 Q85,840 155,856 Q245,832 335,850 Q425,828 515,848 Q600,830 680,848 Q760,832 840,848 Q920,828 1010,850 Q1100,832 1190,856 Q1272,840 1360,856 Q1400,848 1440,860 L1440,900 Z"
        fill="#09070d" opacity="1"/>
      {/* Buried stone foundation blocks */}
      <rect x="265"  y="820" width="36" height="12" fill="#0e0a06" opacity="0.86" rx="1"/>
      <rect x="418"  y="828" width="22" height="10" fill="#0d0907" opacity="0.80" rx="1" transform="rotate(-1.5 418 828)"/>
      <rect x="688"  y="822" width="30" height="12" fill="#0e0a06" opacity="0.82" rx="1" transform="rotate(1 688 822)"/>
      <rect x="955"  y="826" width="26" height="11" fill="#0d0907" opacity="0.80" rx="1"/>
      <rect x="1165" y="820" width="33" height="13" fill="#0e0a06" opacity="0.83" rx="1" transform="rotate(-0.5 1165 820)"/>
      {/* Golden inscriptions on ground stones */}
      <line x1="274"  y1="823" x2="289"  y2="823" stroke="rgba(232,175,55,0.11)" strokeWidth="1.5"/>
      <line x1="697"  y1="825" x2="708"  y2="825" stroke="rgba(232,175,55,0.09)" strokeWidth="1.5"/>
      <line x1="963"  y1="828" x2="975"  y2="828" stroke="rgba(232,175,55,0.10)" strokeWidth="1.5"/>

      {/* ── TOP: distant horizon ridge — Journey mountain silhouette ── */}
      <path d="M0,0 L0,50 Q180,34 300,44 Q420,28 540,40 Q660,26 720,38 Q780,26 900,40 Q1020,28 1140,44 Q1260,32 1380,44 L1440,50 L1440,0 Z"
        fill="#09070f" opacity="0.60"/>
      {/* Ultra-distant citadel spires */}
      <rect x="682" y="22" width="5"  height="28" fill="#0c0a14" opacity="0.65"/>
      <rect x="693" y="15" width="4"  height="35" fill="#0c0a14" opacity="0.58"/>
      <rect x="703" y="20" width="6"  height="30" fill="#0c0a14" opacity="0.62"/>
      <rect x="715" y="26" width="4"  height="24" fill="#0c0a14" opacity="0.52"/>
      <rect x="752" y="18" width="7"  height="32" fill="#0c0a14" opacity="0.48"/>
      <rect x="763" y="12" width="4"  height="38" fill="#0c0a14" opacity="0.58"/>
    </svg>
  );
}

// ─── World ────────────────────────────────────────────────────────────────────
export default function World() {
  const worldRef = useRef<HTMLDivElement>(null);
  const [win, setWin] = useState({ w: 1440, h: 900 });
  const { playClick, playHover, playDonate, toggleMusic, musicPlaying, playBell, playPageTurn } = useAudio();
  const [introVisible, setIntroVisible] = useState(true);
  const [flashTrigger, setFlashTrigger] = useState(0);

  const [villages, setVillages] = useState<VillageWithState[]>(() =>
    VILLAGES.map(v => { const pct=v.raised/v.target; return {...v, state: pct>=1?'funded':pct>0.4?'lit':'unlit'}; })
  );
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [showManifiesto, setShowManifiesto] = useState(false);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const update = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const W = win.w;
  const H = win.h;
  const isMobile = W < 640;
  const hub: Pos = { x: W / 2, y: H * 0.50 };
  const radius = Math.min(W, H) * (isMobile ? 0.24 : 0.38);

  const positions = useMemo<Pos[]>(() =>
    villages.map(v => {
      const a = (v.angle * Math.PI) / 180;
      return { x: hub.x+Math.cos(a)*radius, y: hub.y+Math.sin(a)*radius*0.76 };
    }), [hub.x, hub.y, radius, villages]
  );

  const totalProgress = useMemo(() => {
    const t=villages.reduce((a,v)=>a+v.target,0);
    const r=villages.reduce((a,v)=>a+v.raised,0);
    return r/t;
  }, [villages]);

  const totalRaised = villages.reduce((a,v)=>a+v.raised,0);
  const totalSupporters = villages.reduce((a,v)=>a+v.supporters,0);
  const selected = villages.find(v=>v.id===selectedId);
  const selectedIdx = villages.findIndex(v=>v.id===selectedId);
  const selectedPos = selectedIdx>=0 ? positions[selectedIdx] : null;

  const doDonate = useCallback((id: string, amount: number) => {
    const idx = villages.findIndex(v=>v.id===id);
    if (idx<0) return;
    const p = positions[idx];
    const wasState = villages[idx].state;
    playDonate();
    setVillages(prev=>prev.map(v=>{
      if (v.id!==id) return v;
      const newRaised=v.raised+amount;
      const pct=newRaised/v.target;
      return {...v, raised:newRaised, supporters:v.supporters+1, state:pct>=1?'funded':pct>0.4?'lit':'unlit'};
    }));
    const newState = (villages[idx].raised+amount)/villages[idx].target >= 1 ? 'funded' : (villages[idx].raised+amount)/villages[idx].target > 0.4 ? 'lit' : 'unlit';
    if (newState !== wasState) setFlashTrigger(Date.now());
    const phrase: Phrase = { id: Date.now()+Math.random(), x: p.x, y: p.y-30, text: amount>=1000 ? 'Tu donación no es un número. Es luz que viaja.' : 'Es luz que viaja ✦' };
    setPhrases(ps=>[...ps, phrase]);
    setTimeout(() => setPhrases(ps=>ps.filter(x=>x.id!==phrase.id)), 4500);
    setEmbers([{x:p.x, y:p.y, tx:hub.x, ty:hub.y, color:villages[idx].color}]);
  }, [positions, villages, hub.x, hub.y, playDonate]);

  const handleVillageSelect = useCallback((id: string) => {
    playClick();
    setSelectedId(prev => prev===id ? null : id);
  }, [playClick]);

  // ── Cinematic stage zoom toward selected village ──────────────────────────
  // When a village is selected, the stage scales 1.08x and translates so the
  // selected village moves ~25% toward screen center — like a camera push.
  const stageTransform = useMemo(() => {
    if (!selectedId || !selectedPos) return 'scale(1) translate(0px, 0px)';
    const scale = 1.08;
    // How far we shift: pull the village toward center at 25% magnitude
    const cx = W / 2;
    const cy = H / 2;
    const dx = (cx - selectedPos.x) * 0.25 / scale;
    const dy = (cy - selectedPos.y) * 0.20 / scale;
    return `scale(${scale}) translate(${dx}px, ${dy}px)`;
  }, [selectedId, selectedPos, W, H]);

  return (
    <>
    {introVisible && <IntroScreen
      onEnter={() => setIntroVisible(false)}
      playClick={playClick}
      toggleMusic={toggleMusic}
      musicPlaying={musicPlaying}
      playHover={playHover}
      playBell={playBell}
    />}
    <div className="world-fit" style={{ opacity: introVisible ? 0 : 1, transition: 'opacity 1.2s ease' }}>
      <VillageHoverProvider>
      <div className={`world${selectedId?' has-card':''}`} ref={worldRef}>
        <div className="canopy"/>
        <div className="rays"/>
        {!isMobile && <div className="flower-of-life"><FlowerOfLife/></div>}
        <div className="grain"/>
        {!isMobile && <ForestEdges/>}

        {/* ── Atmospheric Systems — desktop only (too heavy for mobile) ── */}
        {!isMobile && <LightRays cx={hub.x} cy={hub.y} />}
        {!isMobile && <JourneyFog />}
        {!isMobile && <ClothParticles />}

        <ScreenFlash trigger={flashTrigger}/>

        {/* Nav */}
        <div className="topbar">
          <div className="brand">
            <svg className="brand-mark" viewBox="-22 -22 44 44" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><clipPath id="fol-clip-brand"><circle cx="0" cy="0" r="20"/></clipPath></defs>
              <g clipPath="url(#fol-clip-brand)" stroke="#e8c96d" strokeWidth="0.7" opacity="0.9">
                <circle cx="0" cy="0" r="10"/>
                <circle cx="10" cy="0" r="10"/>
                <circle cx="5" cy="8.66" r="10"/>
                <circle cx="-5" cy="8.66" r="10"/>
                <circle cx="-10" cy="0" r="10"/>
                <circle cx="-5" cy="-8.66" r="10"/>
                <circle cx="5" cy="-8.66" r="10"/>
              </g>
              <circle cx="0" cy="0" r="20" stroke="#e8c96d" strokeWidth="0.9" opacity="0.7"/>
            </svg>
            <div>
              <div className="brand-name">Embajadores</div>
              <div style={{marginTop:'-4px'}}><span className="brand-sub">de la luz</span></div>
            </div>
          </div>
          <button className="manifiesto-btn" onClick={()=>{playClick();setShowManifiesto(true);}}>
            ✦ Manifiesto
          </button>
          <button className="music-btn" onClick={toggleMusic} title={musicPlaying?'Silenciar':'Música'}>
            {musicPlaying ? '♫' : '♪'}
          </button>
        </div>

        {showManifiesto && <ManifiestoBook onClose={()=>setShowManifiesto(false)} playPageTurn={playPageTurn}/>}

        <div className="side-panel">
          <h3>Aldeas en flor</h3>
          {villages.map(v=>{
            const pct=Math.round((v.raised/v.target)*100);
            return(
              <div key={v.id} className="sp-line" onClick={()=>handleVillageSelect(v.id)} style={{cursor:'none'}}>
                <span className={`sp-dot${v.state!=='unlit'?' on':''}`} style={{background:v.state!=='unlit'?v.color:'rgba(245,234,214,0.2)',boxShadow:v.state!=='unlit'?`0 0 8px ${v.color}`:'none'}}/>
                <span style={{flex:1}}>{v.name}</span>
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

        <div className={`stage${selectedId ? ' zoomed' : ''}`} style={{ transform: stageTransform }}>
          <PathsLayer positions={positions} hub={hub} villages={villages} W={W} H={H}/>

          <div className="hub" style={{left:(hub.x-(isMobile?65:140))+'px', top:(hub.y-(isMobile?65:140))+'px'}}>
            <div className="hub-glow"/>
            <div className="hub-mandala"><Mandala progress={totalProgress}/></div>
            <div className="hub-core">
              <div className="hub-label-sm">Casa Central</div>
              <div className="hub-pct">{Math.round(totalProgress*100)}<sup>%</sup></div>
            </div>
          </div>

          {villages.map((v,i)=>(
            <VillageNode key={v.id} v={v} pos={positions[i]}
              selected={selectedId===v.id}
              onSelect={handleVillageSelect}
              onHover={playHover}/>
          ))}
        </div>

        <Particles density={isMobile ? 0.08 : 1} embers={embers}/>

        {phrases.map(p=>(
          <div key={p.id} className="float-phrase" style={{left:p.x+'px', top:p.y+'px'}}>{p.text}</div>
        ))}

        {selected && selectedPos && (
          <DetailCard v={selected} pos={selectedPos} W={W} H={H} onClose={()=>{playClick();setSelectedId(null);}} onDonate={doDonate}/>
        )}

        <div className="hud">
          <div className="hud-stat">
            <div className="hud-stat-lbl">Luz total recolectada</div>
            <div className="hud-stat-val">${totalRaised.toLocaleString('es-MX')} <span className="hud-unit">MXN</span></div>
            <div className="hud-stat-sub">Meta colectiva · ${villages.reduce((a,v)=>a+v.target,0).toLocaleString('es-MX')}</div>
          </div>
          <div className="hud-center">Toca una aldea · envíale tu luz ✦</div>
          <div className="hud-stat" style={{textAlign:'right',alignItems:'flex-end'}}>
            <div className="hud-stat-lbl">Embajadores activos</div>
            <div className="hud-stat-val">{totalSupporters.toLocaleString('es-MX')}</div>
            <div className="hud-stat-sub">desde 14 países · creciendo</div>
          </div>
        </div>

        <CursorLight scaleRef={worldRef}/>
      </div>
      </VillageHoverProvider>
    </div>
    </>
  );
}
