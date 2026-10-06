# IA Studio

- `server.js` + `public/` — app local (imágenes con Google, editor de video con Claude vía API).
- `artifact/build.py` — genera la versión publicada del editor (artifact de claude.ai) a partir de `public/video.*`
  más `artifact/motion.*`. Uso: `python3 artifact/build.py <salida.html>`.
  Artifact publicado: https://claude.ai/artifact/MGA5oak4Q8etMX6KyaiUJb
  Capacidades: `sample`, `downloads`, `db`, `comments`, `assets`.
- `motion/` — proyecto Remotion para motion graphics.

## Peticiones de motion graphics desde el editor

El editor publicado guarda cada petición en su base de datos (colección `motion`, documento `motion/<id>`)
y avisa con un comentario "Enviar a Claude" que empieza por `🎬 Motion graphic <id>`.
Campos: `brief`, `kind`, `seconds`, `width`, `height`, `fps`, `transparent`, `brand`, `status`.

Al recibir una (o si el usuario pide "revisa las peticiones de motion"):

1. Leer: `ArtifactData` get/list `motion` en el artifact. Atender las que tengan `status: "pending"`.
2. Marcar `status: "working"` (`ArtifactData` update).
3. Diseñar la animación con las skills de animación (`anthropic-skills:animate`, `apple-design`,
   `emil-design-eng`, `gsap-*` para ideas de coreografía) y escribir la composición en
   `motion/src/comps/<Nombre>.tsx`; registrarla en `motion/src/comps/index.ts`.
   Usar `motion/src/lib/motion.ts` (ease-out fuerte, sin ease-in en entradas, nunca scale(0), escalonados 30–80 ms,
   muelles con poco rebote) y `motion/src/lib/fonts.ts` (fuentes locales; Google Fonts no carga en el render).
   Diseñar en px para lado corto = 1080 con `unit(width, height)`.
4. Renderizar: `cd motion && npm install && npx tsc -p . && node render.mjs <Nombre> out/<id>.webm --width W --height H --fps 30 --seconds S`
   (añadir `--opaque` y salida `.mp4` si `transparent` es false). Revisar 2–3 fotogramas con ffmpeg
   (componer sobre un color para ver la transparencia).
5. Subir: `Artifact` publish con `url` del artifact, `file_path` del render y `asset: true` → `{id, url}`.
6. Actualizar `motion/<id>`: `status: "done"`, `url`, `assetId`, `name`, `notes` (qué se hizo, en español, breve), `comp`.
   Si falla: `status: "error"`, `error` con el motivo en español.
7. Responder en el hilo del comentario (`ArtifactComments`) y hacer commit de la composición.
