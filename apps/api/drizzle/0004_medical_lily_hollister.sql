CREATE TABLE "score_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"name" text NOT NULL,
	"nickname" text NOT NULL,
	"nickname_normalized" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "score_profiles_email_normalized_unique" UNIQUE("email_normalized"),
	CONSTRAINT "score_profiles_nickname_normalized_unique" UNIQUE("nickname_normalized")
);
