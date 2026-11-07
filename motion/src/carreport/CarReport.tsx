import React from 'react';
import {AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE} from '../theme';
import {Car, clamp, CR, ease, F, Finish, Ico, type IconName, PeruMap, Plate, TechBg} from './kit';

/* Comercial vertical: reporte vehicular completo por placa, a nivel nacional (Perú).
   Sin nombre de plataforma ni precio: el cierre invita a escribir al privado. */

export const CAR_REPORT_DURATION = 1140;

const S = {hook: 0, danger: 105, plate: 225, report: 345, map: 675, pdf: 810, cta: 900};

/* ---------------------------------- utilidades ---------------------------------- */

/** Escena con entrada/salida (escala + desenfoque) dentro de su Sequence. */
const Scene: React.FC<{dur: number; children: React.ReactNode; inF?: number; outF?: number}> = ({dur, children, inF = 8, outF = 8}) => {
  const frame = useCurrentFrame();
  const i = inF ? ease(frame, 0, inF) : 1;
  const o = outF ? ease(frame, dur - outF, dur, EASE.in) : 0;
  return <AbsoluteFill style={{opacity: i * (1 - o), transform: `scale(${1.06 - 0.06 * i + o * 0.08})`, filter: i < 1 || o > 0 ? `blur(${(1 - i) * 14 + o * 14}px)` : undefined}}>{children}</AbsoluteFill>;
};

type W = {t: string; c?: string; at: number};

/** Titular cinético: cada palabra cae con muelle; las de color llevan brillo. */
const Headline: React.FC<{words: W[]; y: number; size?: number; lineGap?: number; maxW?: number}> = ({words, y, size = 96, maxW = 980}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 540 - maxW / 2, width: maxW, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.24, rowGap: 0}}>
      {words.map((w, i) => {
        const s = spring({frame: frame - w.at, fps, config: {damping: 12, stiffness: 280, mass: 0.6}});
        const vis = frame >= w.at;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: F.head,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: w.c ?? '#fff',
              opacity: vis ? Math.min(1, s * 1.6) : 0,
              transform: `translateY(${(1 - s) * 50}px) scale(${1.25 - 0.25 * s})`,
              filter: vis && s < 0.9 ? `blur(${(1 - s) * 10}px)` : undefined,
              textShadow: w.c ? `0 0 26px ${w.c}88, 0 6px 26px rgba(0,0,0,.6)` : '0 6px 26px rgba(0,0,0,.6)',
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

const words = (s: string, at: number, gap = 4, colors: Record<number, string> = {}): W[] => s.split(' ').map((t, i) => ({t, at: at + i * gap, c: colors[i]}));

/* ---------------------------------- 1. gancho ---------------------------------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const drive = interpolate(frame, [0, 34], [0, 1], {...clamp, easing: EASE.out});
  const x = -900 + drive * 900;
  const brake = Math.max(0, Math.sin(interpolate(frame, [30, 46], [0, Math.PI], clamp))) * 3;
  return (
    <Scene dur={105} inF={0}>
      <TechBg />
      {/* líneas de velocidad */}
      {drive < 0.95 &&
        Array.from({length: 14}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: x - 200 - random(`sl${i}`) * 500, top: 1050 + random(`sy${i}`) * 300, width: 300 + random(`sw${i}`) * 400, height: 3, background: `linear-gradient(90deg, transparent, ${CR.cyan})`, opacity: (1 - drive) * 0.8}} />
        ))}
      <div style={{position: 'absolute', left: 540 - 470 + x, top: 990, transform: `rotate(${-brake}deg)`, transformOrigin: '80% 100%'}}>
        <Car width={940} spin={drive * 900} lights={1} />
      </div>
      <Headline y={330} size={104} words={words('¿Vas a comprar un auto usado?', 18, 4, {5: CR.cyan})} />
      <Headline y={1540} size={64} words={[{t: 'Antes de pagar,', at: 62}, {t: 'revisa', at: 68}, {t: 'su', at: 72}, {t: 'historial', at: 76, c: CR.amber}]} />
    </Scene>
  );
};

/* ---------------------------------- 2. riesgos ---------------------------------- */

const RISKS: {t: string; icon: IconName; x: number; y: number; r: number}[] = [
  {t: '¿ROBADO?', icon: 'shield', x: 330, y: 740, r: -6},
  {t: '¿CON PAPELETAS?', icon: 'ticket', x: 640, y: 900, r: 5},
  {t: '¿EMBARGADO?', icon: 'lock', x: 380, y: 1480, r: 4},
  {t: '¿CHOCADO?', icon: 'crash', x: 700, y: 1620, r: -5},
];

const Danger: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scan = ((frame % 50) / 50) * 1;
  const wire = ease(frame, 4, 20);
  const shakeAt = RISKS.map((_, i) => 22 + i * 18);
  const shake = shakeAt.reduce((a, s) => (frame >= s && frame < s + 6 ? (random(`sh${frame}`) - 0.5) * 22 : a), 0);
  const pulse = shakeAt.reduce((a, s) => Math.max(a, interpolate(frame - s, [0, 3, 14], [0, 0.45, 0], clamp)), 0);
  return (
    <Scene dur={120}>
      <TechBg tint={CR.red} />
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
        <div style={{position: 'absolute', left: 540 - 450, top: 1060}}>
          <Car width={900} wire={wire} spin={0} lights={0.4} />
          {/* barrido de escaneo sobre el auto */}
          <div style={{position: 'absolute', left: 900 * scan - 6, top: 40, width: 12, height: 300, background: CR.red, boxShadow: `0 0 30px ${CR.red}`, opacity: wire}} />
        </div>
        <Headline y={300} size={92} words={words('¿Y si el auto tiene un problema oculto?', 2, 3, {6: CR.red, 7: CR.red})} />
        {RISKS.map((r, i) => {
          const at = shakeAt[i];
          if (frame < at) return null;
          const s = spring({frame: frame - at, fps, config: {damping: 10, stiffness: 320, mass: 0.6}});
          const glitch = frame - at < 6;
          return (
            <div
              key={r.t}
              style={{
                position: 'absolute',
                left: r.x,
                top: r.y,
                transform: `translate(-50%,-50%) rotate(${r.r}deg) scale(${2 - s})`,
                opacity: Math.min(1, s * 2),
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '18px 30px',
                borderRadius: 18,
                background: 'rgba(30,6,10,.88)',
                border: `3px solid ${CR.red}`,
                boxShadow: `0 0 40px ${CR.red}66, 0 20px 40px rgba(0,0,0,.6)`,
                filter: glitch ? `drop-shadow(6px 0 0 rgba(0,240,255,.7)) drop-shadow(-6px 0 0 rgba(255,0,60,.8))` : undefined,
              }}
            >
              <Ico name={r.icon} size={56} color={CR.red} />
              <span style={{fontFamily: F.head, fontWeight: 900, fontSize: 54, color: '#fff', whiteSpace: 'nowrap'}}>{r.t}</span>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(255,30,50,${pulse}) 100%)`}} />
    </Scene>
  );
};

/* ---------------------------------- 3. placa ---------------------------------- */

const PlateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drop = spring({frame: frame - 14, fps, config: {damping: 12, stiffness: 160}});
  const txt = 'ABC-123'.slice(0, Math.max(0, Math.floor((frame - 34) / 4)));
  const scan = interpolate(frame, [66, 92], [0, 1], clamp);
  const prog = interpolate(frame, [70, 112], [0, 100], {...clamp, easing: EASE.inOut});
  return (
    <Scene dur={120}>
      <TechBg />
      <Headline y={290} size={94} words={words('Descúbrelo con solo la placa', 2, 4, {4: CR.cyan})} />
      <div style={{position: 'absolute', left: 540 - 400, top: 760 + (1 - drop) * -900, transform: `rotate(${(1 - drop) * -10}deg)`}}>
        <Plate text={txt} width={800} scan={frame >= 66 && frame <= 92 ? scan : -1} />
      </div>
      <div style={{position: 'absolute', left: 540, top: 820 + 336 + 30, transform: 'translateX(-50%)', fontFamily: F.ui, fontSize: 24, color: CR.mute, opacity: ease(frame, 40, 50)}}>Ejemplo de placa</div>
      {/* análisis */}
      {frame >= 70 && (
        <div style={{position: 'absolute', left: 140, right: 140, top: 1300, opacity: ease(frame, 70, 78)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.head, fontWeight: 800, fontSize: 34, color: '#fff'}}>
            <span>ANALIZANDO HISTORIAL…</span>
            <span style={{color: CR.cyan, fontVariantNumeric: 'tabular-nums'}}>{Math.round(prog)}%</span>
          </div>
          <div style={{height: 16, borderRadius: 8, background: '#ffffff1a', marginTop: 16, overflow: 'hidden'}}>
            <div style={{width: `${prog}%`, height: '100%', background: `linear-gradient(90deg, ${CR.cyanDeep}, ${CR.cyan})`, boxShadow: `0 0 20px ${CR.cyan}`}} />
          </div>
          <div style={{marginTop: 22, fontFamily: 'monospace', fontSize: 22, color: `${CR.cyan}aa`, lineHeight: 1.5, height: 120, overflow: 'hidden'}}>
            {Array.from({length: 4}, (_, i) => {
              const k = Math.floor(frame / 3) + i;
              return <div key={i}>{`> ${['sunarp', 'propietarios', 'papeletas', 'gravamenes', 'soat', 'itv', 'sat', 'siniestros'][k % 8]}.query(${(random(`h${k}`) * 1e8).toString(16).slice(0, 8)}) … OK`}</div>;
            })}
          </div>
        </div>
      )}
    </Scene>
  );
};

/* ---------------------------------- 4. reporte ---------------------------------- */

const ITEMS: {t: string; icon: IconName}[] = [
  {t: 'Datos de SUNARP', icon: 'doc'},
  {t: 'Historial de propietarios', icon: 'users'},
  {t: 'Historial de asientos', icon: 'history'},
  {t: 'Historial de robos', icon: 'shield'},
  {t: 'Historial de siniestros', icon: 'crash'},
  {t: 'Multas y papeletas', icon: 'ticket'},
  {t: 'Gravámenes', icon: 'lock'},
  {t: 'SOAT vigente', icon: 'soat'},
  {t: 'Inspección técnica', icon: 'tool'},
  {t: 'Captura SAT', icon: 'alert'},
  {t: 'Impuesto vehicular', icon: 'coin'},
  {t: 'Conversión a GNV', icon: 'gas'},
  {t: 'Títulos pendientes', icon: 'clock'},
  {t: 'Registro de transporte', icon: 'bus'},
];

const ROW0 = 36;
const ROWGAP = 15;

const ReportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const card = spring({frame: frame - 6, fps, config: {damping: 16, stiffness: 110}});
  const done = Math.min(ITEMS.length, Math.max(0, Math.floor((frame - ROW0 - 6) / ROWGAP) + 1));
  const complete = frame > ROW0 + ITEMS.length * ROWGAP + 6;
  const beam = ((frame - ROW0) / (ITEMS.length * ROWGAP)) % 1;
  const ry = interpolate(frame, [0, 330], [-12, 8]);
  const rx = interpolate(card, [0, 1], [30, 6]);
  return (
    <Scene dur={330}>
      <TechBg />
      <Headline y={150} size={86} words={words('Reporte vehicular completo', 4, 4, {2: CR.cyan})} />
      <div style={{position: 'absolute', left: 70, top: 400, width: 940, perspective: 2200}}>
        <div
          style={{
            transform: `translateY(${(1 - card) * 900}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
            transformOrigin: '50% 0%',
            borderRadius: 34,
            background: 'linear-gradient(160deg, rgba(20,34,64,.95), rgba(8,14,28,.96))',
            border: `2px solid ${CR.cyan}66`,
            boxShadow: `0 40px 100px rgba(0,0,0,.7), 0 0 60px ${CR.cyan}22, inset 0 1px 0 rgba(255,255,255,.15)`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* cabecera */}
          <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '28px 34px', borderBottom: `1px solid ${CR.cyan}33`}}>
            <div style={{padding: '8px 18px', borderRadius: 10, background: '#fff', fontFamily: F.cond, fontSize: 44, color: '#111', boxShadow: 'inset 0 6px 0 #2a6ae0'}}>ABC-123</div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 30, color: '#fff'}}>Informe del vehículo</div>
              <div style={{fontFamily: F.ui, fontSize: 22, color: CR.mute}}>Consulta a nivel nacional · Perú</div>
            </div>
            <div style={{padding: '10px 18px', borderRadius: 30, background: complete ? `${CR.green}22` : `${CR.cyan}18`, border: `2px solid ${complete ? CR.green : CR.cyan}`, fontFamily: F.head, fontWeight: 800, fontSize: 22, color: complete ? CR.green : CR.cyan, fontVariantNumeric: 'tabular-nums'}}>
              {complete ? '✓ COMPLETO' : `${done}/${ITEMS.length}`}
            </div>
          </div>
          {/* filas */}
          <div style={{padding: '12px 34px 26px'}}>
            {ITEMS.map((it, i) => {
              const at = ROW0 + i * ROWGAP;
              const p = ease(frame, at, at + 10);
              const ck = spring({frame: frame - at - 6, fps, config: {damping: 9, stiffness: 300, mass: 0.5}});
              const active = frame >= at && frame < at + ROWGAP;
              return (
                <div
                  key={it.t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    height: 72,
                    borderBottom: i < ITEMS.length - 1 ? '1px solid #ffffff12' : 'none',
                    opacity: 0.25 + 0.75 * p,
                    transform: `translateX(${(1 - p) * 40}px)`,
                    background: active ? `linear-gradient(90deg, ${CR.cyan}22, transparent)` : 'transparent',
                    margin: '0 -34px',
                    padding: '0 34px',
                  }}
                >
                  <div style={{width: 52, height: 52, borderRadius: 14, background: `${CR.cyan}14`, display: 'grid', placeItems: 'center'}}>
                    <Ico name={it.icon} size={34} />
                  </div>
                  <div style={{flex: 1, fontFamily: F.head, fontWeight: 700, fontSize: 34, color: '#fff'}}>{it.t}</div>
                  <div style={{width: 46, height: 46, borderRadius: 23, background: frame >= at + 6 ? CR.green : '#ffffff14', display: 'grid', placeItems: 'center', transform: `scale(${frame >= at + 6 ? ck : 1})`, boxShadow: frame >= at + 6 ? `0 0 18px ${CR.green}88` : 'none'}}>
                    {frame >= at + 6 && (
                      <svg width={28} height={28} viewBox="0 0 24 24">
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#04140c" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* haz de lectura */}
          {!complete && frame > ROW0 && <div style={{position: 'absolute', left: 0, right: 0, top: 120 + beam * 1010, height: 4, background: CR.cyan, boxShadow: `0 0 24px ${CR.cyan}`, opacity: 0.7}} />}
        </div>
      </div>
      {complete && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1720, textAlign: 'center', fontFamily: F.head, fontWeight: 800, fontSize: 44, color: CR.green, opacity: ease(frame, ROW0 + ITEMS.length * ROWGAP + 8, ROW0 + ITEMS.length * ROWGAP + 20), textShadow: `0 0 24px ${CR.green}88`}}>
          14 secciones en un solo informe
        </div>
      )}
    </Scene>
  );
};

/* ---------------------------------- 5. mapa ---------------------------------- */

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Scene dur={135}>
      <TechBg grid={0.5} />
      <Headline y={170} size={110} words={[{t: 'A nivel', at: 4}, {t: 'nacional', at: 9, c: CR.cyan}]} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: F.head, fontWeight: 700, fontSize: 40, color: '#ffffffcc', opacity: ease(frame, 14, 26)}}>Autos de cualquier región del Perú</div>
      <PeruMap t={frame - 8} box={[[150, 520], [930, 1850]]} />
    </Scene>
  );
};

/* ---------------------------------- 6. PDF ---------------------------------- */

const PdfScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 2, fps, config: {damping: 13, stiffness: 140}});
  const flip = interpolate(s, [0, 1], [70, -8]);
  const chips: {t: string; icon: IconName}[] = [
    {t: 'Reporte en PDF', icon: 'pdf'},
    {t: 'Fácil de compartir', icon: 'send'},
    {t: 'Datos de registros oficiales', icon: 'shield'},
  ];
  return (
    <Scene dur={90}>
      <TechBg />
      <div style={{position: 'absolute', left: 540 - 270, top: 300, width: 540, height: 720, perspective: 1800}}>
        <div style={{width: '100%', height: '100%', borderRadius: 22, background: '#fff', transform: `rotateY(${flip}deg) rotateZ(${(1 - s) * 10}deg) scale(${0.7 + 0.3 * s})`, boxShadow: '0 40px 90px rgba(0,0,0,.6)', padding: 44, boxSizing: 'border-box', fontFamily: F.ui}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <div style={{width: 70, height: 70, borderRadius: 14, background: '#e5383b', display: 'grid', placeItems: 'center'}}>
              <Ico name="pdf" size={46} color="#fff" />
            </div>
            <div>
              <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 30, color: '#0b1220'}}>REPORTE VEHICULAR</div>
              <div style={{fontSize: 20, color: '#64748b'}}>Placa ABC-123 · Perú</div>
            </div>
          </div>
          {Array.from({length: 9}, (_, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 30}}>
              <div style={{width: 22, height: 22, borderRadius: 11, background: '#22c55e'}} />
              <div style={{height: 14, borderRadius: 7, background: '#e2e8f0', width: `${60 + random(`l${i}`) * 35}%`}} />
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        {chips.map((c, i) => {
          const p = spring({frame: frame - 18 - i * 8, fps, config: {damping: 14, stiffness: 200}});
          return (
            <div key={c.t} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '20px 36px', borderRadius: 60, background: 'rgba(16,28,54,.9)', border: `2px solid ${CR.cyan}66`, opacity: p, transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px)`, fontFamily: F.head, fontWeight: 800, fontSize: 46, color: '#fff'}}>
              <Ico name={c.icon} size={48} />
              {c.t}
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

/* ---------------------------------- 7. CTA ---------------------------------- */

const Bubble: React.FC<{me?: boolean; at: number; children: React.ReactNode}> = ({me, at, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 240}});
  return (
    <div style={{display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginTop: 18}}>
      <div style={{maxWidth: 640, padding: '22px 28px', borderRadius: me ? '30px 30px 8px 30px' : '30px 30px 30px 8px', background: me ? 'linear-gradient(135deg,#2a6ae0,#2be4ff)' : '#1b2438', color: '#fff', fontFamily: F.ui, fontSize: 36, lineHeight: 1.3, transform: `scale(${s})`, transformOrigin: me ? '100% 100%' : '0% 100%', opacity: s}}>
        {children}
      </div>
    </div>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const win = spring({frame: frame - 2, fps, config: {damping: 16, stiffness: 140}});
  const shrink = ease(frame, 120, 140, EASE.inOut);
  const big = spring({frame: frame - 134, fps, config: {damping: 11, stiffness: 220}});
  const typing = frame >= 44 && frame < 70;
  const plane = interpolate(frame, [150, 178], [0, 1], {...clamp, easing: EASE.inOut});
  return (
    <Scene dur={240} outF={0}>
      <TechBg />
      {/* ventana de chat (mensaje privado) */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 240,
          width: 920,
          transform: `translateY(${(1 - win) * 800 - shrink * 120}px) scale(${1 - shrink * 0.32})`,
          transformOrigin: '50% 0%',
          opacity: Math.min(1, win * 1.5) * (1 - shrink * 0.25),
          borderRadius: 36,
          background: 'rgba(10,16,30,.95)',
          border: '2px solid #ffffff1c',
          boxShadow: '0 40px 100px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '26px 30px', borderBottom: '1px solid #ffffff14'}}>
          <div style={{width: 74, height: 74, borderRadius: 37, background: 'linear-gradient(135deg,#2a6ae0,#2be4ff)', display: 'grid', placeItems: 'center'}}>
            <Ico name="doc" size={40} color="#fff" />
          </div>
          <div>
            <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 34, color: '#fff'}}>Mensaje privado</div>
            <div style={{fontFamily: F.ui, fontSize: 24, color: CR.green}}>● En línea</div>
          </div>
        </div>
        <div style={{padding: '14px 30px 34px', minHeight: 640}}>
          <Bubble me at={14}>
            Hola 👋 quiero el reporte completo de la placa <b>ABC-123</b>
          </Bubble>
          {typing && (
            <div style={{display: 'flex', gap: 10, marginTop: 18, padding: '24px 30px', borderRadius: 30, background: '#1b2438', width: 'fit-content'}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: '#9fb3d9', transform: `translateY(${Math.sin((frame + i * 5) / 3) * 5}px)`}} />
              ))}
            </div>
          )}
          <Bubble at={70}>¡Claro! Aquí tienes tu reporte completo ✅</Bubble>
          <Bubble at={88}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 76, height: 90, borderRadius: 12, background: '#e5383b', display: 'grid', placeItems: 'center'}}>
                <Ico name="pdf" size={50} color="#fff" />
              </div>
              <div>
                <div style={{fontWeight: 700}}>Reporte_ABC-123.pdf</div>
                <div style={{fontSize: 26, color: '#9fb3d9'}}>Informe vehicular completo</div>
              </div>
            </div>
          </Bubble>
        </div>
      </div>
      {/* llamado final */}
      {frame >= 134 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 116, color: '#fff', lineHeight: 1, textAlign: 'center', transform: `scale(${1.4 - 0.4 * big})`, opacity: Math.min(1, big * 2), textShadow: `0 0 40px ${CR.cyan}66`}}>
            ESCRÍBEME
            <br />
            <span style={{color: CR.cyan}}>AL PRIVADO</span>
          </div>
          <div style={{marginTop: 34, fontFamily: F.head, fontWeight: 700, fontSize: 44, color: '#ffffffdd', textAlign: 'center', opacity: ease(frame, 150, 162), transform: `translateY(${(1 - ease(frame, 150, 162)) * 20}px)`}}>
            Envíame la placa y te paso
            <br />
            el reporte completo 📩
          </div>
          <div style={{marginTop: 46, padding: '22px 50px', borderRadius: 60, background: `linear-gradient(135deg, ${CR.cyan}, #2a6ae0)`, fontFamily: F.head, fontWeight: 900, fontSize: 46, color: '#04121c', opacity: ease(frame, 168, 178), boxShadow: `0 0 ${30 + Math.sin(frame / 7) * 18}px ${CR.cyan}aa`, transform: `scale(${1 + Math.sin(frame / 7) * 0.02})`}}>
            REVISA ANTES DE COMPRAR
          </div>
          {/* flecha hacia el botón de mensajes de la red social */}
          <div style={{marginTop: 30, fontSize: 70, color: CR.cyan, opacity: ease(frame, 182, 192), transform: `translateY(${Math.abs(Math.sin(frame / 6)) * 18}px)`}}>⬇</div>
        </div>
      )}
      {/* avión de papel */}
      {plane > 0 && plane < 1 && (
        <div style={{position: 'absolute', left: -120 + plane * 1350, top: 1700 - plane * 1300 - Math.sin(plane * Math.PI) * 200, transform: `rotate(${-25 + plane * 10}deg)`, filter: `drop-shadow(0 0 16px ${CR.cyan})`}}>
          <Ico name="send" size={110} color="#fff" />
        </div>
      )}
    </Scene>
  );
};

/* ---------------------------------- montaje ---------------------------------- */

const sfx = (src: string, at: number, volume = 1) => (
  <Sequence key={`${src}${at}`} from={at}>
    <Audio src={staticFile(`carreport/${src}`)} volume={volume} />
  </Sequence>
);

export const CarReport: React.FC = () => {
  return (
    <AbsoluteFill style={{background: CR.bg}}>
      <Audio src={staticFile('carreport/music.wav')} volume={0.75} />
      <Sequence from={S.hook} durationInFrames={S.danger - S.hook + 8}>
        <Hook />
      </Sequence>
      <Sequence from={S.danger} durationInFrames={S.plate - S.danger + 8}>
        <Danger />
      </Sequence>
      <Sequence from={S.plate} durationInFrames={S.report - S.plate + 8}>
        <PlateScene />
      </Sequence>
      <Sequence from={S.report} durationInFrames={S.map - S.report + 8}>
        <ReportScene />
      </Sequence>
      <Sequence from={S.map} durationInFrames={S.pdf - S.map + 8}>
        <MapScene />
      </Sequence>
      <Sequence from={S.pdf} durationInFrames={S.cta - S.pdf + 8}>
        <PdfScene />
      </Sequence>
      <Sequence from={S.cta}>
        <CtaScene />
      </Sequence>
      <Finish />
      {/* efectos */}
      {sfx('whoosh.wav', 0, 0.8)}
      {[0, 1, 2, 3].map((i) => sfx('glitch.wav', S.danger + 22 + i * 18, 0.9))}
      {sfx('alarm.wav', S.danger + 22, 0.6)}
      {sfx('whoosh.wav', S.plate, 0.6)}
      {Array.from({length: 7}, (_, i) => sfx('tick.wav', S.plate + 34 + i * 4, 0.8))}
      {sfx('scan.wav', S.plate + 66, 0.8)}
      {sfx('whoosh.wav', S.report, 0.6)}
      {Array.from({length: 14}, (_, i) => sfx('check.wav', S.report + ROW0 + 6 + i * ROWGAP, 0.7))}
      {sfx('whoosh.wav', S.map, 0.6)}
      {Array.from({length: 10}, (_, i) => sfx('pop.wav', S.map + 8 + 50 + i * 6, 0.35))}
      {sfx('whoosh.wav', S.pdf, 0.6)}
      {sfx('pop.wav', S.cta + 14, 0.7)}
      {sfx('pop.wav', S.cta + 70, 0.7)}
      {sfx('pop.wav', S.cta + 88, 0.7)}
      {sfx('whoosh.wav', S.cta + 150, 0.8)}
    </AbsoluteFill>
  );
};
