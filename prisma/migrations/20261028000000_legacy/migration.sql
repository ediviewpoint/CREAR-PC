-- Legacy 0000_easy_night_thrasher.sql
CREATE TYPE "public"."component_category" AS ENUM('cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case', 'cooler_air', 'cooler_aio', 'fan', 'monitor');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('BOB', 'USD');--> statement-breakpoint
CREATE TYPE "public"."build_purpose" AS ENUM('gaming', 'workstation', 'office', 'streaming', 'editing', 'ai_ml');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"bench_name" varchar(80) NOT NULL,
	"score" numeric(12, 2) NOT NULL,
	"unit" varchar(20),
	"source_url" text NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "build_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" smallint DEFAULT 1 NOT NULL,
	"unit_price_bob" numeric(10, 2) NOT NULL,
	"store_id" uuid,
	"notes" text,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(160) NOT NULL,
	"purpose" "build_purpose",
	"budget_bob" numeric(10, 2),
	"is_public" boolean DEFAULT false NOT NULL,
	"share_slug" varchar(80) NOT NULL,
	"compat_report" jsonb,
	"total_bob" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "component_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"url" text NOT NULL,
	"variant" varchar(20) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt_es" text NOT NULL,
	"alt_en" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"category" "component_category" NOT NULL,
	"brand" varchar(60) NOT NULL,
	"model" varchar(120) NOT NULL,
	"name_display" varchar(180) NOT NULL,
	"release_year" smallint,
	"tdp_w" smallint,
	"spec" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"currency" "currency" DEFAULT 'BOB' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"stock_qty" integer,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proformas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"build_id" uuid NOT NULL,
	"issued_by_user_id" uuid,
	"issued_by_store_id" uuid,
	"client_name" varchar(160) NOT NULL,
	"client_ci_nit" varchar(40),
	"client_phone" varchar(40),
	"client_email" varchar(160),
	"currency" "currency" DEFAULT 'BOB' NOT NULL,
	"subtotal_bob" numeric(10, 2) NOT NULL,
	"discount_bob" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_bob" numeric(10, 2) NOT NULL,
	"valid_until" date NOT NULL,
	"terms" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_blob_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"city" varchar(80) NOT NULL,
	"address" text,
	"phone" varchar(40),
	"whatsapp" varchar(40),
	"website" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "build_items" ADD CONSTRAINT "build_items_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "build_items" ADD CONSTRAINT "build_items_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "build_items" ADD CONSTRAINT "build_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "component_images" ADD CONSTRAINT "component_images_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prices" ADD CONSTRAINT "prices_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prices" ADD CONSTRAINT "prices_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proformas" ADD CONSTRAINT "proformas_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proformas" ADD CONSTRAINT "proformas_issued_by_store_id_stores_id_fk" FOREIGN KEY ("issued_by_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "benchmarks_component_idx" ON "benchmarks" USING btree ("component_id","bench_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "build_items_build_idx" ON "build_items" USING btree ("build_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "builds_share_slug_idx" ON "builds" USING btree ("share_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "component_images_component_idx" ON "component_images" USING btree ("component_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "components_slug_idx" ON "components" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "components_category_idx" ON "components" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "components_brand_model_idx" ON "components" USING btree ("brand","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prices_component_store_observed_idx" ON "prices" USING btree ("component_id","store_id","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "proformas_code_idx" ON "proformas" USING btree ("code");
-- Legacy 0001_black_mulholland_black.sql
CREATE TABLE IF NOT EXISTS "proforma_counters" (
	"year" smallint PRIMARY KEY NOT NULL,
	"next_val" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "build_items" ADD COLUMN "is_owned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "build_items" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "owner_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "components" ADD COLUMN "sources" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "proformas" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "proformas" ADD COLUMN "request_key" uuid;--> statement-breakpoint
ALTER TABLE "proformas" ADD COLUMN "snapshot" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "build_items" ADD CONSTRAINT "build_items_offer_id_prices_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."prices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_request_key_unique" UNIQUE("request_key");
-- Legacy 0002_counter_bootstrap.sql
-- Preserve existing numbering when adopting the new transactional counter.
INSERT INTO proforma_counters (year, next_val)
SELECT substring(code from 5 for 4)::smallint,
       max(substring(code from 10 for 5)::integer) + 1
FROM proformas
WHERE code ~ '^PRO-[0-9]{4}-[0-9]{5}$'
GROUP BY substring(code from 5 for 4)::smallint
ON CONFLICT (year) DO UPDATE
SET next_val = greatest(proforma_counters.next_val, excluded.next_val);

-- Legacy 0003_private_access.sql
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_counters ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE t text; r text;
BEGIN
 FOREACH t IN ARRAY ARRAY['components','component_images','stores','prices','benchmarks','builds','build_items','proformas','proforma_counters']
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated']
  LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r); END IF;
  END LOOP;
 END LOOP;
END $$;

-- Legacy 0004_friendly_cerise.sql
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

-- Legacy 0005_product_warranty.sql
ALTER TABLE "components" ADD COLUMN "warranty_months" smallint;
--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_warranty_months_check" CHECK ("warranty_months" BETWEEN 0 AND 120);

-- Legacy 0006_own_store_prices.sql
ALTER TABLE "stores" ADD COLUMN "is_own" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "stores_one_own_idx" ON "stores" ("is_own") WHERE "is_own" = true;
