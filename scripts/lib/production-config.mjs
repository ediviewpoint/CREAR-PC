import { z } from "zod";

const placeholder =
  /__password__|xxxxxxxx|generar-un-string|local-admin-review-only|fixture|example\.(?:test|com)|@crearpc\.bo|00000000/i;
const present = (value) => Boolean(value?.trim() && !placeholder.test(value));

// Returns names and status only. Never include environment values in reports.
export function inspectProductionConfig(env) {
  const checks = [];
  const add = (name, ok, action) => checks.push({ name, status: ok ? "ok" : "pending", action });
  let database;
  try {
    database = new URL(env.DATABASE_URL);
  } catch {
    /* Report a missing/invalid URL below. */
  }
  const localDatabase = Boolean(
    database && /^(localhost|127\.|\[?::1\]?)/i.test(database.hostname),
  );
  add(
    "DATABASE_URL",
    Boolean(
      database &&
      ["postgres:", "postgresql:"].includes(database.protocol) &&
      present(env.DATABASE_URL) &&
      !localDatabase,
    ),
    "Configurar la conexión PostgreSQL persistente del alojamiento.",
  );
  add(
    "ADMIN_PASSWORD",
    present(env.ADMIN_PASSWORD) && env.ADMIN_PASSWORD.length >= 16,
    "Configurar una contraseña propia de al menos 16 caracteres.",
  );
  let site;
  try {
    site = new URL(env.NEXT_PUBLIC_SITE_URL);
  } catch {
    /* Invalid URL is pending. */
  }
  add(
    "NEXT_PUBLIC_SITE_URL",
    Boolean(
      site &&
      site.protocol === "https:" &&
      !/^(localhost|127\.|\[?::1\]?)/i.test(site.hostname) &&
      !site.username &&
      !site.password &&
      site.pathname === "/" &&
      !site.search &&
      !site.hash &&
      present(env.NEXT_PUBLIC_SITE_URL),
    ),
    "Configurar el origen HTTPS del sitio publicado, sin rutas ni credenciales.",
  );
  for (const name of ["LEGAL_RESPONSIBLE", "LEGAL_NIT", "LEGAL_ADDRESS", "LEGAL_CITY"])
    add(name, present(env[name]), "Completar y verificar este dato real del negocio.");
  add(
    "NEXT_PUBLIC_CONTACT_EMAIL",
    present(env.NEXT_PUBLIC_CONTACT_EMAIL) &&
      z.email().safeParse(env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()).success,
    "Configurar el correo real de contacto.",
  );
  add(
    "NEXT_PUBLIC_SUPPORT_WHATSAPP",
    present(env.NEXT_PUBLIC_SUPPORT_WHATSAPP) &&
      /^\+?[\d\s\-()]{6,20}$/.test(env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() ?? ""),
    "Configurar el número real de soporte.",
  );
  add(
    "CRON_SECRET",
    present(env.CRON_SECRET) && env.CRON_SECRET.length >= 32,
    "Configurar un secreto aleatorio propio de al menos 32 caracteres para las tareas programadas.",
  );
  return {
    scope:
      "Configuración cargada en este proceso; no verifica el alojamiento remoto ni la identidad comercial.",
    configurationReady: checks.every((item) => item.status === "ok"),
    databaseTarget: !database ? "missing-or-invalid" : localDatabase ? "local" : "remote",
    checks,
    manualChecks: [
      "Verificar migraciones en la base de destino.",
      "Cargar productos, tiendas y ofertas reales vigentes.",
      "Confirmar copias de seguridad y probar una restauración aislada.",
      "Probar acceso, fotos y emisión de PDF en el dominio publicado.",
    ],
  };
}
