import type { ScorecardStats, TvPromo } from "@/lib/api";
import { CATEGORY_LABELS, GAME_LABELS } from "./tv-shared";

type TickerProps = {
  promos: TvPromo[];
  recent: ScorecardStats["recentRounds"];
};

export function Ticker({ promos, recent }: TickerProps) {
  const items = [
    ...promos.map((promo) => `${CATEGORY_LABELS[promo.category]} · ${promo.title} — ${promo.message}`),
    ...recent.slice(0, 6).map(
      (round) =>
        `Právě dohráli · ${GAME_LABELS[round.gameType]} · ${round.winnerName} ${round.winnerTotal}`,
    ),
  ];

  const line =
    items.length > 0
      ? items.join("     ★     ")
      : "Zahraj kolo v aplikaci Kšírovka Scorecard a uvidíš se tady na tabuli.";

  return (
    <div className="relative flex h-14 items-center overflow-hidden bg-teal">
      <div className="z-10 flex h-full shrink-0 items-center bg-orange px-4 text-lg font-semibold text-white">
        LIVE
      </div>
      <div className="tv-ticker-mask relative min-w-0 flex-1">
        <div className="tv-ticker-track flex w-max gap-16 whitespace-nowrap px-8 text-lg leading-normal text-white">
          <span>{line}</span>
          <span aria-hidden>{line}</span>
        </div>
      </div>
    </div>
  );
}
