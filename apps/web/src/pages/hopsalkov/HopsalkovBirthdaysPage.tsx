import { ExternalLink, Phone, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero } from "@/components/golf/PageHero";
import { AlternatingSection } from "@/components/golf/AlternatingSection";
import { hopsalkovBirthdaysContent } from "@/lib/hopsalkov-content";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export function HopsalkovBirthdaysPage() {
  const { title, subtitle, category, heroImage, intro, expectations, cta } =
    hopsalkovBirthdaysContent;

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
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">{expectations.heading}</h2>
          <ul className="mt-8 space-y-4">
            {expectations.items.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 text-ink/70"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-ink/80 leading-relaxed">{cta.text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
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
        </div>
      </section>
    </>
  );
}
