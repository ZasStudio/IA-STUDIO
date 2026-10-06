import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, EASE} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {KineticText} from '../components/KineticText';
import {OrbitRings} from '../components/Effects';
import {FlyingBall, FlyingSparkle} from '../components/Sparkle';
import {tween} from '../lib/motion';

/** Escena 2 — "Idea" (scramble) → "Sketch" (letras que rebotan y viajan por el arco) → "Question". */
export const S2IdeaSketch: React.FC = () => {
  const frame = useCurrentFrame();

  const arc = tween(frame, [100, 142], [0, 38], EASE.inOut);
  const ringsOut = tween(frame, [128, 152], [0, 1], EASE.inOut);
  const part2 = tween(frame, [130, 160], [0, 1], EASE.inOut);

  return (
    <AbsoluteFill>
      <GradientBackground
        blobs={[
          {x: 960, y: 1240, size: 1500, color: C.mint, opacity: 0.85 * (1 - part2 * 0.5), seed: 'm2'},
          {x: 960, y: -200, size: 1100, color: C.teal, opacity: 0.6, seed: 't3'},
          {x: 1480, y: 470, size: 1150, color: C.mint, kind: 'ring', ring: 0.3, opacity: part2 * 0.75, blur: 20, seed: 'd1'},
          {x: 1480, y: 470, size: 560, color: C.abyss, opacity: part2, seed: 'd2'},
        ]}
      />

      <AbsoluteFill style={{transform: `scale(${1 + ringsOut * 0.35})`, opacity: 1 - ringsOut}}>
        <OrbitRings
          start={0}
          rings={[
            {cx: 960, cy: -330, r: 660, speed: 0.5, dots: 2},
            {cx: 960, cy: 1410, r: 660, speed: -0.45, dots: 3},
            {cx: 140, cy: 540, r: 620, speed: 0.35, arc: 0.06},
            {cx: 1780, cy: 540, r: 620, speed: -0.3, arc: 0.08},
          ]}
        />
      </AbsoluteFill>

      {/* "Idea" con scramble */}
      <KineticText x={960} y={540} size={74} align="center" segments={[{text: 'Idea', start: 6, mode: 'scramble', weight: 400, exit: 52}]} />

      {/* "Sketch" rebota letra a letra y luego se desliza por el arco del círculo inferior */}
      <AbsoluteFill style={{transform: `rotate(${arc}deg)`, transformOrigin: '960px 1410px', opacity: 1 - ringsOut}}>
        <KineticText x={960} y={560} size={80} align="center" segments={[{text: 'Sketch', start: 60, mode: 'pop', weight: 800, color: C.lime, glow: true}]} />
      </AbsoluteFill>

      <FlyingBall
        appear={48}
        disappear={104}
        impacts={[66, 84]}
        keys={[
          {f: 48, x: 1420, y: 120, s: 0.6},
          {f: 66, x: 990, y: 470, s: 1.2, ease: EASE.in},
          {f: 76, x: 975, y: 360, s: 0.9, ease: EASE.out},
          {f: 84, x: 965, y: 470, s: 1, ease: EASE.in},
          {f: 96, x: 960, y: 445, s: 0.7, ease: EASE.out},
          {f: 106, x: 1300, y: 300, s: 0.3, ease: EASE.in},
        ]}
      />

      {/* "Question": letras de tamaños/pesos distintos que se asientan con rebote */}
      <KineticText
        x={300}
        y={560}
        size={88}
        segments={[{text: 'Question', start: 150, mode: 'pop', weight: 400, accent: [3], exit: 200}]}
      />

      <FlyingSparkle
        appear={164}
        size={64}
        keys={[
          {f: 164, x: 80, y: 1150, s: 0.5},
          {f: 180, x: 250, y: 640, s: 1, ease: EASE.out},
          {f: 196, x: 260, y: 640, s: 1.1},
          {f: 208, x: 900, y: 580, s: 1.6, ease: EASE.in},
        ]}
      />
      {/* destello de suelo bajo la palabra */}
      <div
        style={{
          position: 'absolute',
          left: 380,
          top: 640,
          width: 14,
          height: 14,
          borderRadius: 10,
          background: C.limeHot,
          boxShadow: `0 0 20px ${C.lime}`,
          opacity: interpolate(frame, [158, 164, 176, 180], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      />
    </AbsoluteFill>
  );
};
