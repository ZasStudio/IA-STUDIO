import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource/anton';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/montserrat';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/700.css';
import {continueRender, delayRender} from 'remotion';

// Espera a que la fuente variable esté cargada antes de renderizar cualquier frame
// (si no, los primeros frames saldrían con la fuente de sistema).
const handle = delayRender('Cargando fuentes');
Promise.all(
  [300, 400, 500, 700, 800].flatMap((w) => [
    document.fonts.load(`${w} 40px "Plus Jakarta Sans Variable"`),
    document.fonts.load(`${w} 40px "Inter Variable"`),
    document.fonts.load(`italic ${w} 40px "Inter Variable"`),
  ]).concat([
    document.fonts.load('400 40px "Anton"'),
    document.fonts.load('400 40px "Instrument Serif"'),
    document.fonts.load('italic 400 40px "Instrument Serif"'),
    document.fonts.load('800 40px "Montserrat Variable"'),
    document.fonts.load('900 40px "Montserrat Variable"'),
    document.fonts.load('400 40px "Playfair Display"'),
    document.fonts.load('italic 400 40px "Playfair Display"'),
    document.fonts.load('700 40px "Playfair Display"'),
  ]),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
