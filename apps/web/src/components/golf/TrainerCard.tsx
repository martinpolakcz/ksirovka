import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Globe, Instagram, UserRound } from "lucide-react";
import type { Trainer } from "@/lib/golf-content";
import { Button } from "@/components/ui/button";

interface TrainerCardProps {
  trainer: Trainer;
  index: number;
}

export function TrainerCard({ trainer, index }: TrainerCardProps) {
  const reverse = index % 2 === 1;
  const [imageError, setImageError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/10"
    >
      <div className={`grid lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-mist sm:aspect-[3/4] lg:aspect-auto lg:min-h-[480px]">
          {!imageError ? (
            <img
              src={trainer.image}
              alt={trainer.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 bg-mist text-ink/40">
              <UserRound className="h-16 w-16" />
              <span className="text-sm">Foto trenéra</span>
            </div>
          )}
        </div>

        <div className="flex flex-col p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            {trainer.role}
          </p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-ink">{trainer.name}</h3>

          <ul className="mt-5 space-y-2 text-sm text-ink/80">
            {trainer.details.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" />
                {line}
              </li>
            ))}
          </ul>

          {trainer.pricing && (
            <div className="mt-6 rounded-2xl bg-mist p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal">
                Ceník
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {trainer.pricing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            {trainer.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${trainer.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4" />
                  {trainer.phone}
                </a>
              </Button>
            )}
            {trainer.email && (
              <Button variant="ghost" size="sm" asChild>
                <a href={`mailto:${trainer.email}`}>
                  <Mail className="h-4 w-4" />
                  E-mail
                </a>
              </Button>
            )}
            {trainer.website && (
              <Button variant="ghost" size="sm" asChild>
                <a href={trainer.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" />
                  Web
                </a>
              </Button>
            )}
            {trainer.instagram && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`https://www.instagram.com/${trainer.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
