import type { ScoreGameType } from "@/lib/api";
import { QrInvite } from "./QrInvite";
import { GAME_LABELS, venueHours } from "./tv-shared";

type EmptyMorningProps = {
  gameType: ScoreGameType;
};

export function EmptyMorning({ gameType }: EmptyMorningProps) {
  const hours = venueHours();

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-full lg:grid-cols-[1.4fr_0.9fr] lg:gap-5">
      <article className="flex flex-col justify-end rounded-[1.6rem] bg-teal px-5 py-6 text-white shadow-[0_12px_40px_rgba(14,173,167,0.2)] lg:rounded-[2rem] lg:px-8 lg:py-8">
        <p className="text-sm font-semibold text-white/80">
          {GAME_LABELS[gameType]} · první na tabuli
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white lg:text-5xl xl:text-7xl">
          První kolo vyhrává kávu v bistru
        </h2>
        <p className="mt-4 max-w-3xl text-base text-white/80 lg:text-xl">
          Nahraj výsledek ve Scorecard appce a jsi na televizi. {hours.todayLabel}. {hours.weekLabel}.
        </p>
      </article>
      <QrInvite large />
    </div>
  );
}
