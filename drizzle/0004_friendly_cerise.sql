ALTER TABLE "benchmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "build_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "component_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proforma_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proformas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "slug" varchar(80);--> statement-breakpoint
UPDATE "stores"
SET "slug" = lower(regexp_replace(coalesce("name",'') || '-' || coalesce("city",''), '[^a-z0-9]+', '-', 'gi'))
WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_idx" ON "stores" USING btree ("slug");
