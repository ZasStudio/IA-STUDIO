import React, {useId} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {FONT_P, P} from '../theme';

type Palette = {sky: [string, string, string]; layers: string[]; haze: string; snow?: boolean};

export const LANDSCAPES: Record<string, Palette> = {
  alps: {sky: ['#9fb4cf', '#d9e2ec', '#eef1f4'], layers: ['#c9d3de', '#8e9aa8', '#5d6b52', '#3f5a2c', '#2f4a1f'], haze: '#e9eef3', snow: true},
  hills: {sky: ['#cfd8dc', '#e8ecec', '#f4f6f4'], layers: ['#b9c4b2', '#6f8a4a', '#4f6f2c', '#3b5a1f', '#2a4415'], haze: '#eef1ec'},
  dusk: {sky: ['#a9a6d6', '#e9c7da', '#f7dccf'], layers: ['#c6aecb', '#a98fb5', '#8f7a9e', '#b88a8f', '#7d6a72'], haze: '#f3d9dc'},
  forest: {sky: ['#b8c9d6', '#dfe7ec', '#f0f3f4'], layers: ['#9fb1a8', '#4e6e48', '#36552d', '#5f8a3a', '#79a547'], haze: '#e7eee9'},
};

const ridge = (seed: string, base: number, amp: number, freq: number, w = 1920, h = 1080) => {
  const pts: string[] = [];
  for (let x = -40; x <= w + 640; x += 24) {
    const n = noise2D(seed, x * freq, 0) * 0.82 + noise2D(seed + 'f', x * freq * 2.5, 1) * 0.18;
    pts.push(`${x},${(base - Math.abs(n) * amp).toFixed(1)}`);
  }
  return `M -40 ${h} L ${pts.join(' L ')} L ${w + 640} ${h} Z`;
};

/**
 * Paisaje procedural (cordilleras con ruido + perspectiva atmosférica).
 * Cada capa tiene su profundidad → paralaje automático con `drift`.
 */
export const Landscape: React.FC<{palette?: keyof typeof LANDSCAPES; drift?: number; seed?: string; animals?: boolean}> = ({
  palette = 'alps',
  drift = 0.25,
  seed = 'land',
  animals,
}) => {
  const frame = useCurrentFrame();
  const pal = LANDSCAPES[palette];
  const id = 'ls' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const L = pal.layers.length;
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{width: '100%', height: '100%'}}>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.sky[0]} />
            <stop offset="55%" stopColor={pal.sky[1]} />
            <stop offset="100%" stopColor={pal.sky[2]} />
          </linearGradient>
          <linearGradient id={`${id}snow`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#dfe6ee" />
            <stop offset="100%" stopColor={pal.layers[1]} />
          </linearGradient>
          <filter id={`${id}grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.18} />
            </feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <rect width="1920" height="1080" fill={`url(#${id}sky)`} />
        {pal.layers.map((c, i) => {
          const depth = (i + 1) / L;
          const base = 470 + i * 120;
          const amp = i === 0 ? 330 : i === 1 ? 260 : 120 - i * 10;
          const freq = i < 2 ? 0.0019 : 0.0013;
          const dx = -frame * drift * depth * 2;
          const fill = i === 0 && pal.snow ? `url(#${id}snow)` : c;
          return (
            <g key={i} transform={`translate(${dx}, 0)`}>
              <path d={ridge(`${seed}${i}`, base, amp, freq)} fill={fill} />
              {/* velo de niebla entre capas: perspectiva atmosférica */}
              <rect y={base - 40} width="1920" height="200" fill={pal.haze} opacity={0.18 * (1 - depth)} />
            </g>
          );
        })}
        {animals &&
          Array.from({length: 7}, (_, i) => (
            <g key={i} transform={`translate(${760 + i * 46 + Math.sin(frame / 20 + i) * 3}, ${742 + (i % 2) * 6}) scale(${1 - (i % 3) * 0.1})`}>
              <ellipse cx={0} cy={0} rx={16} ry={7} fill="#2b2118" />
              <rect x={-12} y={3} width={3} height={13} fill="#2b2118" />
              <rect x={9} y={3} width={3} height={13} fill="#2b2118" />
              <path d="M14 -3 L24 -12 L27 -9 L18 1 Z" fill="#2b2118" />
            </g>
          ))}
        <rect width="1920" height="1080" filter={`url(#${id}grain)`} opacity={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/** Logo-flor 3D: pétalos con degradado y finas estrías, que se abren (`bloom` 0→1). */
export const FlowerLogo: React.FC<{size: number; bloom?: number; rotate?: number; petals?: number; style?: React.CSSProperties}> = ({
  size,
  bloom = 1,
  rotate = 0,
  petals = 8,
  style,
}) => {
  const id = 'fl' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible', ...style}}>
      <defs>
        <radialGradient id={`${id}p`} cx="50%" cy="85%" r="90%">
          <stop offset="0%" stopColor="#3b1fb8" />
          <stop offset="35%" stopColor="#6c63ff" />
          <stop offset="70%" stopColor="#8fb8ff" />
          <stop offset="100%" stopColor="#e8f1ff" />
        </radialGradient>
        <pattern id={`${id}l`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(80)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={0.7} />
        </pattern>
        <radialGradient id={`${id}c`}>
          <stop offset="0%" stopColor="#0b0630" />
          <stop offset="60%" stopColor="#2a1a8a" />
          <stop offset="100%" stopColor="#6c63ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${rotate})`}>
        {Array.from({length: petals}, (_, i) => {
          const a = (i * 360) / petals;
          const local = Math.min(1, Math.max(0, bloom * 1.4 - (i / petals) * 0.4));
          const s = 0.25 + local * 0.75;
          const d = 'M 0 -6 C 30 -20, 46 -62, 22 -86 C 10 -98, -10 -98, -22 -86 C -46 -62, -30 -20, 0 -6 Z';
          return (
            <g key={i} transform={`rotate(${a + (1 - local) * 40}) scale(${s})`}>
              <path d={d} fill={`url(#${id}p)`} stroke="#c9dcff" strokeOpacity={0.5} strokeWidth={0.8} />
              <path d={d} fill={`url(#${id}l)`} />
            </g>
          );
        })}
        <circle r={20} fill={`url(#${id}c)`} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Maquetas de sitios web (sin imágenes): se usan a pantalla completa y */
/* como miniaturas en la lista-rueda y en el abanico de tarjetas.       */
/* ------------------------------------------------------------------ */

const Nav: React.FC<{dark?: boolean; brand: string}> = ({dark, brand}) => (
  <div style={{position: 'absolute', top: 34, left: 60, right: 60, display: 'flex', alignItems: 'center', fontFamily: FONT_P, fontSize: 22, color: dark ? '#fff' : P.ink}}>
    <b style={{fontWeight: 700, letterSpacing: '-0.02em'}}>{brand}</b>
    <div style={{flex: 1}} />
    {['Home', 'About', 'Services', 'Contact'].map((t) => (
      <span key={t} style={{marginLeft: 36, opacity: 0.75}}>
        {t}
      </span>
    ))}
  </div>
);

export type MockKind = 'vision' | 'nature' | 'oceanview' | 'refresh' | 'windpower' | 'aiapp' | 'market' | 'fast';

export const WebMock: React.FC<{kind: MockKind; t?: number}> = ({kind, t = 1}) => {
  const base: React.CSSProperties = {position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'hidden', fontFamily: FONT_P};
  if (kind === 'vision')
    return (
      <div style={{...base, background: `radial-gradient(circle at 55% 45%, ${P.blueBright}, ${P.blueDeep} 60%, ${P.navy})`}}>
        <Nav dark brand="VISION" />
        <div style={{position: 'absolute', left: 120, top: 260, color: '#fff', fontSize: 92, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em'}}>
          Absolute Clarity
          <br />
          in Zero-Visibility
          <br />
          Storms
        </div>
        <div style={{position: 'absolute', left: 1180, top: 300, width: 520, height: 300, borderRadius: 160, background: 'linear-gradient(180deg,#e9f1ff,#7fa7ff 60%,#1b2b8f)', boxShadow: '0 0 120px #6ea0ff'}} />
        <div style={{position: 'absolute', left: 1240, top: 360, width: 400, height: 170, borderRadius: 100, background: 'linear-gradient(120deg,#0c1446,#3a5bff 70%,#c8dcff)'}} />
        <div style={{position: 'absolute', left: 40, bottom: -90, fontSize: 420, fontWeight: 800, color: 'rgba(255,255,255,0.12)', letterSpacing: '-0.05em'}}>VISION</div>
        <div style={{position: 'absolute', left: 120, top: 640, padding: '18px 34px', borderRadius: 40, background: '#fff', color: P.ink, fontSize: 24, fontWeight: 600}}>Shop now →</div>
      </div>
    );
  if (kind === 'nature')
    return (
      <div style={{...base, background: 'radial-gradient(circle at 60% 30%, #8a6a32, #3a2a12 55%, #140e06)'}}>
        <Nav dark brand="Biomes" />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 220,
            textAlign: 'center',
            fontSize: 380,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg,#f5d58c,#b7863a 60%,#5b3d14)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          NATURE
        </div>
        <div style={{position: 'absolute', left: 120, top: 760, color: '#fff', fontSize: 64, fontWeight: 600, lineHeight: 1}}>
          Explore
          <br />
          Biomes
        </div>
        <div style={{position: 'absolute', right: 120, top: 760, width: 360, height: 180, borderRadius: 26, background: 'rgba(255,240,210,0.18)', border: '1px solid rgba(255,240,210,.35)', color: '#fff', padding: 28, fontSize: 28, fontWeight: 600}}>
          Engineered for the Future
        </div>
      </div>
    );
  if (kind === 'oceanview')
    return (
      <div style={{...base, background: 'linear-gradient(160deg,#f2f6ff,#d5e3ff 55%,#bcd0f7)'}}>
        <Nav brand="Oceanview" />
        <div style={{position: 'absolute', left: 90, top: 150, fontSize: 130, fontWeight: 300, color: '#5d6f94', lineHeight: 0.95, letterSpacing: '-0.05em'}}>
          Oceanview
          <br />
          Hotel
        </div>
        <svg viewBox="0 0 600 700" style={{position: 'absolute', left: 120, top: 380, width: 600, height: 700}}>
          <defs>
            <linearGradient id="tw" x1="0" x2="1">
              <stop offset="0" stopColor="#9fb6dd" />
              <stop offset="1" stopColor="#eef4ff" />
            </linearGradient>
          </defs>
          <path d="M120 700 L200 40 L470 120 L520 700 Z" fill="url(#tw)" />
          {Array.from({length: 22}, (_, i) => (
            <line key={i} x1={200 - i * 3.5} y1={40 + i * 30} x2={470 + i * 2.3} y2={120 + i * 27} stroke="#7d93bd" strokeWidth={2} opacity={0.6} />
          ))}
        </svg>
        <div style={{position: 'absolute', left: 860, top: 170, fontSize: 40, color: P.inkSoft, fontWeight: 500}}>Analytics Overview</div>
      </div>
    );
  if (kind === 'refresh')
    return (
      <div style={{...base, background: 'linear-gradient(180deg,#d8e6fb,#a9c6f2 60%,#6e95dc)'}}>
        <Nav brand="Refresh" />
        <div style={{position: 'absolute', left: 90, top: 180, fontSize: 300, fontWeight: 500, color: '#ffffffd0', letterSpacing: '-0.05em'}}>Refresh</div>
        <div style={{position: 'absolute', right: 160, top: 560, fontSize: 220, fontStyle: 'italic', fontWeight: 300, color: '#1f3f8a'}}>Daily</div>
        <Bottle style={{position: 'absolute', left: 820, top: 240, width: 300}} />
      </div>
    );
  if (kind === 'windpower')
    return (
      <div style={{...base}}>
        <Landscape palette="hills" drift={0} seed="wind" />
        <Nav brand="Wind Power" />
        <div style={{position: 'absolute', left: 120, top: 260, fontSize: 140, fontWeight: 600, color: '#fff', letterSpacing: '-0.04em', textShadow: '0 4px 40px rgba(0,0,0,.25)'}}>
          Wind Power
          <div style={{fontSize: 60, fontWeight: 400}}>Generation</div>
        </div>
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="-50 -50 100 200" style={{position: 'absolute', left: 1200 + i * 220, top: 300 + i * 40, width: 120 - i * 20}}>
            <line x1={0} y1={0} x2={0} y2={150} stroke="#fff" strokeWidth={3} />
            {[0, 120, 240].map((a) => (
              <line key={a} x1={0} y1={0} x2={0} y2={-45} stroke="#fff" strokeWidth={4} transform={`rotate(${a + t * 360})`} />
            ))}
          </svg>
        ))}
      </div>
    );
  if (kind === 'aiapp')
    return (
      <div style={{...base, background: `linear-gradient(135deg, ${P.navy}, ${P.blue} 60%, ${P.sky})`}}>
        <Nav dark brand="Neura" />
        <div style={{position: 'absolute', left: 720, top: 160, width: 480, height: 820, borderRadius: 70, background: 'linear-gradient(180deg,#0b1240,#1b2fa8)', border: '10px solid #0a0f2a', boxShadow: '0 40px 120px rgba(0,0,0,.5)'}}>
          <div style={{margin: 60, height: 200, borderRadius: 100, background: `radial-gradient(circle, ${P.sky}, ${P.blueBright} 50%, transparent 70%)`}} />
          {[0.8, 0.6, 0.7].map((w, i) => (
            <div key={i} style={{margin: '24px 60px', height: 22, width: `${w * 70}%`, borderRadius: 11, background: 'rgba(255,255,255,.3)'}} />
          ))}
        </div>
      </div>
    );
  if (kind === 'market')
    return (
      <div style={{...base, background: 'linear-gradient(135deg,#2b0d0d,#b3262c 55%,#ff8a5c)'}}>
        <Nav dark brand="Velura" />
        <div style={{position: 'absolute', left: 120, top: 260, fontSize: 200, fontWeight: 800, color: '#fff', letterSpacing: '-0.05em'}}>Velura</div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 1000 + i * 260, top: 520, width: 230, height: 300, borderRadius: 24, background: ['#ffd7c2', '#fff', '#ffb199'][i], boxShadow: '0 30px 60px rgba(0,0,0,.3)'}} />
        ))}
      </div>
    );
  // fast
  return (
    <div style={{...base, background: 'linear-gradient(180deg,#5d8ff0,#a7c6ff 60%,#e6eeff)'}}>
      <Nav dark brand="Stride" />
      <div style={{position: 'absolute', left: 100, top: 200, fontSize: 90, fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em'}}>FIND YOUR</div>
      <div style={{position: 'absolute', left: 80, top: 300, fontSize: 420, fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1}}>FAST</div>
      <div style={{position: 'absolute', left: 1200, top: 120, width: 420, height: 760, borderRadius: 210, background: 'linear-gradient(180deg,#0e1a4a,#2d4bd6)', transform: 'rotate(18deg)', opacity: 0.85}} />
    </div>
  );
};

/** Miniatura de una maqueta (escala a cualquier tamaño 16:9). */
export const Thumb: React.FC<{kind: MockKind; width: number; radius?: number; style?: React.CSSProperties}> = ({kind, width, radius = 14, style}) => (
  <div style={{width, height: (width * 9) / 16, borderRadius: radius, overflow: 'hidden', position: 'relative', boxShadow: '0 18px 40px rgba(10,20,60,.25)', ...style}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0'}}>
      <WebMock kind={kind} />
    </div>
  </div>
);

/** Botella de producto (vector). */
export const Bottle: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <svg viewBox="0 0 200 520" style={style}>
    <defs>
      <linearGradient id="btl" x1="0" x2="1">
        <stop offset="0" stopColor="#c9d4e4" />
        <stop offset="0.35" stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#e4ebf5" />
        <stop offset="1" stopColor="#9fb0c8" />
      </linearGradient>
    </defs>
    <circle cx={100} cy={40} r={34} fill="none" stroke="#111" strokeWidth={14} />
    <rect x={62} y={58} width={76} height={60} rx={14} fill="#111" />
    <path d="M40 150 Q40 112 70 112 L130 112 Q160 112 160 150 L160 480 Q160 512 128 512 L72 512 Q40 512 40 480 Z" fill="url(#btl)" />
    <path d="M150 70 q40 10 30 60 q-8 40 -30 30" fill="none" stroke="#1d1d1d" strokeWidth={7} />
  </svg>
);
