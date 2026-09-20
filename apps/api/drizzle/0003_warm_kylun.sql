CREATE TABLE "tv_data_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"retention_enabled" boolean DEFAULT false NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"run_hour" integer DEFAULT 3 NOT NULL,
	"last_purge_at" timestamp,
	"last_purge_deleted" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "tv_data_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
