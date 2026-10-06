import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { enter, exit, pop, unit } from "../lib/motion";
import { FONTS } from "../lib/fonts";

export type ZasIntroProps = { title: string; subtitle: string; accent: string };

// Título cinético para superponer: letras que suben con escalonado de 3 fotogramas,
// línea de acento que se dibuja, subtítulo que entra después y salida simétrica.
export const ZasIntro: React.FC<ZasIntroProps> = ({ title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = unit(width, height);
  const out = exit(frame, durationInFrames - 14, 14);
  const letters = [...title];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 * u, transform: `translateY(${(1 - out) * -30 * u}px)` }}>
        <div style={{ display: "flex", overflow: "hidden", padding: `0 ${10 * u}px` }}>
          {letters.map((ch, i) => {
            const p = enter(frame, 4 + i * 2, 16);
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 190 * u,
                  lineHeight: 1,
                  letterSpacing: 6 * u,
                  color: "#fff",
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 110}%)`,
                  textShadow: `0 ${6 * u}px ${30 * u}px rgba(0,0,0,.45)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ height: 8 * u, width: 520 * u, background: accent, borderRadius: 4 * u, transform: `scaleX(${enter(frame, 14, 22)})`, transformOrigin: "left center" }} />
        <div
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 600,
            fontSize: 44 * u,
            letterSpacing: 10 * u,
            textTransform: "uppercase",
            color: "#fff",
            opacity: enter(frame, 24, 16),
            transform: `translateY(${(1 - pop(frame, fps, 24)) * 24 * u}px) scale(${0.96 + 0.04 * pop(frame, fps, 24)})`,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
