import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Car3D} from './Car3D';
import {TechBg} from './kit';

/** Prueba: giro 360° del auto para comprobar orientación e iluminación. */
export const Car3DTest: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TechBg />
      <Car3D rotY={frame * 3} />
    </AbsoluteFill>
  );
};
