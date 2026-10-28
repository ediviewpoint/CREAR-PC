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