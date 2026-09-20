import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { scoreRounds, tvDataSettings, type TvDataSettings } from "../db/schema.js";
import { pragueYmd } from "./scorecard.js";

const TIME_ZONE = "Europe/Prague";

export type PurgeScope =
  | { scope: "all" }
  | { scope: "today" }
  | { scope: "older_than"; days: number }
  | { scope: "ids"; ids: number[] };

export function pragueHour(date = new Date()): number {
  const raw = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return Number(raw);
}

export function samePragueDay(a: Date, b: Date): boolean {
  const left = pragueYmd(a);
  const right = pragueYmd(b);
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function shouldRunRetention(
  settings: Pick<TvDataSettings, "retentionEnabled" | "runHour" | "lastPurgeAt">,
  now = new Date(),
): boolean {
  if (!settings.retentionEnabled) return false;
  if (pragueHour(now) < settings.runHour) return false;
  if (settings.lastPurgeAt && samePragueDay(settings.lastPurgeAt, now)) return false;
  return true;
}

function olderThanFilter(days: number) {
  return sql`timezone('Europe/Prague', ${scoreRounds.completedAt}) < date_trunc('day', timezone('Europe/Prague', now())) - (${days}::int * interval '1 day')`;
}

function todayFilter() {
  return sql`timezone('Europe/Prague', ${scoreRounds.completedAt}) >= date_trunc('day', timezone('Europe/Prague', now()))`;
}

export async function getTvDataSettings(): Promise<TvDataSettings> {
  const [existing] = await db.select().from(tvDataSettings).where(eq(tvDataSettings.id, 1));
  if (existing) return existing;

  const [created] = await db
    .insert(tvDataSettings)
    .values({ id: 1 })
    .onConflictDoNothing({ target: tvDataSettings.id })
    .returning();
  if (created) return created;

  const [row] = await db.select().from(tvDataSettings).where(eq(tvDataSettings.id, 1));
  if (!row) {
    throw new Error("Nepodařilo se načíst nastavení TV dat");
  }
  return row;
}

export async function saveTvDataSettings(input: {
  retentionEnabled: boolean;
  retentionDays: number;
  runHour: number;
}): Promise<TvDataSettings> {
  await getTvDataSettings();
  const [item] = await db
    .update(tvDataSettings)
    .set({
      retentionEnabled: input.retentionEnabled,
      retentionDays: input.retentionDays,
      runHour: input.runHour,
      updatedAt: new Date(),
    })
    .where(eq(tvDataSettings.id, 1))
    .returning();
  if (!item) {
    throw new Error("Nepodařilo se uložit nastavení TV dat");
  }
  return item;
}

export async function countRounds(scope: PurgeScope): Promise<number> {
  const where = purgeWhere(scope);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scoreRounds)
    .where(where);
  return row?.count ?? 0;
}

export async function countTvData(): Promise<{ total: number; today: number; olderThanRetention: number }> {
  const settings = await getTvDataSettings();
  const [total, today, olderThanRetention] = await Promise.all([
    countRounds({ scope: "all" }),
    countRounds({ scope: "today" }),
    countRounds({ scope: "older_than", days: settings.retentionDays }),
  ]);
  return { total, today, olderThanRetention };
}

export async function purgeRounds(scope: PurgeScope): Promise<number> {
  const where = purgeWhere(scope);
  const deleted = await db.delete(scoreRounds).where(where).returning({ id: scoreRounds.id });
  return deleted.length;
}

export async function markPurgeRun(deleted: number, now = new Date()): Promise<void> {
  await db
    .update(tvDataSettings)
    .set({
      lastPurgeAt: now,
      lastPurgeDeleted: deleted,
      updatedAt: now,
    })
    .where(eq(tvDataSettings.id, 1));
}

export async function runRetentionIfDue(now = new Date()): Promise<{ ran: boolean; deleted: number }> {
  const settings = await getTvDataSettings();
  if (!shouldRunRetention(settings, now)) {
    return { ran: false, deleted: 0 };
  }

  const deleted = await purgeRounds({ scope: "older_than", days: settings.retentionDays });
  await markPurgeRun(deleted, now);
  return { ran: true, deleted };
}

export function startTvDataRetentionJob(log: { info: (obj: unknown, msg?: string) => void; error: (obj: unknown, msg?: string) => void }) {
  const tick = async () => {
    try {
      const result = await runRetentionIfDue();
      if (result.ran) {
        log.info({ deleted: result.deleted }, "TV retention smazala stará kola");
      }
    } catch (error) {
      log.error({ err: error }, "TV retention selhala");
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, 60_000);
  timer.unref?.();
  void tick();
  return () => clearInterval(timer);
}

function purgeWhere(scope: PurgeScope) {
  if (scope.scope === "today") return todayFilter();
  if (scope.scope === "older_than") return olderThanFilter(scope.days);
  if (scope.scope === "ids") return inArray(scoreRounds.id, scope.ids);
  return sql`true`;
}
