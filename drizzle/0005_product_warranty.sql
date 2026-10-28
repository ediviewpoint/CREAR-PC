ALTER TABLE "components" ADD COLUMN "warranty_months" smallint;
--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_warranty_months_check" CHECK ("warranty_months" BETWEEN 0 AND 120);
