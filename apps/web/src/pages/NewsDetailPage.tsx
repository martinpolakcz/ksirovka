import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { api, isStaticOnly } from "@/lib/api";
import { getStaticArticle } from "@/data/static-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { encodeMediaUrl } from "@/lib/utils";

export function NewsDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const fallback = slug ? getStaticArticle(slug) : undefined;

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.getArticle(slug!),
    enabled: !!slug && !isStaticOnly,
    retry: 1,
  });

  const content = isStaticOnly ? fallback : (article ?? fallback);

  useDocumentMeta({
    title: content?.title,
    description: content?.excerpt,
  });

  if (!content && isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Skeleton className="mb-8 h-64 w-full rounded-3xl" />
          <Skeleton className="mb-4 h-12 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        <h1 className="font-display text-4xl font-semibold text-ink">{t("errors.articleNotFound")}</h1>
        <Link to="/novinky" className="mt-4 text-teal hover:underline">
          ← {t("common.backToNews")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {content.coverImage && (
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img
            src={encodeMediaUrl(content.coverImage)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-transparent" />
        </div>
      )}

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16"
      >
        <Link
          to="/novinky"
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.backToNews")}
        </Link>

        <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">{content.title}</h1>

        <div
          className="prose-ksirovka mt-10"
          dangerouslySetInnerHTML={{ __html: content.contentHtml }}
        />
      </motion.article>
    </div>
  );
}
