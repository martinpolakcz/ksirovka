import type { ScorecardStats } from "@/lib/api";
import { GAME_LABELS } from "./tv-shared";

type StoryStatsProps = {
  summary: ScorecardStats["summary"];
};

export function StoryStats({ summary }: StoryStatsProps) {
  return (
    <div className="grid h-full grid-cols-3 gap-4">
      <Stat label="Kol dnes" value={String(summary.rounds)} />
      <Stat label="Hráčů" value={String(summary.players)} />
      <Stat
        label="Nejlepší"
        value={summary.bestScore ? String(summary.bestScore.total) : "—"}
        hint={
          summary.bestScore
            ? `${summary.bestScore.playerName} · ${GAME_LABELS[summary.bestScore.gameType]}`
            : "Čekáme na první kolo"
        }
      />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col justify-end">
      <p className="text-sm font-semibold text-teal">{label}</p>
      <p className="mt-1 text-3xl font-semibold leading-none text-ink lg:text-5xl xl:text-6xl">{value}</p>
      {hint && <p className="mt-2 truncate text-sm text-ink/45">{hint}</p>}
    </div>
  );
}
