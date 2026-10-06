import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {C} from '../theme';

/* ---------- Zoom con desenfoque (la escena saliente "atraviesa" la cámara) ---------- */
type BlurZoomProps = {maxBlur?: number};

const BlurZoomComp: React.FC<TransitionPresentationComponentProps<BlurZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const blur = passedProps.maxBlur ?? 40;
  const exiting = presentationDirection === 'exiting';
  const style: React.CSSProperties = exiting
    ? {transform: `scale(${1 + p * 0.6})`, filter: `blur(${p * blur}px) brightness(${1 + p * 0.6})`, opacity: 1 - p}
    : {transform: `scale(${0.85 + p * 0.15})`, filter: `blur(${(1 - p) * blur}px)`, opacity: Math.min(1, p * 1.6)};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const blurZoom = (props: BlurZoomProps = {}): TransitionPresentation<BlurZoomProps> => ({component: BlurZoomComp, props});

/* ---------- Revelado circular con borde brillante (mancha que crece) ---------- */
type CircleProps = {x?: number; y?: number; color?: string};

const CircleComp: React.FC<TransitionPresentationComponentProps<CircleProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const x = passedProps.x ?? 50;
  const y = passedProps.y ?? 50;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 + p * 0.08})`, filter: `blur(${p * 10}px)`}}>{children}</AbsoluteFill>;
  }
  const r = interpolate(p, [0, 1], [0, 150]);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `circle(${r + 3}% at ${x}% ${y}%)`,
          background: passedProps.color ?? C.lime,
          filter: 'blur(6px)',
        }}
      />
      <AbsoluteFill style={{clipPath: `circle(${r}% at ${x}% ${y}%)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const circleReveal = (props: CircleProps = {}): TransitionPresentation<CircleProps> => ({component: CircleComp, props});

/* ---------- Barrido de luz: un haz lima desenfocado cruza la pantalla ---------- */
const LightSweepComp: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{opacity: 1 - Math.max(0, (p - 0.45) * 2), filter: `blur(${p * 18}px)`}}>{children}</AbsoluteFill>;
  }
  const x = interpolate(p, [0, 1], [-60, 160]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: Math.max(0, (p - 0.4) * 1.7), filter: `blur(${(1 - p) * 18}px)`}}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(100deg, transparent ${x - 40}%, ${C.lime}cc ${x - 8}%, ${C.yellow} ${x}%, ${C.mint}aa ${x + 10}%, transparent ${x + 40}%)`,
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
          opacity: Math.sin(p * Math.PI),
        }}
      />
    </AbsoluteFill>
  );
};

export const lightSweep = (): TransitionPresentation<Record<string, never>> => ({component: LightSweepComp, props: {}});
