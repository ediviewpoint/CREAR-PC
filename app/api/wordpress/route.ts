import { requireSession } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api-errors";
import { wpConnection, encryptSecret, WpConnection, testWp } from "@/lib/wordpress";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    await requireSession("EDITOR");
    const connection = await wpConnection();
    return Response.json({
      configurado: !!connection,
      url: connection?.url || "",
      usuario: connection?.usuario || "",
      productos: await prisma.producto.findMany({
        where: { OR: [{ wpId: { not: null } }, { wpSyncEstado: "ERROR" }] },
        select: {
          id: true,
          sku: true,
          titulo: true,
          wpSyncEstado: true,
          wpSyncFecha: true,
          wpSyncError: true,
        },
        orderBy: { wpSyncFecha: "desc" },
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession("ADMIN");
    const connection = WpConnection.parse(await readJson(request));
    await prisma.$transaction([
      prisma.configuracion.upsert({
        where: { clave: "wpConexion" },
        create: {
          clave: "wpConexion",
          valor: {
            url: connection.url,
            usuario: connection.usuario,
            password: encryptSecret(connection.password),
          },
        },
        update: {
          valor: {
            url: connection.url,
            usuario: connection.usuario,
            password: encryptSecret(connection.password),
          },
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: session.user.id,
          accion: "wordpress_configurar",
          detalle: { url: connection.url },
        },
      }),
    ]);
    return Response.json(await testWp());
  } catch (error) {
    return apiError(error);
  }
}
