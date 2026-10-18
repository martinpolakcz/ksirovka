CREATE TABLE "score_course_hole_images" (
	"game_type" text NOT NULL,
	"hole" integer NOT NULL,
	"mime" text NOT NULL,
	"data" bytea NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_course_hole_images_game_type_hole_pk" PRIMARY KEY("game_type","hole")
);
