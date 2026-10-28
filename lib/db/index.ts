import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: DrizzleClient | null = null;
let cachedClient: ReturnType<typeof postgres> | null = null;

export function getDb(): DrizzleClient {
  if (cachedDb) return cachedDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Corré `vercel env pull .env.local` o seteala en Vercel.",
    );
  }
  // Supabase pooler no soporta prepared statements → prepare: false.
  cachedClient = postgres(connectionString, { prepare: false, max: 1 });
  cachedDb = drizzle(cachedClient, { schema });
  return cachedDb;
}

export { schema };
