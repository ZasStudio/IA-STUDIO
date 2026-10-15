import React from 'react';
import {AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE} from '../theme';
import {CartDrawer, CART_XY, CheckoutScreen, CollectionScreen, ConfirmScreen, Header, HomeScreen, ProductScreen, SW} from './Screens';
import {clamp, ease, FONT, Logo, Machine, PRODUCTS, SB, soles, Touch} from './ui';

/* Reel vertical: cómo se compra en sanbarber.pe, paso a paso, dentro de un móvil 3D. */

export const SANBARBER_DURATION = 990;

// geometría del móvil
const PW = 700;
const PH = 1430;
const BEZ = 22;
const K = (PW - BEZ * 2) / SW; // escala píxel lógico → lienzo
const SH = (PH - BEZ * 2) / K; // alto lógico de pantalla (≈ 824)

// tiempos globales (frames a 30 fps)
const T = {
  phoneIn: 58,
  home: 60,
  tapCat: 210,
  coll: 222,
  tapCard: 336,
  prod: 348,
  tapAdd: 498,
  bump: 520,
  drawer: 530,
  tapCheckout: 592,
  checkout: 604,
  tapPay: 764,
  confirm: 778,
  end: 862,
};

const key = (f: number, ks: [number, number][]) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [fa, va] = ks[i];
    const [fb, vb] = ks[i + 1];
    if (f <= fb) return va + (vb - va) * interpolate(f, [fa, fb], [0, 1], {easing: EASE.inOut});
  }
  return ks[ks.length - 1][1];
};

/* ---------------------------------- fondo ---------------------------------- */

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 55%, #2c2618 0%, ${SB.char} 50%, #0a0a0b 100%)`, overflow: 'hidden'}}>
      {/* rayas de barbero muy sutiles */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          background: `repeating-linear-gradient(135deg, ${SB.red} 0 40px, #fff 40px 80px, #1f4fa0 80px 120px, #fff 120px 160px)`,
          backgroundPosition: `${frame * 2}px 0`,
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000 90%)',
          maskImage: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000 90%)',
        }}
      />
      {/* partículas doradas (bokeh) */}
      {Array.from({length: 26}, (_, i) => {
        const x = random(`bx${i}`) * 1080;
        const y = ((random(`by${i}`) * 2100 - frame * (0.4 + random(`bv${i}`) * 0.8)) % 2100 + 2100) % 2100 - 90;
        const r = 4 + random(`br${i}`) * 14;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: SB.goldHi, opacity: 0.08 + random(`bo${i}`) * 0.18, filter: `blur(${random(`bb${i}`) * 4}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------- gancho ---------------------------------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 110}});
  const out = ease(frame, 52, 70, EASE.in);
  const line = (txt: string, at: number, size: number, color = '#fff') => {
    const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 300, mass: 0.6}});
    return (
      <div style={{fontFamily: FONT.cond, fontSize: size, lineHeight: 0.92, color, opacity: Math.min(1, s * 2), transform: `scale(${1.4 - 0.4 * s})`, filter: `blur(${(1 - Math.min(1, s)) * 8}px)`}}>
        {txt}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 160}px)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center', opacity: ease(frame, 0, 10)}}>
        <Logo size={46} color="#fff" />
      </div>
      <div style={{position: 'absolute', left: 540, top: 1150, transform: `translate(-50%,-50%) translateY(${(1 - m) * 900}px) rotate(${(1 - m) * -200 - 16}deg)`, filter: `drop-shadow(0 40px 50px rgba(0,0,0,.6)) drop-shadow(0 0 60px rgba(201,160,67,${0.4 * m}))`}}>
        <Machine color={PRODUCTS[0].color} height={760} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', textShadow: '0 8px 30px rgba(0,0,0,.6)'}}>
        {line('COMPRA TU EQUIPO', 10, 120)}
        {line('DE BARBERÍA', 18, 120)}
        {line('EN 5 PASOS', 28, 150, SB.gold)}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------- pasos ---------------------------------- */

const STEPS: {n: number; t: string; from: number; to: number}[] = [
  {n: 1, t: 'ELIGE LA CATEGORÍA', from: 96, to: T.coll},
  {n: 2, t: 'ESCOGE TU MÁQUINA', from: T.coll, to: T.prod},
  {n: 3, t: 'AGRÉGALA AL CARRITO', from: T.prod, to: T.checkout},
  {n: 4, t: 'PAGA SEGURO', from: T.checkout, to: T.confirm},
  {n: 5, t: 'RECÍBELA EN CASA', from: T.confirm, to: T.end},
];

const StepTitle: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 96 || frame > T.end + 10) return null;
  const exitAll = ease(frame, T.end - 4, T.end + 10, EASE.in);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - exitAll}}>
      {/* barra de progreso de 5 pasos */}
      <div style={{display: 'flex', gap: 10}}>
        {STEPS.map((s) => {
          const done = frame >= s.from;
          const fill = ease(frame, s.from, s.from + 14);
          return (
            <div key={s.n} style={{width: 120, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.15)', overflow: 'hidden'}}>
              <div style={{width: `${done ? fill * 100 : 0}%`, height: '100%', background: `linear-gradient(90deg, ${SB.gold}, ${SB.goldHi})`}} />
            </div>
          );
        })}
      </div>
      {STEPS.map((s) => {
        const vis = frame >= s.from - 2 && frame < s.to + 10;
        if (!vis) return null;
        const inn = ease(frame, s.from, s.from + 10);
        const out = ease(frame, s.to - 2, s.to + 8, EASE.in);
        return (
          <div key={s.n} style={{position: 'absolute', top: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 30 - out * 30}px)`, filter: `blur(${(1 - inn) * 8 + out * 8}px)`}}>
            <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 30, letterSpacing: '0.24em', color: SB.gold}}>PASO {s.n}</div>
            <div style={{fontFamily: FONT.cond, fontSize: 104, color: '#fff', lineHeight: 1, marginTop: 4, textShadow: '0 6px 24px rgba(0,0,0,.5)'}}>{s.t}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------- pantalla del móvil ---------------------------------- */

/** Pila de pantallas con transición "push" de iOS. */
const PushIn: React.FC<{at: number; children: React.ReactNode; z: number}> = ({at, children, z}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 14], [0, 1], {...clamp, easing: EASE.drawer});
  return <div style={{position: 'absolute', inset: 0, zIndex: z, transform: `translateX(${(1 - p) * SW}px)`, boxShadow: p < 1 ? '-10px 0 30px rgba(0,0,0,.25)' : 'none', background: '#fff'}}>{children}</div>;
};

const Dim: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 14], [0, 1], {...clamp, easing: EASE.drawer});
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${-p * 110}px)`}}>
      {children}
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${p * 0.25})`}} />
    </div>
  );
};

/** Vuelo del producto al carrito en arco, con estela. */
const FlyToCart: React.FC = () => {
  const frame = useCurrentFrame();
  const a = T.tapAdd + 2;
  const b = T.bump;
  if (frame < a || frame > b + 2) return null;
  const p = interpolate(frame, [a, b], [0, 1], {...clamp, easing: EASE.inOut});
  const x0 = 241;
  const y0 = 430;
  const x = x0 + (CART_XY.x - x0) * p;
  const y = y0 + (CART_XY.y - y0) * p - Math.sin(p * Math.PI) * 140;
  const s = 1 - p * 0.8;
  return (
    <div style={{position: 'absolute', left: x - 40, top: y - 60, width: 80, height: 120, zIndex: 40, transform: `scale(${s}) rotate(${p * 160}deg)`, filter: `drop-shadow(0 0 ${12 * (1 - p)}px ${SB.gold})`}}>
      <Machine color={PRODUCTS[0].color} height={120} />
    </div>
  );
};

const PhoneScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const tHome = frame - T.home;
  const tColl = frame - T.coll;
  const tProd = frame - T.prod;
  const tChk = frame - T.checkout;
  const tConf = frame - T.confirm;

  const homeScroll = key(tHome, [[60, 0], [105, 330]]);
  const collScroll = key(tColl, [[30, 0], [62, 150], [80, 150], [100, 0]]);
  const slide = key(tProd, [[22, 0], [36, 1], [52, 1], [66, 2], [80, 2], [92, 0]]);
  const prodScroll = key(tProd, [[96, 0], [126, 250]]);
  const press = interpolate(frame, [T.tapAdd, T.tapAdd + 10], [0, 1], clamp);
  const drawerOpen = interpolate(frame, [T.drawer, T.drawer + 14], [0, 1], {...clamp, easing: EASE.drawer});
  const drawerPress = interpolate(frame, [T.tapCheckout, T.tapCheckout + 8], [0, 1], clamp);
  const chkScroll = key(tChk, [[96, 0], [114, 158]]);
  const payPress = interpolate(frame, [T.tapPay, T.tapPay + 8], [0, 1], clamp);
  const cart = frame >= T.bump ? 1 : 0;

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff'}}>
      <Dim from={T.coll}>
        <HomeScreen t={tHome} scroll={homeScroll} tapCat={frame >= T.tapCat && frame < T.coll + 4 ? 1 : 0} />
      </Dim>
      <PushIn at={T.coll} z={2}>
        <Dim from={T.prod}>
          <CollectionScreen t={tColl} scroll={collScroll} pick={ease(frame, T.tapCard - 18, T.tapCard - 6)} />
        </Dim>
      </PushIn>
      <PushIn at={T.prod} z={3}>
        <Dim from={T.checkout}>
          <div style={{position: 'absolute', inset: 0}}>
            <ProductScreen t={tProd} scroll={prodScroll} slide={slide} press={press} />
            {/* cabecera fija para que el carrito siempre se vea */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, opacity: prodScroll > 30 ? 1 : 0}}>
              <Header cart={cart} bump={T.bump} />
            </div>
            <FlyToCart />
            {frame >= T.drawer && <CartDrawer t={frame - T.drawer} open={drawerOpen} press={drawerPress} />}
          </div>
        </Dim>
      </PushIn>
      <PushIn at={T.checkout} z={4}>
        <CheckoutScreen t={tChk} scroll={chkScroll} press={payPress} />
      </PushIn>
      <PushIn at={T.confirm} z={5}>
        <ConfirmScreen t={tConf} />
      </PushIn>
      {/* toques */}
      <Touch x={74} y={179} at={T.tapCat} />
      <Touch x={101} y={300} at={T.tapCard} />
      <Touch x={241} y={430} at={T.tapAdd} />
      <Touch x={220} y={737} at={T.tapCheckout} />
      <Touch x={195} y={693} at={T.tapPay} />
      {/* barra de estado iOS */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 0}} />
    </div>
  );
};

/* ---------------------------------- móvil 3D con cámara ---------------------------------- */

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - T.phoneIn, fps, config: {damping: 16, stiffness: 90}});
  const exit = ease(frame, T.end, T.end + 22, EASE.in);
  // cámara: [frame, valor]
  const s = key(frame, [[T.phoneIn, 1], [T.prod + 60, 1], [T.prod + 100, 1.1], [T.tapAdd + 20, 1.1], [T.drawer + 10, 1.0], [T.checkout + 20, 1.0], [T.checkout + 90, 1.06], [T.tapPay + 6, 1.06], [T.confirm + 10, 1]]);
  const y = key(frame, [[T.phoneIn, 0], [T.prod + 60, 0], [T.prod + 100, -20], [T.tapAdd + 20, -20], [T.drawer + 10, 0], [T.checkout + 90, 0], [T.tapPay + 6, 0], [T.confirm + 10, 0]]);
  const ry = key(frame, [[T.phoneIn, -16], [T.home + 60, -6], [T.coll, 6], [T.prod, -5], [T.drawer, 5], [T.checkout, -6], [T.confirm, 0], [T.end, 8]]);
  const rx = key(frame, [[T.phoneIn, 14], [T.home + 60, 4], [T.end, 2]]);
  const float = Math.sin(frame / 40) * 6;
  return (
    <div style={{position: 'absolute', left: 540 - PW / 2, top: 1150 - PH / 2, width: PW, height: PH, perspective: 2600}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `translateY(${(1 - enter) * 1800 + exit * 1600 + y + float}px) scale(${s * (1 - exit * 0.3)}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${(1 - enter) * 10}deg)`,
        }}
      >
        {/* sombra */}
        <div style={{position: 'absolute', left: 40, right: 40, bottom: -60, height: 80, borderRadius: '50%', background: 'rgba(0,0,0,.55)', filter: 'blur(30px)', transform: 'translateZ(-40px)'}} />
        {/* carcasa */}
        <div style={{position: 'absolute', inset: 0, borderRadius: 96, background: 'linear-gradient(145deg,#4a4a4f,#151517 40%,#2b2b2e)', boxShadow: '0 50px 100px rgba(0,0,0,.6), inset 0 0 0 3px #5c5c62, inset 0 0 0 9px #0c0c0d'}} />
        {/* pantalla */}
        <div style={{position: 'absolute', left: BEZ, top: BEZ, width: PW - BEZ * 2, height: PH - BEZ * 2, borderRadius: 76, overflow: 'hidden', background: '#000'}}>
          <div style={{width: SW, height: SH, transform: `scale(${K})`, transformOrigin: '0 0', position: 'relative', paddingTop: 0}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingTop: 0}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 44, bottom: 0}}>
                <PhoneScreen />
              </div>
              {/* barra de estado */}
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 44, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontFamily: FONT.ui, fontWeight: 700, fontSize: 14, zIndex: 60}}>
                <span>9:41</span>
                <span style={{display: 'flex', gap: 5, alignItems: 'center'}}>
                  <span style={{width: 18, height: 10, borderRadius: 2, background: SB.ink}} />
                  <span style={{width: 24, height: 11, borderRadius: 3, border: `1.5px solid ${SB.ink}`, padding: 1, boxSizing: 'border-box'}}>
                    <span style={{display: 'block', width: '80%', height: '100%', background: SB.ink, borderRadius: 1}} />
                  </span>
                </span>
              </div>
              <div style={{position: 'absolute', left: SW / 2 - 60, top: 10, width: 120, height: 34, borderRadius: 17, background: '#000', zIndex: 61}} />
            </div>
          </div>
          {/* reflejo del cristal */}
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${115 + ry * 2}deg, rgba(255,255,255,.12) 0%, transparent 30%, transparent 70%, rgba(255,255,255,.05) 100%)`, pointerEvents: 'none'}} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------- llamadas flotantes ---------------------------------- */

const Chip: React.FC<{text: string; at: number; until: number; x: number; y: number; from?: number}> = ({text, at, until, x, y, from = -1}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at || frame > until + 10) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 200}});
  const out = ease(frame, until, until + 10, EASE.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + Math.sin((frame + at) / 18) * 6,
        transform: `translateX(${(1 - s) * 140 * from}px) scale(${0.8 + 0.2 * s})`,
        opacity: Math.min(1, s * 1.5) * (1 - out),
        padding: '16px 26px',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(40,36,28,.86), rgba(20,20,22,.86))',
        border: `1.5px solid ${SB.gold}`,
        boxShadow: `0 16px 40px rgba(0,0,0,.45), 0 0 24px rgba(201,160,67,.25)`,
        fontFamily: FONT.head,
        fontWeight: 800,
        fontSize: 34,
        color: '#fff',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

const PriceBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = T.prod + 104;
  if (frame < at || frame > T.tapAdd) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 10, stiffness: 220}});
  const out = ease(frame, T.tapAdd - 10, T.tapAdd, EASE.in);
  return (
    <div style={{position: 'absolute', left: 540, top: 470, transform: `translate(-50%,-50%) rotate(-4deg) scale(${s * (1 - out)})`, padding: '18px 40px', borderRadius: 20, background: `linear-gradient(135deg, ${SB.goldHi}, ${SB.gold})`, color: SB.ink, fontFamily: FONT.cond, fontSize: 110, boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>
      {soles(PRODUCTS[0].price)}
    </div>
  );
};

const Stamp: React.FC<{text: string; at: number; until: number; y: number; color?: string}> = ({text, at, until, y, color = SB.green}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at || frame > until + 8) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 9, stiffness: 260}});
  const out = ease(frame, until, until + 8, EASE.in);
  return (
    <div style={{position: 'absolute', left: 540, top: y, transform: `translate(-50%,-50%) rotate(-6deg) scale(${(2 - s) * (1 - out)})`, opacity: Math.min(1, s) * (1 - out), padding: '14px 32px', border: `6px solid ${color}`, borderRadius: 16, color, background: 'rgba(255,255,255,.95)', fontFamily: FONT.cond, fontSize: 62, whiteSpace: 'nowrap', letterSpacing: '0.04em', boxShadow: '0 20px 50px rgba(0,0,0,.4)'}}>
      {text}
    </div>
  );
};

/* ---------------------------------- cierre ---------------------------------- */

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - T.end;
  if (t < 0) return null;
  const s = spring({frame: t - 8, fps, config: {damping: 14, stiffness: 140}});
  const it = (d: number) => ease(t, d, d + 12);
  return (
    <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${0.6 + 0.4 * s})`, opacity: s}}>
        <Logo size={120} color="#fff" />
      </div>
      <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 40, letterSpacing: '0.22em', color: SB.gold, marginTop: 24, opacity: it(16)}}>INSUMOS PARA BARBERÍA</div>
      <div style={{marginTop: 60, position: 'relative', opacity: it(26), transform: `translateY(${(1 - it(26)) * 30}px)`}}>
        <div style={{padding: '30px 70px', borderRadius: 60, background: `linear-gradient(135deg, ${SB.goldHi}, ${SB.gold})`, color: SB.ink, fontFamily: FONT.head, fontWeight: 900, fontSize: 58, boxShadow: `0 0 ${30 + Math.sin(t / 8) * 15}px rgba(201,160,67,.6)`}}>sanbarber.pe</div>
      </div>
      <div style={{marginTop: 50, fontFamily: FONT.ui, fontWeight: 600, fontSize: 36, color: '#fff', opacity: it(38)}}>Envíos a todo el Perú</div>
      <div style={{marginTop: 18, fontFamily: FONT.ui, fontSize: 28, color: 'rgba(255,255,255,.65)', opacity: it(46), textAlign: 'center', lineHeight: 1.4}}>
        Tiendas en Los Olivos · San Juan de Miraflores
        <br />
        San Juan de Lurigancho
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------- montaje ---------------------------------- */

const sfx = (src: string, at: number, volume = 1) => (
  <Sequence key={`${src}${at}`} from={at}>
    <Audio src={staticFile(`sanbarber/${src}`)} volume={volume} />
  </Sequence>
);

export const SanBarberReel: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [SANBARBER_DURATION - 10, SANBARBER_DURATION], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Backdrop />
      <Hook />
      <Phone />
      <StepTitle />
      {/* datos reales de la ficha del producto */}
      <Chip text="⚡ 5,700 RPM" at={T.prod + 30} until={T.prod + 96} x={40} y={760} from={-1} />
      <Chip text="🔋 100 MIN" at={T.prod + 40} until={T.prod + 96} x={720} y={900} from={1} />
      <Chip text="8 PEINES GUÍA" at={T.prod + 52} until={T.prod + 96} x={40} y={1240} from={-1} />
      <Chip text="1 AÑO DE GARANTÍA" at={T.prod + 62} until={T.prod + 96} x={620} y={1420} from={1} />
      <PriceBurst />
      <Stamp text="ENVÍO GRATIS EN LIMA" at={T.drawer + 34} until={T.tapCheckout - 2} y={420} />
      <Chip text="🔒 Pago encriptado" at={T.checkout + 112} until={T.tapPay} x={560} y={330} from={1} />
      <EndCard />
      {/* sonido */}
      {sfx('whoosh.wav', 0, 0.8)}
      {sfx('thump.wav', 30)}
      {sfx('whoosh.wav', T.phoneIn, 0.9)}
      {[T.tapCat, T.tapCard, T.tapAdd, T.tapCheckout, T.tapPay].map((t) => sfx('tap.wav', t))}
      {[T.coll, T.prod, T.checkout, T.confirm].map((t) => sfx('whoosh.wav', t, 0.4))}
      {sfx('thump.wav', T.bump, 0.7)}
      {sfx('whoosh.wav', T.drawer, 0.5)}
      {sfx('chime.wav', T.confirm + 10)}
      {sfx('whoosh.wav', T.end, 0.9)}
      {sfx('chime.wav', T.end + 30, 0.6)}
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
