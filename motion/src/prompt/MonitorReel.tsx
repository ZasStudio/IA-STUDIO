import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {Grain} from '../components/GradientBackground';
import {PromptPromo, PROMPT_SCENES} from './PromptPromo';
import {FONT_P} from './theme';

/**
 * Formato "reel de agencia" (9:16): el promo se reproduce dentro de After Effects en un monitor,
 * grabado con el móvil en una habitación cálida. Cámara en mano (ruido), profundidad de campo
 * en el teclado, viñeta, grano y etalonaje cálido.
 */
const VIEW_W = 900; // ancho del visor de composición (px dentro del monitor)

const AeTimeline: React.FC<{w: number; h: number}> = ({w, h}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const left = 230;
  const trackW = w - left - 20;
  const colors = ['#c0504d', '#4f81bd', '#9bbb59', '#8064a2', '#f79646', '#4bacc6'];
  let acc = 0;
  const starts = PROMPT_SCENES.map((s) => {
    const a = acc;
    acc += s.dur;
    return a;
  });
  const total = acc;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 44, height: h, background: '#1d1d1f', borderTop: '2px solid #2b2b2e', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left, right: 20, top: 8, height: 18, background: '#262629'}}>
        {Array.from({length: 12}, (_, i) => (
          <span key={i} style={{position: 'absolute', left: (i / 12) * trackW, top: 1, fontSize: 11, color: '#8a8a90', fontFamily: 'monospace'}}>
            {`${i * 5}s`}
          </span>
        ))}
      </div>
      {Array.from({length: 11}, (_, r) => (
        <div key={r} style={{position: 'absolute', left: 0, right: 0, top: 32 + r * 17, height: 16, borderBottom: '1px solid #262628'}}>
          <div style={{position: 'absolute', left: 10, top: 2, width: left - 30, height: 10, display: 'flex', gap: 6}}>
            <div style={{width: 10, height: 10, background: '#3b3b40'}} />
            <div style={{flex: 1, height: 8, marginTop: 1, background: '#3a3a3f', borderRadius: 2, width: 60 + random(`n${r}`) * 80}} />
          </div>
          {starts.map((s0, i) =>
            random(`b${r}-${i}`) > 0.55 ? (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: left + (s0 / total) * trackW + random(`o${r}${i}`) * 20,
                  width: (PROMPT_SCENES[i].dur / total) * trackW * (0.4 + random(`w${r}${i}`) * 0.6),
                  top: 2,
                  height: 12,
                  background: colors[(r + i) % colors.length],
                  opacity: 0.85,
                  borderRadius: 2,
                }}
              />
            ) : null,
          )}
        </div>
      ))}
      <div style={{position: 'absolute', left: left + (frame / durationInFrames) * trackW, top: 6, bottom: 0, width: 2, background: '#3e8ef7'}} />
    </div>
  );
};

const AeWindow: React.FC = () => {
  const toolbar = Array.from({length: 22}, (_, i) => i);
  return (
    <AbsoluteFill style={{background: '#232326', fontFamily: 'system-ui, sans-serif'}}>
      {/* barra de menús y herramientas */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 26, background: '#1a1a1c', color: '#9a9aa0', fontSize: 13, display: 'flex', gap: 18, padding: '5px 14px'}}>
        {['File', 'Edit', 'Composition', 'Layer', 'Effect', 'Animation', 'View', 'Window', 'Help'].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 26, height: 38, background: '#28282b', display: 'flex', gap: 10, alignItems: 'center', padding: '0 14px'}}>
        {toolbar.map((i) => (
          <div key={i} style={{width: 18, height: 18, borderRadius: 3, border: '1.5px solid #8d8d95', opacity: 0.7}} />
        ))}
      </div>
      {/* paneles laterales */}
      <div style={{position: 'absolute', left: 0, top: 64, width: 150, bottom: 276, background: '#202023', borderRight: '2px solid #2d2d30'}}>
        {Array.from({length: 12}, (_, i) => (
          <div key={i} style={{margin: '10px 12px', height: 9, width: 50 + random(`p${i}`) * 70, background: '#3a3a3f', borderRadius: 2}} />
        ))}
      </div>
      <div style={{position: 'absolute', right: 0, top: 64, width: 150, bottom: 276, background: '#202023', borderLeft: '2px solid #2d2d30'}}>
        <div style={{margin: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6}}>
          {Array.from({length: 9}, (_, i) => (
            <div key={i} style={{height: 30, borderRadius: 4, background: '#5b5bd6', opacity: 0.85}} />
          ))}
        </div>
      </div>
      {/* visor de la composición: ¡aquí se reproduce el promo! */}
      <div style={{position: 'absolute', left: 214, top: 80, width: VIEW_W, height: (VIEW_W * 9) / 16, background: '#000', overflow: 'hidden', boxShadow: '0 0 0 1px #000'}}>
        <div style={{width: 1920, height: 1080, transform: `scale(${VIEW_W / 1920})`, transformOrigin: '0 0'}}>
          <PromptPromo />
        </div>
      </div>
      <AeTimeline w={1328} h={232} />
      {/* barra de tareas */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, background: '#1b1b1e', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
        {['#3e8ef7', '#999', '#f7c23e', '#31a8ff', '#9999ff', '#ea77ff', '#00c8ff'].map((c, i) => (
          <div key={i} style={{width: 26, height: 26, borderRadius: 6, background: c, opacity: 0.85}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const MonitorReel: React.FC = () => {
  const frame = useCurrentFrame();
  // cámara en mano: deriva lenta + micro-temblor
  const hx = noise2D('hx', frame * 0.012, 0) * 14 + noise2D('hx2', frame * 0.08, 0) * 1.5;
  const hy = noise2D('hy', 0, frame * 0.012) * 12 + noise2D('hy2', 0, frame * 0.08) * 1.5;
  const hr = noise2D('hr', frame * 0.01, 3) * 0.6;
  const zoom = 1.04 + noise2D('hz', frame * 0.006, 5) * 0.02;
  return (
    <AbsoluteFill style={{background: '#1a0d05', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${hx}px, ${hy}px) rotate(${hr}deg) scale(${zoom})`}}>
        {/* pared con luz de lámpara */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 45% at 50% 0%, #ffd7a0 0%, #e8a35c 30%, #9a5a24 60%, #3a1d0a 100%)'}} />
        {/* escritorio de madera */}
        <div style={{position: 'absolute', left: -100, right: -100, top: 1330, bottom: -100, background: 'linear-gradient(180deg,#e9b77a 0%,#c98f4f 25%,#7a4b20 70%,#2a170a 100%)'}} />
        {/* soporte del monitor */}
        <div style={{position: 'absolute', left: 300, top: 1150, width: 110, height: 330, background: 'linear-gradient(90deg,#1c1c1c,#3a3a3a 50%,#151515)', borderRadius: 14}}>
          <div style={{position: 'absolute', left: 32, top: 60, width: 46, height: 110, borderRadius: 23, background: '#f2c48c', opacity: 0.85}} />
        </div>
        <div style={{position: 'absolute', left: 120, top: 1440, width: 620, height: 120, background: 'linear-gradient(180deg,#d9d6d0,#9c968c)', transform: 'perspective(600px) rotateX(55deg)', borderRadius: 18, boxShadow: '0 30px 40px rgba(0,0,0,.5)'}} />
        {/* teclado desenfocado (profundidad de campo) */}
        <div style={{position: 'absolute', left: 60, top: 1600, width: 1100, height: 330, transform: 'perspective(900px) rotateX(48deg) rotateZ(-6deg)', filter: 'blur(5px)', background: '#141414', borderRadius: 30, padding: 26, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 10}}>
          {Array.from({length: 75}, (_, i) => (
            <div key={i} style={{background: '#262626', borderRadius: 8, boxShadow: 'inset 0 -3px 0 #0c0c0c'}} />
          ))}
        </div>
        {/* monitor en perspectiva */}
        <div style={{position: 'absolute', left: -60, top: 300, width: 1360, height: 900, perspective: 2000}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#0b0b0c',
              borderRadius: 18,
              padding: 16,
              transform: 'rotateY(-9deg) rotateX(3deg)',
              transformOrigin: '0% 50%',
              boxShadow: '0 40px 80px rgba(0,0,0,.6)',
            }}
          >
            <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 4}}>
              <AeWindow />
              {/* reflejo/brillo de la pantalla */}
              <AbsoluteFill style={{background: 'linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 35%, transparent 70%, rgba(255,210,150,0.06) 100%)'}} />
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', right: 70, top: 150, fontFamily: FONT_P, fontWeight: 600, fontSize: 96, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.72)'}}>ia studio</div>
      </AbsoluteFill>
      {/* etalonaje cálido + viñeta + grano */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, transparent 40%, rgba(20,8,0,0.65) 100%)'}} />
      <AbsoluteFill style={{background: 'rgba(255,150,60,0.08)', mixBlendMode: 'soft-light'}} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
