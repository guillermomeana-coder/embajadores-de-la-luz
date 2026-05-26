// Journey-inspired temple/ruin silhouette SVGs for each village type.
// Style: ancient ruins glowing from within, warm amber-gold light, atmospheric fog.
// Colors: building silhouette = #1a2d1e / #0d1a10 (dark forest), glow = village accent.

export const VILLAGE_SVGS: Record<string, string> = {

  // ──────────────────────────────────────────────────────────────
  // EDUCACIÓN — Ancient library/scriptorium ruin
  // Stacked stone arches, glowing scroll-tablets inside, flame at top
  // ──────────────────────────────────────────────────────────────
  educacion: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="edu-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="edu-softglow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="edu-inner" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#fff8e1" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#c9872a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="edu-flame-grad" cx="50%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#fffde0" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#e8c96d" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#c9872a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Atmospheric ground mist -->
  <ellipse cx="40" cy="74" rx="28" ry="5" fill="#c9872a" opacity="0.08" filter="url(#edu-softglow)"/>

  <!-- Inner glow behind arches -->
  <ellipse cx="40" cy="50" rx="20" ry="18" fill="url(#edu-inner)" filter="url(#edu-softglow)"/>

  <!-- Base platform — worn stone steps -->
  <rect x="14" y="65" width="52" height="5" rx="1" fill="#1a2d1e"/>
  <rect x="18" y="62" width="44" height="4" rx="1" fill="#1a2d1e"/>
  <rect x="22" y="59" width="36" height="4" rx="1" fill="#152518"/>

  <!-- Left column -->
  <rect x="22" y="28" width="6" height="32" rx="1" fill="#0d1a10"/>
  <!-- Left column capital (carved block) -->
  <rect x="20" y="26" width="10" height="4" rx="1" fill="#1a2d1e"/>

  <!-- Right column -->
  <rect x="52" y="28" width="6" height="32" rx="1" fill="#0d1a10"/>
  <!-- Right column capital -->
  <rect x="50" y="26" width="10" height="4" rx="1" fill="#1a2d1e"/>

  <!-- Central column (taller, slightly offset) -->
  <rect x="37" y="22" width="6" height="38" rx="1" fill="#0f1f12"/>
  <rect x="35" y="20" width="10" height="4" rx="1" fill="#1a2d1e"/>

  <!-- Outer arch (crumbled, asymmetric) -->
  <path d="M22 28 Q22 14 40 13 Q58 14 58 28" stroke="#1a2d1e" stroke-width="4" fill="none" stroke-linecap="round"/>

  <!-- Inner arch (second layer) -->
  <path d="M27 35 Q27 24 40 23 Q53 24 53 35" stroke="#152518" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- Keystone blocks on arches -->
  <rect x="38" y="12" width="4" height="5" rx="0.5" fill="#1a2d1e"/>
  <rect x="38.5" y="22" width="3" height="4" rx="0.5" fill="#152518"/>

  <!-- Glowing scroll/tablet inside left arch -->
  <rect x="26" y="44" width="8" height="11" rx="1" fill="#c9872a" opacity="0.7" filter="url(#edu-glow)"/>
  <line x1="28" y1="47" x2="32" y2="47" stroke="#fff8e1" stroke-width="0.7" opacity="0.9"/>
  <line x1="28" y1="49.5" x2="32" y2="49.5" stroke="#fff8e1" stroke-width="0.7" opacity="0.7"/>
  <line x1="28" y1="52" x2="32" y2="52" stroke="#fff8e1" stroke-width="0.7" opacity="0.5"/>

  <!-- Glowing scroll/tablet inside right arch -->
  <rect x="46" y="44" width="8" height="11" rx="1" fill="#c9872a" opacity="0.7" filter="url(#edu-glow)"/>
  <line x1="48" y1="47" x2="52" y2="47" stroke="#fff8e1" stroke-width="0.7" opacity="0.9"/>
  <line x1="48" y1="49.5" x2="52" y2="49.5" stroke="#fff8e1" stroke-width="0.7" opacity="0.7"/>
  <line x1="48" y1="52" x2="52" y2="52" stroke="#fff8e1" stroke-width="0.7" opacity="0.5"/>

  <!-- Central glowing tablet (larger, most important) -->
  <rect x="36" y="38" width="8" height="14" rx="1" fill="#e8c96d" opacity="0.8" filter="url(#edu-glow)"/>
  <line x1="38" y1="41.5" x2="42" y2="41.5" stroke="#fffde0" stroke-width="0.8" opacity="0.95"/>
  <line x1="38" y1="44" x2="42" y2="44" stroke="#fffde0" stroke-width="0.8" opacity="0.8"/>
  <line x1="38" y1="46.5" x2="42" y2="46.5" stroke="#fffde0" stroke-width="0.7" opacity="0.65"/>
  <line x1="38" y1="49" x2="41" y2="49" stroke="#fffde0" stroke-width="0.6" opacity="0.5"/>

  <!-- Flame at very top -->
  <ellipse cx="40" cy="9" rx="3.5" ry="5" fill="url(#edu-flame-grad)" filter="url(#edu-glow)" class="edu-flame"/>
  <ellipse cx="40" cy="11" rx="2" ry="3" fill="#fffde0" opacity="0.7" filter="url(#edu-glow)"/>

  <!-- Scattered ruin debris -->
  <rect x="12" y="63" width="5" height="3" rx="0.5" fill="#0d1a10" transform="rotate(-8, 14, 65)"/>
  <rect x="62" y="64" width="4" height="2.5" rx="0.5" fill="#0d1a10" transform="rotate(5, 64, 65)"/>
  <rect x="15" y="60" width="3" height="2" rx="0.3" fill="#152518" transform="rotate(-15, 16, 61)"/>
</svg>`,

  // ──────────────────────────────────────────────────────────────
  // SALUD — Healing sanctuary dome with glowing pool and vine columns
  // ──────────────────────────────────────────────────────────────
  salud: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="sal-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="sal-softglow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="sal-pool" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe0d0" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#f08a6a" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#b55a3a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sal-dome-inner" cx="50%" cy="70%" r="60%">
      <stop offset="0%" stop-color="#fff0e8" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#f08a6a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground mist -->
  <ellipse cx="40" cy="74" rx="26" ry="5" fill="#f08a6a" opacity="0.07" filter="url(#sal-softglow)"/>

  <!-- Glowing pool at base — radiates outward -->
  <ellipse cx="40" cy="66" rx="16" ry="5" fill="url(#sal-pool)" filter="url(#sal-softglow)"/>
  <ellipse cx="40" cy="66" rx="10" ry="3" fill="#f08a6a" opacity="0.5" filter="url(#sal-glow)"/>
  <!-- Pool rim stones -->
  <path d="M24 66 Q32 63 40 63 Q48 63 56 66" stroke="#1a2d1e" stroke-width="2.5" fill="none"/>
  <path d="M25 67.5 Q33 65 40 65 Q47 65 55 67.5" stroke="#152518" stroke-width="1.5" fill="none"/>

  <!-- Base platform -->
  <rect x="18" y="64" width="44" height="4" rx="1" fill="#1a2d1e"/>
  <rect x="15" y="67" width="50" height="4" rx="1" fill="#152518"/>

  <!-- Left vine-wrapped column -->
  <rect x="22" y="30" width="5" height="35" rx="1.5" fill="#0d1a10"/>
  <!-- Vine wraps on left column -->
  <path d="M22 55 Q27 53 22 50 Q27 47 22 44 Q27 41 22 38 Q27 35 22 32" stroke="#1a3a18" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- Small leaf clusters -->
  <ellipse cx="27" cy="52" rx="2.5" ry="1.5" fill="#1a3a18" opacity="0.8"/>
  <ellipse cx="27" cy="45" rx="2.5" ry="1.5" fill="#1a3a18" opacity="0.7"/>
  <ellipse cx="27" cy="38" rx="2" ry="1.2" fill="#1a3a18" opacity="0.6"/>

  <!-- Right vine-wrapped column -->
  <rect x="53" y="30" width="5" height="35" rx="1.5" fill="#0d1a10"/>
  <!-- Vine wraps on right column -->
  <path d="M58 55 Q53 53 58 50 Q53 47 58 44 Q53 41 58 38 Q53 35 58 32" stroke="#1a3a18" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="53" cy="52" rx="2.5" ry="1.5" fill="#1a3a18" opacity="0.8"/>
  <ellipse cx="53" cy="45" rx="2.5" ry="1.5" fill="#1a3a18" opacity="0.7"/>
  <ellipse cx="53" cy="38" rx="2" ry="1.2" fill="#1a3a18" opacity="0.6"/>

  <!-- Column capitals -->
  <rect x="20" y="27" width="9" height="4" rx="1" fill="#1a2d1e"/>
  <rect x="51" y="27" width="9" height="4" rx="1" fill="#1a2d1e"/>

  <!-- Dome structure — main arch -->
  <path d="M20 30 Q20 8 40 7 Q60 8 60 30" fill="#0f1f12" stroke="#1a2d1e" stroke-width="1"/>
  <!-- Dome inner glow -->
  <path d="M24 30 Q24 12 40 11 Q56 12 56 30" fill="url(#sal-dome-inner)"/>
  <!-- Dome outer ring -->
  <path d="M20 30 Q20 8 40 7 Q60 8 60 30" stroke="#1a2d1e" stroke-width="3" fill="none"/>

  <!-- Dome ornament lines (carved channels) -->
  <path d="M40 7 L40 30" stroke="#152518" stroke-width="1" opacity="0.6"/>
  <path d="M30 10 Q27 18 24 30" stroke="#152518" stroke-width="0.8" opacity="0.5"/>
  <path d="M50 10 Q53 18 56 30" stroke="#152518" stroke-width="0.8" opacity="0.5"/>

  <!-- Dome apex finial -->
  <rect x="38" y="4" width="4" height="5" rx="1" fill="#1a2d1e"/>
  <ellipse cx="40" cy="4" rx="2" ry="2" fill="#f08a6a" opacity="0.8" filter="url(#sal-glow)"/>

  <!-- Central healing glyph inside dome — glowing cross/plus -->
  <line x1="40" y1="20" x2="40" y2="30" stroke="#f08a6a" stroke-width="1.5" opacity="0.7" filter="url(#sal-glow)"/>
  <line x1="34" y1="25" x2="46" y2="25" stroke="#f08a6a" stroke-width="1.5" opacity="0.7" filter="url(#sal-glow)"/>
  <circle cx="40" cy="25" r="3" fill="none" stroke="#f08a6a" stroke-width="0.8" opacity="0.5" filter="url(#sal-glow)"/>

  <!-- Water ripple rings in pool -->
  <ellipse cx="40" cy="66" rx="4" ry="1.5" fill="none" stroke="#ffe0d0" stroke-width="0.6" opacity="0.7"/>
  <ellipse cx="40" cy="66" rx="7" ry="2.5" fill="none" stroke="#f0a090" stroke-width="0.5" opacity="0.4"/>
</svg>`,

  // ──────────────────────────────────────────────────────────────
  // ARTE — Ceremonial amphitheater: curved steps, floating cloth ribbons
  // ──────────────────────────────────────────────────────────────
  arte: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="art-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="art-ribbon-glow" x="-120%" y="-150%" width="340%" height="400%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="art-stage-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff0c8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#d9a35a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground atmosphere -->
  <ellipse cx="40" cy="74" rx="30" ry="5" fill="#d9a35a" opacity="0.08" filter="url(#art-glow)"/>

  <!-- Stage glow -->
  <ellipse cx="40" cy="62" rx="18" ry="7" fill="url(#art-stage-glow)" filter="url(#art-glow)"/>

  <!-- Amphitheater curved steps — 5 tiers from bottom to top -->
  <!-- Tier 5 (outermost/bottom) -->
  <path d="M10 70 Q40 66 70 70" stroke="#1a2d1e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Tier 4 -->
  <path d="M14 65 Q40 61 66 65" stroke="#1a2d1e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <!-- Tier 3 -->
  <path d="M18 60 Q40 56 62 60" stroke="#152518" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <!-- Tier 2 -->
  <path d="M22 55 Q40 51 58 55" stroke="#152518" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Tier 1 (innermost) -->
  <path d="M27 50 Q40 46 53 50" stroke="#0f1f12" stroke-width="2.3" fill="none" stroke-linecap="round"/>

  <!-- Fill between tiers for solidity -->
  <path d="M10 70 Q40 66 70 70 L70 72 Q40 68 10 72 Z" fill="#0d1a10"/>
  <path d="M14 65 Q40 61 66 65 L66 67 Q40 63 14 67 Z" fill="#0d1a10"/>
  <path d="M18 60 Q40 56 62 60 L62 62 Q40 58 18 62 Z" fill="#0f1f12"/>
  <path d="M22 55 Q40 51 58 55 L58 57 Q40 53 22 57 Z" fill="#0f1f12"/>

  <!-- Central stage platform -->
  <path d="M27 50 Q40 46 53 50 L52 53 Q40 49 28 53 Z" fill="#152518"/>
  <path d="M28 53 Q40 49 52 53 L50 56 Q40 52 30 56 Z" fill="#1a2d1e"/>

  <!-- Central glowing altar stone on stage -->
  <rect x="36" y="44" width="8" height="5" rx="1" fill="#d9a35a" opacity="0.75" filter="url(#art-glow)"/>
  <rect x="37.5" y="43" width="5" height="2" rx="0.5" fill="#c9872a" opacity="0.6" filter="url(#art-glow)"/>

  <!-- Floating cloth ribbon 1 — rises from left -->
  <path d="M32 44 Q28 35 25 25 Q23 18 27 12 Q29 8 32 11" stroke="#d9a35a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#art-ribbon-glow)" class="art-ribbon-1"/>
  <!-- Ribbon 1 tail -->
  <path d="M32 11 Q35 8 33 5 Q31 3 34 2" stroke="#e8c96d" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" filter="url(#art-ribbon-glow)"/>

  <!-- Floating cloth ribbon 2 — rises from center -->
  <path d="M40 43 Q42 34 39 24 Q37 16 41 10 Q43 6 40 4" stroke="#c9872a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.75" filter="url(#art-ribbon-glow)" class="art-ribbon-2"/>

  <!-- Floating cloth ribbon 3 — rises from right -->
  <path d="M48 44 Q52 35 55 25 Q57 18 53 12 Q51 8 48 11" stroke="#d9a35a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#art-ribbon-glow)" class="art-ribbon-3"/>
  <path d="M48 11 Q45 8 47 5 Q49 3 46 2" stroke="#e8c96d" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" filter="url(#art-ribbon-glow)"/>

  <!-- Ancient carved mask/face on altar (simple geometric) -->
  <circle cx="40" cy="41" r="3" fill="none" stroke="#d9a35a" stroke-width="0.7" opacity="0.6" filter="url(#art-glow)"/>
  <line x1="38.5" y1="40" x2="38.5" y2="41" stroke="#d9a35a" stroke-width="0.6" opacity="0.7"/>
  <line x1="41.5" y1="40" x2="41.5" y2="41" stroke="#d9a35a" stroke-width="0.6" opacity="0.7"/>
  <path d="M38 42.5 Q40 44 42 42.5" stroke="#d9a35a" stroke-width="0.6" fill="none" opacity="0.7"/>

  <!-- Audience silhouettes on steps (tiny) -->
  <circle cx="22" cy="68.5" r="1.2" fill="#0d1a10"/>
  <circle cx="29" cy="63.5" r="1.2" fill="#0d1a10"/>
  <circle cx="50" cy="63.5" r="1.2" fill="#0d1a10"/>
  <circle cx="57" cy="68.5" r="1.2" fill="#0d1a10"/>
  <circle cx="35" cy="58.5" r="1" fill="#0d1a10"/>
  <circle cx="44" cy="58.5" r="1" fill="#0d1a10"/>
</svg>`,

  // ──────────────────────────────────────────────────────────────
  // AMBIENTE — Sacred tree shrine: massive ancient roots, glowing altar
  // ──────────────────────────────────────────────────────────────
  ambiente: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="amb-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="amb-treeglow" x="-100%" y="-150%" width="300%" height="400%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="amb-altar-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e8ffda" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#9bbf6a" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#5e8a3a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="amb-canopy" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#c8e8a0" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#5e8a3a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground mist -->
  <ellipse cx="40" cy="75" rx="30" ry="5" fill="#5e8a3a" opacity="0.12" filter="url(#amb-glow)"/>

  <!-- Altar stone glow beneath tree -->
  <ellipse cx="40" cy="64" rx="14" ry="6" fill="url(#amb-altar-glow)" filter="url(#amb-treeglow)"/>

  <!-- Stone altar base -->
  <rect x="30" y="62" width="20" height="6" rx="1.5" fill="#0d1a10"/>
  <rect x="32" y="60" width="16" height="4" rx="1" fill="#152518"/>
  <rect x="35" y="58" width="10" height="3" rx="0.8" fill="#1a2d1e"/>

  <!-- Altar glyph — glowing circle with leaf -->
  <circle cx="40" cy="62" r="3.5" fill="none" stroke="#9bbf6a" stroke-width="0.8" opacity="0.8" filter="url(#amb-glow)"/>
  <circle cx="40" cy="62" r="1.5" fill="#9bbf6a" opacity="0.7" filter="url(#amb-glow)"/>

  <!-- Massive ancient tree trunk — central -->
  <rect x="36" y="14" width="8" height="48" rx="4" fill="#0d1a10"/>
  <!-- Trunk texture grooves -->
  <path d="M37 20 Q36 30 37 40 Q36 50 37 58" stroke="#152518" stroke-width="0.8" opacity="0.6"/>
  <path d="M43 20 Q44 30 43 40 Q44 50 43 58" stroke="#152518" stroke-width="0.8" opacity="0.6"/>

  <!-- Left root 1 — large sweeping -->
  <path d="M36 55 Q28 58 20 64 Q16 67 14 71" stroke="#0d1a10" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M36 52 Q26 55 18 62 Q15 66 14 70" stroke="#152518" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- Left root 2 -->
  <path d="M36 48 Q24 50 15 56 Q12 59 11 64" stroke="#0d1a10" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- Right root 1 — large sweeping -->
  <path d="M44 55 Q52 58 60 64 Q64 67 66 71" stroke="#0d1a10" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M44 52 Q54 55 62 62 Q65 66 66 70" stroke="#152518" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- Right root 2 -->
  <path d="M44 48 Q56 50 65 56 Q68 59 69 64" stroke="#0d1a10" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- Smaller surface roots -->
  <path d="M38 60 Q32 62 28 66" stroke="#0f1f12" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M42 60 Q48 62 52 66" stroke="#0f1f12" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- Tree canopy — dark silhouette with subtle glow aura -->
  <ellipse cx="40" cy="14" rx="22" ry="14" fill="#0d1a10"/>
  <ellipse cx="40" cy="14" rx="22" ry="14" fill="url(#amb-canopy)" filter="url(#amb-treeglow)"/>

  <!-- Canopy clusters (overlapping ovals for natural look) -->
  <ellipse cx="30" cy="12" rx="10" ry="7" fill="#0d1a10"/>
  <ellipse cx="50" cy="12" rx="10" ry="7" fill="#0d1a10"/>
  <ellipse cx="40" cy="8" rx="10" ry="7" fill="#0f1f12"/>
  <ellipse cx="25" cy="16" rx="7" ry="5" fill="#0d1a10"/>
  <ellipse cx="55" cy="16" rx="7" ry="5" fill="#0d1a10"/>

  <!-- Glowing leaves catching light (tiny dots) -->
  <circle cx="28" cy="10" r="1.2" fill="#9bbf6a" opacity="0.5" filter="url(#amb-glow)"/>
  <circle cx="34" cy="7" r="1" fill="#9bbf6a" opacity="0.45" filter="url(#amb-glow)"/>
  <circle cx="45" cy="6" r="1.2" fill="#9bbf6a" opacity="0.5" filter="url(#amb-glow)"/>
  <circle cx="52" cy="10" r="1" fill="#9bbf6a" opacity="0.4" filter="url(#amb-glow)"/>
  <circle cx="40" cy="5" r="1.5" fill="#c8e8a0" opacity="0.6" filter="url(#amb-glow)"/>

  <!-- Hanging moss tendrils -->
  <path d="M30 18 Q29 23 30 26" stroke="#1a3a18" stroke-width="1" fill="none" opacity="0.7"/>
  <path d="M34 20 Q33 26 34 30" stroke="#1a3a18" stroke-width="1" fill="none" opacity="0.6"/>
  <path d="M46 20 Q47 26 46 30" stroke="#1a3a18" stroke-width="1" fill="none" opacity="0.6"/>
  <path d="M50 18 Q51 23 50 26" stroke="#1a3a18" stroke-width="1" fill="none" opacity="0.7"/>
</svg>`,

  // ──────────────────────────────────────────────────────────────
  // ANIMAL — Wildlife guardian totem: carved stone pillar, spirit glyphs, creatures
  // ──────────────────────────────────────────────────────────────
  animal: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="ani-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ani-softglow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="ani-base-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe8cc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#b56a2a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground glow -->
  <ellipse cx="40" cy="74" rx="22" ry="5" fill="#b56a2a" opacity="0.1" filter="url(#ani-softglow)"/>

  <!-- Base platform stones -->
  <rect x="24" y="67" width="32" height="5" rx="1.5" fill="#0d1a10"/>
  <rect x="20" y="71" width="40" height="4" rx="1" fill="#152518"/>

  <!-- Totem pillar — main body (slightly tapered) -->
  <path d="M32 20 L31 67 L49 67 L48 20 Z" fill="#0d1a10"/>
  <!-- Pillar side shading -->
  <path d="M32 20 L31 67 L33 67 L34 20 Z" fill="#152518" opacity="0.5"/>
  <path d="M46 20 L47 67 L49 67 L48 20 Z" fill="#0f1f12" opacity="0.3"/>

  <!-- Pillar top carved head — feathered crown silhouette -->
  <path d="M33 20 Q40 4 47 20 Z" fill="#0d1a10"/>
  <!-- Crown feathers -->
  <path d="M36 18 Q35 10 37 7 Q38 12 36 18" fill="#0f1f12"/>
  <path d="M40 17 Q40 8 40 4 Q41 9 40 17" fill="#0f1f12"/>
  <path d="M44 18 Q45 10 43 7 Q42 12 44 18" fill="#0f1f12"/>
  <!-- Crown glow line -->
  <path d="M36 18 Q40 8 44 18" stroke="#e8a76d" stroke-width="0.7" fill="none" opacity="0.6" filter="url(#ani-glow)"/>

  <!-- GLYPH 1 — Jaguar face (top section) -->
  <!-- Oval face -->
  <ellipse cx="40" cy="28" rx="5" ry="5.5" fill="none" stroke="#e8a76d" stroke-width="0.8" opacity="0.8" filter="url(#ani-glow)"/>
  <!-- Eyes -->
  <circle cx="37.5" cy="26.5" r="1" fill="#e8a76d" opacity="0.9" filter="url(#ani-glow)"/>
  <circle cx="42.5" cy="26.5" r="1" fill="#e8a76d" opacity="0.9" filter="url(#ani-glow)"/>
  <!-- Spot markings -->
  <circle cx="37" cy="29.5" r="0.6" fill="#e8a76d" opacity="0.6"/>
  <circle cx="40" cy="30.5" r="0.6" fill="#e8a76d" opacity="0.6"/>
  <circle cx="43" cy="29.5" r="0.6" fill="#e8a76d" opacity="0.6"/>

  <!-- GLYPH 2 — Bird/eagle spirit (middle section) -->
  <path d="M36 39 Q34 36 33 38 Q36 40 40 39 Q44 40 47 38 Q46 36 44 39" stroke="#e8a76d" stroke-width="0.9" fill="none" opacity="0.75" filter="url(#ani-glow)"/>
  <!-- Wing spread -->
  <path d="M33 37 Q30 34 29 36 Q31 38 34 37" fill="#e8a76d" opacity="0.5" filter="url(#ani-glow)"/>
  <path d="M47 37 Q50 34 51 36 Q49 38 46 37" fill="#e8a76d" opacity="0.5" filter="url(#ani-glow)"/>
  <!-- Bird body -->
  <ellipse cx="40" cy="39" rx="3" ry="2" fill="#e8a76d" opacity="0.5" filter="url(#ani-glow)"/>

  <!-- GLYPH 3 — Turtle/shell (lower section) -->
  <ellipse cx="40" cy="52" rx="4.5" ry="3.5" fill="none" stroke="#e8a76d" stroke-width="0.8" opacity="0.7" filter="url(#ani-glow)"/>
  <!-- Shell segments -->
  <line x1="40" y1="49" x2="40" y2="55" stroke="#e8a76d" stroke-width="0.5" opacity="0.5"/>
  <line x1="36" y1="52" x2="44" y2="52" stroke="#e8a76d" stroke-width="0.5" opacity="0.5"/>

  <!-- Dividing carved bands between glyphs -->
  <rect x="31" y="34" width="18" height="1.5" rx="0.5" fill="#152518"/>
  <rect x="31" y="46" width="18" height="1.5" rx="0.5" fill="#152518"/>
  <rect x="31" y="57" width="18" height="1.5" rx="0.5" fill="#152518"/>

  <!-- Small creature at base left — turtle silhouette -->
  <ellipse cx="20" cy="68" rx="4.5" ry="2.5" fill="#0d1a10"/>
  <ellipse cx="20" cy="67" rx="3" ry="2" fill="#152518"/>
  <!-- Turtle head -->
  <circle cx="25" cy="67.5" r="1.3" fill="#0d1a10"/>

  <!-- Small creature at base right — sitting bird -->
  <circle cx="60" cy="66" r="2" fill="#0d1a10"/>
  <path d="M60 64 Q61 62 59 62 Q60 64 60 64" fill="#0d1a10"/>
  <!-- Beak -->
  <path d="M62 66 L64 65.5" stroke="#152518" stroke-width="0.8" stroke-linecap="round"/>
</svg>`,

  // ──────────────────────────────────────────────────────────────
  // COMUNIDAD — Community hearth tower: circular stone tower, fire glow,
  // arched windows, people silhouettes
  // ──────────────────────────────────────────────────────────────
  comunidad: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="com-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="com-fireglow" x="-150%" y="-200%" width="400%" height="500%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="com-fire-rad" cx="50%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#fffde0" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#e6c98a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#a8862a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="com-window-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8c8" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#e6c98a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground atmosphere -->
  <ellipse cx="40" cy="75" rx="28" ry="5" fill="#a8862a" opacity="0.1" filter="url(#com-fireglow)"/>

  <!-- Fire glow radiating from top -->
  <ellipse cx="40" cy="14" rx="16" ry="12" fill="url(#com-fire-rad)" filter="url(#com-fireglow)" class="com-fire-glow"/>

  <!-- Tower base steps -->
  <rect x="18" y="68" width="44" height="4" rx="1" fill="#152518"/>
  <rect x="22" y="65" width="36" height="4" rx="1" fill="#0d1a10"/>

  <!-- Tower main body — slightly rounded silhouette -->
  <path d="M26 65 L26 30 Q26 28 28 28 L52 28 Q54 28 54 30 L54 65 Z" fill="#0d1a10"/>
  <!-- Tower wall texture -->
  <!-- Horizontal stone courses -->
  <line x1="26" y1="35" x2="54" y2="35" stroke="#152518" stroke-width="0.8" opacity="0.5"/>
  <line x1="26" y1="42" x2="54" y2="42" stroke="#152518" stroke-width="0.8" opacity="0.5"/>
  <line x1="26" y1="49" x2="54" y2="49" stroke="#152518" stroke-width="0.8" opacity="0.5"/>
  <line x1="26" y1="56" x2="54" y2="56" stroke="#152518" stroke-width="0.8" opacity="0.5"/>

  <!-- Tower top — crenellations (battlements) -->
  <rect x="26" y="24" width="5" height="6" rx="0.5" fill="#0d1a10"/>
  <rect x="34" y="24" width="5" height="6" rx="0.5" fill="#0d1a10"/>
  <rect x="42" y="24" width="5" height="6" rx="0.5" fill="#0d1a10"/>
  <rect x="50" y="24" width="4" height="6" rx="0.5" fill="#0d1a10"/>
  <!-- Connecting band -->
  <rect x="26" y="28" width="28" height="3" fill="#0d1a10"/>

  <!-- WINDOW 1 — upper left, arched, warm glow -->
  <path d="M30 35 Q30 31 33 31 Q36 31 36 35 L36 40 L30 40 Z" fill="url(#com-window-glow)" filter="url(#com-glow)"/>
  <path d="M30 35 Q30 31 33 31 Q36 31 36 35" fill="#0f1f12" opacity="0.3"/>
  <!-- Window frame -->
  <path d="M30 40 L30 35 Q30 31 33 31 Q36 31 36 35 L36 40" stroke="#1a2d1e" stroke-width="1.2" fill="none"/>

  <!-- WINDOW 2 — upper right, arched, warm glow -->
  <path d="M44 35 Q44 31 47 31 Q50 31 50 35 L50 40 L44 40 Z" fill="url(#com-window-glow)" filter="url(#com-glow)"/>
  <path d="M44 35 Q44 31 47 31 Q50 31 50 35" fill="#0f1f12" opacity="0.3"/>
  <path d="M44 40 L44 35 Q44 31 47 31 Q50 31 50 35 L50 40" stroke="#1a2d1e" stroke-width="1.2" fill="none"/>

  <!-- WINDOW 3 — middle, larger, circular glow -->
  <circle cx="40" cy="51" r="5" fill="url(#com-window-glow)" filter="url(#com-glow)"/>
  <circle cx="40" cy="51" r="5" fill="none" stroke="#1a2d1e" stroke-width="1.5"/>
  <!-- Window cross -->
  <line x1="40" y1="46" x2="40" y2="56" stroke="#1a2d1e" stroke-width="0.8" opacity="0.6"/>
  <line x1="35" y1="51" x2="45" y2="51" stroke="#1a2d1e" stroke-width="0.8" opacity="0.6"/>

  <!-- DOORWAY — lower center arch with warm light -->
  <path d="M35 65 Q35 57 40 57 Q45 57 45 65 Z" fill="#e6c98a" opacity="0.5" filter="url(#com-glow)"/>
  <path d="M35 65 L35 62 Q35 57 40 57 Q45 57 45 62 L45 65" stroke="#1a2d1e" stroke-width="1.5" fill="none"/>

  <!-- People silhouettes gathered outside door -->
  <!-- Person 1 -->
  <circle cx="22" cy="63" r="2" fill="#0d1a10"/>
  <path d="M22 65 Q20 70 19 72 M22 65 Q24 70 23 72" stroke="#0d1a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="22" y1="65" x2="22" y2="70" stroke="#0d1a10" stroke-width="2" stroke-linecap="round"/>

  <!-- Person 2 -->
  <circle cx="29" cy="63" r="2" fill="#0d1a10"/>
  <line x1="29" y1="65" x2="29" y2="70" stroke="#0d1a10" stroke-width="2" stroke-linecap="round"/>
  <path d="M29 67 Q27 69 26 70 M29 67 Q31 69 32 70" stroke="#0d1a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>

  <!-- Person 3 (right side) -->
  <circle cx="51" cy="63" r="2" fill="#0d1a10"/>
  <line x1="51" y1="65" x2="51" y2="70" stroke="#0d1a10" stroke-width="2" stroke-linecap="round"/>
  <path d="M51 67 Q49 69 48 70 M51 67 Q53 69 54 70" stroke="#0d1a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>

  <!-- Person 4 (right side) -->
  <circle cx="58" cy="63" r="2" fill="#0d1a10"/>
  <line x1="58" y1="65" x2="58" y2="70" stroke="#0d1a10" stroke-width="2" stroke-linecap="round"/>
  <path d="M58 67 Q56 69 55 70 M58 67 Q60 69 61 70" stroke="#0d1a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>

  <!-- Fire at tower top — between battlements -->
  <path d="M38 22 Q37 16 40 12 Q42 9 40 7 Q43 10 43 14 Q45 10 44 7 Q47 11 44 16 Q44 19 42 22 Z" fill="#e6c98a" opacity="0.85" filter="url(#com-fireglow)" class="com-flame"/>
  <path d="M39 22 Q38.5 17 40 14 Q41.5 17 41 22 Z" fill="#fffde0" opacity="0.9" filter="url(#com-glow)"/>

  <!-- Smoke wisps -->
  <path d="M40 7 Q38 4 39 2 Q41 4 40 2" stroke="#a8862a" stroke-width="0.8" fill="none" opacity="0.3" stroke-linecap="round"/>
</svg>`,
};
