import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter/wght-italic.css';
import {continueRender, delayRender} from 'remotion';

// Espera a que la fuente variable esté cargada antes de renderizar cualquier frame
// (si no, los primeros frames saldrían con la fuente de sistema).
const handle = delayRender('Cargando fuentes');
Promise.all(
  [300, 400, 500, 700, 800].flatMap((w) => [
    document.fonts.load(`${w} 40px "Plus Jakarta Sans Variable"`),
    document.fonts.load(`${w} 40px "Inter Variable"`),
    document.fonts.load(`italic ${w} 40px "Inter Variable"`),
  ]),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
