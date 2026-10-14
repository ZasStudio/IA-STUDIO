import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type Dir = {dir?: 1 | -1};

/**
 * WHIP PAN: las dos tomas se deslizan en horizontal con desenfoque de movimiento
 * direccional (feGaussianBlur con desviación solo en X). Pico de desenfoque a mitad.
 */
const WhipComp: React.FC<TransitionPresentationComponentProps<Dir>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const id = 'whip' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const dir = passedProps.dir ?? 1;
  const blur = Math.sin(p * Math.PI) * 70;
  const x = presentationDirection === 'exiting' ? -p * 1080 * dir : (1 - p) * 1080 * dir;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, filter: `url(#${id})`}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-20%" y="0" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      {children}
    </AbsoluteFill>
  );
};
export const whip = (dir: 1 | -1 = 1): TransitionPresentation<Dir> => ({component: WhipComp, props: {dir}});

/** Corte con destello blanco: la toma saliente se quema a blanco y la entrante sale del blanco. */
const FlashComp: React.FC<TransitionPresentationComponentProps<Dir>> = ({children, presentationDirection, presentationProgress: p}) => {
  const out = presentationDirection === 'exiting';
  const white = out ? Math.min(1, p * 2) : Math.max(0, 1 - p * 2);
  return (
    <AbsoluteFill style={{opacity: out ? (p < 0.5 ? 1 : 0) : p >= 0.5 ? 1 : 0}}>
      {children}
      <AbsoluteFill style={{background: '#fff', opacity: white}} />
    </AbsoluteFill>
  );
};
export const flashCut = (): TransitionPresentation<Dir> => ({component: FlashComp, props: {}});

/** Zoom de entrada: la toma nueva llega desde muy cerca con desenfoque (punch-in brusco). */
const ZoomComp: React.FC<TransitionPresentationComponentProps<Dir>> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') return <AbsoluteFill style={{transform: `scale(${1 + p * 0.5})`, filter: `blur(${p * 20}px)`, opacity: 1 - p}}>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{transform: `scale(${1.6 - 0.6 * p})`, filter: `blur(${(1 - p) * 20}px)`, opacity: Math.min(1, p * 2)}}>{children}</AbsoluteFill>;
};
export const zoomIn = (): TransitionPresentation<Dir> => ({component: ZoomComp, props: {}});
