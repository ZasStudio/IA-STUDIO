import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {EASE, SPRING} from '../../theme';
import {FONT_P, P, textGradient} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export type SkyMode = 'pastel' | 'deep' | 'dusk' | 'white' | 'ice' | 'night';

const SKIES: Record<SkyMode, string> = {
  pastel: `linear-gradient(180deg, ${P.sky} 0%, #b9c8ff 30%, ${P.pink} 62%, ${P.peach} 100%)`,
  deep: `linear-gradient(180deg, ${P.navy} 0%, ${P.blueDeep} 30%, ${P.blue} 58%, ${P.sky} 86%, ${P.pink} 100%)`,
  dusk: `linear-gradient(180deg, ${P.blueDeep} 0%, ${P.blue} 35%, #9aa8ff 70%, ${P.pink} 100%)`,
  white: `radial-gradient(ellipse at 50% 120%, ${P.skyPale} 0%, ${P.paper} 45%, #ffffff 100%)`,
  ice: `linear-gradient(160deg, #eef4ff 0%, #c9dbff 45%, #a9c3f5 100%)`,
  night: `radial-gradient(ellipse at 50% 55%, ${P.blueDeep} 0%, ${P.navy} 55%, #01030f 100%)`,
};

/**
 * Cielo en degradado. `layers` permite fundir varios cielos: [{mode, opacity}].
 * Un brillo suave deriva con ruido para que el fondo "respire".
 */
export const Sky: React.FC<{layers: {mode: SkyMode; opacity?: number}[]; glow?: string; children?: React.ReactNode}> = ({
  layers,
  glow = 'rgba(255,255,255,0.35)',
  children,
}) => {
  const frame = useCurrentFrame();
  const gx = 50 + noise2D('gx', frame * 0.004, 0) * 25;
  const gy = 70 + noise2D('gy', 0, frame * 0.004) * 15;
  return (
    <AbsoluteFill style={{background: P.navy, overflow: 'hidden'}}>
      {layers.map((l, i) => (
        <AbsoluteFill key={i} style={{background: SKIES[l.mode], opacity: l.opacity ?? 1}} />
      ))}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at ${gx}% ${gy}%, ${glow}, transparent 70%)`, mixBlendMode: 'soft-light'}} />
      {children}
    </AbsoluteFill>
  );
};

/**
 * Letras que entran desenfocadas de una en una (de izquierda a derecha), con un leve
 * desplazamiento; al salir se desenfocan en el mismo orden.
 */
export const BlurLetters: React.FC<{
  text: string;
  start: number;
  exit?: number;
  each?: number;
  size?: number;
  weight?: number;
  color?: string;
  gradient?: [string, string];
  style?: React.CSSProperties;
  italic?: boolean;
  tracking?: string;
}> = ({text, start, exit, each = 1.4, size = 96, weight = 400, color = P.ink, gradient, style, italic, tracking = '-0.035em'}) => {
  const frame = useCurrentFrame();
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: FONT_P,
        fontSize: size,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : undefined,
        letterSpacing: tracking,
        whiteSpace: 'pre',
        lineHeight: 1.05,
        ...style,
      }}
    >
      {[...text].map((ch, i) => {
        const tIn = interpolate(frame - start - i * each, [0, 12], [0, 1], {...clamp, easing: EASE.out});
        const tOut = exit === undefined ? 0 : interpolate(frame - exit - i * each * 0.6, [0, 10], [0, 1], {...clamp, easing: EASE.in});
        const t = tIn * (1 - tOut);
        // Cada letra toma su "trozo" del degradado global para que el degradado se vea continuo.
        const g = gradient
          ? textGradient(
              mix(gradient[0], gradient[1], i / Math.max(1, text.length - 1)),
              mix(gradient[0], gradient[1], (i + 1) / Math.max(1, text.length - 1)),
            )
          : {color};
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: t,
              filter: `blur(${(1 - t) * 14}px)`,
              transform: `translateX(${(1 - tIn) * 0.25 * size}px) translateX(${-tOut * 0.15 * size}px)`,
              ...g,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, Math.max(0, t))).toString(16).padStart(2, '0')).join('');
};

/** Texto tecleado con cursor I-beam fino (estilo editor). */
export const TypeLine: React.FC<{
  text: string;
  start: number;
  speed?: number;
  size?: number;
  weight?: number;
  color?: string;
  caret?: string;
  hideCaretAfter?: number;
  style?: React.CSSProperties;
}> = ({text, start, speed = 3, size = 40, weight = 400, color = P.ink, caret, hideCaretAfter, style}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - start) / speed)));
  const done = n >= text.length;
  const blink = !done || Math.floor(frame / 10) % 2 === 0;
  const showCaret = frame >= start - 6 && blink && (hideCaretAfter === undefined || frame < hideCaretAfter);
  return (
    <span style={{fontFamily: FONT_P, fontSize: size, fontWeight: weight, color, whiteSpace: 'pre', letterSpacing: '-0.02em', ...style}}>
      {text.slice(0, n)}
      <span
        style={{
          display: 'inline-block',
          width: 0,
          height: '0.86em',
          verticalAlign: '-0.1em',
          borderLeft: `${Math.max(2, Math.round(size * 0.035))}px solid ${caret ?? color}`,
          marginLeft: size * 0.04,
          marginRight: -Math.max(2, Math.round(size * 0.035)) - size * 0.04,
          opacity: showCaret ? 1 : 0,
        }}
      />
    </span>
  );
};

/** Cursor de mano (pointer) estilo macOS, con pulsación. */
export const HandCursor: React.FC<{x: number; y: number; press?: number; scale?: number; opacity?: number; dark?: boolean}> = ({
  x,
  y,
  press = 0,
  scale = 1,
  opacity = 1,
  dark,
}) => (
  <svg
    width={44 * scale}
    height={52 * scale}
    viewBox="0 0 22 26"
    style={{
      position: 'absolute',
      left: x - 8 * scale,
      top: y - 2 * scale,
      opacity,
      transform: `scale(${1 - press * 0.14})`,
      transformOrigin: '35% 10%',
      filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))',
      overflow: 'visible',
    }}
  >
    <path
      d="M7 1.5c1.1 0 2 .9 2 2V10l.6-.1c1-.2 2 .4 2.2 1.3l.1.3.4-.1c1-.2 2 .4 2.2 1.3l.1.3.4-.1c1.1-.2 2.1.5 2.3 1.5l.9 4.4c.4 2.1-.2 4.2-1.7 5.6l-.6.6H8.6l-4.9-6.2c-.7-.9-.6-2.2.3-2.9.8-.6 1.9-.6 2.6.1l.4.4V3.5c0-1.1.9-2 2-2z"
      fill={dark ? P.ink : '#ffffff'}
      stroke={dark ? '#ffffff' : P.ink}
      strokeWidth={1.1}
      strokeLinejoin="round"
    />
  </svg>
);

/** Barra de prompt de cristal (glass pill) con botón de enviar. */
export const PromptBar: React.FC<{
  text: string;
  width?: number;
  height?: number;
  press?: number;
  active?: number;
  tone?: 'dark' | 'light';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({text, width = 760, height = 92, press = 0, active = 0, tone = 'dark', style, children}) => {
  const dark = tone === 'dark';
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        borderRadius: height,
        background: dark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.7))',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: dark
          ? 'inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(255,255,255,0.1), 0 20px 60px rgba(3,10,53,0.35)'
          : 'inset 0 1.5px 0 #fff, 0 18px 50px rgba(40,70,140,0.18)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(30,60,140,0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${height * 0.18}px 0 ${height * 0.42}px`,
        boxSizing: 'border-box',
        fontFamily: FONT_P,
        ...style,
      }}
    >
      <span style={{flex: 1, fontSize: height * 0.3, color: dark ? 'rgba(255,255,255,0.85)' : P.inkSoft, letterSpacing: '-0.01em'}}>{text || children}</span>
      <div
        style={{
          width: height * 0.62,
          height: height * 0.62,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          transform: `scale(${1 - press * 0.15})`,
          background: active > 0 ? `linear-gradient(135deg, ${P.blueBright}, ${P.sky})` : dark ? 'rgba(255,255,255,0.25)' : P.ink,
          boxShadow: active > 0 ? `0 0 ${30 * active}px ${P.sky}` : undefined,
        }}
      >
        <svg width={height * 0.26} height={height * 0.26} viewBox="0 0 10 10">
          <path d="M5 8.5V1.8M2 4.6 5 1.6l3 3" fill="none" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

/** Botón píldora con resplandor que "respira" (It's live). */
export const GlowPill: React.FC<{text: string; start: number; x: number; y: number; size?: number}> = ({text, start, x, y, size = 64}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - start, fps, config: SPRING.smooth});
  const pulse = 0.5 + 0.5 * Math.sin((frame - start) / 9);
  const w = size * 5.2;
  const h = size * 1.9;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: h,
        display: 'grid',
        placeItems: 'center',
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        transform: `scale(${interpolate(p, [0, 1], [0.82, 1])})`,
        filter: `blur(${(1 - p) * 18}px)`,
        background: 'linear-gradient(180deg, #ffffff, #f1f6ff)',
        border: `${2 + pulse}px solid ${P.sky}`,
        boxShadow: `0 0 ${20 + pulse * 30}px ${P.sky}, 0 0 ${60 + pulse * 50}px ${P.sky}88, inset 0 0 ${18 + pulse * 10}px ${P.sky}aa`,
      }}
    >
      <span style={{fontFamily: FONT_P, fontSize: size, letterSpacing: '-0.03em', ...textGradient(P.inkSoft, P.blueBright)}}>{text}</span>
    </div>
  );
};

/**
 * Transición de MOSAICO DE PÍXELES: una rejilla de bloques que se "enciende" en orden
 * aleatorio. Útil como máscara SVG (devuelve la URL) y como capa de bloques de color.
 */
export const pixelMask = (progress: number, cols = 32, rows = 18, seed = 'px') => {
  const rects: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // sesgo diagonal + ruido: la revelación avanza en barrido con bordes "rotos"
      const order = (x / cols) * 0.55 + (y / rows) * 0.15 + random(`${seed}${x}-${y}`) * 0.3;
      if (order < progress) rects.push(`<rect x='${x}' y='${y}' width='1.02' height='1.02'/>`);
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' preserveAspectRatio='none'><g fill='white'>${rects.join('')}</g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

export const PixelBlocks: React.FC<{progress: number; cols?: number; rows?: number; colors?: string[]}> = ({
  progress,
  cols = 32,
  rows = 18,
  colors = [P.sky, P.blueBright, '#ffffff', P.lilac],
}) => {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const order = (x / cols) * 0.55 + (y / rows) * 0.15 + random(`px${x}-${y}`) * 0.3;
      const d = progress - order;
      // solo el "frente" del barrido muestra bloques de color
      if (d > 0 && d < 0.09) {
        cells.push(
          <div
            key={`${x}-${y}`}
            style={{
              position: 'absolute',
              left: `${(x / cols) * 100}%`,
              top: `${(y / rows) * 100}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              background: colors[Math.floor(random(`c${x}${y}`) * colors.length)],
              opacity: 1 - d / 0.09,
            }}
          />,
        );
      }
    }
  }
  return <AbsoluteFill style={{mixBlendMode: 'screen'}}>{cells}</AbsoluteFill>;
};
