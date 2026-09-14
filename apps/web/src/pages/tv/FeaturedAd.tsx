import { AnimatePresence, motion } from "framer-motion";
import type { TvPromo } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { CATEGORY_LABELS } from "./tv-shared";

type FeaturedAdProps = {
  promo: TvPromo | undefined;
  reducedMotion: boolean;
};

export function FeaturedAd({ promo, reducedMotion }: FeaturedAdProps) {
  return (
    <div className="tv-card relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {promo ? (
          <motion.article
            key={promo.id}
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0"
          >
            {promo.imageUrl && (
              <img
                src={assetUrl(promo.imageUrl)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <p className="text-sm font-semibold text-orange">
                {CATEGORY_LABELS[promo.category]}
              </p>
              <h3 className="mt-1 font-display text-3xl font-semibold text-white xl:text-4xl">{promo.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/85 xl:text-base">{promo.message}</p>
            </div>
          </motion.article>
        ) : (
          <div className="flex h-full items-center justify-center p-5 text-ink/45">
            Reklama se připravuje
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
