import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { scoreCourseHoles } from "../db/schema.js";
import { HOLE_COUNT, HOLE_PARS } from "./scorecard.js";
import { gameTypes, type GameType } from "../schemas/scorecard.js";

export interface CourseHole {
  hole: number;
  par: number;
  closed: boolean;
}

export type CourseGames = Record<GameType, CourseHole[]>;

export function defaultHolesFor(gameType: GameType): CourseHole[] {
  return Array.from({ length: HOLE_COUNT }, (_, i) => ({
    hole: i + 1,
    par: HOLE_PARS[gameType][i] ?? 2,
    closed: false,
  }));
}

export function defaultCourseGames(): CourseGames {
  return {
    fotbalgolf: defaultHolesFor("fotbalgolf"),
    minigolf: defaultHolesFor("minigolf"),
    adventure: defaultHolesFor("adventure"),
  };
}

export function openHoleNumbers(holes: CourseHole[]): number[] {
  return holes.filter((hole) => !hole.closed).map((hole) => hole.hole);
}

export function isOfficialRound(input: {
  finishedEarly: boolean;
  openHoles: number[];
  playerIds: number[];
  scored: Array<{ playerId: number; hole: number }>;
}): boolean {
  if (input.finishedEarly || input.openHoles.length === 0 || input.playerIds.length === 0) {
    return false;
  }
  const scored = new Set(input.scored.map((row) => `${row.playerId}:${row.hole}`));
  return input.playerIds.every((playerId) =>
    input.openHoles.every((hole) => scored.has(`${playerId}:${hole}`)),
  );
}

function emptyGames(): CourseGames {
  return { fotbalgolf: [], minigolf: [], adventure: [] };
}

function isGameType(value: string): value is GameType {
  return (gameTypes as readonly string[]).includes(value);
}

export async function ensureCourseRows(): Promise<void> {
  const existing = await db.select({ id: scoreCourseHoles.id }).from(scoreCourseHoles).limit(1);
  if (existing.length > 0) return;

  const rows = gameTypes.flatMap((gameType) =>
    defaultHolesFor(gameType).map((hole) => ({
      gameType,
      hole: hole.hole,
      par: hole.par,
      closed: hole.closed,
    })),
  );
  await db.insert(scoreCourseHoles).values(rows);
}

export async function getCourseGames(): Promise<CourseGames> {
  await ensureCourseRows();
  const rows = await db.select().from(scoreCourseHoles);
  const games = emptyGames();
  for (const row of rows) {
    if (!isGameType(row.gameType)) continue;
    games[row.gameType].push({ hole: row.hole, par: row.par, closed: row.closed });
  }
  for (const gameType of gameTypes) {
    if (games[gameType].length === 0) {
      games[gameType] = defaultHolesFor(gameType);
    } else {
      games[gameType].sort((a, b) => a.hole - b.hole);
    }
  }
  return games;
}

export async function patchCourseHole(input: {
  gameType: GameType;
  hole: number;
  closed?: boolean;
  par?: number;
}): Promise<CourseHole> {
  await ensureCourseRows();
  const where = and(eq(scoreCourseHoles.gameType, input.gameType), eq(scoreCourseHoles.hole, input.hole));
  const [updated] = await db
    .update(scoreCourseHoles)
    .set({
      ...(input.closed !== undefined ? { closed: input.closed } : {}),
      ...(input.par !== undefined ? { par: input.par } : {}),
      updatedAt: new Date(),
    })
    .where(where)
    .returning();

  if (updated) {
    return { hole: updated.hole, par: updated.par, closed: updated.closed };
  }

  const [inserted] = await db
    .insert(scoreCourseHoles)
    .values({
      gameType: input.gameType,
      hole: input.hole,
      par: input.par ?? 2,
      closed: input.closed ?? false,
    })
    .returning();
  return { hole: inserted.hole, par: inserted.par, closed: inserted.closed };
}
