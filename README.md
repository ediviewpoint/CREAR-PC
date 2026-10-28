# CREAR PC — Configurador Boliviano de PCs a Medida

Antes de operar con datos reales: [diagnóstico, datos pendientes y preparación de producción](docs/PREPARAR-PRODUCCION.md). Ejecutá `npm run production:check` y `npm run db:check` para revisar configuración y esquema sin mostrar credenciales ni modificar la base.

Para operar el catálogo desde la web: [guía de productos, fotos, precios y cotizaciones](docs/ADMINISTRAR-PRODUCTOS.md). El panel permite crear borradores, editar fichas, subir fotos y publicar o desactivar productos sin modificar el código.

> **Sitio web para armar una PC desde cero** combinando los componentes que YA TIENES (case, GPU, placa, RAM, CPU, discos, coolers) o eligiéndolos del catálogo. Pensado y operado desde **Santa Cruz de la Sierra, Bolivia**. Precios en **Bolivianos (Bs.)**, garantías, proformas y privacidad adaptadas al marco local.
>
> **Estética objetivo:** NO gaming genérico ni UI de IA clásica. Referencias visuales: **Apple (macOS/Mac Pro)** + **ASUS ROG Strix**. Paleta base: **blanco** y **azul marino**.

---

## Tabla de contenidos

1. [Visión y promesa única](#1-visión-y-promesa-única)
2. [Público objetivo (Bolivia / Santa Cruz)](#2-público-objetivo-bolivia--santa-cruz)
3. [Nombre y marca](#3-nombre-y-marca)
4. [Stack técnico recomendado](#4-stack-técnico-recomendado)
5. [Arquitectura general](#5-arquitectura-general)
6. [Flujos de usuario](#6-flujos-de-usuario)
7. [MEGA PLAN DE TRABAJO (por IA)](#7-mega-plan-de-trabajo-por-ia)
   - 7.1 [Tareas para CODEX (Diseño / UI / UX / Frontend visual)](#71-codex--diseño--ui--ux--frontend-visual)
   - 7.2 [Tareas para GEMINI (Datos / Compatibilidades / Precios BO)](#72-gemini--datos--compatibilidades--precios-bo)
   - 7.3 [Tareas para CLAUDE (Arquitectura / Lógica / Legal / Deploy)](#73-claude--arquitectura--lógica--legal--deploy)
8. [Políticas obligatorias](#8-políticas-obligatorias)
9. [Formato de PROFORMA](#9-formato-de-proforma)
10. [Garantías por componente](#10-garantías-por-componente)
11. [Hoja de ruta por fases](#11-hoja-de-ruta-por-fases)
12. [Setup local (paso a paso ultra didáctico)](#12-setup-local-paso-a-paso-ultra-didáctico)
13. [Convenciones de código y flujo Git](#13-convenciones-de-código-y-flujo-git)
14. [Glosario de componentes de PC](#14-glosario-de-componentes-de-pc)

---

## 1. Visión y promesa única

**Problema:** En Bolivia, armar una PC implica abrir 10 pestañas de tiendas, pedir precios por WhatsApp, dudar de compatibilidades y recibir proformas en Word mal formateadas.

**Promesa de CREAR PC:**

- Catálogo real con **precios en Bs.** y stock de tiendas de **Santa Cruz** (ampliable a La Paz, Cochabamba).
- **Validador de compatibilidad** instantáneo (socket, chipset, RAM DDR4/DDR5, formato ATX/mATX/ITX, longitud GPU vs case, altura cooler vs case, wattios PSU vs consumo real).
- **Modo "ya tengo esto"**: el usuario carga los componentes que posee y el sitio recomienda qué le falta y qué sería **cuello de botella**.
- **Proforma profesional en PDF** descargable, con numeración, validez, condiciones de garantía y datos de contacto.
- **Diseño premium** inspirado en Apple y ROG Strix — ni Frutiger Aero, ni "neón-RGB-gamer", ni card-stack genérico de IA.

**Lo que NO somos:**
- No somos un e-commerce transaccional (al menos en Fase 1 — no procesamos pagos).
- No somos un foro ni un review site.
- No competimos con Newegg / PCPartPicker en catálogo global; competimos en **mercado boliviano real**.

---

## 2. Público objetivo (Bolivia / Santa Cruz)

| Segmento | Perfil | Lo que busca |
|---|---|---|
| **Gamer intermedio** | 18–30 años, trabaja o estudia, quiere actualizar su PC | Compatibilidad, mejor rendimiento por Bs. |
| **Profesional creativo** | Edición de video, diseño 3D, arquitectura | Workstation estable, mucha RAM, GPU seria |
| **Tiendista revendedor** | Dueño de tienda pequeña en Santa Cruz | Herramienta rápida para armar proformas a clientes |
| **Estudiante universitario** | UPSA, UAGRM, NUR, Udabol | PC económica para programación o diseño |
| **Oficinista / Pyme** | PCs para oficina, puntos de venta | Builds confiables, con garantía documentada |

**Zonas prioritarias de delivery/retiro:** Santa Cruz (anillos 1–8, Equipetrol, Plan 3000, Doble Vía La Guardia), Warnes, Montero.

---

## 3. Nombre y marca

**Nombre de trabajo del proyecto:** `CREAR PC` (así lo pidió el usuario).

**Opciones de nombre comercial para el sitio** (Codex puede proponer más — ver sección 7.1):

- `CREAR PC` (literal, directo, SEO fuerte en Bolivia).
- `CruzBuild`
- `Forge.bo`
- `ArmaTuPC Bolivia`
- `BuildBo`
- `TallerPC`

**Dominio sugerido:** `crearpc.bo` o `crearpc.com.bo`.

---

## 4. Stack técnico recomendado

> Esta sección es una **sugerencia fundamentada**. El usuario puede pedir cambios. Está pensada para despliegue cero-fricción en Vercel.

- **Framework:** Next.js 16 (App Router) + React 19 + Server Components.
- **Lenguaje:** TypeScript estricto.
- **Estilos:** Tailwind CSS v4 + variables CSS para la paleta (ver `docs/DESIGN-BRIEF.md`).
- **Componentes UI:** `shadcn/ui` como base — pero **personalizados agresivamente** para no verse "shadcn genérico" (Codex se encarga).
- **Base de datos:** Supabase Postgres (via Vercel Marketplace) — RLS activo, driver `postgres-js`. Ideal para catálogo + proformas guardadas.
- **ORM:** Drizzle ORM (type-safe, liviano).
- **Autenticación (Fase 2):** Clerk (vía Vercel Marketplace) — para que el usuario pueda guardar sus builds.
- **PDF de proformas:** `@react-pdf/renderer` server-side.
- **Almacenamiento de imágenes de componentes:** Vercel Blob (público).
- **Hosting:** Vercel con Fluid Compute (Node.js 24).
- **Configuración del proyecto:** `vercel.ts` (nuevo recomendado, TypeScript).
- **Analítica:** Vercel Analytics + Speed Insights.
- **Monedas:** Bolivianos (BOB, `Bs.`) con dos decimales. Mostrar equivalencia USD opcional (tasa oficial BCB).

---

## 5. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario (Browser)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│      Next.js App Router (Vercel · Fluid Compute · Node 24)  │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Marketing    │  │  Configurador   │  │   Proforma    │  │
│  │  (landing)    │  │  (/build)       │  │   (PDF server)│  │
│  └───────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
          ┌───────────┐ ┌───────────┐ ┌───────────────┐
          │ Supabase  │ │  Vercel   │ │   Runtime     │
          │ Postgres  │ │   Blob    │ │   Cache       │
          │ (catálogo │ │ (imágenes │ │  (precios /   │
          │  + builds)│ │  componen)│ │   compat.)    │
          └───────────┘ └───────────┘ └───────────────┘
```

Rutas principales (App Router):

- `/` — Landing con hero, propuesta de valor y CTA.
- `/build` — Configurador paso a paso.
- `/build/[id]` — Build guardada compartible.
- `/catalog` — Catálogo completo filtrable.
- `/catalog/[category]/[slug]` — Ficha de componente.
- `/proforma/[id]` — Vista previa de proforma + descarga PDF.
- `/politicas/garantia` — `/politicas/privacidad` — `/politicas/terminos`.
- `/contacto`.
- `api/compatibility` — Validación compat server-side.
- `api/proforma/[id]/pdf` — Streaming PDF.

---

## 6. Flujos de usuario

### 6.1 Flujo "Armar desde cero"
1. Usuario entra a `/build`.
2. Elige **propósito**: Gaming / Workstation / Oficina / Streaming / Edición / IA-ML.
3. Elige **presupuesto** en Bs. (slider 3.000–50.000 Bs.).
4. El sistema sugiere un **build base**; el usuario ajusta componente por componente.
5. Validaciones en tiempo real: compatibilidad, consumo, longitud GPU, altura cooler.
6. Guarda / comparte / descarga proforma PDF.

### 6.2 Flujo "Ya tengo estos componentes"
1. Usuario entra a `/build?mode=existing`.
2. Añade sus componentes actuales (busca por marca/modelo).
3. El sistema detecta huecos y cuellos de botella.
4. Sugiere qué comprar para completar o mejorar.
5. Genera proforma solo con lo que **falta** comprar.

### 6.3 Flujo "Tiendista arma proforma al cliente"
1. Login (Fase 2).
2. Crea proforma a nombre del cliente (CI / NIT opcional).
3. Define margen de ganancia por componente (invisible al cliente final).
4. Exporta PDF con logo/datos de SU tienda.

---

## 7. MEGA PLAN DE TRABAJO (por IA)

> **Importante:** Cada IA tiene fortalezas distintas. **Codex** (OpenAI) brilla en UI/UX visual y animaciones. **Gemini** (Google) tiene búsqueda web nativa fuerte — perfecto para recolectar datos reales de componentes y precios bolivianos. **Claude** (yo) prioriza arquitectura sólida, lógica de negocio, legal y despliegue.
>
> Trabajen en el orden sugerido en la sección 11 (Hoja de ruta por fases).

---

### 7.1 CODEX — Diseño / UI / UX / Frontend visual

**Objetivo global:** Entregar un sistema visual único, premium, inspirado en Apple + ROG Strix, SIN emular dashboards de IA ni cards genéricas de SaaS.

**Entregables:**

- [ ] **CDX-01 — Moodboard y dirección de arte** (archivo: `docs/DESIGN-BRIEF.md`). Define paleta exacta (ver abajo), tipografía, grid, radio de esquinas, principios de layout.
- [ ] **CDX-02 — Sistema de design tokens** en `app/styles/tokens.css` (CSS vars para color, spacing, typography, shadow, blur).
- [ ] **CDX-03 — Landing page `/`** con hero cinematográfico. Idea: representación 3D sutil de un case abierto (puede ser Three.js `<Canvas>` o un SVG parallax). NO carrusel aburrido.
- [ ] **CDX-04 — Configurador `/build`** — layout tipo "mesa de trabajo":
  - Panel izquierdo: lista de categorías (CPU, Mobo, RAM, GPU, Storage, PSU, Case, Cooling).
  - Panel central: visualización del build (puede ser isométrica, exploded view, o preview de case transparente).
  - Panel derecho: resumen, consumo, compatibilidad, total en Bs.
  - Transiciones suaves al cambiar de categoría.
- [ ] **CDX-05 — Componente `<ComponentCard />`** radicalmente distinto a shadcn genérico: usa micro-interacciones, glow sutil azul marino al hover, imagen con fondo blanco neutro estilo Apple product shots.
- [ ] **CDX-06 — Modo oscuro premium** — NO solo "invertir colores". Oscuro = navy profundo (`#0A1428`) + acentos blancos luminosos. Claro = blanco puro (`#FFFFFF`) + navy (`#13284A`) para texto y bordes.
- [ ] **CDX-07 — Página de componente `/catalog/[cat]/[slug]`** con galería tipo Apple (zoom suave, specs en pills, benchmarks animados).
- [ ] **CDX-08 — Vista de proforma `/proforma/[id]`** — Diseñar la UI web Y el layout del PDF (ambos deben verse igual de serios).
- [ ] **CDX-09 — Iconografía** — Pack de iconos personalizados para cada categoría de componente. SVGs line-style, trazo 1.5px, nada de emojis.
- [ ] **CDX-10 — Microanimaciones** con Framer Motion / Motion One: enter animations suaves (`easeOutExpo`), hovers, scroll reveals. NUNCA animaciones estilo "AI loading sparkle".
- [ ] **CDX-11 — Responsive mobile-first** — El configurador en mobile debe ser **wizard** (un paso por pantalla), no una copia miniatura del desktop.
- [ ] **CDX-12 — Logo y wordmark** — Proponer 3 variantes. El elegido va en `public/brand/`.
- [ ] **CDX-13 — Favicons / OG images** completos (incluir OG dinámico de proformas vía `@vercel/og`).

**Paleta base (obligatoria, Codex puede refinar tonalidades):**

```css
:root {
  /* Blancos (neutros fríos tirando a hueso) */
  --white-0:  #FFFFFF;   /* fondo principal claro */
  --white-50: #F7F8FA;   /* fondo secundario */
  --white-100:#EEF1F5;   /* bordes suaves */

  /* Azul marino (identidad) */
  --navy-900: #050F24;   /* texto principal / fondo oscuro */
  --navy-800: #0A1428;
  --navy-700: #13284A;   /* botones primarios */
  --navy-600: #1E3A6C;
  --navy-500: #2C5091;
  --navy-400: #4A74BF;   /* highlights, focus rings */
  --navy-300: #88A6D4;   /* texto secundario */

  /* Acentos (uso restringido, no gaming RGB) */
  --accent-ice:  #BFD4F0;   /* icy highlight */
  --accent-steel:#8798AE;   /* metal brushed feel */

  /* Semánticos */
  --ok:    #1F7A5A;  /* compatible */
  --warn:  #B07D1A;  /* cuello de botella */
  --error: #A42A2A;  /* incompatible */
}
```

**Tipografía propuesta** (Codex puede justificar cambios):
- Display: **Söhne**, **Neue Haas Grotesk**, o — si no hay licencia — **Inter Tight** / **Satoshi**.
- UI: **Inter** v4 variable.
- Mono (specs técnicas): **JetBrains Mono** o **Berkeley Mono**.

**Lo que NO queremos (lista de prohibiciones estéticas):**
- Nada de gradientes rosados / morados "AI".
- Nada de glassmorphism exagerado.
- Nada de dark mode con acentos cyan/magenta tipo cyberpunk.
- Nada de "stripe-like" cards flotantes genéricas.
- Nada de iconos de Lucide usados tal cual sin personalización.
- Nada de hero con "AI particle animation".

---

### 7.2 GEMINI — Datos / Compatibilidades / Precios BO

**Objetivo global:** Alimentar el sitio con datos reales, actualizados y verificados — especialmente precios bolivianos y reglas de compatibilidad. Gemini es el ideal para esto por su búsqueda web nativa y manejo de grandes volúmenes de datos tabulares.

**Entregables:**

- [ ] **GEM-01 — Esquema de datos** (`docs/DATA-SCHEMA.md`) — Tablas: `components`, `component_specs`, `compatibility_rules`, `prices`, `stores`, `benchmarks`, `builds`, `proformas`. Incluir diagrama ER.
- [ ] **GEM-02 — Dataset inicial de CPUs** (~200 modelos actuales Intel + AMD) con specs: socket, TDP, cores, threads, clock base/boost, cache, iGPU, PCIe gen, release year. Formato JSON o CSV listo para `seed`.
- [ ] **GEM-03 — Dataset inicial de GPUs** (~150 modelos NVIDIA + AMD + Intel Arc): VRAM, TDP, longitud en mm, power connectors (8-pin, 12VHPWR), PCIe gen, FP32 TFLOPS.
- [ ] **GEM-04 — Dataset de placas madre** (~250 modelos) — socket, chipset, formato (ATX / mATX / ITX / E-ATX), slots RAM, max RAM, DDR4/DDR5, VRM, slots PCIe, M.2 slots, Wi-Fi integrado.
- [ ] **GEM-05 — Dataset de RAM** — DDR4 y DDR5, capacidades 8/16/32/64, frecuencias, latencia CL, voltaje, altura (para compat. con coolers).
- [ ] **GEM-06 — Dataset de cases** — Formato soportado (ATX/mATX/ITX), longitud máx GPU, altura máx cooler CPU, bahías 2.5/3.5, radiadores soportados, PSU máx longitud.
- [ ] **GEM-07 — Dataset de PSUs** — Potencia, eficiencia (80+ White/Bronze/Gold/Platinum/Titanium), modular/semi/no, formato (ATX / SFX / SFX-L), conectores.
- [ ] **GEM-08 — Dataset de almacenamiento** — HDDs, SATA SSDs, NVMe M.2 (gen 3/4/5), capacidad, lectura/escritura, DRAM/DRAM-less.
- [ ] **GEM-09 — Dataset de coolers** — Air coolers (altura mm), AIOs (120/240/280/360mm radiador), TDP soportado.
- [ ] **GEM-10 — Reglas de compatibilidad** — Matriz formal (ver `docs/COMPATIBILITY-RULES.md`):
  - CPU.socket === Mobo.socket
  - RAM.type === Mobo.ramType (DDR4/DDR5)
  - GPU.length_mm ≤ Case.max_gpu_length_mm
  - CPUCooler.height_mm ≤ Case.max_cooler_height_mm
  - Σ(TDP + headroom 30%) ≤ PSU.wattage
  - Mobo.formFactor compatible con Case.supportedFormFactors
  - PSU.formFactor compatible con Case.supportedPSUFormFactors
  - RAM frequency ≤ Mobo max supported frequency
  - Advertencias (no bloqueantes): cuello de botella CPU↔GPU, PSU 80+ bajo para gamas altas.
- [ ] **GEM-11 — Precios bolivianos** — Investigar y documentar precios promedio en Bs. de componentes populares en Santa Cruz. **Tiendas de referencia a verificar** (confirmar vigencia antes de citar): Compumundo, PCWorld Bolivia, Multicenter, Compushop, Tiendas en Mercado Mutualista, Mall Ventura. Rango mínimo-máximo + tienda + fecha de consulta. Incluir disclaimer de que son referenciales.
- [ ] **GEM-12 — Script de scraping / recolección** (ético, con `robots.txt` respetado) — Si las tiendas tienen catálogo online público, generar un notebook/script para actualizar precios semanalmente. Si no, template de **entrada manual** por tiendista.
- [ ] **GEM-13 — Benchmarks de referencia** — Para cada CPU y GPU, scores de Cinebench R23, Geekbench 6, 3DMark Time Spy, Blender BMW. Dataset en JSON.
- [ ] **GEM-14 — Recomendador por propósito** — Función que recibe `{ propósito, presupuesto }` y retorna build base óptimo. Puede ser puro algoritmo o pequeño modelo entrenado — Gemini decide.
- [ ] **GEM-15 — Cálculo de consumo total** — Fórmula: `Σ(TDP componentes) × 1.3` + motor que avisa cuando el PSU no cubre.
- [ ] **GEM-16 — Detector de cuello de botella** — Regla simple basada en relación TFLOPS GPU vs single-core score CPU y resolución objetivo (1080p/1440p/4K).
- [ ] **GEM-17 — Normalización de unidades** — Un único JSON de catálogo donde todo está en SI (mm, W, GHz, Bs., MB/s). Nada de "6400 MT/s" en un lado y "6.4 GT/s" en otro.
- [ ] **GEM-18 — Fuentes y citas** — Cada precio y cada spec importante debe llevar `source_url` y `fetched_at` en el dataset. Trazabilidad total.

**Formato de entrega:** Carpeta `data/seed/` con JSON validables por Zod (schemas provistos por Claude).

---

### 7.3 CLAUDE — Arquitectura / Lógica / Legal / Deploy

**Objetivo global:** Que el proyecto arranque, se despliegue, cumpla la ley boliviana, y tenga lógica de negocio robusta. Esta es MI responsabilidad.

**Entregables:**

- [ ] **CLD-01 — Scaffold Next.js 16 + TS + Tailwind v4 + shadcn/ui** — Inicializar el proyecto con `pnpm create next-app` + configuraciones base. (En la primera sesión de código.)
- [ ] **CLD-02 — Configurar `vercel.ts`** — Config TypeScript del proyecto, con rewrites para `/politicas/*`, headers de seguridad (CSP, X-Frame-Options), cron para refresco de precios.
- [ ] **CLD-03 — Esquema Drizzle ORM** basado en `docs/DATA-SCHEMA.md` — Migraciones versionadas.
- [ ] **CLD-04 — Schemas Zod** para validación de todas las entidades (components, builds, proformas) — compartidos entre frontend y API.
- [ ] **CLD-05 — Motor de compatibilidad `lib/compat/`** — Implementa en TypeScript las reglas de GEM-10. API: `evaluateBuild(build): CompatReport`.
- [ ] **CLD-06 — Server Actions** del configurador: `addComponent`, `removeComponent`, `saveBuild`, `shareBuild`, `generateProforma`.
- [ ] **CLD-07 — Generador de PROFORMAS PDF** server-side con `@react-pdf/renderer`:
  - Numeración correlativa (`PRO-2026-00001`).
  - QR con link a la proforma online.
  - Datos del cliente (nombre, CI/NIT, teléfono).
  - Validez (7 días por defecto).
  - Términos legibles abajo.
  - Cumplimiento normativa factura / proforma boliviana (NO es factura — es cotización no fiscal).
- [ ] **CLD-08 — Políticas legales** en `docs/POLICIES/`:
  - `garantia.md` — Garantía por categoría, exclusiones, procedimiento de reclamo (ver §10).
  - `privacidad.md` — Alineado con la **Ley 164 (TIC)** y **Decreto Supremo 1793** de Bolivia (protección de datos). Hoy no hay LGPD-equivalente boliviana completa; redactar conservador alineado también a GDPR por si en el futuro.
  - `terminos.md` — Términos de uso del sitio.
  - `proforma-condiciones.md` — Validez, moneda, no incluye montaje si no se contrata, cambios de precio por tipo de cambio.
  - `cookies.md`.
- [ ] **CLD-09 — Rate limiting** en endpoints públicos (proforma PDF, compat check) usando Vercel Runtime Cache + token bucket.
- [ ] **CLD-10 — Autenticación (Fase 2)** — Clerk vía Vercel Marketplace, roles: `guest`, `user`, `shop_owner`, `admin`.
- [ ] **CLD-11 — Dashboard admin** `/admin` — Alta de componentes, actualización masiva de precios, estadísticas de builds más populares.
- [ ] **CLD-12 — Testing** — Vitest para `lib/compat/`, Playwright para flujos críticos (armar build + descargar proforma).
- [ ] **CLD-13 — Deploy en Vercel** — Linkear proyecto, env vars (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `CLERK_*`), domain custom `crearpc.bo`.
- [ ] **CLD-14 — Observabilidad** — Vercel Analytics + Speed Insights + logs estructurados. Alertas en Vercel Agent (beta).
- [ ] **CLD-15 — Seguridad** — Headers (CSP estricto), sanitización de inputs del tiendista, protección XSS/CSRF, Vercel BotID activo en endpoints de PDF.
- [ ] **CLD-16 — SEO / i18n** — Metadata rich, `sitemap.ts`, `robots.ts`. `es-BO` como locale primario, con posibilidad futura de `es-419`.
- [ ] **CLD-17 — CI** — GitHub Actions: lint + typecheck + test en PRs, deploy preview automático en Vercel.

---

## 8. Políticas obligatorias

> Detalle completo en `docs/POLICIES/*`. Resumen aquí.

### 8.1 Privacidad (resumen)
- Recolectamos lo mínimo: nombre, email, teléfono (si el usuario pide proforma).
- NUNCA tarjetas (no procesamos pagos en Fase 1).
- Cookies: solo analytics esenciales + preferencias.
- Derecho ARCO (Acceso, Rectificación, Cancelación, Oposición) — formulario de contacto obligatorio.
- Base legal: consentimiento explícito + interés legítimo (operar el servicio).
- Marco boliviano: Ley 164 (TIC) + DS 1793. Alineación voluntaria con buenas prácticas GDPR.
- Retención: datos de proforma 2 años; datos de cuenta hasta cierre + 90 días.

### 8.2 Garantía (resumen)
Toda proforma generada aquí NO constituye garantía propia — la garantía la otorga la tienda/vendedor que efectivamente venda el componente. CREAR PC es intermediario informativo. Ver tabla §10.

### 8.3 Proforma — condiciones comerciales
- Precios en Bolivianos (Bs.) salvo indicación contraria.
- Validez: **7 días calendario** desde emisión (configurable por tiendista).
- Precios sujetos a disponibilidad de stock.
- Variación por tipo de cambio del dólar (BCB) puede ajustar precios.
- La proforma NO es factura (no habilita crédito fiscal).
- Montaje y entrega: NO incluidos salvo que se indique explícitamente.

### 8.4 Términos y condiciones
- Uso personal y comercial (tiendistas) permitido.
- Prohibido scraping masivo del catálogo público.
- Las imágenes de los componentes son propiedad de sus respectivos fabricantes.

---

## 9. Formato de PROFORMA

Campos obligatorios del PDF:

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO CREAR PC]            PROFORMA · PRO-2026-00001       │
│                             Emitida: 27/10/2026             │
│                             Válida hasta: 03/11/2026        │
│                                                             │
│  CLIENTE                    EMISOR                          │
│  Nombre: Juan Pérez         Tienda XYZ (si tiendista)       │
│  CI/NIT: 1234567            NIT: 123456789                  │
│  Teléfono: +591 7xxxxxxx    Santa Cruz, Bolivia             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ #  Categoría  Marca · Modelo        Cant.    Bs.    │    │
│  │ 1  CPU        AMD Ryzen 7 7800X3D     1   3.800,00  │    │
│  │ 2  Mobo       ASUS ROG B650E-F        1   2.450,00  │    │
│  │ ...                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                                  Subtotal:  Bs. 15.230,00   │
│                                  Descuento: Bs.    230,00   │
│                                  TOTAL:     Bs. 15.000,00   │
│                                                             │
│  CONDICIONES                                                │
│  · Precios en Bolivianos. · Validez 7 días. · No es factura │
│  · Garantía según fabricante (ver política completa).       │
│                                                             │
│  [QR → link web]                     www.crearpc.bo         │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Garantías por componente

Garantía **mínima recomendada** a declarar en la proforma (siempre prevalece la del fabricante):

| Componente | Garantía mínima | Notas |
|---|---|---|
| CPU (Intel/AMD) | **3 años** | Fabricante. Usuario debe conservar empaque. |
| GPU | **2–3 años** | Depende del AIB (ASUS, MSI, Gigabyte, PNY, etc.). |
| Placa madre | **2 años** | Hasta 3 en ROG, Taichi, Aorus Master. |
| RAM | **De por vida** (lifetime) | Crucial, G.Skill, Kingston Fury, Corsair. |
| SSD NVMe | **3–5 años** | Depende TBW escrito. |
| HDD | **2 años** | WD, Seagate consumer. |
| PSU | **5–10 años** | Según gama. Seasonic/Corsair RM 10 años. |
| Case | **1–2 años** | Defectos de fabricación. |
| Cooler aire | **2 años** | Noctua: 6 años. |
| AIO líquido | **3–5 años** | Según fabricante. |
| Monitor | **3 años** | Dead pixels según política fabricante. |

**Exclusiones universales:** daño físico, sobre-voltaje, overclock que exceda specs, retirar sello, humedad, insectos (relevante en clima cruceño).

**Procedimiento de reclamo (template):**
1. Contactar al vendedor/tienda emisora con proforma + boleta/factura.
2. Diagnóstico técnico en 72 h hábiles.
3. Reemplazo, reparación o nota de crédito según política de tienda.

---

## 11. Hoja de ruta por fases

### Fase 0 — Fundación (semana 1)
- `CLD-01`, `CLD-02`, `CDX-01`, `CDX-02`, `GEM-01`, `GEM-17`.

### Fase 1 — MVP visible (semanas 2–4)
- Landing (`CDX-03`), configurador básico (`CDX-04`), seed inicial (`GEM-02`→`GEM-09`), motor compat (`CLD-05`), proforma PDF simple (`CLD-07`).

### Fase 2 — Datos ricos + polish (semanas 5–7)
- Precios bolivianos reales (`GEM-11`, `GEM-12`), benchmarks (`GEM-13`), recomendador (`GEM-14`), diseño refinado (`CDX-05`→`CDX-10`), políticas (`CLD-08`), QA (`CLD-12`).

### Fase 3 — Público (semanas 8–9)
- Deploy prod (`CLD-13`), SEO (`CLD-16`), observabilidad (`CLD-14`), seguridad (`CLD-15`), responsive mobile (`CDX-11`).

### Fase 4 — Tiendistas (semanas 10–12)
- Auth (`CLD-10`), admin (`CLD-11`), proforma con branding de tienda, dashboard de ventas.

---

## 12. Setup local (paso a paso ultra didáctico)

> **Primera vez usando Node?** Instala primero: Node.js 24 LTS → https://nodejs.org · pnpm → `npm i -g pnpm` · Vercel CLI → `npm i -g vercel` · Git → https://git-scm.com

### 12.1 Clonar e instalar (una vez)

```powershell
# 1. Entrar al directorio del proyecto
cd "C:\Users\ACER\CREAR PC"

# 2. Instalar dependencias (cuando Claude cree el scaffold)
pnpm install

# 3. Copiar variables de entorno
Copy-Item .env.example .env.local
# → luego editar .env.local con tus credenciales

# 4. Correr migraciones de la base de datos
pnpm db:migrate

# 5. Sembrar el catálogo inicial
pnpm db:seed
```

### 12.2 Desarrollo diario

```powershell
# Arrancar dev server (http://localhost:3000)
pnpm dev

# En otra terminal — observar errores de tipos
pnpm typecheck --watch

# Correr tests
pnpm test
```

### 12.3 Antes de hacer un push

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build          # debe pasar sin errores
```

### 12.4 Deploy a Vercel (Claude lo hace la primera vez)

```powershell
vercel login
vercel link
vercel env pull .env.local
vercel --prod
```

---

## 13. Convenciones de código y flujo Git

- **Branches:** `main` (producción), `dev` (integración), `feat/<nombre>`, `fix/<nombre>`, `chore/<nombre>`.
- **Commits:** Conventional Commits en español — `feat: añade validador de socket CPU`, `fix: corrige cálculo de wattios`, `docs: actualiza README`.
- **PRs:** título descriptivo, descripción con contexto + screenshots si es UI.
- **Linting:** ESLint + Prettier. Config en `package.json`.
- **Tipado:** TypeScript strict. Nada de `any`. Si de verdad hace falta: `unknown` + narrow.
- **Imports:** absolutos con `@/`.
- **Nombres:** inglés en código, español en UI/copy.

---

## 14. Glosario de componentes de PC

Para que CUALQUIER usuario entienda qué está armando:

- **CPU (Procesador):** El "cerebro". Lo pensás, lo calcula. Ej.: *AMD Ryzen 7 7800X3D*.
- **GPU (Tarjeta de video):** Dibuja gráficos (juegos, 3D, edición). Ej.: *NVIDIA RTX 4070*.
- **Placa madre / Motherboard:** La "tabla" donde se conectan todos los componentes. Define el socket del CPU, el tipo de RAM, cuántos M.2, Wi-Fi, etc.
- **RAM (Memoria):** Memoria temporal de corto plazo. Más = más apps abiertas sin lag.
- **Almacenamiento:**
  - **NVMe M.2:** El más rápido, formato "chicle", va directo en la placa.
  - **SSD SATA:** Rápido, formato 2.5", cable SATA.
  - **HDD:** Mecánico, lento, barato por TB, para archivar.
- **PSU (Fuente de poder):** La que da electricidad a todo. Si falla, puede quemar lo demás. **Nunca escatimar aquí**.
- **Case / Chasis:** La caja. Debe caber tu placa, GPU, cooler y PSU.
- **Cooling:**
  - **Air cooler:** Disipador con ventilador. Confiable, silencioso en gamas altas.
  - **AIO líquido:** Radiador con bomba sellada. Mejor para CPUs de alto TDP.
- **TDP (Thermal Design Power):** Watts que disipa un componente — guía para elegir cooler y PSU.
- **Socket:** El "zócalo" del CPU (ej.: AM5, LGA1700). Debe matchear con la placa madre.
- **Chipset:** El "chip de apoyo" de la placa (B650, X670E, B760, Z790). Define features.
- **Proforma:** Documento con detalle y precio de lo que te quieren vender, antes de pagar.
- **Factura:** Documento tributario boliviano (fiscal). Habilita crédito fiscal.
- **NIT:** Número de Identificación Tributaria (Bolivia). Equivalente a RUC/CUIT.
- **CI:** Cédula de Identidad.

---

## Créditos y licencia

- **Idea y product owner:** Elías Balcázar Martínez (Santa Cruz, Bolivia).
- **Diseño UI/UX:** OpenAI Codex.
- **Datos y compatibilidades:** Google Gemini.
- **Arquitectura, lógica, legal y deploy:** Anthropic Claude.
- **Licencia:** MIT (por definir — ver `LICENSE`).

> _"Armar una PC debería ser emocionante, no estresante. Y en Bolivia, debería ser transparente."_
