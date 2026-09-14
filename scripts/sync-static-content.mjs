/**
 * Sync imported CMS content into the web app as static fallback
 * so all pages work on FTP hosting without the API.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = resolve(root, "apps/api/src/data/imported-content.json");
const outDir = resolve(root, "apps/web/src/data");
const outFile = resolve(outDir, "static-content.ts");
const MEDIA_ORIGIN = "https://ksirovka.cz";

if (!existsSync(source)) {
  console.error("Missing imported-content.json — run npm run import:content first");
  process.exit(1);
}

const data = JSON.parse(readFileSync(source, "utf8"));

const TITLE_OVERRIDES = {
  "fotogalerie-1": "Fotogalerie – Fotbalgolf",
  "fotogalerie-2": "Fotogalerie – Bistro",
  "fotogalerie-3": "Fotogalerie – Hopsálkov",
  "fotogalerie-4": "Fotogalerie – Minigolf",
  "fotogalerie-5": "Fotogalerie – Golf",
  "fotogalerie-6": "Fotogalerie – Akce",
  foto: "Fotogalerie",
  video: "Video",
  "provozni-doba": "Provozní doba",
  "ke-stazeni": "Ke stažení",
  cenik: "Ceník – Golf",
  "cenik-1": "Ceník – Fotbalgolf",
  "cenik-2": "Ceník – Minigolf",
  "cenik-3": "Ceník – Hopsálkov",
  "cenik-4": "Ceník – Body studio",
  "junior-golf-academy": "Junior Golf Academy",
  "teambuildingy-a-firemni-akce": "Teambuildingy a firemní akce",
  "rozlucky-se-svobodou": "Rozlučky se svobodou",
  "driving-range": "Driving Range",
  "golfova-akademie": "Golfová akademie",
  "golfovy-simulator": "Golfový simulátor",
  "golf-club-ksirovka": "Golf club Kšírovka",
  "jak-zacit": "Jak začít",
  treneri: "Trenéři – Golf",
  "treneri-1": "Trenéři – Body studio",
  "tabory-a-golfove-kempy": "Tábory a golfové kempy",
  "akce-a-oslavy-s-golfem": "Akce a oslavy s golfem",
  "park-sportu-a-zabavy": "Hopsálkov – Park sportu a zábavy",
  "narozeninove-oslavy": "Narozeninové oslavy",
  "primestske-tabory": "Příměstské tábory",
  "provozni-rad": "Provozní řád",
  "body-studio-ksirovka": "Body studio Kšírovka",
  "pilates-reformer-1": "Pilates reformer",
  rozvrh: "Rozvrh lekcí",
  "power-plate": "Power plate",
  solarium: "Solárium",
  masaze: "Masáže",
  "charakteristika-hry-1": "Minigolf – Charakteristika hry",
  "pravidla-1": "Minigolf – Pravidla",
  "charakteristika-hry": "Fotbalgolf – Charakteristika hry",
  pravidla: "Fotbalgolf – Pravidla",
  "akce-a-oslavy-na-fotbalgolfu": "Akce a oslavy na fotbalgolfu",
  popis: "Bistro",
  "napojovy-listek-cenik": "Nápojový lístek / ceník",
  "vanocni-vecirky": "Vánoční večírky",
  oslavy: "Oslavy",
  svatby: "Svatby",
  "detske-oslavy": "Dětské oslavy",
  kontakt: "Kontakt",
  novinky: "Novinky",
};

/** Pages rendered by dedicated React components — omit HTML from static bundle */
const DEDICATED_PAGE_SLUGS = new Set([
  "driving-range",
  "golfova-akademie",
  "treneri",
  "treneri-1",
  "park-sportu-a-zabavy",
  "narozeninove-oslavy",
  "cenik-3",
  "primestske-tabory",
  "provozni-rad",
  "kontakt",
  "novinky",
]);

const TILE_LABELS = {
  "driving-range": "Golf",
  "park-sportu-a-zabavy": "Hopsálkov",
  "charakteristika-hry-1": "Minigolf",
  "body-studio-ksirovka": "Body studio",
  "charakteristika-hry": "Fotbalgolf",
  popis: "Bistro",
  "teambuildingy-a-firemni-akce": "Akce",
  "https://eshop.ksirovka.cz/": "Vouchery",
  vouchery: "Vouchery",
  eshop: "Vouchery",
};

/** Legacy /foto/* folder hub → existing SPA routes */
const FOTO_FOLDER_MAP = {
  "/foto/golf": "/fotogalerie-5",
  "/foto/hopsalkov": "/fotogalerie-3",
  "/foto/fotbalgolf": "/fotogalerie-1",
  "/foto/minigolf": "/fotogalerie-4",
  "/foto/body-studio": "/body-studio-ksirovka",
  "/foto/akce": "/fotogalerie-6",
  "/foto/bistro": "/fotogalerie-2",
};

function titleCaseSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractHeading(html) {
  const m = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, "").trim() || null;
}

function stripWrappers(html) {
  return html
    .replace(/^<html[^>]*>\s*<head>[\s\S]*?<\/head>\s*<body>/i, "")
    .replace(/<\/body>\s*<\/html>\s*$/i, "")
    .trim();
}

function encodeMediaUrl(url) {
  if (!url || url.startsWith("data:") || url.startsWith("mailto:") || url.startsWith("tel:")) {
    return url;
  }

  try {
    let absolute = url;
    if (url.startsWith("//")) absolute = `https:${url}`;
    else if (url.startsWith("/")) absolute = `${MEDIA_ORIGIN}${url}`;
    else if (!url.startsWith("http")) absolute = `${MEDIA_ORIGIN}/${url}`;

    const parsed = new URL(absolute);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join("/");
    return parsed.toString();
  } catch {
    return url;
  }
}

function cleanContentHtml(html) {
  const $ = cheerio.load(stripWrappers(html), null, false);
  $(".app-pagecontenttype-hero, .hero").remove();
  $("h1").first().remove();
  $(".thumbs-mobile").remove();
  $(".circle").remove();

  // Strip legacy CMS XML processing leftovers and empty headings
  $("*")
    .contents()
    .each((_, node) => {
      if (node.type === "comment" && /xml/i.test(node.data || "")) {
        $(node).remove();
      }
    });
  $("h2, h3, h4").each((_, el) => {
    const text = $(el).text().replace(/\u00a0/g, " ").trim();
    if (!text) $(el).remove();
  });

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (FOTO_FOLDER_MAP[href]) {
      $(el).attr("href", FOTO_FOLDER_MAP[href]);
      return;
    }
    if (
      href.startsWith("/uploads/") ||
      href.startsWith("/user_uploads/") ||
      href.includes("/uploads/") ||
      href.includes("/user_uploads/")
    ) {
      $(el).attr("href", encodeMediaUrl(href));
    }
  });

  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) $(el).attr("src", encodeMediaUrl(src));
    const srcset = $(el).attr("srcset");
    if (srcset) {
      $(el).attr(
        "srcset",
        srcset
          .split(",")
          .map((part) => {
            const trimmed = part.trim();
            const spaceIdx = trimmed.search(/\s+\d/);
            if (spaceIdx === -1) return encodeMediaUrl(trimmed);
            const url = trimmed.slice(0, spaceIdx);
            const size = trimmed.slice(spaceIdx).trim();
            return `${encodeMediaUrl(url)} ${size}`;
          })
          .join(", "),
      );
    }
  });

  let out = $.root().html()?.trim() ?? "";
  out = out.replace(/<!--\?xml[\s\S]*?-->/gi, "");
  out = out.replace(/<h[2-4][^>]*>\s*<\/h[2-4]>/gi, "");
  return out.trim();
}

function resolveTileLabel(tile) {
  const fromSlug = TILE_LABELS[tile.slug];
  if (fromSlug) return fromSlug;
  if (tile.href?.includes("eshop.ksirovka.cz")) return "Vouchery";
  if (tile.label?.trim()) return tile.label.trim();
  const hrefKey = tile.href?.replace(/^\//, "") ?? "";
  return TILE_LABELS[hrefKey] || titleCaseSlug(hrefKey || tile.slug || "Aktivita");
}

const pages = {};
for (const page of data.pages ?? []) {
  if (DEDICATED_PAGE_SLUGS.has(page.slug)) continue;

  const heading = extractHeading(page.contentHtml ?? "");
  let title =
    TITLE_OVERRIDES[page.slug] ||
    (page.title && !page.title.includes(",") ? page.title : null) ||
    heading ||
    titleCaseSlug(page.slug);

  // Soften ALL-CAPS CMS titles
  if (title === title.toUpperCase() && title.length > 3) {
    title = title
      .toLowerCase()
      .replace(/(^|[\s\-–—/])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
  }

  pages[page.slug] = {
    id: Object.keys(pages).length + 1,
    slug: page.slug,
    title,
    metaDescription: page.metaDescription ?? null,
    contentHtml: cleanContentHtml(page.contentHtml ?? ""),
    heroImage: page.heroImage ? encodeMediaUrl(page.heroImage) : null,
    template: page.template ?? "default",
  };
}

const articles = (data.articles ?? []).map((article, index) => ({
  id: index + 1,
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt ?? null,
  contentHtml: cleanContentHtml(article.contentHtml ?? ""),
  coverImage: article.coverImage ? encodeMediaUrl(article.coverImage) : null,
  publishedAt: article.publishedAt ?? null,
}));

const homepage = {
  heroSlides: (data.homepage?.slides ?? []).map((slide, index) => ({
    id: index + 1,
    title: slide.title,
    subtitle: slide.subtitle ?? null,
    contentHtml: slide.contentHtml ?? null,
    imageUrl: encodeMediaUrl(slide.imageUrl),
    mobileImageUrl: slide.mobileImageUrl ? encodeMediaUrl(slide.mobileImageUrl) : null,
    linkUrl: null,
    sortOrder: slide.sortOrder ?? index,
  })),
  activityTiles: (data.homepage?.tiles ?? []).map((tile, index) => ({
    id: index + 1,
    slug: tile.slug,
    label: resolveTileLabel(tile),
    href: tile.href,
    imageUrl: encodeMediaUrl(tile.imageUrl),
    sortOrder: tile.sortOrder ?? index,
  })),
};

mkdirSync(outDir, { recursive: true });

const file = `/* Auto-generated from imported-content.json — do not edit by hand.
 * Regenerate: npm run sync:static-content
 */
import type { Article, HomepageData, Page } from "@/lib/api";

export const staticPages: Record<string, Page> = ${JSON.stringify(pages, null, 2)} as Record<string, Page>;

export const staticArticles: Article[] = ${JSON.stringify(articles, null, 2)} as Article[];

export const staticHomepage: Pick<HomepageData, "heroSlides" | "activityTiles"> = ${JSON.stringify(homepage, null, 2)};

export function getStaticPage(slug: string): Page | undefined {
  return staticPages[slug];
}

export function getStaticArticle(slug: string): Article | undefined {
  return staticArticles.find((a) => a.slug === slug);
}

export function getStaticArticles(limit = 50): Article[] {
  return staticArticles.slice(0, limit);
}
`;

writeFileSync(outFile, file);
console.log(
  `✓ Wrote ${Object.keys(pages).length} pages + ${articles.length} articles → ${outFile}`,
);
console.log(
  `  (skipped dedicated: ${[...DEDICATED_PAGE_SLUGS].join(", ")})`,
);
