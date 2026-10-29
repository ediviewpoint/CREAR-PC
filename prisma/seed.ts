import { createRequire } from "node:module";
import { hash } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const specs: Record<string, string[]> = {
  NOTEBOOK: [
    "Procesador",
    "Frecuencia turbo",
    "Núcleos/Hilos",
    "Memoria RAM",
    "Almacenamiento",
    "Pantalla",
    "Resolución",
    "Gráficos",
    "Sistema operativo",
    "Conectividad",
    "Puertos",
    "Batería",
    "Peso",
    "Teclado",
    "Cámara",
  ],
  MONITOR: [
    "Pantalla",
    "Resolución",
    "Frecuencia de actualización",
    "Panel",
    "Tiempo de respuesta",
    "Conectividad",
    "Puertos",
    "Soporte VESA",
  ],
  IMPRESORA: [
    "Tecnología",
    "Funciones",
    "Sistema de tinta",
    "Velocidad de impresión",
    "Resolución",
    "Conectividad",
    "Dúplex",
    "Tamaño de papel",
    "Rendimiento",
  ],
  TINTA: ["Compatibilidad", "Color", "Contenido", "Rendimiento", "Tipo de tinta"],
  ACCESORIO: ["Compatibilidad", "Conectividad", "Material", "Dimensiones", "Peso"],
  GAMER: ["Tipo", "Compatibilidad", "Conectividad", "Iluminación", "Material"],
  REPUESTO: ["Tipo", "Compatibilidad", "Capacidad", "Interfaz", "Dimensiones"],
};
export async function seedBase(client = prisma) {
  await client.usuario.upsert({
    where: { id: "sistema" },
    create: {
      id: "sistema",
      nombre: "Sistema",
      email: "sistema@elitepc.invalid",
      rol: "ADMIN",
      activo: false,
    },
    update: {},
  });
  for (const [index, [nombre, campos]] of Object.entries(specs).entries()) {
    const slug = nombre.toLowerCase();
    await client.categoria.upsert({
      where: { slug },
      create: {
        nombre,
        slug,
        orden: index,
        specsSugeridas: campos.map((campo) => ({
          campo,
          icono: null,
          obligatorio: ["Procesador", "Memoria RAM", "Almacenamiento", "Pantalla"].includes(campo),
        })),
        plantillaTitulo:
          nombre === "NOTEBOOK"
            ? '{MARCA} {PROCESADOR_CORTO} {PANTALLA}" MOD: {MODELO} ({PART_NUMBER})'
            : "{MARCA} {MODELO} ({PART_NUMBER})",
      },
      update: {},
    });
  }
  for (const nombre of [
    "HP",
    "Lenovo",
    "ASUS",
    "Dell",
    "Acer",
    "Chuwi",
    "Epson",
    "Canon",
    "Brother",
    "Logitech",
  ])
    await client.marca.upsert({ where: { nombre }, create: { nombre }, update: {} });
  for (const nombre of [
    "Central 1",
    "Central 2",
    "Panadería",
    "Hemodiálisis",
    "Servicio técnico",
    "Depósito",
  ])
    await client.sucursal.upsert({ where: { nombre }, create: { nombre }, update: {} });
  const aliases = [
    ["marca", "hewlett packard", "HP"],
    ["marca", "hp", "HP"],
    ["marca", "lenovo", "Lenovo"],
    ["marca", "asus", "ASUS"],
    ["marca", "chui", "Chuwi"],
    ["abreviatura", "W11S", "Windows 11 Home en modo S"],
    ["abreviatura", "NB", "Notebook"],
    ["abreviatura", "CEL", "Intel Celeron"],
    ["abreviatura", "SSD", "SSD"],
    ["abreviatura", "UFS", "UFS"],
  ];
  for (const [tipo, valor, normalizado] of aliases)
    await client.alias.upsert({
      where: { tipo_valor: { tipo: tipo!, valor: valor! } },
      create: { tipo: tipo!, valor: valor!, normalizado: normalizado! },
      update: {},
    });
  const settings = {
    recargoConFactura: 16,
    redondearDecena: true,
    umbralStockBajo: 2,
    limiteDiarioIA: 300,
    prefijoSku: "Z",
    skuSiguiente: 1,
    tipoCambio: {
      valor: "6.96",
      fecha: null,
      fuente: "Configuración inicial; verificar",
      verificado: false,
    },
    plantillaWhatsApp:
      "{SKU} {TITULO}\n⚡ {DESTACADO_1}\n💾 {DESTACADO_2}\n🖥 {DESTACADO_3}\n🔒 {DESTACADO_4}\n💰 Precio: Bs {PRECIO_SF} S/F{SI_CF: | Bs {PRECIO_CF} C/F}\n📍 ElitePC · Santa Cruz",
    plantillaImportacion: {},
  };
  for (const [clave, valor] of Object.entries(settings))
    await client.configuracion.upsert({ where: { clave }, create: { clave, valor }, update: {} });
  // DECISION: el seed es idempotente y jamás resetea contraseñas ni crea credenciales públicas de ejemplo.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 16) {
    const existing = await client.usuario.findUnique({ where: { email } });
    if (!existing)
      await client.usuario.create({
        data: {
          email,
          nombre: process.env.ADMIN_NAME || "Administrador ElitePC",
          passwordHash: await hash(password, 12),
          rol: "ADMIN",
        },
      });
  }
}
if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed.ts")) {
  seedBase()
    .then(() =>
      console.log("Base ElitePC preparada. No se crearon productos ni precios ficticios."),
    )
    .catch(() => {
      console.error("No se pudo preparar la base. Revisa conexión y migraciones.");
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
