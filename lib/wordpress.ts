import "server-only";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./api-errors";
import { getProduct, cleanDescription } from "./productos/guardar";
import { safeDownload } from "./safe-download";
import type { UserRole } from "./auth-permissions";
export const WpConnection = z.object({
  url: z.url().refine((v) => v.startsWith("https://"), "Usa HTTPS"),
  usuario: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(500),
});
function key() {
  if (!process.env.AUTH_SECRET)
    throw new ApiError("CONFIGURACION", "Falta el secreto de autenticación", 503);
  return createHash("sha256").update(process.env.AUTH_SECRET).digest();
}
export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64");
}
export function decryptSecret(value: string) {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}
export async function wpConnection() {
  if (process.env.WP_URL && process.env.WP_USER && process.env.WP_APP_PASSWORD)
    return {
      url: process.env.WP_URL,
      usuario: process.env.WP_USER,
      password: process.env.WP_APP_PASSWORD,
    };
  const row = (await prisma.configuracion.findUnique({ where: { clave: "wpConexion" } }))?.valor;
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  return {
    url: String(row.url),
    usuario: String(row.usuario),
    password: decryptSecret(String(row.password)),
  };
}
async function wpRequest(path: string, method = "GET", body?: unknown) {
  const connection = await wpConnection();
  if (!connection)
    throw new ApiError("WP_NO_CONFIGURADO", "Conecta WordPress antes de publicar", 422);
  const url = new URL(`${connection.url.replace(/\/$/, "")}/wp-json/wc/v3/${path}`);
  const authorization = `Basic ${Buffer.from(`${connection.usuario}:${connection.password}`).toString("base64")}`;
  const downloaded = await safeDownload(url.toString(), 2 * 1024 * 1024, {
    method,
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    allowError: true,
  });
  let result;
  try {
    result = JSON.parse(downloaded.bytes.toString("utf8"));
  } catch {
    throw new ApiError("WP_RESPUESTA", "WordPress devolvió una respuesta inválida", 502);
  }
  if (downloaded.status >= 400)
    throw new ApiError(
      "WP_ERROR",
      String(result.message || "WordPress rechazó la publicación")
        .replaceAll(connection.password, "[oculto]")
        .slice(0, 400),
      502,
    );
  return result;
}
export async function testWp() {
  await wpRequest("products?per_page=1");
  return { conectado: true };
}
async function taxonomy(kind: "categories" | "tags", name: string) {
  const existing = await wpRequest(
    `products/${kind}?search=${encodeURIComponent(name)}&per_page=100`,
  );
  const exact = Array.isArray(existing)
    ? existing.find((v) => String(v.name).toLowerCase() === name.toLowerCase())
    : null;
  if (exact) return exact.id as number;
  return (await wpRequest(`products/${kind}`, "POST", { name })).id as number;
}
export async function publishWp(id: string, actor: { id: string; rol: UserRole }) {
  const product = await getProduct(id, "EDITOR");
  try {
    const categories = await taxonomy("categories", product.categoriaNombre);
    const tags = [];
    for (const name of product.etiquetas) tags.push({ id: await taxonomy("tags", name) });
    const escape = (v: string) =>
      v.replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
      );
    const description = cleanDescription(
      `${product.descripcion}${product.puntosClave.map((v) => `<p><strong>${escape(v.titulo)}</strong> ${escape(v.descripcion)}</p>`).join("")}<ul>${product.specs.map((v) => `<li><strong>${escape(v.campo)}:</strong> ${escape(v.valor)}</li>`).join("")}</ul>`,
    );
    const now = Date.now();
    const offer =
      product.precioOferta &&
      (!product.ofertaDesde || Date.parse(product.ofertaDesde) <= now) &&
      (!product.ofertaHasta || Date.parse(product.ofertaHasta) >= now)
        ? product.precioOferta
        : null;
    const data = {
      name: product.titulo,
      type: "simple",
      sku: product.sku,
      slug: product.slug,
      status: product.escondido || product.estado !== "publicado" ? "draft" : "publish",
      description,
      regular_price: product.precioSinFactura ? String(product.precioSinFactura / 100) : "",
      sale_price: offer ? String(offer / 100) : "",
      categories: [{ id: categories }],
      tags,
      images: product.imagenes.map((v) => ({ src: v.url, alt: v.alt || product.titulo })),
      manage_stock: product.controlaInventario,
      ...(product.controlaInventario
        ? { stock_quantity: product.stocks.reduce((sum, v) => sum + v.cantidad, 0) }
        : {}),
      stock_status:
        product.disponibilidad === "BAJO_PEDIDO"
          ? "onbackorder"
          : product.disponibilidad === "SIN_STOCK"
            ? "outofstock"
            : "instock",
      backorders: product.disponibilidad === "BAJO_PEDIDO" ? "notify" : "no",
      featured: product.destacado,
      meta_data: [
        {
          key: "_elitepc_precio_con_factura",
          value: product.precioConFactura ? String(product.precioConFactura / 100) : "",
        },
        {
          key: "_elitepc_precio_mayorista",
          value: product.precioMayorista ? String(product.precioMayorista / 100) : "",
        },
      ],
    };
    let wpId = product.wpId;
    if (!wpId) {
      const existing = await wpRequest(`products?sku=${encodeURIComponent(product.sku)}`);
      if (Array.isArray(existing) && existing[0]) wpId = Number(existing[0].id);
    }
    const result = await wpRequest(
      wpId ? `products/${wpId}` : "products",
      wpId ? "PUT" : "POST",
      data,
    );
    wpId = Number(result.id);
    if (!Number.isSafeInteger(wpId)) throw new Error("WordPress no devolvió identificador");
    await prisma.$transaction([
      prisma.producto.update({
        where: { id },
        data: {
          wpId,
          wpSyncEstado: "PUBLICADO",
          wpSyncFecha: new Date(),
          wpSyncError: null,
          actualizadoPorId: actor.id,
        },
      }),
      prisma.productoHistorial.create({
        data: {
          productoId: id,
          usuarioId: actor.id,
          accion: "editar",
          origen: "wordpress",
          cambios: [{ campo: "wpSyncEstado", antes: product.wpSyncEstado, despues: "PUBLICADO" }],
        },
      }),
    ]);
    return { wpId, estado: "PUBLICADO" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar";
    await prisma.$transaction([
      prisma.producto.update({
        where: { id },
        data: {
          wpSyncEstado: "ERROR",
          wpSyncFecha: new Date(),
          wpSyncError: message.slice(0, 400),
          actualizadoPorId: actor.id,
        },
      }),
      prisma.productoHistorial.create({
        data: {
          productoId: id,
          usuarioId: actor.id,
          accion: "editar",
          origen: "wordpress_error",
          cambios: [{ campo: "wpSyncEstado", antes: product.wpSyncEstado, despues: "ERROR" }],
        },
      }),
    ]);
    throw error;
  }
}
