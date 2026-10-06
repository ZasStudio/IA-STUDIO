import type React from "react";
import { ZasIntro } from "./ZasIntro";
import { ProIntro } from "./ProIntro";

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
  // Petición mmuwuhr6e: intro / título con animación profesional (5 s, transparente)
  { id: "ProIntro", component: ProIntro, durationInFrames: 150, defaultProps: { title: "ZAS STUDIO", subtitle: "Estudio creativo", eyebrow: "Presenta", accent: "#7c5cff" } },
];
