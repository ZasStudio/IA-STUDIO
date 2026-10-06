import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, SPRING} from '../../theme';
import {tween} from '../../lib/motion';
import {BlurLetters, GlowPill, Sky} from '../components/Basics';
import {Bottle, Landscape, WebMock} from '../components/Visuals';
import {Counter} from './Intro';
import {FONT_P, P} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** C — Montaje de webs generadas: zoom lento + disolución con desenfoque entre maquetas. */
export const PShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const x = tween(frame, [52, 68], [0, 1], EASE.inOut);
  const kb = (f0: number) => interpolate(frame - f0, [0, 80], [1.1, 1.0], {...clamp, easing: EASE.out});
  return (
    <AbsoluteFill style={{background: P.navy}}>
      <AbsoluteFill style={{transform: `scale(${kb(0)})`, filter: `blur(${x * 24}px)`, opacity: 1 - x}}>
        <WebMock kind="vision" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${kb(52)})`, filter: `blur(${(1 - x) * 24}px)`, opacity: x}}>
        <WebMock kind="nature" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Marco de ventana de tren (agujero redondeado con borde cobrizo). */
const TrainWindow: React.FC = () => (
  <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2416" />
        <stop offset="0.6" stopColor="#24150c" />
        <stop offset="1" stopColor="#120a05" />
      </linearGradient>
      <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3c58f" />
        <stop offset="0.5" stopColor="#8a5428" />
        <stop offset="1" stopColor="#f0b47a" />
      </linearGradient>
    </defs>
    <path fillRule="evenodd" fill="url(#wall)" d="M0 0H1920V1080H0Z M470 150 h980 a110 110 0 0 1 110 110 v520 a110 110 0 0 1 -110 110 h-980 a110 110 0 0 1 -110 -110 v-520 a110 110 0 0 1 110 -110Z" />
    <rect x={360} y={150} width={1200} height={740} rx={110} fill="none" stroke="url(#copper)" strokeWidth={14} />
    <rect x={372} y={162} width={1176} height={716} rx={100} fill="none" stroke="#ffe2b8" strokeOpacity={0.4} strokeWidth={3} />
    <rect x={0} y={930} width={1920} height={150} fill="#0d0703" opacity={0.6} />
  </svg>
);

/**
 * D — Ventana de tren: el título entra letra a letra desenfocado; la cámara ATRAVIESA la ventana
 * (el marco escala hasta salir de cuadro) y aparece "This isn't".
 */
export const PWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const through = tween(frame, [66, 112], [0, 1], EASE.inOut);
  const frameScale = 1 + Math.pow(through, 2) * 2.6;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.18 - through * 0.18})`}}>
        <Landscape palette="alps" animals drift={0.2} seed="alps" />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${frameScale})`, opacity: 1 - tween(frame, [96, 112], [0, 1])}}>
        <TrainWindow />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center'}}>
        <span style={{display: 'inline-block', padding: '8px 22px', borderRadius: 30, background: 'rgba(255,255,255,0.35)', fontFamily: FONT_P, fontSize: 22, color: P.ink, opacity: tween(frame, [0, 12], [0, 1]) * (1 - tween(frame, [60, 72], [0, 1]))}}>
          Travel with us
        </span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', lineHeight: 1}}>
        <BlurLetters text="Weaving Your Dreams" start={4} exit={62} size={92} weight={500} color={P.ink} />
        <br />
        <BlurLetters text="into Adventures" start={16} exit={64} size={92} weight={500} color={P.ink} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center'}}>
        <BlurLetters text="This " start={112} exit={150} size={140} weight={400} color={P.ink} />
        <BlurLetters text="isn't" start={118} size={140} weight={400} color={P.ink} />
      </div>
    </AbsoluteFill>
  );
};

/** E — Blanco: "a proto|type" en dos tonos → botón "It's live" con resplandor que respira. */
export const PPrototype: React.FC = () => (
  <Sky layers={[{mode: 'white'}]} glow="rgba(140,196,255,0.25)">
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center'}}>
      <BlurLetters text="a proto" start={2} exit={50} size={110} weight={400} color={P.ink} />
      <BlurLetters text="type" start={12} exit={54} size={110} weight={400} gradient={[P.inkSoft, '#9cc8ff']} />
    </div>
    <GlowPill text="It's live" start={58} x={960} y={540} size={74} />
  </Sky>
);

/**
 * F — Producto "Refresh Daily": las letras CAEN una a una con rebote, la botella flota,
 * contador de porcentaje y cambio de color del fondo.
 */
export const PRefresh: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bottle = spring({frame: frame - 6, fps, config: SPRING.bouncy});
  const blue = tween(frame, [96, 120], [0, 1], EASE.inOut);
  return (
    <Sky layers={[{mode: 'ice'}, {mode: 'dusk', opacity: blue}]}>
      <div style={{position: 'absolute', top: 34, left: 60, right: 60, display: 'flex', fontFamily: FONT_P, fontSize: 22, color: blue > 0.5 ? '#fff' : P.ink}}>
        <b>Refresh</b>
        <div style={{flex: 1}} />
        {['Home', 'About us', 'Our services'].map((t) => (
          <span key={t} style={{marginLeft: 36, opacity: 0.7}}>
            {t}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', left: 100, top: 150, display: 'flex', fontFamily: FONT_P, fontSize: 300, fontWeight: 500, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.88)'}}>
        {[...'Refresh'].map((ch, i) => {
          const s = spring({frame: frame - 4 - i * 4, fps, config: SPRING.bouncy});
          return (
            <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * -420}px) rotate(${(1 - s) * (i % 2 ? 24 : -24)}deg)`, opacity: interpolate(s, [0, 0.2], [0, 1], clamp)}}>
              {ch}
            </span>
          );
        })}
      </div>
      <Bottle
        style={{
          position: 'absolute',
          left: 860,
          top: 240,
          width: 300,
          transform: `translateY(${(1 - bottle) * 700 + Math.sin(frame / 18) * 10}px) rotate(${Math.sin(frame / 30) * 3}deg)`,
          filter: 'drop-shadow(0 40px 50px rgba(20,40,90,.3))',
        }}
      />
      <div style={{position: 'absolute', right: 140, top: 600}}>
        <BlurLetters text="Daily" start={40} size={230} weight={300} italic color={blue > 0.5 ? '#ffffff' : '#1f3f8a'} />
      </div>
      <div style={{position: 'absolute', left: 110, top: 520, width: 420, fontFamily: FONT_P, fontSize: 26, lineHeight: 1.35, color: blue > 0.5 ? '#fff' : P.inkSoft}}>
        <BlurLetters text="Clean form. Natural function." start={50} size={26} weight={400} color="inherit" tracking="0" each={0.6} />
      </div>
      <div style={{position: 'absolute', left: 110, bottom: 90, fontFamily: FONT_P, fontSize: 64, fontWeight: 500, color: blue > 0.5 ? '#fff' : P.ink}}>
        <Counter from={46} to={93} start={10} dur={80} suffix="%" />
      </div>
    </Sky>
  );
};
