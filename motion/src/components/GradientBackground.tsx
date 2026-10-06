import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C} from '../theme';

export type Blob = {
  x: number;
  y: number;
  /** Diámetro en px */
  size: number;
  color: string;
  kind?: 'blob' | 'ring';
  /** Grosor del anillo (0–1 del radio) */
  ring?: number;
  opacity?: number;
  /** Amplitud de la deriva orgánica (px) */
  drift?: number;
  /** Desenfoque extra con filtro (los degradados ya son suaves) */
  blur?: number;
  seed?: string;
};

const blobBackground = (b: Blob) => {
  if (b.kind === 'ring') {
    const w = (b.ring ?? 0.22) * 100;
    const mid = 100 - w;
    return `radial-gradient(circle closest-side, transparent ${mid - w * 0.9}%, ${b.color} ${mid}%, ${b.color}00 100%)`;
  }
  return `radial-gradient(circle closest-side, ${b.color} 0%, ${b.color}cc 25%, ${b.color}55 55%, ${b.color}00 100%)`;
};

/**
 * Fondo de "malla de degradado": manchas y anillos enormes, suaves, que derivan con ruido.
 * Todo con radial-gradient (barato) y, opcionalmente, filter: blur para el look más difuso.
 */
export const GradientBackground: React.FC<{
  mode?: 'dark' | 'light';
  blobs: Blob[];
  grain?: boolean;
  vignette?: boolean;
  children?: React.ReactNode;
}> = ({mode = 'dark', blobs, grain = true, vignette = true, children}) => {
  const frame = useCurrentFrame();
  const base =
    mode === 'dark'
      ? `linear-gradient(180deg, ${C.abyss} 0%, ${C.deep} 55%, ${C.forest} 100%)`
      : `linear-gradient(180deg, ${C.cream} 0%, #eef7da 60%, ${C.creamMint} 100%)`;

  return (
    <AbsoluteFill style={{background: base, overflow: 'hidden'}}>
      {blobs.map((b, i) => {
        const seed = b.seed ?? `blob-${i}`;
        const d = b.drift ?? 40;
        const dx = noise2D(seed + 'x', frame * 0.006, 0) * d;
        const dy = noise2D(seed + 'y', 0, frame * 0.006) * d;
        const breathe = 1 + noise2D(seed + 's', frame * 0.004, 1) * 0.06;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x - b.size / 2,
              top: b.y - b.size / 2,
              width: b.size,
              height: b.size,
              background: blobBackground(b),
              opacity: b.opacity ?? 1,
              transform: `translate(${dx}px, ${dy}px) scale(${breathe})`,
              filter: b.blur ? `blur(${b.blur}px)` : undefined,
              mixBlendMode: mode === 'dark' ? 'screen' : 'multiply',
            }}
          />
        );
      })}
      {children}
      {vignette && (
        <AbsoluteFill
          style={{
            background:
              mode === 'dark'
                ? 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,10,6,0.55) 100%)'
                : 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(120,160,80,0.12) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {grain && <Grain opacity={mode === 'dark' ? 0.09 : 0.06} />}
    </AbsoluteFill>
  );
};

/** Grano de película animado (feTurbulence con semilla por frame). */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
