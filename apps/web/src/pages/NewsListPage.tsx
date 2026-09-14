import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { api, isStaticOnly } from "@/lib/api";
import { getStaticArticles } from "@/data/static-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export function NewsListPage() {
  const { t } = useTranslation();
  const fallback = getStaticArticles(50);

  useDocumentMeta({
    title: t("home.news"),
    description: t("home.newsTitle"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: () => api.getArticles(50),
    retry: 1,
    enabled: !isStaticOnly,
  });

  const articles = isStaticOnly ? fallback : (data?.items ?? fallback);

  if (isLoading && !fallback.length) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <Skeleton className="mb-12 h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-semibold text-ink md:text-6xl"
        >
          {t("home.news")}
        </motion.h1>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/novinky/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/10 transition hover:shadow-md"
              >
                {article.coverImage && (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-xl font-semibold text-ink group-hover:text-teal">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mt-3 flex-1 text-sm text-ink/60 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-teal">
                    {t("common.readArticle")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
