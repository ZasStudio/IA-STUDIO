import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Star} from '@remotion/shapes';
import {C, EASE, SPRING} from '../theme';
import {GradientBackground} from '../components/GradientBackground';
import {KineticText} from '../components/KineticText';
import {GlassCard} from '../components/Glass';
import {SelectionBox} from '../components/Decorations';
import {FlyingSparkle, Sparkle} from '../components/Sparkle';
import {tween} from '../lib/motion';

/** Escena 3 — tarjeta de cristal con la chispa + "What if this could [grow]?" */
export const S3Grow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame: frame - 2, fps, config: SPRING.bouncy});
  const wobble = spring({frame: frame - 70, fps, config: SPRING.pop});
  const toDiamond = spring({frame: frame - 96, fps, config: SPRING.snappy});
  const fade = tween(frame, [122, 140], [0, 1]);

  const rot = interpolate(enter, [0, 1], [-40, -14]) + wobble * 10 + toDiamond * 49;
  const scale = interpolate(enter, [0, 1], [0.7, 1]) * interpolate(toDiamond, [0, 1], [1, 0.55]);
  const cx = interpolate(toDiamond, [0, 1], [1330, 1180]);
  const cy = interpolate(toDiamond, [0, 1], [470, 640]);
  const beam = tween(frame, [0, 40], [0, 1]);

  return (
    <AbsoluteFill>
      <GradientBackground
        blobs={[
          {x: 520, y: 520, size: 1250, color: C.forest, kind: 'ring', ring: 0.35, opacity: 0.9, seed: 'g1'},
          {x: 1100, y: 1150, size: 1100, color: C.mint, opacity: 0.6, seed: 'g2'},
        ]}
      >
        {/* Haz de luz lima diagonal */}
        <div
          style={{
            position: 'absolute',
            left: 1080,
            top: -260,
            width: 520,
            height: 1500,
            background: `radial-gradient(ellipse closest-side, ${C.limeHot}, ${C.lime}aa 40%, transparent 100%)`,
            transform: `rotate(35deg) scaleY(${0.6 + beam * 0.4})`,
            filter: 'blur(50px)',
            opacity: 0.85 * beam * (1 - fade * 0.4),
            mixBlendMode: 'screen',
          }}
        />
        {/* Círculo teal nítido y engranaje (Star de @remotion/shapes) */}
        <div style={{position: 'absolute', left: 1640, top: -60, width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle at 35% 70%, ${C.mint}, ${C.teal})`, opacity: 0.85, filter: 'blur(1.5px)'}} />
        <div style={{position: 'absolute', left: 1600, top: 640, transform: `rotate(${frame * 0.3}deg)`, opacity: 0.7, filter: 'blur(1px)'}}>
          <Star points={16} innerRadius={300} outerRadius={330} cornerRadius={18} fill={C.teal} />
        </div>
      </GradientBackground>

      {/* Tarjeta de cristal: entra girando con rebote, tiembla y termina como rombo */}
      <div
        style={{
          position: 'absolute',
          left: cx - 170,
          top: cy - 170,
          width: 340,
          height: 340,
          transform: `rotate(${rot}deg) scale(${scale})`,
          opacity: 1 - fade,
        }}
      >
        <GlassCard width={340} height={340} radius={44} start={2} border={[C.limeHot, 'rgba(255,255,255,0.12)']}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              opacity: interpolate(toDiamond, [0, 0.5], [1, 0], {extrapolateRight: 'clamp'}),
            }}
          >
            {frame < 104 && <Sparkle size={92} rotate={frame * 1.5} color={C.lime} core="#ffd33d" glowStrength={1.2} />}
          </div>
        </GlassCard>
      </div>

      <FlyingSparkle
        appear={104}
        size={92}
        color={C.lime}
        core="#ffd33d"
        keys={[
          {f: 104, x: cx, y: cy, s: 0.6},
          {f: 120, x: 230, y: 900, s: 2.2, ease: EASE.inOut},
          {f: 132, x: 200, y: 880, s: 2.1},
          {f: 148, x: -260, y: 980, s: 1.4, ease: EASE.in},
        ]}
      />

      <KineticText
        x={110}
        y={920}
        size={46}
        segments={[
          {text: 'What', start: 14, exit: 108},
          {text: 'if', start: 18, exit: 109},
          {text: 'this', start: 22, exit: 110},
          {text: 'could', start: 26, exit: 111},
          {
            text: 'grow',
            start: 44,
            mode: 'pop',
            weight: 800,
            color: C.lime,
            glow: true,
            exit: 112,
            wrap: (n) => <SelectionBox start={62}>{n}</SelectionBox>,
          },
          {text: '?', start: 56, mode: 'blurUp', exit: 113},
        ]}
      />
    </AbsoluteFill>
  );
};
