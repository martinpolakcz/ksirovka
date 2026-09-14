import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface NewsSectionProps {
  articles: Article[];
}

export function NewsSection({ articles }: NewsSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="novinky" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal"
            >
              {t("home.current")}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-semibold text-ink md:text-5xl"
            >
              {t("home.news")}
            </motion.h2>
          </div>
          <Button variant="outline" asChild className="hidden md:inline-flex">
            <Link to="/novinky">
              {t("common.allNews")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
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
                  <h3 className="font-display text-xl font-semibold text-ink transition group-hover:text-teal">
                    {article.title}
                  </h3>
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

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/novinky">{t("common.allNews")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
