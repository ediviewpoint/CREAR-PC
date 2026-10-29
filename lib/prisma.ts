import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalPrisma = globalThis as unknown as { elitePrisma?: PrismaClient };
export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL no está configurada.");
  const adapter = new PrismaPg({ connectionString, max: 3, connectionTimeoutMillis: 8000 });
  return new PrismaClient({ adapter, log: ["error"] });
}
export function getPrisma() {
  globalPrisma.elitePrisma ??= createPrismaClient();
  return globalPrisma.elitePrisma;
}

// Lazy: importar el cliente durante la compilación no abre una conexión.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
