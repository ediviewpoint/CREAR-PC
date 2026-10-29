import type { PGlite } from "@electric-sql/pglite";
import type { Server } from "node:net";
export function createReviewDatabaseServer(pg: PGlite, port?: number): Promise<Server>;
