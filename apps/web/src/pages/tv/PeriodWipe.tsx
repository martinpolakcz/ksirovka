import { AnimatePresence, motion } from "framer-motion";
import type { ScoreGameType } from "@/lib/api";
import { GAME_LABELS, PERIOD_LABELS, type TvPeriod } from "./tv-shared";

type PeriodWipeProps = {
  period: TvPeriod;
  gameType: ScoreGameType;
  visible: boolean;
};

export function PeriodWipe({ period, gameType, visible }: PeriodWipeProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-teal"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 0 100%)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-2xl font-semibold text-white/70">
            {PERIOD_LABELS[period]}
          </p>
          <p className="mt-2 font-display text-7xl font-semibold text-white xl:text-8xl">{GAME_LABELS[gameType]}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
