# IA Studio · Motion (Remotion)

Recreación del estilo de edición del video de referencia ("Everything starts with a Spark"):
tipografía cinética, desenfoques, rebotes, cristal, degradados y mapa de degradado, todo con
[Remotion](https://www.remotion.dev) (React → video).

## Uso

```bash
cd motion
npm install
npm run studio          # editor visual en http://localhost:3000
npm run render          # → out/spark-promo.mp4 (1920×1080, 30 fps, ~41 s)
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
- **Curvas**: ease-out fuerte `cubic-bezier(0.23, 1, 0.32, 1)` para entradas, ease-in-out
  `cubic-bezier(0.77, 0, 0.175, 1)` para movimientos en pantalla; ease-in solo en salidas.
