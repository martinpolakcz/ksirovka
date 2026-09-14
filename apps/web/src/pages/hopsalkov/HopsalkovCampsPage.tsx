import { ExternalLink, Phone } from "lucide-react";
import { PageHero } from "@/components/golf/PageHero";
import { AlternatingSection } from "@/components/golf/AlternatingSection";
import { hopsalkovCampsContent } from "@/lib/hopsalkov-content";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export function HopsalkovCampsPage() {
  const { title, subtitle, category, heroImage, intro, details, cta } = hopsalkovCampsContent;

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
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">Termíny a informace</h2>
          <dl className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-2xl bg-white">
            {details.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6"
              >
                <dt className="text-sm font-semibold uppercase tracking-wide text-teal">
                  {row.label}
                </dt>
                <dd className="text-ink/80">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
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
      </section>
    </>
  );
}
