import React, {useId} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE} from '../theme';
import WORDS from './words.json';

/**
 * Subtítulos editoriales con las tipografías del reel de referencia:
 *   *PALABRA → Anton (condensada, mayúsculas)        ~PALABRA → Montserrat Black solo contorno
 *   _palabra → Playfair Display itálica (conectores)  =palabra → Playfair Display redonda
 *   palabra  → Montserrat ExtraBold (geométrica)
 * Sufijos: ! parpadeo de neón · ^ brillo · + / - tamaño · @color
 * `·` une varias palabras habladas en un token; `%` es un espacio visual dentro de un token.
 * Cada token toma su tiempo de words.json (transcripción con tiempos por palabra).
 */

export const FONTS = {
  cond: '"Anton", Impact, sans-serif',
  geo: '"Montserrat Variable", Montserrat, sans-serif',
  serif: '"Playfair Display", Georgia, serif',
};

export const COLORS: Record<string, string> = {
  cyan: '#2fe0ff',
  blue: '#4aa8ff',
  magenta: '#ff3fd8',
  purple: '#b76cff',
  red: '#ff2b3c',
  gold: '#ffc857',
  ink: '#121212',
};

export const W = WORDS as [string, number, number][];
export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);
/** frame (global) en que empieza la palabra i */
export const wt = (i: number) => f(W[i][1]);

type Kind = 'cond' | 'outline' | 'serifI' | 'serif' | 'geo';
type Tok = {text: string; kind: Kind; flicker: boolean; glow: boolean; scale: number; color?: string; t: number};

const BASE: Record<Kind, number> = {cond: 132, outline: 112, serifI: 66, serif: 66, geo: 70};

const parse = (src: string, i0: number) => {
  let i = i0;
  return src.split(' / ').map((line) =>
    line
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((raw): Tok => {
        let s = raw;
        let lead = '';
        while (/^[¿¡«"(]/.test(s) && s.length > 1) (lead += s[0]), (s = s.slice(1));
        let kind: Kind = 'geo';
        if (s[0] === '*') (kind = 'cond'), (s = s.slice(1));
        else if (s[0] === '~') (kind = 'outline'), (s = s.slice(1));
        else if (s[0] === '_') (kind = 'serifI'), (s = s.slice(1));
        else if (s[0] === '=') (kind = 'serif'), (s = s.slice(1));
        let flicker = false;
        let glow = false;
        let scale = 1;
        const strip = (x: string) => {
          while (/[!^+-]$/.test(x) && x.length > 1) {
            const c = x[x.length - 1];
            if (c === '!') flicker = true;
            if (c === '^') glow = true;
            if (c === '+') scale *= 1.4;
            if (c === '-') scale *= 0.72;
            x = x.slice(0, -1);
          }
          return x;
        };
        const [w0, c0] = s.split('@');
        const body = strip(w0);
        const cname = c0 ? strip(c0) : undefined;
        const parts = body.split('·');
        const tok: Tok = {
          text: lead + parts.join(' ').replace(/%/g, ' '),
          kind,
          flicker,
          glow,
          scale,
          color: cname ? COLORS[cname] ?? cname : undefined,
          t: wt(Math.min(i, W.length - 1)),
        };
        i += parts.length;
        return tok;
      }),
  );
};

const Word: React.FC<{tok: Tok; size: number; base: string}> = ({tok, size, base}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = frame - tok.t;
  const fs = size * BASE[tok.kind] * tok.scale;
  const common: React.CSSProperties = {display: 'inline-block', fontSize: fs, lineHeight: 0.92, whiteSpace: 'pre'};
  if (d < 0) return <span style={{...common, opacity: 0}}>{tok.text}</span>;
  const big = tok.kind === 'cond' || tok.kind === 'outline';
  // "slam": las palabras grandes caen con un muelle corto (ligero rebote), las pequeñas se deslizan
  const sp = spring({frame: d, fps, config: {damping: 13, stiffness: 320, mass: 0.6}});
  const p = interpolate(d, [0, 4], [0, 1], {extrapolateRight: 'clamp', easing: EASE.out});
  const on = !tok.flicker || d <= 2 || (d >= 5 && d <= 7) || d >= 10;
  const color = tok.color && on ? tok.color : base;
  const dark = base !== '#ffffff';
  const style: React.CSSProperties = {
    ...common,
    opacity: p,
    filter: `blur(${(1 - p) * (big ? 9 : 6)}px)`,
    transform: big ? `scale(${1.32 - 0.32 * sp})` : `translateY(${(1 - p) * 16}px)`,
    clipPath: big ? undefined : `inset(${(1 - p) * 100}% 0 -20% 0)`,
    color,
    textShadow: tok.glow && tok.color && on ? `0 0 14px ${color}, 0 0 38px ${color}aa, 0 0 70px ${color}55` : dark ? 'none' : '0 4px 22px rgba(0,0,0,0.55)',
  };
  if (tok.kind === 'cond') Object.assign(style, {fontFamily: FONTS.cond, textTransform: 'uppercase', letterSpacing: '-0.015em'});
  if (tok.kind === 'outline')
    Object.assign(style, {
      fontFamily: FONTS.geo,
      fontWeight: 900,
      textTransform: 'uppercase',
      color: 'transparent',
      WebkitTextStroke: `${Math.max(2, fs * 0.028)}px ${tok.color ?? base}`,
      textShadow: tok.glow && tok.color ? `0 0 18px ${tok.color}` : 'none',
    });
  if (tok.kind === 'serifI') Object.assign(style, {fontFamily: FONTS.serif, fontStyle: 'italic', fontWeight: 400});
  if (tok.kind === 'serif') Object.assign(style, {fontFamily: FONTS.serif, fontWeight: 400});
  if (tok.kind === 'geo') Object.assign(style, {fontFamily: FONTS.geo, fontWeight: 800, letterSpacing: '-0.035em'});
  return <span style={style}>{tok.text}</span>;
};

export type CardSpec = {
  /** índices de palabra [primera, última] en words.json */
  w: [number, number];
  t: string;
  x?: number;
  y?: number;
  size?: number;
  /** segundo de salida (por defecto: fin de la última palabra + 0.35 s) */
  end?: number;
  exit?: 'blur' | 'dust' | 'up';
  color?: string;
  align?: 'center' | 'left';
  /** detrás de la persona (solo en planos de presentadora) */
  behind?: boolean;
};

export const cardEnd = (c: CardSpec) => (c.end !== undefined ? f(c.end) : f(W[c.w[1]][2] + 0.35));

/** Tarjeta apilada: las palabras se construyen una a una con la voz; la tarjeta respira y sale entera. */
export const Card: React.FC<CardSpec> = (c) => {
  const frame = useCurrentFrame();
  const id = 'dust' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const at = wt(c.w[0]);
  const end = cardEnd(c);
  if (frame < at - 1 || frame > end + 14) return null;
  const size = c.size ?? 1;
  const base = c.color ?? '#ffffff';
  const exit = c.exit ?? 'blur';
  const lines = parse(c.t, c.w[0]);
  const out = interpolate(frame, [end, end + (exit === 'dust' ? 14 : 6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.in});
  const breathe = interpolate(frame, [at, end], [1, 1.035], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const center = (c.align ?? 'center') === 'center';
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x ?? 510,
        top: c.y ?? 470,
        transform: `${center ? 'translate(-50%, -50%)' : 'translateY(-50%)'} scale(${breathe}) translateY(${exit === 'up' ? -out * 60 : 0}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: center ? 'center' : 'flex-start',
        width: 920,
        opacity: exit === 'dust' ? 1 - Math.max(0, out - 0.35) / 0.65 : 1 - out,
        filter: exit === 'dust' ? `url(#${id})` : out > 0 ? `blur(${out * 14}px)` : undefined,
      }}
    >
      {exit === 'dust' && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id} x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={out * 160} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={out * 5} />
          </filter>
        </svg>
      )}
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', alignItems: 'baseline', justifyContent: center ? 'center' : 'flex-start', gap: 14 * size, marginTop: li === 0 ? 0 : -12 * size, flexWrap: 'wrap'}}>
          {line.map((tok, wi) => (
            <Word key={wi} tok={tok} size={size} base={base} />
          ))}
        </div>
      ))}
    </div>
  );
};

/** Cuenta cuántas palabras consume el marcado (para validar contra el rango w). */
export const tokenCount = (t: string) =>
  t
    .split(' / ')
    .flatMap((l) => l.trim().split(/\s+/).filter(Boolean))
    .reduce((a, tok) => a + tok.split('@')[0].split('·').length, 0);
