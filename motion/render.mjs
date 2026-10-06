// Uso: node render.mjs <Composición> <salida.webm|mp4> [--width 1920 --height 1080 --fps 30 --seconds 4 --props '{"title":"Hola"}'] [--opaque]
// Por defecto genera WebM VP9 con transparencia (para superponer sobre el video).
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [id, outArg, ...rest] = process.argv.slice(2);
if (!id || !outArg) { console.error("Uso: node render.mjs <Composición> <salida> [opciones]"); process.exit(1); }
const opt = {};
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--opaque") opt.opaque = true;
  else if (rest[i].startsWith("--")) opt[rest[i].slice(2)] = rest[++i];
}
const out = path.resolve(outArg);
const browserExecutable = ["/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", process.env.REMOTION_BROWSER].find((p) => p && fs.existsSync(p));
const inputProps = opt.props ? JSON.parse(opt.props) : {};

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id, inputProps, browserExecutable });
const fps = +opt.fps || comp.fps;
const composition = {
  ...comp,
  width: +opt.width || comp.width,
  height: +opt.height || comp.height,
  fps,
  durationInFrames: opt.seconds ? Math.round(+opt.seconds * fps) : comp.durationInFrames,
};
const transparent = !opt.opaque;
await renderMedia({
  serveUrl, composition, inputProps, browserExecutable, outputLocation: out,
  codec: transparent ? "vp9" : "h264",
  imageFormat: transparent ? "png" : "jpeg",
  pixelFormat: transparent ? "yuva420p" : "yuv420p",
  onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%`),
});
console.log(`\n${out}`);
