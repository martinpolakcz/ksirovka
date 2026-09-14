import * as cheerio from "cheerio";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.LEGACY_SITE_URL ?? "https://ksirovka.cz";
const OUTPUT = resolve(__dirname, "../src/data/imported-content.json");

const PAGE_SLUGS = [
  "driving-range",
  "golfova-akademie",
  "golfovy-simulator",
  "cenik",
  "golf-club-ksirovka",
  "junior-golf-academy",
  "jak-zacit",
  "treneri",
  "tabory-a-golfove-kempy",
  "akce-a-oslavy-s-golfem",
  "fotogalerie-5",
  "park-sportu-a-zabavy",
  "narozeninove-oslavy",
  "cenik-3",
  "primestske-tabory",
  "provozni-rad",
  "fotogalerie-3",
  "body-studio-ksirovka",
  "pilates-reformer-1",
  "rozvrh",
  "power-plate",
  "solarium",
  "cenik-4",
  "treneri-1",
  "masaze",
  "charakteristika-hry-1",
  "cenik-2",
  "pravidla-1",
  "fotogalerie-4",
  "charakteristika-hry",
  "cenik-1",
  "pravidla",
  "akce-a-oslavy-na-fotbalgolfu",
  "fotogalerie-1",
  "popis",
  "napojovy-listek-cenik",
  "fotogalerie-2",
  "teambuildingy-a-firemni-akce",
  "vanocni-vecirky",
  "rozlucky-se-svobodou",
  "oslavy",
  "svatby",
  "detske-oslavy",
  "fotogalerie-6",
  "novinky",
  "foto",
  "video",
  "kontakt",
  "provozni-doba",
  "ke-stazeni",
];

const FALLBACK_ARTICLE_SLUGS = [
  "sportovni-kemp-24-28-8-volna-mista",
  "ksirovka-cup-2026",
  "co-se-deje-na-ksirovce",
  "jaro-je-tu",
  "primestsky-sportovni-tabor-s-lenkou-2026",
  "turbo-vyhrivani",
  "zimni-oteviraci-doba",
  "vanocni-vecirky-na-ksirovce",
  "halloween-na-ksirovce",
  "akce-permanentka-do-solaria",
  "ksirovka-cup-2025",
  "18-9-2025-od-13-00-areal-uzavren-z-duvodu-konani-soukrome-akce",
  "nova-tvar-ksirovky",
  "za-vysvedceni-do-hopsalkova",
  "detsky-den-31-5-2025",
  "jorksir-cup-2025",
  "hra-z-travy-zahajena",
  "primestsky-sportovni-tabor-s-lenkou",
];

function absolutizeUrl(url: string): string {
  if (!url || url.startsWith("data:")) return url;
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) return url;

  let absolute = url;
  if (url.startsWith("//")) absolute = `https:${url}`;
  else if (!url.startsWith("http")) {
    absolute = `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  try {
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
    return absolute;
  }
}

function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
    if (href.startsWith("http") && !href.includes("ksirovka.cz")) return;
    if (href.includes("eshop.ksirovka.cz")) return;

    let path = href;
    if (href.startsWith("http")) {
      try {
        path = new URL(href).pathname;
      } catch {
        return;
      }
    } else {
      path = absolutizeUrl(href).replace(BASE_URL, "");
    }
    $(el).attr("href", path.startsWith("/") ? path : `/${path}`);
  });
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) $(el).attr("src", absolutizeUrl(src));
    const srcset = $(el).attr("srcset");
    if (srcset) {
      $(el).attr(
        "srcset",
        srcset
          .split(",")
          .map((part) => {
            const [url, size] = part.trim().split(/\s+/);
            return `${absolutizeUrl(url)}${size ? ` ${size}` : ""}`;
          })
          .join(", "),
      );
    }
  });
  // Desktop + mobile gallery clones in legacy CMS — keep only desktop
  $(".thumbs-mobile").remove();

  // Return inner content without html/head/body wrappers
  return ($("body").html() ?? $.root().html() ?? "").trim();
}

async function fetchPage(path: string) {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.text();
}

function parsePage(html: string, slug: string) {
  const $ = cheerio.load(html);
  const contentEl = $("#content");
  contentEl.find("script, style").remove();

  const titleFromHeading = contentEl.find("h1").first().text().trim();
  const titleFromDoc =
    $("title").text().replace(/\s*\|\s*Kšírovka.*$/, "").trim();
  const title =
    titleFromHeading ||
    (titleFromDoc.includes(",") ? slug.replace(/-/g, " ") : titleFromDoc) ||
    slug;
  const metaDescription = $('meta[name="description"]').attr("content") ?? null;

  const heroImage =
    contentEl.find(".hero img, .bg-media img, img").first().attr("src") ??
    contentEl.find(".bg-image").first().attr("src") ??
    null;

  // Remove hero block so SPA can render its own hero + title
  contentEl.find(".app-pagecontenttype-hero, .hero").remove();
  contentEl.find("h1").first().remove();

  return {
    slug,
    title,
    metaDescription,
    contentHtml: cleanHtml(contentEl.html() ?? ""),
    heroImage: heroImage ? absolutizeUrl(heroImage) : null,
    template: slug.startsWith("fotogalerie") || slug === "foto" ? "gallery" : "default",
  };
}

function parseArticle(html: string, slug: string) {
  const $ = cheerio.load(html);
  const title =
    $("#content h1, #content h2").first().text().trim() ||
    slug.replace(/-/g, " ");
  const excerpt =
    $("#content .rte p, #content p")
      .first()
      .text()
      .trim()
      .slice(0, 300) || null;
  const coverImage = $("#content img").first().attr("src");
  const contentHtml = cleanHtml($("#content").html() ?? "");

  return {
    slug,
    title,
    excerpt,
    contentHtml,
    coverImage: coverImage ? absolutizeUrl(coverImage) : null,
    publishedAt: new Date().toISOString(),
  };
}

function parseHomepage(html: string) {
  const $ = cheerio.load(html);
  const slides: Array<{
    title: string;
    subtitle: string | null;
    contentHtml: string | null;
    imageUrl: string;
    mobileImageUrl: string | null;
    sortOrder: number;
  }> = [];

  $(".splide__slide").each((i, el) => {
    const slide = $(el);
    const title = slide.find("h1").text().trim();
    const contentHtml = slide.find(".rte").html();
    const imageUrl = slide.find(".desktop-image").attr("src");
    const mobileImageUrl = slide.find(".mobile-image").attr("src") ?? null;
    if (title && imageUrl) {
      slides.push({
        title,
        subtitle: slide.find(".rte p").first().text().trim() || null,
        contentHtml: contentHtml ? cleanHtml(contentHtml) : null,
        imageUrl: absolutizeUrl(imageUrl),
        mobileImageUrl: mobileImageUrl
          ? absolutizeUrl(mobileImageUrl)
          : null,
        sortOrder: i,
      });
    }
  });

  const tiles: Array<{
    slug: string;
    label: string;
    href: string;
    imageUrl: string;
    sortOrder: number;
  }> = [];

  $(".submenu-tiles li a").each((i, el) => {
    const link = $(el);
    const href = link.attr("href") ?? "/";
    const label = link.find(".tile-title, .tile").text().trim() || link.text().trim();
    const imageUrl = link.find("img.bg-image").attr("src");
    if (imageUrl) {
      tiles.push({
        slug: href.replace(/^\//, "") || "home",
        label: label.split("\n")[0].trim(),
        href,
        imageUrl: absolutizeUrl(imageUrl),
        sortOrder: i,
      });
    }
  });

  return { slides, tiles };
}

async function discoverArticleSlugs(): Promise<string[]> {
  try {
    const html = await fetchPage("/novinky");
    const slugs = [
      ...html.matchAll(/href="\/novinky\/([^"#?]+)"/g),
    ].map((m) => m[1]);
    const unique = [...new Set(slugs)];
    return unique.length > 0 ? unique : FALLBACK_ARTICLE_SLUGS;
  } catch {
    return FALLBACK_ARTICLE_SLUGS;
  }
}

async function main() {
  console.log("Importing content from", BASE_URL);

  const homepageHtml = await fetchPage("/");
  const homepage = parseHomepage(homepageHtml);

  const pages = [];
  for (const slug of PAGE_SLUGS) {
    try {
      const html = await fetchPage(`/${slug}`);
      pages.push(parsePage(html, slug));
      console.log("  page:", slug);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn("  skip page:", slug, e);
    }
  }

  const articleSlugs = await discoverArticleSlugs();
  console.log(`Discovered ${articleSlugs.length} articles`);

  const articles = [];
  for (const slug of articleSlugs) {
    try {
      const html = await fetchPage(`/novinky/${slug}`);
      articles.push(parseArticle(html, slug));
      console.log("  article:", slug);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn("  skip article:", slug, e);
    }
  }

  const output = { homepage, pages, articles, importedAt: new Date().toISOString() };
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log("Saved to", OUTPUT);
}

main().catch(console.error);
