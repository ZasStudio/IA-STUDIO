import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Feature, FeatureCollection, Geometry} from 'geojson';
import type {GeometryCollection, Topology} from 'topojson-specification';
import topo from 'world-atlas/countries-50m.json';
import {EASE} from '../theme';
import {FONTS} from './Editorial';

/* Mapa vectorial real (world-atlas 1:50m) en proyección ortográfica: funciona sin conexión. */

const TOPO = topo as unknown as Topology<{countries: GeometryCollection}>;
const COUNTRIES = feature(TOPO, TOPO.objects.countries) as unknown as FeatureCollection<Geometry, {name: string}>;
const GRAT = geoGraticule10();

export const USA = ['840'];
export const EUROPE = ['040', '056', '100', '191', '196', '203', '208', '233', '246', '250', '276', '300', '348', '372', '380', '428', '440', '442', '470', '528', '616', '620', '642', '703', '705', '724', '752', '826', '578', '756', '352', '688', '499', '807', '008', '070', '804', '112', '498'];

export type Highlight = {ids: string[]; at: number; until?: number; color?: string; label?: string; labelAt?: number; labelDx?: number; labelDy?: number};

type Key = {f: number; rot: [number, number]; scale: number};

const lerpKeys = (frame: number, keys: Key[]) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], {easing: EASE.inOut});
      return {f: frame, rot: [a.rot[0] + (b.rot[0] - a.rot[0]) * t, a.rot[1] + (b.rot[1] - a.rot[1]) * t] as [number, number], scale: a.scale + (b.scale - a.scale) * t};
    }
  }
  return keys[keys.length - 1];
};

/**
 * Globo que rota entre "keyframes" de cámara; los países resaltados se encienden en onda
 * (por distancia al centro del resalte) y su frontera se dibuja con un trazo que avanza.
 */
export const Globe: React.FC<{keys: Key[]; highlights: Highlight[]; cx?: number; cy?: number; radius?: number}> = ({keys, highlights, cx = 540, cy = 1060, radius = 470}) => {
  const frame = useCurrentFrame();
  const cam = lerpKeys(frame, keys);
  const proj = geoOrthographic().rotate([cam.rot[0], cam.rot[1], 0]).scale(radius * cam.scale).translate([cx, cy]).clipAngle(90);
  const path = geoPath(proj);
  const hl = useMemo(
    () =>
      highlights.map((h) => {
        const feats = COUNTRIES.features.filter((c) => h.ids.includes(String(c.id)));
        const center = geoCentroid({type: 'FeatureCollection', features: feats} as FeatureCollection);
        return {h, feats, center};
      }),
    [highlights],
  );
  const r = radius * cam.scale;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#5d6a78" stopOpacity={0.55} />
            <stop offset="0.7" stopColor="#2c333c" stopOpacity={0.75} />
            <stop offset="1" stopColor="#14181d" stopOpacity={0.9} />
          </radialGradient>
          <filter id="hlglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* halo atmosférico */}
        <circle cx={cx} cy={cy} r={r + 26} fill="none" stroke="#dfe8f2" strokeOpacity={0.18} strokeWidth={40} style={{filter: 'blur(16px)'}} />
        <circle cx={cx} cy={cy} r={r} fill="url(#ocean)" />
        <path d={path(GRAT) ?? ''} fill="none" stroke="#cfd6de" strokeOpacity={0.12} strokeWidth={1.2} />
        {COUNTRIES.features.map((c, i) => (
          <path key={i} d={path(c) ?? ''} fill="#a7afb8" fillOpacity={0.55} stroke="#e7ecf1" strokeOpacity={0.35} strokeWidth={0.8} />
        ))}
        {hl.map(({h, feats, center}, k) =>
          feats.map((c, i) => {
            // onda: los países más lejos del centro del resalte se encienden un poco después
            const delay = (geoDistance(geoCentroid(c as Feature), center) / 0.5) * 8;
            const p = interpolate(frame - h.at - delay, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
            const draw = interpolate(frame - h.at - delay, [0, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
            const d = path(c) ?? '';
            const col = h.color ?? '#ffffff';
            const dimmed = h.until === undefined ? 0 : interpolate(frame, [h.until, h.until + 10], [0, 0.65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <g key={`${k}-${i}`}>
                <path d={d} fill={col} fillOpacity={0.88 * p * (1 - dimmed)} filter="url(#hlglow)" />
                <path d={d} fill="none" stroke={col} strokeWidth={2.4} pathLength={1} strokeDasharray={`${draw} 1`} />
              </g>
            );
          }),
        )}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e9eef3" strokeOpacity={0.5} strokeWidth={2} />
        {/* sombra de terminador para volumen */}
        <circle cx={cx} cy={cy} r={r} fill="url(#shade)" />
        <defs>
          <radialGradient id="shade" cx="30%" cy="25%" r="85%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
        </defs>
      </svg>
      {hl.map(({h, center}, k) => {
        if (!h.label) return null;
        const pt = proj(center);
        if (!pt) return null;
        const la = h.labelAt ?? h.at + 6;
        const p =
          interpolate(frame - la, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out}) *
          (h.until === undefined ? 1 : interpolate(frame, [h.until, h.until + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        const lx = pt[0] + (h.labelDx ?? 0);
        const ly = pt[1] + (h.labelDy ?? -150);
        return (
          <React.Fragment key={k}>
            <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: p}}>
              <line x1={pt[0]} y1={pt[1]} x2={pt[0] + (lx - pt[0]) * p} y2={pt[1] + (ly + 40 - pt[1]) * p} stroke="#fff" strokeWidth={2} strokeDasharray="6 8" />
              <circle cx={pt[0]} cy={pt[1]} r={9} fill="#fff" />
              <circle cx={pt[0]} cy={pt[1]} r={9 + (1 - p) * 30 + ((frame - la) % 30) * 0.8} fill="none" stroke="#fff" strokeOpacity={0.5 * (1 - ((frame - la) % 30) / 30)} strokeWidth={2} />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: lx,
                top: ly,
                transform: `translate(-50%, -50%) translateY(${(1 - p) * 20}px)`,
                opacity: p,
                filter: `blur(${(1 - p) * 8}px)`,
                fontFamily: FONTS.serif,
                fontSize: 74,
                color: '#fff',
                whiteSpace: 'nowrap',
                textShadow: '0 4px 24px rgba(0,0,0,.55)',
              }}
            >
              {h.label}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
