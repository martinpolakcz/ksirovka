import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  scoreHoleScores,
  scoreNoticeTargets,
  scoreNotices,
  scorePlayers,
  scoreProfiles,
  scoreRoundShareCards,
  scoreRounds,
} from "../db/schema.js";
import {
  absolutizeCourseImages,
  getCourseGames,
  isOfficialRound,
  openHoleNumbers,
  publicOrigin,
} from "../lib/course.js";
import { config } from "../config.js";
import {
  HOLE_PARS,
  getPeriodBounds,
  nicknameHeldByOther,
  normalizeEmail,
  normalizePlayerName,
  periodTruncUnit,
} from "../lib/scorecard.js";
import { rememberProfileDevice } from "../lib/marketing.js";
import { decodeShareCard, profilePhotoPublicUrl, shareCardPublicUrl } from "../lib/share-card.js";
import { markNoticeReadSchema } from "../schemas/admin.js";
import {
  clientRoundIdParamSchema,
  lookupProfileQuerySchema,
  roundIdParamSchema,
  statsQuerySchema,
  submitRoundSchema,
  uploadShareCardSchema,
  upsertProfileSchema,
  type GameType,
} from "../schemas/scorecard.js";

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    const candidate = current as { code?: string; cause?: unknown; message?: string };
    if (candidate.code === "23505") return true;
    if (typeof candidate.message === "string" && candidate.message.includes("duplicate key")) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

export async function scorecardRoutes(app: FastifyInstance) {
  app.get("/scorecard/course", async (request) => {
    const games = await getCourseGames();
    return { games: absolutizeCourseImages(games, publicOrigin(request)) };
  });

  app.post(
    "/scorecard/rounds",
    {
      config: {
        rateLimit: {
          max: config.SCORECARD_RATE_LIMIT_MAX,
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `scorecard:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const parsed = submitRoundSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const round = parsed.data;
      const playerIds = new Set(round.players.map((p) => p.id));
      if (round.results.some((r) => !playerIds.has(r.playerId))) {
        return reply.status(400).send({ error: "Result player does not match roster" });
      }

      try {
        const saved = await db.transaction(async (tx) => {
          const [inserted] = await tx
            .insert(scoreRounds)
            .values({
              clientRoundId: round.id,
              gameType: round.gameType,
              format: round.format,
              startedAt: new Date(round.startedAt),
              completedAt: new Date(round.completedAt),
              finishedEarly: round.finishedEarly ?? false,
              holesPlayed:
                round.holesPlayed ??
                round.holes.filter((hole) =>
                  Object.values(hole.scores).some((score) => typeof score === "number" && score > 0),
                ).length,
              submittedByEmail: round.submittedBy?.email ?? null,
              submittedByName: round.submittedBy?.name ?? null,
            })
            .returning({ id: scoreRounds.id });

          if (!inserted) {
            throw new Error("Failed to insert round");
          }

          for (const result of round.results) {
            const player = round.players.find((p) => p.id === result.playerId);
            const [playerRow] = await tx
              .insert(scorePlayers)
              .values({
                roundId: inserted.id,
                clientPlayerId: result.playerId,
                name: player?.name ?? result.playerName,
                nameNormalized: normalizePlayerName(player?.name ?? result.playerName),
                total: result.total,
                rank: result.rank,
                bestHole: result.bestHole.hole,
                bestHoleScore: result.bestHole.score,
                worstHole: result.worstHole.hole,
                worstHoleScore: result.worstHole.score,
              })
              .returning({ id: scorePlayers.id });

            if (!playerRow) continue;

            const holeRows = round.holes
              .map((hole) => {
                const score = hole.scores[result.playerId];
                if (score == null || score <= 0) return null;
                return {
                  roundId: inserted.id,
                  playerId: playerRow.id,
                  hole: hole.hole,
                  score,
                };
              })
              .filter((row): row is NonNullable<typeof row> => row !== null);

            if (holeRows.length > 0) {
              await tx.insert(scoreHoleScores).values(holeRows);
            }
          }

          return inserted.id;
        });

        await rememberProfileDevice({
          email: round.submittedBy?.email,
          platform: round.submittedBy?.platform,
          locale: round.submittedBy?.locale,
        });
        return { success: true, id: saved };
      } catch (error) {
        if (isUniqueViolation(error)) {
          await rememberProfileDevice({
            email: parsed.data.submittedBy?.email,
            platform: parsed.data.submittedBy?.platform,
            locale: parsed.data.submittedBy?.locale,
          });
          return { success: true, duplicate: true };
        }
        throw error;
      }
    },
  );

  app.post(
    "/scorecard/rounds/:clientRoundId/share-card",
    {
      bodyLimit: 3_500_000,
      config: {
        rateLimit: {
          max: Math.min(config.SCORECARD_RATE_LIMIT_MAX, 12),
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `share-card:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const params = clientRoundIdParamSchema.safeParse(request.params);
      const parsed = uploadShareCardSchema.safeParse(request.body);
      if (!params.success || !parsed.success) {
        return reply.status(400).send({ error: "Validation failed" });
      }

      const decoded = decodeShareCard(parsed.data.image);
      if ("error" in decoded) {
        const status = decoded.error === "size" ? 413 : 400;
        return reply.status(status).send({ error: decoded.error });
      }

      const [round] = await db
        .select({ id: scoreRounds.id })
        .from(scoreRounds)
        .where(eq(scoreRounds.clientRoundId, params.data.clientRoundId))
        .limit(1);

      if (!round) {
        return reply.status(404).send({ error: "not_found" });
      }

      const now = new Date();
      await db
        .insert(scoreRoundShareCards)
        .values({
          roundId: round.id,
          mime: decoded.mime,
          data: decoded.data,
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: scoreRoundShareCards.roundId,
          set: {
            mime: decoded.mime,
            data: decoded.data,
            createdAt: now,
          },
        });

      return { success: true, url: shareCardPublicUrl(round.id, now) };
    },
  );

  app.get("/scorecard/share-cards/:id", async (request, reply) => {
    const params = roundIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Validation failed" });
    }

    const [card] = await db
      .select({
        mime: scoreRoundShareCards.mime,
        data: scoreRoundShareCards.data,
      })
      .from(scoreRoundShareCards)
      .innerJoin(scoreRounds, eq(scoreRounds.id, scoreRoundShareCards.roundId))
      .where(and(eq(scoreRoundShareCards.roundId, params.data.id), eq(scoreRounds.hidden, false)))
      .limit(1);

    if (!card) {
      return reply.status(404).send({ error: "not_found" });
    }

    const bytes = Buffer.isBuffer(card.data) ? card.data : Buffer.from(card.data);
    return reply
      .header("Cache-Control", "public, max-age=30")
      .header("Cross-Origin-Resource-Policy", "cross-origin")
      .type(card.mime)
      .send(bytes);
  });

  app.get("/scorecard/profile-photos/:id", async (request, reply) => {
    const params = roundIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Validation failed" });
    }

    const [row] = await db
      .select({
        mime: scoreProfiles.photoMime,
        data: scoreProfiles.photo,
      })
      .from(scoreProfiles)
      .where(eq(scoreProfiles.id, params.data.id))
      .limit(1);

    if (!row?.mime || !row.data) {
      return reply.status(404).send({ error: "not_found" });
    }

    const bytes = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
    return reply
      .header("Cache-Control", "public, max-age=300")
      .header("Cross-Origin-Resource-Policy", "cross-origin")
      .type(row.mime)
      .send(bytes);
  });

  app.post(
    "/scorecard/profile",
    {
      bodyLimit: 3_500_000,
      config: {
        rateLimit: {
          max: config.SCORECARD_RATE_LIMIT_MAX,
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `scorecard-profile:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const parsed = upsertProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const email = parsed.data.email.trim();
      const name = parsed.data.name.trim();
      const nickname = parsed.data.nickname.trim();
      const emailNormalized = normalizeEmail(email);
      const nicknameNormalized = normalizePlayerName(nickname);
      const photo = parsed.data.photo ? decodeShareCard(parsed.data.photo) : null;
      if (photo && "error" in photo) {
        const status = photo.error === "size" ? 413 : 400;
        const message =
          photo.error === "type"
            ? "Nahraj PNG nebo JPEG"
            : photo.error === "size"
              ? "Soubor je moc velký (max 2,5 MB)"
              : "Fotku se nepodařilo přečíst";
        return reply.status(status).send({ error: message });
      }

      const [byNickname] = await db
        .select({ emailNormalized: scoreProfiles.emailNormalized })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.nicknameNormalized, nicknameNormalized))
        .limit(1);

      if (byNickname && byNickname.emailNormalized !== emailNormalized) {
        return reply.status(409).send({ error: "nickname_taken" });
      }

      const usedInRounds = await db
        .select({ email: scoreRounds.submittedByEmail })
        .from(scorePlayers)
        .innerJoin(scoreRounds, eq(scorePlayers.roundId, scoreRounds.id))
        .where(eq(scorePlayers.nameNormalized, nicknameNormalized))
        .limit(40);

      if (nicknameHeldByOther(email, usedInRounds)) {
        return reply.status(409).send({ error: "nickname_taken" });
      }

      const now = new Date();
      const [existing] = await db
        .select({
          id: scoreProfiles.id,
          birthYear: scoreProfiles.birthYear,
          photoMime: scoreProfiles.photoMime,
        })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.emailNormalized, emailNormalized))
        .limit(1);

      const device: { platform?: string; locale?: string } = {};
      if (parsed.data.platform) device.platform = parsed.data.platform;
      if (parsed.data.locale) device.locale = parsed.data.locale;

      const fullSave =
        parsed.data.birthYear != null || parsed.data.photo != null || parsed.data.noticesOptIn != null;
      if (!existing && fullSave) {
        if (parsed.data.birthYear == null || parsed.data.noticesOptIn !== true || !photo || "error" in photo) {
          return reply.status(400).send({ error: "profile_incomplete" });
        }
      }
      if (existing && fullSave) {
        if (parsed.data.birthYear == null && existing.birthYear == null) {
          return reply.status(400).send({ error: "profile_incomplete" });
        }
        if (parsed.data.noticesOptIn !== true) {
          return reply.status(400).send({ error: "profile_incomplete" });
        }
        if (!photo && !existing.photoMime) {
          return reply.status(400).send({ error: "profile_incomplete" });
        }
      }

      const photoFields =
        photo && !("error" in photo) ? { photoMime: photo.mime, photo: photo.data } : {};
      const extra = {
        ...(parsed.data.birthYear != null ? { birthYear: parsed.data.birthYear } : {}),
        ...(parsed.data.noticesOptIn != null ? { noticesOptIn: parsed.data.noticesOptIn } : {}),
        ...photoFields,
      };

      if (existing) {
        await db
          .update(scoreProfiles)
          .set({
            email,
            name,
            nickname,
            nicknameNormalized,
            ...device,
            ...extra,
            updatedAt: now,
          })
          .where(eq(scoreProfiles.id, existing.id));
      } else {
        await db.insert(scoreProfiles).values({
          email,
          emailNormalized,
          name,
          nickname,
          nicknameNormalized,
          platform: device.platform ?? null,
          locale: device.locale ?? null,
          birthYear: parsed.data.birthYear ?? null,
          noticesOptIn: parsed.data.noticesOptIn ?? false,
          ...photoFields,
        });
      }

      return { success: true, nickname };
    },
  );

  app.get(
    "/scorecard/profile",
    {
      config: {
        rateLimit: {
          max: config.SCORECARD_RATE_LIMIT_MAX,
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `scorecard-profile-lookup:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const parsed = lookupProfileQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const emailNormalized = normalizeEmail(parsed.data.email);
      const [profile] = await db
        .select({
          id: scoreProfiles.id,
          email: scoreProfiles.email,
          name: scoreProfiles.name,
          nickname: scoreProfiles.nickname,
          birthYear: scoreProfiles.birthYear,
          noticesOptIn: scoreProfiles.noticesOptIn,
          photoMime: scoreProfiles.photoMime,
          updatedAt: scoreProfiles.updatedAt,
        })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.emailNormalized, emailNormalized))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({ error: "not_found" });
      }

      return {
        email: profile.email,
        name: profile.name,
        nickname: profile.nickname,
        birthYear: profile.birthYear,
        noticesOptIn: profile.noticesOptIn,
        photoUrl: profile.photoMime ? profilePhotoPublicUrl(profile.id, profile.updatedAt) : null,
      };
    },
  );

  app.get(
    "/scorecard/notices",
    {
      config: {
        rateLimit: {
          max: config.SCORECARD_RATE_LIMIT_MAX,
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `scorecard-notices:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const parsed = lookupProfileQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const emailNormalized = normalizeEmail(parsed.data.email);
      const [profile] = await db
        .select({
          id: scoreProfiles.id,
          noticesOptIn: scoreProfiles.noticesOptIn,
        })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.emailNormalized, emailNormalized))
        .limit(1);

      if (!profile || !profile.noticesOptIn) {
        return { items: [] };
      }

      const rows = await db
        .select({
          id: scoreNotices.id,
          kind: scoreNotices.kind,
          title: scoreNotices.title,
          message: scoreNotices.message,
          createdAt: scoreNotices.createdAt,
          readAt: scoreNoticeTargets.readAt,
        })
        .from(scoreNoticeTargets)
        .innerJoin(scoreNotices, eq(scoreNotices.id, scoreNoticeTargets.noticeId))
        .where(eq(scoreNoticeTargets.profileId, profile.id))
        .orderBy(desc(scoreNotices.createdAt))
        .limit(20);

      return {
        items: rows
          .filter((row) => !row.readAt)
          .map((row) => ({
            id: row.id,
            kind: row.kind,
            title: row.title,
            message: row.message,
            createdAt: row.createdAt.toISOString(),
          })),
      };
    },
  );

  app.post(
    "/scorecard/notices/:id/read",
    {
      config: {
        rateLimit: {
          max: config.SCORECARD_RATE_LIMIT_MAX,
          timeWindow: config.SCORECARD_RATE_LIMIT_WINDOW_MS,
          keyGenerator: (req) => `scorecard-notices-read:${req.ip}`,
        },
      },
    },
    async (request, reply) => {
      const params = roundIdParamSchema.safeParse(request.params);
      const body = markNoticeReadSchema.safeParse(request.body);
      if (!params.success || !body.success) {
        return reply.status(400).send({ error: "Validation failed" });
      }

      const [profile] = await db
        .select({ id: scoreProfiles.id })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.emailNormalized, normalizeEmail(body.data.email)))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({ error: "not_found" });
      }

      await db
        .update(scoreNoticeTargets)
        .set({ readAt: new Date() })
        .where(
          and(eq(scoreNoticeTargets.noticeId, params.data.id), eq(scoreNoticeTargets.profileId, profile.id)),
        );

      return { ok: true };
    },
  );

  app.get("/scorecard/stats", async (request, reply) => {
    const parsed = statsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { period, gameType } = parsed.data;
    const bounds = getPeriodBounds(period);
    const unit = periodTruncUnit(period);

    const periodFilter = sql`timezone('Europe/Prague', ${scoreRounds.completedAt}) >= date_trunc(${unit}, timezone('Europe/Prague', now()))`;
    const visibleFilter = eq(scoreRounds.hidden, false);
    const filters = gameType
      ? and(periodFilter, visibleFilter, eq(scoreRounds.gameType, gameType))
      : and(periodFilter, visibleFilter);

    const rounds = await db
      .select()
      .from(scoreRounds)
      .where(filters)
      .orderBy(desc(scoreRounds.completedAt));

    const course = await getCourseGames();
    const openByGame = new Map<GameType, number[]>(
      (Object.keys(course) as GameType[]).map((game) => [game, openHoleNumbers(course[game])]),
    );

    const allIds = rounds.map((r) => r.id);
    const candidateIds = rounds.filter((r) => !r.finishedEarly).map((r) => r.id);

    const players =
      allIds.length > 0
        ? await db.select().from(scorePlayers).where(inArray(scorePlayers.roundId, allIds))
        : [];

    const candidateHoleScores =
      candidateIds.length > 0
        ? await db.select().from(scoreHoleScores).where(inArray(scoreHoleScores.roundId, candidateIds))
        : [];

    const holesByRound = new Map<number, typeof candidateHoleScores>();
    for (const row of candidateHoleScores) {
      const list = holesByRound.get(row.roundId) ?? [];
      list.push(row);
      holesByRound.set(row.roundId, list);
    }

    const playersByRoundId = new Map<number, typeof players>();
    for (const player of players) {
      const list = playersByRoundId.get(player.roundId) ?? [];
      list.push(player);
      playersByRoundId.set(player.roundId, list);
    }

    const officialRounds = rounds.filter((round) =>
      isOfficialRound({
        finishedEarly: round.finishedEarly,
        openHoles: openByGame.get(round.gameType as GameType) ?? [],
        playerIds: (playersByRoundId.get(round.id) ?? []).map((player) => player.id),
        scored: holesByRound.get(round.id) ?? [],
      }),
    );
    const officialIds = officialRounds.map((r) => r.id);
    const holeScores = candidateHoleScores.filter((row) => officialIds.includes(row.roundId));
    const playersByRound = playersByRoundId;

    const officialPlayers = players.filter((p) => officialIds.includes(p.roundId));
    const playerMap = new Map<
      string,
      {
        playerName: string;
        bestTotal: number;
        gameType: GameType;
        totals: number[];
        rounds: number;
      }
    >();

    for (const player of officialPlayers) {
      const round = officialRounds.find((r) => r.id === player.roundId);
      if (!round) continue;
      const key = `${player.nameNormalized}:${round.gameType}`;
      const existing = playerMap.get(key);
      if (!existing) {
        playerMap.set(key, {
          playerName: player.name,
          bestTotal: player.total,
          gameType: round.gameType as GameType,
          totals: [player.total],
          rounds: 1,
        });
        continue;
      }
      existing.rounds += 1;
      existing.totals.push(player.total);
      if (player.total < existing.bestTotal) {
        existing.bestTotal = player.total;
        existing.playerName = player.name;
      }
    }

    const photoRows = await db
      .select({
        id: scoreProfiles.id,
        nicknameNormalized: scoreProfiles.nicknameNormalized,
        photoMime: scoreProfiles.photoMime,
        updatedAt: scoreProfiles.updatedAt,
      })
      .from(scoreProfiles);
    const photoByNick = new Map<string, string>();
    for (const row of photoRows) {
      if (row.photoMime) {
        photoByNick.set(row.nicknameNormalized, profilePhotoPublicUrl(row.id, row.updatedAt));
      }
    }

    const playerLeaderboard = [...playerMap.values()]
      .map((entry) => ({
        playerName: entry.playerName,
        gameType: entry.gameType,
        bestTotal: entry.bestTotal,
        avgTotal: Math.round((entry.totals.reduce((sum, n) => sum + n, 0) / entry.rounds) * 10) / 10,
        rounds: entry.rounds,
        photoUrl: photoByNick.get(normalizePlayerName(entry.playerName)) ?? null,
      }))
      .sort((a, b) => a.bestTotal - b.bestTotal || a.avgTotal - b.avgTotal || b.rounds - a.rounds)
      .slice(0, 25)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    const holeMap = new Map<
      string,
      {
        hole: number;
        gameType: GameType;
        scores: number[];
        bestScore: number;
        bestPlayer: string;
      }
    >();

    const playerNameById = new Map(players.map((p) => [p.id, p.name]));
    const roundTypeById = new Map(officialRounds.map((r) => [r.id, r.gameType as GameType]));

    for (const row of holeScores) {
      const game = roundTypeById.get(row.roundId);
      if (!game) continue;
      const key = `${game}:${row.hole}`;
      const existing = holeMap.get(key);
      if (!existing) {
        holeMap.set(key, {
          hole: row.hole,
          gameType: game,
          scores: [row.score],
          bestScore: row.score,
          bestPlayer: playerNameById.get(row.playerId) ?? "",
        });
        continue;
      }
      existing.scores.push(row.score);
      if (row.score < existing.bestScore) {
        existing.bestScore = row.score;
        existing.bestPlayer = playerNameById.get(row.playerId) ?? existing.bestPlayer;
      }
    }

    const holeLeaderboard = [...holeMap.values()]
      .map((entry) => {
        const par =
          course[entry.gameType].find((hole) => hole.hole === entry.hole)?.par ??
          HOLE_PARS[entry.gameType][entry.hole - 1] ??
          2;
        const avgScore =
          Math.round((entry.scores.reduce((sum, n) => sum + n, 0) / entry.scores.length) * 10) / 10;
        return {
          hole: entry.hole,
          gameType: entry.gameType,
          par,
          avgScore,
          vsPar: Math.round((avgScore - par) * 10) / 10,
          bestScore: entry.bestScore,
          bestPlayer: entry.bestPlayer,
          plays: entry.scores.length,
        };
      })
      .sort((a, b) => a.hole - b.hole || a.gameType.localeCompare(b.gameType));

    const hardestHoles = [...holeLeaderboard].sort((a, b) => b.vsPar - a.vsPar).slice(0, 5);

    const shareCards =
      allIds.length > 0
        ? await db
            .select({
              roundId: scoreRoundShareCards.roundId,
              createdAt: scoreRoundShareCards.createdAt,
            })
            .from(scoreRoundShareCards)
            .where(inArray(scoreRoundShareCards.roundId, allIds))
        : [];
    const shareCardByRound = new Map(shareCards.map((row) => [row.roundId, row.createdAt]));

    const recentRounds = rounds.slice(0, 12).map((round) => {
      const roster = (playersByRound.get(round.id) ?? []).sort((a, b) => a.rank - b.rank);
      const winner = roster[0];
      const shareAt = shareCardByRound.get(round.id);
      return {
        id: round.id,
        gameType: round.gameType,
        format: round.format,
        completedAt: round.completedAt.toISOString(),
        finishedEarly: round.finishedEarly,
        holesPlayed: round.holesPlayed,
        playerCount: roster.length,
        winnerName: winner?.name ?? "",
        winnerTotal: winner?.total ?? 0,
        winnerPhotoUrl: winner ? photoByNick.get(normalizePlayerName(winner.name)) ?? null : null,
        shareCardUrl: shareAt ? shareCardPublicUrl(round.id, shareAt) : null,
        standings: roster.slice(0, 6).map((p) => ({
          name: p.name,
          total: p.total,
          rank: p.rank,
          photoUrl: photoByNick.get(normalizePlayerName(p.name)) ?? null,
        })),
      };
    });

    const uniquePlayers = new Set(officialPlayers.map((p) => p.nameNormalized));
    const best = playerLeaderboard[0];

    return {
      period,
      gameType: gameType ?? null,
      from: bounds.from,
      to: bounds.to,
      summary: {
        rounds: officialRounds.length,
        players: uniquePlayers.size,
        bestScore: best
          ? {
              playerName: best.playerName,
              total: best.bestTotal,
              gameType: best.gameType,
            }
          : null,
      },
      playerLeaderboard,
      holeLeaderboard,
      hardestHoles,
      recentRounds,
    };
  });
}
