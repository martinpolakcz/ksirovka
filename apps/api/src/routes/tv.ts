import type { FastifyInstance } from "fastify";
import { and, asc, eq, isNull, lte, or, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { tvPromos } from "../db/schema.js";

function isPromoLive(
  promo: { startsAt: Date | null; endsAt: Date | null },
  now: Date,
): boolean {
  if (promo.startsAt && promo.startsAt > now) return false;
  if (promo.endsAt && promo.endsAt < now) return false;
  return true;
}

export async function tvRoutes(app: FastifyInstance) {
  app.get("/tv/board", async () => {
    const now = new Date();
    const rows = await db
      .select()
      .from(tvPromos)
      .where(
        and(
          eq(tvPromos.active, true),
          or(isNull(tvPromos.startsAt), lte(tvPromos.startsAt, now)),
          or(isNull(tvPromos.endsAt), gte(tvPromos.endsAt, now)),
        ),
      )
      .orderBy(asc(tvPromos.sortOrder), asc(tvPromos.id));

    const live = rows.filter((promo) => isPromoLive(promo, now));
    const serialize = (promo: (typeof live)[number]) => ({
      id: promo.id,
      slot: promo.slot,
      category: promo.category,
      title: promo.title,
      message: promo.message,
      href: promo.href,
      imageUrl: promo.imageUrl,
      sortOrder: promo.sortOrder,
    });

    return {
      promos: {
        ticker: live.filter((promo) => promo.slot === "ticker").map(serialize),
        featured: live.filter((promo) => promo.slot === "featured").map(serialize),
      },
    };
  });
}
