import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { scoreHoleScores, scorePlayers, scoreProfiles, scoreRounds } from "../db/schema.js";
import { config } from "../config.js";
import {
  HOLE_PARS,
  getPeriodBounds,
  nicknameHeldByOther,
  normalizeEmail,
  normalizePlayerName,
  periodTruncUnit,
} from "../lib/scorecard.js";
import {
  statsQuerySchema,
  submitRoundSchema,
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
              holesPlayed: round.holesPlayed ?? (round.finishedEarly ? 1 : 18),
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

        return { success: true, id: saved };
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { success: true, duplicate: true };
        }
        throw error;
      }
    },
  );

  app.post(
    "/scorecard/profile",
    {
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
        .select({ id: scoreProfiles.id })
        .from(scoreProfiles)
        .where(eq(scoreProfiles.emailNormalized, emailNormalized))
        .limit(1);

      if (existing) {
        await db
          .update(scoreProfiles)
          .set({
            email,
            name,
            nickname,
            nicknameNormalized,
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
        });
      }

      return { success: true, nickname };
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

    const officialRounds = rounds.filter((r) => !r.finishedEarly && r.holesPlayed >= 18);
    const officialIds = officialRounds.map((r) => r.id);
    const allIds = rounds.map((r) => r.id);

    const players =
      allIds.length > 0
        ? await db.select().from(scorePlayers).where(inArray(scorePlayers.roundId, allIds))
        : [];

    const holeScores =
      officialIds.length > 0
        ? await db
            .select()
            .from(scoreHoleScores)
            .where(inArray(scoreHoleScores.roundId, officialIds))
        : [];

    const playersByRound = new Map<number, typeof players>();
    for (const player of players) {
      const list = playersByRound.get(player.roundId) ?? [];
      list.push(player);
      playersByRound.set(player.roundId, list);
    }

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

    const playerLeaderboard = [...playerMap.values()]
      .map((entry) => ({
        playerName: entry.playerName,
        gameType: entry.gameType,
        bestTotal: entry.bestTotal,
        avgTotal: Math.round((entry.totals.reduce((sum, n) => sum + n, 0) / entry.rounds) * 10) / 10,
        rounds: entry.rounds,
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
        const par = HOLE_PARS[entry.gameType][entry.hole - 1] ?? 3;
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

    const recentRounds = rounds.slice(0, 12).map((round) => {
      const roster = (playersByRound.get(round.id) ?? []).sort((a, b) => a.rank - b.rank);
      const winner = roster[0];
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
        standings: roster.slice(0, 6).map((p) => ({
          name: p.name,
          total: p.total,
          rank: p.rank,
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
