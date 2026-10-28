ALTER TABLE "stores" ADD COLUMN "is_own" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "stores_one_own_idx" ON "stores" ("is_own") WHERE "is_own" = true;
