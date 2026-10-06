import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, SPRING} from '../theme';
import {Sparkle} from './Sparkle';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Superficie de cristal (glassmorphism):
 *  - backdrop-filter: blur + saturate (desenfoca lo que hay detrás)
 *  - relleno translúcido en degradado + borde superior brillante (la luz "atrapa" el material)
 *  - borde en degradado con brillo (máscara mask-composite)
 *  - entrada "materializada": el desenfoque del cristal y la escala crecen juntos
 * Ojo: no poner `filter` en un ancestro, porque rompe el backdrop-filter.
 */
export const GlassCard: React.FC<{
  width: number;
  height: number;
  radius?: number;
  start?: number;
  tint?: 'dark' | 'light';
  border?: [string, string];
  borderWidth?: number;
  glowBorder?: boolean;
  blur?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  width,
  height,
  radius = 36,
  start = 0,
  tint = 'dark',
  border = [C.lime, 'rgba(255,255,255,0.15)'],
  borderWidth = 2.5,
  glowBorder = true,
  blur = 26,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - start, fps, config: SPRING.smooth});
  const fill =
    tint === 'dark'
      ? 'linear-gradient(140deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 45%, rgba(31,214,160,0.08) 100%)'
      : 'linear-gradient(140deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 60%, rgba(216,242,58,0.18) 100%)';
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        borderRadius: radius,
        opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
        transform: `scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          background: fill,
          backdropFilter: `blur(${blur * p}px) saturate(${1 + 0.6 * p})`,
          WebkitBackdropFilter: `blur(${blur * p}px) saturate(${1 + 0.6 * p})`,
          boxShadow:
            tint === 'dark'
              ? 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -20px 40px rgba(0,0,0,0.12), 0 30px 80px rgba(0,0,0,0.35)'
              : 'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 30px 70px rgba(40,90,40,0.18)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          padding: borderWidth,
          background: `linear-gradient(160deg, ${border[0]} 0%, ${border[1]} 45%, ${border[0]} 100%)`,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          filter: glowBorder ? `drop-shadow(0 0 6px ${border[0]}) drop-shadow(0 0 18px ${border[0]}88)` : undefined,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/** Toggle en forma de píldora "Spark" que se activa con un clic. t: 0 (off) → 1 (on). */
export const TogglePill: React.FC<{x: number; y: number; t: number; label?: string; appear?: number}> = ({
  x,
  y,
  t,
  label = 'Spark',
  appear = 1,
}) => {
  const w = 230;
  const h = 70;
  const knob = h - 14;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: h,
        opacity: appear,
        transform: `scale(${0.85 + appear * 0.15})`,
        transformOrigin: 'left center',
        background: `linear-gradient(90deg, rgba(10,63,47,${0.9 - t * 0.4}), rgba(31,214,160,${t * 0.65}) 55%, rgba(216,242,58,${t}))`,
        boxShadow: `inset 0 1.5px 0 rgba(255,255,255,.25), 0 10px 30px rgba(0,0,0,.35), 0 0 ${40 * t}px rgba(216,242,58,${0.55 * t})`,
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 30 + (1 - t) * 64,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 26,
          fontWeight: 500,
          color: t > 0.5 ? C.inkDeep : 'rgba(255,255,255,0.35)',
          fontFamily: FONT,
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          top: 7,
          left: 7 + t * (w - knob - 14),
          width: knob,
          height: knob,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Sparkle size={knob * 0.95} rotate={t * 180} glowStrength={0.3 + t * 0.9} color={t > 0.3 ? C.lime : C.teal} core={t > 0.3 ? C.limeHot : C.mint} />
      </div>
    </div>
  );
};
