CREATE TABLE "score_course_holes" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_type" text NOT NULL,
	"hole" integer NOT NULL,
	"par" integer DEFAULT 2 NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "score_course_holes_game_hole_idx" ON "score_course_holes" USING btree ("game_type","hole");