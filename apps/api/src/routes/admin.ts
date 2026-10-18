import type { FastifyInstance, FastifyReply } from "fastify";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  scoreNoticeTargets,
  scoreNotices,
  scorePlayers,
  scoreProfiles,
  scoreRoundShareCards,
  scoreRounds,
  tvPromos,
  type TvDataSettings,
} from "../db/schema.js";
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
  resetTvPodium,
  saveTvDataSettings,
} from "../lib/tv-data.js";
import { getCourseGames, patchCourseHole, saveCourseHoleImage } from "../lib/course.js";
import { deletePromoImage, savePromoImage } from "../lib/promo-image.js";
import { loadMarketingSnapshot } from "../lib/marketing.js";
import { decodeShareCard, photoDownloadFilename, profilePhotoPublicUrl, shareCardPublicUrl } from "../lib/share-card.js";
import { normalizePlayerName } from "../lib/scorecard.js";
import { roundIdParamSchema } from "../schemas/scorecard.js";
import {
  adminRoundsQuerySchema,
  courseHolePatchSchema,
  createNoticeSchema,
  hideRoundSchema,
  loginSchema,
  promoPatchSchema,
  promoSchema,
  tvDataPurgeSchema,
  tvDataSettingsSchema,
  uploadCourseImageSchema,
  uploadPromoImageSchema,
} from "../schemas/admin.js";

const GAME_LABELS: Record<string, string> = {
  fotbalgolf: "Fotbalgolf",
  minigolf: "Minigolf",
  adventure: "Adventure Golf",
};

function serializeTvDataSettings(settings: TvDataSettings) {
  return {
    retentionEnabled: settings.retentionEnabled,
    retentionDays: settings.retentionDays,
    runHour: settings.runHour,
    tickerSeconds: settings.tickerSeconds,
    podiumSince: settings.podiumSince?.toISOString() ?? null,
    lastPurgeAt: settings.lastPurgeAt?.toISOString() ?? null,
    lastPurgeDeleted: settings.lastPurgeDeleted,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function sendStoredImage(reply: FastifyReply, mime: string, data: Buffer | Uint8Array, filename?: string) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (filename) {
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
  }
  reply.header("Cache-Control", "private, max-age=60");
  return reply.type(mime).send(bytes);
}

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

    scoped.get("/admin/marketing", async () => loadMarketingSnapshot());

    scoped.post("/admin/notices", async (request, reply) => {
      const parsed = createNoticeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const keys = [...new Set(parsed.data.nicknames.map((name) => normalizePlayerName(name)))];
      const profiles =
        keys.length > 0
          ? await db
              .select({
                id: scoreProfiles.id,
                nickname: scoreProfiles.nickname,
                noticesOptIn: scoreProfiles.noticesOptIn,
                email: scoreProfiles.email,
              })
              .from(scoreProfiles)
              .where(inArray(scoreProfiles.nicknameNormalized, keys))
          : [];
      const targets = profiles.filter((profile) => profile.noticesOptIn && profile.email);
      if (targets.length === 0) {
        return reply.status(400).send({
          error: "Nikdo z výběru nemá v appce zapnuté novinky a e-mail.",
        });
      }

      const [notice] = await db
        .insert(scoreNotices)
        .values({
          kind: parsed.data.kind,
          title: parsed.data.title,
          message: parsed.data.message,
        })
        .returning({ id: scoreNotices.id });

      if (!notice) {
        return reply.status(500).send({ error: "Kampaň se neuložila" });
      }

      await db.insert(scoreNoticeTargets).values(
        targets.map((profile) => ({
          noticeId: notice.id,
          profileId: profile.id,
        })),
      );

      return {
        id: notice.id,
        sent: targets.length,
        skipped: keys.length - targets.length,
      };
    });

    scoped.get("/admin/notices", async () => {
      const notices = await db
        .select({
          id: scoreNotices.id,
          kind: scoreNotices.kind,
          title: scoreNotices.title,
          message: scoreNotices.message,
          createdAt: scoreNotices.createdAt,
        })
        .from(scoreNotices)
        .orderBy(desc(scoreNotices.createdAt), desc(scoreNotices.id))
        .limit(50);

      if (notices.length === 0) {
        return { items: [] };
      }

      const targets = await db
        .select({
          noticeId: scoreNoticeTargets.noticeId,
          readAt: scoreNoticeTargets.readAt,
          nickname: scoreProfiles.nickname,
          name: scoreProfiles.name,
          email: scoreProfiles.email,
        })
        .from(scoreNoticeTargets)
        .innerJoin(scoreProfiles, eq(scoreProfiles.id, scoreNoticeTargets.profileId))
        .where(
          inArray(
            scoreNoticeTargets.noticeId,
            notices.map((item) => item.id),
          ),
        );

      const byNotice = new Map<number, typeof targets>();
      for (const row of targets) {
        const list = byNotice.get(row.noticeId) ?? [];
        list.push(row);
        byNotice.set(row.noticeId, list);
      }

      return {
        items: notices.map((notice) => {
          const people = byNotice.get(notice.id) ?? [];
          return {
            id: notice.id,
            kind: notice.kind,
            title: notice.title,
            message: notice.message,
            createdAt: notice.createdAt.toISOString(),
            sent: people.length,
            read: people.filter((person) => person.readAt).length,
            recipients: people.map((person) => ({
              nickname: person.nickname,
              name: person.name,
              email: person.email,
              readAt: person.readAt?.toISOString() ?? null,
            })),
          };
        }),
      };
    });

    scoped.get("/admin/game-photos", async () => {
      const cards = await db
        .select({
          roundId: scoreRoundShareCards.roundId,
          createdAt: scoreRoundShareCards.createdAt,
          gameType: scoreRounds.gameType,
          completedAt: scoreRounds.completedAt,
          hidden: scoreRounds.hidden,
        })
        .from(scoreRoundShareCards)
        .innerJoin(scoreRounds, eq(scoreRounds.id, scoreRoundShareCards.roundId))
        .orderBy(desc(scoreRoundShareCards.createdAt))
        .limit(200);

      const roundIds = cards.map((card) => card.roundId);
      const winners =
        roundIds.length > 0
          ? await db
              .select({
                roundId: scorePlayers.roundId,
                name: scorePlayers.name,
                rank: scorePlayers.rank,
              })
              .from(scorePlayers)
              .where(inArray(scorePlayers.roundId, roundIds))
          : [];
      const winnerByRound = new Map<number, string>();
      for (const player of winners) {
        if (player.rank === 1 && !winnerByRound.has(player.roundId)) {
          winnerByRound.set(player.roundId, player.name);
        }
      }

      const gallery = await db
        .select({ imageUrl: tvPromos.imageUrl })
        .from(tvPromos)
        .where(and(eq(tvPromos.slot, "gallery"), eq(tvPromos.active, true)));
      const onTv = new Set(gallery.map((row) => row.imageUrl).filter((url): url is string => Boolean(url)));

      return {
        items: cards.map((card) => {
          const imageUrl = shareCardPublicUrl(card.roundId, card.createdAt);
          const winnerName = winnerByRound.get(card.roundId) ?? "";
          return {
            roundId: card.roundId,
            gameType: card.gameType,
            completedAt: card.completedAt.toISOString(),
            winnerName,
            imageUrl,
            downloadUrl: `/api/v1/admin/game-photos/${card.roundId}/file?download=1`,
            hidden: card.hidden,
            onTv: onTv.has(imageUrl),
          };
        }),
      };
    });

    scoped.post("/admin/game-photos/:id/tv", async (request, reply) => {
      const params = roundIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: "Validation failed" });
      }

      const [card] = await db
        .select({
          roundId: scoreRoundShareCards.roundId,
          createdAt: scoreRoundShareCards.createdAt,
          gameType: scoreRounds.gameType,
        })
        .from(scoreRoundShareCards)
        .innerJoin(scoreRounds, eq(scoreRounds.id, scoreRoundShareCards.roundId))
        .where(and(eq(scoreRoundShareCards.roundId, params.data.id), eq(scoreRounds.hidden, false)))
        .limit(1);

      if (!card) {
        return reply.status(404).send({ error: "Fotka ze hry chybí" });
      }

      const [winner] = await db
        .select({ name: scorePlayers.name })
        .from(scorePlayers)
        .where(and(eq(scorePlayers.roundId, card.roundId), eq(scorePlayers.rank, 1)))
        .limit(1);

      const imageUrl = shareCardPublicUrl(card.roundId, card.createdAt);
      const [existing] = await db
        .select()
        .from(tvPromos)
        .where(and(eq(tvPromos.slot, "gallery"), eq(tvPromos.imageUrl, imageUrl)))
        .limit(1);
      if (existing) {
        return { item: existing, already: true };
      }

      const [item] = await db
        .insert(tvPromos)
        .values({
          slot: "gallery",
          category: "venue",
          title: "Fotka ze hry",
          message: `${winner?.name ?? "Kšírovka"} · ${GAME_LABELS[card.gameType] ?? card.gameType}`,
          imageUrl,
          active: true,
          sortOrder: 0,
        })
        .returning();

      return reply.status(201).send({ item });
    });

    scoped.get("/admin/game-photos/:id/file", async (request, reply) => {
      const params = roundIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: "Validation failed" });
      }

      const [card] = await db
        .select({
          mime: scoreRoundShareCards.mime,
          data: scoreRoundShareCards.data,
          createdAt: scoreRoundShareCards.createdAt,
          winnerName: scorePlayers.name,
        })
        .from(scoreRoundShareCards)
        .leftJoin(
          scorePlayers,
          and(eq(scorePlayers.roundId, scoreRoundShareCards.roundId), eq(scorePlayers.rank, 1)),
        )
        .where(eq(scoreRoundShareCards.roundId, params.data.id))
        .limit(1);

      if (!card) {
        return reply.status(404).send({ error: "Fotka ze hry chybí" });
      }

      const download = (request.query as { download?: string }).download === "1";
      return sendStoredImage(
        reply,
        card.mime,
        card.data,
        download ? photoDownloadFilename(card.createdAt, card.winnerName ?? "kolo", "hra") : undefined,
      );
    });

    scoped.get("/admin/profile-photos", async () => {
      const rows = await db
        .select({
          id: scoreProfiles.id,
          nickname: scoreProfiles.nickname,
          name: scoreProfiles.name,
          updatedAt: scoreProfiles.updatedAt,
        })
        .from(scoreProfiles)
        .where(isNotNull(scoreProfiles.photoMime))
        .orderBy(desc(scoreProfiles.updatedAt));

      return {
        items: rows.map((row) => ({
          id: row.id,
          nickname: row.nickname,
          name: row.name,
          updatedAt: row.updatedAt.toISOString(),
          imageUrl: profilePhotoPublicUrl(row.id, row.updatedAt),
          downloadUrl: `/api/v1/admin/profile-photos/${row.id}/file?download=1`,
        })),
      };
    });

    scoped.get("/admin/profile-photos/:id/file", async (request, reply) => {
      const params = roundIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: "Validation failed" });
      }

      const [row] = await db
        .select({
          mime: scoreProfiles.photoMime,
          data: scoreProfiles.photo,
          nickname: scoreProfiles.nickname,
          updatedAt: scoreProfiles.updatedAt,
        })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.id, params.data.id))
        .limit(1);

      if (!row?.mime || !row.data) {
        return reply.status(404).send({ error: "Profilová fotka chybí" });
      }

      const download = (request.query as { download?: string }).download === "1";
      return sendStoredImage(
        reply,
        row.mime,
        row.data,
        download ? photoDownloadFilename(row.updatedAt, row.nickname, "profil") : undefined,
      );
    });

    scoped.get("/admin/course", async () => {
      const games = await getCourseGames();
      return { games };
    });

    scoped.patch("/admin/course", async (request, reply) => {
      const parsed = courseHolePatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }
      if (
        parsed.data.closed === undefined &&
        parsed.data.par === undefined &&
        parsed.data.imageUrl === undefined &&
        parsed.data.tip === undefined
      ) {
        return reply.status(400).send({ error: "Chybí údaj k uložení" });
      }
      const hole = await patchCourseHole(parsed.data);
      const games = await getCourseGames();
      return { hole, games };
    });

    scoped.post(
      "/admin/course/image",
      { bodyLimit: 3_500_000 },
      async (request, reply) => {
        const parsed = uploadCourseImageSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: "Validation failed",
            details: parsed.error.flatten(),
          });
        }
        const decoded = decodeShareCard(parsed.data.image);
        if ("error" in decoded) {
          const status = decoded.error === "size" ? 413 : 400;
          const message =
            decoded.error === "type"
              ? "Nahraj PNG nebo JPEG"
              : decoded.error === "size"
                ? "Soubor je moc velký (max 2,5 MB)"
                : "Soubor se nepodařilo přečíst";
          return reply.status(status).send({ error: message });
        }
        const hole = await saveCourseHoleImage({
          gameType: parsed.data.gameType,
          hole: parsed.data.hole,
          mime: decoded.mime,
          data: decoded.data,
        });
        const games = await getCourseGames();
        return { hole, games };
      },
    );

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

    scoped.post(
      "/admin/promos/:id/image",
      { bodyLimit: 3_500_000 },
      async (request, reply) => {
        const id = Number((request.params as { id: string }).id);
        if (!Number.isInteger(id) || id < 1) {
          return reply.status(400).send({ error: "Neplatné id" });
        }
        const parsed = uploadPromoImageSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: "Validation failed",
            details: parsed.error.flatten(),
          });
        }
        const decoded = decodeShareCard(parsed.data.image);
        if ("error" in decoded) {
          const status = decoded.error === "size" ? 413 : 400;
          const message =
            decoded.error === "type"
              ? "Nahraj PNG nebo JPEG"
              : decoded.error === "size"
                ? "Soubor je moc velký (max 2,5 MB)"
                : "Soubor se nepodařilo přečíst";
          return reply.status(status).send({ error: message });
        }
        try {
          const item = await savePromoImage({
            promoId: id,
            mime: decoded.mime,
            data: decoded.data,
          });
          return { item };
        } catch {
          return reply.status(404).send({ error: "Reklama nenalezena" });
        }
      },
    );

    scoped.delete("/admin/promos/:id/image", async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id) || id < 1) {
        return reply.status(400).send({ error: "Neplatné id" });
      }
      const item = await deletePromoImage(id);
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
        settings: serializeTvDataSettings(settings),
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
        settings: serializeTvDataSettings(settings),
        counts,
      };
    });

    scoped.post("/admin/tv-data/reset-podium", async () => {
      const settings = await resetTvPodium();
      const counts = await countTvData();
      return {
        settings: serializeTvDataSettings(settings),
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
