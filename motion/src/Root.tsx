import { Composition } from "remotion";
import { COMPS } from "./comps";

// Cada motion graphic es una composición. El render puede sobrescribir
// ancho, alto, fps y duración para que encaje con el proyecto del editor.
export const Root: React.FC = () => (
  <>
    {COMPS.map((c) => (
      <Composition
        key={c.id}
        id={c.id}
        component={c.component}
        durationInFrames={c.durationInFrames}
        fps={c.fps ?? 30}
        width={c.width ?? 1920}
        height={c.height ?? 1080}
        defaultProps={c.defaultProps ?? {}}
      />
    ))}
  </>
);
