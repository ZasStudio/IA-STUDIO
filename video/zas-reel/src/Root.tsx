import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {DURATION_S, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="ZasReel" component={Reel} durationInFrames={DURATION_S * FPS} fps={FPS} width={1080} height={1920} />
);
