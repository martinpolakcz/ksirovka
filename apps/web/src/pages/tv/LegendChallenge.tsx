import type { ScoreGameType } from "@/lib/api";
import { GAME_LABELS, LEGENDS, ranyLabel } from "./tv-shared";

type LegendChallengeProps = {
  gameType: ScoreGameType;
  bestTotal: number | null;
  bestName: string | null;
};

export function LegendChallenge({ gameType, bestTotal, bestName }: LegendChallengeProps) {
  const legend = LEGENDS[gameType];
  const beaten = bestTotal != null && bestTotal < legend.total;
  const gap = bestTotal == null ? null : bestTotal - legend.total;

  let line = `Rekord ${legend.name} ${legend.total} zatím drží`;
  if (bestTotal != null && beaten) {
    line = `${bestName} přepsal rekord o ${Math.abs(gap ?? 0)} ${ranyLabel(Math.abs(gap ?? 0))}`;
  } else if (bestTotal != null && gap === 0) {
    line = `${bestName} se dotkl rekordu`;
  } else if (bestTotal != null && gap != null && gap > 0) {
    line = `Do rekordu zbývá ${gap} ${ranyLabel(gap)}`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-end">
      <p className="text-sm font-semibold text-teal">Výzva legend</p>
      <p className="mt-2 font-display text-2xl font-semibold leading-tight text-ink lg:text-4xl xl:text-5xl">
        {legend.name} · {legend.total}
      </p>
      <p className="mt-1 text-sm leading-normal text-ink/40">
        {legend.title} · {GAME_LABELS[gameType]}
      </p>
      <p className="mt-3 font-display text-xl font-semibold leading-normal text-orange lg:mt-4 lg:text-2xl xl:text-3xl">
        {line}
      </p>
    </div>
  );
}
