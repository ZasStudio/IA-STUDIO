import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, SPRING} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {KineticText} from '../components/KineticText';
import {HighlightSweep} from '../components/Decorations';
import {Ribbon} from '../components/Effects';
import {InkSparkle} from '../components/Sparkle';
import {tween} from '../lib/motion';

/** Flor de contorno que se dibuja trazo a trazo (pathLength=1 + strokeDasharray). */
const OutlineFlower: React.FC<{x: number; y: number; size: number; start: number}> = ({x, y, size, start}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `rotate(${frame * 0.15}deg)`}}>
      {Array.from({length: 7}, (_, i) => {
        const p = tween(frame, [start + i * 4, start + i * 4 + 30], [0, 1], EASE.inOut);
        return (
          <ellipse
            key={i}
            cx={0}
            cy={-52}
            rx={26}
            ry={50}
            transform={`rotate(${(i * 360) / 7})`}
            fill="none"
            stroke={C.lime}
            strokeOpacity={0.55}
            strokeWidth={1.4}
            pathLength={1}
            strokeDasharray={`${p} 1`}
          />
        );
      })}
    </svg>
  );
};

/** Escena 7a — "Because great design isn't just how it looks" (máquina de escribir + pop). */
export const S7Because: React.FC = () => (
  <AbsoluteFill>
    <GradientBackground
      blobs={[
        {x: 520, y: 260, size: 1300, color: C.mint, kind: 'ring', ring: 0.25, opacity: 0.55, blur: 30, seed: 'o1'},
        {x: 1500, y: 1200, size: 1100, color: C.teal, opacity: 0.7, seed: 'o2'},
      ]}
    >
      <OutlineFlower x={1560} y={900} size={820} start={6} />
    </GradientBackground>
    <KineticText
      x={140}
      y={520}
      size={74}
      lineGap={0.06}
      segments={[
        {text: 'Because', start: 4, mode: 'type', speed: 2, weight: 400, color: C.cream},
        {text: 'great', start: 22, mode: 'type', speed: 2, weight: 400, color: C.cream, br: true},
        {text: 'design', start: 36, mode: 'type', speed: 2, weight: 400, color: C.cream, br: true},
        {text: "isn't just", start: 50, mode: 'type', speed: 2, weight: 400, color: C.cream, br: true},
        {text: 'how it looks', start: 74, mode: 'pop', weight: 800, color: C.lime, glow: true, br: true, indent: 0.2},
      ]}
    />
  </AbsoluteFill>
);

const PopInkSparkle: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: SPRING.pop});
  return (
    <span style={{display: 'inline-block', transform: `translateY(0.12em) scale(${s}) rotate(${frame * 2}deg)`}}>
      <InkSparkle size={44} />
    </span>
  );
};

/** Escena 7b — modo claro: "It's how it [works]" con barrido de degradado → "Ready to grow?" */
export const S7Ready: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 150], [1.04, 1], {easing: EASE.out});
  const swoosh = tween(frame, [66, 92], [0, 1], EASE.inOut);
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`}}>
      <GradientBackground
        mode="light"
        blobs={[
          {x: 200, y: 300, size: 1000, color: '#f3f78a', opacity: 0.55, seed: 'w1'},
          {x: 1500, y: 300, size: 1100, color: '#c6eaa6', opacity: 0.45, seed: 'w2'},
          {x: 900, y: 1150, size: 1000, color: '#fff3a0', opacity: 0.5, seed: 'w3'},
        ]}
      />
      <KineticText
        x={960}
        y={540}
        size={60}
        align="center"
        gap={0.22}
        segments={[
          {text: '', start: 0, mode: 'none', exit: 68, wrap: () => <PopInkSparkle start={4} />},
          {text: "It's", start: 10, weight: 400, color: C.ink, exit: 66},
          {text: 'how', start: 16, weight: 400, color: C.ink, exit: 66},
          {text: 'it', start: 22, weight: 400, color: C.ink, exit: 67},
          {
            text: 'works',
            start: 28,
            weight: 800,
            color: C.ink,
            exit: 68,
            wrap: (n) => (
              <HighlightSweep start={34} from={C.ink} to={C.lime} textColor={C.cream}>
                {n}
              </HighlightSweep>
            ),
          },
        ]}
      />
      {/* swoosh: pequeño arco que gira mientras cambia la frase */}
      {swoosh > 0 && swoosh < 1 && (
        <Ribbon
          d="M 905 470 A 60 60 0 0 1 1010 500"
          start={66}
          tail={74}
          duration={18}
          width={10}
          from={C.ink}
          to={C.ink}
          shine={false}
          style={{transform: `rotate(${swoosh * 160}deg)`, transformOrigin: '960px 540px'}}
        />
      )}
      <KineticText
        x={960}
        y={540}
        size={60}
        align="center"
        gap={0.22}
        segments={[
          {text: '', start: 0, mode: 'none', wrap: () => <PopInkSparkle start={84} />},
          {text: 'Ready to grow?', start: 88, mode: 'type', speed: 2, weight: 400, color: C.ink},
        ]}
      />
    </AbsoluteFill>
  );
};
