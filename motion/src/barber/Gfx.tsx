import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE} from '../theme';
import {FONTS} from './Editorial';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Imagen fija con Ken Burns (zoom + paneo) y etalonaje por plano. */
export const Still: React.FC<{src: string; dur: number; from?: number; to?: number; ox?: string; pan?: [number, number]; tone?: 'color' | 'sepia' | 'bw' | 'warm'}> = ({
  src,
  dur,
  from = 1.04,
  to = 1.16,
  ox = '50% 40%',
  pan = [0, 0],
  tone = 'color',
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: EASE.out});
  const filter = {color: 'contrast(1.06) saturate(1.05)', sepia: 'sepia(.55) contrast(1.1)', bw: 'grayscale(1) contrast(1.15)', warm: 'sepia(.25) saturate(1.1) contrast(1.06)'}[tone];
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <Img src={staticFile(`barber/${src}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transformOrigin: ox, transform: `translate(${pan[0] * t}px, ${pan[1] * t}px) scale(${from + (to - from) * t})`, filter}} />
    </AbsoluteFill>
  );
};

/** Clip de video limpio, con un push-in suave opcional. */
export const Clip: React.FC<{src: string; startFrom?: number; dur: number; zoom?: [number, number]; ox?: string; filter?: string}> = ({src, startFrom = 0, dur, zoom = [1, 1.05], ox = '50% 45%', filter}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, dur], zoom, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={staticFile(`barber/${src}`)} startFrom={startFrom} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, transformOrigin: ox, filter}} />
    </AbsoluteFill>
  );
};

/** Humo gris-azulado (capas de nubes con ruido), fondo de las escenas "de época". */
export const SmokeBg: React.FC<{base?: string; tint?: string}> = ({base = '#59626d', tint = '#e6ecf2'}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${base}, #262b31 85%)`, overflow: 'hidden'}}>
      {Array.from({length: 10}, (_, i) => {
        const r = 360 + random(`r${i}`) * 520;
        const x = random(`x${i}`) * 1080 + Math.sin(frame / 60 + i) * 120 + frame * (random(`v${i}`) - 0.5) * 2;
        const y = random(`y${i}`) * 1920 - frame * (0.6 + random(`u${i}`));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${tint}66, ${tint}22 45%, transparent 70%)`,
              filter: 'blur(34px)',
              opacity: 0.6 + 0.3 * Math.sin(frame / 40 + i * 2),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Etiqueta de papel rasgado (como "Siglo XIX" del original), entra con golpe y leve giro. */
export const PaperTag: React.FC<{text: string; at: number; x: number; y: number; rot?: number; size?: number; color?: string}> = ({text, at, x, y, rot = -3, size = 92, color = '#141414'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 260, mass: 0.7}});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + (1 - s) * 8}deg) scale(${1.5 - 0.5 * s})`,
        opacity: Math.min(1, s * 2),
        padding: '16px 40px 22px',
        background: 'linear-gradient(180deg,#f7f4ec,#e9e3d6)',
        clipPath: 'polygon(2% 8%, 12% 0, 30% 6%, 51% 1%, 70% 7%, 88% 0, 99% 9%, 97% 52%, 100% 93%, 82% 100%, 60% 94%, 40% 100%, 18% 95%, 0 100%, 3% 50%)',
        fontFamily: FONTS.serif,
        fontWeight: 700,
        fontSize: size,
        color,
        lineHeight: 1,
        boxShadow: '0 14px 30px rgba(0,0,0,.4)',
      }}
    >
      {text}
    </div>
  );
};

/** Año que rueda con desenfoque de movimiento (Playfair, brillo azul). */
export const RollingYear: React.FC<{from: number; to: number; at: number; dur: number; x?: number; y: number; size?: number; color?: string}> = ({from, to, at, dur, x = 540, y, size = 220, color = '#4aa8ff'}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const val = (fr: number) => interpolate(fr, [at, at + dur], [from, to], {...clamp, easing: EASE.inOut});
  const v = val(frame);
  const speed = Math.abs(v - val(frame - 1));
  const appear = interpolate(frame - at, [0, 6], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * appear})`,
        opacity: appear,
        fontFamily: FONTS.serif,
        fontSize: size,
        color,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 18px ${color}, 0 0 50px ${color}99`,
        filter: `blur(${Math.min(7, speed * 0.7)}px)`,
      }}
    >
      {Math.round(v)}
    </div>
  );
};

/** Estrella de la vida dibujada: brazos que crecen escalonados + vara con serpiente. */
export const StarOfLife: React.FC<{at: number; size?: number; x?: number; y?: number}> = ({at, size = 520, x = 540, y = 1080}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rot = interpolate(frame - at, [0, 120], [-20, 0], {...clamp, easing: EASE.out});
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible', filter: 'drop-shadow(0 0 22px rgba(60,140,255,.55))'}}>
      <g transform={`rotate(${rot})`}>
        {[0, 60, 120].map((a, i) => {
          const s = spring({frame: frame - at - i * 4, fps, config: {damping: 14, stiffness: 180}});
          return (
            <rect key={a} x={-17} y={-88 * s} width={34} height={176 * s} rx={6} fill="#2f74d6" stroke="#ffffff" strokeWidth={4} transform={`rotate(${a})`} />
          );
        })}
      </g>
      <line x1={0} y1={-62} x2={0} y2={62} stroke="#fff" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${interpolate(frame - at, [10, 30], [0, 1], clamp)} 1`} />
      <path d="M -10 -46 C 14 -36, 14 -22, 0 -14 C -14 -6, -14 8, 0 16 C 14 24, 14 38, -4 48" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${interpolate(frame - at, [18, 44], [0, 1], clamp)} 1`} />
    </svg>
  );
};

/** Insignia con guante (higiene/bioseguridad). */
export const GloveBadge: React.FC<{at: number; x?: number; y?: number; size?: number}> = ({at, x = 540, y = 1100, size = 300}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 200}});
  if (frame < at) return null;
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${s})`, overflow: 'visible', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.4))'}}>
      <circle r={92} fill="#2f74d6" stroke="#cfe3ff" strokeWidth={5} />
      <g fill="#e8f2ff" transform="translate(0,6)">
        <rect x={-34} y={-20} width={62} height={70} rx={20} />
        {[-30, -14, 2, 18].map((fx, i) => (
          <rect key={i} x={fx} y={-62 + (i === 0 || i === 3 ? 10 : 0)} width={14} height={56} rx={7} />
        ))}
        <rect x={-58} y={-8} width={14} height={46} rx={7} transform="rotate(-35 -51 15)" />
        <rect x={-30} y={46} width={54} height={18} rx={4} fill="#9fc6ff" />
      </g>
    </svg>
  );
};

/** Visto bueno dibujado (para "reutilizable"). */
export const Check: React.FC<{at: number; x: number; y: number; size?: number}> = ({at, x, y, size = 110}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 10], [0, 1], {...clamp, easing: EASE.out});
  if (frame < at) return null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, filter: 'drop-shadow(0 0 12px #ff2b3c)'}}>
      <rect x={10} y={14} width={76} height={76} rx={14} fill="none" stroke="#1c1c1c" strokeWidth={7} opacity={p} />
      <path d="M 22 50 L 42 70 L 92 12" fill="none" stroke="#ff2b3c" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
    </svg>
  );
};

/** Pulso de alarma: viñeta roja que late dos veces. */
export const AlarmPulse: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < 0 || d > 40) return null;
  const o = Math.max(0, Math.sin((d / 20) * Math.PI)) * 0.55;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(255,30,40,${o}) 100%)`, mixBlendMode: 'screen'}} />;
};

/** Efecto "rebobinar" (VHS): bandas, separación RGB, temblor y ◀◀. */
export const Rewind: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const shake = (random(`rw${frame}`) - 0.5) * 14;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${shake}px)`, filter: 'drop-shadow(5px 0 0 rgba(255,0,60,.55)) drop-shadow(-5px 0 0 rgba(0,220,255,.55)) contrast(1.15) saturate(1.2)'}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 2px, transparent 2px 5px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: ((frame * 37) % 1920) - 80, height: 80, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.22), transparent)', filter: 'blur(4px)'}} />
      <div style={{position: 'absolute', left: 70, top: 250, fontFamily: 'monospace', fontWeight: 700, fontSize: 56, color: '#fff', textShadow: '3px 0 #ff2b3c, -3px 0 #2fe0ff', opacity: Math.floor(frame / 8) % 2 ? 1 : 0.5}}>◀◀ REW</div>
    </AbsoluteFill>
  );
};

/** Texto gigante relleno de VIDEO (el video se ve solo dentro de las letras). */
export const VideoFillText: React.FC<{src: string; startFrom: number; lines: {text: string; at: number; size: number}[]}> = ({src, startFrom, lines}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#f4f5f7'}}>
      <OffthreadVideo src={staticFile(`barber/${src}`)} startFrom={startFrom} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.25)'}} />
      {/* capa blanca con texto negro en modo "screen": blanco tapa, negro deja ver el video */}
      <AbsoluteFill style={{background: '#ffffff', mixBlendMode: 'screen', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 70}}>
        {lines.map((l, i) => {
          const p = interpolate(frame - l.at, [0, 5], [0, 1], {...clamp, easing: EASE.out});
          return (
            <div key={i} style={{fontFamily: FONTS.cond, textTransform: 'uppercase', fontSize: l.size, lineHeight: 0.84, color: '#000', opacity: p, transform: `scale(${1.25 - 0.25 * p})`, letterSpacing: '-0.01em'}}>
              {l.text}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Cielo estrellado para tapar la zona superior del plano de la Tierra (donde había texto). */
export const StarCover: React.FC<{until?: number}> = ({until = 0.67}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{WebkitMaskImage: `linear-gradient(180deg, #000 0%, #000 ${until * 100 - 5}%, transparent ${until * 100}%)`, maskImage: `linear-gradient(180deg, #000 0%, #000 ${until * 100 - 5}%, transparent ${until * 100}%)`}}>
      <AbsoluteFill style={{background: '#020308'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 160}, (_, i) => (
          <circle key={i} cx={random(`sx${i}`) * 1080} cy={random(`sy${i}`) * 1250} r={random(`sr${i}`) * 1.7 + 0.3} fill="#fff" opacity={0.25 + 0.6 * Math.abs(Math.sin(frame / 25 + i))} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
