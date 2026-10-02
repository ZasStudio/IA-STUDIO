# ZAS Reel — talking head con B-roll (Remotion)

Reel vertical 1080×1920, 30 fps, 25 s, inspirado en el formato "talking head + subtítulos palabra a palabra + B-roll":

- **A-roll**: clip real de stock (Freepik/Magnific) con lip-sync (Veed Sync 2.0) a una voz en off en español (ElevenLabs).
- **Cámara**: punch-ins en cada cambio de frase, push-in lento, sacudida en el impacto ("HUMO"), whip-pan con motion blur en las entradas de B-roll, Ken Burns, inclinación 3D de la tarjeta de cristal.
- **Subtítulos**: grupos de 1–3 palabras sincronizados con faster-whisper; segunda línea en negrita para la palabra clave; "HUMO" en rojo con contorno.
- **Títulos "Fase N"** en script rojo (Lobster) + subtítulo script blanco.
- **B-roll de stock**: superposición en la mitad inferior con borde difuminado, cortes a pantalla completa, tarjeta glassmorphism flotante.
- **Sonido**: música (ElevenLabs Music) con ducking bajo la voz y SFX (whoosh, pop, impacto, buzzer, obturador, riser, ding).
- **Outro**: logo con glitch RGB, barra de búsqueda que se escribe sola y botón "SÍGUENOS".

## Uso

```bash
npm install
cp assets.example.json assets.json   # rellena las URLs de los medios
npm run assets                       # descarga y normaliza todo en public/
npm run studio                       # previsualizar
npm run render                       # out/zas-reel.mp4
```

Los tiempos de subtítulos, títulos, zooms y SFX están en `src/timeline.ts`; la composición en `src/Reel.tsx`.
