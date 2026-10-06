import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, SPRING, glow} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {KineticText} from '../components/KineticText';
import {TogglePill} from '../components/Glass';
import {Burst, Cursor} from '../components/Decorations';
import {FlyingSparkle} from '../components/Sparkle';
import {pathAt, tween} from '../lib/motion';

/** Escena 1 — "Everything starts with a [Spark]": toggle + cursor + chispa que forma un anillo. */
export const S1Spark: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // El anillo lima del fondo baja desde la izquierda hacia el borde inferior.
  const ring = pathAt(frame, [
    {f: 0, x: 260, y: 420},
    {f: 70, x: 560, y: 1160, ease: EASE.inOut},
    {f: 150, x: 700, y: 1220},
  ]);

  const pillIn = spring({frame: frame - 50, fps, config: SPRING.bouncy});
  const toggle = interpolate(frame, [84, 98], [0, 1], {easing: EASE.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const cur = pathAt(frame, [
    {f: 56, x: 1560, y: 860},
    {f: 80, x: 1330, y: 548, ease: EASE.out},
    {f: 100, x: 1330, y: 548},
    {f: 118, x: 1470, y: 700, ease: EASE.inOut},
  ]);
  const press = interpolate(frame, [80, 83, 90], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Colapso: el texto se encoge hacia la píldora y la chispa sale disparada al centro.
  const collapse = tween(frame, [110, 126], [0, 1], EASE.in);
  const ringP = spring({frame: frame - 126, fps, config: SPRING.pop});

  return (
    <AbsoluteFill>
      <GradientBackground
        blobs={[
          {x: ring.x, y: ring.y, size: 1250, color: C.lime, kind: 'ring', ring: 0.2, opacity: 0.95, blur: 24, seed: 'r1'},
          {x: 1700, y: 960, size: 1100, color: C.mint, opacity: 0.55, seed: 'm1'},
          {x: 1050, y: -160, size: 1200, color: C.teal, opacity: 0.8, seed: 't1'},
          {x: 200, y: 1100, size: 900, color: C.teal, opacity: 0.6, seed: 't2'},
        ]}
      />

      <AbsoluteFill
        style={{
          transform: `scaleX(${1 - collapse * 0.85})`,
          transformOrigin: '1300px 540px',
          opacity: 1 - collapse,
          filter: collapse > 0 ? `blur(${collapse * 10}px)` : undefined,
        }}
      >
        <KineticText
          x={1150}
          y={540}
          size={58}
          align="right"
          segments={[
            {text: 'Everything', start: 6, weight: 700, color: C.lime, glow: true},
            {text: 'starts', start: 26, weight: 500, color: C.lime},
            {text: 'with', start: 36, weight: 400, color: C.lime},
            {text: 'a', start: 44, weight: 400, color: C.lime},
          ]}
        />
        <TogglePill x={1172} y={545} t={toggle} appear={pillIn} />
      </AbsoluteFill>

      <Burst x={1385} y={545} start={92} radius={110} />
      {frame >= 56 && frame < 125 && <Cursor x={cur.x} y={cur.y} press={press} opacity={interpolate(frame, [56, 60, 116, 122], [0, 1, 1, 0])} />}

      <FlyingSparkle
        appear={110}
        size={70}
        keys={[
          {f: 110, x: 1385, y: 545, s: 0.8},
          {f: 128, x: 960, y: 540, s: 1.4, ease: EASE.inOut},
          {f: 150, x: 960, y: 540, s: 1.2},
        ]}
      />

      {/* Anillo brillante que nace alrededor de la chispa */}
      {frame >= 124 && (
        <div
          style={{
            position: 'absolute',
            left: 960 - 120,
            top: 540 - 120,
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: `16px solid ${C.limeHot}`,
            transform: `scale(${interpolate(ringP, [0, 1], [0.3, 1])})`,
            opacity: interpolate(ringP, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
            filter: glow(C.lime, 1.2),
          }}
        />
      )}
    </AbsoluteFill>
  );
};
