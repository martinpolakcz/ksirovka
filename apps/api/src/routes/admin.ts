import type { FastifyInstance } from "fastify";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { scorePlayers, scoreRounds, tvPromos } from "../db/schema.js";
import { config } from "../config.js";
import {
  clearAdminSession,
  isAdminConfigured,
  passwordsMatch,
  requireAdmin,
  setAdminSession,
} from "../lib/admin-session.js";
import {
  countTvData,
  getTvDataSettings,
  purgeRounds,
  saveTvDataSettings,
} from "../lib/tv-data.js";
import {
  adminRoundsQuerySchema,
  hideRoundSchema,
  loginSchema,
  promoPatchSchema,
  promoSchema,
  tvDataPurgeSchema,
  tvDataSettingsSchema,
} from "../schemas/admin.js";

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(value);
}

export async function adminRoutes(app: FastifyInstance) {
  app.post(
    "/admin/login",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: 900_000,
          keyGenerator: (req) => `admin-login:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      if (!isAdminConfigured()) {
        return reply.status(503).send({ error: "Admin není nastavený" });
      }

      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      if (!passwordsMatch(parsed.data.password, config.ADMIN_PASSWORD)) {
        return reply.status(401).send({ error: "Neplatné heslo" });
      }

      setAdminSession(request, reply);
      return { ok: true };
    },
  );

  app.post("/admin/logout", async (request, reply) => {
    clearAdminSession(request, reply);
    return { ok: true };
  });

  app.register(async (scoped) => {
    scoped.addHook("preHandler", requireAdmin);

    scoped.get("/admin/me", async () => ({ ok: true }));

    scoped.get("/admin/promos", async () => {
      const items = await db
        .select()
        .from(tvPromos)
        .orderBy(tvPromos.sortOrder, tvPromos.id);
      return { items };
    });

    scoped.post("/admin/promos", async (request, reply) => {
      const parsed = promoSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      const [item] = await db
        .insert(tvPromos)
        .values({
          slot: data.slot,
          category: data.category,
          title: data.title,
          message: data.message,
          href: data.href ?? null,
          imageUrl: data.imageUrl ?? null,
          active: data.active,
          sortOrder: data.sortOrder,
          startsAt: toDate(data.startsAt),
          endsAt: toDate(data.endsAt),
        })
        .returning();

      return reply.status(201).send({ item });
    });

    scoped.patch("/admin/promos/:id", async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.status(400).send({ error: "Neplatné id" });
      }

      const parsed = promoPatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      const [item] = await db
        .update(tvPromos)
        .set({
          ...(data.slot !== undefined ? { slot: data.slot } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.message !== undefined ? { message: data.message } : {}),
          ...(data.href !== undefined ? { href: data.href } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.active !== undefined ? { active: data.active } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.startsAt !== undefined ? { startsAt: toDate(data.startsAt) } : {}),
          ...(data.endsAt !== undefined ? { endsAt: toDate(data.endsAt) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(tvPromos.id, id))
        .returning();

      if (!item) {
        return reply.status(404).send({ error: "Reklama nenalezena" });
      }

      return { item };
    });

    scoped.delete("/admin/promos/:id", async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.status(400).send({ error: "Neplatné id" });
      }

      const [item] = await db.delete(tvPromos).where(eq(tvPromos.id, id)).returning({
        id: tvPromos.id,
      });

      if (!item) {
        return reply.status(404).send({ error: "Reklama nenalezena" });
      }

      return reply.status(204).send();
    });

    scoped.get("/admin/rounds", async (request, reply) => {
      const parsed = adminRoundsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const rounds = await db
        .select()
        .from(scoreRounds)
        .orderBy(desc(scoreRounds.completedAt))
        .limit(parsed.data.limit);

      const ids = rounds.map((round) => round.id);
      const players =
        ids.length > 0
          ? await db.select().from(scorePlayers).where(inArray(scorePlayers.roundId, ids))
          : [];

      const playersByRound = new Map<number, typeof players>();
      for (const player of players) {
        const list = playersByRound.get(player.roundId) ?? [];
        list.push(player);
        playersByRound.set(player.roundId, list);
      }

      return {
        items: rounds.map((round) => {
          const roster = (playersByRound.get(round.id) ?? []).sort((a, b) => a.rank - b.rank);
          const winner = roster[0];
          return {
            id: round.id,
            gameType: round.gameType,
            format: round.format,
            completedAt: round.completedAt.toISOString(),
            finishedEarly: round.finishedEarly,
            holesPlayed: round.holesPlayed,
            hidden: round.hidden,
            winnerName: winner?.name ?? "",
            winnerTotal: winner?.total ?? 0,
            playerNames: roster.map((player) => player.name),
          };
        }),
      };
    });

    scoped.patch("/admin/rounds/:id", async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.status(400).send({ error: "Neplatné id" });
      }

      const parsed = hideRoundSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const [item] = await db
        .update(scoreRounds)
        .set({ hidden: parsed.data.hidden })
        .where(eq(scoreRounds.id, id))
        .returning({
          id: scoreRounds.id,
          hidden: scoreRounds.hidden,
        });

      if (!item) {
        return reply.status(404).send({ error: "Kolo nenalezeno" });
      }

      return { item };
    });

    scoped.delete("/admin/rounds/:id", async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.status(400).send({ error: "Neplatné id" });
      }

      const deleted = await purgeRounds({ scope: "ids", ids: [id] });
      if (deleted === 0) {
        return reply.status(404).send({ error: "Kolo nenalezeno" });
      }

      return reply.status(204).send();
    });

    scoped.get("/admin/tv-data", async () => {
      const [settings, counts] = await Promise.all([getTvDataSettings(), countTvData()]);
      return {
        settings: {
          retentionEnabled: settings.retentionEnabled,
          retentionDays: settings.retentionDays,
          runHour: settings.runHour,
          lastPurgeAt: settings.lastPurgeAt?.toISOString() ?? null,
          lastPurgeDeleted: settings.lastPurgeDeleted,
          updatedAt: settings.updatedAt.toISOString(),
        },
        counts,
      };
    });

    scoped.patch("/admin/tv-data", async (request, reply) => {
      const parsed = tvDataSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const settings = await saveTvDataSettings(parsed.data);
      const counts = await countTvData();
      return {
        settings: {
          retentionEnabled: settings.retentionEnabled,
          retentionDays: settings.retentionDays,
          runHour: settings.runHour,
          lastPurgeAt: settings.lastPurgeAt?.toISOString() ?? null,
          lastPurgeDeleted: settings.lastPurgeDeleted,
          updatedAt: settings.updatedAt.toISOString(),
        },
        counts,
      };
    });

    scoped.post("/admin/tv-data/purge", async (request, reply) => {
      const parsed = tvDataPurgeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const deleted = await purgeRounds(parsed.data);
      return { deleted };
    });
  });
}
