import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { AlternatingSection } from "@/components/golf/AlternatingSection";
import { golfAcademyContent } from "@/lib/golf-content";
import { siteConfig } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function GolfAcademyPage() {
  const { title, subtitle, heroImage, course, tips } = golfAcademyContent;

  useEffect(() => {
    document.title = `${title} | ${siteConfig.name}`;
  }, [title]);

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} />

      <AlternatingSection heading={course.heading} image={course.image}>
        {course.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <Button asChild className="mt-4">
          <a href={course.reservationUrl} target="_blank" rel="noopener noreferrer">
            Rezervace hry
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </AlternatingSection>

      <section className="border-t border-ink/5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                {tips.heading}
              </h2>
              <ul className="mt-8 space-y-4">
                {tips.items.map((tip, i) => (
                  <motion.li
                    key={tip}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 text-ink/70"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-3xl ring-1 ring-ink/10"
            >
              <img src={tips.image} alt="" className="aspect-[4/5] w-full object-cover" />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
