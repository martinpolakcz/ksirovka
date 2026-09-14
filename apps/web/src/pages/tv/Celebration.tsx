import { AnimatePresence, motion } from "framer-motion";
import { GAME_LABELS, ranyLabel, type CelebrationRound } from "./tv-shared";

type CelebrationProps = {
  round: CelebrationRound | null;
  reducedMotion: boolean;
};

export function Celebration({ round, reducedMotion }: CelebrationProps) {
  const title = round?.isRecord ? "Nový rekord dnes" : round?.isFirstToday ? "První na tabuli" : "Nové kolo";
  const roster = round?.standings.slice(0, 6) ?? [];

  return (
    <AnimatePresence>
      {round && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-white/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!reducedMotion && (
            <motion.span
              className="absolute size-16 rounded-full bg-orange shadow-[0_0_50px_#fd960c]"
              initial={{ x: "-55vw", y: "40vh", scale: 0.4 }}
              animate={{ x: 0, y: -40, scale: 1.15 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          <motion.div
            initial={reducedMotion ? false : { scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ delay: reducedMotion ? 0 : 0.55, duration: 0.45 }}
            className="relative flex max-w-6xl flex-col items-center text-center"
          >
            <p className="text-sm font-semibold text-teal">{title}</p>
            <p className="mt-3 font-display text-7xl font-semibold text-orange xl:text-8xl">{round.winnerName}</p>
            <p className="mt-4 font-display text-8xl font-semibold text-ink xl:text-9xl">{round.winnerTotal}</p>
            <p className="mt-3 text-xl text-ink/50">
              {GAME_LABELS[round.gameType]}
              {round.gap != null && round.gap > 0
                ? ` · o ${round.gap} ${ranyLabel(round.gap)} před druhým`
                : " · právě dohráli"}
            </p>
            {roster.length > 1 && (
              <ul className="mt-8 flex flex-wrap justify-center gap-3">
                {roster.map((player) => (
                  <li
                    key={`${player.rank}-${player.name}`}
                    className="rounded-full bg-mist px-5 py-2 text-lg text-ink/80"
                  >
                    <span className="mr-2 text-teal">{player.rank}.</span>
                    {player.name}
                    <span className="ml-2 font-display font-semibold text-ink">{player.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
