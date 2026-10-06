# IA Studio

Plataforma web con dos herramientas:

- **Imágenes**: genera imágenes con la API de Google (Gemini "Nano Banana" e Imagen).
- **Editor de video con Claude**: pídele a Claude cambios en tu video (textos, animaciones, cortes, efectos)
  y revisa cada propuesta en un panel antes de aplicarla.

Requiere Node 18+.

## Uso

```bash
npm install
npm start
```

Abre <http://localhost:3000>.

- Imágenes: crea una API key en <https://aistudio.google.com/api-keys> y pégala en **Ajustes**
  (o define `GEMINI_API_KEY` en `.env`).
- Video: abre <http://localhost:3000/video.html>, pega tu API key de Anthropic en **Ajustes**
  (o define `ANTHROPIC_API_KEY` en `.env`). Ver `.env.example`.

## Editor de video

1. **Importa** uno o varios videos (arrastrar y soltar). Se guardan en tu navegador (IndexedDB).
2. **Pide la edición** en el chat: "añade un título animado", "subtítulos estilo TikTok", "look cinematográfico"…
   Claude recibe la línea de tiempo (JSON) y fotogramas de muestra del video, y devuelve cambios estructurados.
   Claude no oye el audio: para subtítulos pega la transcripción en *Notas*.
3. **Revisa** en el panel *Propuestas*: cada cambio muestra qué hace, por qué, sus tiempos, animaciones y un
   diff (antes → después). La vista previa ya muestra las propuestas marcadas (bloques ✦ rayados en la línea de tiempo);
   pulsa **▶ Ver** para reproducir solo ese tramo, desmarca lo que no quieras y pulsa **Aplicar**.
4. **Ajusta a mano** en *Elementos*: texto, posición, fuente, colores, contorno, animación de entrada/salida,
   tiempos de clips, velocidad, volumen, fundidos y efectos. Los textos se pueden arrastrar en el lienzo y
   los bloques en la línea de tiempo.
5. **Exporta** (MP4 o WebM según el navegador; Chrome/Edge recomendados). La exportación se graba en tiempo real.

Atajos: espacio (reproducir), ←/→ (fotograma, con Shift 1 s), S (cortar), Supr (eliminar), Ctrl+Z / Ctrl+Shift+Z.

Animaciones de texto: fundido, subir/bajar, deslizar, pop, zoom, rebote, desenfoque y máquina de escribir.
Efectos: zoom in/out, temblor, flash, viñeta, blanco y negro, sepia, cálido, frío, vívido, desenfoque y bandas de cine.

Por defecto usa `claude-opus-5-5` (se puede cambiar a Sonnet 5.5 o Fable 5.1 en Ajustes), con structured outputs
para que los cambios siempre lleguen en un formato válido y con *fallback* automático del servidor si el modelo
rechaza una petición.

## Seguridad

Las claves nunca se exponen a terceros: el navegador las envía a tu propio servidor, que llama a Google o Anthropic.
No publiques este servidor en internet con tus claves en `.env` sin añadir autenticación.
