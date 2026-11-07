import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setConcurrency(null);
// Los desenfoques grandes y backdrop-filter funcionan mejor con el renderizador ANGLE.
Config.setChromiumOpenGlRenderer('angle');

// Permite usar un Chromium ya instalado: REMOTION_BROWSER=/ruta/al/headless_shell
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
