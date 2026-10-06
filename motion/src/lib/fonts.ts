// Fuentes incluidas en public/fonts (sin red al renderizar). Remotion espera a que carguen.
import { continueRender, delayRender, staticFile } from "remotion";

const FILES: [family: string, weight: string, file: string][] = [
  ["Bebas Neue", "400", "BebasNeue-400"],
  ["Montserrat", "400", "Montserrat-400"], ["Montserrat", "600", "Montserrat-600"], ["Montserrat", "800", "Montserrat-800"],
  ["Inter", "400", "Inter-400"], ["Inter", "600", "Inter-600"], ["Inter", "800", "Inter-800"],
  ["Playfair Display", "400", "PlayfairDisplay-400"], ["Playfair Display", "800", "PlayfairDisplay-800"],
  ["Permanent Marker", "400", "PermanentMarker-400"],
  ["Roboto Mono", "400", "RobotoMono-400"], ["Roboto Mono", "600", "RobotoMono-600"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("Cargando fuentes");
  Promise.all(
    FILES.map(([family, weight, file]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format("woff2")`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  ).finally(() => continueRender(handle));
}

export const FONTS = {
  display: "'Bebas Neue', 'Arial Narrow', sans-serif",
  sans: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
  body: "Inter, 'Helvetica Neue', Arial, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  marker: "'Permanent Marker', 'Comic Sans MS', cursive",
  mono: "'Roboto Mono', ui-monospace, monospace",
};
