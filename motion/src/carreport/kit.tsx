import React, {useId, useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Feature, FeatureCollection, Geometry} from 'geojson';
import type {GeometryCollection, Topology} from 'topojson-specification';
import topo from 'world-atlas/countries-50m.json';
import {EASE} from '../theme';

export const CR = {
  bg: '#04060c',
  navy: '#0a1224',
  cyan: '#2be4ff',
  cyanDeep: '#0a7ea8',
  red: '#ff3b4e',
  green: '#2dff9b',
  amber: '#ffc23d',
  white: '#ffffff',
  mute: '#8a97b3',
};

export const F = {
  head: '"Montserrat Variable", Montserrat, sans-serif',
  cond: '"Anton", Impact, sans-serif',
  ui: '"Inter Variable", Inter, sans-serif',
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, e = EASE.out) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

/* ---------------------------------- fondo tech ---------------------------------- */

export const TechBg: React.FC<{tint?: string; grid?: number}> = ({tint = CR.cyan, grid = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 45%, #0d1a33 0%, ${CR.bg} 70%)`, overflow: 'hidden'}}>
      {/* rejilla en perspectiva (suelo) */}
      <div style={{position: 'absolute', left: -540, right: -540, top: 1150, height: 1400, transform: 'perspective(700px) rotateX(68deg)', transformOrigin: '50% 0%', opacity: 0.35 * grid}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${tint}55 2px, transparent 2px), linear-gradient(90deg, ${tint}55 2px, transparent 2px)`,
            backgroundSize: '90px 90px',
            backgroundPosition: `0 ${(frame * 4) % 90}px`,
            WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 85%)',
            maskImage: 'linear-gradient(180deg, #000, transparent 85%)',
          }}
        />
      </div>
      {/* partículas */}
      {Array.from({length: 40}, (_, i) => {
        const x = random(`px${i}`) * 1080;
        const y = (((random(`py${i}`) * 2000 - frame * (0.3 + random(`pv${i}`))) % 2000) + 2000) % 2000 - 40;
        const r = 2 + random(`pr${i}`) * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: tint, opacity: 0.15 + random(`po${i}`) * 0.35, boxShadow: `0 0 8px ${tint}`}} />;
      })}
      {/* resplandor */}
      <div style={{position: 'absolute', left: 140, top: 500, width: 800, height: 800, borderRadius: '50%', background: `radial-gradient(circle, ${tint}22, transparent 65%)`, filter: 'blur(20px)'}} />
    </AbsoluteFill>
  );
};

/** Grano + líneas de escaneo + viñeta. */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 25;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.6) 100%)'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 2px, transparent 2px 4px)'}} />
      <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id={`cg${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#cg${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------- auto ---------------------------------- */

/** Sedán de perfil en vector. `wire` lo convierte en "radiografía" (contorno cian). */
export const Car: React.FC<{width: number; spin?: number; wire?: number; color?: string; lights?: number}> = ({width, spin = 0, wire = 0, color = '#c8ccd6', lights = 1}) => {
  const id = 'car' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = 'M40 230 Q38 196 70 188 L170 172 Q250 110 330 100 L520 98 Q600 100 660 160 L760 176 Q812 186 818 222 L820 250 Q820 262 806 264 L40 264 Q30 262 32 250 Z';
  const glass = 'M200 172 Q262 120 336 114 L440 112 L440 172 Z M456 112 L520 112 Q580 116 626 164 L456 172 Z';
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},258)`}>
      <circle r={50} fill="#0b0d12" />
      <circle r={34} fill={`url(#${id}rim)`} />
      <g transform={`rotate(${spin})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <rect key={a} x={-3.5} y={-30} width={7} height={26} rx={3} fill="#2a2f39" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={7} fill="#9aa3b2" />
    </g>
  );
  return (
    <svg viewBox="0 60 860 260" width={width} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={color} />
          <stop offset="0.7" stopColor="#5d6370" />
          <stop offset="1" stopColor="#262a32" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fd8ff" stopOpacity={0.9} />
          <stop offset="1" stopColor="#0d1f38" />
        </linearGradient>
        <radialGradient id={`${id}rim`}>
          <stop offset="0" stopColor="#e6ebf2" />
          <stop offset="1" stopColor="#6b7382" />
        </radialGradient>
        <radialGradient id={`${id}l`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.4" stopColor="#bfefff" />
          <stop offset="1" stopColor="#bfefff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* sombra */}
      <ellipse cx={430} cy={308} rx={400} ry={16} fill="#000" opacity={0.6} />
      <g opacity={1 - wire}>
        <path d={body} fill={`url(#${id}b)`} />
        <path d={glass} fill={`url(#${id}g)`} />
        <path d="M60 214 L810 214" stroke="rgba(255,255,255,.35)" strokeWidth={2} />
        <rect x={430} y={186} width={30} height={6} rx={3} fill="#2a2f39" />
        <rect x={250} y={186} width={30} height={6} rx={3} fill="#2a2f39" />
      </g>
      <g opacity={wire} fill="none" stroke={CR.cyan} strokeWidth={2.5} style={{filter: `drop-shadow(0 0 6px ${CR.cyan})`}}>
        <path d={body} />
        <path d={glass} />
        <path d="M60 214 L810 214" strokeDasharray="8 8" />
      </g>
      {wheel(190)}
      {wheel(660)}
      {/* faros */}
      <ellipse cx={800} cy={200} rx={14} ry={8} fill="#fff" opacity={lights} />
      <ellipse cx={850} cy={204} rx={120} ry={46} fill={`url(#${id}l)`} opacity={0.75 * lights} />
      <ellipse cx={46} cy={204} rx={10} ry={7} fill={CR.red} opacity={0.9} style={{filter: `drop-shadow(0 0 10px ${CR.red})`}} />
    </svg>
  );
};

/* ---------------------------------- placa peruana ---------------------------------- */

export const Plate: React.FC<{text: string; width?: number; scan?: number}> = ({text, width = 760, scan = -1}) => {
  const frame = useCurrentFrame();
  const h = width * 0.42;
  return (
    <div style={{position: 'relative', width, height: h, borderRadius: 26, background: 'linear-gradient(180deg,#ffffff,#e6e9ef)', boxShadow: '0 30px 70px rgba(0,0,0,.6), inset 0 0 0 6px #1b1f27, inset 0 0 0 10px #f4f6fa', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 10, right: 10, top: 10, height: h * 0.2, background: 'linear-gradient(90deg,#1c4fb3,#2a6ae0)', borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 900, fontSize: h * 0.12, color: '#fff', letterSpacing: '0.3em'}}>
        PERÚ
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.24, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.cond, fontSize: h * 0.62, color: '#121418', letterSpacing: '0.04em'}}>
        {text}
        {text.length < 7 && Math.floor(frame / 8) % 2 === 0 && <span style={{display: 'inline-block', width: h * 0.05, height: h * 0.5, background: CR.cyanDeep, marginLeft: 8}} />}
      </div>
      {/* tornillos */}
      {[0.06, 0.94].map((x) => (
        <div key={x} style={{position: 'absolute', left: width * x - 9, top: h * 0.32, width: 18, height: 18, borderRadius: 9, background: 'radial-gradient(circle,#fafafa,#8f96a3)'}} />
      ))}
      {/* láser de escaneo */}
      {scan >= 0 && scan <= 1 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: scan * h - 3, height: 6, background: CR.cyan, boxShadow: `0 0 20px ${CR.cyan}, 0 0 60px ${CR.cyan}`}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: scan * h, background: `linear-gradient(180deg, transparent, ${CR.cyan}33)`}} />
        </>
      )}
    </div>
  );
};

/* ---------------------------------- iconos ---------------------------------- */

export type IconName = 'doc' | 'users' | 'history' | 'shield' | 'crash' | 'ticket' | 'lock' | 'bus' | 'alert' | 'coin' | 'gas' | 'clock' | 'soat' | 'tool' | 'pdf' | 'chat' | 'send' | 'pin' | 'bolt';

export const Ico: React.FC<{name: IconName; size?: number; color?: string}> = ({name, size = 40, color = CR.cyan}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'doc' && <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" {...p} />}
      {name === 'users' && <path d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c.8-3 3.2-5 6-5s5.2 2 6 5M16 5.5a3 3 0 010 5.5M18 15c1.6.6 2.6 2.4 3 5" {...p} />}
      {name === 'history' && <path d="M4 12a8 8 0 102.3-5.6M4 4v4h4M12 8v4l3 2" {...p} />}
      {name === 'shield' && <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4" {...p} />}
      {name === 'crash' && <path d="M3 15l3-6h8l3 6M3 15h14v3H3zM6 18v1M14 18v1M19 4l-2 3M21 8h-3M16 3v3" {...p} />}
      {name === 'ticket' && <path d="M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4zM10 7v10" {...p} />}
      {name === 'lock' && <path d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3M12 15v2" {...p} />}
      {name === 'bus' && <path d="M5 4h14v12H5zM5 11h14M7 16v3M17 16v3M8 13.5h.01M16 13.5h.01" {...p} />}
      {name === 'alert' && <path d="M12 3l9 16H3zM12 10v4M12 17h.01" {...p} />}
      {name === 'coin' && <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM15 9c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v1.5M12 16.5V18" {...p} />}
      {name === 'gas' && <path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M5 10h10M15 8l3 2v8a1.5 1.5 0 003 0V9l-2-3" {...p} />}
      {name === 'clock' && <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 3" {...p} />}
      {name === 'soat' && <path d="M4 6h16v12H4zM4 10h16M7 14h4" {...p} />}
      {name === 'tool' && <path d="M14 6a4 4 0 015 5l-9 9-3-3 9-9zM5 19l-2 2" {...p} />}
      {name === 'pdf' && <path d="M6 3h8l4 4v14H6zM14 3v4h4M8 14h1.5a1.5 1.5 0 000-3H8v5M12 11v5h1.2a2 2 0 002-2v-1a2 2 0 00-2-2zM17 11h-1.5v5M15.5 13.5H17" {...p} />}
      {name === 'chat' && <path d="M4 5h16v11H9l-5 4z" {...p} />}
      {name === 'send' && <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" {...p} />}
      {name === 'pin' && <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" {...p} />}
      {name === 'bolt' && <path d="M13 2L4 14h7l-1 8 9-12h-7z" {...p} />}
    </svg>
  );
};

/* ---------------------------------- mapa del Perú ---------------------------------- */

const TOPO = topo as unknown as Topology<{countries: GeometryCollection}>;
const COUNTRIES = feature(TOPO, TOPO.objects.countries) as unknown as FeatureCollection<Geometry>;
const PERU = COUNTRIES.features.find((c) => String(c.id) === '604') as Feature<Geometry>;
const NEIGHBORS = COUNTRIES.features.filter((c) => ['218', '170', '076', '068', '152'].includes(String(c.id)));

export const CITIES: [string, number, number][] = [
  ['Piura', -80.63, -5.19],
  ['Chiclayo', -79.84, -6.77],
  ['Iquitos', -73.25, -3.75],
  ['Trujillo', -79.03, -8.11],
  ['Lima', -77.04, -12.05],
  ['Huancayo', -75.21, -12.07],
  ['Cusco', -71.97, -13.53],
  ['Arequipa', -71.54, -16.41],
  ['Puno', -70.02, -15.84],
  ['Tacna', -70.25, -18.01],
];

/** Perú real (world-atlas 1:50m): el contorno se dibuja, se rellena y las ciudades hacen ping. */
export const PeruMap: React.FC<{t: number; box: [[number, number], [number, number]]}> = ({t, box}) => {
  const {path, proj} = useMemo(() => {
    const pr = geoMercator().fitExtent(box, PERU);
    return {path: geoPath(pr), proj: pr};
  }, [box]);
  const draw = interpolate(t, [0, 40], [0, 1], {...clamp, easing: EASE.inOut});
  const fill = interpolate(t, [30, 55], [0, 1], clamp);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="peruFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CR.cyan} stopOpacity={0.55} />
          <stop offset="1" stopColor="#1650ff" stopOpacity={0.35} />
        </linearGradient>
        <pattern id="peruDots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx={7} cy={7} r={2} fill={CR.cyan} opacity={0.5} />
        </pattern>
      </defs>
      {NEIGHBORS.map((c, i) => (
        <path key={i} d={path(c) ?? ''} fill="#ffffff08" stroke="#ffffff22" strokeWidth={1.5} opacity={draw} />
      ))}
      <path d={path(PERU) ?? ''} fill="url(#peruFill)" opacity={fill} />
      <path d={path(PERU) ?? ''} fill="url(#peruDots)" opacity={fill} />
      <path d={path(PERU) ?? ''} fill="none" stroke={CR.cyan} strokeWidth={4} pathLength={1} strokeDasharray={`${draw} 1`} style={{filter: `drop-shadow(0 0 10px ${CR.cyan})`}} />
      {CITIES.map(([name, lon, lat], i) => {
        const pt = proj([lon, lat]);
        if (!pt) return null;
        const at = 50 + i * 6;
        const p = interpolate(t - at, [0, 10], [0, 1], {...clamp, easing: EASE.out});
        const ring = ((t - at) % 36) / 36;
        const isLima = name === 'Lima';
        return (
          <g key={name} opacity={p}>
            {t > at && <circle cx={pt[0]} cy={pt[1]} r={10 + ring * 40} fill="none" stroke={isLima ? CR.amber : CR.green} strokeWidth={3} opacity={1 - ring} />}
            <circle cx={pt[0]} cy={pt[1]} r={isLima ? 12 : 9} fill={isLima ? CR.amber : CR.green} style={{filter: `drop-shadow(0 0 8px ${isLima ? CR.amber : CR.green})`}} />
            <text x={pt[0] + 18} y={pt[1] + 9} fontFamily={F.head} fontWeight={800} fontSize={isLima ? 34 : 26} fill="#fff" style={{paintOrder: 'stroke', stroke: '#04060c', strokeWidth: 6}}>
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
