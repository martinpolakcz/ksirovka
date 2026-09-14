import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import { api, isStaticOnly } from "@/lib/api";
import { getStaticPage } from "@/data/static-content";
import { Skeleton } from "@/components/ui/skeleton";
import { encodeMediaUrl } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";

export function PageView() {
  const { t } = useTranslation();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const slug = location.pathname.replace(/^\//, "").split("/")[0];
  const fallback = slug ? getStaticPage(slug) : undefined;

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => api.getPage(slug),
    enabled: !!slug && !isStaticOnly,
    retry: 1,
  });

  const content = isStaticOnly ? fallback : (page ?? fallback);
  const isGallery =
    content?.template === "gallery" ||
    slug?.startsWith("fotogalerie") ||
    slug === "foto";
  const heroSrc = content?.heroImage ? encodeMediaUrl(content.heroImage) : null;

  useDocumentMeta({
    title: content?.title,
    description: content?.metaDescription,
  });

  if (!content && isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="mx-auto h-64 max-w-7xl rounded-none" />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Skeleton className="mb-4 h-12 w-2/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
        <h1 className="font-display text-5xl font-semibold text-ink">{t("errors.notFoundTitle")}</h1>
        <p className="mt-4 text-ink/60">
          {t("errors.notFoundBefore")}{" "}
          <Link to="/" className="text-teal hover:underline">
            {t("errors.notFoundHome")}
          </Link>{" "}
          {t("errors.notFoundAfter")}
        </p>
      </div>
    );
  }

  return (
    <>
      {heroSrc && (
        <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
          <img src={heroSrc} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/50 to-forest-950/20" />
          <div
            className={`absolute inset-x-0 bottom-0 mx-auto px-4 pb-10 md:px-8 ${
              isGallery ? "max-w-7xl" : "max-w-4xl"
            }`}
          >
            <h1 className="font-display text-4xl text-white md:text-5xl text-balance">
              {content.title}
            </h1>
          </div>
        </div>
      )}

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-auto px-4 py-16 md:px-8 md:py-24 ${
          isGallery ? "max-w-7xl" : "max-w-4xl"
        }`}
      >
        {!heroSrc && (
          <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">{content.title}</h1>
        )}
        <div
          ref={contentRef}
          className={`prose-ksirovka ${heroSrc ? "" : "mt-10"}`}
          dangerouslySetInnerHTML={{ __html: content.contentHtml }}
        />
      </motion.article>

      <GalleryLightbox containerRef={contentRef} />
    </>
  );
}
