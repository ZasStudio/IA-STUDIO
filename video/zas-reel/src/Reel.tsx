import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadPoppins} from '@remotion/google-fonts/Poppins';
import {loadFont as loadLobster} from '@remotion/google-fonts/Lobster';
import {CAPTIONS, Caption, FASES, Fase, FPS, SFX, VO_END, ZOOMS, s} from './timeline';

const {fontFamily: POP} = loadPoppins('normal', {weights: ['500', '600', '800', '900'], subsets: ['latin', 'latin-ext']});
const {fontFamily: LOB} = loadLobster('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});

const RED = '#F0173F';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const SHADOW = '0 3px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)';

// ---------- Talking head with jump-cut punch-ins, push-ins and impact shake ----------
const zoomAt = (t: number) => {
  const z = ZOOMS.find((q) => t >= q.t0 && t < q.t1) ?? ZOOMS[ZOOMS.length - 1];
  const p = Math.min(1, Math.max(0, (t - z.t0) / (z.t1 - z.t0)));
  const base = z.s0 + (z.s1 - z.s0) * p;
  // punch: brief overshoot that settles in ~5 frames, sells the jump cut
  const k = Math.min(1, ((t - z.t0) * FPS) / 5);
  return z.punch ? base * (1 + 0.04 * (1 - easeOut(k))) : base;
};

const Speaker: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let sc = zoomAt(t);
  let x = 0;
  let y = 0;
  // camera shake on the "HUMO" impact
  if (t >= 4.72 && t < 5.25) {
    const a = 22 * (1 - (t - 4.72) / 0.53);
    x = Math.sin(f * 2.7) * a;
    y = Math.cos(f * 3.3) * a * 0.7;
  }
  // Fase 2: speaker becomes a blurred, dimmed backdrop behind the glass card
  const blur = interpolate(t, [10.25, 10.45, 13.05, 13.25], [0, 22, 22, 0], clamp);
  const dim = interpolate(t, [10.25, 10.45, 13.05, 13.25], [1, 0.55, 0.55, 1], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#111'}}>
      <OffthreadVideo
        src={staticFile('speaker.mp4')}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transformOrigin: '50% 27%',
          transform: `translate(${x}px, ${y}px) scale(${sc})`,
          filter: `contrast(1.06) saturate(1.1) brightness(${dim}) blur(${blur}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- Stock B-roll: full screen (whip-pan in + Ken Burns) or lower-half overlay ----------
const BRoll: React.FC<{
  src: string;
  dur: number;
  startFrom?: number;
  kb?: [number, number];
  whip?: number; // direction of the whip-pan entrance, 0 = none
  mode?: 'full' | 'lower';
  tint?: string;
}> = ({src, dur, startFrom = 0, kb = [1.06, 1.16], whip = 1, mode = 'full', tint}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc = interpolate(f, [0, dur], kb, clamp);
  const wx = whip ? interpolate(f, [0, 6], [whip * 1080, 0], {...clamp, easing: easeOut}) : 0;
  const wb = whip ? interpolate(f, [0, 6], [36, 0], clamp) : 0;
  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      startFrom={startFrom}
      style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${sc})`}}
    />
  );
  if (mode === 'lower') {
    const rise = spring({frame: f, fps, config: {damping: 18, stiffness: 120}});
    const out = interpolate(f, [dur - 6, dur], [0, 1], clamp);
    return (
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '50%',
            overflow: 'hidden',
            transform: `translateY(${(1 - rise) * 700 + out * 700}px)`,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 26%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 26%)',
          }}
        >
          {video}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `translateX(${wx}px)`, filter: `blur(${wb}px)`}}>
      {video}
      {tint ? <AbsoluteFill style={{backgroundColor: tint, mixBlendMode: 'multiply', opacity: 0.55}} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

// ---------- Hook title (top box, like a news lower-third) ----------
const HookTitle: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const inn = spring({frame: f - 2, fps, config: {damping: 11, stiffness: 160}});
  const out = interpolate(t, [5.3, 5.55], [0, 1], clamp);
  if (t > 5.6) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 150}}>
      <div
        style={{
          transform: `translateY(${-out * 260}px) scale(${0.4 + inn * 0.6}) rotate(-2deg)`,
          opacity: Math.min(1, inn * 1.5) * (1 - out),
          background: 'linear-gradient(180deg, #2A5BE0 0%, #173DB0 100%)',
          border: '5px solid #fff',
          borderRadius: 22,
          padding: '14px 38px 18px',
          boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
          textAlign: 'center',
          fontFamily: POP,
          color: '#fff',
          lineHeight: 1,
        }}
      >
        <div style={{fontSize: 42, fontWeight: 800, letterSpacing: 1}}>
          CUIDADO CON LOS <span style={{color: '#FF4D6D'}}>ANUNCIOS</span>
        </div>
        <div style={{fontSize: 96, fontWeight: 900, letterSpacing: -2, marginTop: 6}}>"HECHOS CON IA"</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Word-group subtitles with emphasis line ----------
const CaptionView: React.FC<{c: Caption}> = ({c}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = interpolate(f, [0, 4], [0.82, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const op = interpolate(f, [0, 2], [0, 1], clamp);
  const bf = c.tb !== undefined ? f - s(c.tb - c.t0) : -1;
  const bPop = spring({frame: bf, fps, config: {damping: 9, stiffness: 220}});
  const wobble = c.red && bf >= 0 ? Math.sin(bf * 1.6) * Math.max(0, 6 - bf * 0.4) : 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 1000, fontFamily: POP}}>
      <div style={{transform: `scale(${pop})`, opacity: op, textAlign: 'center'}}>
        <div style={{fontSize: 52, fontWeight: 600, color: '#fff', textShadow: SHADOW}}>{c.top}</div>
        {c.bold && bf >= 0 ? (
          <div
            style={{
              marginTop: -2,
              fontSize: c.red ? 150 : 86,
              fontWeight: c.red ? 900 : 800,
              letterSpacing: c.red ? 2 : -1.5,
              lineHeight: 1,
              color: c.red ? RED : '#fff',
              textShadow: c.red ? '0 0 0 #fff, 0 6px 26px rgba(0,0,0,0.55), 0 0 2px #fff' : SHADOW,
              WebkitTextStroke: c.red ? '3px #fff' : undefined,
              transform: `scale(${0.5 + bPop * 0.5}) rotate(${wobble}deg)`,
            }}
          >
            {c.bold}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- "Fase N" script title + script subtitle ----------
const FaseView: React.FC<{fase: Fase}> = ({fase}) => {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, 5], [1.7, 1], {...clamp, easing: easeOut});
  const op = interpolate(f, [0, 3], [0, 1], clamp);
  const bl = interpolate(f, [0, 5], [12, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: fase.y - 120, fontFamily: LOB}}>
      <div
        style={{
          fontSize: 150,
          color: RED,
          lineHeight: 1,
          transform: `scale(${sc}) rotate(-4deg)`,
          opacity: op,
          filter: `blur(${bl}px)`,
          textShadow: '0 0 3px #fff, 0 0 1px #fff, 0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {fase.title}
      </div>
      <div style={{display: 'flex', gap: 18, marginTop: -6, maxWidth: 980, flexWrap: 'wrap', justifyContent: 'center'}}>
        {fase.parts.map((p) => {
          const lf = f - s(p.t - fase.t0);
          if (lf < 0) return null;
          const y = interpolate(lf, [0, 5], [26, 0], {...clamp, easing: easeOut});
          const o = interpolate(lf, [0, 4], [0, 1], clamp);
          return (
            <span key={p.text} style={{fontSize: 74, color: '#fff', transform: `translateY(${y}px)`, opacity: o, textShadow: SHADOW}}>
              {p.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Floating glassmorphism card with stock video (3D tilt + float) ----------
const GlassCard: React.FC<{src: string; dur: number}> = ({src, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inn = spring({frame: f, fps, config: {damping: 14, stiffness: 110}});
  const out = interpolate(f, [dur - 6, dur], [0, 1], clamp);
  const rotY = Math.sin(f / 18) * 7 - (1 - inn) * 35;
  const floatY = Math.sin(f / 14) * 10;
  return (
    <AbsoluteFill style={{perspective: 1500, alignItems: 'center', paddingTop: 170}}>
      <div
        style={{
          width: 760,
          height: 960,
          padding: 16,
          borderRadius: 44,
          background: 'rgba(255,255,255,0.14)',
          border: '2px solid rgba(255,255,255,0.55)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6)',
          transform: `translateY(${floatY + (1 - inn) * 500 + out * 900}px) rotateY(${rotY}deg) rotateX(6deg) scale(${0.7 + inn * 0.3})`,
          opacity: inn,
        }}
      >
        <div style={{width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative'}}>
          <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(115deg, transparent ${20 + f}%, rgba(255,255,255,0.28) ${28 + f}%, transparent ${36 + f}%)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Brand logo chip ----------
const LogoChip: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inn = spring({frame: f, fps, config: {damping: 12, stiffness: 170}});
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 1235, fontFamily: POP}}>
      <div
        style={{
          transform: `scale(${inn})`,
          padding: '18px 54px 22px',
          borderRadius: 28,
          background: 'rgba(12,14,22,0.62)',
          border: '2px solid rgba(255,255,255,0.35)',
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1,
          boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{fontSize: 96, fontWeight: 900, letterSpacing: 6}}>
          ZAS<span style={{color: RED}}>.</span>
        </div>
        <div style={{fontSize: 30, fontWeight: 600, letterSpacing: 16, marginTop: 4, marginLeft: 16}}>STUDIO</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Transitions ----------
const Flash: React.FC<{dur?: number}> = ({dur = 4}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#fff', opacity: interpolate(f, [0, dur], [0.9, 0], clamp)}} />;
};

const LightLeak: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, dur], [-30, 130]);
  const o = interpolate(f, [0, dur * 0.3, dur], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: 'screen',
        opacity: o,
        background: `radial-gradient(circle at ${x}% 40%, rgba(255,170,60,0.95) 0%, rgba(255,60,90,0.6) 25%, transparent 55%)`,
      }}
    />
  );
};

const Fade: React.FC<{children: React.ReactNode; dur: number; inF?: number; outF?: number; max?: number}> = ({
  children,
  dur,
  inF = 4,
  outF = 6,
  max = 1,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, inF, dur - outF, dur], [0, max, max, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// ---------- Outro card (search-bar CTA) ----------
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inn = spring({frame: f, fps, config: {damping: 16, stiffness: 120}});
  const glitch = f < 14 ? (f % 3) * 7 : 0;
  const handle = '@zas.studio';
  const typed = handle.slice(0, Math.max(0, Math.floor((f - 27) / 2.7)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const btn = spring({frame: f - s(2.4), fps, config: {damping: 10, stiffness: 180}});
  const bar = interpolate(f, [12, 24], [0, 1], {...clamp, easing: easeOut});
  const logo = (color: string, dx: number) => (
    <div style={{position: 'absolute', inset: 0, color, transform: `translateX(${dx}px)`, mixBlendMode: 'screen'}}>
      ZAS<span style={{color: color === '#fff' ? RED : color}}>.</span>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 38%, #1B1F2E 0%, #0C0E16 70%)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: POP,
        transform: `scale(${1.25 - inn * 0.25})`,
        opacity: Math.min(1, inn * 2),
      }}
    >
      <div style={{position: 'relative', width: 520, height: 190, fontSize: 180, fontWeight: 900, letterSpacing: 8, lineHeight: '190px', textAlign: 'center'}}>
        {logo('#25F4EE', -glitch - 4)}
        {logo('#FE2C55', glitch + 4)}
        {logo('#fff', 0)}
      </div>
      <div style={{color: '#fff', fontSize: 34, fontWeight: 600, letterSpacing: 18, marginTop: 6, marginLeft: 18}}>STUDIO</div>
      <div
        style={{
          marginTop: 70,
          width: 680,
          height: 92,
          borderRadius: 46,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 34px',
          gap: 20,
          transform: `scaleX(${bar})`,
          boxShadow: '-6px 0 0 #25F4EE, 6px 0 0 #FE2C55',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="16" y1="16" x2="21.5" y2="21.5" />
        </svg>
        <div style={{fontSize: 42, fontWeight: 600, color: '#111'}}>
          {typed}
          <span style={{opacity: caret && bar > 0.99 ? 1 : 0, color: RED}}>|</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 50,
          padding: '20px 70px',
          borderRadius: 18,
          background: RED,
          color: '#fff',
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: 2,
          transform: `scale(${btn})`,
          boxShadow: '0 14px 40px rgba(240,23,63,0.45)',
        }}
      >
        SÍGUENOS
      </div>
    </AbsoluteFill>
  );
};

// ---------- Composition ----------
const Seq: React.FC<{a: number; b: number; children: React.ReactNode}> = ({a, b, children}) => (
  <Sequence from={s(a)} durationInFrames={s(b) - s(a)} layout="none">
    {children}
  </Sequence>
);

export const Reel: React.FC = () => {
  const outroStart = VO_END;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* A-roll */}
      <Sequence durationInFrames={s(outroStart) + 2}>
        <Speaker />
      </Sequence>

      {/* lower-half overlay B-roll (rises from the bottom, feathered top edge) */}
      <Seq a={1.0} b={2.6}>
        <BRoll src="br/filmset.mp4" dur={s(1.6)} mode="lower" whip={0} kb={[1.05, 1.1]} />
      </Seq>

      <Sequence durationInFrames={s(5.6)}>
        <HookTitle />
      </Sequence>

      {/* full-screen B-roll cutaways */}
      <Seq a={2.6} b={3.98}>
        <BRoll src="br/stopwatch.mp4" dur={s(1.38)} tint="#FF9A3C" kb={[1.12, 1.3]} />
      </Seq>
      <Seq a={4.5} b={5.7}>
        <Fade dur={s(1.2)} max={0.8}>
          <AbsoluteFill style={{mixBlendMode: 'screen'}}>
            <BRoll src="br/smoke.mp4" dur={s(1.2)} whip={0} kb={[1.0, 1.25]} />
          </AbsoluteFill>
        </Fade>
      </Seq>
      <Seq a={4.72} b={5.4}>
        <Fade dur={s(0.68)} inF={1} outF={10} max={0.32}>
          <AbsoluteFill style={{backgroundColor: RED, mixBlendMode: 'multiply'}} />
        </Fade>
      </Seq>
      <Seq a={7.75} b={10.3}>
        <BRoll src="br/storyboard.mp4" dur={s(2.55)} whip={1} />
      </Seq>
      <Seq a={10.3} b={13.2}>
        <GlassCard src="br/aiphotos.mp4" dur={s(2.9)} />
      </Seq>
      <Seq a={13.2} b={14.75}>
        <BRoll src="br/timeline.mp4" dur={s(1.55)} whip={-1} />
      </Seq>
      <Seq a={14.75} b={15.35}>
        <BRoll src="br/mixer.mp4" dur={s(0.6)} whip={1} startFrom={s(1)} />
      </Seq>
      <Seq a={15.35} b={16.1}>
        <BRoll src="br/colorgrade.mp4" dur={s(0.75)} whip={-1} startFrom={s(1)} />
      </Seq>
      <Seq a={18.0} b={19.24}>
        <BRoll src="br/filmset.mp4" dur={s(1.24)} whip={1} startFrom={s(2.5)} kb={[1.15, 1.25]} />
      </Seq>

      {/* transitions */}
      <Seq a={2.6} b={2.75}>
        <Flash dur={4} />
      </Seq>
      <Seq a={16.1} b={16.6}>
        <Flash dur={4} />
        <LightLeak dur={s(0.5)} />
      </Seq>
      <Seq a={10.3} b={10.8}>
        <LightLeak dur={s(0.5)} />
      </Seq>

      {/* typography */}
      {CAPTIONS.map((c) => (
        <Seq key={c.t0} a={c.t0} b={c.t1}>
          <CaptionView c={c} />
        </Seq>
      ))}
      {FASES.map((fa) => (
        <Seq key={fa.title} a={fa.t0} b={fa.t1}>
          <FaseView fase={fa} />
        </Seq>
      ))}
      <Seq a={17.0} b={18.0}>
        <LogoChip />
      </Seq>

      {/* outro */}
      <Sequence from={s(outroStart)}>
        <Outro />
      </Sequence>

      {/* sound: voiceover, music bed (ducked under VO), SFX */}
      <Audio src={staticFile('audio/vo.mp3')} />
      <Audio
        src={staticFile('audio/music.mp3')}
        volume={(f) =>
          interpolate(f, [0, 8, s(VO_END) - 6, s(VO_END) + 6, s(24.3), s(25)], [0, 0.16, 0.16, 0.5, 0.5, 0], clamp)
        }
      />
      {SFX.map((x, i) => (
        <Sequence key={i} from={s(x.t)} durationInFrames={x.d ? s(x.d) : undefined}>
          <Audio src={staticFile(`sfx/${x.f}.mp3`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
