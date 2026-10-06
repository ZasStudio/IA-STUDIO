import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, SPRING} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Caja de selección estilo Figma: primero aparecen las esquinas (rebote), luego se dibujan los lados. */
export const SelectionBox: React.FC<{start: number; color?: string; pad?: number; children: React.ReactNode}> = ({
  start,
  color = C.lime,
  pad = 8,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const corners = spring({frame: local, fps, config: SPRING.pop});
  const draw = interpolate(local, [5, 16], [50, 0], {...clamp, easing: EASE.out});
  const handle = (pos: React.CSSProperties, i: number) => (
    <span
      key={i}
      style={{
        position: 'absolute',
        width: 7,
        height: 7,
        background: color,
        borderRadius: 1,
        transform: `translate(-50%, -50%) scale(${corners})`,
        opacity: local < 0 ? 0 : 1,
        ...pos,
      }}
    />
  );
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {children}
      <span
        style={{
          position: 'absolute',
          inset: -pad,
          border: `1.5px solid ${color}`,
          clipPath: `inset(${draw}% ${draw}% ${draw}% ${draw}%)`,
          opacity: local < 5 ? 0 : 1,
        }}
      />
      {[
        {left: -pad, top: -pad},
        {left: `calc(100% + ${pad}px)`, top: -pad},
        {left: -pad, top: `calc(100% + ${pad}px)`},
        {left: `calc(100% + ${pad}px)`, top: `calc(100% + ${pad}px)`},
      ].map((p, i) => handle(p as React.CSSProperties, i))}
    </span>
  );
};

/** Barrido de resaltado en degradado detrás de una palabra (de izquierda a derecha). */
export const HighlightSweep: React.FC<{
  start: number;
  from?: string;
  to?: string;
  textColor?: string;
  children: React.ReactNode;
}> = ({start, from = C.ink, to = C.lime, textColor, children}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - start, [0, 12], [100, 0], {...clamp, easing: EASE.inOut});
  return (
    <span style={{position: 'relative', display: 'inline-block', isolation: 'isolate', color: t < 50 ? textColor : undefined}}>
      <span
        style={{
          position: 'absolute',
          inset: '-0.02em -0.14em -0.06em -0.14em',
          background: `linear-gradient(90deg, ${from}, ${to})`,
          clipPath: `inset(0 ${t}% 0 0 round 6px)`,
          zIndex: -1,
          boxShadow: t < 100 ? `0 6px 24px ${to}55` : undefined,
        }}
      />
      {children}
    </span>
  );
};

/** Cursor tipo flecha. */
export const Cursor: React.FC<{x: number; y: number; press?: number; color?: string; size?: number; opacity?: number}> = ({
  x,
  y,
  press = 0,
  color = C.lime,
  size = 34,
  opacity = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity,
      transform: `scale(${1 - press * 0.18})`,
      transformOrigin: '10% 10%',
      filter: `drop-shadow(0 0 8px ${color}88) drop-shadow(0 4px 6px rgba(0,0,0,.4))`,
      overflow: 'visible',
    }}
  >
    <path d="M3 2 L20 11 L12 13 L8 21 Z" fill={color} stroke={C.deep} strokeWidth={1.2} strokeLinejoin="round" />
  </svg>
);

/** Destellos radiales (burst) al hacer clic. */
export const Burst: React.FC<{x: number; y: number; start: number; color?: string; count?: number; radius?: number}> = ({
  x,
  y,
  start,
  color = C.limeHot,
  count = 7,
  radius = 90,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  if (local < 0 || local > 26) return null;
  const t = interpolate(local, [0, 26], [0, 1], {easing: EASE.out});
  return (
    <svg style={{position: 'absolute', left: x - radius * 1.5, top: y - radius * 1.5, overflow: 'visible'}} width={radius * 3} height={radius * 3}>
      <g transform={`translate(${radius * 1.5}, ${radius * 1.5})`} style={{filter: `drop-shadow(0 0 6px ${color})`}}>
        {Array.from({length: count}, (_, i) => {
          const a = (i / count) * Math.PI * 2 + 0.4;
          const r1 = radius * (0.35 + t * 0.9);
          const r2 = r1 + radius * 0.35 * (1 - t);
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={color}
              strokeWidth={7 * (1 - t) + 1}
              strokeLinecap="round"
              opacity={1 - t * 0.6}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** Retícula de puntos (como el overlay de la foto en el video). */
export const DotGrid: React.FC<{opacity?: number; gap?: number; color?: string; mask?: string}> = ({
  opacity = 0.5,
  gap = 26,
  color = 'rgba(255,255,255,0.55)',
  mask,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity,
      backgroundImage: `radial-gradient(circle, ${color} 1.6px, transparent 2px)`,
      backgroundSize: `${gap}px ${gap}px`,
      WebkitMaskImage: mask,
      maskImage: mask,
    }}
  />
);
