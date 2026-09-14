import type { ScoreGameType } from "@/lib/api";
import { QrInvite } from "./QrInvite";
import { GAME_LABELS, venueHours } from "./tv-shared";

type EmptyMorningProps = {
  gameType: ScoreGameType;
};

export function EmptyMorning({ gameType }: EmptyMorningProps) {
  const hours = venueHours();

  return (
    <div className="grid h-full grid-cols-[1.4fr_0.9fr] gap-5">
      <article className="flex flex-col justify-end rounded-[2rem] bg-teal px-8 py-8 text-white shadow-[0_12px_40px_rgba(14,173,167,0.2)]">
        <p className="text-sm font-semibold text-white/80">
          {GAME_LABELS[gameType]} · první na tabuli
        </p>
        <h2 className="mt-3 font-display text-5xl font-semibold leading-tight text-white xl:text-7xl">
          První kolo vyhrává kávu v bistru
        </h2>
        <p className="mt-4 max-w-3xl text-xl text-white/80">
          Nahraj výsledek ve Scorecard appce a jsi na televizi. {hours.todayLabel}. {hours.weekLabel}.
        </p>
      </article>
      <QrInvite large />
    </div>
  );
}
