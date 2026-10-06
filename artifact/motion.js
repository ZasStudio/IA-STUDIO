// ---------- Motion: peticiones a Claude Code (Remotion) ----------
// La petición se guarda en la base de datos de la página (colección "motion") y se avisa a
// Claude Code con un comentario "Enviar a Claude". Claude Code la renderiza con Remotion,
// sube el video a los archivos de la página y actualiza el documento: la página lo recibe al instante.
const MOTION_KINDS = ["Intro / título", "Lower third", "Tipografía cinética", "Logo reveal", "Llamado a la acción", "Subtítulos animados", "Transición", "Dato / contador", "Otro"];
let mdb = null, mcomments = null, motionReqs = [], motionKind = MOTION_KINDS[0], canClaude = "off";
const motionSeen = new Map();
const ST_LABEL = { pending: "Enviado", working: "En proceso", done: "Listo", error: "Error" };

function motionStatus(msg, warn = false) { $("motionStatus").textContent = msg; $("motionStatus").classList.toggle("warn", warn); }
function renderKinds() {
  $("motionKinds").replaceChildren(...MOTION_KINDS.map((k) => h("button", { class: k === motionKind ? "on" : "", onclick: () => { motionKind = k; renderKinds(); } }, k)));
}
async function checkClaude() {
  try { canClaude = mcomments ? await mcomments.canSendToClaude() : "off"; } catch { canClaude = "off"; }
  if (!mdb) motionStatus("La conexión con Claude Code no está disponible en esta vista.", true);
  else if (canClaude === "available") motionStatus("Conectado con Claude Code.");
  else if (canClaude === "no_session") motionStatus("Claude Code no está escuchando ahora. Tu petición se guardará y la verá en cuanto vuelva.", true);
  else motionStatus("No se puede avisar a Claude Code desde esta vista. Tu petición se guardará igualmente.", true);
}
function renderMotion() { checkClaude(); renderMotionList(); }
function renderMotionList() {
  const box = $("motionList");
  const active = motionReqs.filter((r) => r.status === "pending" || r.status === "working").length;
  $("motionCount").textContent = active || "";
  if (!motionReqs.length) { box.replaceChildren(h("div", { class: "empty-pane" }, "Aún no has pedido ningún motion graphic.")); return; }
  // no repintar los videos que ya se están reproduciendo
  const key = JSON.stringify(motionReqs);
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  box.replaceChildren(...motionReqs.map((r) => h("div", { class: "mreq" },
    h("div", { class: "top" }, h("span", { class: `st ${r.status}` }, ST_LABEL[r.status] || r.status), h("div", { class: "brief", title: r.brief }, `${r.kind ? r.kind + " · " : ""}${r.brief}`)),
    h("div", { class: "hint" }, `${r.seconds}s · ${r.width}×${r.height} · ${r.transparent ? "transparente" : "opaco"} · ${new Date(r.createdAt).toLocaleString()}`),
    r.status === "done" && r.url ? h("video", { src: r.url, muted: true, loop: true, autoplay: true, playsinline: true }) : null,
    r.notes ? h("div", { class: "notes" }, r.notes) : null,
    r.status === "error" && r.error ? h("div", { class: "errmsg" }, r.error) : null,
    r.status === "done" && r.url ? h("div", { class: "acts" },
      h("button", { class: "primary", onclick: (e) => importMotion(r, !r.transparent, e.currentTarget) }, r.transparent ? "⧉ Superponer en el cursor" : "＋ Añadir como clip"),
      r.transparent ? h("button", { onclick: (e) => importMotion(r, true, e.currentTarget) }, "＋ Como clip") : null) : null,
  )));
}
async function importMotion(r, asClip, btn) {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = "Descargando…";
  try {
    const res = await fetch(r.url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const id = uid("a");
    const name = r.name || `motion-${r.id}.webm`;
    await loadAsset(id, name, blob);
    await idb("readwrite", (s) => s.put({ id, name, blob })).catch(() => {});
    renderAssets();
    if (asClip) { pushUndo(); project.clips.push(sanitizeClip({ id: uid("c"), asset: id, in: 0, out: assets.get(id).duration })); commit(); }
    else addOverlay(id, t);
    toast("✓ Motion graphic añadido al proyecto.", true);
  } catch { toast("No se pudo descargar el motion graphic. Vuelve a intentarlo."); }
  btn.disabled = false; btn.textContent = label;
}
async function sendMotion() {
  const brief = $("motionBrief").value.trim();
  if (!brief) return toast("Describe el motion graphic que quieres.");
  if (!mdb) return toast("La conexión con Claude Code no está disponible en esta vista.");
  const btn = $("btnMotionSend");
  btn.disabled = true;
  const id = "m" + Date.now().toString(36);
  const req = {
    brief, kind: motionKind, seconds: +$("motionSeconds").value, transparent: $("motionBg").value === "transparent",
    brand: $("motionBrand").value.trim(), width: project.width, height: project.height, fps: 30, aspect: project.aspect,
    status: "pending", createdAt: Date.now(), playhead: round(t), projectDuration: round(dur),
  };
  const text = `🎬 Motion graphic ${id} (${req.kind})\n${brief}\n${req.seconds}s · ${req.width}×${req.height} · ${req.transparent ? "fondo transparente" : "fondo opaco"}${req.brand ? "\nMarca: " + req.brand : ""}`.slice(0, 3900);
  // Avisar enseguida (tiene que ser justo después del clic) y guardar a la vez
  let notify = Promise.resolve(false);
  if (mcomments && canClaude === "available") {
    notify = mcomments.anchorFor($("motionForm")).then((anchor) => mcomments.sendToClaude({ anchor, text })).then(() => true, () => false);
  }
  try {
    await mdb.collection("motion").doc(id).set(req);
    const sent = await notify;
    await mdb.doc(`motion/${id}`).update({ notified: sent }).catch(() => {});
    $("motionBrief").value = "";
    motionStatus(sent ? "✓ Enviado. Claude Code lo está preparando; aparecerá abajo cuando esté listo (suele tardar unos minutos)."
      : "Guardado, pero no se pudo avisar a Claude Code. Escríbele en su chat: «revisa las peticiones de motion del editor».", !sent);
  } catch { toast("No se pudo guardar la petición. Vuelve a intentarlo."); }
  btn.disabled = false;
}
$("btnMotionSend").onclick = sendMotion;
renderKinds();
renderMotionList();
(async () => {
  try { mdb = await window.claude?.use("db"); } catch { mdb = null; }
  try { mcomments = await window.claude?.use("comments"); } catch { mcomments = null; }
  if (mdb) {
    mdb.collection("motion").orderBy("createdAt", "desc").limit(30).onSnapshot((snap) => {
      motionReqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      for (const r of motionReqs) {
        const prev = motionSeen.get(r.id);
        if (prev && prev !== "done" && r.status === "done") toast(`✓ Tu motion graphic está listo (${r.kind || "Motion"}). Ábrelo en la pestaña Motion.`, true);
        motionSeen.set(r.id, r.status);
      }
      renderMotionList();
    }, () => motionStatus("Se perdió la conexión con las peticiones. Recarga la página.", true));
  }
  checkClaude();
})();

