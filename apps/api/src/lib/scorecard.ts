import type { GameType, StatsPeriod } from "../schemas/scorecard.js";

export const HOLE_PARS: Record<GameType, number[]> = {
  fotbalgolf: [3, 4, 3, 4, 3, 4, 3, 4, 3, 3, 4, 3, 4, 3, 4, 3, 4, 3],
  minigolf: [3, 3, 2, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3],
  adventure: [3, 3, 3, 4, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3],
};

const TIME_ZONE = "Europe/Prague";

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("cs");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function nicknameHeldByOther(
  requesterEmail: string,
  holders: Array<{ email: string | null | undefined }>,
): boolean {
  const me = normalizeEmail(requesterEmail);
  return holders.some((holder) => {
    const email = holder.email?.trim().toLowerCase();
    return Boolean(email && email !== me);
  });
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function pragueYmd(date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

function pragueWeekday(date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[weekday] ?? 1;
}

export function getPeriodBounds(period: StatsPeriod, now = new Date()) {
  const { year, month, day } = pragueYmd(now);
  let startYear = year;
  let startMonth = month;
  let startDay = day;

  if (period === "week") {
    const isoDow = pragueWeekday(now);
    const start = new Date(Date.UTC(year, month - 1, day));
    start.setUTCDate(start.getUTCDate() - (isoDow - 1));
    startYear = start.getUTCFullYear();
    startMonth = start.getUTCMonth() + 1;
    startDay = start.getUTCDate();
  } else if (period === "month") {
    startDay = 1;
  } else if (period === "year") {
    startMonth = 1;
    startDay = 1;
  }

  return {
    from: `${startYear}-${pad(startMonth)}-${pad(startDay)}`,
    to: `${year}-${pad(month)}-${pad(day)}`,
  };
}

export function periodTruncUnit(period: StatsPeriod): "day" | "week" | "month" | "year" {
  return period;
}
