import {Easing} from 'remotion';

/** Paleta extraída del video de referencia (verde profundo → teal → menta → lima → crema). */
export const C = {
  abyss: '#021813',
  deep: '#04261d',
  forest: '#0a3f2f',
  teal: '#0f6f5a',
  mint: '#1fd6a0',
  mintSoft: '#7fe8c4',
  lime: '#d8f23a',
  limeHot: '#f3f64a',
  yellow: '#fff27a',
  cream: '#f6fae7',
  creamMint: '#e3f4cf',
  ink: '#0b4a33',
  inkDeep: '#06301f',
  white: '#ffffff',
} as const;

export const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';

/** Curvas fuertes (Emil Kowalski): nunca ease-in en entradas. */
export const EASE = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
  /** Solo para salidas que aceleran fuera de cuadro. */
  in: Easing.bezier(0.55, 0, 1, 0.45),
};

/**
 * Muelles (springs) de Remotion.
 * Relación de amortiguación ζ = damping / (2·√(stiffness·mass)).
 *  - smooth: ζ≈1   (sin rebote, asentamiento elegante)
 *  - snappy: ζ≈0.8 (rebote mínimo, para cosas "lanzadas")
 *  - bouncy: ζ≈0.5 (rebote visible: letras, iconos)
 *  - pop:    ζ≈0.35 (rebote juguetón, solo en momentos de deleite)
 */
export const SPRING = {
  smooth: {damping: 26, stiffness: 170, mass: 1},
  snappy: {damping: 28, stiffness: 300, mass: 1},
  bouncy: {damping: 14, stiffness: 200, mass: 1},
  pop: {damping: 11, stiffness: 260, mass: 0.9},
  heavy: {damping: 20, stiffness: 90, mass: 1.4},
} as const;

export type SpringName = keyof typeof SPRING;

/** Sombra de brillo para elementos lima (glow en capas). */
export const glow = (color: string = C.lime, strength = 1) =>
  `drop-shadow(0 0 ${6 * strength}px ${color}) drop-shadow(0 0 ${22 * strength}px ${color}aa) drop-shadow(0 0 ${48 * strength}px ${color}55)`;

export const textGlow = (color: string = C.lime, strength = 1) =>
  `0 0 ${8 * strength}px ${color}aa, 0 0 ${28 * strength}px ${color}55`;
