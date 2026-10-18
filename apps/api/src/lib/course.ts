import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { scoreCourseHoleImages, scoreCourseHoles } from "../db/schema.js";
import { HOLE_COUNT, HOLE_PARS } from "./scorecard.js";
import { gameTypes, type GameType } from "../schemas/scorecard.js";

export interface CourseHole {
  hole: number;
  par: number;
  closed: boolean;
  imageUrl: string | null;
  tip: string | null;
}

export type CourseGames = Record<GameType, CourseHole[]>;

export function defaultHolesFor(gameType: GameType): CourseHole[] {
  return Array.from({ length: HOLE_COUNT }, (_, i) => ({
    hole: i + 1,
    par: HOLE_PARS[gameType][i] ?? 2,
    closed: false,
    imageUrl: null,
    tip: null,
  }));
}

function toCourseHole(row: {
  hole: number;
  par: number;
  closed: boolean;
  imageUrl: string | null;
  tip: string | null;
}): CourseHole {
  return {
    hole: row.hole,
    par: row.par,
    closed: row.closed,
    imageUrl: row.imageUrl,
    tip: row.tip,
  };
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
    games[row.gameType].push(toCourseHole(row));
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

export function holeImagePublicPath(gameType: GameType, hole: number, version?: Date | number | null): string {
  const path = `/uploads/holes/${gameType}/${hole}`;
  if (version == null) return path;
  const stamp = version instanceof Date ? version.getTime() : version;
  return `${path}?v=${stamp}`;
}

export function publicOrigin(request: {
  protocol: string;
  hostname: string;
  headers?: { host?: string };
}): string {
  const host = request.headers?.host?.split(",")[0]?.trim();
  if (host) return `${request.protocol}://${host}`;
  return `${request.protocol}://${request.hostname}`;
}

export function absolutizeCourseImages(games: CourseGames, origin: string): CourseGames {
  const mapHole = (hole: CourseHole): CourseHole => {
    if (!hole.imageUrl) return hole;
    if (/^https?:\/\//i.test(hole.imageUrl)) return hole;
    const path = hole.imageUrl.startsWith("/") ? hole.imageUrl : `/${hole.imageUrl}`;
    return { ...hole, imageUrl: `${origin}${path}` };
  };
  return {
    fotbalgolf: games.fotbalgolf.map(mapHole),
    minigolf: games.minigolf.map(mapHole),
    adventure: games.adventure.map(mapHole),
  };
}

export async function saveCourseHoleImage(input: {
  gameType: GameType;
  hole: number;
  mime: string;
  data: Buffer;
}): Promise<CourseHole> {
  const now = new Date();
  const imageUrl = holeImagePublicPath(input.gameType, input.hole, now);
  await db
    .insert(scoreCourseHoleImages)
    .values({
      gameType: input.gameType,
      hole: input.hole,
      mime: input.mime,
      data: input.data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [scoreCourseHoleImages.gameType, scoreCourseHoleImages.hole],
      set: {
        mime: input.mime,
        data: input.data,
        updatedAt: now,
      },
    });
  return patchCourseHole({
    gameType: input.gameType,
    hole: input.hole,
    imageUrl,
  });
}

export async function getCourseHoleImage(
  gameType: GameType,
  hole: number,
): Promise<{ mime: string; data: Buffer } | null> {
  const [row] = await db
    .select({
      mime: scoreCourseHoleImages.mime,
      data: scoreCourseHoleImages.data,
    })
    .from(scoreCourseHoleImages)
    .where(and(eq(scoreCourseHoleImages.gameType, gameType), eq(scoreCourseHoleImages.hole, hole)))
    .limit(1);
  if (!row) return null;
  const data = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  return { mime: row.mime, data };
}

export async function deleteCourseHoleImage(gameType: GameType, hole: number): Promise<CourseHole> {
  await db
    .delete(scoreCourseHoleImages)
    .where(and(eq(scoreCourseHoleImages.gameType, gameType), eq(scoreCourseHoleImages.hole, hole)));
  return patchCourseHole({ gameType, hole, imageUrl: null });
}

export async function patchCourseHole(input: {
  gameType: GameType;
  hole: number;
  closed?: boolean;
  par?: number;
  imageUrl?: string | null;
  tip?: string | null;
}): Promise<CourseHole> {
  await ensureCourseRows();
  if (input.imageUrl === null) {
    await db
      .delete(scoreCourseHoleImages)
      .where(and(eq(scoreCourseHoleImages.gameType, input.gameType), eq(scoreCourseHoleImages.hole, input.hole)));
  }
  const where = and(eq(scoreCourseHoles.gameType, input.gameType), eq(scoreCourseHoles.hole, input.hole));
  const [updated] = await db
    .update(scoreCourseHoles)
    .set({
      ...(input.closed !== undefined ? { closed: input.closed } : {}),
      ...(input.par !== undefined ? { par: input.par } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.tip !== undefined ? { tip: input.tip } : {}),
      updatedAt: new Date(),
    })
    .where(where)
    .returning();

  if (updated) {
    return toCourseHole(updated);
  }

  const [inserted] = await db
    .insert(scoreCourseHoles)
    .values({
      gameType: input.gameType,
      hole: input.hole,
      par: input.par ?? 2,
      closed: input.closed ?? false,
      imageUrl: input.imageUrl ?? null,
      tip: input.tip ?? null,
    })
    .returning();
  return toCourseHole(inserted);
}
