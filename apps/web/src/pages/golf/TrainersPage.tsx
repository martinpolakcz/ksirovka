import { useEffect } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { TrainerCard } from "@/components/golf/TrainerCard";
import { trainersContent } from "@/lib/golf-content";
import { siteConfig } from "@/lib/navigation";

export function TrainersPage() {
  const { title, subtitle, heroImage, intro, trainers } = trainersContent;

  useEffect(() => {
    document.title = `${title} | ${siteConfig.name}`;
  }, [title]);

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4 text-center text-lg text-ink/70 leading-relaxed"
          >
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>

          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="mt-8 flex items-center justify-center gap-2 text-teal hover:text-teal-dark"
          >
            <Phone className="h-4 w-4" />
            Recepce Kšírovky {siteConfig.phone}
          </motion.a>
        </div>
      </section>

      <section className="border-t border-ink/5 pb-24">
        <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-8">
          {trainers.map((trainer, index) => (
            <TrainerCard key={trainer.name} trainer={trainer} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}
