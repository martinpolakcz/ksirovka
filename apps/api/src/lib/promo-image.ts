import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tvPromoImages, tvPromos, type TvPromo } from "../db/schema.js";

export function promoImagePublicPath(promoId: number, version?: Date | number | null): string {
  const path = `/uploads/promos/${promoId}`;
  if (version == null) return path;
  const stamp = version instanceof Date ? version.getTime() : version;
  return `${path}?v=${stamp}`;
}

export async function savePromoImage(input: {
  promoId: number;
  mime: string;
  data: Buffer;
}): Promise<TvPromo> {
  const now = new Date();
  const imageUrl = promoImagePublicPath(input.promoId, now);
  await db
    .insert(tvPromoImages)
    .values({
      promoId: input.promoId,
      mime: input.mime,
      data: input.data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tvPromoImages.promoId,
      set: {
        mime: input.mime,
        data: input.data,
        updatedAt: now,
      },
    });
  const [item] = await db
    .update(tvPromos)
    .set({ imageUrl, updatedAt: now })
    .where(eq(tvPromos.id, input.promoId))
    .returning();
  if (!item) {
    throw new Error("Reklama nenalezena");
  }
  return item;
}

export async function getPromoImage(promoId: number): Promise<{ mime: string; data: Buffer } | null> {
  const [row] = await db
    .select({
      mime: tvPromoImages.mime,
      data: tvPromoImages.data,
    })
    .from(tvPromoImages)
    .where(eq(tvPromoImages.promoId, promoId))
    .limit(1);
  if (!row) return null;
  const data = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  return { mime: row.mime, data };
}

export async function deletePromoImage(promoId: number): Promise<TvPromo | null> {
  await db.delete(tvPromoImages).where(eq(tvPromoImages.promoId, promoId));
  const [item] = await db
    .update(tvPromos)
    .set({ imageUrl: null, updatedAt: new Date() })
    .where(eq(tvPromos.id, promoId))
    .returning();
  return item ?? null;
}
