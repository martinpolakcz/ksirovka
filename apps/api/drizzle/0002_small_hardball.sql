CREATE TABLE "tv_promos" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"href" text,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "score_rounds" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "tv_promos_active_sort_idx" ON "tv_promos" USING btree ("active","sort_order");--> statement-breakpoint
CREATE INDEX "tv_promos_slot_idx" ON "tv_promos" USING btree ("slot");