import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, SPRING} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {EchoText, GRADIENT_MAPS, GradientMap, MarqueeRows, Ribbon} from '../components/Effects';
import {GlassCard} from '../components/Glass';
import {FlyingSparkle, InkSparkle} from '../components/Sparkle';
import {PhotoPlaceholder} from '../components/UiMock';
import {tween} from '../lib/motion';

/** Escena 5 — modo claro: círculo de cristal esmerilado, "GROWTH" con eco, filas "CLARITY" y cintas en degradado. */
export const S5Light: React.FC<{photo?: string}> = ({photo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const circleIn = spring({frame, fps, config: SPRING.smooth});
  const circleOut = tween(frame, [88, 110], [0, 1], EASE.inOut);
  const clarity = tween(frame, [86, 104], [0, 1]) * (1 - tween(frame, [150, 175], [0, 1]));
  const card = spring({frame: frame - 140, fps, config: SPRING.bouncy});

  return (
    <AbsoluteFill>
      <GradientBackground
        mode="light"
        blobs={[
          {x: 1750, y: 120, size: 900, color: '#e9f77a', opacity: 0.55, seed: 'l1'},
          {x: 250, y: 1000, size: 1000, color: '#bfe8a8', opacity: 0.45, seed: 'l2'},
          {x: 1000, y: 1150, size: 900, color: '#fff7a8', opacity: 0.5, seed: 'l3'},
        ]}
      >
        <MarqueeRows text="CLARITY" y={110} opacity={0.09 * clarity} color={C.ink} speed={3} />
      </GradientBackground>

      {/* Círculo de cristal esmerilado que entra desde la izquierda */}
      <div style={{position: 'absolute', left: interpolate(circleIn, [0, 1], [-700, 120]) - circleOut * 900, top: 280}}>
        <GlassCard width={540} height={540} radius={270} tint="light" border={['#ffffff', '#b9e08a']} borderWidth={1.5} glowBorder={false} />
      </div>

      {/* GROWTH con eco vertical */}
      <EchoText text="GROWTH" x={1120} y={540} start={30} collapse={84} exit={100} size={150} color="#cfe52c" />

      {/* Cintas (tubos) en degradado que se dibujan por detrás de la tarjeta */}
      <Ribbon
        d="M 1150 -80 C 1250 250, 600 260, 520 520 S 900 980, 1300 1200"
        start={92}
        tail={124}
        duration={34}
        width={74}
        from={C.ink}
        to={C.lime}
      />
      <Ribbon
        d="M 760 -60 C 620 160, 520 520, 760 820 S 1500 900, 1520 520 S 1240 200, 1180 420"
        start={140}
        duration={44}
        width={58}
        from={C.ink}
        to={C.lime}
        gradient={[0, 0, 0, 1]}
      />

      {/* Tarjeta con foto (mapa de degradado suave en verde/lima) */}
      <div
        style={{
          position: 'absolute',
          left: 1060 - 360,
          top: 560 - 225,
          width: 720,
          height: 450,
          borderRadius: 24,
          overflow: 'hidden',
          opacity: interpolate(card, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `scale(${interpolate(card, [0, 1], [0.8, 1])}) rotate(${(1 - card) * -6}deg)`,
          boxShadow: '0 30px 70px rgba(30,80,30,.25)',
        }}
      >
        <GradientMap stops={GRADIENT_MAPS.lime} amount={0.55}>
          {photo ? (
            <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <div style={{width: 1920, height: 1080, transform: 'scale(0.375)', transformOrigin: '0 0'}}>
              <PhotoPlaceholder />
            </div>
          )}
        </GradientMap>
      </div>

      {/* Tramo de cinta que pasa POR DELANTE de la tarjeta */}
      <Ribbon d="M 1380 1140 C 1420 900, 1640 820, 1700 620" start={168} duration={22} width={58} from={C.lime} to={C.ink} />

      <FlyingSparkle
        appear={20}
        size={56}
        color={C.ink}
        core={C.inkDeep}
        glowStrength={0}
        keys={[
          {f: 20, x: 2000, y: 260, s: 0.7},
          {f: 40, x: 700, y: 540, s: 1, ease: EASE.out},
          {f: 84, x: 715, y: 540, s: 1},
          {f: 104, x: 1560, y: 230, s: 0.8, ease: EASE.inOut},
          {f: 160, x: 1560, y: 230, s: 0.8},
          {f: 176, x: 1820, y: 900, s: 0.9, ease: EASE.inOut},
        ]}
      />
      {frame > 150 && (
        <InkSparkle
          size={38}
          rotate={frame * 2}
          style={{position: 'absolute', left: 560, top: 820, transform: `scale(${spring({frame: frame - 156, fps, config: SPRING.pop})})`}}
        />
      )}
    </AbsoluteFill>
  );
};
