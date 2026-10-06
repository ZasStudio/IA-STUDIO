import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, SPRING} from '../../theme';
import {pathAt, tween} from '../../lib/motion';
import {GlassCard} from '../../components/Glass';
import {BlurLetters, HandCursor, PromptBar, Sky, TypeLine} from '../components/Basics';
import {FONT_P, P} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * A — Texto gigante esmerilado que se teclea ("Build me a CRM") y se TRANSFORMA en la barra
 * de prompt de cristal mientras el cielo pastel se oscurece a azul profundo. El cursor pulsa enviar.
 */
export const PIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const deep = tween(frame, [62, 100], [0, 1], EASE.inOut);
  const morph = spring({frame: frame - 70, fps, config: SPRING.smooth});
  const bar = spring({frame: frame - 80, fps, config: SPRING.smooth});
  const cur = pathAt(frame, [
    {f: 96, x: 1560, y: 900},
    {f: 116, x: 1335, y: 535, ease: EASE.out},
  ]);
  const press = interpolate(frame, [117, 120, 126], [0, 1, 0], clamp);

  return (
    <Sky layers={[{mode: 'pastel'}, {mode: 'deep', opacity: deep}]}>
      {/* Texto gigante "de cristal" */}
      <AbsoluteFill
        style={{
          display: 'grid',
          placeItems: 'center',
          opacity: 1 - interpolate(morph, [0, 0.7], [0, 1], clamp),
          filter: `blur(${morph * 22}px)`,
          transform: `translateY(${morph * 8}px) scale(${1 - morph * 0.78})`,
        }}
      >
        <TypeLine
          text="Build me a CRM"
          start={8}
          speed={3}
          size={220}
          weight={500}
          color="rgba(255,255,255,0.62)"
          caret="#ffffff"
          style={{textShadow: '0 0 30px rgba(255,255,255,0.45), 0 2px 0 rgba(255,255,255,0.3)', letterSpacing: '-0.045em'}}
        />
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 960 - 410, top: 540 - 48, opacity: bar, transform: `scale(${0.55 + bar * 0.45})`, filter: `blur(${(1 - bar) * 16}px)`}}>
        <PromptBar text="Build me a CRM" width={820} height={96} press={press} active={frame > 120 ? 1 : 0} />
      </div>

      {frame >= 96 && <HandCursor x={cur.x} y={cur.y} press={press} opacity={interpolate(frame, [96, 100], [0, 1], clamp)} />}
      <div style={{position: 'absolute', left: 60, top: 44, fontFamily: FONT_P, fontWeight: 600, fontSize: 30, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.02em'}}>ia studio</div>
    </Sky>
  );
};

/** Contador numérico con ease-out. */
export const Counter: React.FC<{from: number; to: number; start: number; dur?: number; decimals?: number; suffix?: string; style?: React.CSSProperties}> = ({
  from,
  to,
  start,
  dur = 40,
  decimals = 0,
  suffix = '',
  style,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [start, start + dur], [from, to], {...clamp, easing: EASE.out});
  return <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{v.toFixed(decimals) + suffix}</span>;
};

const Stat: React.FC<{label: string; children: React.ReactNode; bar?: number}> = ({label, children, bar}) => (
  <div style={{position: 'absolute', inset: 26, fontFamily: FONT_P, color: P.ink}}>
    <div style={{fontSize: 20, color: P.inkSoft}}>{label}</div>
    <div style={{fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', marginTop: 10}}>{children}</div>
    {bar !== undefined && (
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, borderRadius: 6, background: 'rgba(30,60,140,.1)'}}>
        <div style={{width: `${bar * 100}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${P.blueBright}, ${P.sky})`}} />
      </div>
    )}
  </div>
);

/** B — Dashboard "Oceanview Hotel": título en letras desenfocadas, edificio y tarjetas de cristal con contadores. */
export const PDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tower = spring({frame: frame - 2, fps, config: SPRING.heavy});
  const push = interpolate(frame, [0, 150], [1, 1.06]);
  const dock = spring({frame: frame - 6, fps, config: SPRING.smooth});
  const cards = [
    {x: 860, y: 260, w: 420, h: 230, d: 10, el: <Stat label="Occupancy"><Counter from={33} to={60} start={16} suffix="%" /></Stat>},
    {x: 1310, y: 260, w: 420, h: 230, d: 16, el: <Stat label="Revenue" bar={tween(frame, [22, 70], [0.1, 0.78])}><Counter from={12.4} to={18.9} start={22} decimals={1} suffix="k" /></Stat>},
    {x: 860, y: 520, w: 420, h: 300, d: 22, el: <Gauge t={tween(frame, [28, 80], [0, 0.72])} />},
    {x: 1310, y: 520, w: 420, h: 300, d: 28, el: <Stat label="Guest rating"><Counter from={1.3} to={7.9} start={30} dur={50} decimals={1} /></Stat>},
  ];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg,#f3f7ff 0%,#d8e5ff 55%,#c4d6fb 85%,#f6d9ea 100%)', transform: `scale(${push})`}}>
      <svg viewBox="0 0 600 700" style={{position: 'absolute', left: 110, top: 380, width: 600, height: 700, transform: `translateY(${(1 - tower) * 300}px)`, opacity: tower}}>
        <defs>
          <linearGradient id="towerg" x1="0" x2="1">
            <stop offset="0" stopColor="#9fb6dd" />
            <stop offset="1" stopColor="#f2f6ff" />
          </linearGradient>
        </defs>
        <path d="M120 700 L200 40 L470 120 L520 700 Z" fill="url(#towerg)" />
        {Array.from({length: 22}, (_, i) => (
          <line key={i} x1={200 - i * 3.5} y1={40 + i * 30} x2={470 + i * 2.3} y2={120 + i * 27} stroke="#7d93bd" strokeWidth={2} opacity={0.55} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 90, top: 120, lineHeight: 0.95}}>
        <BlurLetters text="Oceanview" start={4} size={130} weight={300} color="#5d6f94" />
        <br />
        <BlurLetters text="Hotel" start={12} size={130} weight={300} color="#5d6f94" />
      </div>
      <div style={{position: 'absolute', left: 860, top: 170}}>
        <BlurLetters text="Analytics Overview" start={14} size={40} weight={500} color={P.inkSoft} tracking="-0.01em" />
      </div>
      {cards.map((c, i) => {
        const s = spring({frame: frame - c.d, fps, config: SPRING.smooth});
        return (
          <div key={i} style={{position: 'absolute', left: c.x, top: c.y, transform: `translateY(${(1 - s) * 140}px)`, filter: s < 0.99 ? `blur(${(1 - s) * 12}px)` : undefined}}>
            <GlassCard width={c.w} height={c.h} radius={28} start={c.d} tint="light" border={['#ffffff', '#c9dbff']} borderWidth={1.5} glowBorder={false}>
              {c.el}
            </GlassCard>
          </div>
        );
      })}
      {/* la barra de prompt baja y se queda como "dock" inferior mientras se monta el dashboard */}
      <div style={{position: 'absolute', left: 960 - 410, top: 540 - 48, transform: `translateY(${dock * 440}px) scale(${1 - dock * 0.2})`}}>
        <PromptBar text="Build me a CRM" width={820} height={96} active={1} tone="light" />
      </div>
    </AbsoluteFill>
  );
};

const Gauge: React.FC<{t: number}> = ({t}) => {
  const r = 90;
  const c = Math.PI * r;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: FONT_P}}>
      <svg width={260} height={160} viewBox="-130 -120 260 160">
        <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke="rgba(30,60,140,.12)" strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke={P.blueBright} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${c * t} ${c}`} />
        <text y={-6} textAnchor="middle" fontSize={44} fontWeight={500} fill={P.ink} fontFamily={FONT_P}>
          {Math.round(t * 100)}%
        </text>
      </svg>
    </div>
  );
};
