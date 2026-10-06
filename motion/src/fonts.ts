import '@fontsource-variable/plus-jakarta-sans';
import {continueRender, delayRender} from 'remotion';

// Espera a que la fuente variable esté cargada antes de renderizar cualquier frame
// (si no, los primeros frames saldrían con la fuente de sistema).
const handle = delayRender('Cargando Plus Jakarta Sans');
Promise.all(
  [300, 400, 500, 700, 800].map((w) => document.fonts.load(`${w} 40px "Plus Jakarta Sans Variable"`)),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
