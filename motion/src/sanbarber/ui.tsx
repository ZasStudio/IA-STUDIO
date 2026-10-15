import React, {useId} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {EASE} from '../theme';

/* Tienda recreada a partir de los datos públicos de sanbarber.pe (Shopify). Colores y logo son
   una interpretación: el sitio no se pudo abrir desde el entorno de render. */

export const SB = {
  ink: '#111111',
  char: '#1b1b1d',
  gold: '#c9a043',
  goldHi: '#f3d98a',
  cream: '#f6f3ec',
  line: '#e6e2d8',
  mute: '#6d6a63',
  red: '#c8102e',
  green: '#1f8a4c',
};

export const FONT = {
  ui: '"Inter Variable", Inter, system-ui, sans-serif',
  head: '"Montserrat Variable", Montserrat, sans-serif',
  cond: '"Anton", Impact, sans-serif',
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (frame: number, a: number, b: number, e = EASE.out) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: e});

/** Texto que se teclea. */
export const typed = (text: string, frame: number, start: number, cps = 1.3) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - start) * cps))));

/* ------------------------------------ productos ------------------------------------ */

export type Kind = 'clipper' | 'trimmer' | 'shaver';
export type Product = {id: string; name: string; brand: string; price: number; kind: Kind; color: [string, string, string]};

const GOLD: [string, string, string] = ['#fbe7a4', '#cf9f35', '#7d5711'];
const BLACK: [string, string, string] = ['#6b6b70', '#232326', '#0b0b0c'];
const WHITE: [string, string, string] = ['#ffffff', '#dcdcdc', '#9a9a9a'];
const FUCSIA: [string, string, string] = ['#ff8fd0', '#e0218a', '#7e0a4b'];
const SILVER: [string, string, string] = ['#f2f4f7', '#a9b0b9', '#59606a'];
const BLUE: [string, string, string] = ['#9cc4ff', '#2f6fd6', '#123a7a'];

// Precios publicados en sanbarber.pe (indexados por el buscador).
export const PRODUCTS: Product[] = [
  {id: 'mc-gold', name: 'WAHL MAGIC CLIP DORADA INALÁMBRICA', brand: 'WAHL', price: 549, kind: 'clipper', color: GOLD},
  {id: 'mc-cord', name: 'CLIPPER WAHL MAGIC CLIP CABLEADA', brand: 'WAHL', price: 199, kind: 'clipper', color: BLACK},
  {id: 'sonix', name: 'CLIPPER SONIX 2026 WARRIOR PLUS', brand: 'WARRIOR PLUS', price: 149, kind: 'clipper', color: SILVER},
  {id: 'raptor', name: 'CLIPPER RAPTOR FUCSIA', brand: 'WARRIOR PLUS', price: 199, kind: 'clipper', color: FUCSIA},
  {id: 'piranha', name: 'TRIMMER PIRANHA 2026', brand: 'WARRIOR PLUS', price: 79, kind: 'trimmer', color: BLUE},
  {id: 'predator', name: 'SHAVER PREDATOR 2026 BLANCO', brand: 'WARRIOR PLUS', price: 69, kind: 'shaver', color: WHITE},
  {id: 'lunix', name: 'CLIPPER LUNIX 2026', brand: 'WARRIOR PLUS', price: 119, kind: 'clipper', color: BLACK},
  {id: 'piranha-c', name: 'CLIPPER PIRANHA 2026', brand: 'WARRIOR PLUS', price: 129, kind: 'clipper', color: BLUE},
];

export const soles = (n: number) => `S/ ${n.toFixed(2)}`;

/** Máquina dibujada en vector (cuerpo metálico, cuchilla dentada, palanca). */
export const Machine: React.FC<{kind?: Kind; color: [string, string, string]; height: number; style?: React.CSSProperties}> = ({kind = 'clipper', color, height, style}) => {
  const id = 'm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const w = kind === 'trimmer' ? 64 : kind === 'shaver' ? 96 : 92;
  const body =
    kind === 'shaver'
      ? 'M22 70 Q20 40 50 38 Q80 40 78 70 L72 200 Q70 214 50 214 Q30 214 28 200 Z'
      : kind === 'trimmer'
        ? 'M32 40 L68 40 L70 196 Q70 214 50 214 Q30 214 30 196 Z'
        : 'M18 44 L82 44 Q90 46 88 70 L78 196 Q76 214 50 214 Q24 214 22 196 L12 70 Q10 46 18 44 Z';
  return (
    <svg viewBox={`${50 - w / 2} 0 ${w} 220`} height={height} style={{overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1">
          <stop offset="0" stopColor={color[2]} />
          <stop offset="0.28" stopColor={color[1]} />
          <stop offset="0.45" stopColor={color[0]} />
          <stop offset="0.62" stopColor={color[1]} />
          <stop offset="1" stopColor={color[2]} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="1">
          <stop offset="0" stopColor="#8b9199" />
          <stop offset="0.5" stopColor="#f4f6f8" />
          <stop offset="1" stopColor="#7c828a" />
        </linearGradient>
      </defs>
      {kind === 'shaver' ? (
        <>
          <rect x={20} y={14} width={60} height={30} rx={14} fill={`url(#${id}s)`} />
          <rect x={24} y={18} width={52} height={22} rx={10} fill="none" stroke="#6d737b" strokeDasharray="1.5 2" />
        </>
      ) : (
        <>
          <rect x={kind === 'trimmer' ? 30 : 14} y={18} width={kind === 'trimmer' ? 40 : 72} height={16} rx={3} fill={`url(#${id}s)`} />
          {Array.from({length: kind === 'trimmer' ? 12 : 20}, (_, i) => (
            <rect key={i} x={(kind === 'trimmer' ? 31 : 15) + i * 3.5} y={10} width={2} height={10} fill="#c4c9cf" />
          ))}
        </>
      )}
      <path d={body} fill={`url(#${id}b)`} stroke="rgba(0,0,0,.25)" strokeWidth={1} />
      <path d={body} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1} transform="translate(-1,-1)" />
      {kind === 'clipper' && <rect x={80} y={70} width={8} height={36} rx={3} fill={color[2]} />}
      <rect x={42} y={150} width={16} height={26} rx={8} fill="rgba(0,0,0,.35)" />
      <circle cx={50} cy={160} r={3} fill={kind === 'shaver' ? '#3fd07a' : '#f3d98a'} />
      <text x={50} y={110} textAnchor="middle" fontFamily={FONT.head} fontWeight={800} fontSize={9} fill="rgba(255,255,255,.75)" transform="rotate(-90 50 110)">
        {kind === 'shaver' ? 'PREDATOR' : 'PRO'}
      </text>
    </svg>
  );
};

/* ------------------------------------ iconos ------------------------------------ */

export const Icon: React.FC<{name: 'menu' | 'search' | 'cart' | 'user' | 'back' | 'lock' | 'truck' | 'check' | 'chevron'; size?: number; color?: string}> = ({name, size = 22, color = SB.ink}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" {...p} />}
      {name === 'search' && (
        <>
          <circle cx={11} cy={11} r={6.5} {...p} />
          <path d="M16 16l4.5 4.5" {...p} />
        </>
      )}
      {name === 'cart' && <path d="M3 4h2.5l2.2 11h10.6l2-8H6.6M9 20.5h.01M17 20.5h.01" {...p} />}
      {name === 'user' && (
        <>
          <circle cx={12} cy={8} r={3.6} {...p} />
          <path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" {...p} />
        </>
      )}
      {name === 'back' && <path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chevron' && <path d="M9 5l7 7-7 7" {...p} />}
      {name === 'lock' && (
        <>
          <rect x={5} y={10} width={14} height={10} rx={2} {...p} />
          <path d="M8 10V7a4 4 0 018 0v3" {...p} />
        </>
      )}
      {name === 'truck' && <path d="M2 6h11v10H2zM13 10h4l3 3v3h-7M6 19a1.8 1.8 0 100-.01M17 19a1.8 1.8 0 100-.01" {...p} />}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" {...p} strokeWidth={2.6} />}
    </svg>
  );
};

/** Logo tipográfico (interpretación). */
export const Logo: React.FC<{size?: number; color?: string; gold?: string}> = ({size = 22, color = SB.ink, gold = SB.gold}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.28, fontFamily: FONT.cond, fontSize: size, color, letterSpacing: '0.04em', lineHeight: 1}}>
    <svg width={size * 0.62} height={size} viewBox="0 0 12 20">
      <rect x={1} y={0} width={10} height={20} rx={5} fill="none" stroke={gold} strokeWidth={1.6} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M1 ${4 + i * 4} L11 ${1 + i * 4}`} stroke={i % 2 ? SB.red : gold} strokeWidth={1.6} />
      ))}
    </svg>
    <span>
      SAN<span style={{color: gold}}> </span>BARBER
    </span>
  </div>
);

/** Indicador de toque (como la grabación de pantalla de iOS). */
export const Touch: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < -8 || d > 18) return null;
  const pre = interpolate(d, [-8, 0], [0, 1], clamp);
  const ring = interpolate(d, [0, 16], [0, 1], {...clamp, easing: EASE.out});
  const press = d >= 0 && d < 5 ? 0.82 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 50}}>
      <div style={{position: 'absolute', left: -20, top: -20, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,.75)', border: '2px solid rgba(0,0,0,.25)', boxShadow: '0 4px 14px rgba(0,0,0,.3)', opacity: d < 0 ? pre : 1 - Math.max(0, d - 6) / 12, transform: `scale(${press * (0.6 + 0.4 * pre)})`}} />
      {d >= 0 && <div style={{position: 'absolute', left: -20, top: -20, width: 40, height: 40, borderRadius: 20, border: `3px solid ${SB.gold}`, transform: `scale(${1 + ring * 1.8})`, opacity: 1 - ring}} />}
    </div>
  );
};
