import { useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { TrainerCard } from "@/components/golf/TrainerCard";
import { bodyStudioTrainersContent } from "@/lib/body-studio-content";
import { siteConfig } from "@/lib/navigation";

export function BodyStudioTrainersPage() {
  const { title, subtitle, heroImage, intro, trainers } = bodyStudioTrainersContent;

  useEffect(() => {
    document.title = `${title} | Body studio | ${siteConfig.name}`;
  }, [title]);

  return (
    <>
      <PageHero
        title={title}
        subtitle={subtitle}
        image={heroImage}
        category="Body studio"
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4 text-center text-lg text-ink/75 leading-relaxed"
          >
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>

          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            href="mailto:lenusa.fucikova@seznam.cz"
            className="mt-8 flex items-center justify-center gap-2 text-teal hover:text-teal-dark"
          >
            <Mail className="h-4 w-4" />
            lenusa.fucikova@seznam.cz
            <span className="text-ink/30">·</span>
            <Phone className="h-4 w-4" />
            +420 731 507 070
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
