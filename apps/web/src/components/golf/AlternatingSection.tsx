import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AlternatingSectionProps {
  heading: string;
  children: React.ReactNode;
  image: string;
  imageAlt?: string;
  reverse?: boolean;
  className?: string;
}

export function AlternatingSection({
  heading,
  children,
  image,
  imageAlt = "",
  reverse = false,
  className,
}: AlternatingSectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div
          className={cn(
            "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
            reverse && "lg:[&>*:first-child]:order-2",
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl text-balance">
              {heading}
            </h2>
            <div className="mt-6 space-y-4 text-ink/70 leading-relaxed">{children}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reverse ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl ring-1 ring-ink/10">
              <img src={image} alt={imageAlt} className="aspect-[4/3] w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
