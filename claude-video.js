// Editor de video con Claude: recibe la línea de tiempo actual + fotogramas de muestra
// y devuelve una lista de cambios propuestos que el usuario revisa antes de aplicarlos.
import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-opus-5-5";
export const MODELS = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5 (recomendado)" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5 (más rápido)" },
  { id: "claude-fable-5-1", name: "Claude Fable 5.1 (máxima capacidad)" },
];

const ANIMS = ["none", "fade", "slide-up", "slide-down", "slide-left", "slide-right", "pop", "zoom", "bounce", "blur", "typewriter"];
const FONTS = ["Inter", "Montserrat", "Bebas Neue", "Playfair Display", "Permanent Marker", "Roboto Mono"];
const EFFECTS = ["zoom-in", "zoom-out", "shake", "flash", "vignette", "bw", "sepia", "warm", "cool", "vivid", "blur", "letterbox"];

const str = { type: "string" };
const num = { type: "number" };
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

const TEXT = obj({
  id: { ...str, description: "Identificador único, p.ej. t_titulo. Para update_text, el id del texto existente." },
  content: { ...str, description: "Texto visible. Usa \\n para saltos de línea." },
  start: { ...num, description: "Segundo de la línea de tiempo en que aparece." },
  end: { ...num, description: "Segundo en que desaparece (> start)." },
  x: { ...num, description: "Centro horizontal, 0 = izquierda, 1 = derecha." },
  y: { ...num, description: "Centro vertical, 0 = arriba, 1 = abajo." },
  size: { ...num, description: "Tamaño de fuente en px para un lienzo cuyo lado corto mide 1080 px (subtítulos ~48, títulos 90-140)." },
  color: { ...str, description: "Color CSS hex, p.ej. #ffffff." },
  font: { type: "string", enum: FONTS },
  weight: { type: "integer", enum: [400, 600, 800] },
  background: { anyOf: [str, { type: "null" }], description: "Color de caja detrás del texto (hex con alfa, p.ej. #000000aa) o null." },
  stroke: { anyOf: [str, { type: "null" }], description: "Color del contorno del texto o null." },
  animIn: { type: "string", enum: ANIMS },
  animOut: { type: "string", enum: ANIMS },
  animDuration: { ...num, description: "Duración de la animación de entrada/salida en segundos (0.2-1.2)." },
});

const CLIP = obj({
  id: str,
  asset: { ...str, description: "Id del archivo de video de origen (assets)." },
  in: { ...num, description: "Segundo de inicio dentro del archivo de origen." },
  out: { ...num, description: "Segundo final dentro del archivo de origen (> in)." },
  speed: { ...num, description: "Velocidad de reproducción, 0.25-4. 1 = normal." },
  volume: { ...num, description: "Volumen 0-1." },
  fadeIn: { ...num, description: "Fundido desde negro al inicio, en segundos (0 = sin fundido)." },
  fadeOut: { ...num, description: "Fundido a negro al final, en segundos." },
});

const EFFECT = obj({
  id: str,
  type: { type: "string", enum: EFFECTS },
  start: num,
  end: num,
  intensity: { ...num, description: "0-1." },
});

const reason = { ...str, description: "Explicación breve (en español) de por qué haces este cambio." };
const CHANGE = {
  anyOf: [
    obj({ action: { const: "add_text" }, reason, text: { $ref: "#/$defs/text" } }),
    obj({ action: { const: "update_text" }, reason, text: { $ref: "#/$defs/text" } }),
    obj({ action: { const: "add_effect" }, reason, effect: { $ref: "#/$defs/effect" } }),
    obj({ action: { const: "update_effect" }, reason, effect: { $ref: "#/$defs/effect" } }),
    obj({ action: { const: "update_clip" }, reason, clip: { $ref: "#/$defs/clip" } }),
    obj({ action: { const: "split_clip" }, reason, id: str, at: { ...num, description: "Segundo de la línea de tiempo donde cortar." }, newId: str }),
    obj({ action: { const: "reorder_clips" }, reason, order: { type: "array", items: str } }),
    obj({ action: { const: "remove" }, reason, kind: { type: "string", enum: ["clip", "text", "effect"] }, id: str }),
  ],
};

const OUTPUT_SCHEMA = {
  ...obj({
    message: { ...str, description: "Respuesta corta al usuario en español resumiendo lo que propones." },
    changes: { type: "array", items: CHANGE },
  }),
  $defs: { text: TEXT, clip: CLIP, effect: EFFECT },
};

const SYSTEM = `Eres el editor de video de "IA Studio". El usuario te pide cambios sobre un proyecto y tú respondes SOLO con cambios estructurados que él revisará en un panel (puede aceptar o rechazar cada uno), así que cada cambio debe ser independiente y tener un "reason" claro.

Modelo del proyecto:
- clips: segmentos de video que se reproducen uno tras otro en el orden del array (sin huecos). La duración de un clip en la línea de tiempo es (out - in) / speed. Su posición se calcula sumando los clips anteriores.
- texts: textos superpuestos con posición normalizada (x, y entre 0 y 1), estilo y animación de entrada/salida.
- effects: efectos visuales aplicados a un rango de tiempo de la línea de tiempo global.
- Los tiempos de texts y effects son segundos de la línea de tiempo final (no del archivo de origen).

Reglas:
- Usa solo ids existentes para update_*, split_clip, reorder_clips y remove. Para elementos nuevos crea ids únicos y descriptivos.
- update_text, update_effect y update_clip reemplazan el objeto completo: copia los campos que no cambias.
- Mantén in/out dentro de la duración del asset. Mantén los textos dentro de la duración total.
- Recibes fotogramas de muestra etiquetados con su segundo en la línea de tiempo: úsalos para entender el contenido, colocar textos donde no tapen lo importante y elegir colores legibles.
- No puedes oír el audio. Si te piden subtítulos y no hay transcripción en las notas, propón textos de ejemplo y dilo en el mensaje.
- Si la petición no requiere cambios (una pregunta), devuelve changes vacío y responde en message.
- Diseño: tipografía legible, márgenes seguros (x entre 0.08 y 0.92, y entre 0.08 y 0.92), animaciones con intención y sin exceso.`;

let client;
const getClient = (key) => (key ? new Anthropic({ apiKey: key }) : (client ??= new Anthropic()));

export async function proposeEdits(body, key) {
  const { instruction, project, assets = [], frames = [], history = [], notes = "", model } = body;
  if (!instruction?.trim()) throw Object.assign(new Error("Escribe qué quieres editar."), { status: 400 });
  if (!project) throw Object.assign(new Error("Falta el proyecto."), { status: 400 });

  // Historial solo en texto (los fotogramas se envían únicamente en el último turno)
  const messages = [];
  for (const h of history.slice(-12)) {
    if (h.role === "user" || h.role === "assistant") messages.push({ role: h.role, content: String(h.content) });
  }
  while (messages[0]?.role === "assistant") messages.shift(); // el primer mensaje debe ser del usuario

  const content = [];
  for (const f of frames.slice(0, 16)) {
    content.push({ type: "text", text: `Fotograma en t=${Number(f.t).toFixed(2)}s de la línea de tiempo:` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.data } });
  }
  content.push({
    type: "text",
    text:
      `Archivos de video (assets):\n${JSON.stringify(assets, null, 1)}\n\n` +
      `Proyecto actual:\n${JSON.stringify(project, null, 1)}\n\n` +
      (notes.trim() ? `Notas / transcripción del usuario:\n${notes}\n\n` : "") +
      `Petición: ${instruction}`,
  });
  messages.push({ role: "user", content });

  const response = await getClient(key).beta.messages.create({
    model: MODELS.some((m) => m.id === model) ? model : DEFAULT_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages,
  });

  if (response.stop_reason === "refusal") {
    throw Object.assign(new Error("Claude rechazó la petición" + (response.stop_details?.explanation ? `: ${response.stop_details.explanation}` : ".")), { status: 422 });
  }
  if (response.stop_reason === "max_tokens") {
    throw Object.assign(new Error("La respuesta fue demasiado larga. Pide menos cambios a la vez."), { status: 422 });
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let out;
  try { out = JSON.parse(text); } catch { throw Object.assign(new Error("Claude devolvió una respuesta no válida."), { status: 502 }); }
  return { message: out.message || "", changes: Array.isArray(out.changes) ? out.changes : [], model: response.model };
}

export function claudeError(e) {
  if (e instanceof Anthropic.AuthenticationError) return { status: 401, error: "API key de Anthropic no válida." };
  if (e instanceof Anthropic.RateLimitError) return { status: 429, error: "Límite de uso de Claude alcanzado. Reintenta en unos segundos." };
  if (e instanceof Anthropic.APIError) return { status: e.status || 502, error: e.message };
  return null;
}
