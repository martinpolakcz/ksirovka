CREATE TABLE "tv_promo_images" (
	"promo_id" integer PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" bytea NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "tv_promo_images" ADD CONSTRAINT "tv_promo_images_promo_id_tv_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "tv_promos"("id") ON DELETE cascade ON UPDATE no action;
