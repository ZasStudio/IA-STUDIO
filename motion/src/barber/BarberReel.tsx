import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {EASE} from '../theme';
import {Card, cardEnd, f, FPS, wt, type CardSpec} from './Editorial';
import {CARDS} from './cards';
import {AlarmPulse, Check, Clip, GloveBadge, PaperTag, Rewind, RollingYear, SmokeBg, StarCover, StarOfLife, Still, VideoFillText} from './Gfx';
import {EUROPE, Globe, USA} from './WorldMap';

/* ------------------------------------------------------------------------------------------
 * Reedición del reel documental con su propio metraje (limpio de subtítulos), la voz original,
 * subtítulos editoriales nuevos con las tipografías de la referencia y escenas gráficas rehechas.
 * Metraje: `python3 -P tools/clean_footage.py <video> <u2net_human_seg.onnx>` → public/barber/
 * ---------------------------------------------------------------------------------------- */

export const BARBER_DURATION = f(118.45);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Fx = 'cut' | 'whip' | 'flash' | 'zoom' | 'blur';
const OVER: Record<Fx, number> = {cut: 0, whip: 7, flash: 6, zoom: 8, blur: 10};

/** Entrada de plano: barrido (whip), destello, zoom o desenfoque, encima del plano anterior. */
const Enter: React.FC<{fx: Fx; children: React.ReactNode}> = ({fx, children}) => {
  const frame = useCurrentFrame();
  const n = OVER[fx];
  const p = n ? interpolate(frame, [0, n], [0, 1], {...clamp, easing: EASE.inOut}) : 1;
  if (fx === 'whip') {
    const blur = Math.sin(p * Math.PI) * 60 + (1 - p) * 30;
    return (
      <AbsoluteFill style={{transform: `translateX(${(1 - p) * 1080}px)`, filter: `blur(${blur * 0.35}px)`}}>
        {children}
      </AbsoluteFill>
    );
  }
  if (fx === 'flash')
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#fff', opacity: 1 - p}} />
      </AbsoluteFill>
    );
  if (fx === 'zoom') return <AbsoluteFill style={{transform: `scale(${1.5 - 0.5 * p})`, filter: `blur(${(1 - p) * 18}px)`, opacity: Math.min(1, p * 2)}}>{children}</AbsoluteFill>;
  if (fx === 'blur') return <AbsoluteFill style={{filter: p < 1 ? `blur(${(1 - p) * 24}px)` : undefined, opacity: p}}>{children}</AbsoluteFill>;
  return <>{children}</>;
};

/** Zoom de "jump cut" en planos de presentadora: cambia de tamaño de plano en cada frase. */
const zoomAt = (frameInShot: number, cuts: [number, number][]) => {
  let z = 1;
  for (const [atFrame, zz] of cuts) if (frameInShot >= atFrame) z = zz;
  return z;
};

type Presenter = {id: string; t0: number; t1: number; src0: number; cuts: [number, number][]; fx: Fx; rewind?: boolean};

/** Planos de presentadora (fondo "modo retrato" + silueta con alfa para texto detrás). */
const PRESENTERS: Presenter[] = [
  {id: 'p_hook', t0: 0, t1: 3.59, src0: 0, cuts: [[0, 1], [f(1.92), 1.16]], fx: 'cut'},
  {id: 'p_retro', t0: 3.62, t1: 4.62, src0: 3.62, cuts: [[0, 1.05]], fx: 'whip', rewind: true},
  {id: 'p_science', t0: 18.95, t1: 20.69, src0: 18.95, cuts: [[0, 1.08], [f(20.05 - 18.95), 1.22]], fx: 'whip'},
  {id: 'p_interest', t0: 36.66, t1: 37.86, src0: 36.66, cuts: [[0, 1.18]], fx: 'zoom'},
  {id: 'p_gloves', t0: 49.47, t1: 54.8, src0: 49.47, cuts: [[0, 1], [f(50.16 - 49.47), 1.12], [f(52.0 - 49.47), 1.0], [f(53.92 - 49.47), 1.16]], fx: 'whip'},
  {id: 'p_today', t0: 103.14, t1: 108.8, src0: 103.14, cuts: [[0, 1], [f(104.35 - 103.14), 1.12], [f(106.03 - 103.14), 1.0], [f(107.39 - 103.14), 1.2]], fx: 'flash'},
  {id: 'p_end', t0: 109.94, t1: 118.45, src0: 109.94, cuts: [[0, 1.05], [f(111.15 - 109.94), 1.16], [f(112.59 - 109.94), 1.0], [f(113.71 - 109.94), 1.1], [f(115.87 - 109.94), 1.0], [f(116.99 - 109.94), 1.22]], fx: 'whip'},
];

const PresenterBase: React.FC<{p: Presenter}> = ({p}) => {
  const frame = useCurrentFrame();
  const z = zoomAt(frame, p.cuts);
  const v = (
    <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 34%'}}>
      <OffthreadVideo src={staticFile(`barber/${p.id}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
  return p.rewind ? <Rewind>{v}</Rewind> : v;
};

const PresenterAlpha: React.FC<{p: Presenter}> = ({p}) => {
  const frame = useCurrentFrame();
  const z = zoomAt(frame, p.cuts);
  const n = OVER[p.fx];
  // durante la transición de entrada la silueta acompaña al plano (whip/zoom)
  const tp = n ? interpolate(frame, [0, n], [0, 1], {...clamp, easing: EASE.inOut}) : 1;
  const enter: React.CSSProperties =
    p.fx === 'whip' ? {transform: `translateX(${(1 - tp) * 1080}px)`} : p.fx === 'zoom' ? {transform: `scale(${1.5 - 0.5 * tp})`, opacity: tp} : {};
  return (
    <AbsoluteFill style={enter}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 34%'}}>
        <OffthreadVideo src={staticFile(`barber/${p.id}_alpha.webm`)} transparent muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------ planos de B-roll y gráficos ------------------------------ */

type Shot = {t0: number; t1: number; fx: Fx; el: React.ReactNode};

const dur = (a: number, b: number) => f(b) - f(a);

const SHOTS: Shot[] = [
  // "A finales del siglo XIX": humo + etiqueta de papel
  {
    t0: 4.59,
    t1: 6.4,
    fx: 'blur',
    el: (
      <>
        <SmokeBg />
        <PaperTagAt text="Siglo XIX" word={20} y={930} />
      </>
    ),
  },
  {t0: 6.32, t1: 8.3, fx: 'whip', el: <Still src="b_barber.png" dur={dur(6.32, 8.3)} from={1.05} to={1.2} ox="45% 30%" tone="warm" />},
  {t0: 8.3, t1: 10.26, fx: 'flash', el: <Still src="b_sepia.png" dur={dur(8.3, 10.26)} from={1.18} to={1.06} pan={[-40, 0]} tone="sepia" />},
  {t0: 10.26, t1: 11.51, fx: 'blur', el: <Still src="b_walk.png" dur={dur(10.26, 11.51)} from={1.02} to={1.12} />},
  {t0: 11.51, t1: 12.05, fx: 'cut', el: <Still src="b_classes.png" dur={dur(11.51, 12.05)} from={1.0} to={1.06} />},
  {t0: 12.05, t1: 12.6, fx: 'zoom', el: <Still src="b_face.png" dur={dur(12.05, 12.6)} from={1.0} to={1.08} ox="50% 80%" />},
  {t0: 12.55, t1: 14.31, fx: 'whip', el: <Still src="b_chair.png" dur={dur(12.55, 14.31)} from={1.05} to={1.22} ox="50% 60%" />},
  {t0: 14.31, t1: 16.39, fx: 'flash', el: <Still src="b_cape.png" dur={dur(14.31, 16.39)} from={1.1} to={1.0} />},
  // "Nadie se detenía a pensar": la presentadora desenfocada como fondo tipográfico
  {
    t0: 16.39,
    t1: 18.95,
    fx: 'blur',
    el: <Clip src="p_hook.mp4" dur={dur(16.39, 18.95)} zoom={[1.15, 1.25]} filter="blur(22px) brightness(.55) saturate(.8)" />,
  },
  {t0: 20.69, t1: 22.65, fx: 'zoom', el: <Clip src="c_phone1.mp4" dur={dur(20.69, 22.65)} zoom={[1, 1.06]} />},
  {t0: 22.65, t1: 36.66, fx: 'blur', el: <Clip src="c_phone2.mp4" dur={dur(22.65, 36.66)} zoom={[1, 1.08]} />},
  // "Esta revelación encendió una alarma": hospital desenfocado + pulso rojo
  {
    t0: 37.83,
    t1: 39.96,
    fx: 'flash',
    el: (
      <>
        <Still src="b_hospital.png" dur={dur(37.83, 39.96)} from={1.25} to={1.32} tone="warm" />
        <AbsoluteFill style={{backdropFilter: 'blur(14px) brightness(.7)'}} />
        <AlarmAt word={112} />
      </>
    ),
  },
  {t0: 39.96, t1: 41.21, fx: 'blur', el: <Still src="b_hospital.png" dur={dur(39.96, 41.21)} from={1.02} to={1.12} tone="warm" />},
  {t0: 41.21, t1: 42.88, fx: 'whip', el: <Still src="b_bwbarbers.png" dur={dur(41.21, 42.88)} from={1.15} to={1.03} pan={[30, 0]} tone="bw" />},
  // MAPA: décadas → Estados Unidos → Europa → obsesión por la higiene
  {
    t0: 42.88,
    t1: 49.47,
    fx: 'blur',
    el: <MapScene />,
  },
  {t0: 54.8, t1: 58.85, fx: 'whip', el: <Clip src="c_product.mp4" dur={dur(54.8, 58.85)} zoom={[1.02, 1.1]} />},
  // "El momento clave llegó alrededor de 1905"
  {
    t0: 58.85,
    t1: 62.23,
    fx: 'flash',
    el: (
      <>
        <AbsoluteFill style={{background: '#020308'}} />
        <Sequence from={f(59.3) - f(58.85)}>
          <Clip src="c_earth.mp4" dur={dur(59.3, 62.23)} zoom={[1, 1.06]} ox="50% 100%" />
        </Sequence>
        <StarCover />
        <YearAt />
      </>
    ),
  },
  {t0: 62.23, t1: 65.94, fx: 'whip', el: <Clip src="c_inspector.mp4" dur={dur(62.23, 65.94)} zoom={[1.0, 1.08]} />},
  // "En esa misma ÉPOCA"
  {
    t0: 65.94,
    t1: 68.2,
    fx: 'blur',
    el: (
      <>
        <SmokeBg base="#6a737e" />
        <EpocaWhip />
      </>
    ),
  },
  {t0: 68.1, t1: 71.24, fx: 'flash', el: <Still src="b_roosevelt.png" dur={dur(68.1, 71.24)} from={1.0} to={1.1} ox="50% 30%" />},
  // "impulsaban reformas de salud pública y limpieza"
  {
    t0: 71.24,
    t1: 75.41,
    fx: 'blur',
    el: (
      <>
        <SmokeBg base="#5f6a76" />
        <StarOfLifeAt />
      </>
    ),
  },
  {t0: 75.41, t1: 80.96, fx: 'whip', el: <Clip src="c_neck.mp4" dur={dur(75.41, 80.96)} zoom={[1, 1.08]} ox="50% 35%" />},
  {t0: 80.96, t1: 84.38, fx: 'zoom', el: <Clip src="c_head.mp4" dur={dur(80.96, 84.38)} zoom={[1, 1.06]} />},
  {
    t0: 84.38,
    t1: 88.59,
    fx: 'flash',
    el: (
      <>
        <Still src="b_torn.png" dur={dur(84.38, 88.59)} from={1.0} to={1.06} />
        <CheckAt />
      </>
    ),
  },
  // "Papel nuevo, cliente nuevo"
  {t0: 88.59, t1: 92.93, fx: 'blur', el: <Clip src="p_today.mp4" dur={dur(88.59, 92.93)} zoom={[1.2, 1.3]} filter="blur(22px) brightness(.5) saturate(.8)" />},
  {t0: 92.93, t1: 97.9, fx: 'flash', el: <Clip src="c_tv.mp4" dur={dur(92.93, 97.9)} zoom={[1, 1.1]} />},
  {t0: 97.9, t1: 98.77, fx: 'whip', el: <Clip src="c_dance.mp4" dur={dur(97.9, 98.77)} zoom={[1.15, 1.2]} />},
  {t0: 98.77, t1: 100.35, fx: 'cut', el: <Clip src="c_sinatra.mp4" dur={dur(98.77, 100.35)} zoom={[1.0, 1.08]} />},
  {t0: 100.35, t1: 103.14, fx: 'whip', el: <Clip src="c_twomen.mp4" dur={dur(100.35, 103.14)} zoom={[1.0, 1.08]} />},
  // "PERO ES UN RECORDATORIO" con video dentro de las letras
  {
    t0: 108.8,
    t1: 109.94,
    fx: 'flash',
    el: (
      <VideoFillText
        src="p_end.mp4"
        startFrom={0}
        lines={[
          {text: 'Pero', at: wt(289) - f(108.8), size: 330},
          {text: 'es un', at: wt(290) - f(108.8), size: 330},
          {text: 'recordatorio', at: wt(292) - f(108.8), size: 172},
        ]}
      />
    ),
  },
];

const TAIL = 10;

/** Si la tarjeta siguiente cae en la misma zona, la anterior termina de salir justo antes. */
const SCHEDULED: CardSpec[] = CARDS.map((c, i) => {
  const yc = c.y ?? 470;
  const next = CARDS.slice(i + 1).find((n) => Math.abs((n.y ?? 470) - yc) < 320 && !!n.behind === !!c.behind);
  if (!next) return c;
  const ns = wt(next.w[0]);
  return cardEnd(c) + 6 > ns ? {...c, end: (ns - 6) / FPS} : c;
});

/** Todos los planos base (presentadora + B-roll) ordenados por tiempo de entrada. */
const BASE: Shot[] = [...PRESENTERS.map((p): Shot => ({t0: p.t0, t1: p.t1, fx: p.fx, el: <PresenterBase p={p} />})), ...SHOTS].sort((a, b) => a.t0 - b.t0);

/* --- piezas con tiempos de palabra (se renderizan dentro de su Sequence: frames locales) --- */

function PaperTagAt({text, word, y}: {text: string; word: number; y: number}) {
  return <PaperTag text={text} at={wt(word) - f(4.59)} x={540} y={y} />;
}

function AlarmAt({word}: {word: number}) {
  return <AlarmPulse at={wt(word) - f(37.83)} />;
}

function YearAt() {
  return <RollingYear from={1840} to={1905} at={wt(170) - f(58.85)} dur={wt(172) - wt(170) + 4} y={850} />;
}

function CheckAt() {
  return <Check at={wt(234) - f(84.38)} x={540} y={900} />;
}

function StarOfLifeAt() {
  return <StarOfLife at={wt(193) - f(71.24)} y={1180} size={560} />;
}

function EpocaWhip() {
  const frame = useCurrentFrame();
  const at = wt(184) - f(65.94);
  const d = frame - at;
  if (d < 0) return null;
  // la palabra entra barrida en horizontal con desenfoque de movimiento rojo
  const p = interpolate(d, [0, 8], [0, 1], {...clamp, easing: EASE.out});
  return (
    <div
      style={{
        position: 'absolute',
        left: 540,
        top: 900,
        transform: `translate(-50%,-50%) translateX(${(1 - p) * 700}px) scaleX(${1 + (1 - p) * 1.4})`,
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
        fontSize: 230,
        color: '#ff2b3c',
        filter: `blur(${(1 - p) * 16}px)`,
        textShadow: '0 0 30px rgba(255,40,60,.7)',
      }}
    >
      época
    </div>
  );
}

export function MapScene() {
  const t = (sec: number) => f(sec) - f(42.88);
  const frame = useCurrentFrame();
  const globeIn = interpolate(frame, [t(43.4), t(44.5)], [0, 1], {...clamp, easing: EASE.out});
  const globeOut = interpolate(frame, [t(46.95), t(47.5)], [0, 1], {...clamp, easing: EASE.in});
  return (
    <>
      <SmokeBg base="#5b646f" />
      <AbsoluteFill style={{opacity: interpolate(frame, [t(44.7), t(45.1)], [1, 0], clamp)}}>
        <RollingYear from={1861} to={1899} at={t(43.3)} dur={t(44.6) - t(43.3)} y={650} size={140} color="#d9e1ea" />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: globeIn * (1 - globeOut), transform: `scale(${0.85 + 0.15 * globeIn + globeOut * 0.4})`, filter: globeOut > 0 ? `blur(${globeOut * 14}px)` : undefined}}>
        <Globe
          cy={1220}
          radius={430}
          keys={[
            {f: t(43.4), rot: [40, -15], scale: 0.9},
            {f: t(45.2), rot: [98, -38], scale: 1.25},
            {f: t(46.1), rot: [98, -38], scale: 1.25},
            {f: t(46.7), rot: [-14, -50], scale: 1.35},
          ]}
          highlights={[
            {ids: USA, at: t(45.4), until: t(46.2), label: 'Estados Unidos', labelDy: 330},
            {ids: EUROPE, at: t(46.45), label: 'Europa', labelDy: 330},
          ]}
        />
      </AbsoluteFill>
      <GloveBadge at={t(47.7)} y={1080} size={330} />
    </>
  );
}

/* ------------------------------------------ montaje ------------------------------------------ */

export const BarberReel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('barber/voice.wav')} />

      {/* 1) planos base ordenados en el tiempo: cada uno entra (whip, destello, zoom…) sobre la
             cola del anterior, que se prolonga TAIL frames por debajo */}
      {BASE.map((b, i) => (
        <Sequence key={i} from={f(b.t0)} durationInFrames={f(b.t1) - f(b.t0) + TAIL}>
          <Enter fx={b.fx}>{b.el}</Enter>
        </Sequence>
      ))}

      {/* 2) subtítulos DETRÁS de la presentadora */}
      {SCHEDULED.filter((c) => c.behind).map((c, i) => (
        <Card key={`b${i}`} {...c} />
      ))}

      {/* 3) silueta de la presentadora (video con canal alfa) encima del texto */}
      {PRESENTERS.map((p) => (
        <Sequence key={`a${p.id}`} from={f(p.t0)} durationInFrames={f(p.t1) - f(p.t0)}>
          <PresenterAlpha p={p} />
        </Sequence>
      ))}

      {/* 4) subtítulos delante */}
      {SCHEDULED.filter((c) => !c.behind).map((c, i) => (
        <Card key={`f${i}`} {...c} />
      ))}

      {/* 5) acabado: viñeta + grano + fundido final */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%)', pointerEvents: 'none'}} />
      <FilmGrain />
      <FadeOut />
    </AbsoluteFill>
  );
};

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 30;
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`bg${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#bg${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [BARBER_DURATION - 12, BARBER_DURATION], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null;
};
