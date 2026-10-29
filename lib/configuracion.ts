import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";

export async function configValue<T>(key: string, parser: z.ZodType<T>, fallback: T): Promise<T> {
  const entry = await prisma.configuracion.findUnique({ where: { clave: key } });
  const parsed = parser.safeParse(entry?.valor);
  return parsed.success ? parsed.data : fallback;
}
const rateSchema = z.object({
  valor: z.coerce.number().positive().max(1000),
  fecha: z.string().nullable(),
  fuente: z.string(),
  verificado: z.boolean().default(true),
});
export type ExchangeRate = z.infer<typeof rateSchema> & { aviso: boolean };
export async function getExchangeRate(): Promise<ExchangeRate> {
  const fallback = {
    valor: 6.96,
    fecha: null,
    fuente: "Configuración inicial; verificar",
    verificado: false,
  };
  const previous = await configValue("tipoCambio", rateSchema, fallback);
  const stale =
    !previous.fecha || Date.now() - new Date(previous.fecha).getTime() >= 30 * 60 * 1000;
  const endpoint = process.env.TIPO_CAMBIO_URL;
  if (endpoint && stale) {
    try {
      const url = new URL(endpoint);
      if (url.protocol !== "https:") throw new Error("HTTPS requerido");
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("Tracker no disponible");
      // DECISION: el tracker debe devolver {valor,fecha,fuente}; no se toma una tasa sin fecha ni fuente.
      const next = rateSchema
        .extend({ fecha: z.iso.datetime(), fuente: z.string().min(1) })
        .parse(await response.json());
      if (new Date(next.fecha).getTime() > Date.now() + 60000) throw new Error("Fecha futura");
      await prisma.configuracion.upsert({
        where: { clave: "tipoCambio" },
        create: { clave: "tipoCambio", valor: next },
        update: { valor: next },
      });
      return { ...next, aviso: !next.verificado };
    } catch {
      return { ...previous, aviso: true };
    }
  }
  return { ...previous, aviso: !previous.verificado || (Boolean(endpoint) && stale) };
}
