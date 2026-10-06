"use strict";
// IA Studio · Editor de video con Claude
// El proyecto es JSON (clips + textos + efectos). Claude propone cambios, el usuario los revisa
// en el panel (con vista previa en vivo) y aplica solo los que quiera.

const $ = (id) => document.getElementById(id);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 7)}`;
const clone = (o) => JSON.parse(JSON.stringify(o));
const fmt = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`; };
const ls = {
  get: (k, d = "") => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// ---------- catálogo ----------
const ANIMS = { none: "Ninguna", fade: "Fundido", "slide-up": "Subir", "slide-down": "Bajar", "slide-left": "Desde la derecha", "slide-right": "Desde la izquierda", pop: "Pop", zoom: "Zoom", bounce: "Rebote", blur: "Desenfoque", typewriter: "Máquina de escribir" };
const FONTS = ["Inter", "Montserrat", "Bebas Neue", "Playfair Display", "Permanent Marker", "Roboto Mono"];
const EFFECTS = { "zoom-in": "Zoom in", "zoom-out": "Zoom out", shake: "Temblor", flash: "Flash", vignette: "Viñeta", bw: "Blanco y negro", sepia: "Sepia", warm: "Cálido", cool: "Frío", vivid: "Vívido", blur: "Desenfoque", letterbox: "Cine (bandas)" };
const ASPECTS = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350] };
const KIND = { text: "texts", clip: "clips", effect: "effects" };
const SUGGESTIONS = [
  "Añade un título animado al inicio",
  "Subtítulos estilo TikTok con la transcripción",
  "Dale un look cinematográfico",
  "Haz el ritmo más dinámico con zooms",
  "Añade un llamado a la acción al final",
  "Revisa los textos y mejora su legibilidad",
];

// ---------- estado ----------
const newProject = () => ({ aspect: "16:9", width: 1920, height: 1080, clips: [], texts: [], effects: [] });
let project = (() => { try { return JSON.parse(ls.get("vid.project")) || newProject(); } catch { return newProject(); } })();
const assets = new Map(); // id -> { id, name, duration, width, height, url, el, thumb, gain }
let pending = null; // { message, changes: [{ ...cambio, _id, accepted }] }
let view = project; // proyecto mostrado (con propuestas aceptadas si el toggle está activo)
let viewErrors = new Map();
let L = []; // layout de clips del proyecto mostrado
let dur = 0;
let selected = null; // { kind, id }
let t = 0, playing = false, playUntil = null, dirty = true, lastTs = 0;
let exporting = null;
let textBoxes = []; // cajas dibujadas (para seleccionar/arrastrar en el lienzo)
const undoStack = [], redoStack = [];
let chat = (() => { try { return JSON.parse(ls.get("vid.chat")) || []; } catch { return []; } })();
let history = (() => { try { return JSON.parse(ls.get("vid.history")) || []; } catch { return []; } })();
let tab = "review";

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

// ---------- utilidades de proyecto ----------
function layout(p) {
  let acc = 0;
  return p.clips.map((c) => {
    const d = Math.max(0, (c.out - c.in) / (c.speed || 1));
    const r = { ...c, t0: acc, t1: acc + d };
    acc += d;
    return r;
  });
}
function projectDuration(p, lay = layout(p)) {
  const end = lay.length ? lay[lay.length - 1].t1 : 0;
  return Math.max(end, ...p.texts.map((x) => x.end), ...p.effects.map((x) => x.end), 0);
}
const clipAt = (lay, time) => lay.find((c) => time >= c.t0 && time < c.t1) || (lay.length && time >= lay[lay.length - 1].t1 - 1e-3 && time <= lay[lay.length - 1].t1 ? lay[lay.length - 1] : null);
const findItem = (p, kind, id) => p[KIND[kind]]?.find((x) => x.id === id);

function save() {
  ls.set("vid.project", JSON.stringify(project));
  ls.set("vid.chat", JSON.stringify(chat.slice(-60)));
  ls.set("vid.history", JSON.stringify(history.slice(-40)));
}
let lastUndoPush = 0;
function pushUndo(force = true) {
  const now = Date.now();
  if (!force && now - lastUndoPush < 800) return; // agrupa ediciones seguidas en un solo paso
  lastUndoPush = now;
  undoStack.push(JSON.stringify(project));
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}
function undo() { if (!undoStack.length) return; redoStack.push(JSON.stringify(project)); project = JSON.parse(undoStack.pop()); commit(); }
function redo() { if (!redoStack.length) return; undoStack.push(JSON.stringify(project)); project = JSON.parse(redoStack.pop()); commit(); }
function commit() { save(); refresh(); }

// ---------- saneado y aplicación de cambios ----------
function sanitizeText(x) {
  return {
    id: String(x.id || uid("t")), content: String(x.content ?? "Texto"),
    start: Math.max(0, +x.start || 0), end: Math.max((+x.start || 0) + 0.1, +x.end || 3),
    x: clamp(+x.x || 0.5), y: clamp(x.y == null ? 0.5 : +x.y), size: clamp(+x.size || 72, 8, 400),
    color: x.color || "#ffffff", font: FONTS.includes(x.font) ? x.font : "Inter", weight: [400, 600, 800].includes(+x.weight) ? +x.weight : 800,
    background: x.background || null, stroke: x.stroke || null,
    animIn: ANIMS[x.animIn] ? x.animIn : "fade", animOut: ANIMS[x.animOut] ? x.animOut : "fade",
    animDuration: clamp(+x.animDuration || 0.5, 0.05, 3),
  };
}
function sanitizeEffect(x) {
  return { id: String(x.id || uid("fx")), type: EFFECTS[x.type] ? x.type : "zoom-in", start: Math.max(0, +x.start || 0), end: Math.max((+x.start || 0) + 0.1, +x.end || 1), intensity: clamp(x.intensity == null ? 0.6 : +x.intensity) };
}
function sanitizeClip(x) {
  const a = assets.get(x.asset);
  const max = a?.duration || Infinity;
  const inn = clamp(+x.in || 0, 0, max);
  return {
    id: String(x.id || uid("c")), asset: x.asset, in: inn, out: clamp(+x.out || max, inn + 0.05, max),
    speed: clamp(+x.speed || 1, 0.25, 4), volume: clamp(x.volume == null ? 1 : +x.volume), fadeIn: Math.max(0, +x.fadeIn || 0), fadeOut: Math.max(0, +x.fadeOut || 0),
  };
}

function applyChange(p, ch) {
  const idx = (arr, id) => arr.findIndex((x) => x.id === id);
  const upsert = (arr, item) => { const i = idx(arr, item.id); i >= 0 ? (arr[i] = item) : arr.push(item); };
  switch (ch.action) {
    case "add_text": return upsert(p.texts, sanitizeText(ch.text));
    case "update_text": if (idx(p.texts, ch.text.id) < 0) throw new Error(`No existe el texto "${ch.text.id}"`); return upsert(p.texts, sanitizeText(ch.text));
    case "add_effect": return upsert(p.effects, sanitizeEffect(ch.effect));
    case "update_effect": if (idx(p.effects, ch.effect.id) < 0) throw new Error(`No existe el efecto "${ch.effect.id}"`); return upsert(p.effects, sanitizeEffect(ch.effect));
    case "update_clip": {
      if (idx(p.clips, ch.clip.id) < 0) throw new Error(`No existe el clip "${ch.clip.id}"`);
      if (!assets.has(ch.clip.asset)) throw new Error(`No existe el archivo "${ch.clip.asset}"`);
      return upsert(p.clips, sanitizeClip(ch.clip));
    }
    case "split_clip": {
      const lay = layout(p);
      const i = idx(p.clips, ch.id);
      if (i < 0) throw new Error(`No existe el clip "${ch.id}"`);
      const c = lay[i];
      if (ch.at <= c.t0 + 0.05 || ch.at >= c.t1 - 0.05) throw new Error("El punto de corte está fuera del clip");
      const src = c.in + (ch.at - c.t0) * c.speed;
      const newId = ch.newId && idx(p.clips, ch.newId) < 0 ? ch.newId : uid("c");
      p.clips.splice(i, 1, { ...p.clips[i], out: src, fadeOut: 0 }, { ...p.clips[i], id: newId, in: src, fadeIn: 0 });
      return;
    }
    case "reorder_clips": {
      const byId = new Map(p.clips.map((c) => [c.id, c]));
      const ordered = ch.order.map((id) => byId.get(id)).filter(Boolean);
      if (!ordered.length) throw new Error("El nuevo orden no contiene clips válidos");
      p.clips = [...new Set([...ordered, ...p.clips])];
      return;
    }
    case "remove": {
      const arr = p[KIND[ch.kind]];
      if (!arr || idx(arr, ch.id) < 0) throw new Error(`No existe "${ch.id}"`);
      p[KIND[ch.kind]] = arr.filter((x) => x.id !== ch.id);
      return;
    }
    default: throw new Error(`Acción desconocida: ${ch.action}`);
  }
}
function applyChanges(base, changes) {
  const p = clone(base);
  const errors = new Map();
  for (const ch of changes) {
    try { applyChange(p, ch); } catch (e) { errors.set(ch._id, e.message); }
  }
  return { project: p, errors };
}

// Qué elemento toca un cambio (para resaltarlo y previsualizarlo)
function changeTarget(ch) {
  switch (ch.action) {
    case "add_text": case "update_text": return { kind: "text", id: ch.text.id };
    case "add_effect": case "update_effect": return { kind: "effect", id: ch.effect.id };
    case "update_clip": return { kind: "clip", id: ch.clip.id };
    case "split_clip": return { kind: "clip", id: ch.id };
    case "remove": return { kind: ch.kind, id: ch.id };
    default: return { kind: "clip", id: null };
  }
}

// ---------- refresco ----------
function refresh(panels = true) {
  const accepted = pending ? pending.changes.filter((c) => c.accepted) : [];
  if (pending && $("showProposals").checked && !exporting) {
    const r = applyChanges(project, accepted);
    view = r.project;
    viewErrors = r.errors;
  } else {
    view = project;
    viewErrors = pending ? applyChanges(project, accepted).errors : new Map();
  }
  L = layout(view);
  dur = projectDuration(view, L);
  if (t > dur) t = dur;
  $("previewBadge").classList.toggle("on", !!pending && $("showProposals").checked && accepted.length > 0);
  $("stageEmpty").style.display = project.clips.length || project.texts.length ? "none" : "";
  $("aspect").value = project.aspect;
  $("pendingCount").textContent = pending ? pending.changes.length : "";
  $("btnUndo").disabled = !undoStack.length;
  $("btnRedo").disabled = !redoStack.length;
  renderTimeline();
  if (panels) renderPanels();
  dirty = true;
}

// ---------- render del lienzo ----------
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const easeOutBounce = (x) => {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

function drawFrame(c, p, lay, time, opts = {}) {
  const W = c.canvas.width, H = c.canvas.height, S = Math.min(W, H) / 1080;
  c.save();
  c.fillStyle = "#000";
  c.fillRect(0, 0, W, H);

  const clip = clipAt(lay, time);
  const fx = p.effects.filter((e) => time >= e.start && time < e.end);
  let scale = 1, dx = 0, dy = 0;
  const filters = [];
  for (const e of fx) {
    const k = clamp((time - e.start) / Math.max(0.01, e.end - e.start)), i = e.intensity;
    switch (e.type) {
      case "zoom-in": scale *= 1 + 0.35 * i * easeOut(k); break;
      case "zoom-out": scale *= 1 + 0.35 * i * (1 - easeOut(k)); break;
      case "shake": dx += Math.sin(time * 53) * 16 * i * S; dy += Math.cos(time * 41) * 12 * i * S; scale *= 1 + 0.04 * i; break;
      case "bw": filters.push(`grayscale(${i})`); break;
      case "sepia": filters.push(`sepia(${i})`); break;
      case "warm": filters.push(`sepia(${0.35 * i}) saturate(${1 + 0.3 * i})`); break;
      case "cool": filters.push(`hue-rotate(${-18 * i}deg) saturate(${1 + 0.1 * i}) brightness(${1 + 0.04 * i})`); break;
      case "vivid": filters.push(`saturate(${1 + 0.8 * i}) contrast(${1 + 0.15 * i})`); break;
      case "blur": filters.push(`blur(${10 * i * S}px)`); break;
    }
  }

  if (clip) {
    const v = assets.get(clip.asset)?.el;
    if (v && v.readyState >= 2 && v.videoWidth) {
      c.save();
      c.translate(W / 2 + dx, H / 2 + dy);
      c.scale(scale, scale);
      c.filter = filters.join(" ") || "none";
      const r = Math.max(W / v.videoWidth, H / v.videoHeight); // relleno (cover)
      c.drawImage(v, (-v.videoWidth * r) / 2, (-v.videoHeight * r) / 2, v.videoWidth * r, v.videoHeight * r);
      c.restore();
    }
    let black = 0;
    if (clip.fadeIn > 0) black = Math.max(black, 1 - (time - clip.t0) / clip.fadeIn);
    if (clip.fadeOut > 0) black = Math.max(black, 1 - (clip.t1 - time) / clip.fadeOut);
    if (black > 0) { c.fillStyle = `rgba(0,0,0,${clamp(black)})`; c.fillRect(0, 0, W, H); }
  }

  for (const e of fx) {
    const k = clamp((time - e.start) / Math.max(0.01, e.end - e.start)), i = e.intensity;
    if (e.type === "vignette") {
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${0.85 * i})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    } else if (e.type === "flash") {
      c.fillStyle = `rgba(255,255,255,${i * Math.pow(1 - k, 2)})`; c.fillRect(0, 0, W, H);
    } else if (e.type === "letterbox") {
      const bar = H * 0.12 * i * easeOut(clamp(k * 4));
      c.fillStyle = "#000"; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    }
  }

  const boxes = [];
  for (const tx of p.texts) {
    if (time >= tx.start && time < tx.end) {
      const box = drawText(c, tx, time, W, H, S);
      if (box) boxes.push(box);
      if (opts.selectedId === tx.id && box) {
        c.save();
        c.setLineDash([10 * S, 8 * S]); c.lineWidth = 3 * S; c.strokeStyle = "#7c5cff";
        c.strokeRect(box.x - 6 * S, box.y - 6 * S, box.w + 12 * S, box.h + 12 * S);
        c.restore();
      }
    }
  }
  c.restore();
  return boxes;
}

function drawText(c, tx, time, W, H, S) {
  const d = Math.max(0.05, tx.animDuration || 0.5);
  const pin = clamp((time - tx.start) / d), pout = clamp((tx.end - time) / d);
  let alpha = 1, ox = 0, oy = 0, sc = 1, blur = 0, chars = Infinity;
  const total = tx.content.replace(/\n/g, "").length;
  const anim = (a, p) => {
    if (p >= 1 || a === "none") return;
    const e = easeOut(p);
    switch (a) {
      case "fade": alpha *= e; break;
      case "slide-up": oy += (1 - e) * 90 * S; alpha *= e; break;
      case "slide-down": oy -= (1 - e) * 90 * S; alpha *= e; break;
      case "slide-left": ox += (1 - e) * 200 * S; alpha *= e; break;
      case "slide-right": ox -= (1 - e) * 200 * S; alpha *= e; break;
      case "pop": sc *= Math.max(0, easeOutBack(p)); alpha *= Math.min(1, p * 3); break;
      case "zoom": sc *= 0.4 + 0.6 * e; alpha *= e; break;
      case "bounce": oy -= (1 - easeOutBounce(p)) * 160 * S; alpha *= Math.min(1, p * 4); break;
      case "blur": blur += (1 - e) * 18 * S; alpha *= e; break;
      case "typewriter": chars = Math.min(chars, Math.floor(total * p)); break;
    }
  };
  anim(tx.animIn, pin);
  anim(tx.animOut, pout);
  if (alpha <= 0.001 || sc <= 0.001) return null;

  const size = tx.size * S;
  c.save();
  c.font = `${tx.weight} ${size}px "${tx.font}"`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const lines = tx.content.split("\n");
  const lh = size * 1.18;
  const maxW = Math.max(...lines.map((l) => c.measureText(l).width));
  const pad = size * 0.32;
  const bw = maxW + pad * 2, bh = lines.length * lh + pad * 1.2;
  const cx = tx.x * W + ox, cy = tx.y * H + oy;
  c.translate(cx, cy);
  c.scale(sc, sc);
  c.globalAlpha = alpha;
  if (blur > 0.2) c.filter = `blur(${blur}px)`;
  if (tx.background) {
    c.fillStyle = tx.background;
    c.beginPath();
    c.roundRect ? c.roundRect(-bw / 2, -bh / 2, bw, bh, size * 0.22) : c.rect(-bw / 2, -bh / 2, bw, bh);
    c.fill();
  } else if (!tx.stroke) {
    c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = 14 * S; c.shadowOffsetY = 2 * S;
  }
  let left = chars;
  lines.forEach((line, i) => {
    const shown = left === Infinity ? line : line.slice(0, Math.max(0, left));
    if (left !== Infinity) left -= line.length;
    const y = (i - (lines.length - 1) / 2) * lh;
    if (tx.stroke) { c.lineJoin = "round"; c.lineWidth = Math.max(2, size * 0.1); c.strokeStyle = tx.stroke; c.strokeText(shown, 0, y); }
    c.fillStyle = tx.color;
    c.fillText(shown, 0, y);
  });
  c.restore();
  return { id: tx.id, x: cx - (bw / 2) * sc, y: cy - (bh / 2) * sc, w: bw * sc, h: bh * sc };
}

// ---------- reproducción ----------
function syncVideos(lay, time) {
  const clip = clipAt(lay, time);
  for (const a of assets.values()) {
    const v = a.el;
    if (!clip || a.id !== clip.asset) { if (!v.paused) v.pause(); continue; }
    const target = clip.in + (time - clip.t0) * clip.speed;
    v.playbackRate = clip.speed;
    if (a.gain) { v.volume = 1; a.gain.gain.value = clip.volume; } else v.volume = clamp(clip.volume);
    if (playing) {
      if (Math.abs(v.currentTime - target) > 0.3) v.currentTime = target;
      if (v.paused) v.play().catch(() => {});
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - target) > 0.04 && !v.seeking) v.currentTime = target;
    }
  }
}

function tick(ts) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;
  if (playing) {
    // Reloj maestro: el video activo si va bien sincronizado; si no, el reloj de pared
    const clip = clipAt(L, t);
    const v = clip && assets.get(clip.asset)?.el;
    let next = t + dt;
    if (v && !v.paused && !v.seeking && v.readyState >= 3) {
      const vt = clip.t0 + (v.currentTime - clip.in) / clip.speed;
      if (Math.abs(vt - next) < 0.25) next = vt;
    }
    t = next;
    if (playUntil != null && t >= playUntil) { t = playUntil; pause(); }
    else if (t >= dur) { t = dur; pause(); if (exporting) finishExport(); }
    dirty = true;
  }
  if (dirty) {
    syncVideos(L, t);
    textBoxes = drawFrame(ctx, view, L, t, { selectedId: exporting ? null : selected?.kind === "text" && selected.id });
    updateClock();
    dirty = false;
  }
  if (exporting) $("exportBar").style.width = `${(100 * t) / Math.max(dur, 0.01)}%`;
  requestAnimationFrame(tick);
}

function play(until = null) {
  if (!dur) return;
  ensureAudio();
  if (t >= dur - 0.02) t = 0;
  playUntil = until;
  playing = true;
  $("btnPlay").textContent = "⏸";
  dirty = true;
}
function pause() {
  playing = false;
  playUntil = null;
  $("btnPlay").textContent = "▶";
  for (const a of assets.values()) a.el.pause();
  dirty = true;
}
function seek(time) { t = clamp(time, 0, dur); dirty = true; }
function updateClock() {
  $("time").textContent = `${fmt(t)} / ${fmt(dur)}`;
  $("playhead").style.left = `${t * pps()}px`;
}

// Audio: WebAudio permite controlar el volumen y grabar el sonido al exportar
let audioCtx, audioDest;
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
      audioDest = audioCtx.createMediaStreamDestination();
    } catch { return; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  for (const a of assets.values()) {
    if (a.gain) continue;
    try {
      const src = audioCtx.createMediaElementSource(a.el);
      a.gain = audioCtx.createGain();
      src.connect(a.gain);
      a.gain.connect(audioCtx.destination);
      a.gain.connect(audioDest);
    } catch {}
  }
}

// ---------- medios (persistidos en IndexedDB) ----------
const db = new Promise((res, rej) => {
  const r = indexedDB.open("ia-studio-video", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("assets", { keyPath: "id" });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const idb = async (mode, fn) => {
  const s = (await db).transaction("assets", mode).objectStore("assets");
  return new Promise((res, rej) => { const r = fn(s); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
};

function once(el, ev, ms = 3000) {
  return new Promise((res) => {
    const done = () => { clearTimeout(to); el.removeEventListener(ev, done); res(); };
    const to = setTimeout(done, ms);
    el.addEventListener(ev, done);
  });
}

async function loadAsset(id, name, blob) {
  const url = URL.createObjectURL(blob);
  const el = document.createElement("video");
  el.preload = "auto";
  el.playsInline = true;
  el.src = url;
  el.addEventListener("seeked", () => (dirty = true));
  el.addEventListener("loadeddata", () => (dirty = true));
  await once(el, "loadedmetadata", 10000);
  if (!el.duration || !isFinite(el.duration)) throw new Error(`No se pudo leer "${name}"`);
  const a = { id, name, duration: el.duration, width: el.videoWidth, height: el.videoHeight, url, el, thumb: "" };
  // miniatura
  el.currentTime = Math.min(1, el.duration / 2);
  await once(el, "seeked");
  try {
    const tc = document.createElement("canvas");
    tc.width = 160; tc.height = 90;
    const r = Math.max(160 / el.videoWidth, 90 / el.videoHeight);
    tc.getContext("2d").drawImage(el, 80 - (el.videoWidth * r) / 2, 45 - (el.videoHeight * r) / 2, el.videoWidth * r, el.videoHeight * r);
    a.thumb = tc.toDataURL("image/jpeg", 0.7);
  } catch {}
  assets.set(id, a);
  if (audioCtx) ensureAudio();
  return a;
}

async function importFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith("video/")) continue;
    const id = uid("a");
    try {
      const a = await loadAsset(id, f.name, f);
      await idb("readwrite", (s) => s.put({ id, name: f.name, blob: f })).catch(() => toast("No se pudo guardar el video en el navegador (se perderá al recargar)."));
      pushUndo();
      if (!project.clips.length && a.width && a.height) setAspect(a.height > a.width ? "9:16" : a.width === a.height ? "1:1" : "16:9", false);
      project.clips.push(sanitizeClip({ id: uid("c"), asset: id, in: 0, out: a.duration }));
      commit();
    } catch (e) { toast(e.message); }
  }
  renderAssets();
}

async function restoreAssets() {
  let rows = [];
  try { rows = await idb("readonly", (s) => s.getAll()); } catch {}
  const used = new Set(project.clips.map((c) => c.asset));
  for (const r of rows) {
    if (!used.has(r.id)) { idb("readwrite", (s) => s.delete(r.id)).catch(() => {}); continue; }
    try { await loadAsset(r.id, r.name, r.blob); } catch {}
  }
  const missing = project.clips.filter((c) => !assets.has(c.asset));
  if (missing.length) {
    project.clips = project.clips.filter((c) => assets.has(c.asset));
    toast("Algunos videos ya no estaban guardados y se quitaron del proyecto.");
  }
  renderAssets();
  refresh();
}

function renderAssets() {
  const box = $("assets");
  box.replaceChildren(...[...assets.values()].map((a) =>
    h("div", { class: "asset" },
      h("img", { src: a.thumb || "", alt: "" }),
      h("div", {}, h("div", { class: "n", title: a.name }, a.name), h("div", { class: "hint" }, `${fmt(a.duration)} · ${a.width}×${a.height}`)),
      h("button", { class: "icon", title: "Añadir al final", onclick: () => { pushUndo(); project.clips.push(sanitizeClip({ id: uid("c"), asset: a.id, in: 0, out: a.duration })); commit(); } }, "＋"),
    )));
}

function setAspect(key, undoable = true) {
  if (!ASPECTS[key]) return;
  if (undoable) pushUndo();
  project.aspect = key;
  [project.width, project.height] = ASPECTS[key];
  canvas.width = project.width;
  canvas.height = project.height;
  if (undoable) commit();
}

// ---------- línea de tiempo ----------
const pps = () => +$("zoom").value; // píxeles por segundo
const proposedIds = () => new Set(pending ? pending.changes.filter((c) => c.accepted).map((c) => changeTarget(c).id) : []);

function renderTimeline() {
  const W = Math.max((dur + 5) * pps(), $("tlScroll").clientWidth);
  $("tlInner").style.width = `${W}px`;
  // regla
  const step = pps() >= 120 ? 0.5 : pps() >= 50 ? 1 : pps() >= 25 ? 2 : 5;
  const marks = [];
  for (let s = 0; s * pps() < W; s += step) marks.push(h("span", { style: `left:${s * pps()}px` }, fmt(s).replace(/\.0$/, "")));
  $("ruler").replaceChildren(...marks);

  const showP = !!pending && $("showProposals").checked;
  const prop = showP ? proposedIds() : new Set();
  const blk = (kind, item, t0, t1, label, lane = 0) => {
    const el = h("div", {
      class: `blk ${kind}${selected?.kind === kind && selected.id === item.id ? " sel" : ""}${prop.has(item.id) ? " proposed" : ""}`,
      style: `left:${t0 * pps()}px; width:${Math.max(6, (t1 - t0) * pps() - 2)}px; top:${5 + lane * LANE}px`,
      title: label,
    }, label);
    if (kind !== "clip") { el.append(h("div", { class: "h l" }), h("div", { class: "h r" })); }
    el.addEventListener("pointerdown", (e) => startDrag(e, kind, item.id));
    return el;
  };
  $("trk-clip").replaceChildren(...L.map((c) => blk("clip", c, c.t0, c.t1, `${assets.get(c.asset)?.name || c.asset}${c.speed !== 1 ? ` · ${c.speed}×` : ""}`)));
  const tl = lanes(view.texts), fl = lanes(view.effects);
  $("trk-text").replaceChildren(...view.texts.map((x) => blk("text", x, x.start, x.end, x.content.replace(/\n/g, " "), tl.lane.get(x.id))));
  $("trk-effect").replaceChildren(...view.effects.map((x) => blk("effect", x, x.start, x.end, EFFECTS[x.type], fl.lane.get(x.id))));
  for (const [id, n] of [["text", tl.count], ["effect", fl.count]]) {
    const hgt = `${10 + Math.max(1, n) * LANE}px`;
    $(`trk-${id}`).style.height = hgt;
    $(`lbl-${id}`).style.height = hgt;
  }
  updateClock();
}

// Reparte en carriles los elementos que se solapan en el tiempo
const LANE = 34;
function lanes(items) {
  const ends = [], lane = new Map();
  for (const x of [...items].sort((a, b) => a.start - b.start)) {
    let i = ends.findIndex((e) => e <= x.start + 1e-3);
    if (i < 0) { i = ends.length; ends.push(0); }
    ends[i] = x.end;
    lane.set(x.id, i);
  }
  return { lane, count: ends.length };
}

function startDrag(e, kind, id) {
  e.stopPropagation();
  select(kind, id);
  const item = findItem(project, kind, id);
  if (!item || kind === "clip") return; // los clips se editan en el panel; las propuestas no se arrastran
  const mode = e.target.classList.contains("l") ? "l" : e.target.classList.contains("r") ? "r" : "move";
  const x0 = e.clientX, s0 = item.start, e0 = item.end;
  let moved = false;
  const onMove = (ev) => {
    const d = (ev.clientX - x0) / pps();
    if (!moved && Math.abs(ev.clientX - x0) < 3) return;
    if (!moved) { pushUndo(); moved = true; }
    if (mode === "move") { item.start = round(Math.max(0, s0 + d)); item.end = round(item.start + (e0 - s0)); }
    else if (mode === "l") item.start = round(clamp(s0 + d, 0, item.end - 0.1));
    else item.end = round(Math.max(item.start + 0.1, e0 + d));
    refresh();
  };
  const onUp = () => { removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); if (moved) commit(); };
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);
}

function scrubFrom(e) {
  const r = $("tlInner").getBoundingClientRect();
  const go = (ev) => seek((ev.clientX - r.left) / pps());
  go(e);
  const up = () => { removeEventListener("pointermove", go); removeEventListener("pointerup", up); };
  addEventListener("pointermove", go);
  addEventListener("pointerup", up);
}

// ---------- selección e inspector ----------
function select(kind, id, switchTab = true) {
  selected = kind && id ? { kind, id } : null;
  if (selected && switchTab && tab !== "elements" && !(tab === "review" && pending)) setTab("elements");
  refresh();
}

function setTab(name) {
  tab = name;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("on", p.id === `pane-${name}`));
  renderPanels();
}

function renderPanels() {
  if (tab === "review") renderReview();
  else if (tab === "elements") renderElements();
  else renderHistory();
}

const summaryOf = (kind, x) =>
  kind === "text" ? `“${x.content.replace(/\n/g, " ").slice(0, 40)}”` : kind === "effect" ? EFFECTS[x.type] : assets.get(x.asset)?.name || x.id;

function changeInfo(ch) {
  const tg = changeTarget(ch);
  const old = tg.id ? findItem(project, tg.kind, tg.id) : null;
  switch (ch.action) {
    case "add_text": return { kind: "text", tag: "Nuevo texto", title: summaryOf("text", ch.text), item: ch.text, range: [ch.text.start, ch.text.end] };
    case "update_text": return { kind: "text", tag: "Editar texto", title: summaryOf("text", ch.text), item: ch.text, old, range: [ch.text.start, ch.text.end] };
    case "add_effect": return { kind: "effect", tag: "Nuevo efecto", title: EFFECTS[ch.effect.type] || ch.effect.type, item: ch.effect, range: [ch.effect.start, ch.effect.end] };
    case "update_effect": return { kind: "effect", tag: "Editar efecto", title: EFFECTS[ch.effect.type] || ch.effect.type, item: ch.effect, old, range: [ch.effect.start, ch.effect.end] };
    case "update_clip": { const c = layout(view).find((x) => x.id === ch.clip.id); return { kind: "clip", tag: "Ajustar clip", title: summaryOf("clip", ch.clip), item: ch.clip, old, range: c ? [c.t0, c.t1] : null }; }
    case "split_clip": return { kind: "clip", tag: "Cortar clip", title: `${summaryOf("clip", old || { id: ch.id })} en ${fmt(ch.at)}`, range: [Math.max(0, ch.at - 1.5), ch.at + 1.5] };
    case "reorder_clips": return { kind: "clip", tag: "Reordenar", title: ch.order.map((id) => summaryOf("clip", findItem(project, "clip", id) || { id })).join(" → "), range: [0, Math.min(dur, 8)] };
    case "remove": {
      let range = null;
      if (old && ch.kind !== "clip") range = [old.start, old.end];
      if (old && ch.kind === "clip") { const c = layout(project).find((x) => x.id === ch.id); range = c && [c.t0, c.t1]; }
      return { kind: ch.kind, tag: "Eliminar", title: old ? summaryOf(ch.kind, old) : ch.id, range };
    }
    default: return { kind: "clip", tag: ch.action, title: "" };
  }
}

const FIELD_LABEL = { content: "Texto", start: "Inicio", end: "Fin", x: "X", y: "Y", size: "Tamaño", color: "Color", font: "Fuente", weight: "Peso", background: "Fondo", stroke: "Contorno", animIn: "Entrada", animOut: "Salida", animDuration: "Duración anim.", type: "Tipo", intensity: "Intensidad", in: "Entrada origen", out: "Salida origen", speed: "Velocidad", volume: "Volumen", fadeIn: "Fundido inicio", fadeOut: "Fundido final" };
const showVal = (k, v) => v == null ? "—" : k === "animIn" || k === "animOut" ? ANIMS[v] || v : k === "type" ? EFFECTS[v] || v : typeof v === "number" ? round(v) : String(v);

function renderReview() {
  const pane = $("pane-review");
  if (!pending) {
    pane.replaceChildren(h("div", { class: "empty-pane" },
      h("div", { style: "font-size:28px" }, "✦"),
      h("p", {}, "Aquí aparecerán los cambios que proponga Claude."),
      h("p", { class: "hint" }, "Cada cambio se puede previsualizar, aceptar o rechazar antes de aplicarlo al proyecto.")));
    return;
  }
  const acc = pending.changes.filter((c) => c.accepted).length;
  const cards = pending.changes.map((ch) => {
    const info = changeInfo(ch);
    const err = viewErrors.get(ch._id);
    const meta = [];
    if (info.range) meta.push(h("span", { class: "pill" }, `${fmt(info.range[0])} – ${fmt(info.range[1])}`));
    if (info.kind === "text" && info.item) {
      meta.push(h("span", { class: "pill anim" }, `↘ ${ANIMS[info.item.animIn] || info.item.animIn}`));
      meta.push(h("span", { class: "pill anim" }, `↗ ${ANIMS[info.item.animOut] || info.item.animOut}`));
      meta.push(h("span", { class: "pill" }, `${info.item.font} ${info.item.size}px`));
    }
    if (info.kind === "effect" && info.item) meta.push(h("span", { class: "pill fx" }, `Intensidad ${Math.round(info.item.intensity * 100)}%`));
    let diff = null;
    if (info.old && info.item) {
      const rows = [];
      for (const k of Object.keys(info.item)) {
        if (k === "id" || JSON.stringify(info.old[k]) === JSON.stringify(info.item[k])) continue;
        rows.push(h("span", { class: "k" }, FIELD_LABEL[k] || k), h("span", {}, h("del", {}, showVal(k, info.old[k])), " → ", h("ins", {}, showVal(k, info.item[k]))));
      }
      if (rows.length) diff = h("div", { class: "diff" }, rows);
    }
    const tg = changeTarget(ch);
    return h("div", { class: `change k-${info.kind}${ch.accepted ? "" : " off"}${err ? " err" : ""}` },
      h("div", { class: "top" },
        h("input", { type: "checkbox", checked: ch.accepted, title: "Incluir este cambio", onchange: (e) => { ch.accepted = e.target.checked; refresh(); } }),
        h("div", { class: "title" }, info.title),
        h("span", { class: "tag" }, info.tag)),
      ch.reason ? h("div", { class: "reason" }, ch.reason) : null,
      h("div", { class: "meta" }, meta),
      diff,
      err ? h("div", { class: "errmsg" }, `⚠ ${err}`) : null,
      h("div", { class: "acts" },
        info.range ? h("button", { onclick: () => previewRange(info.range, ch) }, "▶ Ver") : null,
        tg.id && findItem(view, tg.kind, tg.id) ? h("button", { onclick: () => { selected = tg; refresh(); } }, "Seleccionar") : null,
        h("button", { onclick: () => applyPending([ch]) }, "✓ Aplicar solo este"),
      ));
  });
  pane.replaceChildren(
    pending.message ? h("div", { class: "claude-msg" }, "✦ ", pending.message) : null,
    h("div", { class: "review-bar" },
      h("button", { class: "ghost", onclick: () => { const all = !pending.changes.every((c) => c.accepted); pending.changes.forEach((c) => (c.accepted = all)); refresh(); } }, "Marcar/desmarcar todo"),
      h("div", { class: "grow" }),
      h("button", { class: "danger", onclick: discardPending }, "Descartar"),
      h("button", { class: "primary", disabled: !acc, onclick: () => applyPending(pending.changes.filter((c) => c.accepted)) }, `Aplicar ${acc}`)),
    ...(pending.changes.length ? cards : [h("div", { class: "empty-pane" }, "Claude no propuso cambios en esta respuesta.")]),
  );
}

function previewRange([a, b], ch) {
  const tg = ch && changeTarget(ch);
  if (ch && !ch.accepted) { ch.accepted = true; } // para verlo hay que incluirlo en la vista previa
  if (!$("showProposals").checked) $("showProposals").checked = true;
  if (tg?.id) selected = tg;
  refresh();
  pause();
  seek(Math.max(0, a - 0.3));
  play(Math.min(dur, b + 0.2));
}

function applyPending(list) {
  const { project: next, errors } = applyChanges(project, list);
  const okCount = list.length - errors.size;
  if (!okCount) { toast("Ninguno de esos cambios se pudo aplicar."); return; }
  pushUndo();
  project = next;
  const ids = new Set(list.map((c) => c._id));
  const titles = list.filter((c) => !errors.has(c._id)).map((c) => { const i = changeInfo(c); return `${i.tag}: ${i.title}`; });
  history.unshift({ when: Date.now(), message: pending.message, items: titles });
  const remaining = pending.changes.filter((c) => !ids.has(c._id));
  chat.push({ role: "user", content: `[Nota del editor: el usuario aplicó ${okCount} cambio(s): ${titles.join("; ")}${remaining.length ? `. Quedan ${remaining.length} pendientes de revisar.` : "."}]`, hidden: true });
  pending = remaining.length ? { ...pending, changes: remaining } : null;
  commit();
  renderChat();
  toast(`✓ ${okCount} cambio(s) aplicados. Ctrl+Z para deshacer.`, true);
}

function discardPending() {
  if (!pending) return;
  chat.push({ role: "user", content: `[Nota del editor: el usuario descartó ${pending.changes.length} cambio(s) propuestos.]`, hidden: true });
  pending = null;
  save();
  refresh();
  renderChat();
}

function renderElements() {
  const pane = $("pane-elements");
  const row = (kind, x, color, label, time) =>
    h("div", { class: `el${selected?.kind === kind && selected.id === x.id ? " sel" : ""}`, onclick: () => { select(kind, x.id); if (kind !== "clip") seek(x.start); else seek(time); } },
      h("span", { class: "dot", style: `background:${color}` }), h("span", { class: "nm" }, label), h("span", { class: "tm" }, kind === "clip" ? fmt(time) : `${fmt(x.start)}–${fmt(x.end)}`));
  const lay = layout(project);
  const kids = [
    h("div", { class: "group-h" }, `Clips (${project.clips.length})`),
    ...lay.map((c) => row("clip", c, "var(--clip)", summaryOf("clip", c) + (c.speed !== 1 ? ` · ${c.speed}×` : ""), c.t0)),
    h("div", { class: "group-h" }, `Textos y animaciones (${project.texts.length})`, h("button", { class: "icon", onclick: addText }, "＋")),
    ...[...project.texts].sort((a, b) => a.start - b.start).map((x) => row("text", x, "var(--txt)", `${summaryOf("text", x)} · ${ANIMS[x.animIn]}/${ANIMS[x.animOut]}`)),
    h("div", { class: "group-h" }, `Efectos (${project.effects.length})`, h("button", { class: "icon", onclick: addEffect }, "＋")),
    ...[...project.effects].sort((a, b) => a.start - b.start).map((x) => row("effect", x, "var(--fx)", EFFECTS[x.type])),
  ];
  if (!project.clips.length && !project.texts.length && !project.effects.length) kids.push(h("div", { class: "empty-pane" }, "Todavía no hay elementos."));
  const item = selected && findItem(project, selected.kind, selected.id);
  if (item) kids.push(inspector(selected.kind, item));
  else if (selected && findItem(view, selected.kind, selected.id)) kids.push(h("div", { class: "form hint" }, "Este elemento es una propuesta de Claude. Aplícala para poder editarla."));
  const focused = document.activeElement?.dataset?.field;
  pane.replaceChildren(...kids);
  if (focused) pane.querySelector(`[data-field="${focused}"]`)?.focus();
}

function inspector(kind, item) {
  const set = (k, v) => { pushUndo(false); item[k] = v; save(); refresh(false); }; // sin repintar el panel para no perder el foco
  const num = (k, step = 0.1, min, max) => h("div", { class: "f" }, h("label", {}, FIELD_LABEL[k]),
    h("input", { type: "number", step, min, max, value: round(item[k], 3), "data-field": k, onchange: (e) => {
      let v = +e.target.value; if (min != null) v = Math.max(min, v); if (max != null) v = Math.min(max, v);
      if (kind === "clip") { const s = sanitizeClip({ ...item, [k]: v }); pushUndo(false); Object.assign(item, s); save(); refresh(); } else set(k, v);
    } }));
  const range = (k, min = 0, max = 1, step = 0.01) => h("div", { class: "f" }, h("label", {}, `${FIELD_LABEL[k]} · ${round(item[k])}`),
    h("input", { type: "range", min, max, step, value: item[k], "data-field": k, oninput: (e) => set(k, +e.target.value) }));
  const sel = (k, opts) => h("div", { class: "f" }, h("label", {}, FIELD_LABEL[k]),
    h("select", { "data-field": k, onchange: (e) => set(k, isNaN(+e.target.value) ? e.target.value : +e.target.value) },
      Object.entries(opts).map(([v, l]) => h("option", { value: v, selected: String(item[k]) === String(v) }, l))));
  const color = (k, nullable) => h("div", { class: "f" }, h("label", {}, FIELD_LABEL[k]),
    h("div", { class: "colorf" },
      h("input", { type: "color", value: (item[k] || "#000000").slice(0, 7), oninput: (e) => set(k, e.target.value + (item[k]?.length === 9 ? item[k].slice(7) : "")) }),
      h("input", { type: "text", value: item[k] || "", placeholder: nullable ? "ninguno" : "", "data-field": k, onchange: (e) => set(k, e.target.value.trim() || (nullable ? null : "#ffffff")) })));
  const box = h("div", { class: "form" });

  if (kind === "text") {
    box.append(
      h("h4", {}, "Texto seleccionado"),
      h("div", { class: "f" }, h("label", {}, "Texto"), h("textarea", { rows: 2, "data-field": "content", oninput: (e) => set("content", e.target.value) }, item.content)),
      h("div", { class: "g2" }, num("start", 0.1, 0), num("end", 0.1, 0)),
      h("div", { class: "g2" }, range("x"), range("y")),
      h("div", { class: "g2" }, num("size", 1, 8, 400), sel("weight", { 400: "Normal", 600: "Semi", 800: "Negrita" })),
      sel("font", Object.fromEntries(FONTS.map((f) => [f, f]))),
      h("div", { class: "g2" }, color("color"), color("background", true)),
      color("stroke", true),
      h("div", { class: "g2" }, sel("animIn", ANIMS), sel("animOut", ANIMS)),
      num("animDuration", 0.05, 0.05, 3),
      h("div", { class: "btns" },
        h("button", { onclick: () => previewRange([item.start, item.end]) }, "▶ Ver animación"),
        h("button", { onclick: () => { pushUndo(); project.texts.push({ ...clone(item), id: uid("t"), start: item.end, end: item.end + (item.end - item.start) }); commit(); } }, "Duplicar"),
        h("button", { class: "danger", onclick: deleteSelected }, "Eliminar")),
    );
  } else if (kind === "effect") {
    box.append(
      h("h4", {}, "Efecto seleccionado"),
      sel("type", EFFECTS),
      h("div", { class: "g2" }, num("start", 0.1, 0), num("end", 0.1, 0)),
      range("intensity"),
      h("div", { class: "btns" },
        h("button", { onclick: () => previewRange([item.start, item.end]) }, "▶ Ver efecto"),
        h("button", { class: "danger", onclick: deleteSelected }, "Eliminar")),
    );
  } else {
    const a = assets.get(item.asset);
    const i = project.clips.indexOf(item);
    const c = layout(project)[i];
    box.append(
      h("h4", {}, `Clip · ${a?.name || item.asset}`),
      h("div", { class: "hint", style: "margin-bottom:8px" }, `En la línea de tiempo: ${fmt(c.t0)} – ${fmt(c.t1)} · origen ${fmt(a?.duration)}`),
      h("div", { class: "g2" }, num("in", 0.1, 0, a?.duration), num("out", 0.1, 0, a?.duration)),
      h("div", { class: "g2" }, num("speed", 0.05, 0.25, 4), range("volume")),
      h("div", { class: "g2" }, num("fadeIn", 0.1, 0), num("fadeOut", 0.1, 0)),
      h("div", { class: "btns" },
        h("button", { onclick: () => previewRange([c.t0, c.t1]) }, "▶ Ver clip"),
        h("button", { disabled: i === 0, onclick: () => { pushUndo(); project.clips.splice(i - 1, 0, project.clips.splice(i, 1)[0]); commit(); } }, "◀ Antes"),
        h("button", { disabled: i === project.clips.length - 1, onclick: () => { pushUndo(); project.clips.splice(i + 1, 0, project.clips.splice(i, 1)[0]); commit(); } }, "Después ▶"),
        h("button", { onclick: splitAtPlayhead }, "✂ Cortar en cursor"),
        h("button", { class: "danger", onclick: deleteSelected }, "Eliminar")),
    );
  }
  return box;
}

function renderHistory() {
  const pane = $("pane-history");
  if (!history.length) { pane.replaceChildren(h("div", { class: "empty-pane" }, "Aquí verás los cambios de Claude que hayas aplicado.")); return; }
  pane.replaceChildren(
    h("div", { class: "hint", style: "margin-bottom:8px" }, "Usa ↶ / Ctrl+Z para deshacer."),
    ...history.map((x) => h("div", { class: "hist" },
      h("div", { class: "when" }, new Date(x.when).toLocaleString()),
      x.message ? h("div", { style: "margin:3px 0" }, x.message) : null,
      h("ul", { style: "margin:4px 0 0; padding-left:18px" }, x.items.map((i) => h("li", {}, i))))));
}

// ---------- acciones manuales ----------
function addText() {
  pushUndo();
  const id = uid("t");
  project.texts.push(sanitizeText({ id, content: "Tu texto aquí", start: t, end: Math.min(t + 3, Math.max(dur, t + 3)), x: 0.5, y: 0.8, size: 72, color: "#ffffff", font: "Montserrat", weight: 800, animIn: "pop", animOut: "fade", animDuration: 0.45 }));
  selected = { kind: "text", id };
  setTab("elements");
  commit();
}
function addEffect() {
  pushUndo();
  const id = uid("fx");
  project.effects.push(sanitizeEffect({ id, type: "zoom-in", start: t, end: t + 2, intensity: 0.5 }));
  selected = { kind: "effect", id };
  setTab("elements");
  commit();
}
function splitAtPlayhead() {
  const lay = layout(project);
  const c = (selected?.kind === "clip" && lay.find((x) => x.id === selected.id && t > x.t0 && t < x.t1)) || clipAt(lay, t);
  if (!c) return toast("Coloca el cursor sobre un clip para cortarlo.");
  try {
    const p = clone(project);
    applyChange(p, { action: "split_clip", id: c.id, at: t, newId: uid("c") });
    pushUndo();
    project = p;
    commit();
  } catch (e) { toast(e.message); }
}
function deleteSelected() {
  if (!selected || !findItem(project, selected.kind, selected.id)) return;
  pushUndo();
  project[KIND[selected.kind]] = project[KIND[selected.kind]].filter((x) => x.id !== selected.id);
  selected = null;
  commit();
}

// ---------- chat con Claude ----------
const anthropicHeaders = () => ({ "Content-Type": "application/json", ...(ls.get("vid.anthropicKey") ? { "x-anthropic-key": ls.get("vid.anthropicKey") } : {}) });

function renderChat() {
  const box = $("msgs");
  const visible = chat.filter((m) => !m.hidden);
  const kids = visible.map((m) => h("div", { class: `msg ${m.role}` }, m.display || m.content,
    m.role === "assistant" && m.count ? h("a", { href: "#", class: "go", onclick: (e) => { e.preventDefault(); setTab("review"); } }, `${m.count} cambio(s) → revisar en el panel`) : null));
  if (!visible.length) kids.push(h("div", { class: "msg note" }, "Describe la edición que quieres. Claude verá la línea de tiempo y algunos fotogramas del video, y te propondrá cambios para revisar."));
  if (busy) kids.push(h("div", { class: "msg assistant thinking" }, "Claude está editando"));
  box.replaceChildren(...kids);
  box.scrollTop = box.scrollHeight;
  $("chips").replaceChildren(...SUGGESTIONS.map((s) => h("button", { onclick: () => { $("instruction").value = s; $("instruction").focus(); } }, s)));
}

// Fotogramas de muestra del proyecto (sin propuestas) para que Claude "vea" el video
async function captureFrames(n) {
  if (!n || !project.clips.length) return [];
  const lay = layout(project);
  const total = projectDuration(project, lay);
  const W = 512, H = Math.round((512 * project.height) / project.width);
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const oc = off.getContext("2d");
  const frames = [];
  for (let i = 0; i < n; i++) {
    const ft = (total * (i + 0.5)) / n;
    const clip = clipAt(lay, ft);
    if (clip) {
      const v = assets.get(clip.asset)?.el;
      const target = clip.in + (ft - clip.t0) * clip.speed;
      if (v && Math.abs(v.currentTime - target) > 0.02) { v.currentTime = target; await once(v, "seeked", 2000); }
    }
    drawFrame(oc, project, lay, ft);
    frames.push({ t: round(ft), data: off.toDataURL("image/jpeg", 0.72).split(",")[1] });
  }
  dirty = true;
  return frames;
}

const compact = (p) => JSON.parse(JSON.stringify(p, (k, v) => (typeof v === "number" ? round(v, 3) : v)));
let busy = false;

async function send() {
  const instruction = $("instruction").value.trim();
  if (!instruction || busy) return;
  if (pending && !confirm("Hay propuestas sin revisar. ¿Descartarlas y pedir otra edición?")) return;
  if (pending) discardPending();
  pause();
  busy = true;
  $("btnSend").disabled = true;
  const history = chat.slice(-16).map(({ role, content }) => ({ role, content }));
  chat.push({ role: "user", content: instruction });
  $("instruction").value = "";
  renderChat();
  try {
    const frames = await captureFrames(+ls.get("vid.frames", "8"));
    const body = {
      instruction, history, frames, notes: $("notes").value, model: ls.get("vid.model", ""),
      project: compact({ ...project, duration: projectDuration(project), clips: layout(project).map(({ t0, t1, ...c }) => ({ ...c, timelineStart: t0, timelineEnd: t1 })) }),
      assets: [...assets.values()].map(({ id, name, duration, width, height }) => ({ id, name, duration: round(duration, 3), width, height })),
    };
    const r = await fetch("/api/video/edit", { method: "POST", headers: anthropicHeaders(), body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({ error: `Error ${r.status}` }));
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    const changes = data.changes.map((c) => ({ ...c, _id: uid("ch"), accepted: true }));
    const summary = changes.map((c) => { const i = changeInfo(c); return `- ${i.tag}: ${i.title}`; }).join("\n");
    chat.push({ role: "assistant", content: `${data.message}${summary ? `\n\nCambios propuestos:\n${summary}` : ""}`, display: data.message, count: changes.length });
    pending = changes.length ? { message: data.message, changes } : null;
    $("showProposals").checked = true;
    setTab("review");
    if (changes.length) {
      // salta al primer cambio para verlo enseguida
      const first = changeInfo(changes[0]).range;
      if (first) seek(Math.max(0, first[0]));
    }
  } catch (e) {
    chat.pop();
    $("instruction").value = instruction;
    toast(e.message);
    if (/API key/i.test(e.message)) openSettings();
  } finally {
    busy = false;
    $("btnSend").disabled = false;
    save();
    refresh();
    renderChat();
  }
}

// ---------- exportación ----------
async function startExport() {
  if (!project.clips.length && !project.texts.length) return toast("No hay nada que exportar.");
  if (!window.MediaRecorder || !canvas.captureStream) return toast("Tu navegador no permite exportar video. Usa Chrome o Edge.");
  if (pending && !confirm("Hay propuestas sin aplicar. Se exportará solo el proyecto aplicado. ¿Continuar?")) return;
  ensureAudio();
  pause();
  const types = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  const mimeType = types.find((m) => MediaRecorder.isTypeSupported(m)) || "";
  const stream = canvas.captureStream(30);
  audioDest?.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10e6 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  exporting = { rec, chunks, mimeType, cancelled: false };
  selected = null;
  refresh(); // la vista pasa a ser el proyecto aplicado
  $("exportBar").style.width = "0";
  $("exportInfo").textContent = `Grabando en tiempo real (${fmt(dur)}). No cambies de pestaña.`;
  $("exportDlg").showModal();
  seek(0);
  syncVideos(L, 0);
  const c0 = clipAt(L, 0);
  if (c0) await once(assets.get(c0.asset).el, "seeked", 1500);
  rec.start(250);
  play();
}
function finishExport(cancel = false) {
  const ex = exporting;
  if (!ex) return;
  exporting = null;
  pause();
  ex.rec.onstop = () => {
    $("exportDlg").close();
    refresh();
    if (cancel) return;
    const blob = new Blob(ex.chunks, { type: ex.mimeType || "video/webm" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `ia-studio-${Date.now()}.${(ex.mimeType || "").includes("mp4") ? "mp4" : "webm"}` });
    document.body.append(a); a.click(); a.remove();
    toast("✓ Video exportado.", true);
  };
  ex.rec.stop();
}

// ---------- ajustes ----------
async function openSettings() {
  $("anthropicKey").value = ls.get("vid.anthropicKey");
  $("frameCount").value = ls.get("vid.frames", "8");
  $("settings").showModal();
}
async function loadConfig() {
  try {
    const cfg = await (await fetch("/api/config")).json();
    $("serverKeyNote").textContent = cfg.serverAnthropicKey ? "✓ El servidor ya tiene una clave configurada." : "";
    $("claudeModel").replaceChildren(...(cfg.claudeModels || []).map((m) => h("option", { value: m.id, selected: m.id === ls.get("vid.model") }, m.name)));
  } catch {}
}

// ---------- toast ----------
let toastTimer;
function toast(msg, ok = false) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("ok", ok);
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = "none"), ok ? 2800 : 6000);
}

// ---------- eventos ----------
$("btnImport").onclick = $("drop").onclick = () => $("fileInput").click();
$("fileInput").onchange = (e) => { importFiles([...e.target.files]); e.target.value = ""; };
for (const el of [$("drop"), $("stage")]) {
  el.addEventListener("dragover", (e) => { e.preventDefault(); $("drop").classList.add("over"); });
  el.addEventListener("dragleave", () => $("drop").classList.remove("over"));
  el.addEventListener("drop", (e) => { e.preventDefault(); $("drop").classList.remove("over"); importFiles([...e.dataTransfer.files]); });
}
$("btnPlay").onclick = () => (playing ? pause() : play());
$("btnStart").onclick = () => { pause(); seek(0); };
$("aspect").onchange = (e) => setAspect(e.target.value);
$("btnSend").onclick = send;
$("instruction").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); });
$("showProposals").onchange = refresh;
$("zoom").oninput = () => { ls.set("vid.zoom", $("zoom").value); renderTimeline(); };
$("btnAddText").onclick = addText;
$("btnAddFx").onclick = addEffect;
$("btnSplit").onclick = splitAtPlayhead;
$("btnDelete").onclick = deleteSelected;
$("btnUndo").onclick = undo;
$("btnRedo").onclick = redo;
$("btnExport").onclick = startExport;
$("btnCancelExport").onclick = () => finishExport(true);
$("exportDlg").addEventListener("cancel", (e) => { e.preventDefault(); finishExport(true); });
$("btnSettings").onclick = openSettings;
$("btnCloseSettings").onclick = () => $("settings").close();
$("btnSaveSettings").onclick = () => {
  ls.set("vid.anthropicKey", $("anthropicKey").value.trim());
  ls.set("vid.model", $("claudeModel").value);
  ls.set("vid.frames", $("frameCount").value);
  $("settings").close();
  toast("✓ Ajustes guardados.", true);
};
$("btnNew").onclick = async () => {
  if (!confirm("¿Empezar un proyecto nuevo? Se borrarán los videos importados, el chat y el historial.")) return;
  pause();
  for (const a of assets.values()) { a.el.pause(); URL.revokeObjectURL(a.url); }
  assets.clear();
  try { await idb("readwrite", (s) => s.clear()); } catch {}
  project = newProject(); chat = []; history = []; pending = null; selected = null; undoStack.length = redoStack.length = 0;
  setAspect("16:9", false);
  commit(); renderAssets(); renderChat();
};
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
$("ruler").addEventListener("pointerdown", scrubFrom);
$("tlInner").addEventListener("pointerdown", (e) => { if (e.target.classList.contains("track")) { select(null); scrubFrom(e); } });

// Arrastrar textos directamente sobre el lienzo
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  const k = canvas.width / r.width;
  const px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
  const hit = [...textBoxes].reverse().find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
  if (!hit) { if (selected) select(null); return; }
  select("text", hit.id);
  const item = findItem(project, "text", hit.id);
  if (!item) return;
  const x0 = item.x, y0 = item.y;
  let moved = false;
  canvas.setPointerCapture(e.pointerId);
  const move = (ev) => {
    if (!moved) { pushUndo(); moved = true; }
    item.x = round(clamp(x0 + ((ev.clientX - e.clientX) * k) / canvas.width), 3);
    item.y = round(clamp(y0 + ((ev.clientY - e.clientY) * k) / canvas.height), 3);
    refresh();
  };
  const up = () => { canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); if (moved) commit(); };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
});

addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (typing || exporting) return;
  if (e.code === "Space") { e.preventDefault(); playing ? pause() : play(); }
  else if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
  else if (e.key.toLowerCase() === "s") splitAtPlayhead();
  else if (e.key === "ArrowLeft") seek(t - (e.shiftKey ? 1 : 1 / 30));
  else if (e.key === "ArrowRight") seek(t + (e.shiftKey ? 1 : 1 / 30));
});
addEventListener("resize", renderTimeline);

// ---------- arranque ----------
$("zoom").value = ls.get("vid.zoom", "60");
canvas.width = project.width;
canvas.height = project.height;
document.fonts?.ready.then(() => (dirty = true));
FONTS.forEach((f) => document.fonts?.load(`800 40px "${f}"`).then(() => (dirty = true)).catch(() => {}));
loadConfig();
renderChat();
refresh();
restoreAssets();
requestAnimationFrame(tick);
