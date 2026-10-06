import React from 'react';
import {interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, FONT, SPRING, textGlow} from '../theme';

export type RevealMode = 'smear' | 'blurUp' | 'pop' | 'scramble' | 'type' | 'none';

export type Segment = {
  text: string;
  start: number;
  mode?: RevealMode;
  weight?: number;
  color?: string;
  size?: number;
  glow?: boolean;
  /** Frame en que la palabra sale (desenfoque + subida) */
  exit?: number;
  /** Envoltura opcional: caja de selección, barrido de resaltado, etc. */
  wrap?: (node: React.ReactNode) => React.ReactNode;
  /** Letras (índices) que se pintan en lima y negrita, como la "s" de "Question" */
  accent?: number[];
  /** Fuerza salto de línea antes del segmento */
  br?: boolean;
  indent?: number;
  /** Velocidad de "máquina de escribir" (frames por letra) */
  speed?: number;
};

const SCRAMBLE = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz#%&*+=<>/\\';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const exitStyle = (frame: number, exit?: number): React.CSSProperties => {
  if (exit === undefined || frame < exit) return {};
  const t = interpolate(frame, [exit, exit + 10], [0, 1], {...clamp, easing: EASE.in});
  return {opacity: 1 - t, filter: `blur(${t * 14}px)`, transform: `translateY(${-t * 24}px) scaleX(${1 + t * 0.3})`};
};

const SegmentView: React.FC<{seg: Segment; baseSize: number}> = ({seg, baseSize}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const size = seg.size ?? baseSize;
  const weight = seg.weight ?? 400;
  const color = seg.color ?? C.cream;
  const mode = seg.mode ?? 'smear';
  const local = frame - seg.start;
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: FONT,
    fontSize: size,
    fontWeight: weight,
    color,
    whiteSpace: 'pre',
    letterSpacing: size > 100 ? '-0.03em' : size > 60 ? '-0.015em' : '0em',
    textShadow: seg.glow ? textGlow(color) : undefined,
    lineHeight: 1.05,
  };

  let node: React.ReactNode;

  if (mode === 'none') {
    node = <span style={base}>{seg.text}</span>;
  } else if (mode === 'smear') {
    // La palabra entra "gorda", estirada y desenfocada, y se asienta en su peso final.
    const p = spring({frame: local, fps, config: SPRING.snappy});
    node = (
      <span
        style={{
          ...base,
          opacity: interpolate(local, [0, 3], [0, 1], clamp),
          fontWeight: interpolate(p, [0, 1], [860, weight]),
          transform: `scaleX(${interpolate(p, [0, 1], [1.55, 1])}) scaleY(${interpolate(p, [0, 1], [0.8, 1])})`,
          transformOrigin: 'left center',
          filter: `blur(${interpolate(p, [0, 0.7], [7, 0], clamp)}px)`,
        }}
      >
        {seg.text}
      </span>
    );
  } else if (mode === 'blurUp') {
    const p = spring({frame: local, fps, config: SPRING.smooth});
    node = (
      <span
        style={{
          ...base,
          opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
          transform: `translateY(${(1 - p) * 40}px)`,
          filter: `blur(${(1 - p) * 16}px)`,
        }}
      >
        {seg.text}
      </span>
    );
  } else if (mode === 'pop') {
    // Cada letra nace con tamaño, peso y giro distintos y rebota hasta su sitio.
    node = (
      <span style={{...base, display: 'inline-flex', alignItems: 'baseline'}}>
        {[...seg.text].map((ch, i) => {
          const d = local - i * 2;
          const p = spring({frame: d, fps, config: SPRING.pop});
          const r = (k: string) => random(`${seg.text}-${i}-${k}`);
          const s0 = 0.25 + r('s') * 2.2;
          const accent = seg.accent?.includes(i);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                opacity: interpolate(d, [0, 2], [0, 1], clamp),
                transform: `translateY(${(1 - p) * (r('y') * 120 - 60)}px) rotate(${(1 - p) * (r('r') * 60 - 30)}deg) scale(${interpolate(p, [0, 1], [s0, 1])})`,
                fontWeight: accent ? 800 : interpolate(p, [0, 1], [300 + r('w') * 550, weight], clamp),
                color: accent ? C.lime : undefined,
                transformOrigin: '50% 80%',
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  } else if (mode === 'scramble') {
    node = (
      <span style={{...base}}>
        {[...seg.text].map((ch, i) => {
          const showAt = i * 1.5;
          const lockAt = 5 + i * 2.5;
          if (local < showAt) return <span key={i} style={{opacity: 0}}>{ch}</span>;
          if (local < lockAt && ch !== ' ') {
            const g = SCRAMBLE[Math.floor(random(`${seg.text}${i}${Math.floor(frame / 2)}`) * SCRAMBLE.length)];
            return (
              <span key={i} style={{opacity: 0.55, color: C.mintSoft, display: 'inline-block', width: '0.62em', textAlign: 'center'}}>
                {g}
              </span>
            );
          }
          return <span key={i}>{ch}</span>;
        })}
      </span>
    );
  } else {
    // type: máquina de escribir con cursor de bloque
    const speed = seg.speed ?? 2;
    const n = Math.max(0, Math.min(seg.text.length, Math.floor(local / speed)));
    const typing = local >= 0 && n < seg.text.length;
    const blink = Math.floor(frame / 8) % 2 === 0;
    node = (
      <span style={{...base, opacity: local < 0 ? 0 : 1}}>
        {seg.text.slice(0, n)}
        {local >= 0 && (typing || (blink && local < seg.text.length * speed + 4)) && (
          <span style={{position: 'relative', display: 'inline-block', width: 0, height: '1em'}}>
            <span
              style={{
                position: 'absolute',
                left: '0.04em',
                top: '0.2em',
                width: '0.6em',
                height: '0.7em',
                background: color,
              }}
            />
          </span>
        )}
        <span style={{opacity: 0}}>{seg.text.slice(n)}</span>
      </span>
    );
  }

  const wrapped = seg.wrap ? seg.wrap(node) : node;
  return <span style={{display: 'inline-block', ...exitStyle(frame, seg.exit)}}>{wrapped}</span>;
};

/**
 * Bloque de texto cinético: lista de segmentos (palabras) con su propio modo de entrada,
 * peso y color. Soporta saltos de línea e indentación.
 */
export const KineticText: React.FC<{
  segments: Segment[];
  size?: number;
  x: number;
  y: number;
  gap?: number;
  lineGap?: number;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}> = ({segments, size = 64, x, y, gap = 0.28, lineGap = 0.12, align = 'left', style}) => {
  const {width} = useVideoConfig();
  const lines: Segment[][] = [[]];
  segments.forEach((s) => {
    if (s.br && lines[lines.length - 1].length) lines.push([]);
    lines[lines.length - 1].push(s);
  });
  return (
    <div
      style={{
        position: 'absolute',
        ...(align === 'right' ? {right: width - x} : {left: x}),
        top: y,
        transform: align === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        gap: size * lineGap,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', alignItems: 'baseline', gap: size * gap, paddingLeft: (line[0]?.indent ?? 0) * size}}>
          {line.map((seg, si) => (
            <SegmentView key={si} seg={seg} baseSize={size} />
          ))}
        </div>
      ))}
    </div>
  );
};
