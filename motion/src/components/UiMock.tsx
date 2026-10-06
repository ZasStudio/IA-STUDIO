import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, EASE, FONT} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Line: React.FC<{w: number | string; h?: number; c?: string; o?: number}> = ({w, h = 10, c = 'rgba(255,255,255,0.35)', o = 1}) => (
  <div style={{width: w, height: h, borderRadius: h, background: c, opacity: o}} />
);

/** Contenido de los paneles de dashboard (todo vectorial, sin imágenes). */
export const PanelContent: React.FC<{kind: 'welcome' | 'chart' | 'pie' | 'avatars' | 'list' | 'chips'; start: number}> = ({kind, start}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - start, [6, 40], [0, 1], {...clamp, easing: EASE.out});
  const pad: React.CSSProperties = {position: 'absolute', inset: 22, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT};
  if (kind === 'welcome')
    return (
      <div style={pad}>
        <div style={{color: C.cream, fontSize: 20, fontWeight: 600, lineHeight: 1.2}}>
          Hi,
          <br />
          Welcome back.
        </div>
        <Line w="70%" c={C.mint} o={0.6} />
        <Line w={`${30 + t * 55}%`} h={14} c={`linear-gradient(90deg, ${C.mint}, ${C.lime})`} />
        <Line w="50%" />
        <Line w={`${20 + t * 40}%`} h={14} c={`linear-gradient(90deg, ${C.teal}, ${C.mint})`} />
      </div>
    );
  if (kind === 'chart') {
    const d = 'M0 120 C 40 110, 60 70, 100 85 S 160 30, 200 60 S 260 10, 300 40 S 360 90, 420 70';
    return (
      <div style={pad}>
        <Line w="40%" c={C.cream} o={0.8} />
        <svg viewBox="0 0 420 140" style={{width: '100%', height: 150, overflow: 'visible'}}>
          <defs>
            <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.lime} stopOpacity={0.55} />
              <stop offset="100%" stopColor={C.lime} stopOpacity={0} />
            </linearGradient>
            <clipPath id="chart-clip">
              <rect x={0} y={-20} width={420 * t} height={200} />
            </clipPath>
          </defs>
          <g clipPath="url(#chart-clip)">
            <path d={`${d} L420 140 L0 140 Z`} fill="url(#chart-area)" />
            <path d={d} fill="none" stroke={C.lime} strokeWidth={4} style={{filter: `drop-shadow(0 0 6px ${C.lime})`}} />
          </g>
          <rect x={250} y={-10} width={60} height={26} rx={6} fill={C.lime} opacity={t} />
        </svg>
        <div style={{display: 'flex', gap: 10}}>
          <Line w={`${40 * t + 20}%`} h={12} c={`linear-gradient(90deg, ${C.mint}, ${C.lime})`} />
        </div>
      </div>
    );
  }
  if (kind === 'pie')
    return (
      <div style={{...pad, alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: `conic-gradient(${C.lime} 0 ${t * 62}%, ${C.cream} ${t * 62}% ${t * 62 + 0.5}%, rgba(255,255,255,0.18) 0)`,
            boxShadow: `0 0 30px ${C.lime}55`,
            WebkitMask: 'radial-gradient(circle, transparent 0 0, #000 0)',
          }}
        />
      </div>
    );
  if (kind === 'avatars')
    return (
      <div style={{...pad, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around'}}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${C.cream}, ${C.mintSoft})`,
              transform: `scale(${interpolate(frame - start - 8 - i * 3, [0, 8], [0, 1], {...clamp, easing: EASE.out})})`,
              boxShadow: `0 0 16px ${C.mint}88`,
            }}
          />
        ))}
      </div>
    );
  if (kind === 'list')
    return (
      <div style={pad}>
        {[0.9, 0.6, 0.75, 0.4].map((w, i) => (
          <div key={i} style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <div style={{width: 22, height: 22, borderRadius: 7, background: i === 1 ? C.lime : 'rgba(255,255,255,0.25)'}} />
            <Line w={`${w * 100 * Math.min(1, t * 1.4)}%`} />
          </div>
        ))}
      </div>
    );
  return (
    <div style={{...pad, flexDirection: 'row', flexWrap: 'wrap'}}>
      {[C.mint, C.lime, C.teal, C.mintSoft].map((c, i) => (
        <div key={i} style={{width: 70, height: 36, borderRadius: 10, background: c, opacity: 0.85}} />
      ))}
    </div>
  );
};

/** Tarjeta de clima "Hello, Lucy" del video. */
export const WeatherCard: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      width: 360,
      height: 190,
      borderRadius: 22,
      background: `linear-gradient(120deg, ${C.teal} 0%, ${C.mint} 45%, ${C.lime} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,.35), inset 0 1.5px 0 rgba(255,255,255,.5)`,
      fontFamily: FONT,
      color: C.inkDeep,
      padding: 26,
      ...style,
    }}
  >
    <div style={{fontWeight: 800, fontSize: 26}}>Hello, Lucy</div>
    <div style={{fontWeight: 700, fontSize: 34, marginTop: 28}}>26° C</div>
    <div style={{fontWeight: 600, fontSize: 20, opacity: 0.8}}>Rainy all day</div>
    <svg viewBox="0 0 100 60" width={120} style={{position: 'absolute', right: 20, top: 24}}>
      <path d="M25 50 a18 18 0 1 1 8 -34 a22 22 0 0 1 42 6 a14 14 0 1 1 2 28 Z" fill={C.cream} />
    </svg>
  </div>
);

/**
 * "Foto" generada por código (estación de trabajo con monitor, lámparas y persona en primer plano).
 * Sirve de marcador hasta que pongas tu propia foto en public/ y la pases por props.
 */
export const PhotoPlaceholder: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#3c4a48 0%, #59675f 50%, #2b2420 100%)', overflow: 'hidden'}}>
      {/* lámparas (bokeh) */}
      {[
        [520, 40, 90],
        [1380, 30, 110],
        [1760, 70, 70],
      ].map(([x, y, r], i) => (
        <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'radial-gradient(circle, #fff7d6, #ffd98a55 45%, transparent 70%)'}} />
      ))}
      {/* pared con paneles */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 160, height: 560, background: 'linear-gradient(90deg,#4e6461,#6d817b 60%,#4b5f5c)'}} />
      {/* monitor */}
      <div style={{position: 'absolute', left: 560, top: 150, width: 1120, height: 600, borderRadius: 26, background: '#1d2423', padding: 22, boxShadow: '0 40px 80px rgba(0,0,0,.5)'}}>
        <div style={{position: 'absolute', inset: 22, borderRadius: 14, background: 'linear-gradient(135deg,#dfe8e4,#b9cbc6)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #6b7d78 2px, transparent 2.5px)', backgroundSize: '34px 34px', opacity: 0.6}} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{position: 'absolute', left: 120 + i * 230, top: 70 + (i % 2) * 30, width: 150, height: 300, borderRadius: 18, background: '#f5f8f6', boxShadow: '0 6px 18px rgba(0,0,0,.18)'}}>
              <div style={{margin: 16, height: 40, borderRadius: 8, background: i % 2 ? '#f0c64a' : '#56b8d8'}} />
              <div style={{margin: 16, height: 70, borderRadius: 8, background: i % 2 ? '#56b8d8' : '#9fd1a8'}} />
              <div style={{margin: 16, height: 14, width: 80, borderRadius: 8, background: '#a7b6b2'}} />
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 1080, top: 750, width: 80, height: 120, background: '#151a19'}} />
      {/* escritorio */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, bottom: 0, background: 'linear-gradient(180deg,#2a2622,#151210)'}} />
      {/* persona en primer plano (silueta) */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 300 + Math.sin(frame / 25) * 4,
          width: 520,
          height: 900,
          filter: 'blur(3px)',
        }}
      >
        <div style={{position: 'absolute', left: 140, top: 0, width: 240, height: 280, borderRadius: '50%', background: 'radial-gradient(circle at 60% 40%, #3a2a22, #120c0a)'}} />
        <div style={{position: 'absolute', left: 0, top: 230, width: 520, height: 700, borderRadius: '45% 45% 0 0', background: 'linear-gradient(160deg,#c48a2a,#7a5216 70%)'}} />
      </div>
      <div style={{position: 'absolute', left: 1300, top: 820, width: 60, height: 200, borderRadius: 30, background: '#c0413a', transform: 'rotate(18deg)'}} />
    </div>
  );
};
