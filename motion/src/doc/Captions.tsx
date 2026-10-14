import React, {useId} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {EASE} from '../theme';

/**
 * SUBTÍTULOS EDITORIALES APILADOS (estilo reel documental).
 * Cada palabra aparece cuando se dice y se apila con interlineado muy apretado,
 * mezclando 4 "voces" tipográficas:
 *   *PALABRA  condensada en mayúsculas (Anton)      → palabras clave
 *   ~PALABRA  condensada solo contorno              → énfasis "hueco"
 *   _palabra  serif itálica (Instrument Serif)      → conectores (de, que, en…)
 *   =palabra  serif redonda
 *   palabra   sans negrita (Inter)                  → el resto
 * Sufijos: ! parpadeo de color · ^ brillo · + más grande · - más pequeña · @color
 * Espacios dentro de una "palabra": usa ·  (p. ej. lo·que·pasaba)
 * Líneas separadas por " / ".
 */

export const DOC_COLORS: Record<string, string> = {
  cyan: '#38d6ff',
  blue: '#4a9dff',
  magenta: '#ff3bd4',
  purple: '#b56bff',
  red: '#ff2b3a',
  white: '#ffffff',
  ink: '#111111',
};

export const F = {
  cond: '"Anton", "Bebas Neue", Impact, sans-serif',
  serif: '"Instrument Serif", "Playfair Display", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
};

type Kind = 'cond' | 'outline' | 'serifI' | 'serif' | 'sans';
type Tok = {text: string; kind: Kind; flicker: boolean; glow: boolean; scale: number; color?: string; t: number};

const BASE: Record<Kind, number> = {cond: 128, outline: 128, serifI: 60, serif: 60, sans: 62};

export const parseCard = (src: string, at: number, gap: number) => {
  let t = at;
  return src.split(' / ').map((line) =>
    line
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((raw): Tok => {
        let s = raw;
        // puntuación de apertura (¿ ¡ « ") delante del marcador de estilo
        let lead = '';
        while (/^[¿¡«"(]/.test(s) && s.length > 1) (lead += s[0]), (s = s.slice(1));
        let kind: Kind = 'sans';
        if (s.startsWith('*')) (kind = 'cond'), (s = s.slice(1));
        else if (s.startsWith('~')) (kind = 'outline'), (s = s.slice(1));
        else if (s.startsWith('_')) (kind = 'serifI'), (s = s.slice(1));
        else if (s.startsWith('=')) (kind = 'serif'), (s = s.slice(1));
        let flicker = false;
        let glow = false;
        let scale = 1;
        // los modificadores pueden ir antes o después de @color
        const strip = (x: string) => {
          while (/[!^+-]$/.test(x) && x.length > 1) {
            const c = x[x.length - 1];
            if (c === '!') flicker = true;
            if (c === '^') glow = true;
            if (c === '+') scale *= 1.45;
            if (c === '-') scale *= 0.72;
            x = x.slice(0, -1);
          }
          return x;
        };
        const [w0, c0] = s.split('@');
        s = lead + strip(w0);
        const cname = c0 ? strip(c0) : undefined;
        const color = cname ? DOC_COLORS[cname] ?? cname : undefined;
        const tok = {text: s.replace(/·/g, ' '), kind, flicker, glow, scale, color, t};
        t += gap;
        return tok;
      }),
  );
};

const Word: React.FC<{tok: Tok; size: number; base: string}> = ({tok, size, base}) => {
  const frame = useCurrentFrame();
  const d = frame - tok.t;
  if (d < 0) return <span style={{display: 'inline-block', opacity: 0, fontSize: size * BASE[tok.kind] * tok.scale, lineHeight: 0.9}}>{tok.text}</span>;
  const big = tok.kind === 'cond' || tok.kind === 'outline';
  const p = interpolate(d, [0, big ? 6 : 5], [0, 1], {extrapolateRight: 'clamp', easing: EASE.out});
  // parpadeo: el color "se enciende" a golpes, como un neón
  const on = !tok.flicker || d <= 2 || (d >= 5 && d <= 8) || d >= 11;
  const color = tok.color && on ? tok.color : base;
  const darkBase = base !== '#ffffff';
  const fs = size * BASE[tok.kind] * tok.scale;
  const style: React.CSSProperties = {
    display: 'inline-block',
    fontSize: fs,
    lineHeight: 0.9,
    whiteSpace: 'pre',
    opacity: p,
    filter: `blur(${(1 - p) * (big ? 10 : 6)}px)`,
    transform: big ? `scale(${1.35 - 0.35 * p})` : tok.kind.startsWith('serif') ? `translateX(${(1 - p) * -18}px)` : `translateY(${(1 - p) * 14}px)`,
    color,
    textShadow: tok.glow && tok.color ? `0 0 16px ${color}, 0 0 42px ${color}99` : darkBase ? 'none' : '0 4px 18px rgba(0,0,0,0.45)',
  };
  if (tok.kind === 'cond') Object.assign(style, {fontFamily: F.cond, textTransform: 'uppercase', letterSpacing: '-0.01em'});
  if (tok.kind === 'outline')
    Object.assign(style, {
      fontFamily: F.cond,
      textTransform: 'uppercase',
      color: darkBase ? 'transparent' : 'rgba(255,255,255,0.12)',
      WebkitTextStroke: `${Math.max(2, fs * 0.022)}px ${tok.color ?? base}`,
      textShadow: 'none',
    });
  if (tok.kind === 'serifI') Object.assign(style, {fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400});
  if (tok.kind === 'serif') Object.assign(style, {fontFamily: F.serif, fontWeight: 400});
  if (tok.kind === 'sans') Object.assign(style, {fontFamily: F.sans, fontWeight: 700, letterSpacing: '-0.03em'});
  return <span style={style}>{tok.text}</span>;
};

export type CardSpec = {
  /** texto con el marcado de arriba */
  text: string;
  /** frame en que entra la primera palabra */
  at: number;
  /** frame en que sale la tarjeta */
  end: number;
  /** frames entre palabras (≈ ritmo del habla: 7–10) */
  gap?: number;
  x?: number;
  y?: number;
  size?: number;
  /** salida: rápida con desenfoque o "desintegrada" (polvo/humo) */
  exit?: 'blur' | 'dust';
  align?: 'center' | 'left';
  /** color base de las palabras sin @color (oscuro sobre fondos claros) */
  color?: string;
};

/** Tarjeta de subtítulo apilado: las palabras se construyen una a una y la tarjeta sale entera. */
export const StackCard: React.FC<CardSpec> = ({text, at, end, gap = 8, x = 540, y = 430, size = 1, exit = 'blur', align = 'center', color = '#ffffff'}) => {
  const frame = useCurrentFrame();
  const id = 'dust' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (frame < at - 1 || frame > end + 14) return null;
  const lines = parseCard(text, at, gap);
  const out = interpolate(frame, [end, end + (exit === 'dust' ? 14 : 5)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.in});
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? x : x,
        top: y,
        transform: align === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        width: 940,
        opacity: exit === 'dust' ? 1 - Math.max(0, out - 0.4) / 0.6 : 1 - out,
        filter: exit === 'dust' ? `url(#${id})` : `blur(${out * 12}px)`,
      }}
    >
      {exit === 'dust' && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id} x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={out * 140} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={out * 6} />
          </filter>
        </svg>
      )}
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', alignItems: 'baseline', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 14 * size, marginTop: li === 0 ? 0 : -10 * size, flexWrap: 'wrap'}}>
          {line.map((tok, wi) => (
            <Word key={wi} tok={tok} size={size} base={color} />
          ))}
        </div>
      ))}
    </div>
  );
};

/** Subtítulo "palabra a palabra" sencillo (una línea que se va completando), para los tramos de B-roll. */
export const RunningLine: React.FC<{words: string; at: number; end: number; gap?: number; y?: number; size?: number; color?: string}> = ({
  words,
  at,
  end,
  gap = 7,
  y = 1150,
  size = 46,
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > end + 5) return null;
  const list = words.split(' ');
  const n = Math.min(list.length, Math.floor((frame - at) / gap) + 1);
  const out = interpolate(frame, [end, end + 5], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 120, top: y, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: size, color, letterSpacing: '-0.02em', opacity: out, textShadow: '0 3px 14px rgba(0,0,0,.6)'}}>
      {list.slice(0, n).join(' ')}
    </div>
  );
};
