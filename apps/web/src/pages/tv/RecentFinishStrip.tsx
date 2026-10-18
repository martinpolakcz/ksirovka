import { AnimatePresence, motion } from "framer-motion";
import type { ScorecardStats } from "@/lib/api";
import { GAME_COLORS, GAME_LABELS, recentStripSlots, shareCardSrc } from "./tv-shared";
import { ShareFace } from "./ShareFace";

type RecentFinishStripProps = {
  rounds: ScorecardStats["recentRounds"];
  reducedMotion: boolean;
};

export function RecentFinishStrip({ rounds, reducedMotion }: RecentFinishStripProps) {
  const slots = recentStripSlots(rounds);
  const newestId = [...slots].reverse().find((round) => round)?.id;

  return (
    <section className="tv-card shrink-0 p-3 lg:px-4 lg:py-3">
      <p className="text-sm font-semibold text-teal">Právě dohráli</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {slots.map((round, index) => {
            if (!round) {
              return (
                <motion.div
                  key={`empty-${index}`}
                  layout={!reducedMotion}
                  className="flex h-[9.25rem] items-center justify-center rounded-[1.35rem] bg-forest-50 lg:h-[11.25rem]"
                >
                  <span className="size-[4.75rem] rounded-full border border-dashed border-teal/25 lg:size-[6rem]" />
                </motion.div>
              );
            }

            const photo = shareCardSrc(round.winnerPhotoUrl);
            const fresh = round.id === newestId;

            return (
              <motion.article
                key={round.id}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reducedMotion ? undefined : { x: -56, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className={
                  fresh
                    ? "flex h-[9.25rem] min-w-0 items-center gap-2 rounded-[1.35rem] bg-forest-100 px-2 ring-2 ring-teal/35 lg:h-[11.25rem] lg:gap-2.5 lg:px-2.5"
                    : "flex h-[9.25rem] min-w-0 items-center gap-2 rounded-[1.35rem] bg-forest-100 px-2 ring-1 ring-teal/15 lg:h-[11.25rem] lg:gap-2.5 lg:px-2.5"
                }
              >
                {photo ? (
                  <ShareFace
                    src={photo}
                    alt=""
                    className="size-[5.25rem] shrink-0 rounded-full ring-[3px] ring-[#d4a853] lg:size-[6.75rem]"
                  />
                ) : (
                  <div
                    className="flex size-[5.25rem] shrink-0 items-center justify-center rounded-full text-3xl font-semibold text-white ring-[3px] ring-[#d4a853] lg:size-[6.75rem] lg:text-4xl"
                    style={{ backgroundColor: GAME_COLORS[round.gameType] }}
                  >
                    {round.winnerName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1 pr-1">
                  <p className="font-display text-[1.85rem] font-semibold leading-none tabular-nums text-orange lg:text-[2.75rem]">
                    {round.winnerTotal}
                  </p>
                  <p className="mt-1 truncate text-[13px] font-semibold leading-tight text-ink lg:mt-1.5 lg:text-sm">
                    {round.winnerName}
                  </p>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: GAME_COLORS[round.gameType] }}
                    />
                    <span className="truncate">{GAME_LABELS[round.gameType]}</span>
                  </p>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
