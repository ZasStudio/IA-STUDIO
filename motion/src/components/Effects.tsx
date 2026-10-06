import React, {useId} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength} from '@remotion/paths';
import {C, EASE, FONT, SPRING} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

/**
 * MAPA DE DEGRADADO (gradient map), igual que en Photoshop/After Effects:
 *  1) pasa la imagen a luminancia (feColorMatrix con pesos Rec.709)
 *  2) remapea sombras → medios → luces a los colores de `stops` (feComponentTransfer table)
 * `amount` mezcla con el original; `blur` añade desenfoque (profundidad de campo).
 */
export const GradientMap: React.FC<{
  stops: string[];
  amount?: number;
  blur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({stops, amount = 1, blur = 0, style, children}) => {
  const id = 'gm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const rgb = stops.map(hexToRgb);
  const table = (ch: number) => rgb.map((c) => c[ch].toFixed(3)).join(' ');
  const L = '0.2126 0.7152 0.0722 0 0';
  return (
    <div style={{position: 'absolute', inset: 0, ...style}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feColorMatrix in="SourceGraphic" type="matrix" values={`${L} ${L} ${L} 0 0 0 1 0`} result="lum" />
          <feComponentTransfer in="lum" result="mapped">
            <feFuncR type="table" tableValues={table(0)} />
            <feFuncG type="table" tableValues={table(1)} />
            <feFuncB type="table" tableValues={table(2)} />
          </feComponentTransfer>
          <feComposite in="mapped" in2="SourceGraphic" operator="arithmetic" k1={0} k2={amount} k3={1 - amount} k4={0} />
        </filter>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: `url(#${id})${blur ? ` blur(${blur}px)` : ''}`}}>{children}</div>
    </div>
  );
};

/** Paletas de mapa de degradado listas para usar. */
export const GRADIENT_MAPS = {
  forest: [C.abyss, C.forest, C.teal, C.mint, C.lime, C.cream],
  lime: [C.inkDeep, C.ink, '#5fae3a', C.lime, '#fbffd9'],
  duotone: [C.deep, C.lime],
};

type Orbit = {cx: number; cy: number; r: number; speed?: number; arc?: number; dots?: number};

/** Anillos finos con arcos lima que giran y puntos que orbitan. */
export const OrbitRings: React.FC<{rings: Orbit[]; start?: number; opacity?: number}> = ({rings, start = 0, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const grow = spring({frame: frame - start, fps, config: SPRING.heavy});
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <filter id="orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rings.map((o, i) => {
        const r = o.r * interpolate(grow, [0, 1], [0.6, 1]);
        const circ = 2 * Math.PI * r;
        const rot = (frame * (o.speed ?? 0.4) + i * 70) % 360;
        const arc = o.arc ?? 0.12;
        return (
          <g key={i} opacity={grow}>
            <circle cx={o.cx} cy={o.cy} r={r} fill="none" stroke={C.mintSoft} strokeOpacity={0.32} strokeWidth={2} />
            <circle
              cx={o.cx}
              cy={o.cy}
              r={r}
              fill="none"
              stroke={C.lime}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${circ * arc} ${circ}`}
              transform={`rotate(${rot} ${o.cx} ${o.cy})`}
              filter="url(#orbit-glow)"
            />
            {Array.from({length: o.dots ?? 2}, (_, k) => {
              const a = ((rot * 0.7 + k * (360 / (o.dots ?? 2)) + 40) * Math.PI) / 180;
              return <circle key={k} cx={o.cx + Math.cos(a) * r} cy={o.cy + Math.sin(a) * r} r={4.5} fill={C.cream} filter="url(#orbit-glow)" />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

/**
 * Cinta / tubo en degradado que se dibuja (evolvePath de @remotion/paths).
 * Una segunda pasada fina y clara simula el brillo de un tubo 3D.
 */
export const Ribbon: React.FC<{
  d: string;
  start: number;
  duration?: number;
  width?: number;
  from?: string;
  to?: string;
  tail?: number;
  gradient?: [number, number, number, number];
  shine?: boolean;
  viewBox?: string;
  style?: React.CSSProperties;
}> = ({d, start, duration = 30, width = 60, from = C.ink, to = C.lime, tail, gradient = [0, 0, 1, 0], shine = true, viewBox = '0 0 1920 1080', style}) => {
  const frame = useCurrentFrame();
  const id = 'rb' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const head = interpolate(frame, [start, start + duration], [0, 1], {...clamp, easing: EASE.inOut});
  const tailP = tail === undefined ? 0 : interpolate(frame, [tail, tail + duration], [0, 1], {...clamp, easing: EASE.inOut});
  if (head <= 0) return null;
  // dibuja el tramo entre la cola (tailP) y la cabeza (head)
  const len = getLength(d);
  const dash = `${Math.max(0.001, (head - tailP) * len)} ${len * 2}`;
  const offset = -tailP * len;
  return (
    <svg viewBox={viewBox} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={id} x1={gradient[0]} y1={gradient[1]} x2={gradient[2]} y2={gradient[3]}>
          <stop offset="0%" stopColor={from} />
          <stop offset="55%" stopColor={to} />
          <stop offset="100%" stopColor={from} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} />
      {shine && (
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={width * 0.18}
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          transform={`translate(${-width * 0.16}, ${-width * 0.16})`}
          style={{filter: 'blur(3px)'}}
        />
      )}
    </svg>
  );
};

/**
 * Texto con eco: copias apiladas arriba y abajo que se separan con un muelle,
 * cada vez más transparentes y desenfocadas (estela/motion echo).
 */
export const EchoText: React.FC<{
  text: string;
  x: number;
  y: number;
  start: number;
  collapse?: number;
  exit?: number;
  size?: number;
  color?: string;
  copies?: number;
  spacing?: number;
}> = ({text, x, y, start, collapse, exit, size = 150, color = C.lime, copies = 4, spacing = 0.62}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const open = spring({frame: frame - start, fps, config: SPRING.bouncy});
  const close = collapse === undefined ? 0 : spring({frame: frame - collapse, fps, config: SPRING.snappy});
  const spread = open * (1 - close);
  const reveal = interpolate(frame - start, [-10, 0], [0, 1], clamp);
  const out = exit === undefined ? 0 : interpolate(frame, [exit, exit + 12], [0, 1], {...clamp, easing: EASE.in});
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(-50%, -50%)',
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: size,
    letterSpacing: '-0.03em',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: reveal * (1 - out),
        filter: out > 0 ? `blur(${out * 16}px)` : undefined,
        transform: `scale(${1 + out * 0.25})`,
      }}
    >
      {Array.from({length: copies}, (_, k) => k + 1).flatMap((k) =>
        [-1, 1].map((dir) => (
          <div
            key={`${k}${dir}`}
            style={{
              ...base,
              top: dir * k * size * spacing * spread,
              color,
              opacity: (0.42 / k) * spread,
              filter: `blur(${k * 1.2}px)`,
            }}
          >
            {text}
          </div>
        )),
      )}
      <div style={{...base, color, textShadow: `0 6px 30px ${color}66`}}>{text}</div>
    </div>
  );
};

/** Filas de texto gigante y pálido que se desplazan en paralaje (fondo tipográfico). */
export const MarqueeRows: React.FC<{text: string; rows?: number; size?: number; color?: string; speed?: number; y?: number; opacity?: number}> = ({
  text,
  rows = 3,
  size = 230,
  color = C.ink,
  speed = 4,
  y = 160,
  opacity = 0.1,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: rows}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: y + i * size * 0.95,
            whiteSpace: 'nowrap',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: size,
            letterSpacing: '-0.03em',
            color,
            opacity,
            transform: `translateX(${(i % 2 ? -1 : 1) * frame * speed - 400 - i * 300}px)`,
            filter: i === 1 ? 'none' : 'blur(2px)',
          }}
        >
          {`${text} ${text} ${text} ${text}`}
        </div>
      ))}
    </>
  );
};
