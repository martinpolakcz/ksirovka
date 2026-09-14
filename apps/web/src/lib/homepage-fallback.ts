import type { HomepageData } from "./api";
import { assetUrl } from "./utils";
import { siteConfig } from "./navigation";

export const homepageFallback: HomepageData = {
  heroSlides: [
    {
      id: 1,
      title: "AKCE NA KŠÍROVCE",
      subtitle: "FIREMNÍ EVENTY, ROZLUČKY SE SVOBODOU, OSLAVY NAROZENIN",
      contentHtml: "<p>FIREMNÍ EVENTY, ROZLUČKY SE SVOBODOU, OSLAVY NAROZENIN</p>",
      imageUrl: assetUrl("/uploads/fedexksirovka-42-1-ca85a019aeda6ed6dd12e815d244f03e.jpg"),
      mobileImageUrl: null,
      linkUrl: null,
      sortOrder: 0,
    },
    {
      id: 2,
      title: "DARUJ VOUCHER",
      subtitle: "SKVĚLÝ DÁREK PRO KAŽDÉHO MILOVNÍKA AKTIVNÍHO ODPOČINKU",
      contentHtml:
        '<p>SKVĚLÝ DÁREK PRO KAŽDÉHO MILOVNÍKA AKTIVNÍHO ODPOČINKU</p><p>NALEZNETE NA NAŠEM <a href="https://eshop.ksirovka.cz/" target="_blank">e-shopu</a>.</p>',
      imageUrl: assetUrl("/uploads/img-891822-8e9a09db84fbe15c61d8ac3c27f2b315.jpg"),
      mobileImageUrl: null,
      linkUrl: null,
      sortOrder: 1,
    },
    {
      id: 3,
      title: "BODY STUDIO",
      subtitle: "PILATES REFORMER STUDIO A SOLÁRIUM",
      contentHtml: "<p>PILATES REFORMER STUDIO A SOLÁRIUM</p>",
      imageUrl: assetUrl("/uploads/web-ivah4705-54b270bddbb079628530813b71c6c1d1.jpg"),
      mobileImageUrl: null,
      linkUrl: null,
      sortOrder: 2,
    },
    {
      id: 4,
      title: "PŘIPRAVUJEME ADVENTURE GOLF",
      subtitle: "NOVÁ AKTIVITA PRO CELOU RODINU, JIŽ BRZY NA KŠÍROVCE!",
      contentHtml: "<p>NOVÁ AKTIVITA PRO CELOU RODINU, JIŽ BRZY NA KŠÍROVCE!</p>",
      imageUrl: assetUrl("/uploads/ivah6609-26c16742736e207c87e8c4333c3b21be.jpg"),
      mobileImageUrl: null,
      linkUrl: null,
      sortOrder: 3,
    },
    {
      id: 5,
      title: "FOTBALGOLF",
      subtitle: "KOMBINACE FOTBALU A GOLFU",
      contentHtml:
        "<p>KOMBINACE FOTBALU A GOLFU</p><p>18 JAMEK A SPOUSTA PŘEKÁŽEK. NEVŠEDNÍ ZÁBAVA PRO MALÉ I VELKÉ</p>",
      imageUrl: assetUrl("/uploads/ivah0305-0912a9eec4d2cef6fbdf2d0b48e5d36e.JPG"),
      mobileImageUrl: null,
      linkUrl: null,
      sortOrder: 4,
    },
  ],
  activityTiles: [
    { id: 1, slug: "golf", label: "Golf", href: "/driving-range", imageUrl: assetUrl("/user_uploads/submenu/obrazky/golf.jpg"), sortOrder: 0 },
    { id: 2, slug: "hopsalkov", label: "Hopsálkov", href: "/park-sportu-a-zabavy", imageUrl: assetUrl("/user_uploads/submenu/obrazky/hopsalkov.jpg"), sortOrder: 1 },
    { id: 3, slug: "body-studio", label: "Body studio", href: "/body-studio-ksirovka", imageUrl: assetUrl("/user_uploads/submenu/obrazky/body-studio.jpg"), sortOrder: 2 },
    { id: 4, slug: "minigolf", label: "Minigolf", href: "/charakteristika-hry-1", imageUrl: assetUrl("/user_uploads/submenu/obrazky/minigolf.jpg"), sortOrder: 3 },
    { id: 5, slug: "fotbalgolf", label: "Fotbalgolf", href: "/charakteristika-hry", imageUrl: assetUrl("/user_uploads/submenu/obrazky/fotbalgolf.jpg"), sortOrder: 4 },
    { id: 6, slug: "bistro", label: "Bistro", href: "/popis", imageUrl: assetUrl("/user_uploads/submenu/obrazky/bistro.jpg"), sortOrder: 5 },
    { id: 7, slug: "akce", label: "Akce", href: "/teambuildingy-a-firemni-akce", imageUrl: assetUrl("/user_uploads/submenu/obrazky/akce.jpg"), sortOrder: 6 },
  ],
  articles: [
    {
      id: 1,
      slug: "ksirovka-cup-2026",
      title: "KŠÍROVKA CUP 2026",
      excerpt: "Dovolujeme si Vás pozvat na utkání o mistra/mistryni klubu KŠÍROVKA! 23.9.2026 na hřišti Austerlitz",
      contentHtml: "",
      coverImage: null,
      publishedAt: null,
    },
    {
      id: 2,
      slug: "co-se-deje-na-ksirovce",
      title: "CO SE DĚJE NA KŠÍROVCE",
      excerpt: "Letos jsme si konečně mohli začít plnit jeden z našich dlouhodobých snů a proměňovat plány ve skutečnost",
      contentHtml: "",
      coverImage: null,
      publishedAt: null,
    },
    {
      id: 3,
      slug: "jaro-je-tu",
      title: "JARO JE TU!",
      excerpt: null,
      contentHtml: "",
      coverImage: null,
      publishedAt: null,
    },
  ],
  galleries: [],
  contact: {
    phone: siteConfig.phone,
    email: siteConfig.email,
    address: siteConfig.address,
  },
};
