import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, EASE} from '../theme';
import {GRADIENT_MAPS, GradientMap} from '../components/Effects';
import {KineticText} from '../components/KineticText';
import {DotGrid, HighlightSweep} from '../components/Decorations';
import {Grain} from '../components/GradientBackground';
import {PhotoPlaceholder} from '../components/UiMock';
import {FlyingSparkle} from '../components/Sparkle';
import {tween} from '../lib/motion';

/**
 * Escena 4 — Foto con MAPA DE DEGRADADO + desenfoque de profundidad + retícula de puntos.
 * Pasa `photo` (ruta dentro de public/) para usar tu propia imagen.
 */
export const S4Photo: React.FC<{photo?: string}> = ({photo}) => {
  const frame = useCurrentFrame();
  const kenBurns = interpolate(frame, [0, 135], [1.14, 1.0], {easing: EASE.out});
  const amount = tween(frame, [0, 36], [0.3, 0.92], EASE.inOut);
  const blur = tween(frame, [0, 30], [16, 5]);
  const dots = tween(frame, [10, 40], [0, 0.55]);

  return (
    <AbsoluteFill style={{background: C.deep, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${kenBurns})`}}>
        <GradientMap stops={GRADIENT_MAPS.forest} amount={amount} blur={blur}>
          {photo ? <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <PhotoPlaceholder />}
        </GradientMap>
      </AbsoluteFill>

      {/* tinte lateral para legibilidad del texto */}
      <AbsoluteFill style={{background: `linear-gradient(90deg, ${C.abyss}cc 0%, ${C.abyss}55 40%, transparent 70%)`}} />
      <DotGrid opacity={dots} mask="radial-gradient(ellipse 45% 55% at 62% 45%, #000 30%, transparent 75%)" />

      <KineticText
        x={260}
        y={430}
        size={72}
        lineGap={0.05}
        segments={[
          {text: 'Turning', start: 12, weight: 300, color: C.lime, exit: 118},
          {
            text: 'Ideas',
            start: 26,
            weight: 800,
            color: C.cream,
            br: true,
            exit: 120,
            wrap: (n) => (
              <HighlightSweep start={34} from={C.teal} to={C.lime} textColor={C.inkDeep}>
                {n}
              </HighlightSweep>
            ),
          },
          {text: 'into', start: 50, weight: 300, color: C.lime, br: true, indent: 0.4, exit: 122},
          {text: 'experiences', start: 56, mode: 'scramble', weight: 800, color: C.lime, glow: true, exit: 124},
        ]}
      />

      <FlyingSparkle
        appear={88}
        size={70}
        keys={[
          {f: 88, x: 2050, y: 420, s: 0.6},
          {f: 104, x: 1180, y: 760, s: 1.1, ease: EASE.out},
          {f: 120, x: 1210, y: 740, s: 1.2},
          {f: 135, x: 960, y: 540, s: 2.4, ease: EASE.inOut},
        ]}
      />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};
