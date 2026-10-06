import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {EASE, SPRING} from '../../theme';
import {tween} from '../../lib/motion';
import {BlurLetters, Sky} from '../components/Basics';
import {FlowerLogo, Thumb, type MockKind} from '../components/Visuals';
import {FONT_P, P} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const FAN: {kind: MockKind; x: number; y: number; r: number; ry: number}[] = [
  {kind: 'windpower', x: 760, y: 820, r: 8, ry: -18},
  {kind: 'oceanview', x: 980, y: 860, r: -6, ry: 14},
  {kind: 'nature', x: 560, y: 700, r: -12, ry: 22},
  {kind: 'refresh', x: 360, y: 560, r: -18, ry: 26},
  {kind: 'aiapp', x: 1240, y: 900, r: 10, ry: -10},
  {kind: 'vision', x: 540, y: 430, r: 14, ry: 18},
  {kind: 'market', x: 820, y: 360, r: -10, ry: -16},
  {kind: 'fast', x: 300, y: 300, r: 6, ry: 20},
];

/**
 * J — "no longer start / with code": tarjetas de webs que vuelan en ABANICO 3D desde abajo
 * (stagger + muelle) con motion blur de cámara, y salen disparadas hacia arriba.
 */
export const PCascade: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leave = tween(frame, [100, 122], [0, 1], EASE.in);
  return (
    <Sky layers={[{mode: 'white'}]} glow="rgba(140,196,255,0.2)">
      <CameraMotionBlur samples={8} shutterAngle={220}>
        <AbsoluteFill style={{perspective: 1600}}>
          {FAN.map((c, i) => {
            const s = spring({frame: frame - 10 - i * 5, fps, config: SPRING.snappy});
            const x = interpolate(s, [0, 1], [-200, c.x]) - leave * (900 + i * 60);
            const y = interpolate(s, [0, 1], [1400, c.y]) - leave * (1300 + i * 40);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x - 260,
                  top: y - 146,
                  transform: `rotateZ(${c.r + (1 - s) * 40 - leave * 20}deg) rotateY(${c.ry * (1 - s * 0.6)}deg)`,
                  zIndex: i,
                }}
              >
                <Thumb kind={c.kind} width={520} radius={18} />
              </div>
            );
          })}
        </AbsoluteFill>
      </CameraMotionBlur>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', zIndex: 20}}>
        <BlurLetters text="no " start={2} exit={60} size={92} weight={400} color={P.ink} />
        <BlurLetters text="longer " start={7} exit={61} size={92} weight={700} color={P.ink} />
        <BlurLetters text="start" start={12} exit={62} size={92} weight={400} gradient={[P.inkSoft, '#9cc8ff']} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', zIndex: 20}}>
        <BlurLetters text="with " start={66} exit={104} size={92} weight={400} color={P.ink} />
        <BlurLetters text="code" start={70} exit={106} size={92} weight={500} gradient={[P.blue, '#7fb2ff']} />
      </div>
    </Sky>
  );
};

/** K — El logo-flor FLORECE en la oscuridad, gira, encoge y se convierte en marca "ia studio". */
export const PLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bloom = tween(frame, [0, 60], [0, 1], EASE.out);
  const grow = spring({frame, fps, config: SPRING.heavy});
  const shrink = spring({frame: frame - 78, fps, config: SPRING.smooth});
  const gradient = tween(frame, [82, 112], [0, 1], EASE.inOut);
  const size = interpolate(shrink, [0, 1], [interpolate(grow, [0, 1], [180, 760]), 120]);
  const cx = interpolate(shrink, [0, 1], [960, 760]);
  return (
    <Sky layers={[{mode: 'night'}, {mode: 'deep', opacity: gradient}]} glow="rgba(140,170,255,0.2)">
      <div style={{position: 'absolute', left: cx - size / 2, top: 540 - size / 2, filter: `drop-shadow(0 0 ${40 * (1 - shrink) + 10}px rgba(120,140,255,.6))`}}>
        <FlowerLogo size={size} bloom={bloom} rotate={frame * 0.6} />
      </div>
      <div style={{position: 'absolute', left: 850, top: 540, transform: 'translateY(-50%)'}}>
        <BlurLetters text="ia studio" start={100} size={130} weight={500} gradient={['#ffffff', '#cfe0ff']} />
      </div>
    </Sky>
  );
};

/**
 * L — "Now it starts with a prompt": el icono sustituye a la "o" de "Now" y se queda en el centro
 * mientras las palabras cambian alrededor; al final, "a prompt" se SELECCIONA como en un editor.
 */
export const PNowPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const icon = spring({frame: frame - 2, fps, config: SPRING.bouncy});
  const iconOut = tween(frame, [84, 96], [0, 1], EASE.in);
  const gap = interpolate(tween(frame, [36, 48], [0, 1], EASE.inOut), [0, 1], [62, 96]);
  const sel = tween(frame, [120, 134], [0, 1], EASE.inOut);
  const words: React.CSSProperties = {position: 'absolute', top: 540, transform: 'translateY(-50%)'};
  const grad: [string, string] = ['#ffffff', '#9cc8ff'];
  return (
    <Sky layers={[{mode: 'deep'}]}>
      <div style={{...words, right: 960 + gap}}>
        <BlurLetters text="N" start={0} exit={36} size={170} weight={400} gradient={grad} />
      </div>
      <div style={{...words, left: 960 + gap}}>
        <BlurLetters text="w" start={4} exit={36} size={170} weight={400} gradient={grad} />
      </div>
      <div style={{...words, right: 960 + gap}}>
        <BlurLetters text="it" start={42} exit={84} size={170} weight={400} gradient={grad} />
      </div>
      <div style={{...words, left: 960 + gap}}>
        <BlurLetters text="starts" start={46} exit={84} size={170} weight={400} gradient={grad} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 960 - 65,
          top: 540 - 50,
          opacity: 1 - iconOut,
          transform: `scale(${icon * (1 - iconOut * 0.6)}) rotate(${iconOut * 120}deg)`,
          filter: iconOut > 0 ? `blur(${iconOut * 12}px)` : undefined,
        }}
      >
        <FlowerLogo size={130} rotate={frame * 1.2} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 540, transform: 'translateY(-50%)', textAlign: 'center'}}>
        <BlurLetters text="with " start={92} size={130} weight={400} gradient={grad} />
        <span style={{position: 'relative', display: 'inline-block'}}>
          <span
            style={{
              position: 'absolute',
              left: -10,
              top: 6,
              bottom: 0,
              width: `calc(${sel * 100}% + 20px)`,
              background: 'rgba(160,200,255,0.35)',
              borderRadius: 6,
            }}
          />
          <span style={{position: 'absolute', left: -14, top: 4, bottom: -4, width: 5, borderRadius: 3, background: '#fff', opacity: frame > 116 ? 1 : 0}} />
          <BlurLetters text="a prompt" start={100} size={130} weight={400} gradient={grad} />
        </span>
      </div>
      <div style={{position: 'absolute', left: 60, top: 44, fontFamily: FONT_P, fontWeight: 600, fontSize: 30, color: 'rgba(255,255,255,0.75)', opacity: tween(frame, [130, 150], [0, 1])}}>ia studio</div>
    </Sky>
  );
};
