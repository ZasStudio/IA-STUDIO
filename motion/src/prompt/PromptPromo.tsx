import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {EASE} from '../theme';
import {blurDissolve, pixelate} from './transitions';
import {PDashboard, PIntro} from './scenes/Intro';
import {PPrototype, PRefresh, PShowcase, PWindow} from './scenes/Showcase';
import {PEverything, PFaster, PWheel} from './scenes/Faster';
import {PCascade, PLogo, PNowPrompt} from './scenes/Finale';

/** Escenas en orden, con su duración (frames a 30 fps). */
export const PROMPT_SCENES: {id: string; dur: number; C: React.FC}[] = [
  {id: 'Intro', dur: 150, C: PIntro},
  {id: 'Dashboard', dur: 150, C: PDashboard},
  {id: 'Showcase', dur: 120, C: PShowcase},
  {id: 'Window', dur: 165, C: PWindow},
  {id: 'Prototype', dur: 120, C: PPrototype},
  {id: 'Refresh', dur: 150, C: PRefresh},
  {id: 'Wheel', dur: 210, C: PWheel},
  {id: 'Faster', dur: 240, C: PFaster},
  {id: 'Everything', dur: 110, C: PEverything},
  {id: 'Cascade', dur: 130, C: PCascade},
  {id: 'Logo', dur: 170, C: PLogo},
  {id: 'NowPrompt', dur: 170, C: PNowPrompt},
];

/** Duración de cada transición (entre la escena i y la i+1). La primera es el mosaico de píxeles. */
const TRANS = [20, 14, 14, 12, 14, 14, 14, 14, 10, 14, 16];

export const PROMPT_PROMO_DURATION = PROMPT_SCENES.reduce((a, s) => a + s.dur, 0) - TRANS.reduce((a, b) => a + b, 0);

export const PromptPromo: React.FC = () => (
  <TransitionSeries>
    {PROMPT_SCENES.flatMap(({id, dur, C}, i) => {
      const nodes = [
        <TransitionSeries.Sequence key={id} durationInFrames={dur}>
          <C />
        </TransitionSeries.Sequence>,
      ];
      if (i < TRANS.length) {
        nodes.push(
          <TransitionSeries.Transition
            key={`${id}-t`}
            presentation={i === 0 ? pixelate() : blurDissolve()}
            timing={linearTiming({durationInFrames: TRANS[i], easing: EASE.inOut})}
          />,
        );
      }
      return nodes;
    })}
  </TransitionSeries>
);
