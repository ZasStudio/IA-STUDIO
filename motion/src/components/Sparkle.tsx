import React, {useId} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, glow} from '../theme';
import {pathAt, stretchFromVelocity, type Key} from '../lib/motion';

type SparkleProps = {
  size?: number;
  color?: string;
  core?: string;
  rotate?: number;
  glowStrength?: number;
  /** 0 = flor nítida, 1 = píldora sólida (cuando va muy rápido) */
  smear?: number;
  style?: React.CSSProperties;
};

/** La "chispa": flor de 8 pétalos con brillo en capas. */
export const Sparkle: React.FC<SparkleProps> = ({
  size = 80,
  color = C.lime,
  core = C.limeHot,
  rotate = 0,
  glowStrength = 1,
  smear = 0,
  style,
}) => {
  const petals = Array.from({length: 8}, (_, i) => i * 45);
  const id = 'sp' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div style={{width: size, height: size, filter: glowStrength > 0 ? glow(color, glowStrength) : undefined, ...style}}>
      <svg viewBox="-50 -50 100 100" width={size} height={size} style={{overflow: 'visible'}}>
        <defs>
          <radialGradient id={id}>
            <stop offset="0%" stopColor={C.white} />
            <stop offset="45%" stopColor={core} />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
        </defs>
        <g transform={`rotate(${rotate})`} opacity={1 - smear}>
          {petals.map((a) => (
            <ellipse key={a} cx={0} cy={-25} rx={12.5} ry={20} transform={`rotate(${a})`} fill={`url(#${id})`} />
          ))}
          <circle r={17} fill={core} />
          <circle r={9} fill={C.white} opacity={0.65} />
        </g>
        {smear > 0 && <rect x={-44} y={-30} width={88} height={60} rx={30} fill={core} opacity={smear} />}
      </svg>
    </div>
  );
};

/**
 * Chispa que vuela por una trayectoria con squash & stretch automático según su velocidad.
 * Cuanto más rápido, más se estira y más se "funde" en una píldora (motion smear).
 */
export const FlyingSparkle: React.FC<{
  keys: Key[];
  size?: number;
  color?: string;
  core?: string;
  spin?: number;
  glowStrength?: number;
  appear?: number;
  disappear?: number;
}> = ({keys, size = 80, color, core, spin = 2, glowStrength = 1, appear, disappear}) => {
  const frame = useCurrentFrame();
  const p = pathAt(frame, keys);
  const prev = pathAt(frame - 1, keys);
  const {angle, sx, sy, speed} = stretchFromVelocity(p.x - prev.x, p.y - prev.y);
  const smear = interpolate(speed, [14, 42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacityIn = appear === undefined ? 1 : interpolate(frame, [appear, appear + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacityOut =
    disappear === undefined ? 1 : interpolate(frame, [disappear, disappear + 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x - size / 2,
        top: p.y - size / 2,
        opacity: opacityIn * opacityOut,
        transform: `rotate(${angle}deg) scale(${sx * p.s}, ${sy * p.s}) rotate(${-angle}deg)`,
      }}
    >
      <Sparkle size={size} color={color} core={core} rotate={frame * spin + p.r} glowStrength={glowStrength} smear={smear} />
    </div>
  );
};

/** Chispa en versión plana (sin brillo) para el modo claro. */
export const InkSparkle: React.FC<{size?: number; rotate?: number; style?: React.CSSProperties}> = ({size = 40, rotate = 0, style}) => (
  <Sparkle size={size} color={C.ink} core={C.inkDeep} rotate={rotate} glowStrength={0} style={style} />
);

/**
 * Bola luminosa con squash & stretch: se estira con la velocidad y se aplasta
 * en los frames de impacto (`impacts`).
 */
export const FlyingBall: React.FC<{keys: Key[]; size?: number; color?: string; impacts?: number[]; appear?: number; disappear?: number}> = ({
  keys,
  size = 46,
  color = C.cream,
  impacts = [],
  appear,
  disappear,
}) => {
  const frame = useCurrentFrame();
  const p = pathAt(frame, keys);
  const prev = pathAt(frame - 1, keys);
  const {angle, sx, sy} = stretchFromVelocity(p.x - prev.x, p.y - prev.y, 28, 2.6);
  // Aplastamiento al impactar: ancho ↑, alto ↓, y recupera con un pequeño rebote.
  const squash = impacts.reduce((acc, f) => {
    const d = frame - f;
    if (d < 0 || d > 10) return acc;
    return acc + Math.sin((d / 10) * Math.PI) * Math.exp(-d / 6) * 0.55;
  }, 0);
  const vis =
    (appear === undefined ? 1 : interpolate(frame, [appear, appear + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) *
    (disappear === undefined ? 1 : interpolate(frame, [disappear, disappear + 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x - size / 2,
        top: p.y - size / 2,
        width: size,
        height: size,
        opacity: vis,
        transformOrigin: '50% 100%',
        transform: `scale(${1 + squash}, ${1 - squash}) rotate(${angle}deg) scale(${sx * p.s}, ${sy * p.s}) rotate(${-angle}deg)`,
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, #ffffff, ${color} 55%, ${C.lime})`,
        filter: glow(C.limeHot, 0.9),
      }}
    />
  );
};
