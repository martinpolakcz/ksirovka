import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, isStaticOnly, type HomepageData } from "@/lib/api";
import { homepageFallback } from "@/lib/homepage-fallback";
import { getStaticArticles, staticHomepage } from "@/data/static-content";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ActivityGrid } from "@/components/home/ActivityGrid";
import { NewsSection } from "@/components/home/NewsSection";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { ContactTeaser } from "@/components/home/ContactTeaser";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/navigation";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

function buildStaticHomepage(): HomepageData {
  return {
    heroSlides:
      staticHomepage.heroSlides.length > 0
        ? staticHomepage.heroSlides
        : homepageFallback.heroSlides,
    activityTiles:
      staticHomepage.activityTiles.length > 0
        ? staticHomepage.activityTiles
        : homepageFallback.activityTiles,
    articles: getStaticArticles(6),
    galleries: [],
    contact: {
      phone: siteConfig.phone,
      email: siteConfig.email,
      address: siteConfig.address,
    },
  };
}

export function HomePage() {
  const { t } = useTranslation();
  const staticContent = buildStaticHomepage();

  useDocumentMeta({
    title: null,
    description: t("site.description"),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["homepage"],
    queryFn: api.getHomepage,
    staleTime: 60_000,
    retry: 1,
    enabled: !isStaticOnly,
  });

  const content = isStaticOnly ? staticContent : (data ?? staticContent);

  if (!isStaticOnly && isLoading && !staticContent.heroSlides.length) {
    return (
      <div>
        <Skeleton className="h-screen w-full rounded-none" />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isStaticOnly && isError && (
        <div className="bg-orange/10 px-4 py-2 text-center text-sm text-orange">
          {t("home.apiUnavailable")}
        </div>
      )}
      <HeroCarousel slides={content.heroSlides} />
      <ActivityGrid tiles={content.activityTiles} />
      <NewsSection articles={content.articles} />
      <GalleryTeaser />
      <ContactTeaser />
    </>
  );
}
