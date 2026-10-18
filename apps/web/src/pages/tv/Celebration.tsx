import { AnimatePresence, motion } from "framer-motion";
import { TvFace } from "./ShareFace";
import {
  GAME_COLORS,
  GAME_LABELS,
  shareCardSrc,
  vsParLabel,
  type CelebrationRound,
} from "./tv-shared";

type CelebrationProps = {
  round: CelebrationRound | null;
  reducedMotion: boolean;
};

export function Celebration({ round, reducedMotion }: CelebrationProps) {
  const shareCard = shareCardSrc(round?.shareCardUrl);
  const face = shareCardSrc(round?.winnerPhotoUrl);

  return (
    <AnimatePresence>
      {round && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#111f19]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={reducedMotion ? false : { scale: 0.86, y: 28, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative flex max-h-[92vh] max-w-[min(92vw,720px)] flex-col items-center px-4"
          >
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#d4a853] uppercase">
              Právě dohráli
            </p>
            {shareCard ? (
              <img
                src={shareCard}
                alt={`${round.winnerName} · ${round.winnerTotal}`}
                className="block max-h-[82vh] w-auto rounded-[8%/6.4%] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
              />
            ) : (
              <article className="flex aspect-[4/5] h-[min(82vh,calc(92vw*1.25))] max-h-[82vh] w-auto flex-col items-center justify-between overflow-hidden rounded-[8%/6.4%] bg-[#12352f] bg-gradient-to-b from-[#0eada7] via-[#163832] to-[#111f19] px-[8%] py-[7%] text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <img src="/logo-wordmark.svg" alt="Kšírovka" className="h-8 w-auto brightness-0 invert lg:h-9" />
                <TvFace
                  src={face}
                  alt={round.winnerName}
                  sizeClassName="size-[8.5rem] lg:size-[11.5rem]"
                  fallbackClassName="text-5xl font-semibold text-white lg:text-6xl"
                  fallbackStyle={{ backgroundColor: GAME_COLORS[round.gameType] }}
                >
                  {round.winnerName.slice(0, 1)}
                </TvFace>
                <p className="text-xs font-semibold tracking-[0.22em] text-white/85 uppercase lg:text-sm">
                  {GAME_LABELS[round.gameType]}
                </p>
                <p className="font-display text-7xl font-semibold leading-none text-[#d4a853] lg:text-8xl">
                  {round.winnerTotal}
                </p>
                <p className="text-2xl font-semibold text-white lg:text-3xl">{round.winnerName}</p>
                <p className="text-sm text-white/55 lg:text-base">
                  {vsParLabel(round.winnerTotal, round.holesPlayed)}
                </p>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-orange uppercase lg:text-xs">
                  Zahraj si na Kšírovce · Brno
                </p>
              </article>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
