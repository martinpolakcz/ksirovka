ALTER TABLE "score_profiles" ADD COLUMN "birth_year" integer;--> statement-breakpoint
ALTER TABLE "score_profiles" ADD COLUMN "photo_mime" text;--> statement-breakpoint
ALTER TABLE "score_profiles" ADD COLUMN "photo" bytea;--> statement-breakpoint
ALTER TABLE "score_profiles" ADD COLUMN "notices_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "score_notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "score_notice_targets" (
	"notice_id" integer NOT NULL,
	"profile_id" integer NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "score_notice_targets_notice_id_profile_id_pk" PRIMARY KEY("notice_id","profile_id")
);--> statement-breakpoint
ALTER TABLE "score_notice_targets" ADD CONSTRAINT "score_notice_targets_notice_id_score_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."score_notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_notice_targets" ADD CONSTRAINT "score_notice_targets_profile_id_score_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."score_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "score_notice_targets_profile_idx" ON "score_notice_targets" USING btree ("profile_id");
