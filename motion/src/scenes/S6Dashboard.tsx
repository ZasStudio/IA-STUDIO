import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {C, EASE, SPRING} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {GlassCard} from '../components/Glass';
import {KineticText} from '../components/KineticText';
import {PanelContent, WeatherCard} from '../components/UiMock';
import {SelectionBox} from '../components/Decorations';
import {Ribbon} from '../components/Effects';
import {FlyingSparkle, Sparkle} from '../components/Sparkle';
import {tween} from '../lib/motion';

type Panel = {x: number; y: number; w: number; h: number; kind: React.ComponentProps<typeof PanelContent>['kind']; d: number};

const PANELS: Panel[] = [
  {x: 520, y: 170, w: 120, h: 520, kind: 'chips', d: 0},
  {x: 680, y: 170, w: 380, h: 330, kind: 'welcome', d: 4},
  {x: 1090, y: 90, w: 560, h: 120, kind: 'avatars', d: 2},
  {x: 1090, y: 240, w: 560, h: 330, kind: 'chart', d: 8},
  {x: 1680, y: 90, w: 300, h: 300, kind: 'list', d: 10},
  {x: 1680, y: 420, w: 300, h: 300, kind: 'pie', d: 14},
  {x: 680, y: 530, w: 380, h: 300, kind: 'list', d: 12},
  {x: 1090, y: 600, w: 560, h: 230, kind: 'welcome', d: 16},
];

/** Escena 6 — paneles de cristal que vuelan en 3D, "Design shapes the journey", tarjeta de clima y "Clear actions". */
export const S6Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Cámara: de inclinado en perspectiva a plano, luego se aleja a la izquierda.
  const flatten = spring({frame: frame - 10, fps, config: SPRING.heavy});
  const leave = tween(frame, [70, 96], [0, 1], EASE.inOut);

  const weather = spring({frame: frame - 128, fps, config: SPRING.bouncy});
  const weatherOut = tween(frame, [160, 176], [0, 1], EASE.in);

  return (
    <AbsoluteFill>
      <GradientBackground
        blobs={[
          {x: 1500, y: 260, size: 1200, color: C.mint, kind: 'ring', ring: 0.28, opacity: 0.7, blur: 26, seed: 'k1'},
          {x: 600, y: 1150, size: 1300, color: C.teal, opacity: 0.8, seed: 'k2'},
          {x: 1300, y: 1150, size: 900, color: C.mint, opacity: 0.45, seed: 'k3'},
        ]}
      />

      {/* Dashboard en perspectiva */}
      <AbsoluteFill style={{perspective: 1600, opacity: 1 - leave}}>
        <AbsoluteFill
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateX(${-leave * 700}px) translateY(${(1 - flatten) * 60}px) rotateX(${(1 - flatten) * 38}deg) rotateZ(${(1 - flatten) * -12 + leave * 6}deg) scale(${0.82 + flatten * 0.1 - leave * 0.25})`,
          }}
        >
          {PANELS.map((p, i) => {
            const s = spring({frame: frame - p.d, fps, config: SPRING.smooth});
            return (
              <div key={i} style={{position: 'absolute', left: p.x - 200, top: p.y, transform: `translateY(${(1 - s) * 260}px) translateZ(${(1 - s) * -300}px)`}}>
                <GlassCard width={p.w} height={p.h} radius={22} start={p.d} borderWidth={1.2} border={[C.mintSoft, 'rgba(255,255,255,0.06)']} glowBorder={false}>
                  <PanelContent kind={p.kind} start={p.d} />
                </GlassCard>
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      {frame < 96 && <Sparkle size={44} rotate={frame * 3} style={{position: 'absolute', left: 1620, top: 60, opacity: flatten * (1 - leave)}} />}

      {/* "Design shapes the journey" */}
      <KineticText
        x={760}
        y={430}
        size={54}
        lineGap={0.1}
        segments={[
          {text: 'Design', start: 82, weight: 400, color: C.cream, exit: 124},
          {text: 'shapes', start: 92, weight: 800, color: C.lime, br: true, indent: 0.6, exit: 125},
          {
            text: 'the journey',
            start: 102,
            mode: 'scramble',
            weight: 500,
            color: C.lime,
            br: true,
            indent: 0.6,
            exit: 126,
            wrap: (n) => <SelectionBox start={112}>{n}</SelectionBox>,
          },
        ]}
      />

      {/* Tarjeta de clima + "Smart layouts" */}
      <div
        style={{
          position: 'absolute',
          left: 1080,
          top: 450,
          opacity: interpolate(weather, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}) * (1 - weatherOut),
          transform: `translateX(${(1 - weather) * 300 + weatherOut * 400}px) rotate(${(1 - weather) * 14 - 5}deg)`,
        }}
      >
        <WeatherCard />
      </div>
      <KineticText
        x={560}
        y={560}
        size={52}
        segments={[
          {text: 'Smart', start: 132, weight: 800, color: C.lime, exit: 168},
          {text: 'layouts', start: 140, mode: 'type', speed: 2, weight: 400, color: C.cream, exit: 168},
        ]}
      />

      {/* "Clear actions": fichas de cristal + tubo que las conecta (con motion blur de cámara) */}
      <CameraMotionBlur samples={6} shutterAngle={200}>
        <AbsoluteFill>
          {Array.from({length: 7}, (_, i) => {
            const s = spring({frame: frame - 168 - i * 3, fps, config: SPRING.snappy});
            const x = 640 + i * 96;
            return (
              <div key={i} style={{position: 'absolute', left: x + (1 - s) * 900, top: 360, opacity: s}}>
                <GlassCard width={i === 6 ? 220 : 60} height={60} radius={12} start={168 + i * 3} borderWidth={1.2} border={[C.mintSoft, 'rgba(255,255,255,0.1)']} glowBorder={false} />
              </div>
            );
          })}
          {Array.from({length: 6}, (_, i) => {
            const s = spring({frame: frame - 174 - i * 3, fps, config: SPRING.snappy});
            return (
              <div key={`b${i}`} style={{position: 'absolute', left: 640 + i * 110 - (1 - s) * 900, top: 700, opacity: s}}>
                <GlassCard width={i === 2 ? 240 : 64} height={64} radius={12} start={174 + i * 3} borderWidth={1.2} border={[C.mintSoft, 'rgba(255,255,255,0.1)']} glowBorder={false} />
              </div>
            );
          })}
        </AbsoluteFill>
      </CameraMotionBlur>
      <Ribbon d="M 560 470 L 560 420 Q 560 390 600 390 L 700 390 Q 740 390 740 430 L 740 610 Q 740 650 780 650 L 1180 650 Q 1220 650 1220 700" start={186} duration={28} width={30} from={C.mint} to={C.lime} shine={false} style={{filter: `drop-shadow(0 0 10px ${C.lime})`}} />
      <FlyingSparkle
        appear={200}
        size={46}
        keys={[
          {f: 200, x: 560, y: 470, s: 0.6},
          {f: 214, x: 1220, y: 700, s: 1, ease: EASE.inOut},
          {f: 240, x: 1220, y: 700, s: 1},
        ]}
      />
      <KineticText
        x={800}
        y={548}
        size={56}
        segments={[
          {text: 'Clear', start: 192, mode: 'scramble', weight: 400, color: C.cream},
          {text: 'actions', start: 200, weight: 800, color: C.lime, glow: true},
        ]}
      />
    </AbsoluteFill>
  );
};
