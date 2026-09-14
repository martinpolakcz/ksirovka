import { motion } from "framer-motion";
import { PageHero } from "@/components/golf/PageHero";
import { hopsalkovRulesContent } from "@/lib/hopsalkov-content";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export function HopsalkovRulesPage() {
  const { title, subtitle, category, heroImage, intro, operator, highlights } =
    hopsalkovRulesContent;

  useDocumentMeta({
    title,
    description: subtitle,
  });

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} category={category} />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-8 px-4 md:px-8">
          {intro.map((p) => (
            <p key={p} className="text-lg text-ink/75 leading-relaxed">
              {p}
            </p>
          ))}

          <p className="text-sm text-ink/50">{operator}</p>

          <ul className="space-y-4 pt-4">
            {highlights.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="relative rounded-2xl bg-mist py-4 pl-14 pr-5"
              >
                <span className="absolute left-5 top-4 font-display text-xl text-teal/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink/80">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
