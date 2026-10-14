import type {CardSpec} from './Editorial';

/**
 * Guion de subtítulos. `w` = rango de palabras de words.json; el marcado debe consumir
 * exactamente ese número de palabras (lo valida `npm run check:barber`).
 * y ≈ 470: franja superior en planos de presentadora (texto DETRÁS de ella).
 */
const TOP = 470;
const LOW = 1260;

export const CARDS: CardSpec[] = [
  // gancho
  {w: [0, 8], t: '¿*POR *QUÉ / _tenemos _que / *PONER / _el *PAPEL / _de *CUELLO?@cyan^', y: 500, size: 0.9, behind: true, end: 1.98},
  {w: [9, 15], t: '_y _quiénes / *FUERON / _los·que·lo / *INVENTARON?!@magenta^', y: TOP, behind: true, end: 3.55},
  {w: [16, 16], t: '*RETROCEDAMOS@cyan^', y: TOP + 40, size: 0.85, behind: true, end: 4.55},
  {w: [17, 19], t: '_A _finales _del', y: 760, size: 1.25, end: 6.25},
  // barberías del XIX
  {w: [22, 26], t: '_las *BARBERÍAS / _eran _lugares / *CONCURRIDOS', y: LOW, end: 8.35},
  {w: [27, 31], t: '*RUIDOSOS / _y _llenos _de / *VIDA@gold^', y: LOW, end: 10.22},
  {w: [32, 35], t: '*HOMBRES / _de _todas _las', y: LOW + 40, end: 11.5},
  {w: [36, 37], t: '*CLASES / ~SOCIALES', y: 1330, end: 12.15},
  {w: [38, 43], t: '*SE *SENTABAN / _en _la _misma / *SILLA!@red', y: 1300, end: 13.8},
  {w: [44, 48], t: '*CUBIERTOS / _por _la _misma / *CAPA', y: 1340, end: 15.4},
  {w: [49, 51], t: '_día _tras _día', y: 1340, size: 1.2, end: 16.35},
  {w: [52, 60], t: '*NADIE / _se _detenía _a / ~PENSAR / _en / lo·que·pasaba', y: 900, size: 1.15, end: 18.7},
  // ciencia
  {w: [61, 64], t: '*HASTA _que _la / *CIENCIA@cyan^', y: TOP, behind: true, end: 20.0},
  {w: [65, 66], t: '_lo / *HIZO+', y: TOP, behind: true, end: 20.62},
  {w: [67, 68], t: '_En / *1861@blue^', y: 330, size: 0.95, end: 22.2},
  {w: [69, 74], t: '*LOUIS *PASTEUR / _el _famoso / _científico _francés', y: 360, size: 0.75, end: 25.25},
  {w: [75, 79], t: '*REVOLUCIONÓ / _el *MUNDO / _al _demostrar', y: 360, size: 0.75, end: 26.95},
  {w: [80, 84], t: '_la *TEORÍA / _de _los / *GÉRMENES@cyan^', y: 360, size: 0.75, end: 28.45},
  {w: [85, 90], t: '_por _primera _vez / _la *HUMANIDAD / _entendía', y: 360, size: 0.75, end: 30.62},
  {w: [91, 97], t: '_que _las *ENFERMEDADES / _no _eran / *CASTIGOS / ~DIVINOS', y: 360, size: 0.72, end: 32.95},
  {w: [98, 100], t: '_sino / _organismos / *MICROSCÓPICOS@cyan^', y: 360, size: 0.75, end: 34.88},
  {w: [101, 105], t: '_que _se _transmitían / _por *CONTACTO!@red', y: 360, size: 0.75, end: 36.6},
  {w: [106, 107], t: '*INTERESANTE / *¿NO?+', y: TOP, behind: true, end: 37.8},
  {w: [108, 112], t: '*ESTA@cyan+ / *REVELACIÓN / ~ENCENDIÓ@cyan^ / _una / *ALARMA', y: 960, size: 1.05, end: 39.9},
  {w: [113, 114], t: '_en *HOSPITALES', y: LOW, end: 40.9},
  {w: [115, 120], t: '*COCINAS / _y _también _en _las / *BARBERÍAS@cyan^', y: LOW, end: 42.8},
  // mapa
  {w: [121, 124], t: '*DURANTE / _las _siguientes / *DÉCADAS', y: 430, exit: 'dust', end: 44.6},
  {w: [125, 125], t: '_especialmente', y: 330, size: 1.1, end: 47.0},
  {w: [131, 134], t: '*COMENZÓ / _una _nueva / *OBSESIÓN', y: 560, end: 48.5},
  {w: [135, 136], t: '_la / *HIGIENE@cyan+^', y: 560, end: 49.4},
  // protocolos
  {w: [137, 138], t: '_ya *VES', y: TOP, behind: true, end: 50.1},
  {w: [139, 145], t: '_por _eso _es / *MUY·IMPORTANTE / _que *CONOZCAS', y: TOP, behind: true, size: 0.9, end: 51.95},
  {w: [146, 149], t: '_los *PROTOCOLOS / _de / *BIOSEGURIDAD@cyan^', y: TOP, behind: true, size: 0.95, end: 53.85},
  {w: [150, 151], t: '_bueno, / *SEGUIMOS', y: TOP, behind: true, end: 54.78},
  {w: [152, 157], t: '*NO *EXISTE / _un _solo _nombre / *GRABADO', y: 1250, size: 0.9, end: 56.6},
  {w: [158, 165], t: '_en _la *HISTORIA / _como _el *INVENTOR / _del / *NECK%PAPER@magenta^', y: 1250, size: 0.9, end: 58.8},
  {w: [166, 169], t: '_El _momento / *CLAVE@blue+^ / _llegó', y: 420, end: 62.15},
  {w: [170, 171], t: 'alrededor _de', y: 690, size: 0.8, end: 62.15},
  {w: [173, 176], t: '_cuando _las / *AUTORIDADES / _sanitarias', y: 1300, size: 0.95, end: 64.0},
  {w: [177, 180], t: '_empezaron _a / *INSPECCIONAR / *BARBERÍAS@red^', y: 1300, size: 0.95, end: 65.85},
  {w: [181, 183], t: '_En _esa _misma', y: 760, size: 1.2, end: 67.4},
  {w: [185, 186], t: '_figuras _como', y: 1330, size: 1.1, end: 68.9},
  {w: [189, 192], t: '*PRESIDENTE / _de / *ESTADOS·UNIDOS', y: 830, size: 0.85, end: 71.15},
  {w: [193, 197], t: '_impulsaban / *REFORMAS / _de _salud _pública', y: 520, end: 73.5},
  {w: [198, 202], t: '_y *LIMPIEZA / _en _espacios _comunes', y: 520, end: 75.3},
  {w: [203, 207], t: '_la _imagen _del / *HOMBRE / ~MODERNO', y: 1300, size: 0.95, end: 76.9},
  {w: [208, 210], t: '_debía _ir / *ACOMPAÑADA', y: 1300, size: 0.95, end: 78.3},
  {w: [211, 215], t: '_de *ORDEN / *PULCRITUD@cyan^ / _y / *RESPONSABILIDAD', y: 1300, size: 0.9, end: 80.9},
  {w: [216, 221], t: '_un%simple / *PAPEL / _colocado _alrededor / _del *CUELLO', y: 420, size: 0.95, end: 83.9},
  {w: [222, 222], t: '_creaba', y: 420, size: 1.2, end: 84.45},
  {w: [223, 230], t: '*UNA / *BARRERA / *PERFECTA!@red / _entre _la _piel / =del =cliente@red^', y: 720, end: 87.05},
  {w: [231, 234], t: '_y _la *CAPA / =reutilizable@red^', y: 720, end: 88.5},
  {w: [235, 238], t: '*PAPEL / *NUEVO / ~CLIENTE / _nuevo+', y: 900, size: 1.1, end: 90.85},
  {w: [239, 243], t: '*SIN / *CONTACTO / _y _sin / *RIESGO@red^', y: 900, size: 1.1, end: 92.85},
  {w: [244, 246], t: '_Incluso / *PERSONAJES / _icónicos', y: 470, size: 0.9, end: 94.65},
  {w: [247, 252], t: '_de _la _época / *DORADA@gold^ / _del *CINE', y: 470, size: 0.9, end: 96.3},
  {w: [253, 258], t: '_como *CLARK *GABLE / _o *FRANK *SINATRA', y: 470, size: 0.85, end: 98.7},
  {w: [259, 263], t: '_eran _conocidos _por / *FRECUENTAR / *BARBERÍAS', y: 1380, size: 0.9, end: 100.62},
  {w: [264, 270], t: '_donde _la *LIMPIEZA / _era _parte _del / *LUJO@gold+^', y: 1380, size: 0.9, end: 103.0},
  // hoy
  {w: [271, 276], t: '*HOY / _más _de / *100 *AÑOS / _después', y: TOP, behind: true, end: 104.3},
  {w: [277, 280], t: '_el *NECK%PAPER@magenta^ / _sigue _ahí', y: TOP, behind: true, end: 105.95},
  {w: [281, 288], t: '_no _llaman _la / *ATENCIÓN / _no _protagonizan / _el *CORTE', y: TOP, behind: true, size: 0.9, end: 108.7},
  {w: [293, 296], t: '_de _que _la / *BARBERÍA', y: TOP, behind: true, end: 111.1},
  {w: [297, 302], t: '_no _solo _se _trata / _de *ESTILO', y: TOP, behind: true, end: 112.55},
  {w: [303, 305], t: '_sino _de / *CONFIANZA@magenta+^', y: TOP, behind: true, end: 113.65},
  {w: [306, 311], t: '_porque _a _veces / _los *GRANDES / *AVANCES', y: TOP, behind: true, end: 115.8},
  {w: [312, 314], t: '_no _hacen / ~RUIDO', y: TOP, behind: true, end: 116.95},
  {w: [315, 316], t: '*SOLO / *PROTEGEN@cyan!^', y: TOP, behind: true, end: 118.3},
];
