import { assetUrl } from "./utils";

export const HOPSALKOV_HERO = assetUrl("/user_uploads/banery /IVAH997122.JPG");
export const HOPSALKOV_PHONE = "+420 603 166 466";

export const hopsalkovParkContent = {
  title: "Hopsálkov",
  subtitle: "Největší venkovní zábavní park v Brně",
  category: "Hopsálkov",
  heroImage: HOPSALKOV_HERO,
  intro: {
    heading: "Park sportu a zábavy",
    image: assetUrl("/user_uploads/Hopsálkov/IVAH9999 (2).JPG"),
    paragraphs: [
      "Největší venkovní zábavní park v Brně se sedmi velkými nafukovacími trampolínami, závodní arénou se šlapacími autíčky, bazénem s lodičkami, překážkovou nafukovací dráhou Ninja Faktor, obřím pískovištěm s plážovým pískem, stánkem s občerstvením a spoustou dalších atrakcí.",
      "Hřiště je určeno pro děti i dospělé od 2 do 99 let. Dospělí si mohou užít s dětmi jak skákání na trampolínách, tak závody na autíčkách.",
    ],
  },
  attractions: [
    {
      title: "7 vzduchových trampolín",
      description: "Různé tvary a velikosti pro malé i velké skokany.",
    },
    {
      title: "Šlapací autíčka",
      description: "Závodní aréna pro bezpečné souboje o první místo.",
    },
    {
      title: "Bazén s lodičkami",
      description: "Vodní zábava pro nejmenší i větší děti.",
    },
    {
      title: "Ninja Faktor",
      description: "Překážková nafukovací dráha plná výzev.",
    },
    {
      title: "Obří pískoviště",
      description: "Plážový písek a prostor pro kreativní hry.",
    },
    {
      title: "Občerstvení a odpočinek",
      description: "Slunečníky, lavičky, lehátka a sedací vaky.",
    },
  ],
  extras: {
    heading: "Ještě víc zábavy",
    image: assetUrl("/user_uploads/Hopsálkov/IVAH0589 (1).JPG"),
    items: [
      "Místa pro dětské narozeninové oslavy",
      "Zapůjčení grilu nebo ohniště",
      "Vítáme školky, školy, tábory a sportovní kluby",
      "Certifikované atrakce",
      "Po dovádění další aktivity v areálu – fotbalgolf, minigolf i golf",
    ],
    notes: [
      "Cyklisté jsou vítáni.",
      "Vstup se psy není povolen.",
    ],
  },
  cta: {
    phone: HOPSALKOV_PHONE,
    reservationUrl: "https://eshop.ksirovka.cz/rezervace",
  },
};

export const hopsalkovBirthdaysContent = {
  title: "Narozeninové oslavy",
  subtitle: "Místo, kde dětské oslavy nabírají nový rozměr",
  category: "Hopsálkov",
  heroImage: assetUrl("/user_uploads/banery /web_oslavy2212.JPG"),
  intro: {
    heading: "Dobrodružství a radost pro každou oslavu",
    image: assetUrl("/user_uploads/Hopsálkov/IVAH9999 (2).JPG"),
    paragraphs: [
      "Nabízíme ideální prostředí pro oslavy narozenin a speciálních událostí pro děti různých věkových kategorií.",
      "V areálu je k dispozici několik míst vhodných pro menší i větší oslavy.",
    ],
  },
  expectations: {
    heading: "Co můžete očekávat?",
    items: [
      "Široká nabídka atrakcí – trampolíny, autíčka, lodičky, Ninja Faktor a další",
      "Vyhrazené místo pro oslavu a občerstvení",
      "Možnost zapůjčení grilu nebo ohniště",
      "Atmosféra venkovního parku ideální pro focení a hry",
    ],
  },
  cta: {
    phone: HOPSALKOV_PHONE,
    text: "Rezervujte termín oslavy telefonicky nebo přes e-shop.",
    reservationUrl: "https://eshop.ksirovka.cz/rezervace",
  },
};

export const hopsalkovPricingContent = {
  title: "Ceník – Hopsálkov",
  subtitle: "Vstupné do parku sportu a zábavy",
  category: "Hopsálkov",
  heroImage: HOPSALKOV_HERO,
  groups: [
    {
      heading: "Základní vstupné",
      items: [
        { label: "Hopsálci (2–18 let) – 60 minut", price: "170 Kč*" },
        { label: "Hopsálci (2–18 let) – celodenní", price: "270 Kč" },
        { label: "Děti do 2 let", price: "zdarma" },
        { label: "Dospělí – celodenní", price: "140 Kč" },
        { label: "Rodinné vstupné (2 dospělí + 2 děti do 18 let)", price: "680 Kč" },
      ],
      note: "* Při vstupu je nutné nejprve uhradit celodenní vstup. Pokud opustíte areál do 60 minut od zaplacení, rozdíl vám vrátíme.",
    },
    {
      heading: "Slevy a benefity",
      items: [
        {
          label: "Multisport – dospělí",
          price: "celodenní vstup zdarma",
        },
        {
          label: "Multisport – děti",
          price: "hodinový vstup zdarma",
        },
        {
          label: "Skupiny (školy, školky, kluby)",
          price: "individuální nabídka",
        },
      ],
    },
  ],
  cta: {
    phone: HOPSALKOV_PHONE,
  },
};

export const hopsalkovCampsContent = {
  title: "Příměstské tábory",
  subtitle: "Sportovní tábor s Lenkou v areálu Kšírovka / Hopsálkov",
  category: "Hopsálkov",
  heroImage: HOPSALKOV_HERO,
  intro: {
    heading: "Příměstský sportovní tábor s Lenkou",
    image: assetUrl("/user_uploads/Hopsálkov/IVAH0589 (1).JPG"),
    paragraphs: [
      "Pro děti 7–10 let, které s golfem zkušenost nemají, nebo mají zatím jen velmi malou.",
      "Program kombinuje pohyb, hry a zábavu v areálu Kšírovka a Hopsálkov.",
    ],
  },
  details: [
    { label: "1. turnus", value: "13. 7. – 17. 7. 2026" },
    { label: "2. turnus", value: "20. 7. – 24. 7. 2026" },
    { label: "3. turnus", value: "17. 8. – 21. 8. 2026" },
    { label: "4. turnus", value: "24. 8. – 28. 8. 2026" },
    {
      label: "Kde",
      value:
        "Golfový areál Kšírovka, K Lávce 705/8, Brno – Horní Heršpice a sportovní areál Hněvkovského, Brno – Komárov",
    },
    { label: "Pro", value: "děti od 7 do 10 let, max. 20 dětí na turnus" },
  ],
  cta: {
    phone: HOPSALKOV_PHONE,
    reservationUrl: "https://eshop.ksirovka.cz/rezervace",
  },
};

export const hopsalkovRulesContent = {
  title: "Provozní řád",
  subtitle: "Pravidla návštěvy dětského hřiště Hopsálkov",
  category: "Hopsálkov",
  heroImage: assetUrl("/user_uploads/Hopsálkov/IVAH9969.JPG"),
  intro: [
    "Návštěvní a provozní řád je bez výjimky závazný pro všechny návštěvníky dětského hřiště Hopsálkov po celou dobu jejich návštěvy.",
    "Zakoupením vstupenky a vstupem do areálu návštěvník vyjadřuje souhlas s provozním řádem.",
  ],
  operator:
    "Provozovatel: Central Golf, s.r.o., Lužánecká 1889/12, 602 00 Brno, IČO: 29278384",
  highlights: [
    "Provozní doba je uvedena na webu Kšírovky a u vstupu do areálu.",
    "Děti musí být pod dohledem dospělé osoby.",
    "Vstup se psy není povolen.",
    "Respektujte pokyny personálu a bezpečnostní pravidla atrakcí.",
    "Areál opouštějte včas a chovejte se ohleduplně k ostatním návštěvníkům.",
  ],
};
