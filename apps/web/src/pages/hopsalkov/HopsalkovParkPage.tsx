import { motion } from "framer-motion";
import { ExternalLink, Phone, Waves, Car, Ship, Footprints, Shovel, Utensils } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { AlternatingSection } from "@/components/golf/AlternatingSection";
import { hopsalkovParkContent } from "@/lib/hopsalkov-content";
import { siteConfig } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const attractionIcons = [Waves, Car, Ship, Footprints, Shovel, Utensils];

export function HopsalkovParkPage() {
  const { title, subtitle, category, heroImage, intro, attractions, extras, cta } =
    hopsalkovParkContent;

  useDocumentMeta({
    title,
    description: subtitle,
  });

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} category={category} />

      <AlternatingSection heading={intro.heading} image={intro.image}>
        {intro.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </AlternatingSection>

      <section className="border-t border-ink/5 bg-mist py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">Atrakce</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map((item, i) => {
              const Icon = attractionIcons[i] ?? Waves;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2 text-orange">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-sm text-ink/70 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <AlternatingSection heading={extras.heading} image={extras.image} reverse>
        <ul className="space-y-3">
          {extras.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2 space-y-1 text-sm text-ink/50">
          {extras.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </AlternatingSection>

      <section className="border-t border-ink/5 py-16 md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="font-display text-2xl font-semibold text-ink md:text-3xl">Přijďte si zasportovat</p>
            <p className="mt-2 text-ink/60">Rezervace a informace na telefonu {cta.phone}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={`tel:${cta.phone.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4" />
                {cta.phone}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={cta.reservationUrl} target="_blank" rel="noopener noreferrer">
                Rezervace
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl px-4 text-sm text-ink/40 md:px-8">
          {siteConfig.name} · Hopsálkov
        </p>
      </section>
    </>
  );
}
