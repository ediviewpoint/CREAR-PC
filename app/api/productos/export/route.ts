import { z } from "zod";
import * as XLSX from "xlsx";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/productos/listar";
export async function GET(request: Request) {
  try {
    await requireSession("EDITOR");
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const ids = params.ids
      ? z.array(z.string().min(1).max(100)).max(2000).parse(params.ids.split(","))
      : null;
    const all = [];
    if (ids) {
      const rows = await prisma.producto.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: {
          id: true,
          sku: true,
          titulo: true,
          precioSinFactura: true,
          precioConFactura: true,
          modelo: true,
          categoria: { select: { nombre: true } },
        },
      });
      all.push(...rows.map((v) => ({ ...v, categoria: v.categoria.nombre })));
    } else {
      let page = 1;
      while (true) {
        const result = await listProducts({ ...params, page, pageSize: 2000 });
        all.push(...result.items);
        if (page * 2000 >= result.total || page >= 20) break;
        page++;
      }
    }
    const columns = params.columnas
      ?.split(",")
      .filter((v) =>
        [
          "sku",
          "titulo",
          "categoria",
          "subcategoria",
          "marca",
          "modelo",
          "precioSinFactura",
          "precioConFactura",
          "precioUsd",
          "disponibilidad",
          "tipo",
        ].includes(v),
      ) || ["sku", "titulo", "categoria", "modelo", "precioSinFactura", "precioConFactura"];
    const sheet = all.map((item) =>
      Object.fromEntries(
        columns.map((key) => [
          key,
          key.startsWith("precio")
            ? Number((item as Record<string, unknown>)[key] || 0) / 100
            : ((item as Record<string, unknown>)[key] ?? ""),
        ]),
      ),
    );
    const specs = await prisma.productoSpec.findMany({
      where: { productoId: { in: all.map((v) => v.id) } },
      include: { producto: { select: { sku: true } } },
      orderBy: { orden: "asc" },
    });
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(sheet), "Productos");
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        specs.map((v) => ({ SKU: v.producto.sku, Campo: v.campo, Valor: v.valor })),
      ),
      "Especificaciones",
    );
    return new Response(new Uint8Array(XLSX.write(book, { type: "buffer", bookType: "xlsx" })), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=productos-elitepc.xlsx",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
