import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { proposeEdits, claudeError, MODELS as CLAUDE_MODELS } from "./claude-video.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const API = "https://generativelanguage.googleapis.com/v1beta";

// Carga .env sin dependencias
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const PORT = process.env.PORT || 3000;
const MIME = { ".json": "application/json", ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 30e6) { reject(new Error("Petición demasiado grande")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });

// La clave viene del navegador (cabecera) o de la variable de entorno del servidor
const getKey = (req) => req.headers["x-api-key"] || process.env.GEMINI_API_KEY || "";
const getAnthropicKey = (req) => req.headers["x-anthropic-key"] || process.env.ANTHROPIC_API_KEY || "";

async function google(pathname, key, body) {
  const r = await fetch(`${API}/${pathname}`, {
    method: body ? "POST" : "GET",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Error ${r.status} de la API de Google`);
    err.status = r.status;
    throw err;
  }
  return data;
}

async function generate({ prompt, model, aspectRatio, count = 1, references = [] }, key) {
  if (!prompt?.trim()) throw Object.assign(new Error("Escribe un prompt."), { status: 400 });
  count = Math.min(Math.max(parseInt(count) || 1, 1), 4);

  // Imagen (modelos "imagen-*"): endpoint :predict
  if (model.startsWith("imagen")) {
    const data = await google(`models/${model}:predict`, key, {
      instances: [{ prompt }],
      parameters: { sampleCount: count, ...(aspectRatio && aspectRatio !== "auto" ? { aspectRatio } : {}) },
    });
    const images = (data.predictions || [])
      .filter((p) => p.bytesBase64Encoded)
      .map((p) => ({ mime: p.mimeType || "image/png", data: p.bytesBase64Encoded }));
    if (!images.length) throw Object.assign(new Error("Google no devolvió imágenes (posible bloqueo por seguridad)."), { status: 422 });
    return { images, text: "" };
  }

  // Gemini (Nano Banana, etc.): :generateContent, una llamada por imagen
  const parts = [{ text: prompt }];
  for (const ref of references) parts.push({ inline_data: { mime_type: ref.mime, data: ref.data } });
  const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };
  if (aspectRatio && aspectRatio !== "auto") generationConfig.imageConfig = { aspectRatio };

  const results = await Promise.allSettled(
    Array.from({ length: count }, () =>
      google(`models/${model}:generateContent`, key, { contents: [{ parts }], generationConfig })
    )
  );
  const images = [];
  let text = "";
  let firstError;
  for (const r of results) {
    if (r.status === "rejected") { firstError ??= r.reason; continue; }
    for (const p of r.value.candidates?.[0]?.content?.parts || []) {
      const inl = p.inlineData || p.inline_data;
      if (inl?.data) images.push({ mime: inl.mimeType || inl.mime_type || "image/png", data: inl.data });
      else if (p.text) text += p.text;
    }
  }
  if (!images.length) {
    throw firstError || Object.assign(new Error(text || "Google no devolvió imágenes (posible bloqueo por seguridad)."), { status: 422 });
  }
  return { images, text };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && url.pathname === "/api/config") {
      return json(res, 200, { serverKey: !!process.env.GEMINI_API_KEY, serverAnthropicKey: !!process.env.ANTHROPIC_API_KEY, claudeModels: CLAUDE_MODELS });
    }

    if (req.method === "GET" && url.pathname === "/api/models") {
      const key = getKey(req);
      if (!key) return json(res, 401, { error: "Falta la API key." });
      const data = await google("models?pageSize=200", key);
      const models = (data.models || [])
        .filter((m) => /image|imagen/i.test(m.name) && /generateContent|predict/.test((m.supportedGenerationMethods || []).join()))
        .map((m) => ({ id: m.name.replace("models/", ""), name: m.displayName }));
      return json(res, 200, { models });
    }

    if (req.method === "POST" && url.pathname === "/api/generate") {
      const key = getKey(req);
      if (!key) return json(res, 401, { error: "Falta la API key. Pégala en Ajustes." });
      const result = await generate(JSON.parse(await readBody(req)), key);
      return json(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/video/edit") {
      const key = getAnthropicKey(req);
      if (!key) return json(res, 401, { error: "Falta la API key de Anthropic. Pégala en Ajustes." });
      return json(res, 200, await proposeEdits(JSON.parse(await readBody(req)), key));
    }

    // Archivos estáticos
    if (req.method === "GET") {
      const file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
      if (file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        return fs.createReadStream(file).pipe(res);
      }
    }
    json(res, 404, { error: "No encontrado" });
  } catch (e) {
    const ce = claudeError(e);
    if (ce) return json(res, ce.status, { error: ce.error });
    json(res, e.status || 500, { error: e.message });
  }
});

server.listen(PORT, () => console.log(`IA Studio en http://localhost:${PORT}`));
