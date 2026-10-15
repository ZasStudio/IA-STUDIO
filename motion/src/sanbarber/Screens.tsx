import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE} from '../theme';
import {clamp, ease, FONT, Icon, Logo, Machine, PRODUCTS, SB, soles, typed, type Product} from './ui';

/* Pantallas a 390 px lógicos de ancho (iPhone). Todas reciben `t` = frame local de la pantalla. */

export const SW = 390;

const Announcement: React.FC = () => {
  const frame = useCurrentFrame();
  const msg = 'ENVÍO GRATIS EN LIMA POR COMPRAS MAYORES A S/ 50   ✦   ENVÍOS A TODO EL PERÚ   ✦   ';
  return (
    <div style={{height: 30, background: SB.ink, overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
      <div style={{fontFamily: FONT.head, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.08em', color: SB.goldHi, transform: `translateX(${-((frame * 1.2) % 560)}px)`}}>
        {msg}
        {msg}
      </div>
    </div>
  );
};

export const Header: React.FC<{cart?: number; bump?: number}> = ({cart = 0, bump = -99}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = spring({frame: frame - bump, fps, config: {damping: 9, stiffness: 320, mass: 0.6}});
  const pop = frame >= bump ? 1 + Math.sin(Math.min(1, b) * Math.PI) * 0.6 : 1;
  return (
    <div>
      <Announcement />
      <div style={{height: 56, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${SB.line}`}}>
        <Icon name="menu" />
        <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
          <Logo size={20} />
        </div>
        <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
          <Icon name="search" />
          <div style={{position: 'relative'}} id="cart-icon">
            <Icon name="cart" />
            {cart > 0 && (
              <div style={{position: 'absolute', right: -7, top: -6, minWidth: 17, height: 17, borderRadius: 9, background: SB.red, color: '#fff', fontFamily: FONT.ui, fontWeight: 700, fontSize: 10.5, display: 'grid', placeItems: 'center', transform: `scale(${pop})`}}>
                {cart}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Coordenadas (lógicas) del icono del carrito, para animar el vuelo del producto. */
export const CART_XY = {x: 352, y: 58};

export const ProductCard: React.FC<{p: Product; w: number; delay?: number; t: number; highlight?: number}> = ({p, w, delay = 0, t, highlight = 0}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: t - delay, fps, config: {damping: 18, stiffness: 160}});
  return (
    <div style={{width: w, opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${1 + highlight * 0.04})`, fontFamily: FONT.ui}}>
      <div style={{height: w * 1.1, borderRadius: 10, background: 'linear-gradient(160deg,#f7f5f0,#e9e5dc)', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative', boxShadow: highlight ? `0 0 0 ${2 * highlight}px ${SB.gold}, 0 10px 30px rgba(201,160,67,${0.35 * highlight})` : 'none'}}>
        <Machine kind={p.kind} color={p.color} height={w * 0.9} style={{transform: 'rotate(-14deg)', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,.25))'}} />
        <div style={{position: 'absolute', left: 8, top: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: SB.mute}}>{p.brand}</div>
      </div>
      <div style={{fontSize: 10.5, fontWeight: 600, color: SB.ink, marginTop: 7, lineHeight: 1.25, height: 27, overflow: 'hidden'}}>{p.name}</div>
      <div style={{fontSize: 13, fontWeight: 700, color: SB.ink, marginTop: 3}}>{soles(p.price)}</div>
    </div>
  );
};

/* ------------------------------------ INICIO ------------------------------------ */

const CATS = ['Máquinas', 'Tijeras', 'Capas', 'Peines', 'Mochilas', 'Accesorios'];

const CatIcon: React.FC<{i: number}> = ({i}) => {
  const stroke = {fill: 'none', stroke: SB.ink, strokeWidth: 1.6, strokeLinecap: 'round' as const};
  return (
    <svg width={30} height={30} viewBox="0 0 24 24">
      {i === 0 && <path d="M8 3h8v3H8zM7 6h10l-1 14H8z" {...stroke} />}
      {i === 1 && (
        <>
          <circle cx={6} cy={18} r={3} {...stroke} />
          <circle cx={18} cy={18} r={3} {...stroke} />
          <path d="M8 16L18 3M16 16L6 3" {...stroke} />
        </>
      )}
      {i === 2 && <path d="M12 3c-2 0-3 1-3 2L3 20h18L15 5c0-1-1-2-3-2z" {...stroke} />}
      {i === 3 && <path d="M3 9h18v4H3zM5 13v6M8 13v6M11 13v6M14 13v6M17 13v6M20 13v6" {...stroke} />}
      {i === 4 && <path d="M6 8h12v12H6zM9 8V5h6v3M6 13h12" {...stroke} />}
      {i === 5 && <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" {...stroke} />}
    </svg>
  );
};

export const HomeScreen: React.FC<{t: number; scroll: number; tapCat?: number}> = ({t, scroll, tapCat = 0}) => {
  const hero = ease(t, 0, 20);
  return (
    <div style={{width: SW, background: '#fff', transform: `translateY(${-scroll}px)`}}>
      <Header />
      {/* hero */}
      <div style={{height: 330, position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 70% 40%, #3a3225, ${SB.ink} 70%)`}}>
        <div style={{position: 'absolute', right: -10, top: 30, transform: `translateX(${(1 - hero) * 80}px) rotate(${-18 + Math.sin(t / 30) * 2}deg)`, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.6))'}}>
          <Machine color={PRODUCTS[0].color} height={280} />
        </div>
        <div style={{position: 'absolute', left: 20, top: 70, color: '#fff', opacity: hero, transform: `translateY(${(1 - hero) * 20}px)`}}>
          <div style={{fontFamily: FONT.head, fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', color: SB.goldHi}}>IMPORTADORES DIRECTOS</div>
          <div style={{fontFamily: FONT.cond, fontSize: 46, lineHeight: 0.95, marginTop: 8}}>
            INSUMOS
            <br />
            PARA
            <br />
            BARBERÍA
          </div>
          <div style={{marginTop: 18, display: 'inline-block', padding: '10px 18px', background: SB.gold, color: SB.ink, fontFamily: FONT.head, fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', borderRadius: 4}}>COMPRAR AHORA</div>
        </div>
        <div style={{position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? SB.gold : 'rgba(255,255,255,.4)'}} />
          ))}
        </div>
      </div>
      {/* categorías */}
      <div style={{padding: '22px 14px 8px', fontFamily: FONT.head, fontWeight: 800, fontSize: 16, color: SB.ink}}>Categorías</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '6px 14px'}}>
        {CATS.map((c, i) => (
          <div key={c} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: ease(t, 6 + i * 3, 18 + i * 3), transform: `scale(${i === 0 ? 1 - tapCat * 0.06 : 1})`}}>
            <div style={{width: 74, height: 74, borderRadius: 37, background: i === 0 && tapCat ? '#f3e7c6' : SB.cream, display: 'grid', placeItems: 'center', border: `1px solid ${i === 0 && tapCat ? SB.gold : SB.line}`}}>
              <CatIcon i={i} />
            </div>
            <div style={{fontFamily: FONT.ui, fontSize: 12, fontWeight: 600, color: SB.ink}}>{c}</div>
          </div>
        ))}
      </div>
      {/* más vendidos */}
      <div style={{padding: '22px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 16}}>Los Más Vendidos</div>
        <div style={{fontFamily: FONT.ui, fontSize: 11, color: SB.mute, textDecoration: 'underline'}}>Ver todo</div>
      </div>
      <div style={{display: 'flex', gap: 12, padding: '0 14px 30px'}}>
        {PRODUCTS.slice(1, 4).map((p, i) => (
          <ProductCard key={p.id} p={p} w={112} t={t} delay={10 + i * 4} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------ COLECCIÓN ------------------------------------ */

export const CollectionScreen: React.FC<{t: number; scroll: number; pick?: number}> = ({t, scroll, pick = 0}) => {
  const items = [PRODUCTS[0], PRODUCTS[1], PRODUCTS[2], PRODUCTS[3], PRODUCTS[6], PRODUCTS[7], PRODUCTS[4], PRODUCTS[5]];
  return (
    <div style={{width: SW, background: '#fff', transform: `translateY(${-scroll}px)`}}>
      <Header />
      <div style={{padding: '18px 14px 4px', fontFamily: FONT.cond, fontSize: 34, letterSpacing: '0.02em'}}>MÁQUINAS</div>
      <div style={{padding: '0 14px 12px', fontFamily: FONT.ui, fontSize: 11.5, color: SB.mute}}>Envío gratis en Lima por compras mayores a S/ 50</div>
      <div style={{display: 'flex', gap: 8, padding: '0 14px 14px', fontFamily: FONT.ui, fontSize: 12, fontWeight: 600}}>
        {['Filtrar', 'Ordenar: Más vendidos', `${items.length} productos`].map((x, i) => (
          <div key={x} style={{padding: '7px 12px', borderRadius: 20, border: `1px solid ${SB.line}`, color: i === 2 ? SB.mute : SB.ink, background: i === 2 ? 'transparent' : '#fff'}}>
            {x}
          </div>
        ))}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 12px', padding: '0 14px 40px'}}>
        {items.map((p, i) => (
          <ProductCard key={p.id} p={p} w={175} t={t} delay={4 + i * 3} highlight={i === 0 ? pick : 0} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------ PRODUCTO ------------------------------------ */

export const ProductScreen: React.FC<{t: number; scroll: number; slide: number; press?: number}> = ({t, scroll, slide, press = 0}) => {
  const p = PRODUCTS[0];
  const specs = ['Motor rotativo de 5,700 RPM', 'Hasta 100 min de autonomía · carga en 60 min', 'Uso con y sin cable', 'Incluye 8 peines guía', '1 año de garantía'];
  return (
    <div style={{width: SW, background: '#fff', transform: `translateY(${-scroll}px)`, fontFamily: FONT.ui}}>
      <Header />
      <div style={{padding: '10px 14px', fontSize: 11, color: SB.mute, display: 'flex', alignItems: 'center', gap: 4}}>
        Inicio <Icon name="chevron" size={10} color={SB.mute} /> Máquinas <Icon name="chevron" size={10} color={SB.mute} /> Wahl
      </div>
      {/* galería deslizable */}
      <div style={{height: 380, overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg,#f7f5f0,#e7e2d6)'}}>
        <div style={{display: 'flex', width: SW * 3, height: '100%', transform: `translateX(${-slide * SW}px)`}}>
          {[-14, 8, -90].map((r, i) => (
            <div key={i} style={{width: SW, height: '100%', display: 'grid', placeItems: 'center'}}>
              <Machine color={p.color} height={i === 2 ? 220 : 310} style={{transform: `rotate(${r}deg)`, filter: 'drop-shadow(0 18px 18px rgba(0,0,0,.28))'}} />
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: Math.abs(slide - i) < 0.5 ? 18 : 6, height: 6, borderRadius: 3, background: Math.abs(slide - i) < 0.5 ? SB.ink : '#c9c4b8'}} />
          ))}
        </div>
      </div>
      <div style={{padding: '16px 14px 0'}}>
        <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SB.mute}}>WAHL</div>
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 20, lineHeight: 1.15, marginTop: 4}}>{p.name}</div>
        <div style={{fontSize: 24, fontWeight: 800, marginTop: 10}}>{soles(p.price)}</div>
        <div style={{fontSize: 11, color: SB.mute, marginTop: 2}}>Impuesto incluido.</div>
        <div style={{display: 'flex', gap: 10, marginTop: 16, alignItems: 'center'}}>
          <div style={{display: 'flex', border: `1px solid ${SB.line}`, borderRadius: 6, height: 46, alignItems: 'center', fontSize: 16}}>
            <div style={{width: 40, textAlign: 'center'}}>−</div>
            <div style={{width: 28, textAlign: 'center', fontWeight: 700}}>1</div>
            <div style={{width: 40, textAlign: 'center'}}>+</div>
          </div>
          <div
            style={{
              flex: 1,
              height: 46,
              borderRadius: 6,
              background: press > 0.5 ? SB.gold : SB.ink,
              color: press > 0.5 ? SB.ink : '#fff',
              display: 'grid',
              placeItems: 'center',
              fontFamily: FONT.head,
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.06em',
              transform: `scale(${1 - Math.sin(press * Math.PI) * 0.05})`,
            }}
          >
            {press > 0.5 ? '✓ AGREGADO' : 'AGREGAR AL CARRITO'}
          </div>
        </div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, padding: '10px 12px', background: SB.cream, borderRadius: 8, fontSize: 11.5}}>
          <Icon name="truck" size={18} />
          Lima Metropolitana: entrega en 18–36 horas hábiles
        </div>
        <div style={{marginTop: 16, fontSize: 13, lineHeight: 1.7}}>
          {specs.map((s, i) => (
            <div key={s} style={{display: 'flex', gap: 8, opacity: ease(t, 20 + i * 4, 30 + i * 4)}}>
              <span style={{color: SB.gold}}>●</span>
              {s}
            </div>
          ))}
        </div>
        <div style={{height: 40}} />
      </div>
    </div>
  );
};

/* ------------------------------------ CARRITO (drawer) ------------------------------------ */

export const CartDrawer: React.FC<{t: number; open: number; press?: number}> = ({t, open, press = 0}) => {
  const p = PRODUCTS[0];
  const bar = ease(t, 14, 40, EASE.inOut);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.45 * open})`}} />
      <div style={{position: 'absolute', top: 0, bottom: 0, right: 0, width: 340, background: '#fff', transform: `translateX(${(1 - open) * 345}px)`, fontFamily: FONT.ui, boxShadow: '-20px 0 40px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column'}}>
        <div style={{height: 64, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: `1px solid ${SB.line}`, justifyContent: 'space-between'}}>
          <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 18}}>Tu carrito</div>
          <div style={{fontSize: 22, color: SB.mute}}>×</div>
        </div>
        <div style={{padding: '14px 18px', borderBottom: `1px solid ${SB.line}`}}>
          <div style={{fontSize: 12, fontWeight: 600, color: bar > 0.98 ? SB.green : SB.ink}}>{bar > 0.98 ? '¡Tienes ENVÍO GRATIS en Lima! 🎉' : 'Envío gratis desde S/ 50'}</div>
          <div style={{height: 6, borderRadius: 3, background: SB.line, marginTop: 8, overflow: 'hidden'}}>
            <div style={{width: `${bar * 100}%`, height: '100%', background: `linear-gradient(90deg, ${SB.gold}, ${SB.green})`}} />
          </div>
        </div>
        <div style={{display: 'flex', gap: 12, padding: 18}}>
          <div style={{width: 84, height: 96, borderRadius: 8, background: SB.cream, display: 'grid', placeItems: 'center'}}>
            <Machine color={p.color} height={80} style={{transform: 'rotate(-14deg)'}} />
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 12, fontWeight: 600, lineHeight: 1.3}}>{p.name}</div>
            <div style={{fontSize: 13, fontWeight: 700, marginTop: 6}}>{soles(p.price)}</div>
            <div style={{display: 'inline-flex', marginTop: 8, border: `1px solid ${SB.line}`, borderRadius: 5, fontSize: 13}}>
              <span style={{padding: '3px 10px'}}>−</span>
              <span style={{padding: '3px 6px', fontWeight: 700}}>1</span>
              <span style={{padding: '3px 10px'}}>+</span>
            </div>
          </div>
        </div>
        <div style={{flex: 1}} />
        <div style={{padding: 18, borderTop: `1px solid ${SB.line}`}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700}}>
            <span>Subtotal</span>
            <span>{soles(p.price)}</span>
          </div>
          <div style={{fontSize: 11, color: SB.mute, marginTop: 4}}>Envío calculado en el checkout</div>
          <div style={{marginTop: 14, height: 50, borderRadius: 6, background: SB.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: FONT.head, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', transform: `scale(${1 - Math.sin(press * Math.PI) * 0.05})`}}>
            FINALIZAR COMPRA
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------ CHECKOUT ------------------------------------ */

const Field: React.FC<{label: string; value: string; focus?: boolean; caret?: boolean}> = ({label, value, focus, caret}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{border: `1.5px solid ${focus ? SB.ink : SB.line}`, borderRadius: 6, padding: '6px 10px', marginTop: 8, background: '#fff'}}>
      <div style={{fontSize: 10, color: SB.mute}}>{label}</div>
      <div style={{fontSize: 13.5, height: 18, color: SB.ink}}>
        {value}
        {caret && Math.floor(frame / 8) % 2 === 0 && <span style={{borderLeft: `1.5px solid ${SB.ink}`, marginLeft: 1}} />}
      </div>
    </div>
  );
};

export const CheckoutScreen: React.FC<{t: number; scroll: number; press?: number}> = ({t, scroll, press = 0}) => {
  const email = typed('cliente@correo.com', t, 10, 1.2);
  const name = typed('Carlos Ramírez', t, 34, 1.1);
  const addr = typed('Av. Alfredo Mendiola 3471', t, 52, 1.4);
  const card = typed('4242 4242 4242 4242', t, 120, 1.6);
  const exp = typed('12 / 28', t, 136, 1.2);
  const ship = ease(t, 80, 92);
  return (
    <div style={{width: SW, background: '#fafaf8', transform: `translateY(${-scroll}px)`, fontFamily: FONT.ui}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderBottom: `1px solid ${SB.line}`}}>
        <Logo size={20} />
      </div>
      <div style={{margin: 14, padding: '12px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${SB.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13}}>
        <span style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <Icon name="cart" size={18} />
          Resumen del pedido (1)
        </span>
        <b>{soles(PRODUCTS[0].price)}</b>
      </div>
      <div style={{padding: '4px 14px'}}>
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 17}}>Contacto</div>
        <Field label="Correo electrónico" value={email} focus={t > 8 && t < 34} caret={t > 8 && t < 34} />
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 17, marginTop: 18}}>Entrega</div>
        <Field label="País / Región" value="Perú" />
        <Field label="Nombre" value={name} focus={t >= 34 && t < 52} caret={t >= 34 && t < 52} />
        <Field label="Dirección" value={addr} focus={t >= 52 && t < 80} caret={t >= 52 && t < 80} />
        <Field label="Distrito" value="Los Olivos, Lima" />
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 17, marginTop: 18}}>Método de envío</div>
        <div style={{marginTop: 8, border: `1.5px solid ${ship > 0.5 ? SB.ink : SB.line}`, borderRadius: 6, padding: '12px 12px', display: 'flex', gap: 10, alignItems: 'center', background: ship > 0.5 ? '#f7f3e8' : '#fff'}}>
          <div style={{width: 18, height: 18, borderRadius: 9, border: `2px solid ${SB.ink}`, display: 'grid', placeItems: 'center'}}>
            <div style={{width: 9, height: 9, borderRadius: 5, background: SB.ink, transform: `scale(${ship})`}} />
          </div>
          <div style={{flex: 1, fontSize: 12.5}}>
            Lima Metropolitana
            <div style={{fontSize: 10.5, color: SB.mute}}>18–36 horas hábiles</div>
          </div>
          <b style={{fontSize: 12.5, color: SB.green}}>GRATIS</b>
        </div>
        <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 17, marginTop: 18}}>Pago</div>
        <div style={{fontSize: 11, color: SB.mute, display: 'flex', gap: 6, alignItems: 'center', marginTop: 4}}>
          <Icon name="lock" size={13} color={SB.mute} /> Todas las transacciones son seguras y están encriptadas.
        </div>
        <div style={{marginTop: 8, border: `1.5px solid ${SB.ink}`, borderRadius: 6, overflow: 'hidden', background: '#fff'}}>
          <div style={{padding: '10px 12px', background: '#f7f3e8', fontSize: 12.5, fontWeight: 600, display: 'flex', justifyContent: 'space-between'}}>
            Tarjeta de crédito / débito
            <span style={{display: 'flex', gap: 4}}>
              {['#1a1f71', '#eb001b', '#2e77bb'].map((c) => (
                <span key={c} style={{width: 26, height: 16, borderRadius: 3, background: c}} />
              ))}
            </span>
          </div>
          <div style={{padding: '2px 10px 10px'}}>
            <Field label="Número de tarjeta" value={card} focus={t >= 118 && t < 136} caret={t >= 118 && t < 136} />
            <div style={{display: 'flex', gap: 8}}>
              <div style={{flex: 1}}>
                <Field label="Vencimiento" value={exp} focus={t >= 136 && t < 150} caret={t >= 136 && t < 150} />
              </div>
              <div style={{flex: 1}}>
                <Field label="CVV" value={t > 150 ? '•••' : ''} />
              </div>
            </div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 16, fontWeight: 800}}>
          <span>Total</span>
          <span>PEN {soles(PRODUCTS[0].price)}</span>
        </div>
        <div style={{marginTop: 12, height: 54, borderRadius: 6, background: SB.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: FONT.head, fontWeight: 800, fontSize: 15, transform: `scale(${1 - Math.sin(press * Math.PI) * 0.05})`}}>
          Pagar ahora
        </div>
        <div style={{height: 60}} />
      </div>
    </div>
  );
};

/* ------------------------------------ CONFIRMACIÓN ------------------------------------ */

export const ConfirmScreen: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: t - 4, fps, config: {damping: 11, stiffness: 180}});
  const draw = interpolate(t, [12, 26], [0, 1], {...clamp, easing: EASE.out});
  return (
    <div style={{width: SW, height: 900, background: '#fff', fontFamily: FONT.ui, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center'}}>
        <Logo size={20} />
      </div>
      <div style={{marginTop: 90, width: 120, height: 120, borderRadius: 60, background: SB.green, display: 'grid', placeItems: 'center', transform: `scale(${s})`, boxShadow: `0 0 0 ${14 * s}px rgba(31,138,76,.15)`}}>
        <svg width={64} height={64} viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} />
        </svg>
      </div>
      <div style={{fontFamily: FONT.head, fontWeight: 800, fontSize: 24, marginTop: 30, opacity: ease(t, 16, 28)}}>¡Gracias por tu compra!</div>
      <div style={{fontSize: 14, color: SB.mute, marginTop: 8, opacity: ease(t, 20, 32)}}>Tu pedido está confirmado</div>
      <div style={{marginTop: 30, width: 330, padding: 16, borderRadius: 10, border: `1px solid ${SB.line}`, display: 'flex', gap: 12, alignItems: 'center', opacity: ease(t, 26, 38), transform: `translateY(${(1 - ease(t, 26, 38)) * 20}px)`}}>
        <Icon name="truck" size={28} />
        <div style={{fontSize: 13}}>
          <b>Llega en 18–36 horas hábiles</b>
          <div style={{color: SB.mute, fontSize: 12}}>Lima Metropolitana · Envío gratis</div>
        </div>
      </div>
    </div>
  );
};
