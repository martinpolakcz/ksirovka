import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { HeroSlide } from "@/lib/api";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section className="relative h-[calc(100vh-5.5rem)] min-h-[520px] w-full overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/50 to-forest-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col justify-end pb-32 pt-32">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-5xl font-semibold uppercase leading-tight tracking-tight text-white md:text-7xl lg:text-8xl text-balance">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-6 max-w-xl text-lg text-white/80 md:text-xl">
                  {slide.subtitle}
                </p>
              )}
              {slide.contentHtml && (
                <div
                  className="prose-ksirovka mt-4 max-w-xl text-base"
                  dangerouslySetInnerHTML={{ __html: slide.contentHtml }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-10 bg-orange" : "w-4 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <a
            href="#novinky"
            className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce text-white/50 hover:text-white"
            aria-label="Scroll down"
          >
            <ChevronDown className="h-8 w-8" />
          </a>
        </>
      )}
    </section>
  );
}
