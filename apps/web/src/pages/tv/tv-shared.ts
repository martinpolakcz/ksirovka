import type { ScoreGameType, ScorecardStats } from "@/lib/api";

export const TV_PERIODS = ["day", "week", "month"] as const;
export type TvPeriod = (typeof TV_PERIODS)[number];

export const TV_GAMES: ScoreGameType[] = ["fotbalgolf", "minigolf", "adventure"];

export const PERIOD_LABELS: Record<TvPeriod, string> = {
  day: "Dnes",
  week: "Týden",
  month: "Měsíc",
};

export const GAME_LABELS: Record<ScoreGameType, string> = {
  fotbalgolf: "Fotbalgolf",
  minigolf: "Minigolf",
  adventure: "Adventure Golf",
};

export const GAME_COLORS: Record<ScoreGameType, string> = {
  fotbalgolf: "#8bc34a",
  minigolf: "#f5c400",
  adventure: "#26c6da",
};

export const CATEGORY_LABELS = {
  golf: "Golf",
  hopsalkov: "Hopsálkov",
  venue: "Kšírovka",
} as const;

export const TV_SCENES: Array<{ period: TvPeriod; gameType: ScoreGameType }> = [
  { period: "day", gameType: "fotbalgolf" },
  { period: "week", gameType: "minigolf" },
  { period: "month", gameType: "adventure" },
  { period: "day", gameType: "minigolf" },
  { period: "week", gameType: "fotbalgolf" },
  { period: "month", gameType: "fotbalgolf" },
];

export const LEGENDS: Record<
  ScoreGameType,
  { name: string; total: number; title: string }
> = {
  fotbalgolf: { name: "Franta", total: 52, title: "Klubový rekordman fotbalgolfu" },
  minigolf: { name: "Pršálek", total: 38, title: "Legenda minigolfu" },
  adventure: { name: "Martin", total: 55, title: "První adventure rekord" },
};

export const SCENE_ROTATE_MS = 18_000;
export const FEATURED_ROTATE_MS = 12_000;
export const PANEL_ROTATE_MS = 7_000;
export const CELEBRATION_MS = 7_000;
export const CELEBRATION_RECORD_MS = 9_000;
export const FULLSCREEN_AD_EVERY_MS = 48_000;
export const FULLSCREEN_AD_MS = 8_000;
export const STATS_POLL_MS = 10_000;

export type CelebrationRound = ScorecardStats["recentRounds"][number] & {
  isRecord: boolean;
  isFirstToday: boolean;
  gap: number | null;
};

export type MiddlePanel = "story" | "legend" | "hardest";
export const MIDDLE_PANELS: MiddlePanel[] = ["story", "legend", "hardest"];

export function ranyLabel(count: number) {
  if (count === 1) return "ránu";
  if (count >= 2 && count <= 4) return "rány";
  return "ran";
}

export function venueHours(now = new Date()) {
  const day = now.getDay();
  const weekendLike = day === 0 || day >= 5;
  return {
    openHour: 9,
    closeHour: weekendLike ? 18 : 19,
    todayLabel: weekendLike ? "Dnes 9:00–18:00" : "Dnes 9:00–19:00",
    weekLabel: "Po–Čt 9:00–19:00 · Pá–Ne 9:00–18:00",
  };
}

export function findSceneIndex(period: TvPeriod, gameType: ScoreGameType) {
  const exact = TV_SCENES.findIndex((scene) => scene.period === period && scene.gameType === gameType);
  if (exact >= 0) return exact;
  return Math.max(
    0,
    TV_SCENES.findIndex((scene) => scene.gameType === gameType),
  );
}
