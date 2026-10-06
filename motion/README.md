# IA Studio · Motion (Remotion)

Recreaciones de estilos de edición y motion graphics a partir de videos de referencia:
tipografía cinética, desenfoques, rebotes, cristal, degradados y mapa de degradado, todo con
[Remotion](https://www.remotion.dev) (React → video).

Incluye **dos estilos** aprendidos de dos videos de referencia:

1. **Spark** (`SparkPromo`): verde profundo y lima, glow, cristal, rebotes, cintas y mapa de degradado.
2. **Prompt** (`PromptPromo` + `PromptReel`): promo SaaS minimalista tipo Apple (azul ultramar →
   pastel, Inter, letras desenfocadas, barra de prompt de cristal, mosaico de píxeles, lista-rueda,
   abanico 3D de webs, logo-flor). `PromptReel` es la versión vertical 9:16 "grabada con el móvil"
   en un monitor con After Effects, luz cálida y cámara en mano.

## Uso

```bash
cd motion
npm install
npm run studio                 # editor visual en http://localhost:3000
npm run render                 # → out/spark-promo.mp4 (1920×1080, ~41 s)
npm run render:prompt          # → out/prompt-promo.mp4 (1920×1080, ~58 s)
npm run render:reel            # → out/prompt-reel-vertical.mp4 (1080×1920)
```

Si Remotion no puede descargar su Chromium, usa uno ya instalado:
`REMOTION_BROWSER=/ruta/a/chrome-headless-shell npm run render`.

### Tus propias fotos
Pon las imágenes en `motion/public/` y pásalas como props:

```bash
npx remotion render SparkPromo out/promo.mp4 --props='{"photo":"photos/escritorio.jpg","photo2":"photos/retrato.jpg"}'
```

Sin fotos se usa una escena de marcador generada por código.

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `src/theme.ts` | Paleta (verde profundo → teal → menta → lima → crema), curvas de easing y presets de muelles |
| `src/lib/motion.ts` | Trayectorias por keyframes, squash & stretch por velocidad, helpers de spring/tween |
| `components/GradientBackground.tsx` | Fondo "mesh gradient": manchas y anillos enormes difuminados que derivan con ruido + grano + viñeta |
| `components/Sparkle.tsx` | La chispa (flor de 8 pétalos con glow) y la bola luminosa, con estiramiento por velocidad y aplastamiento al impactar |
| `components/KineticText.tsx` | Texto cinético: `smear` (morph de peso + estiramiento + blur), `blurUp`, `pop` (letras que rebotan), `scramble`, `type` (cursor de bloque) |
| `components/Glass.tsx` | Tarjeta de cristal (backdrop-filter, borde degradado brillante, entrada "materializada") y toggle "Spark" |
| `components/Effects.tsx` | **Mapa de degradado** (filtro SVG), anillos orbitales, cintas/tubos que se dibujan, texto con eco, filas de texto en paralaje |
| `components/Decorations.tsx` | Caja de selección tipo Figma, barrido de resaltado, cursor, destellos, retícula de puntos |
| `components/Transitions.tsx` | Transiciones propias: zoom con desenfoque, revelado circular, barrido de luz |
| `scenes/*` | Las 8 escenas; cada una también existe como composición suelta en la carpeta "Escenas" del Studio |

### Estilo "Prompt" (`src/prompt/`)

| Archivo | Qué hace |
| --- | --- |
| `prompt/theme.ts` | Paleta azul ultramar / pastel y degradado de texto en dos tonos |
| `prompt/components/Basics.tsx` | Cielos en degradado fundibles, `BlurLetters` (letras que entran desenfocadas una a una), `TypeLine` (tecleo con cursor I-beam), cursor de mano, barra de prompt de cristal, botón con resplandor que respira, máscara de **mosaico de píxeles** |
| `prompt/components/Visuals.tsx` | Paisajes procedurales con paralaje y perspectiva atmosférica, logo-flor 3D que florece, maquetas de webs (y miniaturas), botella |
| `prompt/transitions.tsx` | Transiciones: disolución con desenfoque y mosaico de píxeles |
| `prompt/scenes/*` | 12 escenas: tecleo → barra de prompt, dashboard con contadores, montaje de webs, ventana de tren que la cámara atraviesa, "It's live", letras que caen, lista-rueda, "Faster…", abanico 3D con motion blur, logo y "Now it starts with a prompt" |
| `prompt/MonitorReel.tsx` | Reel vertical: monitor en perspectiva con interfaz de After Effects (timeline con playhead real), escritorio, teclado desenfocado, cámara en mano con ruido, etalonaje cálido y grano |

## Técnicas clave

- **Desenfoque**: `filter: blur()` animado en entradas/salidas y transiciones; `backdrop-filter` en el cristal.
  No pongas `filter` en un ancestro de un elemento con `backdrop-filter`, porque lo anula.
- **Rebotes**: `spring()` de Remotion. Relación de amortiguación ζ = damping / (2·√(stiffness·mass)):
  `smooth` ζ≈1 (sin rebote), `snappy` ζ≈0.8, `bouncy` ζ≈0.5, `pop` ζ≈0.35.
- **Squash & stretch**: se calcula la velocidad entre el frame actual y el anterior; el objeto se
  estira en la dirección del movimiento y se aplasta en la perpendicular (conserva volumen).
  A gran velocidad la chispa se funde en una píldora (motion smear).
- **Mapa de degradado**: luminancia (Rec.709) → `feComponentTransfer` con tablas por canal → mezcla
  con el original (`amount`). Paletas en `GRADIENT_MAPS`.
- **Motion blur**: `@remotion/motion-blur` (`CameraMotionBlur`) en las fichas de "Clear actions".
- **Morph texto → interfaz**: el texto gigante se escala/desenfoca hacia el centro mientras la barra
  de prompt se "materializa" (escala + desenfoque inverso) en el mismo punto.
- **Lista-rueda**: una posición continua `pos` avanza a saltos con ease-in-out; cada fila calcula su
  distancia al foco para escala, opacidad, desenfoque y la máscara que revela su miniatura.
- **Cámara en mano**: dos capas de ruido (deriva lenta + micro-temblor) en traslación, rotación y zoom.
- **Curvas**: ease-out fuerte `cubic-bezier(0.23, 1, 0.32, 1)` para entradas, ease-in-out
  `cubic-bezier(0.77, 0, 0.175, 1)` para movimientos en pantalla; ease-in solo en salidas.
