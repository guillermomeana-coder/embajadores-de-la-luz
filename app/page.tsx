'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VILLAGES, Village } from '@/lib/villages';

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
    if (!ctxRef.current) ctxRef.current = new AudioContext();
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
      master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3);
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
        g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1);
        setMusicPlaying(true);
      }
    }
  }, [getCtx, musicPlaying]);

  return { playClick, playHover, playDonate, toggleMusic, musicPlaying };
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
      const scale = rect.width / 1440;
      el.style.left = ((e.clientX - rect.left) / scale) + 'px';
      el.style.top = ((e.clientY - rect.top) / scale) + 'px';
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

// ─── Intro Screen ────────────────────────────────────────────────────────────
const PHRASES = [
  { text: 'No es una organización tradicional.', highlight: null },
  { text: 'Es una estructura viva.', highlight: 'Es una estructura viva.' },
  { text: 'No buscamos ser vistos.', highlight: null },
  { text: 'Buscamos sembrar.', highlight: 'Buscamos sembrar.' },
  { text: 'Cada acción es una luz encendida en el mundo.', highlight: null },
  { text: '"Las raíces no se ven, pero sostienen el bosque."', highlight: '"Las raíces no se ven, pero sostienen el bosque."' },
];

function IntroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const ww = window.innerWidth, hh = window.innerHeight;
    const parts = Array.from({ length: 80 }, () => ({
      x: Math.random() * ww, y: Math.random() * hh,
      vx: (Math.random() - .5) * .3, vy: -.1 - Math.random() * .4,
      r: .3 + Math.random() * 1.8, a: .1 + Math.random() * .6,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < .6 ? '#e8c96d' : '#fffbe8',
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, ww, hh);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += .02;
        if (p.y < -10) { p.y = hh + 10; p.x = Math.random() * ww; }
        if (p.x < -10) p.x = ww + 10; if (p.x > ww + 10) p.x = -10;
        ctx.beginPath(); ctx.fillStyle = p.hue;
        ctx.globalAlpha = p.a * (.5 + .5 * Math.sin(p.phase));
        ctx.shadowColor = p.hue; ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="intro-canvas" />;
}

function IntroScreen({ onEnter, playClick }: { onEnter: () => void; playClick: () => void }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showBtn, setShowBtn] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const move = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  useEffect(() => {
    if (phraseIdx >= PHRASES.length) { setShowBtn(true); return; }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => { setPhraseIdx(i => i + 1); setVisible(true); }, 700);
    }, phraseIdx === PHRASES.length - 1 ? 3500 : 2200);
    return () => clearTimeout(timer);
  }, [phraseIdx]);

  const phrase = PHRASES[phraseIdx];
  const isQuote = phrase?.text.startsWith('"');

  return (
    <div className="intro">
      {/* custom cursor on intro */}
      <div className="cursor-light" style={{ position: 'fixed', left: cursorPos.x + 'px', top: cursorPos.y + 'px', opacity: 1, zIndex: 10001 }}>
        <div className="cursor-aura" />
        <div className="cursor-core" />
      </div>

      <IntroParticles />

      <div className="intro-logo">
        <div className="intro-orb" />
        <div className="intro-title">Embajadores</div>
        <div className="intro-sub">de la Luz</div>
      </div>

      <div className="intro-divider" />

      {!showBtn ? (
        <p className="intro-phrase" style={{ opacity: visible ? 1 : 0 }}>
          {isQuote ? <em>{phrase?.text}</em> : phrase?.text}
        </p>
      ) : (
        <p className="intro-phrase" style={{ opacity: 1, fontSize: 18, color: 'rgba(245,234,214,0.7)' }}>
          Una red de luces encendidas alrededor del mundo.<br />
          <span style={{ fontFamily: 'var(--script)', color: 'var(--gold)', fontSize: 22 }}>Ingresas por invitación. Permaneces por coherencia.</span>
        </p>
      )}

      {showBtn && (
        <button className="intro-enter" onClick={() => { playClick(); onEnter(); }}>
          ✦ Entra al Mapa ✦
        </button>
      )}
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
  const petals = 16;
  return (
    <svg viewBox="-110 -110 220 220" width="220" height="220" style={{width:'100%',height:'100%'}}>
      <defs>
        <radialGradient id="mg"><stop offset="0%" stopColor="#fffbe8" stopOpacity="0.95"/><stop offset="40%" stopColor="#e8c96d" stopOpacity="0.7"/><stop offset="100%" stopColor="#c9872a" stopOpacity="0"/></radialGradient>
        <radialGradient id="mgI"><stop offset="0%" stopColor="#fffbe8" stopOpacity={0.6+0.4*progress}/><stop offset="60%" stopColor="#e8c96d" stopOpacity={0.5*progress+0.1}/><stop offset="100%" stopColor="#c9872a" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="0" cy="0" r="100" fill="url(#mg)" opacity="0.55"/>
      {Array.from({length:petals}).map((_,i)=>{const a=(Math.PI*2*i)/petals;const x=Math.cos(a)*78,y=Math.sin(a)*78;const lit=i<Math.round(petals*progress);return<g key={i} transform={`translate(${x},${y}) rotate(${(a*180)/Math.PI+90})`}><ellipse cx="0" cy="0" rx="6" ry="14" fill={lit?'#fffbe8':'transparent'} stroke={lit?'#fffbe8':'rgba(245,234,214,0.4)'} strokeWidth="0.8" opacity={lit?0.9:0.45} style={{filter:lit?'drop-shadow(0 0 6px rgba(232,201,109,0.9))':'none'}}/></g>;})}
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

// ─── Village Building SVGs (map-style top-down) ───────────────────────────────
const BUILDINGS: Record<string, React.ReactNode> = {
  educacion: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="20" y="38" width="40" height="26" fill="currentColor" opacity="0.25" rx="1"/>
      <polygon points="40,10 14,38 66,38" fill="currentColor" opacity="0.5"/>
      <rect x="34" y="50" width="12" height="14" fill="currentColor" opacity="0.6" rx="1"/>
      <rect x="22" y="42" width="8" height="8" fill="currentColor" opacity="0.4" rx="0.5"/>
      <rect x="50" y="42" width="8" height="8" fill="currentColor" opacity="0.4" rx="0.5"/>
      <line x1="40" y1="10" x2="40" y2="4" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="36" y1="6" x2="44" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
    </svg>
  ),
  salud: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="18" y="28" width="44" height="38" fill="currentColor" opacity="0.2" rx="2"/>
      <polygon points="40,8 16,28 64,28" fill="currentColor" opacity="0.45"/>
      <rect x="34" y="36" width="12" height="4" fill="currentColor" opacity="0.9"/>
      <rect x="38" y="32" width="4" height="12" fill="currentColor" opacity="0.9"/>
      <rect x="22" y="45" width="10" height="20" fill="currentColor" opacity="0.35" rx="1"/>
      <rect x="48" y="45" width="10" height="20" fill="currentColor" opacity="0.35" rx="1"/>
    </svg>
  ),
  arte: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="46" rx="26" ry="20" fill="currentColor" opacity="0.2"/>
      <path d="M14 46 Q20 26 40 20 Q60 26 66 46" fill="currentColor" opacity="0.4"/>
      <circle cx="40" cy="46" r="8" fill="currentColor" opacity="0.5"/>
      <line x1="14" y1="46" x2="66" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="26" cy="38" r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="54" cy="38" r="3" fill="currentColor" opacity="0.6"/>
      <path d="M36 46 Q40 40 44 46" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8"/>
    </svg>
  ),
  ambiente: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="38" rx="18" ry="22" fill="currentColor" opacity="0.4"/>
      <ellipse cx="22" cy="48" rx="12" ry="15" fill="currentColor" opacity="0.3"/>
      <ellipse cx="58" cy="48" rx="12" ry="15" fill="currentColor" opacity="0.3"/>
      <rect x="38" y="56" width="4" height="14" fill="currentColor" opacity="0.5"/>
      <rect x="34" y="66" width="12" height="3" fill="currentColor" opacity="0.4" rx="1"/>
      <circle cx="40" cy="30" r="4" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
  animal: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="50" rx="22" ry="16" fill="currentColor" opacity="0.2"/>
      <path d="M18 50 C18 34 26 24 40 22 C54 24 62 34 62 50 C62 60 55 66 40 68 C25 66 18 60 18 50 Z" fill="currentColor" opacity="0.3"/>
      <circle cx="32" cy="42" r="3" fill="currentColor" opacity="0.7"/>
      <circle cx="48" cy="42" r="3" fill="currentColor" opacity="0.7"/>
      <path d="M36 52 Q40 56 44 52" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8"/>
      <path d="M26 28 C24 20 28 14 32 16" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
      <path d="M54 28 C56 20 52 14 48 16" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  ),
  comunidad: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="30" y="28" width="20" height="36" fill="currentColor" opacity="0.3" rx="1"/>
      <polygon points="40,10 28,28 52,28" fill="currentColor" opacity="0.5"/>
      <rect x="10" y="38" width="18" height="26" fill="currentColor" opacity="0.2" rx="1"/>
      <polygon points="19,26 8,38 30,38" fill="currentColor" opacity="0.35"/>
      <rect x="52" y="38" width="18" height="26" fill="currentColor" opacity="0.2" rx="1"/>
      <polygon points="61,26 50,38 72,38" fill="currentColor" opacity="0.35"/>
      <rect x="36" y="46" width="8" height="18" fill="currentColor" opacity="0.5" rx="1"/>
    </svg>
  ),
};

// ─── Paths Layer ──────────────────────────────────────────────────────────────
function PathsLayer({ positions, hub, villages }: { positions: Pos[]; hub: Pos; villages: VillageWithState[] }) {
  return (
    <svg className="paths-svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
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
              <circle r="4" fill="#fffbe8">
                <animateMotion dur={`${3+i*0.7}s`} repeatCount="indefinite" path={d}/>
                <animate attributeName="opacity" values="0;1;1;0" dur={`${3+i*0.7}s`} repeatCount="indefinite"/>
              </circle>
              <circle r="7" fill="#e8c96d" opacity="0.3">
                <animateMotion dur={`${3+i*0.7}s`} repeatCount="indefinite" path={d} begin={`${i*0.4}s`}/>
              </circle>
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
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div
      className={`village${selected ? ' selected' : ''}`}
      data-state={v.state}
      style={{ left: pos.x+'px', top: pos.y+'px', color: v.color } as React.CSSProperties}
      onClick={() => onSelect(v.id)}
      onMouseEnter={onHover}
    >
      {/* Outer glow ring */}
      <div className="v-outer-glow" />

      {/* Sun rays for funded */}
      <div className="v-rays"><SunRays /></div>

      {/* Progress ring (SVG) */}
      <svg className="v-ring" viewBox="0 0 120 120" width="160" height="160">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(245,234,214,0.08)" strokeWidth="3"/>
        <circle cx="60" cy="60" r="52" fill="none"
          stroke={v.color} strokeWidth="3"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 6px ${v.color})`, transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>

      {/* Hex tile disc */}
      <div className="v-hex">
        <div className="v-building" style={{ color: v.state === 'unlit' ? 'rgba(245,234,214,0.35)' : v.color }}>
          {BUILDINGS[v.id]}
        </div>
      </div>

      {/* Label */}
      <div className="v-label">{v.name}</div>

      {/* Level badge */}
      <div className="v-badge" style={{ background: v.state === 'funded' ? v.color : 'rgba(12,31,21,0.8)', borderColor: v.color }}>
        {v.state === 'funded' ? '✦' : v.state === 'lit' ? '◈' : '◇'}
      </div>
    </div>
  );
}

// ─── Detail Card ──────────────────────────────────────────────────────────────
function DetailCard({ v, pos, onClose, onDonate }: {
  v: VillageWithState; pos: Pos; onClose: () => void; onDonate: (id: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState(500);
  const presets = [250, 500, 1000, 2500];
  const pct = Math.min(100, (v.raised / v.target) * 100);
  const W=1440,H=900,CW=380,CH=560,margin=24,gap=90;
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

// ─── World ────────────────────────────────────────────────────────────────────
export default function World() {
  const W=1440, H=900;
  const scalerRef = useRef<HTMLDivElement>(null);
  const { playClick, playHover, playDonate, toggleMusic, musicPlaying } = useAudio();
  const [introVisible, setIntroVisible] = useState(true);
  const [flashTrigger, setFlashTrigger] = useState(0);

  const [villages, setVillages] = useState<VillageWithState[]>(() =>
    VILLAGES.map(v => { const pct=v.raised/v.target; return {...v, state: pct>=1?'funded':pct>0.4?'lit':'unlit'}; })
  );
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth/W, window.innerHeight/H);
      if (scalerRef.current) scalerRef.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const hub: Pos = { x: W/2, y: H*0.54 };
  const radius = 295;

  const positions = useMemo<Pos[]>(() =>
    villages.map(v => {
      const a = (v.angle * Math.PI) / 180;
      return { x: hub.x+Math.cos(a)*radius, y: hub.y+Math.sin(a)*radius*0.76 };
    }), [villages]
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

  return (
    <>
    {introVisible && <IntroScreen onEnter={() => { setIntroVisible(false); toggleMusic(); }} playClick={playClick} />}
    <div className="world-fit" style={{ opacity: introVisible ? 0 : 1, transition: 'opacity 1.2s ease' }}>
      <div className="world-scaler" ref={scalerRef}>
        <div className={`world${selectedId?' has-card':''}`}>
          <div className="canopy"/>
          <div className="rays"/>
          <div className="flower-of-life"><FlowerOfLife/></div>
          <div className="grain"/>

          <ScreenFlash trigger={flashTrigger}/>

          {/* Music */}
          <button className="music-btn" onClick={toggleMusic}>
            {musicPlaying ? '♫' : '♪'}
            <span>{musicPlaying ? 'Silenciar' : 'Música'}</span>
          </button>

          {/* Nav */}
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark"/>
              <div>
                <div className="brand-name">Embajadores</div>
                <div style={{marginTop:'-4px'}}><span className="brand-sub">de la luz</span></div>
              </div>
            </div>
            <div className="nav-links">
              <a>El Mapa</a><a>Aldeas</a><a>Manifiesto</a><a>Embajadores</a>
            </div>
            <div className="lang-pill">ES · MXN ▾</div>
          </div>

          <div className="hero-eyebrow">
            <p className="kicker">~ El mapa vivo de la luz ~</p>
            <h1><span className="dash"/>Envía Luz<span className="dash"/></h1>
          </div>

          <div className="side-panel">
            <h3>Aldeas en flor</h3>
            {villages.map(v=>{
              const pct=Math.round((v.raised/v.target)*100);
              return(
                <div key={v.id} className="sp-line">
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

          <div className="stage">
            <PathsLayer positions={positions} hub={hub} villages={villages}/>

            <div className="hub" style={{left:(hub.x-140)+'px', top:(hub.y-140)+'px'}}>
              <div className="hub-glow"/>
              <div className="hub-mandala"><Mandala progress={totalProgress}/></div>
              <div className="hub-core">
                <div className="hub-label-sm">Casa Central</div>
                <div className="hub-pct">{Math.round(totalProgress*100)}<sup>%</sup></div>
              </div>
              <div className="hub-caption">
                <div className="hcap-label">El Origen</div>
                <div className="hcap-sub">Luz total · 2026</div>
              </div>
            </div>

            {villages.map((v,i)=>(
              <VillageNode key={v.id} v={v} pos={positions[i]}
                selected={selectedId===v.id}
                onSelect={handleVillageSelect}
                onHover={playHover}/>
            ))}
          </div>

          <Particles embers={embers}/>

          {phrases.map(p=>(
            <div key={p.id} className="float-phrase" style={{left:p.x+'px', top:p.y+'px'}}>{p.text}</div>
          ))}

          {selected && selectedPos && (
            <DetailCard v={selected} pos={selectedPos} onClose={()=>{playClick();setSelectedId(null);}} onDonate={doDonate}/>
          )}

          <div className="mobile-hint">
            <div className="phone"/>
            <div>
              <div style={{fontFamily:'var(--font-script)',fontSize:17,color:'var(--gold)',lineHeight:1}}>Lleva la luz contigo</div>
              <div style={{fontSize:11,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(245,234,214,0.6)',marginTop:2}}>iOS · Android</div>
            </div>
          </div>

          <div className="hud">
            <div className="hud-stat">
              <div className="hud-stat-lbl">Luz total recolectada</div>
              <div className="hud-stat-val">${totalRaised.toLocaleString('es-MX')} <span style={{fontSize:16,opacity:.6}}>MXN</span></div>
              <div className="hud-stat-sub">Meta colectiva · ${villages.reduce((a,v)=>a+v.target,0).toLocaleString('es-MX')}</div>
            </div>
            <div className="hud-center">Toca una aldea para enviarle tu luz. Mira cómo viaja por las venas doradas del mapa.</div>
            <div className="hud-stat" style={{textAlign:'right',alignItems:'flex-end'}}>
              <div className="hud-stat-lbl">Embajadores activos</div>
              <div className="hud-stat-val">{totalSupporters.toLocaleString('es-MX')}</div>
              <div className="hud-stat-sub">desde 14 países · creciendo</div>
            </div>
          </div>

          <div className="compass">
            <div className="compass-ring"><span className="compass-n">N</span></div>
          </div>

          <CursorLight scaleRef={scalerRef}/>
        </div>
      </div>
    </div>
    </>
  );
}
