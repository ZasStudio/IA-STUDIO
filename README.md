# IA Studio

Plataforma web para generar imágenes con la API de Google (Gemini "Nano Banana" e Imagen).
Sin dependencias: solo Node 18+.

## Uso

1. Crea una API key en <https://aistudio.google.com/api-keys>.
2. Arranca:
   ```bash
   npm start
   ```
3. Abre <http://localhost:3000> y pega la clave en **Ajustes** (se guarda solo en tu navegador),
   o define `GEMINI_API_KEY` en un archivo `.env` (ver `.env.example`).

## Funciones

- Modelos Gemini (`gemini-2.5-flash-image`) e Imagen 4; botón para listar los modelos disponibles en tu cuenta.
- Proporción, 1–4 imágenes por generación, imágenes de referencia (Gemini).
- Galería persistente en el navegador (IndexedDB), descarga y reutilización de prompts.

La clave nunca se expone a terceros: el navegador la envía a tu propio servidor, que llama a Google.
No publiques este servidor en internet con tu clave en `.env` sin añadir autenticación.

## Motion (Remotion)

En [`motion/`](motion/README.md) hay un proyecto de [Remotion](https://www.remotion.dev) con motion graphics
estilo "Spark": tipografía cinética, desenfoques, rebotes, cristal, degradados y mapa de degradado.

```bash
cd motion && npm install && npm run studio
```
