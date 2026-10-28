# DESIGN BRIEF — CREAR PC

> **Destinatario primario:** OpenAI Codex (y cualquier IA/diseñador que trabaje la capa visual).
> **Entregable:** sistema visual único, premium, boliviano, inspirado en **Apple + ROG Strix**. **NO** gaming genérico. **NO** UI de IA clásica.

---

## 1. Dirección de arte en una línea

> "Workstation de alta gama fotografiada para un keynote de Apple, pero con la precisión técnica de un chasis ROG Strix abierto."

---

## 2. Palabras clave emocionales

**SÍ:** preciso, nítido, silencioso, confiado, técnico, lujoso, honesto, local.
**NO:** ruidoso, infantil, RGB, hype-crypto, startup-saas, IA-sparkle, aesthetic-y2k.

---

## 3. Paleta de color (definitiva)

### Modo claro (default)
| Rol | Token | HEX |
|---|---|---|
| Fondo principal | `--bg` | `#FFFFFF` |
| Fondo elevado | `--bg-elevated` | `#F7F8FA` |
| Borde sutil | `--border` | `#EEF1F5` |
| Texto principal | `--fg` | `#050F24` |
| Texto secundario | `--fg-muted` | `#4A5A75` |
| Primario (botones, links) | `--primary` | `#13284A` |
| Primario hover | `--primary-hover` | `#1E3A6C` |
| Focus ring | `--ring` | `#4A74BF` |
| Compatible | `--ok` | `#1F7A5A` |
| Advertencia | `--warn` | `#B07D1A` |
| Incompatible | `--error` | `#A42A2A` |

### Modo oscuro
| Rol | Token | HEX |
|---|---|---|
| Fondo principal | `--bg` | `#050F24` |
| Fondo elevado | `--bg-elevated` | `#0A1428` |
| Borde sutil | `--border` | `#13284A` |
| Texto principal | `--fg` | `#F7F8FA` |
| Texto secundario | `--fg-muted` | `#88A6D4` |
| Primario | `--primary` | `#BFD4F0` |
| Primario hover | `--primary-hover` | `#FFFFFF` |

**Regla:** los acentos NO son más del **5% de la superficie visible**. El resto es blanco, navy y neutros. Nunca RGB saturado.

---

## 4. Tipografía

- **Display (hero, títulos grandes):** `Inter Tight` o `Satoshi Variable`. Tracking: `-0.02em`.
- **UI (body, botones, labels):** `Inter` v4 variable. Tamaño base: 15px.
- **Mono (especificaciones técnicas, códigos de proforma):** `JetBrains Mono` o `Berkeley Mono`.

**Escala tipográfica:**
```
display-2xl  72/80  600
display-xl   56/64  600
display-lg   40/48  600
display-md   32/40  600
title-lg     24/32  600
title-md     20/28  600
body-lg      17/26  400
body         15/24  400
label        13/20  500
caption      12/18  500 (uppercase, tracking +0.08em)
mono         14/22  400
```

---

## 5. Spacing & layout

- **Grid:** 12 columnas, gutter 24px, max-width `1280px`.
- **Container padding:** 24px mobile, 40px tablet, 64px desktop.
- **Scale (8px base):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- **Radio de esquinas:** 2px (chips), 8px (inputs/botones), 12px (cards), 20px (modales/hero).
- **Sombras:** usar **con pudor**. Preferimos `border` + `background elevated`.
  - `shadow-sm`: `0 1px 2px rgba(5, 15, 36, 0.04)`
  - `shadow-md`: `0 4px 20px rgba(5, 15, 36, 0.08)`
  - `shadow-lg`: `0 20px 60px rgba(5, 15, 36, 0.12)` (solo modales / hero elements)

---

## 6. Componentes clave y comportamiento

### 6.1 `<ComponentCard />`
```
┌───────────────────────────────┐
│    [imagen fondo blanco]      │  ← imagen tipo product shot Apple
│                               │
│  AMD Ryzen 7 7800X3D          │  ← title-md
│  CPU · Socket AM5             │  ← caption uppercase
│                               │
│  ┌──┐ ┌──┐ ┌──┐              │  ← spec pills (mono)
│  │8c│ │16t│ │105W│             │
│  └──┘ └──┘ └──┘              │
│                               │
│  Bs. 3.800 ─ Bs. 4.200        │  ← rango en 3 tiendas (body-lg)
│  Disponible en 3 tiendas      │  ← fg-muted
│                               │
│  [ Añadir al build  → ]       │  ← primary button
└───────────────────────────────┘
```
- Hover: lift sutil 2px + glow navy `box-shadow: 0 0 0 1px var(--primary)`.
- Click imagen: zoom modal estilo Apple.

### 6.2 Configurador — Layout "Mesa de trabajo"

```
┌─────────┬──────────────────────────────────┬────────────────┐
│ CATEG.  │                                  │  RESUMEN       │
│         │                                  │                │
│ ○ CPU   │        [Preview del build]       │  Build nuevo   │
│ ● Mobo  │        (isométrico, exploded,    │  Propósito     │
│ ○ RAM   │         o case transparente)     │  Gaming 1440p  │
│ ○ GPU   │                                  │                │
│ ○ PSU   │                                  │  Consumo       │
│ ○ Case  │                                  │  540W / 750W   │
│ ○ Cool  │                                  │  ████████░░    │
│ ○ Disk  │                                  │                │
│         │                                  │  Compatibilidad│
│         │                                  │  ✓ Todo OK     │
│         │                                  │                │
│         │                                  │  TOTAL         │
│         │                                  │  Bs. 15.230    │
│         │                                  │                │
│         │                                  │  [Proforma PDF]│
└─────────┴──────────────────────────────────┴────────────────┘
```

- Transiciones al cambiar de categoría: slide suave 320ms `cubic-bezier(.2,.8,.2,1)`.
- El preview central puede ser Three.js, SVG parallax, o render pre-generado por case.

### 6.3 Hero landing

- Headline a dos tiempos: "Armá tu PC." / "Con precios de Bolivia."
- Debajo: un `<Canvas>` sutil con un case abierto en wire-frame + rotación lenta al mover el mouse (no spinning auto, respetar `prefers-reduced-motion`).
- CTA primario: `Comenzar build` (navy).
- CTA secundario: `Ya tengo mis componentes` (ghost).
- Social proof real (no fake): "Hecho en Santa Cruz · 100% boliviano".

### 6.4 Botones

- **Primary:** fondo `--primary`, texto blanco, radio 8px, padding 12/20.
- **Secondary / ghost:** border `--border` + texto `--fg`, hover `--bg-elevated`.
- **Destructive:** solo para quitar componentes del build. Rojo `--error` sutilizado.
- **Icon button:** 36×36, radio 8px.

### 6.5 Inputs y pills

- Inputs sin sombra interna. Border 1px, radio 8px, altura 40px.
- Focus: outline 2px `--ring` offset 2px.
- Pills de specs: fondo `--bg-elevated`, texto mono 12px, padding 4/8, radio 2px.

---

## 7. Iconografía

- **NO** usar Lucide tal cual. Si se usa, se **override** stroke a 1.5px y se personalizan al menos 8 iconos clave (CPU, GPU, Mobo, RAM, PSU, Case, Cooler, Storage).
- Set alternativo recomendado: Phosphor Icons (Duotone off, Regular 1.5), o custom SVG set.
- NO emojis en UI.

---

## 8. Imágenes de componentes

- Fondo **BLANCO PURO** `#FFFFFF`.
- Sombra sutil debajo (ambient occlusion): `drop-shadow(0 10px 20px rgba(5,15,36,0.1))`.
- Formato: WebP + fallback JPG. 2x retina.
- Nombres: `<slug>-<marca>-<modelo>.webp` → ej. `cpu-amd-ryzen-7-7800x3d.webp`.

---

## 9. Micro-interacciones

Librería: **Motion One** (más liviano que Framer Motion para muchos elementos).

- **Enter animation:** fade + translateY(8px → 0), 400ms, `easeOutExpo`. Stagger 60ms entre items.
- **Hover card:** scale 1.0 → 1.015, 200ms.
- **Add component:** flash navy 300ms sobre el summary panel.
- **Compat ok:** check-mark drawn (stroke-dashoffset), 500ms.
- **Compat error:** shake horizontal 2px, 200ms, con color flash rojo suave.
- **Respeto absoluto** por `prefers-reduced-motion: reduce` → desactivar todo lo no esencial.

---

## 10. Responsive

- **mobile (<640):** configurador se convierte en WIZARD paso a paso. Un componente por pantalla, swipe horizontal.
- **tablet (640–1024):** 2 columnas (categorías + preview). Resumen baja como sticky footer.
- **desktop (>1024):** 3 columnas full.

---

## 11. Modo oscuro

- NO es trivial. El azul marino DEBE profundizarse, los acentos blancos deben respirar.
- Imágenes de componentes mantienen fondo blanco (contraste intencional estilo Apple).
- Toggle en el header, respeta `prefers-color-scheme` por defecto.

---

## 12. Logo y wordmark

**Direcciones propuestas (Codex debe explorar al menos 3):**

1. **Wordmark tipográfico:** `CREAR PC` en Inter Tight 700, con el "PC" en navy y "CREAR" en gris elevado. Minimal.
2. **Monograma:** `C.PC` dentro de un cuadrado 2px border, radio 2px (como logo de Mac Pro).
3. **Marca icónica:** forma geométrica que sugiera un case abierto en isométrico, sin texto (icon-only).

Entregar en SVG, PNG 1x/2x/3x, y versión monocromo.

---

## 13. Favicons, OG, PWA

- Favicons: 16, 32, 48, 180 (apple-touch), SVG dinámico.
- OG image default: hero del sitio en 1200×630.
- OG dinámico para proformas: `/api/og/proforma/[id]` con el nombre del cliente y total.
- `manifest.json` listo para instalar como PWA.

---

## 14. Prohibiciones explícitas (recordatorio final)

- ❌ Gradientes "AI purple/pink".
- ❌ Glassmorphism exagerado.
- ❌ Dark mode con cyan neón.
- ❌ Cards flotantes "Stripe-style" sin personalidad.
- ❌ Hero con partículas "AI particle network".
- ❌ Emojis en UI.
- ❌ Lucide sin personalizar.
- ❌ Botón CTA naranja/verde fluor estilo growth-hacking.
- ❌ Palabras de marketing-IA: "Powered by AI", "Smart", "Magic".

---

## 15. Referencias visuales que SÍ queremos

- apple.com/mac-pro — fotografía de producto, layout limpio.
- rog.asus.com — tipografía densa, specs pills, oscuridad con precisión.
- linear.app — densidad de información sin ruido.
- vercel.com — monocromo honesto.
- figma.com/community/file/... (plantillas Apple-like).
- framer.com — microanimaciones no infantiles.

---

## 16. Checklist de aprobación visual

Antes de dar por cerrado el diseño, verificar:

- [ ] En modo claro y oscuro, el contraste texto/fondo cumple WCAG AA (ratio ≥ 4.5:1).
- [ ] El sitio funciona a 320px de ancho sin romperse.
- [ ] Todas las imágenes tienen alt descriptivo en español.
- [ ] `prefers-reduced-motion` desactiva animaciones no esenciales.
- [ ] El hero carga por debajo de LCP 2.5s en 4G simulado.
- [ ] Zero layout shift (CLS < 0.1).
- [ ] El wordmark es legible a 20px.
- [ ] Todos los componentes tienen estado: default / hover / focus / active / disabled / loading.

---

## 17. CDX-01 — Dirección de arte acordada / CDX-02 — Tokens

**Precedencia:** la instrucción de esta entrega exige paleta estricta blanco +
azul marino. Los neutros fríos y tonalidades navy de §3 se conservan; los
semánticos verde, ámbar y rojo de §3, §6.4 y §9 quedan sustituidos por roles
monocromos en esta entrega. Compatible, revisión e incompatible se distinguen
por símbolo y etiqueta, nunca únicamente por color. Sin RGB, vidrio, morado,
gradientes ni partículas.

### Moodboard: «Potencia con criterio»
- **Encuadre:** estudio de producto blanco, chasis abierto original en dibujo
  técnico navy. La escala del objeto y el espacio vacío aportan presencia.
- **Material:** superficies opacas, líneas de 1–1.5 px y paneles sin sombras
  flotantes. El SVG es un estudio conceptual, no fotografía de un producto real.
- **Composición:** lectura editorial de izquierda a derecha; título corto y
  objeto dominante, seguido por tres muestras de color, letra y ritmo.
- **Precisión:** especificaciones en mono, cifras tabulares al integrar precios,
  alineación por filas y etiquetas breves en español boliviano.
- **Identidad local:** Santa Cruz y Bolivia en el pie de marca, sin métricas,
  stock, reseñas ni precios ficticios.
- **Referencias conceptuales del brief:** Apple aporta espacio y foco en el
  producto; ROG aporta estructura mecánica y densidad técnica. No se copian
  logotipos, imágenes ni interfaces, ni se presentan referencias como capturas.

### Sistema cerrado
Inter Tight 600 para títulos, Inter 400–600 para UI y JetBrains Mono 400 para
fichas. Tracking display -0.02em, caption +0.08em. Escala completa en tokens.css.
Grid de 12 columnas, máximo 1280 px, gutter 24 px. Padding 24 / 40 / 64 px;
radios 2 / 8 / 12 / 20 px. Sombras solo como recurso excepcional; blur de
superficie 0. Claro blanco, oscuro navy profundo, producto siempre sobre blanco.

El primario oscuro usa texto navy sobre hielo, no blanco sobre hielo.
Bordes decorativos y bordes de controles tienen roles separados.
Acentos de foco e hielo limitados al 5% visual; el navy de identidad no es acento.
Movimiento 200 / 320 / 400 ms; reduced-motion lleva los tiempos a cero.
Mobile apila el moodboard; el wizard del configurador sigue siendo CDX-11.

### Artefactos de revisión
components/design/ArtDirectionBoard.tsx y ArtDirectionBoard.stories.tsx.
Estilos en app/styles/art-direction.css y sistema en app/styles/tokens.css.
Integración y límites de verificación en docs/CDX-01-02-HANDOFF.md.