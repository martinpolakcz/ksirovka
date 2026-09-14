import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  category?: string;
}

export function PageHero({ title, subtitle, image, category }: PageHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-[50vh] items-end overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/70 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange"
        >
          {category ?? t("categories.golf")} · Kšírovka
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl font-semibold uppercase tracking-tight text-white md:text-7xl text-balance"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-2xl text-lg text-white/75 md:text-xl"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
