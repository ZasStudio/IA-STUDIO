import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, SPRING} from '../../theme';
import {pathAt, tween} from '../../lib/motion';
import {BlurLetters, HandCursor, Sky, TypeLine} from '../components/Basics';
import {Landscape, Thumb, type MockKind} from '../components/Visuals';
import {Counter} from './Intro';
import {FONT_P, P} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ITEMS: {label: string; thumb?: MockKind}[] = [
  {label: 'Entire startups'},
  {label: 'Landing pages', thumb: 'refresh'},
  {label: 'SaaS products', thumb: 'windpower'},
  {label: 'Internal tools', thumb: 'oceanview'},
  {label: 'AI apps', thumb: 'aiapp'},
  {label: 'Marketplaces', thumb: 'market'},
  {label: 'Automations'},
];

/**
 * G — LISTA-RUEDA (picker): la lista avanza a saltos con ease-in-out; el elemento enfocado
 * se ilumina, crece y recibe una miniatura que se revela con máscara; los vecinos se desenfocan.
 */
export const PWheel: React.FC = () => {
  const frame = useCurrentFrame();
  // posición continua de la rueda: un paso cada 34 frames, cada paso dura 14 frames
  let pos = 0;
  for (let k = 0; k < 5; k++) pos += tween(frame, [8 + k * 34, 22 + k * 34], [0, 1], EASE.inOut);
  const rowH = 132;
  return (
    <Sky layers={[{mode: 'deep'}]} glow="rgba(140,196,255,0.25)">
      {/* banda de enfoque */}
      <div style={{position: 'absolute', left: 200, right: 0, top: 540 - rowH / 2, height: rowH, background: 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 70%, transparent)', borderTop: '1px solid rgba(255,255,255,.25)', borderBottom: '1px solid rgba(255,255,255,.25)'}} />
      <div style={{position: 'absolute', left: 200, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.18)'}} />
      {ITEMS.map((it, i) => {
        const d = i - pos;
        const ad = Math.abs(d);
        const focus = interpolate(ad, [0, 0.6], [1, 0], clamp);
        const y = 540 + d * rowH;
        const thumbW = 230;
        const reveal = it.thumb ? focus : 0;
        return (
          <div key={i} style={{position: 'absolute', left: 240, top: y, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', opacity: interpolate(ad, [0, 2.6], [1, 0.12], clamp), filter: ad > 0.3 ? `blur(${Math.min(ad, 3) * 1.6}px)` : undefined}}>
            <div style={{width: thumbW * reveal, overflow: 'hidden', marginRight: 34 * reveal, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0 round 12px)`}}>
              {it.thumb && <Thumb kind={it.thumb} width={thumbW} radius={12} />}
            </div>
            <span
              style={{
                fontFamily: FONT_P,
                fontSize: 64 + focus * 22,
                fontWeight: 400,
                letterSpacing: '-0.03em',
                color: focus > 0.5 ? '#ffffff' : 'rgba(205,220,255,0.75)',
                textShadow: focus > 0.5 ? '0 0 30px rgba(140,196,255,.5)' : undefined,
              }}
            >
              {it.label}
            </span>
          </div>
        );
      })}
    </Sky>
  );
};

/** Palabra que cambia en "Faster ___": entra con letras desenfocadas y sale igual. */
const Swap: React.FC<{fasterStart?: number; words: {w: string; start: number; exit?: number; gradient?: [string, string]}[]}> = ({fasterStart = 2, words}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', justifyContent: 'center'}}>
    <div style={{width: 900, textAlign: 'right', paddingRight: 28}}>
      <BlurLetters text="Faster" start={fasterStart} size={96} weight={400} color="#ffffff" style={{textShadow: '0 2px 30px rgba(5,15,40,.45)'}} />
    </div>
    <div style={{width: 900, position: 'relative', height: 110}}>
      {words.map((x) => (
        <div key={x.w} style={{position: 'absolute', left: 0, top: 0}}>
          <BlurLetters text={x.w} start={x.start} exit={x.exit} size={96} weight={400} gradient={x.gradient ?? ['#ffffff', '#c9dcff']} style={{filter: 'drop-shadow(0 2px 14px rgba(5,15,40,.45))'}} />
        </div>
      ))}
    </div>
  </div>
);

/**
 * H — Tarjeta de prompt grande (tecleo) → "Faster ideas / launches / products":
 * fondos que se funden, tarjetas y paneles que entran, el cursor pulsa los botones.
 */
export const PFaster: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame: frame - 2, fps, config: SPRING.smooth});
  const cardOut = tween(frame, [64, 80], [0, 1], EASE.in);
  const hills = tween(frame, [66, 84], [0, 1]) * (1 - tween(frame, [128, 142], [0, 1]));
  const forest = tween(frame, [184, 198], [0, 1]);
  const small = spring({frame: frame - 76, fps, config: SPRING.smooth});
  const smallOut = tween(frame, [126, 138], [0, 1], EASE.in);
  const panel = spring({frame: frame - 134, fps, config: SPRING.smooth});
  const panelOut = tween(frame, [182, 194], [0, 1], EASE.in);
  const chart = spring({frame: frame - 192, fps, config: SPRING.bouncy});

  const cur = pathAt(frame, [
    {f: 92, x: 1500, y: 860},
    {f: 110, x: 1236, y: 624, ease: EASE.out},
    {f: 124, x: 1236, y: 624},
    {f: 150, x: 1300, y: 900, ease: EASE.inOut},
    {f: 166, x: 1500, y: 670, ease: EASE.out},
  ]);
  const press1 = interpolate(frame, [112, 115, 120], [0, 1, 0], clamp);
  const press2 = interpolate(frame, [168, 171, 176], [0, 1, 0], clamp);

  return (
    <Sky layers={[{mode: 'dusk'}]}>
      <AbsoluteFill style={{opacity: hills}}>
        <Landscape palette="hills" seed="hills" drift={0.3} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: forest}}>
        <Landscape palette="forest" seed="forest" drift={0.3} />
      </AbsoluteFill>

      {/* 1) Tarjeta de prompt grande, de cristal, entra en perspectiva */}
      <div style={{position: 'absolute', inset: 0, perspective: 1400}}>
        <div
          style={{
            position: 'absolute',
            left: 410,
            top: 200,
            width: 1100,
            height: 560,
            borderRadius: 60,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))',
            border: '1.5px solid rgba(255,255,255,0.45)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 40px 100px rgba(3,10,53,.35)',
            backdropFilter: 'blur(26px) saturate(150%)',
            transform: `translateY(${(1 - cardIn) * 260}px) rotateX(${(1 - cardIn) * 24}deg) scale(${1 - cardOut * 0.2})`,
            opacity: interpolate(cardIn, [0, 0.4], [0, 1], clamp) * (1 - cardOut),
          }}
        >
          <div style={{position: 'absolute', left: 64, top: 70}}>
            <TypeLine text="Build a modern premium page" start={8} speed={2} size={58} color="#ffffff" />
          </div>
          <div style={{position: 'absolute', left: 64, bottom: 56, display: 'flex', gap: 22, alignItems: 'center', fontFamily: FONT_P}}>
            <div style={{width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 50, fontWeight: 300}}>+</div>
            <div style={{height: 84, padding: '0 34px', borderRadius: 42, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', color: '#fff', fontSize: 32}}>◍ Public</div>
          </div>
        </div>
      </div>

      {/* 2) Tarjeta pequeña sobre el paisaje (Faster ideas) */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 330,
          top: 520,
          width: 660,
          height: 150,
          borderRadius: 26,
          background: 'rgba(255,255,255,0.88)',
          boxShadow: '0 24px 60px rgba(20,40,30,.25)',
          fontFamily: FONT_P,
          opacity: interpolate(small, [0, 0.4], [0, 1], clamp) * (1 - smallOut),
          transform: `scale(${0.85 + small * 0.15}) translateY(${-smallOut * 30}px)`,
          filter: small < 0.99 || smallOut > 0 ? `blur(${(1 - small) * 12 + smallOut * 12}px)` : undefined,
        }}
      >
        <div style={{position: 'absolute', left: 30, top: 26, fontSize: 24, color: P.inkSoft}}>Build a modern premium page</div>
        <div style={{position: 'absolute', left: 30, bottom: 22, fontSize: 20, color: P.inkSoft}}>+ &nbsp; ◍ Public</div>
        <div style={{position: 'absolute', right: 26, bottom: 18, width: 50, height: 50, borderRadius: '50%', background: frame > 115 ? P.blueBright : P.ink, transform: `scale(${1 - press1 * 0.15})`, boxShadow: frame > 115 ? `0 0 24px ${P.sky}` : undefined}} />
      </div>

      {/* 3) Panel oscuro de la app con botón Deploy (Faster launches) */}
      <div
        style={{
          position: 'absolute',
          left: 380,
          top: 560,
          width: 1300,
          height: 640,
          borderRadius: '70px 70px 0 0',
          background: 'linear-gradient(180deg,#0b1030,#05081c)',
          border: `5px solid ${P.blueBright}`,
          boxShadow: `0 -10px 80px ${P.blue}88`,
          transform: `translateY(${(1 - panel) * 600 + panelOut * 600}px)`,
          fontFamily: FONT_P,
        }}
      >
        <div style={{position: 'absolute', left: 60, top: 60, right: 60, height: 90, borderRadius: 45, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', padding: '0 34px', color: 'rgba(255,255,255,.5)', fontSize: 30}}>
          desktop
          <div style={{flex: 1}} />
          <div
            style={{
              height: 64,
              padding: '0 54px',
              borderRadius: 32,
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
              fontSize: 28,
              background: frame > 171 ? `linear-gradient(90deg, ${P.blueBright}, ${P.sky})` : 'rgba(255,255,255,.12)',
              boxShadow: frame > 171 ? `0 0 30px ${P.sky}` : undefined,
              transform: `scale(${1 - press2 * 0.12})`,
            }}
          >
            Deploy
          </div>
        </div>
      </div>

      {/* 4) Tarjeta con gráfico (Faster products) */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 280,
          top: 470,
          width: 560,
          height: 330,
          borderRadius: 30,
          background: 'linear-gradient(160deg, rgba(20,30,30,.55), rgba(20,30,30,.35))',
          border: '1px solid rgba(255,255,255,.25)',
          backdropFilter: 'blur(20px)',
          color: '#fff',
          fontFamily: FONT_P,
          padding: 34,
          boxSizing: 'border-box',
          opacity: interpolate(chart, [0, 0.3], [0, 1], clamp),
          transform: `scale(${0.8 + chart * 0.2}) rotate(${(1 - chart) * -6}deg)`,
        }}
      >
        <div style={{fontSize: 22, opacity: 0.7}}>Product performance</div>
        <div style={{fontSize: 70, fontWeight: 500, color: '#b8ffcf', letterSpacing: '-0.03em'}}>
          <Counter from={14.8} to={18.4} start={196} dur={36} decimals={1} suffix="%" />
        </div>
        <svg viewBox="0 0 400 80" style={{width: '100%', height: 90}}>
          <path
            d="M0 70 C 60 60, 90 40, 140 48 S 230 20, 280 30 S 360 5, 400 10"
            fill="none"
            stroke="#b8ffcf"
            strokeWidth={4}
            pathLength={1}
            strokeDasharray={`${tween(frame, [198, 236], [0, 1])} 1`}
          />
        </svg>
      </div>

      {frame >= 92 && frame < 200 && <HandCursor x={cur.x} y={cur.y} press={Math.max(press1, press2)} opacity={interpolate(frame, [92, 96, 186, 196], [0, 1, 1, 0], clamp)} />}

      <Swap
        fasterStart={68}
        words={[
          {w: 'ideas', start: 72, exit: 126},
          {w: 'launches', start: 136, exit: 182},
          {w: 'products', start: 192},
        ]}
      />
    </Sky>
  );
};

/** I — "Faster everything" sobre colinas rosadas → blanco "Great products". */
export const PEverything: React.FC = () => {
  const frame = useCurrentFrame();
  const white = tween(frame, [56, 70], [0, 1], EASE.inOut);
  return (
    <AbsoluteFill>
      <Landscape palette="dusk" seed="dusk" drift={0.3} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: 1 - white}}>
        <BlurLetters text="Faster " start={0} size={110} weight={400} color={P.ink} />
        <BlurLetters text="everything" start={6} size={110} weight={400} gradient={['#c4669a', '#f2b7d6']} />
      </div>
      <AbsoluteFill style={{opacity: white}}>
        <Sky layers={[{mode: 'white'}]}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center'}}>
            <BlurLetters text="Great " start={66} size={110} weight={400} color={P.ink} />
            <BlurLetters text="products" start={74} size={110} weight={400} gradient={[P.inkSoft, '#9cc8ff']} />
          </div>
        </Sky>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
