import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./api-errors";
import { getProduct } from "./productos/guardar";
import type { UserRole } from "./auth-permissions";
export type QuoteItem = {
  productoId: string;
  cantidad: number;
  producto: Awaited<ReturnType<typeof getProduct>>;
};
type Actor = { id: string; rol: UserRole };
export const QuoteAction = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("agregar"),
    ids: z.array(z.string().min(1).max(100)).min(1).max(200),
  }),
  z.object({
    accion: z.literal("cantidad"),
    productoId: z.string().min(1).max(100),
    cantidad: z.number().int().min(0).max(9999),
  }),
  z.object({ accion: z.literal("emitir"), cliente: z.string().trim().max(200) }),
  z.object({ accion: z.literal("nueva") }),
]);
export async function quoteAction(input: unknown, actor: Actor) {
  const data = QuoteAction.parse(input);
  const products =
    data.accion === "agregar"
      ? await Promise.all([...new Set(data.ids)].map((id) => getProduct(id, "VENDEDOR")))
      : [];
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`quote:${actor.id}`}))::text`;
    let quote = await tx.cotizacion.findFirst({
      where: { usuarioId: actor.id, estado: "abierta" },
      orderBy: { createdAt: "desc" },
    });
    if (!quote)
      quote = await tx.cotizacion.create({
        data: { usuarioId: actor.id, snapshot: { items: [] } },
      });
    let items = (quote.snapshot as { items?: QuoteItem[] })?.items || [];
    if (data.accion === "agregar")
      for (const product of products) {
        if (product.tipo !== "CARRITO")
          throw new ApiError(
            "VALIDACION",
            "Solo los productos de carrito se agregan a cotización",
            422,
          );
        const exists = items.find((v) => v.productoId === product.id);
        if (exists) exists.cantidad = Math.min(9999, exists.cantidad + 1);
        else {
          const frozen = JSON.parse(JSON.stringify(product));
          const now = Date.now();
          if (
            !frozen.precioOferta ||
            (frozen.ofertaDesde && Date.parse(frozen.ofertaDesde) > now) ||
            (frozen.ofertaHasta && Date.parse(frozen.ofertaHasta) < now)
          )
            frozen.precioOferta = null;
          frozen.ofertaDesde = null;
          frozen.ofertaHasta = null;
          items.push({ productoId: product.id, cantidad: 1, producto: frozen });
        }
      }
    if (items.length > 200)
      throw new ApiError("VALIDACION", "Máximo 200 productos por cotización", 422);
    if (data.accion === "cantidad")
      items = items
        .map((v) => (v.productoId === data.productoId ? { ...v, cantidad: data.cantidad } : v))
        .filter((v) => v.cantidad > 0);
    if (data.accion === "nueva") {
      await tx.cotizacion.update({ where: { id: quote.id }, data: { estado: "archivada" } });
      return tx.cotizacion.create({ data: { usuarioId: actor.id, snapshot: { items: [] } } });
    }
    if (data.accion === "emitir") {
      if (!items.length) throw new ApiError("VALIDACION", "Agrega al menos un producto", 422);
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('elitepc-quote-sequence'))::text`;
      const year = new Date().getFullYear();
      const key = `cotizacionSecuencia:${year}`;
      const number =
        Number((await tx.configuracion.findUnique({ where: { clave: key } }))?.valor || 0) + 1;
      await tx.configuracion.upsert({
        where: { clave: key },
        create: { clave: key, valor: number },
        update: { valor: number },
      });
      const codigo = `EPC-${year}-${String(number).padStart(5, "0")}`;
      return tx.cotizacion.update({
        where: { id: quote.id },
        data: {
          codigo,
          cliente: data.cliente,
          estado: "emitida",
          snapshot: JSON.parse(JSON.stringify({ items, fecha: new Date().toISOString() })),
        },
      });
    }
    return tx.cotizacion.update({
      where: { id: quote.id },
      data: { snapshot: JSON.parse(JSON.stringify({ items })) },
    });
  });
}
