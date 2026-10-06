import { Easing, interpolate, spring } from "remotion";

// Curvas compartidas (filosofía de Emil Kowalski): nunca ease-in en entradas.
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
export const easeInOut = Easing.bezier(0.77, 0, 0.175, 1);

/** 0→1 entre los fotogramas `from` y `from + dur`, con ease-out fuerte. */
export const enter = (frame: number, from: number, dur: number, easing = easeOut) =>
  interpolate(frame, [from, from + dur], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 1→0 al salir, simétrico a la entrada. */
export const exit = (frame: number, from: number, dur: number) =>
  1 - interpolate(frame, [from, from + dur], [0, 1], { easing: easeInOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Muelle tipo Apple: poco rebote (0.1–0.3). */
export const pop = (frame: number, fps: number, delay = 0, bounce = 0.2, durationInFrames = 18) =>
  spring({ frame: frame - delay, fps, durationInFrames, config: { damping: 200 * (1 - bounce) + 10, stiffness: 180, mass: 1 } });

/** Escala de los px de diseño (pensados para lado corto = 1080) al lienzo real. */
export const unit = (width: number, height: number) => Math.min(width, height) / 1080;
