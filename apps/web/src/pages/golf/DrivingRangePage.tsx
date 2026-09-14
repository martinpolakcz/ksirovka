import { useEffect } from "react";
import { motion } from "framer-motion";
import { Target, CircleDot, LandPlot, Sun } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { AlternatingSection } from "@/components/golf/AlternatingSection";
import { drivingRangeContent } from "@/lib/golf-content";
import { siteConfig } from "@/lib/navigation";

const facilityIcons = [Target, CircleDot, LandPlot, Sun];

export function DrivingRangePage() {
  const { title, subtitle, heroImage, intro, features } = drivingRangeContent;

  useEffect(() => {
    document.title = `${title} | ${siteConfig.name}`;
  }, [title]);

  return (
    <>
      <PageHero title={title} subtitle={subtitle} image={heroImage} />

      <AlternatingSection heading={intro.heading} image={intro.image}>
        {intro.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}

        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          {intro.facilities.map((facility, i) => {
            const Icon = facilityIcons[i] ?? Target;
            return (
              <div
                key={facility.title}
                className="rounded-2xl bg-mist p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-teal">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {facility.title}
                  </span>
                </div>
                {facility.subtitle && (
                  <p className="text-sm text-ink/50">{facility.subtitle}</p>
                )}
                {facility.description && (
                  <p className="mt-1 text-sm text-ink/75">{facility.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </AlternatingSection>

      <section className="border-t border-ink/5 bg-mist py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="overflow-hidden rounded-3xl ring-1 ring-ink/10">
                <img
                  src={features.image}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 space-y-8 lg:order-2"
            >
              {features.items.map((item, i) => (
                <div key={item.title} className="relative pl-6">
                  <span className="absolute left-0 top-1 font-display text-2xl text-teal/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-ink/65 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
