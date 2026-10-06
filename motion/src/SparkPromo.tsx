import React from 'react';
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {EASE} from './theme';
import {blurZoom, circleReveal, lightSweep} from './components/Transitions';
import {S1Spark} from './scenes/S1Spark';
import {S2IdeaSketch} from './scenes/S2IdeaSketch';
import {S3Grow} from './scenes/S3Grow';
import {S4Photo} from './scenes/S4Photo';
import {S5Light} from './scenes/S5Light';
import {S6Dashboard} from './scenes/S6Dashboard';
import {S7Because, S7Ready} from './scenes/S7Outro';
import {C} from './theme';

export type SparkPromoProps = {
  /** Foto de la escena 4 (ruta dentro de public/, p. ej. "photos/desk.jpg") */
  photo?: string;
  /** Foto de la tarjeta de la escena 5 */
  photo2?: string;
};

const SCENES = [150, 210, 150, 135, 210, 240, 130, 150];
const TRANSITIONS = [20, 18, 22, 24, 20, 18, 24];
export const SPARK_PROMO_DURATION = SCENES.reduce((a, b) => a + b, 0) - TRANSITIONS.reduce((a, b) => a + b, 0);

const t = (frames: number) => linearTiming({durationInFrames: frames, easing: EASE.inOut});

export const SparkPromo: React.FC<SparkPromoProps> = ({photo, photo2}) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENES[0]}>
      <S1Spark />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={blurZoom()} timing={t(TRANSITIONS[0])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[1]}>
      <S2IdeaSketch />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={blurZoom({maxBlur: 30})} timing={t(TRANSITIONS[1])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[2]}>
      <S3Grow />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={lightSweep()} timing={t(TRANSITIONS[2])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[3]}>
      <S4Photo photo={photo} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={circleReveal({x: 50, y: 50, color: C.cream})} timing={t(TRANSITIONS[3])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[4]}>
      <S5Light photo={photo2} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={blurZoom()} timing={t(TRANSITIONS[4])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[5]}>
      <S6Dashboard />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={springTiming({durationInFrames: TRANSITIONS[5], config: {damping: 200}})} />
    <TransitionSeries.Sequence durationInFrames={SCENES[6]}>
      <S7Because />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={circleReveal({x: 100, y: 50, color: C.lime})} timing={t(TRANSITIONS[6])} />
    <TransitionSeries.Sequence durationInFrames={SCENES[7]}>
      <S7Ready />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
