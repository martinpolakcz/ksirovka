import { AnimatePresence, motion } from "framer-motion";
import type { ScorecardStats } from "@/lib/api";
import { GAME_LABELS, recentStripSlots, shareCardSrc } from "./tv-shared";
import { ShareFace } from "./ShareFace";

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
          {slots.map((round, index) => {
            const photo = round ? shareCardSrc(round.shareCardUrl) : null;
            return round ? (
              <motion.article
                key={round.id}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reducedMotion ? undefined : { x: -56, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="flex h-[8.5rem] overflow-hidden rounded-2xl bg-[#111f19] ring-1 ring-ink/10 lg:h-[10.5rem]"
              >
                {photo ? (
                  <ShareFace src={photo} className="h-full aspect-square shrink-0" />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col justify-end p-2 lg:p-2.5">
                  <p className="truncate text-sm font-semibold leading-tight text-white">{round.winnerName}</p>
                  <p className="mt-0.5 truncate text-xs text-white/70">{GAME_LABELS[round.gameType]}</p>
                  <p className="mt-1 font-semibold tabular-nums text-orange lg:text-2xl">{round.winnerTotal}</p>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key={`empty-${index}`}
                layout={!reducedMotion}
                className="h-[8.5rem] rounded-2xl border border-dashed border-ink/15 bg-mist/80 lg:h-[10.5rem]"
              />
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
