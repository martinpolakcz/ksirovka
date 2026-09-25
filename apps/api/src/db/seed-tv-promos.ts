import { db } from "./index.js";
import { tvPromos } from "./schema.js";
import { defaultTvPromos } from "../data/tv-promos.js";

async function seedTvPromos() {
  const existing = await db.select({ title: tvPromos.title }).from(tvPromos);
  const have = new Set(existing.map((row) => row.title));
  const missing = defaultTvPromos.filter((promo) => !have.has(promo.title));

  if (missing.length === 0) {
    console.log(`TV reklamy už jsou komplet (${existing.length}).`);
    process.exit(0);
  }

  await db.insert(tvPromos).values(
    missing.map((promo) => ({
      slot: promo.slot,
      category: promo.category,
      title: promo.title,
      message: promo.message,
      href: promo.href,
      imageUrl: promo.imageUrl,
      sortOrder: promo.sortOrder,
      active: true,
    })),
  );

  console.log(`Přidáno ${missing.length} TV reklam (celkem ${existing.length + missing.length}).`);
  process.exit(0);
}

seedTvPromos().catch((err) => {
  console.error(err);
  process.exit(1);
});
