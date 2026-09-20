import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    metaDescription: text("meta_description"),
    contentHtml: text("content_html").notNull().default(""),
    heroImage: text("hero_image"),
    template: text("template").notNull().default("default"),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("pages_slug_idx").on(table.slug)],
);

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    contentHtml: text("content_html").notNull().default(""),
    coverImage: text("cover_image"),
    publishedAt: timestamp("published_at"),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("articles_slug_idx").on(table.slug),
    index("articles_published_at_idx").on(table.publishedAt),
  ],
);

export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  contentHtml: text("content_html"),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const activityTiles = pgTable("activity_tiles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id")
    .notNull()
    .references(() => galleries.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scoreRounds = pgTable(
  "score_rounds",
  {
    id: serial("id").primaryKey(),
    clientRoundId: text("client_round_id").notNull().unique(),
    gameType: text("game_type").notNull(),
    format: text("format").notNull(),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at").notNull(),
    finishedEarly: boolean("finished_early").notNull().default(false),
    holesPlayed: integer("holes_played").notNull().default(18),
    submittedByEmail: text("submitted_by_email"),
    submittedByName: text("submitted_by_name"),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("score_rounds_completed_at_idx").on(table.completedAt),
    index("score_rounds_game_type_idx").on(table.gameType),
  ],
);

export const scorePlayers = pgTable(
  "score_players",
  {
    id: serial("id").primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => scoreRounds.id, { onDelete: "cascade" }),
    clientPlayerId: text("client_player_id").notNull(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    total: integer("total").notNull(),
    rank: integer("rank").notNull(),
    bestHole: integer("best_hole"),
    bestHoleScore: integer("best_hole_score"),
    worstHole: integer("worst_hole"),
    worstHoleScore: integer("worst_hole_score"),
  },
  (table) => [
    index("score_players_round_id_idx").on(table.roundId),
    index("score_players_name_normalized_idx").on(table.nameNormalized),
  ],
);

export const scoreHoleScores = pgTable(
  "score_hole_scores",
  {
    id: serial("id").primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => scoreRounds.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => scorePlayers.id, { onDelete: "cascade" }),
    hole: integer("hole").notNull(),
    score: integer("score").notNull(),
  },
  (table) => [
    index("score_hole_scores_round_id_idx").on(table.roundId),
    index("score_hole_scores_hole_idx").on(table.hole),
  ],
);

export const tvDataSettings = pgTable("tv_data_settings", {
  id: integer("id").primaryKey(),
  retentionEnabled: boolean("retention_enabled").notNull().default(false),
  retentionDays: integer("retention_days").notNull().default(30),
  runHour: integer("run_hour").notNull().default(3),
  lastPurgeAt: timestamp("last_purge_at"),
  lastPurgeDeleted: integer("last_purge_deleted").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tvPromos = pgTable(
  "tv_promos",
  {
    id: serial("id").primaryKey(),
    slot: text("slot").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    href: text("href"),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tv_promos_active_sort_idx").on(table.active, table.sortOrder),
    index("tv_promos_slot_idx").on(table.slot),
  ],
);

/** Reserved for future reservation system */
export const reservationSlots = pgTable("reservation_slots", {
  id: serial("id").primaryKey(),
  serviceType: text("service_type").notNull(),
  slotStart: timestamp("slot_start").notNull(),
  slotEnd: timestamp("slot_end").notNull(),
  capacity: integer("capacity").notNull().default(1),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type ActivityTile = typeof activityTiles.$inferSelect;
export type ScoreRound = typeof scoreRounds.$inferSelect;
export type ScorePlayer = typeof scorePlayers.$inferSelect;
export type ScoreHoleScore = typeof scoreHoleScores.$inferSelect;
export type TvPromo = typeof tvPromos.$inferSelect;
export type TvDataSettings = typeof tvDataSettings.$inferSelect;
