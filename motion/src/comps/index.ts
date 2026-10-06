import type React from "react";
import { ZasIntro } from "./ZasIntro";

export type CompDef = {
  id: string;
  component: React.FC<any>;
  durationInFrames: number;
  fps?: number;
  width?: number;
  height?: number;
  defaultProps?: Record<string, unknown>;
};

// Registro de motion graphics. Cada petición del editor añade aquí su composición.
export const COMPS: CompDef[] = [
  { id: "ZasIntro", component: ZasIntro, durationInFrames: 120, defaultProps: { title: "ZAS STUDIO", subtitle: "Motion con Claude", accent: "#7c5cff" } },
];
