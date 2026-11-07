import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Car3D} from './Car3D';
import {clamp, CR, ease, TechBg} from './kit';
import {EASE} from '../theme';

/* Pasadas 3D del auto CON su fondo, pre-renderizadas aparte (el render 3D por software es lento y el
   video con alfa compone mal los reflejos):
   npx remotion render CarHook3D public/carreport/car/hook.mp4 --concurrency=1 --gl=swangle --crf=16
   npx remotion render CarDanger3D public/carreport/car/danger.mp4 --concurrency=1 --gl=swangle --crf=16
   (--gl=swangle = WebGL por software; el resto del proyecto usa angle, mucho más rápido para efectos 2D) */

export const HOOK_LEN = 156;
export const DANGER_LEN = 198;

export const CarHook3D: React.FC = () => {
  const frame = useCurrentFrame();
  const drive = interpolate(frame, [0, 34], [0, 1], {...clamp, easing: EASE.out});
  const brake = Math.max(0, Math.sin(interpolate(frame, [30, 46], [0, Math.PI], clamp))) * 3;
  return (
    <AbsoluteFill>
      <TechBg />
      <Car3D
        x={-11 + drive * 11}
        rotY={-32 + brake * 2}
        cam={[interpolate(frame, [0, HOOK_LEN], [5, 2]), interpolate(frame, [0, HOOK_LEN], [2.8, 2.0]) - brake * 0.04, interpolate(frame, [0, HOOK_LEN], [16.5, 14.5])]}
        target={[0, 0.75, 0]}
        fov={30}
      />
    </AbsoluteFill>
  );
};

export const CarDanger3D: React.FC = () => {
  const frame = useCurrentFrame();
  const wire = ease(frame, 4, 20);
  const scan = (frame % 50) / 50;
  return (
    <AbsoluteFill>
      <TechBg tint={CR.red} />
      <Car3D
        rotY={interpolate(frame, [0, DANGER_LEN], [-70, 40])}
        wire={wire}
        wireColor={CR.red}
        rim={CR.red}
        scan={wire > 0.5 ? scan * 2 - 1 : null}
        cam={[0, 2.8, 16]}
        target={[0, 0.6, 0]}
        fov={30}
      />
    </AbsoluteFill>
  );
};
