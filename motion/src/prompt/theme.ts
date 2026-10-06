import type React from 'react';

/**
 * Estilo "Prompt" (aprendido del 2º video): SaaS minimalista tipo Apple.
 * Azul ultramar profundo que se funde en degradados pastel (cielo → lila → rosa → melocotón),
 * escenas blancas y tipografía grotesca fina (Inter) en dos tonos.
 */
export const P = {
  ink: '#0e1424',
  inkSoft: '#46516e',
  navy: '#030a35',
  blueDeep: '#08198a',
  blue: '#1d3fe0',
  blueBright: '#3d6bff',
  sky: '#8cc4ff',
  skyPale: '#e2eeff',
  lilac: '#b8a8ff',
  pink: '#f5b4d0',
  peach: '#ffd4a8',
  paper: '#f7f9fc',
  white: '#ffffff',
} as const;

export const FONT_P = '"Inter Variable", Inter, system-ui, sans-serif';

/** Degradado de texto en dos tonos (la 2ª palabra se "desvanece" a azul). */
export const textGradient = (from: string = P.inkSoft, to: string = P.sky): React.CSSProperties => ({
  background: `linear-gradient(90deg, ${from}, ${to})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});
