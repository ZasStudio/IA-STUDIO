import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {PixelBlocks, pixelMask} from './components/Basics';

type Empty = Record<string, never>;

/** Disolución con desenfoque: la escena saliente se desenfoca mientras la entrante se enfoca. */
const BlurDissolveComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress: p}) => {
  const out = presentationDirection === 'exiting';
  const style: React.CSSProperties = out
    ? {filter: `blur(${p * 28}px)`, opacity: 1 - p * 0.6, transform: `scale(${1 + p * 0.04})`}
    : {filter: `blur(${(1 - p) * 28}px)`, opacity: p, transform: `scale(${1.04 - p * 0.04})`};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
export const blurDissolve = (): TransitionPresentation<Empty> => ({component: BlurDissolveComp, props: {}});

/** Mosaico de píxeles: la escena nueva aparece por bloques, con un frente de bloques de color. */
const PixelateComp: React.FC<TransitionPresentationComponentProps<Empty>> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{filter: `blur(${p * 6}px)`}}>{children}</AbsoluteFill>;
  }
  const mask = pixelMask(p * 1.12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}}>{children}</AbsoluteFill>
      <PixelBlocks progress={p * 1.12} />
    </AbsoluteFill>
  );
};
export const pixelate = (): TransitionPresentation<Empty> => ({component: PixelateComp, props: {}});
