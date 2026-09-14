CREATE TABLE "score_hole_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"hole" integer NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"client_player_id" text NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"total" integer NOT NULL,
	"rank" integer NOT NULL,
	"best_hole" integer,
	"best_hole_score" integer,
	"worst_hole" integer,
	"worst_hole_score" integer
);
--> statement-breakpoint
CREATE TABLE "score_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_round_id" text NOT NULL,
	"game_type" text NOT NULL,
	"format" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp NOT NULL,
	"finished_early" boolean DEFAULT false NOT NULL,
	"holes_played" integer DEFAULT 18 NOT NULL,
	"submitted_by_email" text,
	"submitted_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_rounds_client_round_id_unique" UNIQUE("client_round_id")
);
--> statement-breakpoint
ALTER TABLE "score_hole_scores" ADD CONSTRAINT "score_hole_scores_round_id_score_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."score_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_hole_scores" ADD CONSTRAINT "score_hole_scores_player_id_score_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."score_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_players" ADD CONSTRAINT "score_players_round_id_score_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."score_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "score_hole_scores_round_id_idx" ON "score_hole_scores" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "score_hole_scores_hole_idx" ON "score_hole_scores" USING btree ("hole");--> statement-breakpoint
CREATE INDEX "score_players_round_id_idx" ON "score_players" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "score_players_name_normalized_idx" ON "score_players" USING btree ("name_normalized");--> statement-breakpoint
CREATE INDEX "score_rounds_completed_at_idx" ON "score_rounds" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "score_rounds_game_type_idx" ON "score_rounds" USING btree ("game_type");