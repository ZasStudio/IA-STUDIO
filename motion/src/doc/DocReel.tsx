import React, {createContext, useContext} from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {EASE, SPRING} from '../theme';
import {F, StackCard} from './Captions';
import {
  DottedArrow,
  EarthLimb,
  Figure,
  Grade,
  Microbes,
  PaperLabel,
  PaperRoll,
  PhoneTap,
  PresenterPlate,
  PushIn,
  Smoke,
  Sticker,
  TornLayer,
  TvWall,
  WavingFlag,
  YearCounter,
} from './Kit';
import {flashCut, whip, zoomIn} from './transitions';

/* ---------------------------------------------------------------------------------------
 * Reel documental (9:16): presentador + B-roll de "archivo" + subtítulos editoriales.
 * Si pasas `presenter` (video en public/ grabado siguiendo el guion), sustituye al
 * presentador dibujado; cada plano de presentador reproduce su tramo del video.
 * ------------------------------------------------------------------------------------- */

export type DocReelProps = {presenter?: string};

const Ctx = createContext<{presenter?: string; offset: number}>({offset: 0});

/** Plano de presentador con jump-cut (zoom distinto en cada plano). */
const Presenter: React.FC<{zoom?: number; cy?: number; blur?: number; dim?: number}> = ({zoom = 1, cy = 0.45, blur = 0, dim = 0}) => {
  const {presenter, offset} = useContext(Ctx);
  const frame = useCurrentFrame();
  const drift = 1 + interpolate(frame, [0, 120], [0, 0.03]);
  return (
    <AbsoluteFill style={{filter: blur ? `blur(${blur}px) brightness(${1 - dim})` : dim ? `brightness(${1 - dim})` : undefined}}>
      {presenter ? (
        <AbsoluteFill style={{transform: `scale(${zoom * drift})`, transformOrigin: `50% ${cy * 100}%`}}>
          <OffthreadVideo src={staticFile(presenter)} startFrom={offset} muted={false} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      ) : (
        <PresenterPlate zoom={zoom * drift} cy={cy} />
      )}
    </AbsoluteFill>
  );
};

/* ================================ ESCENAS ================================ */

const SHook: React.FC = () => (
  <Grade>
    <Presenter zoom={1} />
    <StackCard text="¿*POR *QUÉ / _tenemos _que / *PONER" at={4} end={44} gap={7} y={430} />
    <StackCard text="*EL / *PAPEL / _de / *CUELLO?" at={50} end={92} gap={8} y={430} />
  </Grade>
);

const SWho: React.FC = () => (
  <Grade>
    <Presenter zoom={1.2} cy={0.42} />
    <StackCard text="_y _quiénes / *FUERON / _los·que·lo / *INVENTARON!@magenta^" at={2} end={66} gap={8} y={430} />
  </Grade>
);

const SCentury: React.FC = () => (
  <Grade tone="bw">
    <PushIn dur={84} to={1.15}>
      <Smoke />
    </PushIn>
    <StackCard text="_a _fines _del" at={6} end={80} gap={6} y={760} size={1.5} />
    <PaperLabel text="Siglo XIX" at={26} x={540} y={900} size={96} color="#1b1b1b" />
  </Grade>
);

const SClasses: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const figs: {kind: 'tophat' | 'suit' | 'worker'; x: number; d: number}[] = [
    {kind: 'tophat', x: 230, d: 4},
    {kind: 'suit', x: 540, d: 14},
    {kind: 'worker', x: 840, d: 24},
  ];
  return (
    <Grade tone="sepia">
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#d8d4cc,#a8a39a)'}} />
      {figs.map((f) => {
        const s = spring({frame: frame - f.d, fps, config: SPRING.snappy});
        return (
          <div key={f.kind} style={{position: 'absolute', left: f.x - 110, top: 880 + (1 - s) * 700, opacity: s}}>
            <Sticker>
              <Figure kind={f.kind} h={560} color={f.kind === 'worker' ? '#3b2f25' : '#1d1a18'} />
            </Sticker>
          </div>
        );
      })}
      <DottedArrow d="M230 860 C 200 760, 260 700, 300 660" at={12} />
      <DottedArrow d="M540 860 C 560 740, 500 640, 560 560" at={22} />
      <DottedArrow d="M840 860 C 880 780, 820 720, 800 690" at={32} />
      <StackCard text="*CLASE _alta" at={14} end={66} y={630} x={330} size={0.5} color="#1a1a1a" />
      <StackCard text="*CLASE _media" at={24} end={66} y={530} x={600} size={0.5} color="#1a1a1a" />
      <StackCard text="*CLASE _baja" at={34} end={66} y={650} x={790} size={0.5} color="#1a1a1a" />
      <StackCard text="*SE *SENTABAN / _en _la _misma / *SILLA@red!" at={68} end={116} gap={8} y={520} color="#1a1a1a" />
    </Grade>
  );
};

const SNobody: React.FC = () => (
  <Grade>
    <Presenter zoom={1.05} blur={18} dim={0.35} />
    <StackCard text="*NADIE / _se·detenía _a / ~PENSAR / _en / lo·que·pasaba" at={4} end={90} gap={9} y={860} size={1.15} />
  </Grade>
);

const SScience: React.FC = () => (
  <Grade>
    <Presenter zoom={1.1} cy={0.4} />
    <StackCard text="*HASTA _que _la / *CIENCIA@cyan^" at={2} end={32} gap={7} y={430} />
    <StackCard text="_lo / *HIZO+" at={36} end={62} gap={6} y={430} />
  </Grade>
);

const SPhone: React.FC = () => (
  <Grade>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #4b5563, #1f242c 75%)'}} />
    <PhoneTap
      enter={0}
      taps={[48, 96]}
      screens={[
        <AbsoluteFill key="a" style={{background: 'radial-gradient(circle at 50% 40%, #a07a4a, #3a2614 75%)', display: 'grid', placeItems: 'center', filter: 'sepia(.6)'}}>
          <Figure kind="tophat" h={640} color="#1a120c" />
        </AbsoluteFill>,
        <Microbes key="b" count={12} />,
        <Microbes key="c" count={22} />,
      ]}
    />
    <StackCard text="_En / *1861@blue^" at={4} end={42} gap={8} y={300} size={0.85} />
    <StackCard text="*LOUIS *PASTEUR / _famoso _científico _francés" at={46} end={92} gap={7} y={300} size={0.7} />
    <StackCard text="_organismos / *MICROSCÓPICOS@cyan^ / _por _contacto" at={98} end={146} gap={8} y={300} size={0.75} />
  </Grade>
);

const SInteresting: React.FC = () => (
  <Grade>
    <Presenter zoom={1.28} cy={0.4} />
    <StackCard text="*INTERESANTE / *¿NO?+" at={2} end={50} gap={8} y={460} />
  </Grade>
);

const SDecades: React.FC = () => (
  <Grade tone="bw">
    <Smoke base="#5d6670" />
    <StackCard text="*DURANTE / _las _siguientes / *DÉCADAS" at={4} end={62} gap={10} y={700} exit="dust" />
    <YearCounter from={1861} to={1899} at={36} dur={40} x={540} y={980} size={130} color="#c9ced6" />
  </Grade>
);

const SKeyMoment: React.FC = () => (
  <Grade vignette={0.3}>
    <PushIn dur={105} to={1.08} ox="50% 100%">
      <EarthLimb />
    </PushIn>
    <StackCard text="_El _momento / *CLAVE@blue^ / _llegó" at={4} end={100} gap={8} y={420} />
    <StackCard text="alrededor·de" at={36} end={100} y={650} size={0.75} />
    <YearCounter from={1840} to={1905} at={40} dur={36} x={540} y={790} size={190} />
  </Grade>
);

const SReforms: React.FC = () => (
  <Grade>
    <Smoke base="#7b8591" density={0.8} />
    <WavingFlag x={150} y={1000} />
    <PaperLabel text="Theodore Roosevelt" at={8} x={540} y={560} size={84} rot={-2} />
    <StackCard text="_impulsó / *REFORMAS / _de _salud" at={40} end={92} gap={8} y={800} size={0.9} />
  </Grade>
);

const SBarrier: React.FC = () => (
  <Grade vignette={0.25}>
    <AbsoluteFill style={{background: '#c4cbd3'}} />
    <TornLayer top={260} color="#6f99a0" seed="teal" enter={0} />
    <TornLayer top={1260} color="#c99a78" seed="skin" texture enter={6} />
    <StackCard text="*UNA / *BARRERA / *PERFECTA!@red / _entre _la _piel / =del·cliente@red^" at={14} end={112} gap={8} y={760} />
  </Grade>
);

const SRoll: React.FC = () => (
  <Grade>
    <Smoke base="#7f9da2" color="#e8f0f2" density={0.7} />
    <PaperRoll x={540} y={1100} size={420} />
    <StackCard text="_Un _simple / *PAPEL / _alrededor _del _cuello" at={4} end={92} gap={8} y={520} />
  </Grade>
);

const SNewPaper: React.FC = () => (
  <Grade>
    <Presenter zoom={1.05} blur={18} dim={0.4} />
    <StackCard text="*PAPEL / *NUEVO / ~CLIENTE / _nuevo+" at={2} end={44} gap={8} y={860} size={1.1} />
    <StackCard text="*SIN / *CONTACTO / _y·sin / *RIESGO@red^" at={50} end={92} gap={8} y={860} size={1.1} />
  </Grade>
);

const STv: React.FC = () => (
  <Grade tone="sepia">
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #3a3a2e, #0d0d0a 80%)'}} />
    <PushIn dur={96} to={1.1}>
      <TvWall />
    </PushIn>
    <StackCard text="_Incluso / *PERSONAJES / _icónicos·de·la·época" at={4} end={46} gap={8} y={480} size={0.85} />
    <StackCard text="*DORADA@purple^ / _del / *CINE" at={50} end={92} gap={8} y={480} />
  </Grade>
);

const SReminder: React.FC = () => {
  const frame = useCurrentFrame();
  const word = (t: string, at: number, size: number) => {
    const p = interpolate(frame - at, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
    return (
      <div
        style={{
          fontFamily: F.cond,
          fontSize: size,
          lineHeight: 0.86,
          textTransform: 'uppercase',
          opacity: p,
          transform: `scale(${1.3 - 0.3 * p})`,
          filter: `blur(${(1 - p) * 8}px)`,
          // texto "relleno de imagen": el degradado hace de foto dentro de las letras
          background: 'linear-gradient(160deg,#1a1f27 0%,#3a4452 35%,#c9a37c 52%,#262b33 70%,#0d0f13 100%)',
          backgroundSize: '200% 200%',
          backgroundPosition: `${frame}% 50%`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {t}
      </div>
    );
  };
  return (
    <Grade vignette={0.15}>
      <AbsoluteFill style={{background: '#f2f2f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 60}}>
        {word('Pero', 4, 250)}
        {word('es un', 12, 250)}
        {word('recordatorio', 20, 150)}
      </AbsoluteFill>
    </Grade>
  );
};

const SEnding: React.FC = () => (
  <Grade>
    <Presenter zoom={1.12} cy={0.42} />
    <StackCard text="_la / *BARBERÍA / _se·construye·con / *CONFIANZA@magenta^" at={4} end={68} gap={8} y={430} />
    <StackCard text="*PROTEGE / _a _tu / *CLIENTE!@cyan" at={74} end={118} gap={8} y={430} />
  </Grade>
);

/* ================================ MONTAJE ================================ */

type T = 'cut' | 'whip' | 'whipL' | 'flash' | 'zoom';

const SCENES: {C: React.FC; dur: number; next?: T}[] = [
  {C: SHook, dur: 96, next: 'cut'},
  {C: SWho, dur: 72, next: 'whip'},
  {C: SCentury, dur: 84, next: 'flash'},
  {C: SClasses, dur: 120, next: 'whip'},
  {C: SNobody, dur: 96, next: 'whipL'},
  {C: SScience, dur: 66, next: 'zoom'},
  {C: SPhone, dur: 150, next: 'flash'},
  {C: SInteresting, dur: 54, next: 'zoom'},
  {C: SDecades, dur: 84, next: 'cut'},
  {C: SKeyMoment, dur: 105, next: 'whip'},
  {C: SReforms, dur: 96, next: 'flash'},
  {C: SBarrier, dur: 120, next: 'cut'},
  {C: SRoll, dur: 96, next: 'whip'},
  {C: SNewPaper, dur: 96, next: 'zoom'},
  {C: STv, dur: 96, next: 'flash'},
  {C: SReminder, dur: 84, next: 'whipL'},
  {C: SEnding, dur: 120},
];

const TLEN: Record<T, number> = {cut: 0, whip: 7, whipL: 7, flash: 6, zoom: 8};

export const DOC_REEL_DURATION = SCENES.reduce((a, s) => a + s.dur - (s.next ? TLEN[s.next] : 0), 0);

export const DocReel: React.FC<DocReelProps> = ({presenter}) => {
  let offset = 0;
  const nodes: React.ReactNode[] = [];
  SCENES.forEach(({C, dur, next}, i) => {
    nodes.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={dur}>
        <Ctx.Provider value={{presenter, offset}}>
          <C />
        </Ctx.Provider>
      </TransitionSeries.Sequence>,
    );
    offset += dur - (next ? TLEN[next] : 0);
    if (next && next !== 'cut') {
      const presentation = next === 'whip' ? whip(1) : next === 'whipL' ? whip(-1) : next === 'flash' ? flashCut() : zoomIn();
      nodes.push(<TransitionSeries.Transition key={`t${i}`} presentation={presentation} timing={linearTiming({durationInFrames: TLEN[next], easing: EASE.inOut})} />);
    }
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <TransitionSeries>{nodes}</TransitionSeries>
    </AbsoluteFill>
  );
};

export const DOC_SCENES = SCENES;
