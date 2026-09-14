import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Camera, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GalleryTeaser() {
  const { t } = useTranslation();
  const images = [
    "https://ksirovka.cz/uploads/web1-r3x-3685-2f914112352683c89a2df9a378b561bb.jpg",
    "https://ksirovka.cz/uploads/web-ivah4758-74551369069c636ed99a154a88684403.jpg",
    "https://ksirovka.cz/uploads/ivah0270-74a58d832e01eb44865bfea94b4acd6d.JPG",
    "https://ksirovka.cz/uploads/ivah0017-1-e0c1e97b29636581dc7a312c8e570732.JPG",
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal">
              <Camera className="h-4 w-4" />
              {t("home.galleryLabel")}
            </p>
            <h2 className="font-display text-4xl font-semibold text-ink md:text-5xl">
              {t("home.galleryTitle")}
            </h2>
            <p className="mt-6 text-lg text-ink/60">{t("home.galleryText")}</p>
            <Button asChild className="mt-8">
              <Link to="/foto">
                {t("home.galleryCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {images.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
