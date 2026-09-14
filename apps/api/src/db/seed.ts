import { db } from "./index.js";
import {
  pages,
  articles,
  heroSlides,
  activityTiles,
  tvPromos,
} from "./schema.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "../data/imported-content.json");

async function seed() {
  const fallbackHomepage = {
    slides: [
      {
        title: "AKCE NA KŠÍROVCE",
        subtitle: "FIREMNÍ EVENTY, ROZLUČKY SE SVOBODOU, OSLAVY NAROZENIN",
        contentHtml: "<p>FIREMNÍ EVENTY, ROZLUČKY SE SVOBODOU, OSLAVY NAROZENIN</p>",
        imageUrl: "https://ksirovka.cz/uploads/fedexksirovka-42-1-ca85a019aeda6ed6dd12e815d244f03e.jpg",
        mobileImageUrl: null,
        sortOrder: 0,
      },
      {
        title: "DARUJ VOUCHER",
        subtitle: "SKVĚLÝ DÁREK PRO KAŽDÉHO MILOVNÍKA AKTIVNÍHO ODPOČINKU",
        contentHtml: "<p>SKVĚLÝ DÁREK PRO KAŽDÉHO MILOVNÍKA AKTIVNÍHO ODPOČINKU</p><p>NALEZNETE NA NAŠEM <a href=\"https://eshop.ksirovka.cz/\" target=\"_blank\">e-shopu</a>.</p>",
        imageUrl: "https://ksirovka.cz/uploads/img-891822-8e9a09db84fbe15c61d8ac3c27f2b315.jpg",
        mobileImageUrl: null,
        sortOrder: 1,
      },
      {
        title: "BODY STUDIO",
        subtitle: "PILATES REFORMER STUDIO A SOLÁRIUM",
        contentHtml: "<p>PILATES REFORMER STUDIO A SOLÁRIUM</p>",
        imageUrl: "https://ksirovka.cz/uploads/web-ivah4705-54b270bddbb079628530813b71c6c1d1.jpg",
        mobileImageUrl: null,
        sortOrder: 2,
      },
      {
        title: "PŘIPRAVUJEME ADVENTURE GOLF",
        subtitle: "NOVÁ AKTIVITA PRO CELOU RODINU, JIŽ BRZY NA KŠÍROVCE!",
        contentHtml: "<p>NOVÁ AKTIVITA PRO CELOU RODINU, JIŽ BRZY NA KŠÍROVCE!</p>",
        imageUrl: "https://ksirovka.cz/uploads/ivah6609-26c16742736e207c87e8c4333c3b21be.jpg",
        mobileImageUrl: null,
        sortOrder: 3,
      },
      {
        title: "FOTBALGOLF",
        subtitle: "KOMBINACE FOTBALU A GOLFU",
        contentHtml: "<p>KOMBINACE FOTBALU A GOLFU</p><p>18 JAMEK A SPOUSTA PŘEKÁŽEK. NEVŠEDNÍ ZÁBAVA PRO MALÉ I VELKÉ</p>",
        imageUrl: "https://ksirovka.cz/uploads/ivah0305-0912a9eec4d2cef6fbdf2d0b48e5d36e.JPG",
        mobileImageUrl: null,
        sortOrder: 4,
      },
    ],
    tiles: [
      { slug: "golf", label: "Golf", href: "/driving-range", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/golf.jpg", sortOrder: 0 },
      { slug: "hopsalkov", label: "Hopsálkov", href: "/park-sportu-a-zabavy", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/hopsalkov.jpg", sortOrder: 1 },
      { slug: "body-studio", label: "Body studio", href: "/body-studio-ksirovka", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/body-studio.jpg", sortOrder: 2 },
      { slug: "minigolf", label: "Minigolf", href: "/charakteristika-hry-1", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/minigolf.jpg", sortOrder: 3 },
      { slug: "fotbalgolf", label: "Fotbalgolf", href: "/charakteristika-hry", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/fotbalgolf.jpg", sortOrder: 4 },
      { slug: "bistro", label: "Bistro", href: "/popis", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/bistro.jpg", sortOrder: 5 },
      { slug: "akce", label: "Akce", href: "/teambuildingy-a-firemni-akce", imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/akce.jpg", sortOrder: 6 },
    ],
  };

  let data: {
    homepage: typeof fallbackHomepage;
    pages: Array<{
      slug: string;
      title: string;
      metaDescription: string | null;
      contentHtml: string;
      heroImage: string | null;
      template: string;
    }>;
    articles: Array<{
      slug: string;
      title: string;
      excerpt: string | null;
      contentHtml: string;
      coverImage: string | null;
      publishedAt: string;
    }>;
  };

  if (existsSync(DATA_FILE)) {
    data = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
    console.log("Loaded imported content from", DATA_FILE);
  } else {
    console.log("No import file found, using fallback homepage data");
    data = { homepage: fallbackHomepage, pages: [], articles: [] };
  }

  await db.delete(heroSlides);
  await db.delete(activityTiles);
  await db.delete(pages);
  await db.delete(articles);

  if (data.homepage.slides.length) {
    await db.insert(heroSlides).values(
      data.homepage.slides.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        contentHtml: s.contentHtml,
        imageUrl: s.imageUrl,
        mobileImageUrl: s.mobileImageUrl,
        sortOrder: s.sortOrder,
        active: true,
      })),
    );
  }

  if (data.homepage.tiles.length) {
    await db.insert(activityTiles).values(
      data.homepage.tiles.map((t) => ({
        slug: t.slug,
        label: t.label,
        href: t.href,
        imageUrl: t.imageUrl,
        sortOrder: t.sortOrder,
      })),
    );
  }

  if (data.pages.length) {
    await db.insert(pages).values(
      data.pages.map((p) => ({
        slug: p.slug,
        title: p.title,
        metaDescription: p.metaDescription,
        contentHtml: p.contentHtml,
        heroImage: p.heroImage,
        template: p.template,
        published: true,
      })),
    );
  }

  if (data.articles.length) {
    await db.insert(articles).values(
      data.articles.map((a) => ({
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        contentHtml: a.contentHtml,
        coverImage: a.coverImage,
        publishedAt: new Date(a.publishedAt),
        published: true,
      })),
    );
  }

  const existingPromos = await db.select({ id: tvPromos.id }).from(tvPromos).limit(1);
  if (existingPromos.length === 0) {
    await db.insert(tvPromos).values([
      {
        slot: "ticker",
        category: "golf",
        title: "Driving range",
        message: "Driving range otevřen — přijď si odpálit pár míčů ještě dnes.",
        href: "/driving-range",
        imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/golf.jpg",
        sortOrder: 0,
      },
      {
        slot: "ticker",
        category: "golf",
        title: "Golfová akademie",
        message: "Začni s golfem na Kšírovce. Trenéři, 6jamek a junior akademie.",
        href: "/golfova-akademie",
        imageUrl: "https://ksirovka.cz/user_uploads/submenu/obrazky/golf.jpg",
        sortOrder: 1,
      },
      {
        slot: "ticker",
        category: "hopsalkov",
        title: "Hopsálkov",
        message: "Trampolíny, ninja dráha a šlapací autíčka — park sportu a zábavy.",
        href: "/park-sportu-a-zabavy",
        imageUrl: "https://ksirovka.cz/user_uploads/Hopsálkov/IVAH9999 (2).JPG",
        sortOrder: 2,
      },
      {
        slot: "ticker",
        category: "hopsalkov",
        title: "Narozeniny v Hopsálkově",
        message: "Oslava, ze které děti nepůjdou. Rezervuj termín v Hopsálkově.",
        href: "/narozeninove-oslavy",
        imageUrl: "https://ksirovka.cz/user_uploads/Hopsálkov/IVAH9999 (2).JPG",
        sortOrder: 3,
      },
      {
        slot: "featured",
        category: "golf",
        title: "Zahraj si golf",
        message: "Driving range, akademie i rezervace online. Dnes je ideální den na první ránu.",
        href: "https://eshop.ksirovka.cz/rezervace",
        imageUrl: "https://ksirovka.cz/user_uploads/Golf/web_R3X_3627.jpg",
        sortOrder: 0,
      },
      {
        slot: "featured",
        category: "hopsalkov",
        title: "Skoč do Hopsálkova",
        message: "Venkovní zábavní park pro celou partu. Trampolíny, ninja a spousta smíchu.",
        href: "/park-sportu-a-zabavy",
        imageUrl: "https://ksirovka.cz/user_uploads/Hopsálkov/IVAH9999 (2).JPG",
        sortOrder: 1,
      },
      {
        slot: "ticker",
        category: "venue",
        title: "Dárkové poukazy",
        message: "Golf, Hopsálkov i fotbalgolf — poukaz koupíš na e-shopu ksirovka.cz.",
        href: "https://eshop.ksirovka.cz/",
        imageUrl: "https://ksirovka.cz/uploads/img-891822-8e9a09db84fbe15c61d8ac3c27f2b315.jpg",
        sortOrder: 4,
      },
      {
        slot: "featured",
        category: "venue",
        title: "Daruj voucher",
        message: "Skvělý dárek pro milovníka pohybu. Koupíš ho na e-shopu, uplatní na recepci.",
        href: "https://eshop.ksirovka.cz/",
        imageUrl: "https://ksirovka.cz/uploads/img-891822-8e9a09db84fbe15c61d8ac3c27f2b315.jpg",
        sortOrder: 2,
      },
    ]);
    console.log("Seeded default TV promos");
  }

  console.log(
    `Seeded: ${data.homepage.slides.length} slides, ${data.homepage.tiles.length} tiles, ${data.pages.length} pages, ${data.articles.length} articles`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
