import {interpolate, spring, useCurrentFrame, useVideoConfig, type EasingFunction} from 'remotion';
import {EASE, SPRING, type SpringName} from '../theme';

/** Progreso 0→1 de un muelle que arranca en `delay` (frames). */
export const useSpring = (delay = 0, name: SpringName = 'smooth', durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: SPRING[name], durationInFrames});
};

export const springAt = (frame: number, fps: number, delay = 0, name: SpringName = 'smooth') =>
  spring({frame: frame - delay, fps, config: SPRING[name]});

/** Interpolación con clamp y curva por defecto ease-out fuerte. */
export const tween = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: EasingFunction = EASE.out,
) => interpolate(frame, input, output, {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export type Key = {f: number; x: number; y: number; s?: number; r?: number; ease?: EasingFunction};

/** Posición a lo largo de una trayectoria por keyframes (x, y, escala, rotación). */
export const pathAt = (frame: number, keys: Key[]) => {
  if (frame <= keys[0].f) return {x: keys[0].x, y: keys[0].y, s: keys[0].s ?? 1, r: keys[0].r ?? 0};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], {easing: b.ease ?? EASE.inOut});
      const lerp = (p: number, q: number) => p + (q - p) * t;
      return {x: lerp(a.x, b.x), y: lerp(a.y, b.y), s: lerp(a.s ?? 1, b.s ?? 1), r: lerp(a.r ?? 0, b.r ?? 0)};
    }
  }
  const z = keys[keys.length - 1];
  return {x: z.x, y: z.y, s: z.s ?? 1, r: z.r ?? 0};
};

/**
 * Squash & stretch a partir de la velocidad: el objeto se estira en la dirección del
 * movimiento y se aplasta en la perpendicular (conserva el "volumen").
 */
export const stretchFromVelocity = (vx: number, vy: number, k = 34, max = 2.4) => {
  const speed = Math.hypot(vx, vy);
  const stretch = Math.min(1 + speed / k, max);
  return {
    angle: (Math.atan2(vy, vx) * 180) / Math.PI,
    sx: stretch,
    sy: 1 / Math.sqrt(stretch),
    speed,
  };
};

/** Escalonado (stagger) en frames. */
export const stagger = (i: number, each = 2, start = 0) => start + i * each;
