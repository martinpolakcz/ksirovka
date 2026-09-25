import { z } from "zod";

export const gameTypes = ["fotbalgolf", "minigolf", "adventure"] as const;
export const gameFormats = ["individual", "pairs", "foursome", "fourball"] as const;
export const statPeriods = ["day", "week", "month", "year"] as const;

const holeScoreSchema = z.object({
  hole: z.number().int().min(1).max(18),
  scores: z.record(z.string().min(1).max(80), z.number().int().min(1).max(20).nullable()),
});

const playerSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
});

const resultSchema = z.object({
  playerId: z.string().min(1).max(80),
  playerName: z.string().min(1).max(80),
  total: z.number().int().min(1).max(360),
  rank: z.number().int().min(1).max(20),
  bestHole: z.object({
    hole: z.number().int().min(1).max(18),
    score: z.number().int().min(1).max(20),
  }),
  worstHole: z.object({
    hole: z.number().int().min(1).max(18),
    score: z.number().int().min(1).max(20),
  }),
});

export const submitRoundSchema = z.object({
  id: z.string().min(1).max(80),
  gameType: z.enum(gameTypes),
  format: z.enum(gameFormats),
  players: z.array(playerSchema).min(1).max(10),
  holes: z.array(holeScoreSchema).length(18),
  startedAt: z.string().min(10).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  completedAt: z.string().min(10).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  results: z.array(resultSchema).min(1).max(10),
  finishedEarly: z.boolean().optional(),
  holesPlayed: z.number().int().min(1).max(18).optional(),
  submittedBy: z
    .object({
      email: z.string().email().max(255).optional(),
      name: z.string().min(1).max(80).optional(),
    })
    .optional(),
});

export const upsertProfileSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(2).max(80),
  nickname: z.string().trim().min(2).max(32),
});

export const statsQuerySchema = z.object({
  period: z.enum(statPeriods).default("week"),
  gameType: z.enum(gameTypes).optional(),
});

export type SubmitRoundInput = z.infer<typeof submitRoundSchema>;
export type StatsPeriod = (typeof statPeriods)[number];
export type GameType = (typeof gameTypes)[number];
