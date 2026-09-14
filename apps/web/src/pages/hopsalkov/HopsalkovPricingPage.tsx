import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { hopsalkovPricingContent } from "@/lib/hopsalkov-content";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export function HopsalkovPricingPage() {
  const { title, subtitle, category, heroImage, groups, cta } = hopsalkovPricingContent;

  useDocumentMeta({
    title,
    description: subtitle,
  });

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} category={category} />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-12 px-4 md:px-8">
          {groups.map((group, gi) => (
            <motion.div
              key={group.heading}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.08 }}
            >
              <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">{group.heading}</h2>
              <ul className="mt-6 divide-y divide-ink/10 overflow-hidden rounded-2xl bg-mist">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-ink/80">{item.label}</span>
                    <span className="font-semibold text-teal sm:text-right">{item.price}</span>
                  </li>
                ))}
              </ul>
              {"note" in group && group.note && (
                <p className="mt-4 text-sm text-ink/50 leading-relaxed">{group.note}</p>
              )}
            </motion.div>
          ))}

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <p className="text-ink/60">Dotazy k vstupnému:</p>
            <Button asChild>
              <a href={`tel:${cta.phone.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4" />
                {cta.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
