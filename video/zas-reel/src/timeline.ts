// Timeline of the reel, in seconds. Voiceover starts at t=0 (word times come from faster-whisper).
export const FPS = 30;
export const DURATION_S = 25;
export const VO_END = 20.85;
export const s = (sec: number) => Math.round(sec * FPS);

export type Caption = {
  t0: number;
  t1: number;
  top: string;
  bold?: string; // second, bigger line (emphasis), appears at tb
  tb?: number;
  red?: boolean; // red uppercase "alarm" style
};

export const CAPTIONS: Caption[] = [
  {t0: 0.0, t1: 0.34, top: 'Si alguien'},
  {t0: 0.34, t1: 0.98, top: 'te promete'},
  {t0: 0.98, t1: 1.8, top: 'un anuncio', bold: 'de cine', tb: 1.44},
  {t0: 1.8, t1: 2.6, top: 'hecho con IA'},
  {t0: 2.6, t1: 3.9, top: 'en', bold: 'cinco minutos', tb: 2.82},
  {t0: 3.98, t1: 4.3, top: 'te está'},
  {t0: 4.3, t1: 5.45, top: 'vendiendo', bold: 'HUMO', tb: 4.72, red: true},
  {t0: 5.52, t1: 6.28, top: 'Un spot real'},
  {t0: 6.28, t1: 7.75, top: 'pasa por', bold: 'tres fases', tb: 6.9},
  {t0: 16.18, t1: 16.88, top: 'Así trabajamos'},
  {t0: 16.88, t1: 17.95, top: 'en', bold: 'ZAS Studio', tb: 17.06},
  {t0: 18.0, t1: 18.82, top: 'Síguenos'},
  {t0: 18.82, t1: 19.24, top: 'y aprende'},
  {t0: 19.24, t1: 20.02, top: 'a crear anuncios'},
  {t0: 20.02, t1: 20.85, top: 'que', bold: 'sí venden', tb: 20.16},
];

export type Fase = {t0: number; t1: number; title: string; y: number; parts: {t: number; text: string}[]};

export const FASES: Fase[] = [
  {t0: 8.14, t1: 10.3, title: 'Fase 1', y: 1010, parts: [{t: 9.0, text: 'Guion y storyboard'}]},
  {t0: 10.38, t1: 13.2, title: 'Fase 2', y: 1250, parts: [{t: 11.36, text: 'Imágenes y video con IA'}]},
  {
    t0: 13.3,
    t1: 16.1,
    title: 'Fase 3',
    y: 1010,
    parts: [
      {t: 14.12, text: 'Edición,'},
      {t: 14.8, text: 'sonido'},
      {t: 15.4, text: 'y color'},
    ],
  },
];

// Camera on the talking head: piecewise zoom segments (punch-ins on phrase changes).
export type Zoom = {t0: number; t1: number; s0: number; s1: number; punch?: boolean};
export const ZOOMS: Zoom[] = [
  {t0: 0, t1: 0.98, s0: 1.0, s1: 1.05},
  {t0: 0.98, t1: 1.8, s0: 1.14, s1: 1.17, punch: true},
  {t0: 1.8, t1: 3.98, s0: 1.02, s1: 1.06, punch: true},
  {t0: 3.98, t1: 4.72, s0: 1.12, s1: 1.15, punch: true},
  {t0: 4.72, t1: 5.52, s0: 1.32, s1: 1.36, punch: true},
  {t0: 5.52, t1: 6.9, s0: 1.0, s1: 1.05, punch: true},
  {t0: 6.9, t1: 10.3, s0: 1.16, s1: 1.2, punch: true},
  {t0: 10.3, t1: 16.1, s0: 1.1, s1: 1.18},
  {t0: 16.1, t1: 17.06, s0: 1.0, s1: 1.06, punch: true},
  {t0: 17.06, t1: 19.24, s0: 1.14, s1: 1.18, punch: true},
  {t0: 19.24, t1: 20.02, s0: 1.06, s1: 1.1, punch: true},
  {t0: 20.02, t1: 21.5, s0: 1.24, s1: 1.28, punch: true},
];

export type Sfx = {f: string; t: number; v: number; d?: number};
export const SFX: Sfx[] = [
  {f: 'boom', t: 0.0, v: 0.45},
  {f: 'pop', t: 0.12, v: 0.6},
  {f: 'whoosh1', t: 0.9, v: 0.7},
  {f: 'whoosh2', t: 2.52, v: 0.8},
  {f: 'riser', t: 3.0, v: 0.4},
  {f: 'buzzer', t: 4.66, v: 0.65},
  {f: 'boom', t: 4.72, v: 0.85},
  {f: 'whoosh1', t: 7.62, v: 0.8},
  {f: 'pop', t: 8.14, v: 0.7},
  {f: 'pop', t: 9.0, v: 0.45},
  {f: 'whoosh2', t: 10.22, v: 0.8},
  {f: 'pop', t: 10.38, v: 0.7},
  {f: 'shutter', t: 11.36, v: 0.8},
  {f: 'whoosh1', t: 13.12, v: 0.8},
  {f: 'pop', t: 13.3, v: 0.7},
  {f: 'whoosh2', t: 14.7, v: 0.5},
  {f: 'whoosh1', t: 15.3, v: 0.5},
  {f: 'whoosh2', t: 16.02, v: 0.8},
  {f: 'boom', t: 16.1, v: 0.4},
  {f: 'ding', t: 17.06, v: 0.55},
  {f: 'whoosh1', t: 17.92, v: 0.7},
  {f: 'whoosh2', t: 19.2, v: 0.6},
  {f: 'whoosh1', t: 20.8, v: 0.8},
  {f: 'boom', t: 20.9, v: 0.7},
  ...Array.from({length: 11}, (_, i) => ({f: 'pop', t: 21.9 + i * 0.09, v: 0.18, d: 0.12})),
  {f: 'ding', t: 23.4, v: 0.7},
];
