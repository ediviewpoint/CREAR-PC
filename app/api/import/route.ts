import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { requireSession } from "@/lib/auth";
import { apiError, ApiError, readJson } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { suggestMapping } from "@/lib/importacion";
export async function POST(request: Request) {
  try {
    const session = await requireSession("EDITOR");
    let rows: Record<string, unknown>[] = [];
    let sheets: string[] = [];
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        file.size > 10 * 1024 * 1024 ||
        !/\.(xlsx?|csv)$/i.test(file.name)
      )
        throw new ApiError("ARCHIVO_INVALIDO", "Sube Excel o CSV de hasta 10 MB", 415);
      const buffer = Buffer.from(await file.arrayBuffer());
      if (/\.csv$/i.test(file.name))
        rows = Papa.parse<Record<string, unknown>>(buffer.toString("utf8"), {
          header: true,
          skipEmptyLines: true,
        }).data;
      else {
        const book = XLSX.read(buffer, { type: "buffer", cellFormula: false });
        sheets = book.SheetNames;
        const sheet = String(form.get("hoja") || sheets[0]);
        if (!book.Sheets[sheet]) throw new ApiError("VALIDACION", "Elige una hoja válida", 422);
        rows = XLSX.utils.sheet_to_json(book.Sheets[sheet]);
      }
    } else
      rows = z
        .object({
          filas: z
            .array(
              z.record(
                z.string(),
                z.union([z.string().max(20000), z.number(), z.boolean(), z.null()]),
              ),
            )
            .min(1)
            .max(2000),
        })
        .parse(await readJson(request)).filas;
    if (!rows.length || rows.length > 2000)
      throw new ApiError("VALIDACION", "Importa entre 1 y 2.000 filas", 422);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 100);
    const job = await prisma.trabajoBatch.create({
      data: {
        usuarioId: session.user.id,
        tipoEntrada: "importacion",
        estado: "mapeo",
        total: rows.length,
        procesados: 0,
        items: JSON.parse(JSON.stringify(rows)),
        opciones: {},
      },
    });
    return Response.json({
      id: job.id,
      hojas: sheets,
      columnas: columns,
      mapeoSugerido: suggestMapping(columns),
      vistaPrevia: rows.slice(0, 20),
      total: rows.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
