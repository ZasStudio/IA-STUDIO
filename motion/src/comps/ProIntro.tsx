import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeInOut, enter, unit } from "../lib/motion";
import { FONTS } from "../lib/fonts";

export type ProIntroProps = { title: string; subtitle: string; accent: string; eyebrow: string };

// Intro de título "premium" para superponer (fondo transparente).
// Coreografía: una línea de luz se abre desde el centro → el título aparece letra a letra a través de
// una máscara mientras el tracking se cierra → un brillo recorre el título → el subtítulo entra →
// respiración lenta durante la pausa → salida simétrica (la máscara se cierra hacia arriba y la línea se recoge).
export const ProIntro: React.FC<ProIntroProps> = ({ title, subtitle, accent, eyebrow }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = unit(width, height);
  const outStart = durationInFrames - 24;

  // Entradas
  const line = enter(frame, 0, 22);                                   // la línea se dibuja
  const tracking = interpolate(enter(frame, 6, 46), [0, 1], [0.42, 0.06]); // el tracking se cierra
  const shine = interpolate(frame, [40, 74], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const sub = enter(frame, 34, 20);
  const eyebrowIn = enter(frame, 18, 18);
  // Vida durante la pausa: acercamiento lineal y muy leve
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.035]);
  // Salida
  const out = interpolate(frame, [outStart, durationInFrames - 2], [0, 1], { easing: easeInOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const letters = [...title];
  const titleSize = 168 * u;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          transform: `scale(${drift})`,
          filter: `drop-shadow(0 ${8 * u}px ${28 * u}px rgba(0,0,0,.45))`,
        }}
      >
        {/* Antetítulo */}
        <div
          style={{
            fontFamily: FONTS.body, fontWeight: 600, fontSize: 30 * u, letterSpacing: `${0.5 - 0.1 * eyebrowIn}em`,
            textTransform: "uppercase", color: accent, marginBottom: 26 * u,
            opacity: eyebrowIn * (1 - out), transform: `translateY(${(1 - eyebrowIn) * 14 * u}px)`,
          }}
        >
          {eyebrow}
        </div>

        {/* Título revelado por máscara, letra a letra */}
        <div style={{ position: "relative", clipPath: `inset(${out * 100}% -10% -10% -10%)` }}>
          <div style={{ display: "flex", letterSpacing: `${tracking}em`, paddingLeft: `${tracking}em` }}>
            {letters.map((ch, i) => {
              const p = enter(frame, 8 + i * 2, 24);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block", whiteSpace: "pre",
                    fontFamily: FONTS.display, fontSize: titleSize, lineHeight: 0.95,
                    // Brillo: un degradado que recorre el texto (background-clip)
                    backgroundImage: `linear-gradient(100deg, #fff 0%, #fff ${shine - 12}%, ${accent} ${shine}%, #fff ${shine + 12}%, #fff 100%)`,
                    backgroundSize: `${letters.length * 100}% 100%`,
                    backgroundPosition: `${(i / Math.max(1, letters.length - 1)) * 100}% 0`,
                    WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 70}%)`,
                    filter: `blur(${(1 - p) * 10 * u}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>

        {/* Línea de luz que se abre desde el centro y se recoge al salir */}
        <div
          style={{
            width: 760 * u, height: 3 * u, marginTop: 22 * u, borderRadius: 3 * u,
            background: `linear-gradient(90deg, transparent, ${accent} 20%, #fff 50%, ${accent} 80%, transparent)`,
            boxShadow: `0 0 ${18 * u}px ${accent}`,
            transform: `scaleX(${line * (1 - out)})`,
          }}
        />

        {/* Subtítulo */}
        <div
          style={{
            fontFamily: FONTS.sans, fontWeight: 400, fontSize: 38 * u, letterSpacing: "0.32em", textTransform: "uppercase",
            color: "rgba(255,255,255,.92)", marginTop: 26 * u, paddingLeft: "0.32em",
            opacity: sub * (1 - out),
            transform: `translateY(${((1 - sub) * 20 + out * -12) * u}px)`,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

