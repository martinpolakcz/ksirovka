import type { FastifyInstance } from "fastify";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  pages,
  articles,
  heroSlides,
  activityTiles,
  galleries,
  galleryImages,
  contactSubmissions,
} from "../db/schema.js";
import { contactSchema } from "../schemas/contact.js";
import { config } from "../config.js";
import { createHash } from "node:crypto";

export async function contentRoutes(app: FastifyInstance) {
  app.get("/homepage", async () => {
    const [slides, tiles, latestArticles, featuredGalleries] =
      await Promise.all([
        db
          .select()
          .from(heroSlides)
          .where(eq(heroSlides.active, true))
          .orderBy(heroSlides.sortOrder),
        db.select().from(activityTiles).orderBy(activityTiles.sortOrder),
        db
          .select()
          .from(articles)
          .where(eq(articles.published, true))
          .orderBy(desc(articles.publishedAt))
          .limit(10),
        db.select().from(galleries).limit(6),
      ]);

    return {
      heroSlides: slides,
      activityTiles: tiles,
      articles: latestArticles,
      galleries: featuredGalleries,
      contact: {
        phone: "+420 605 700 717",
        email: "info@ksirovka.cz",
        address: {
          street: "K Lávce 705/8",
          city: "619 00 Brno, Horní Heršpice",
        },
      },
    };
  });

  app.get("/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [page] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.published, true)))
      .limit(1);

    if (!page) {
      return reply.status(404).send({ error: "Page not found" });
    }

    return page;
  });

  app.get("/articles", async (request) => {
    const { limit = "20", offset = "0" } = request.query as {
      limit?: string;
      offset?: string;
    };

    const items = await db
      .select()
      .from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.publishedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    return { items, limit: Number(limit), offset: Number(offset) };
  });

  app.get("/articles/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [article] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.published, true)))
      .limit(1);

    if (!article) {
      return reply.status(404).send({ error: "Article not found" });
    }

    return article;
  });

  app.get("/galleries", async () => {
    return db.select().from(galleries);
  });

  app.get("/galleries/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [gallery] = await db
      .select()
      .from(galleries)
      .where(eq(galleries.slug, slug))
      .limit(1);

    if (!gallery) {
      return reply.status(404).send({ error: "Gallery not found" });
    }

    const images = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.galleryId, gallery.id))
      .orderBy(galleryImages.sortOrder);

    return { ...gallery, images };
  });

  app.post(
    "/contact",
    {
      config: {
        rateLimit: {
          max: config.CONTACT_RATE_LIMIT_MAX,
          timeWindow: config.CONTACT_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `contact:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const ip = request.ip;
    const ipHash = createHash("sha256").update(ip).digest("hex");

    await db.insert(contactSubmissions).values({
      ...parsed.data,
      ipHash,
    });

    return { success: true, message: "Zpráva byla odeslána." };
  },
  );
}
