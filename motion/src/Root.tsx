import React from 'react';
import {Composition, Folder} from 'remotion';
import './fonts';
import {SparkPromo, SPARK_PROMO_DURATION, type SparkPromoProps} from './SparkPromo';
import {S1Spark} from './scenes/S1Spark';
import {S2IdeaSketch} from './scenes/S2IdeaSketch';
import {S3Grow} from './scenes/S3Grow';
import {S4Photo} from './scenes/S4Photo';
import {S5Light} from './scenes/S5Light';
import {S6Dashboard} from './scenes/S6Dashboard';
import {S7Because, S7Ready} from './scenes/S7Outro';
import {PromptPromo, PROMPT_PROMO_DURATION, PROMPT_SCENES} from './prompt/PromptPromo';
import {MonitorReel} from './prompt/MonitorReel';

const V = {fps: 30, width: 1920, height: 1080} as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SparkPromo" component={SparkPromo} durationInFrames={SPARK_PROMO_DURATION} defaultProps={{} as SparkPromoProps} {...V} />
    <Folder name="Escenas">
      <Composition id="S1-Spark" component={S1Spark} durationInFrames={150} {...V} />
      <Composition id="S2-IdeaSketch" component={S2IdeaSketch} durationInFrames={210} {...V} />
      <Composition id="S3-Grow" component={S3Grow} durationInFrames={150} {...V} />
      <Composition id="S4-Photo" component={S4Photo} durationInFrames={135} defaultProps={{} as {photo?: string}} {...V} />
      <Composition id="S5-Light" component={S5Light} durationInFrames={210} defaultProps={{} as {photo?: string}} {...V} />
      <Composition id="S6-Dashboard" component={S6Dashboard} durationInFrames={240} {...V} />
      <Composition id="S7a-Because" component={S7Because} durationInFrames={130} {...V} />
      <Composition id="S7b-Ready" component={S7Ready} durationInFrames={150} {...V} />
    </Folder>

    {/* Estilo 2: promo SaaS "Prompt" (+ versión reel vertical dentro de un monitor) */}
    <Composition id="PromptPromo" component={PromptPromo} durationInFrames={PROMPT_PROMO_DURATION} {...V} />
    <Composition id="PromptReel" component={MonitorReel} durationInFrames={PROMPT_PROMO_DURATION} fps={30} width={1080} height={1920} />
    <Folder name="Escenas-Prompt">
      {PROMPT_SCENES.map(({id, dur, C}) => (
        <Composition key={id} id={`P-${id}`} component={C} durationInFrames={dur} {...V} />
      ))}
    </Folder>
  </>
);
