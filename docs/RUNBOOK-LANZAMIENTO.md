# Runbook de lanzamiento — CREAR PC

Guía corta para desplegar ELITEPC a producción con confianza y poder revertir rápido si algo sale mal.

## 1. Pre-flight (día antes)

Antes del día del launch, confirmar en orden:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pasan en local.
- [ ] Playwright E2E pasa: `pnpm test:e2e`.
- [ ] CI del commit actual verde en GitHub Actions.
- [ ] `pnpm prices:check` sin errores (archivos `data/prices/*.json` válidos).
- [ ] `.env.local` sincronizado con Vercel: `vercel env pull .env.local` y diffear.
- [ ] Token Vercel personal revocado (ningún `vck_...` histórico activo).
- [ ] Supabase: backup manual del proyecto (Dashboard → Database → Backups).
- [ ] Dominio `crearpc.bo` apunta a Vercel (A record + CNAME).
- [ ] `NEXT_PUBLIC_SITE_URL` en producción = `https://crearpc.bo`.
- [ ] `LEGAL_RESPONSIBLE`, `LEGAL_NIT`, `LEGAL_ADDRESS`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP` cargados en Vercel (production). Si falta `LEGAL_NIT`, las proformas seguirán como "borrador" (no comerciales).
- [ ] Precios y tiendas reales cargados (via `/admin` o `pnpm db:import-prices`). Catálogo no muestra "Por cotizar" para los componentes principales.
- [ ] **Observabilidad** (opcional, recomendado): `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` configurados en Vercel. Sin esto, los errores en prod solo quedan en `vercel logs`.
- [ ] **Email transaccional** (opcional): `RESEND_API_KEY` + `RESEND_FROM_EMAIL` configurados si querés enviar la proforma por mail. Sin esto, el flujo degrada a descarga manual del PDF.

## 2. Deploy

```powershell
# Desde main, verificado
vercel deploy --prod
```

Esperar a que Vercel reporte URL de producción. Capturar el `deployment ID` (sale en el output).

## 3. Smoke test post-deploy

```powershell
pnpm smoke --base=https://crearpc.bo
```

Debe reportar `13/13 OK`. Si algo falla:

- `/api/health` 503 → revisar `DATABASE_URL` y pooler de Supabase.
- `/sitemap.xml` sin componentes → `listCatalogForUi` falló. Revisar logs de Vercel.
- Páginas con `Neon` en el body → regresión de CSP o docs legacy. Fallar lanzamiento.

## 4. Validación manual (10 min)

Navegar en producción desde una ventana incógnita (no estás logueado como admin):

1. Home carga, hero visible, marcas se ven en claro y oscuro.
2. `/catalog` lista los componentes con precios reales.
3. Entrar a una ficha `/catalog/cpu/<slug>` → ver detalle + benchmarks si hay.
4. `/build` → agregar componentes → ver total actualizado → "Preparar borrador local" descarga PDF.
5. PDF descargado: una página Carta, totales correctos, disclaimer "no es factura, no habilita crédito fiscal".
6. `/politicas/garantia` abre, menciona garantía ELITEPC 3/12 meses.
7. `/contacto` muestra WhatsApp y email reales (no placeholders).

## 5. Rollback

Si algo revienta y no se puede fixear en ≤10 min:

```powershell
# Listar deployments recientes
vercel ls crear-pc --prod

# Promover el deployment anterior a producción
vercel promote <deployment-url-anterior>
```

**Importante**:

- Rollback NO revierte migraciones de DB. Si la migración actual rompe cosas, hay que escribir migración inversa manual.
- Antes de rollback, capturar logs: `vercel logs <deployment-id>` para post-mortem.

## 6. Post-launch (primeras 24h)

- Monitorear logs cada 1–2h: `vercel logs --follow`.
- Watch `/api/health` externo (UptimeRobot u otro).
- Revisar que el cron de `refresh-prices` corra: Vercel → Project → Settings → Crons.
- Si llega la primera proforma: validar que el flujo de email/WhatsApp al cliente funciona (hoy el cliente descarga el PDF, no se envía automático).

## 7. Pendientes conscientes al momento del launch

Documentar explícitamente qué cosas se saben que faltan al lanzar:

- `LEGAL_NIT` → emisión pendiente. Las proformas se marcan como "borrador" hasta que esté.
- Email transaccional (Resend) → no instalado. Cliente descarga PDF manualmente.
- Clerk auth → Fase 2. Hoy los builds se guardan por cookie anónima (`ownerTokenHash`).
- Marcas Diamond y PUSKILL → logos pendientes de fuente verificable.
- Catálogo → solo las 8 piezas MVP + lo que haya cargado el admin manualmente.
