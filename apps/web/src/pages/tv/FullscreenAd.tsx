import { AnimatePresence, motion } from "framer-motion";
import type { TvPromo } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { CATEGORY_LABELS } from "./tv-shared";

type FullscreenAdProps = {
  promo: TvPromo | null;
  reducedMotion: boolean;
};

export function FullscreenAd({ promo, reducedMotion }: FullscreenAdProps) {
  return (
    <AnimatePresence>
      {promo && (
        <motion.div
          className="absolute inset-0 z-[35] overflow-hidden bg-teal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.4 }}
        >
          {promo.imageUrl && (
            <img
              src={assetUrl(promo.imageUrl)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/10" />
          <div className="relative flex h-full flex-col justify-end px-16 py-16">
            <p className="text-sm font-semibold text-orange">
              {CATEGORY_LABELS[promo.category]}
            </p>
            <h2 className="mt-4 max-w-5xl font-display text-7xl font-semibold leading-tight text-white xl:text-8xl">
              {promo.title}
            </h2>
            <p className="mt-6 max-w-3xl text-2xl text-white/85">{promo.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
