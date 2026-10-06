import re, sys
import os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public') + '/'
html = open(R+'video.html').read()
css = open(R+'video.css').read()
js = open(R+'video.js').read()

def rep(s, old, new, count=1):
    assert old in s, old[:80]
    return s.replace(old, new, count)

# ---------- CSS ----------
css = rep(css, ":root {\n", ":root {\n  color-scheme:dark;\n")
css += '''
.stage .empty .demo { pointer-events:auto; margin-top:14px; }
.stage .empty .inner { display:flex; flex-direction:column; align-items:center; gap:4px; }
.avail { font-size:12px; color:var(--warn); padding:0 12px 6px; }
'''

# ---------- HTML body ----------
body = html.split('<body>')[1].split('<script src="/video.js"></script>')[0]
body = rep(body, '''  <nav>
    <a href="/">Imágenes</a>
    <a href="/video.html" class="on">Video</a>
  </nav>
''', '')
body = rep(body, '<div class="empty" id="stageEmpty">Importa un video para empezar.<br>Luego pídele a Claude lo que quieras editar.</div>',
  '<div class="empty" id="stageEmpty"><div class="inner"><div>Importa un video para empezar.<br>Luego pídele a Claude lo que quieras editar.</div><button class="primary demo" id="btnDemo">▶ Probar con un video de ejemplo</button><div class="hint" id="demoInfo"></div></div></div>')
body = rep(body, '<div class="chips" id="chips"></div>', '<div class="avail" id="avail" hidden></div>\n      <div class="chips" id="chips"></div>')
body = re.sub(r'  <label for="anthropicKey">.*?<select id="claudeModel"></select>\n', '''  <label for="tier">Modelo de Claude</label>
  <select id="tier">
    <option value="default">Equilibrado (recomendado)</option>
    <option value="complex">Más capaz (piensa más, tarda más)</option>
    <option value="quick">Rápido (ediciones simples)</option>
  </select>
  <div class="hint">Usa tu propia cuenta de Claude; la primera vez te pedirá permiso.</div>
''', body, flags=re.S)
body = rep(body, '<h3 style="margin-top:0">Ajustes del editor</h3>', '<h3 style="margin-top:0">Ajustes del editor</h3>')

# ---------- JS ----------
js = rep(js, 'const anthropicHeaders = () => ({ "Content-Type": "application/json", ...(ls.get("vid.anthropicKey") ? { "x-anthropic-key": ls.get("vid.anthropicKey") } : {}) });\n', '''// Claude se llama desde la página con la cuenta de quien la usa (capacidad "sample")
let sampleFn = null, sampleImages = null, sampleCtl = null;
(async () => {
  try { sampleFn = await window.claude?.use("sample"); } catch { sampleFn = null; }
  if (sampleFn) { try { sampleImages = (await sampleFn.limits()).images || null; } catch {} }
  setAvail(sampleFn ? "" : "Claude no está disponible en esta vista. Puedes editar a mano igualmente.");
})();
function setAvail(msg) { $("avail").textContent = msg; $("avail").hidden = !msg; $("btnSend").disabled = !!msg; }

const RULES = `Eres el editor de video de "IA Studio". El usuario te pide cambios sobre un proyecto de video y tú respondes SOLO con cambios estructurados que él revisará en un panel (puede aceptar o rechazar cada uno), así que cada cambio debe ser independiente y tener un "reason" claro en español.

Modelo del proyecto:
- clips: segmentos de video que se reproducen uno tras otro en el orden del array (sin huecos). Duración en la línea de tiempo = (out - in) / speed. timelineStart/timelineEnd te indican su posición actual.
- texts: textos superpuestos con posición normalizada (x, y entre 0 y 1 = centro del texto), estilo y animación de entrada/salida.
- effects: efectos visuales aplicados a un rango de la línea de tiempo global.
- Los tiempos de texts y effects son segundos de la línea de tiempo final (no del archivo de origen).

Responde SOLO con un objeto JSON, sin texto alrededor:
{"message": "respuesta corta en español resumiendo lo que propones", "changes": [Cambio, ...]}

Cada Cambio es uno de:
{"action":"add_text","reason":"...","text":Texto}
{"action":"update_text","reason":"...","text":Texto}            (objeto completo con el id existente)
{"action":"add_effect","reason":"...","effect":Efecto}
{"action":"update_effect","reason":"...","effect":Efecto}        (objeto completo)
{"action":"update_clip","reason":"...","clip":Clip}              (objeto completo)
{"action":"split_clip","reason":"...","id":"id del clip","at":segundo_de_la_linea_de_tiempo,"newId":"id nuevo"}
{"action":"reorder_clips","reason":"...","order":["id", ...]}
{"action":"remove","reason":"...","kind":"clip"|"text"|"effect","id":"..."}

Texto = {"id":string,"content":string (usa \\\\n para saltos),"start":number,"end":number,"x":0-1,"y":0-1,"size":px para un lienzo cuyo lado corto mide 1080 (subtítulos ~48, títulos 90-140),"color":"#rrggbb","font":"Inter"|"Montserrat"|"Bebas Neue"|"Playfair Display"|"Permanent Marker"|"Roboto Mono","weight":400|600|800,"background":"#rrggbbaa" o null,"stroke":"#rrggbb" o null,"animIn":Anim,"animOut":Anim,"animDuration":0.2-1.2}
Anim = "none"|"fade"|"slide-up"|"slide-down"|"slide-left"|"slide-right"|"pop"|"zoom"|"bounce"|"blur"|"typewriter"
Efecto = {"id":string,"type":"zoom-in"|"zoom-out"|"shake"|"flash"|"vignette"|"bw"|"sepia"|"warm"|"cool"|"vivid"|"blur"|"letterbox","start":number,"end":number,"intensity":0-1}
Clip = {"id":string,"asset":string,"in":number,"out":number,"speed":0.25-4,"volume":0-1,"fadeIn":segundos,"fadeOut":segundos}

Reglas:
- Usa solo ids existentes para update_*, split_clip, reorder_clips y remove. Para elementos nuevos crea ids únicos y descriptivos (t_titulo, fx_zoom1...).
- Mantén in/out dentro de la duración del asset y los textos dentro de la duración total.
- Si recibes fotogramas, úsalos para entender el contenido, colocar textos donde no tapen lo importante y elegir colores legibles.
- No puedes oír el audio. Si te piden subtítulos y no hay transcripción en las notas, propón textos de ejemplo y dilo en message.
- Si la petición es solo una pregunta, devuelve "changes": [] y responde en message.
- Diseño: tipografía legible, márgenes seguros (x e y entre 0.08 y 0.92), animaciones con intención y sin exceso.`;
const ACTIONS = new Set(["add_text", "update_text", "add_effect", "update_effect", "update_clip", "split_clip", "reorder_clips", "remove"]);
''')

# frames as blobs
js = rep(js, '''    drawFrame(oc, project, lay, ft);
    frames.push({ t: round(ft), data: off.toDataURL("image/jpeg", 0.72).split(",")[1] });''', '''    drawFrame(oc, project, lay, ft);
    const blob = await new Promise((r) => off.toBlob(r, "image/jpeg", 0.75));
    if (blob) frames.push({ t: round(ft), blob });''')
js = rep(js, "  const W = 512, H = Math.round((512 * project.height) / project.width);", "  const W = 768, H = Math.round((768 * project.height) / project.width);")

old_send = js[js.index('async function send() {'):js.index('// ---------- exportación ----------')]
new_send = '''async function send() {
  if (busy) { sampleCtl?.abort(); return; }
  const instruction = $("instruction").value.trim();
  if (!instruction) return;
  if (!sampleFn) return toast("Claude no está disponible en esta vista.");
  if (pending) discardPending();
  pause();
  busy = true;
  $("btnSend").textContent = "■ Detener";
  const prior = chat.slice(-16).map(({ role, content }) => ({ role, content }));
  chat.push({ role: "user", content: instruction });
  $("instruction").value = "";
  renderChat();
  try {
    const n = sampleImages ? Math.min(+ls.get("vid.frames", "8"), sampleImages.maxCount || 0) : 0;
    const frames = await captureFrames(n);
    const proj = compact({ ...project, duration: projectDuration(project), clips: layout(project).map(({ t0, t1, ...c }) => ({ ...c, timelineStart: t0, timelineEnd: t1 })) });
    const assetList = [...assets.values()].map(({ id, name, duration, width, height }) => ({ id, name, duration: round(duration, 3), width, height }));
    const notes = $("notes").value.trim().slice(0, 20000);
    const ask =
      (frames.length ? `Te adjunto ${frames.length} fotogramas del proyecto actual, en orden, en estos segundos de la línea de tiempo: ${frames.map((f) => f.t + "s").join(", ")}.\\n\\n` : "") +
      `Archivos de video (assets):\\n${JSON.stringify(assetList)}\\n\\nProyecto actual:\\n${JSON.stringify(proj)}\\n\\n` +
      (notes ? `Notas / transcripción del usuario:\\n${notes}\\n\\n` : "") +
      `Petición: ${instruction}\\n\\nResponde solo con el objeto JSON {"message", "changes"}.`;
    const turns = [{ role: "user", content: RULES }, ...prior.filter((m) => m.content), { role: "user", content: ask }];
    sampleCtl = new AbortController();
    const data = await sampleFn.json(turns, {
      cache: false, signal: sampleCtl.signal, modelTier: ls.get("vid.tier", "default"),
      ...(frames.length ? { images: frames.map((f) => f.blob) } : {}),
    });
    if (!data || typeof data !== "object") throw { code: "invalid_json" };
    const message = String(data.message || "");
    const changes = (Array.isArray(data.changes) ? data.changes : [])
      .filter((c) => c && typeof c === "object" && ACTIONS.has(c.action))
      .map((c) => ({ ...c, reason: String(c.reason || ""), _id: uid("ch"), accepted: true }));
    const summary = changes.map((c) => { try { const i = changeInfo(c); return `- ${i.tag}: ${i.title}`; } catch { return `- ${c.action}`; } }).join("\\n");
    chat.push({ role: "assistant", content: `${message}${summary ? `\\n\\nCambios propuestos:\\n${summary}` : ""}`, display: message, count: changes.length });
    pending = changes.length ? { message, changes } : null;
    $("showProposals").checked = true;
    setTab("review");
    if (changes.length) {
      const first = changeInfo(changes[0]).range;
      if (first) seek(Math.max(0, first[0]));
    }
  } catch (e) {
    chat.pop();
    $("instruction").value = instruction;
    const code = e?.code;
    if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") {
      setAvail("No hay permiso para usar Claude en esta página. Puedes editar a mano igualmente.");
    } else if (code !== "cancelled") {
      toast({
        rate_limited: "Has hecho muchas peticiones seguidas o llegaste a tu límite de uso. Espera un poco y vuelve a intentarlo.",
        session_expired: "Tu sesión de Claude caducó. Vuelve a iniciar sesión.",
        refused: "Claude no quiso hacer esa edición. Prueba a pedirla de otra forma.",
        invalid_json: "Claude respondió en un formato inesperado. Vuelve a intentarlo o pide menos cambios a la vez.",
        prompt_too_large: "El proyecto es demasiado grande para enviarlo. Acorta las notas o borra el historial del chat.",
        images_unavailable: "Esta vista no puede enviar fotogramas. Pon 'Ninguno' en Ajustes.",
        image_rejected: "No se pudieron enviar los fotogramas. Pon menos en Ajustes.",
      }[code] || "No se pudo contactar con Claude. Vuelve a intentarlo.");
    }
  } finally {
    busy = false;
    sampleCtl = null;
    $("btnSend").textContent = "Enviar a Claude";
    save();
    refresh();
    renderChat();
  }
}

'''
js = js.replace(old_send, new_send)

js = rep(js, '  if (pending && !confirm("Hay propuestas sin aplicar. Se exportará solo el proyecto aplicado. ¿Continuar?")) return;\n',
            '  if (pending) toast("Se exporta solo lo aplicado; las propuestas pendientes no se incluyen.", true);\n')
js = rep(js, '''  ex.rec.onstop = () => {
    $("exportDlg").close();
    refresh();
    if (cancel) return;
    const blob = new Blob(ex.chunks, { type: ex.mimeType || "video/webm" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `ia-studio-${Date.now()}.${(ex.mimeType || "").includes("mp4") ? "mp4" : "webm"}` });
    document.body.append(a); a.click(); a.remove();
    toast("✓ Video exportado.", true);
  };''', '''  ex.rec.onstop = async () => {
    $("exportDlg").close();
    refresh();
    if (cancel) return;
    const blob = new Blob(ex.chunks, { type: ex.mimeType || "video/webm" });
    const dl = await window.claude?.use("downloads").catch(() => null);
    if (!dl) return toast("Esta vista no permite descargar archivos.");
    try {
      await dl.save({ filename: `ia-studio-${Date.now()}.${(ex.mimeType || "").includes("mp4") ? "mp4" : "webm"}`, data: blob });
      toast("✓ Video exportado.", true);
    } catch (e) {
      if (e?.code !== "declined") toast(e?.code === "too_large" ? "El video es demasiado grande para guardarlo aquí." : "No se pudo guardar el video.");
    }
  };''')

js = rep(js, '''  $("anthropicKey").value = ls.get("vid.anthropicKey");
''', '''  $("tier").value = ls.get("vid.tier", "default");
''')
js = js.replace(js[js.index('async function loadConfig() {'):js.index('// ---------- toast ----------')], '')
js = rep(js, '''  ls.set("vid.anthropicKey", $("anthropicKey").value.trim());
  ls.set("vid.model", $("claudeModel").value);
''', '''  ls.set("vid.tier", $("tier").value);
''')
js = rep(js, '''$("btnNew").onclick = async () => {
  if (!confirm("¿Empezar un proyecto nuevo? Se borrarán los videos importados, el chat y el historial.")) return;
''', '''let newArmed = 0;
$("btnNew").onclick = async () => {
  // confirmación en dos pasos (la página no puede mostrar diálogos del navegador)
  if (Date.now() - newArmed > 4000) { newArmed = Date.now(); $("btnNew").textContent = "¿Borrar todo? Pulsa otra vez"; setTimeout(() => ($("btnNew").textContent = "Nuevo proyecto"), 4000); return; }
  newArmed = 0;
  $("btnNew").textContent = "Nuevo proyecto";
''')
js = rep(js, 'loadConfig();\n', '')

# demo video generator
js = rep(js, '// ---------- arranque ----------', '''// ---------- video de ejemplo (generado en el navegador) ----------
async function makeDemo() {
  const btn = $("btnDemo");
  if (!window.MediaRecorder) return toast("Tu navegador no puede generar el video de ejemplo.");
  btn.disabled = true;
  const W = 1280, H = 720, D = 8;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  const stream = cv.captureStream(30);
  // un tono suave para que el clip tenga audio
  let ac;
  try {
    ac = new AudioContext();
    const dest = ac.createMediaStreamDestination(), g = ac.createGain();
    g.gain.value = 0.05;
    [220, 277, 330].forEach((f) => { const o = ac.createOscillator(); o.frequency.value = f; o.connect(g); o.start(); });
    g.connect(dest);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  } catch {}
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stars = Array.from({ length: 90 }, (_, i) => [(i * 137.5) % W, (i * 71.3) % (H * 0.55), 0.5 + (i % 3)]);
  const t0 = performance.now();
  const frame = () => {
    const s = (performance.now() - t0) / 1000;
    const k = Math.min(1, s / D);
    // cielo del atardecer a la noche
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${250 - 30 * k} 60% ${30 - 18 * k}%)`);
    g.addColorStop(0.6, `hsl(${20 + 10 * k} 80% ${55 - 30 * k}%)`);
    g.addColorStop(1, `hsl(${15} 70% ${25 - 15 * k}%)`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = `rgba(255,255,255,${k})`;
    for (const [x, y, r] of stars) { c.beginPath(); c.arc(x, y, r * (0.7 + 0.3 * Math.sin(s * 3 + x)), 0, 7); c.fill(); }
    // sol que se pone
    c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(W * 0.7, H * 0.45 + k * 260, 70, 0, 7); c.fill();
    // ciudad con paralaje
    for (let layer = 0; layer < 3; layer++) {
      c.fillStyle = ["#2a1f3d", "#1b1430", "#0d0a1a"][layer];
      const off = (s * (20 + layer * 35)) % 160;
      for (let x = -160; x < W + 160; x += 80) {
        const hgt = 120 + layer * 60 + (((x / 80) * 53 + layer * 17) % 7) * 22;
        c.fillRect(x - off, H - hgt, 70, hgt);
        if (layer === 2) { c.fillStyle = `rgba(255,214,120,${0.25 + 0.6 * k})`; for (let wy = H - hgt + 15; wy < H - 20; wy += 28) c.fillRect(x - off + 12, wy, 12, 10), c.fillRect(x - off + 42, wy, 12, 10); c.fillStyle = "#0d0a1a"; }
      }
    }
    btn.textContent = `Generando video de ejemplo… ${Math.round(k * 100)}%`;
    if (s < D) requestAnimationFrame(frame); else rec.stop();
  };
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(250);
  frame();
  await done;
  try { ac?.close(); } catch {}
  btn.textContent = "▶ Probar con un video de ejemplo";
  btn.disabled = false;
  const type = (mime || "video/webm").split(";")[0];
  await importFiles([new File([new Blob(chunks, { type })], `ciudad-atardecer.${type.includes("mp4") ? "mp4" : "webm"}`, { type })]);
  $("instruction").value = "Añade un título animado al inicio, un subtítulo con caja y un look cinematográfico";
  toast("✓ Video de ejemplo listo. Pulsa “Enviar a Claude” para probar.", true);
}
$("btnDemo").onclick = makeDemo;

// ---------- arranque ----------''')

# ---------- Motion (conexión con Claude Code + Remotion) ----------
HERE = os.path.dirname(os.path.abspath(__file__))
css += "\n" + open(os.path.join(HERE, 'motion.css')).read()
body = rep(body, '<button data-tab="history">Historial</button>', '<button data-tab="motion">Motion ✦<span class="count" id="motionCount"></span></button>\n      <button data-tab="history">Historial</button>')
body = rep(body, '<div class="pane" id="pane-history"></div>', '<div class="pane" id="pane-history"></div>\n' + open(os.path.join(HERE, 'motion.html')).read())
js = rep(js, '  else if (tab === "elements") renderElements();', '  else if (tab === "elements") renderElements();\n  else if (tab === "motion") renderMotion();')
js = rep(js, '// ---------- arranque ----------', open(os.path.join(HERE, 'motion.js')).read() + '// ---------- arranque ----------')

out = '<title>IA Studio Video</title>\n' \
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' \
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Montserrat:wght@400;600;800&family=Permanent+Marker&family=Playfair+Display:wght@400;600;800&family=Roboto+Mono:wght@400;600&display=swap">\n' \
  f'<style>\n{css}\n</style>\n{body}\n<script>\n{js}\n</script>\n'
open(sys.argv[1], 'w').write(out)
print(len(out))
