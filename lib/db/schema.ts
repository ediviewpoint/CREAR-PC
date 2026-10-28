import type { ProformaData } from "@/lib/proforma/types";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  smallint,
  integer,
  boolean,
  timestamp,
  text,
  jsonb,
  decimal,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================
// Enums
// ============================================================

export const categoryEnum = pgEnum("component_category", [
  "cpu",
  "gpu",
  "mobo",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler_air",
  "cooler_aio",
  "fan",
  "monitor",
]);

export const purposeEnum = pgEnum("build_purpose", [
  "gaming",
  "workstation",
  "office",
  "streaming",
  "editing",
  "ai_ml",
]);

export const currencyEnum = pgEnum("currency", ["BOB", "USD"]);

// ============================================================
// components (base)
// ============================================================

export const components = pgTable(
  "components",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    category: categoryEnum("category").notNull(),
    brand: varchar("brand", { length: 60 }).notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    nameDisplay: varchar("name_display", { length: 180 }).notNull(),
    releaseYear: smallint("release_year"),
    tdpW: smallint("tdp_w"),
    spec: jsonb("spec").notNull().$type<Record<string, unknown>>(),
    sources: jsonb("sources").notNull().default([]).$type<{ url: string; fetchedAt?: string }[]>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("components_slug_idx").on(t.slug),
    index("components_category_idx").on(t.category),
    index("components_brand_model_idx").on(t.brand, t.model),
  ],
);

export const componentImages = pgTable(
  "component_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    componentId: uuid("component_id")
      .notNull()
      .references(() => components.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    variant: varchar("variant", { length: 20 }).notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    altEs: text("alt_es").notNull(),
    altEn: text("alt_en"),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [index("component_images_component_idx").on(t.componentId)],
);

// ============================================================
// stores + prices
// ============================================================

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    whatsapp: varchar("whatsapp", { length: 40 }),
    website: text("website"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("stores_slug_idx").on(t.slug)],
);

export const prices = pgTable(
  "prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    componentId: uuid("component_id")
      .notNull()
      .references(() => components.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull().default("BOB"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    inStock: boolean("in_stock").notNull().default(true),
    stockQty: integer("stock_qty"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    sourceUrl: text("source_url"),
  },
  (t) => [index("prices_component_store_observed_idx").on(t.componentId, t.storeId, t.observedAt)],
);

// ============================================================
// benchmarks
// ============================================================

export const benchmarks = pgTable(
  "benchmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    componentId: uuid("component_id")
      .notNull()
      .references(() => components.id, { onDelete: "cascade" }),
    benchName: varchar("bench_name", { length: 80 }).notNull(),
    score: decimal("score", { precision: 12, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }),
    sourceUrl: text("source_url").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("benchmarks_component_idx").on(t.componentId, t.benchName)],
);

// ============================================================
// builds + proformas
// ============================================================

export const builds = pgTable(
  "builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    ownerTokenHash: varchar("owner_token_hash", { length: 64 }),
    name: varchar("name", { length: 160 }).notNull(),
    purpose: purposeEnum("purpose"),
    budgetBob: decimal("budget_bob", { precision: 10, scale: 2 }),
    isPublic: boolean("is_public").notNull().default(false),
    shareSlug: varchar("share_slug", { length: 80 }).notNull(),
    compatReport: jsonb("compat_report").$type<Record<string, unknown>>(),
    totalBob: decimal("total_bob", { precision: 10, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("builds_share_slug_idx").on(t.shareSlug)],
);

export const buildItems = pgTable(
  "build_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    componentId: uuid("component_id")
      .notNull()
      .references(() => components.id, { onDelete: "restrict" }),
    quantity: smallint("quantity").notNull().default(1),
    unitPriceBob: decimal("unit_price_bob", { precision: 10, scale: 2 }).notNull(),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    notes: text("notes"),
    isOwned: boolean("is_owned").notNull().default(false),
    offerId: uuid("offer_id").references(() => prices.id),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [index("build_items_build_idx").on(t.buildId)],
);

export const proformas = pgTable(
  "proformas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "restrict" }),
    issuedByUserId: uuid("issued_by_user_id"),
    issuedByStoreId: uuid("issued_by_store_id").references(() => stores.id),
    clientName: varchar("client_name", { length: 160 }).notNull(),
    clientCiNit: varchar("client_ci_nit", { length: 40 }),
    clientPhone: varchar("client_phone", { length: 40 }),
    clientEmail: varchar("client_email", { length: 160 }),
    currency: currencyEnum("currency").notNull().default("BOB"),
    subtotalBob: decimal("subtotal_bob", { precision: 10, scale: 2 }).notNull(),
    discountBob: decimal("discount_bob", { precision: 10, scale: 2 }).notNull().default("0"),
    totalBob: decimal("total_bob", { precision: 10, scale: 2 }).notNull(),
    validUntil: date("valid_until").notNull(),
    terms: text("terms"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    pdfBlobUrl: text("pdf_blob_url"),
    isPublic: boolean("is_public").notNull().default(false),
    requestKey: uuid("request_key").unique(),
    snapshot: jsonb("snapshot").$type<ProformaData>(),
  },
  (t) => [uniqueIndex("proformas_code_idx").on(t.code)],
);

export const proformaCounters = pgTable("proforma_counters", {
  year: smallint("year").primaryKey(),
  nextVal: integer("next_val").notNull().default(1),
});

// El catálogo se sirve por Next.js. No se da acceso directo desde la API pública.
for (const table of [
  components,
  componentImages,
  stores,
  prices,
  benchmarks,
  builds,
  buildItems,
  proformas,
  proformaCounters,
])
  table.enableRLS();
