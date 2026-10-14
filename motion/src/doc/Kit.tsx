import React, {useId} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {EASE} from '../theme';
import {F} from './Captions';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ============================== ACABADO "DOCUMENTAL" ============================== */

/** Grano + viñeta + etalonaje. `tone`: color, sepia o blanco y negro (fotos de archivo). */
export const Grade: React.FC<{tone?: 'color' | 'sepia' | 'bw'; vignette?: number; children: React.ReactNode}> = ({tone = 'color', vignette = 0.55, children}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 40;
  const filter = tone === 'sepia' ? 'sepia(0.75) contrast(1.08) saturate(0.85)' : tone === 'bw' ? 'grayscale(1) contrast(1.15)' : 'contrast(1.05) saturate(1.05)';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 65% at 50% 45%, transparent 45%, rgba(0,0,0,${vignette}) 100%)`}} />
      <AbsoluteFill style={{opacity: 0.12, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id={`dg${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#dg${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Push-in lento (Ken Burns) para cada plano de B-roll: la imagen nunca está quieta. */
export const PushIn: React.FC<{from?: number; to?: number; dur: number; ox?: string; children: React.ReactNode}> = ({from = 1.0, to = 1.12, dur, ox = '50% 45%', children}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, dur], [from, to], {...clamp, easing: EASE.out});
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: ox}}>{children}</AbsoluteFill>;
};

/** Destello blanco (transición/acento) centrado en `at`. */
export const Flash: React.FC<{at: number; len?: number; color?: string}> = ({at, len = 8, color = '#ffffff'}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 2, at, at + len], [0, 1, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{background: color, opacity: o}} /> : null;
};

/* ============================== HUMO ============================== */

/** Humo volumétrico: capas de nubes difusas que derivan y respiran con ruido. */
export const Smoke: React.FC<{color?: string; base?: string; density?: number}> = ({color = '#dfe6ee', base = '#6e7884', density = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${base}, #3f4752)`, overflow: 'hidden'}}>
      {Array.from({length: Math.round(9 * density)}, (_, i) => {
        const x = random(`sx${i}`) * 1080 + noise2D(`sx${i}`, frame * 0.005, 0) * 260 + frame * (random(`v${i}`) - 0.5) * 1.6;
        const y = random(`sy${i}`) * 1920 + noise2D(`sy${i}`, 0, frame * 0.005) * 200 - frame * 0.6;
        const r = 380 + random(`sr${i}`) * 520;
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
              background: `radial-gradient(circle, ${color}88 0%, ${color}33 40%, transparent 70%)`,
              filter: 'blur(30px)',
              opacity: 0.55 + noise2D(`so${i}`, frame * 0.01, 2) * 0.3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ============================== PRESENTADOR (marcador de posición) ============================== */

/**
 * Plano de presentador en la barbería, dibujado en código. Sustitúyelo por tu video
 * (prop `presenter` en DocReel). `zoom` y `cy` simulan los jump-cuts con cambio de plano.
 */
export const PresenterPlate: React.FC<{zoom?: number; cy?: number}> = ({zoom = 1, cy = 0.5}) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame / 22) * 4;
  return (
    <AbsoluteFill style={{background: '#1a2029', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `50% ${cy * 100}%`}}>
        {/* fondo desenfocado: pared, estanterías, neón y luces de techo */}
        <AbsoluteFill style={{filter: 'blur(7px)'}}>
          <AbsoluteFill style={{background: 'linear-gradient(180deg,#3a4452 0%,#2a323d 45%,#1b2028 100%)'}} />
          {[180, 420, 660, 900].map((x) => (
            <div key={x} style={{position: 'absolute', left: x - 34, top: 120, width: 68, height: 68, borderRadius: '50%', background: 'radial-gradient(circle,#ffffff,#cfe3ff88 45%,transparent 70%)'}} />
          ))}
          <div style={{position: 'absolute', left: 60, top: 1000, fontFamily: F.cond, fontSize: 150, color: '#7cc4ff', textShadow: '0 0 30px #3a9bff, 0 0 70px #3a9bff', letterSpacing: '0.02em'}}>BARBER</div>
          {Array.from({length: 4}, (_, r) => (
            <div key={r} style={{position: 'absolute', left: 560, top: 560 + r * 120, width: 480, height: 10, background: '#11151b'}}>
              {Array.from({length: 7}, (_, c) => (
                <div
                  key={c}
                  style={{
                    position: 'absolute',
                    left: 14 + c * 66,
                    bottom: 10,
                    width: 40,
                    height: 60 + random(`b${r}${c}`) * 40,
                    borderRadius: 6,
                    background: ['#e85bd0', '#f2f2f2', '#2d2d2d', '#5fb0ff', '#d9d9d9'][Math.floor(random(`c${r}${c}`) * 5)],
                  }}
                />
              ))}
            </div>
          ))}
        </AbsoluteFill>
        {/* sillón */}
        <div style={{position: 'absolute', left: 170, top: 1180, width: 740, height: 760, borderRadius: '120px 120px 30px 30px', background: 'linear-gradient(180deg,#141414,#050505)'}} />
        {/* silueta con luz de contorno (pelo largo, cabeza, hombros) */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 640 + breathe, height: 1300}}>
          <div style={{position: 'absolute', left: 540 - 205, top: -30, width: 410, height: 760, borderRadius: '200px 200px 120px 120px', background: 'linear-gradient(180deg,#141010,#0a0808)', boxShadow: '-10px 0 30px rgba(140,190,255,.25)'}} />
          <div style={{position: 'absolute', left: 540 - 135, top: 30, width: 270, height: 340, borderRadius: '46% 46% 44% 44%', background: 'radial-gradient(ellipse at 45% 38%, #a07a62, #5e4232 55%, #2b1d16)', boxShadow: '-5px 0 18px rgba(170,210,255,.35)'}} />
          <div style={{position: 'absolute', left: 540 - 340, top: 430, width: 680, height: 900, borderRadius: '280px 280px 40px 40px', background: 'linear-gradient(180deg,#151515,#070707)', boxShadow: 'inset 10px 0 24px rgba(160,200,255,.2)'}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============================== PAPEL RASGADO Y PEGATINAS ============================== */

const tornPath = (seed: string, w: number, h: number, jag = 10, step = 16) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += step) pts.push(`${x},${(random(`${seed}${x}`) * jag).toFixed(1)}`);
  return `M0,${h} L0,${jag} L${pts.join(' L')} L${w},${h} Z`;
};

/** Capa de papel con borde superior rasgado (las capas se apilan como un collage). */
export const TornLayer: React.FC<{top: number; color: string; seed: string; texture?: boolean; enter?: number}> = ({top, color, seed, texture, enter = 0}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - enter, [0, 14], [1, 0], {...clamp, easing: EASE.out});
  return (
    <svg viewBox={`0 0 1080 ${1920 - top}`} style={{position: 'absolute', left: 0, top: top + t * 500, width: 1080, height: 1920 - top, filter: 'drop-shadow(0 -6px 10px rgba(0,0,0,.25))'}}>
      <defs>
        <filter id={`tx${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <path d={tornPath(seed, 1080, 1920 - top)} fill={color} />
      {texture && <path d={tornPath(seed, 1080, 1920 - top)} fill={color} filter={`url(#tx${seed})`} />}
    </svg>
  );
};

/** Etiqueta de papel pegada (fondo blanco, bordes rasgados, levemente girada). */
export const PaperLabel: React.FC<{text: string; at: number; x: number; y: number; rot?: number; size?: number; color?: string}> = ({text, at, x, y, rot = -3, size = 70, color = '#d22630'}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 6], [0, 1], {...clamp, easing: EASE.out});
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.4 - 0.4 * p})`,
        opacity: p,
        padding: '14px 34px 18px',
        background: '#f4f1ea',
        clipPath: 'polygon(2% 8%, 12% 0, 30% 6%, 51% 1%, 70% 7%, 88% 0, 99% 9%, 97% 52%, 100% 93%, 82% 100%, 60% 94%, 40% 100%, 18% 95%, 0 100%, 3% 50%)',
        fontFamily: F.serif,
        fontSize: size,
        color,
        lineHeight: 1,
        boxShadow: '0 10px 24px rgba(0,0,0,.35)',
      }}
    >
      {text}
    </div>
  );
};

/** Recorte tipo pegatina: borde blanco grueso + sombra (para siluetas, fotos de archivo, objetos). */
export const Sticker: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{filter: 'drop-shadow(0 0 0 #fff) drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 18px 22px rgba(0,0,0,.45))', ...style}}>
    {children}
  </div>
);

/* ============================== SILUETAS DE ÉPOCA ============================== */

export const Figure: React.FC<{kind: 'tophat' | 'suit' | 'worker'; h: number; color?: string}> = ({kind, h, color = '#1d1a18'}) => (
  <svg viewBox="0 0 200 520" height={h} style={{overflow: 'visible'}}>
    <g fill={color}>
      {kind === 'tophat' && (
        <>
          <rect x={70} y={0} width={60} height={62} rx={4} />
          <rect x={52} y={58} width={96} height={10} rx={5} />
        </>
      )}
      {kind === 'worker' && <path d="M58 46 Q100 10 142 46 L150 58 L50 58 Z" />}
      <ellipse cx={100} cy={96} rx={32} ry={38} />
      <path d="M60 140 Q100 122 140 140 L172 300 L150 302 L146 520 L108 520 L100 330 L92 520 L54 520 L50 302 L28 300 Z" />
      {kind !== 'worker' && <path d="M92 140 L100 190 L108 140 Z" fill="#a0182a" />}
    </g>
  </svg>
);

/** Flecha punteada curva que se "dibuja" hasta una etiqueta (anotación). */
export const DottedArrow: React.FC<{d: string; at: number; dur?: number; color?: string}> = ({d, at, dur = 14, color = '#1a1a1a'}) => {
  const frame = useCurrentFrame();
  const id = 'da' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = interpolate(frame - at, [0, dur], [0, 1], {...clamp, easing: EASE.inOut});
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: 1080, height: 1920, overflow: 'visible'}}>
      <defs>
        <mask id={id}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={14} pathLength={1} strokeDasharray={`${p} 1`} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round" mask={`url(#${id})`} />
    </svg>
  );
};

/* ============================== OBJETOS ============================== */

/** Móvil con dedo que toca la pantalla; `taps` = frames de cada toque (cambia el contenido). */
export const PhoneTap: React.FC<{screens: React.ReactNode[]; taps: number[]; enter?: number}> = ({screens, taps, enter = 0}) => {
  const frame = useCurrentFrame();
  const ein = interpolate(frame - enter, [0, 12], [0, 1], {...clamp, easing: EASE.out});
  const idx = taps.filter((t) => frame >= t).length;
  const lastTap = taps[idx - 1] ?? -99;
  const tapD = frame - lastTap;
  const press = tapD >= -2 && tapD <= 3 ? 1 - Math.abs(tapD) / 3 : 0;
  // el dedo entra antes de cada toque y se retira después
  const nextTap = taps.find((t) => t >= frame - 3) ?? taps[taps.length - 1];
  const near = interpolate(Math.abs(frame - nextTap), [0, 10], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 540 - 270, top: 470 + (1 - ein) * 700, width: 540, height: 1100, opacity: ein}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 78, background: 'linear-gradient(135deg,#3a3d44,#15161a)', boxShadow: '0 40px 80px rgba(0,0,0,.55), inset 0 0 0 3px #555a63'}} />
      <div style={{position: 'absolute', inset: 18, borderRadius: 62, overflow: 'hidden', background: '#000', transform: `scale(${1 - press * 0.012})`}}>
        {screens[Math.min(idx, screens.length - 1)]}
        <AbsoluteFill style={{background: '#fff', opacity: interpolate(tapD, [0, 5], [0.5, 0], clamp)}} />
      </div>
      <div style={{position: 'absolute', left: 270 - 70, top: 34, width: 140, height: 36, borderRadius: 18, background: '#000'}} />
      {/* dedo */}
      <svg
        viewBox="0 0 120 300"
        style={{
          position: 'absolute',
          left: 330 + (1 - near) * 260,
          top: 640 + (1 - near) * 320 - press * 14,
          width: 210,
          transform: 'rotate(-28deg)',
          filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.35))',
        }}
      >
        <path d="M40 300 L40 70 Q40 30 62 30 Q84 30 84 70 L84 150 Q110 150 112 180 L118 300 Z" fill="#e9b9a3" />
        <path d="M48 70 Q50 44 62 42 Q76 44 76 70 L76 92 Q62 98 48 92 Z" fill="#f6d6c8" />
      </svg>
    </div>
  );
};

/** Pantalla de microscopio: virus y glóbulos rojos flotando. */
export const Microbes: React.FC<{count?: number}> = ({count = 14}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, #0d3d63, #041526 70%)'}}>
      <svg viewBox="0 0 500 1060" style={{width: '100%', height: '100%'}}>
        {Array.from({length: count}, (_, i) => {
          const x = random(`mx${i}`) * 500 + noise2D(`mx${i}`, frame * 0.01, 0) * 30;
          const y = random(`my${i}`) * 1060 + noise2D(`my${i}`, 0, frame * 0.01) * 30;
          const virus = i % 3 === 0;
          const r = virus ? 30 + random(`mr${i}`) * 40 : 16 + random(`mr${i}`) * 10;
          if (!virus)
            return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#e3242b" opacity={0.9} transform={`rotate(${random(`ro${i}`) * 180 + frame} ${x} ${y})`} />;
          return (
            <g key={i} transform={`rotate(${frame * 0.6 + i * 20} ${x} ${y})`} style={{filter: 'drop-shadow(0 0 8px #38d6ff)'}}>
              {Array.from({length: 14}, (_, k) => {
                const a = (k / 14) * Math.PI * 2;
                return (
                  <g key={k}>
                    <line x1={x + Math.cos(a) * r} y1={y + Math.sin(a) * r} x2={x + Math.cos(a) * r * 1.35} y2={y + Math.sin(a) * r * 1.35} stroke="#7fe6ff" strokeWidth={3} />
                    <circle cx={x + Math.cos(a) * r * 1.4} cy={y + Math.sin(a) * r * 1.4} r={4} fill="#b8f3ff" />
                  </g>
                );
              })}
              <circle cx={x} cy={y} r={r} fill="url(#vg)" />
            </g>
          );
        })}
        <defs>
          <radialGradient id="vg">
            <stop offset="0" stopColor="#c9f6ff" />
            <stop offset="0.6" stopColor="#2fb6e8" />
            <stop offset="1" stopColor="#0a5f8f" />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

/** Bandera ondeando (franjas con onda senoidal). */
export const WavingFlag: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 760, h = 420}) => {
  const frame = useCurrentFrame();
  const wave = (px: number, py: number) => py + Math.sin(px / 90 - frame / 6) * 18 * (px / w);
  const stripe = (i: number) => {
    const y0 = (h / 13) * i;
    const y1 = (h / 13) * (i + 1);
    const top: string[] = [];
    const bot: string[] = [];
    for (let px = 0; px <= w; px += 20) {
      top.push(`${px},${wave(px, y0).toFixed(1)}`);
      bot.unshift(`${px},${wave(px, y1).toFixed(1)}`);
    }
    return `M${top.join(' L')} L${bot.join(' L')} Z`;
  };
  return (
    <svg viewBox={`-20 -30 ${w + 40} ${h + 60}`} style={{position: 'absolute', left: x, top: y, width: w + 40, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.4))'}}>
      {Array.from({length: 13}, (_, i) => (
        <path key={i} d={stripe(i)} fill={i % 2 ? '#f4f1ea' : '#b8202e'} />
      ))}
      <rect x={0} y={wave(0, 0)} width={w * 0.42} height={(h / 13) * 7} fill="#1f2c66" opacity={0.96} transform={`skewY(${Math.sin(-frame / 6) * 2})`} />
      {Array.from({length: 30}, (_, i) => (
        <circle key={i} cx={20 + (i % 6) * 50 + (Math.floor(i / 6) % 2) * 24} cy={wave(20 + (i % 6) * 50, 20 + Math.floor(i / 6) * 40)} r={6} fill="#f4f1ea" />
      ))}
      <rect x={-14} y={-30} width={10} height={h + 600} fill="#bdbdbd" />
    </svg>
  );
};

/** La Tierra vista desde el espacio: limbo con atmósfera y luces de ciudades. */
export const EarthLimb: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#010208'}}>
      <svg viewBox="0 0 1080 1920" style={{width: '100%', height: '100%'}}>
        {Array.from({length: 120}, (_, i) => (
          <circle key={i} cx={random(`st${i}`) * 1080} cy={random(`sy${i}`) * 1300} r={random(`sr${i}`) * 1.6 + 0.3} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(frame / 20 + i))} />
        ))}
        <defs>
          <radialGradient id="earth" cx="40%" cy="20%" r="80%">
            <stop offset="0" stopColor="#5fa8e8" />
            <stop offset="0.35" stopColor="#1f5f9e" />
            <stop offset="0.75" stopColor="#0a1d3a" />
            <stop offset="1" stopColor="#030a16" />
          </radialGradient>
          <clipPath id="earthclip">
            <circle cx={540} cy={3100} r={1900} />
          </clipPath>
        </defs>
        <circle cx={540} cy={3100} r={1930} fill="none" stroke="#4fb4ff" strokeWidth={50} opacity={0.35} style={{filter: 'blur(18px)'}} />
        <circle cx={540} cy={3100} r={1900} fill="url(#earth)" />
        <g clipPath="url(#earthclip)">
          {Array.from({length: 260}, (_, i) => {
            const x = random(`cx${i}`) * 1080;
            const y = 1300 + random(`cy${i}`) * 620;
            return <circle key={i} cx={x - frame * 0.4} cy={y} r={random(`cr${i}`) * 3 + 1} fill="#ffcf73" opacity={0.6 + random(`co${i}`) * 0.4} />;
          })}
          {Array.from({length: 12}, (_, i) => (
            <ellipse key={i} cx={random(`cl${i}`) * 1200 - frame * 0.6} cy={1260 + random(`clw${i}`) * 500} rx={160} ry={40} fill="#ffffff" opacity={0.18} style={{filter: 'blur(12px)'}} />
          ))}
        </g>
        <circle cx={540} cy={3100} r={1900} fill="none" stroke="#9ad6ff" strokeWidth={4} opacity={0.9} />
      </svg>
    </AbsoluteFill>
  );
};

/** Contador de años con desenfoque de movimiento mientras gira. */
export const YearCounter: React.FC<{from: number; to: number; at: number; dur: number; x: number; y: number; size?: number; color?: string}> = ({from, to, at, dur, x, y, size = 150, color = '#4a9dff'}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const v = interpolate(frame, [at, at + dur], [from, to], {...clamp, easing: EASE.inOut});
  const speed = Math.abs(v - interpolate(frame - 1, [at, at + dur], [from, to], {...clamp, easing: EASE.inOut}));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        fontFamily: F.serif,
        fontSize: size,
        color,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${color}, 0 0 50px ${color}88`,
        filter: `blur(${Math.min(6, speed * 0.6)}px)`,
      }}
    >
      {Math.round(v)}
    </div>
  );
};

/** Muro de televisores antiguos con estática y siluetas de cine. */
export const TvWall: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 30;
  const tvs = [
    [140, 0, 300, 240],
    [460, -20, 260, 220],
    [740, 10, 260, 230],
    [120, 260, 260, 220],
    [400, 230, 330, 270],
    [750, 260, 250, 210],
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: 760, width: 1080, height: 560}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`tvn${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={1} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      {tvs.map(([x, y, w, h], i) => (
        <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, background: 'linear-gradient(135deg,#8a5a2b,#4a2c12)', padding: 18, boxSizing: 'border-box', boxShadow: '0 14px 28px rgba(0,0,0,.5)'}}>
          <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', background: '#bdbdbd'}}>
            <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.55}}>
              <rect width="100%" height="100%" filter={`url(#tvn${seed})`} />
            </svg>
            <div style={{position: 'absolute', left: '40%', top: '22%', width: '20%', height: '30%', borderRadius: '50%', background: '#2a2a2a', opacity: 0.8}} />
            <div style={{position: 'absolute', left: '26%', bottom: -20, width: '48%', height: '42%', borderRadius: '50% 50% 0 0', background: '#2a2a2a', opacity: 0.8}} />
            <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 4px)'}} />
            <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 50%, rgba(0,0,0,.55))'}} />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Rollo de papel de cuello flotando y girando (falso 3D con elipses y degradados). */
export const PaperRoll: React.FC<{x: number; y: number; size?: number}> = ({x, y, size = 260}) => {
  const frame = useCurrentFrame();
  const tilt = Math.sin(frame / 25) * 10 - 18;
  const spin = (frame * 3) % 60;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + Math.sin(frame / 18) * 12, width: size, height: size, transform: `rotate(${tilt}deg)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,.35))'}}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <linearGradient id="roll" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e6e9ee" />
            <stop offset="1" stopColor="#a9b1bd" />
          </linearGradient>
          <clipPath id="rollbody">
            <rect x={40} y={50} width={120} height={100} />
          </clipPath>
        </defs>
        <rect x={40} y={50} width={120} height={100} fill="url(#roll)" />
        <g clipPath="url(#rollbody)">
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={40 + ((k * 60 + spin * 2) % 240) - 60} y={50} width={6} height={100} fill="#5b9bf0" opacity={0.75} />
          ))}
        </g>
        <ellipse cx={160} cy={100} rx={22} ry={50} fill="#f4f6f9" stroke="#c7ccd4" />
        <ellipse cx={160} cy={100} rx={9} ry={20} fill="#b8513c" />
        <ellipse cx={40} cy={100} rx={22} ry={50} fill="#d9dde3" />
      </svg>
    </div>
  );
};
