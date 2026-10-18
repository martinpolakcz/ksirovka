import { AnimatePresence, motion } from "framer-motion";
import type { ScorecardStats } from "@/lib/api";
import { GAME_LABELS, recentStripSlots, shareCardSrc } from "./tv-shared";

type RecentFinishStripProps = {
  rounds: ScorecardStats["recentRounds"];
  reducedMotion: boolean;
};

export function RecentFinishStrip({ rounds, reducedMotion }: RecentFinishStripProps) {
  const slots = recentStripSlots(rounds);

  return (
    <section className="tv-card shrink-0 p-3 lg:px-4 lg:py-3">
      <p className="text-sm font-semibold text-teal">Právě dohráli</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {slots.map((round, index) =>
            round ? (
              <motion.article
                key={round.id}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reducedMotion ? undefined : { x: -56, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative h-[8.5rem] overflow-hidden rounded-2xl bg-[#111f19] ring-1 ring-ink/10 lg:h-[10.5rem]"
              >
                {shareCardSrc(round.shareCardUrl) ? (
                  <img
                    src={shareCardSrc(round.shareCardUrl) ?? ""}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-2 lg:p-2.5">
                  <p className="truncate text-sm font-semibold leading-tight text-white">{round.winnerName}</p>
                  <p className="mt-0.5 flex items-baseline justify-between gap-1 text-xs text-white/70">
                    <span className="truncate">{GAME_LABELS[round.gameType]}</span>
                    <span className="font-semibold tabular-nums text-orange lg:text-xl">{round.winnerTotal}</span>
                  </p>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key={`empty-${index}`}
                layout={!reducedMotion}
                className="h-[8.5rem] rounded-2xl border border-dashed border-ink/15 bg-mist/80 lg:h-[10.5rem]"
              />
            ),
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
