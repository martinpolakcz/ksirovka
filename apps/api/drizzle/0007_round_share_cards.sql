CREATE TABLE "score_round_share_cards" (
	"round_id" integer PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" bytea NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "score_round_share_cards" ADD CONSTRAINT "score_round_share_cards_round_id_score_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."score_rounds"("id") ON DELETE cascade ON UPDATE no action;
