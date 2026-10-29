import { ZodError } from "zod";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
    public fields?: Record<string, string>,
    public detail?: unknown,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
          ...(error.detail === undefined ? {} : { detail: error.detail }),
        },
      },
      { status: error.status },
    );
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[issue.path.join(".")] ??= issue.message;
    return NextResponse.json(
      { error: { code: "VALIDACION", message: "Revisa los campos marcados", fields } },
      { status: 422 },
    );
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002")
    return NextResponse.json(
      { error: { code: "SKU_DUPLICADO", message: "Ese SKU ya existe: abrir producto" } },
      { status: 409 },
    );
  return NextResponse.json(
    {
      error: {
        code: "ERROR_INTERNO",
        message: "No se pudo completar la operación. Intenta de nuevo.",
      },
    },
    { status: 500 },
  );
}
export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("VALIDACION", "El contenido debe ser JSON válido.");
  }
}
