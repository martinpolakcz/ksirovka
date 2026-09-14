import { assetUrl } from "./utils";

export const GOLF_HERO_IMAGE = assetUrl("/user_uploads/banery /IVAH66101.jpg");

export const drivingRangeContent = {
  title: "Driving Range",
  subtitle: "Nejmodernější golfový tréninkový areál v centru Brna",
  heroImage: GOLF_HERO_IMAGE,
  intro: {
    heading: "Nejmodernější golfový tréninkový areál v centru Brna",
    image: assetUrl("/user_uploads/Golf/web_R3X_3627.jpg"),
    paragraphs: [
      "Kšírovka nabízí prvotřídní zázemí jak pro pokročilé golfisty, tak pro naprosté začátečníky.",
      "Tréninkovému areálu dominuje driving range s třiceti odpalovacími – travnatými i umělými – odpališti.",
      "Dále je zde chipping zóna, kde nechybí ani čtyři pískové překážky různých rozměrů a hloubek.",
      "Společně ještě se dvěma putting a pitching greeny Kšírovka představuje místo, které umožňuje nácvik všech herních situací, které zažijete při hře na golfovém hřišti.",
    ],
    facilities: [
      {
        title: "Driving Range",
        subtitle: "pro nácvik dlouhých úderů",
        description: "30 stání, hra z travnatých i umělých odpališť",
      },
      {
        title: "Putting Greens",
        subtitle: "pro trénink puttování",
        description: "k dispozici jsou dva greeny",
      },
      {
        title: "Chipping Area",
        subtitle: "pro cvičení přihrávek",
        description:
          "tři cvičné greeny s různými povrchy, čtyři pískové překážky různých rozměrů a hloubek",
      },
      {
        title: "Osvětlený driving range a centrální putting green",
        subtitle: "",
        description: "",
      },
    ],
  },
  features: {
    image: assetUrl("/user_uploads/Golf/web_R3X_3789.jpg"),
    items: [
      {
        title: "Deset krytých odpališť",
        description:
          "Budete chráněni proti dešti, větru i slunci. I proto můžete u nás hrát za každého počasí. Abychom zachovali vysokou kvalitu trávy, pravidelně střídáme strany, kdy je možné hrát z trávy. Pokud je hra z trávy zrovna směřována před krytá odpaliště, prosíme, respektujte golfisty na trávě a směřujte svoji hru do vzdálenějších kójí odpaliště nebo na podložky. Vždy je to na domluvě mezi přítomnými hráči. Jestliže prší/sněží, přednost má hráč v kóji.",
      },
      {
        title: "Deset vyhřívaných odpališť",
        description: "můžete hrát venku i v zimě",
      },
      {
        title: "Celoroční provoz",
        description: "u nás se hraje 360 dní v roce, neznáme víkendy ani svátky",
      },
    ],
  },
};

export const golfAcademyContent = {
  title: "Golfová akademie",
  subtitle: "Šestijamkové veřejné hřiště",
  heroImage: GOLF_HERO_IMAGE,
  course: {
    heading: "Šestijamkové veřejné hřiště",
    image: assetUrl("/user_uploads/Golf/R3X_4374.jpg"),
    paragraphs: [
      "Kromě cvičných ploch nabízí Kšírovka golfovou akademii – šestijamkové golfové hřiště určené široké veřejnosti.",
      "Šest jamkovek s parem 3, dlouhými od 48 do 134 metrů. To vše s výhledem na nádherné brněnské panorama – hrad Špilberk a katedrálu sv. Petra a Pavla.",
    ],
    reservationUrl: "https://eshop.ksirovka.cz/rezervace",
  },
  tips: {
    heading: "Pár dobrých rad",
    image: assetUrl("/user_uploads/Golf/_C5A4109.jpg"),
    items: [
      "Buďte na hřišti co nejtišší a ohleduplní – ostatní hráči si zaslouží klid na hru.",
      "Odpalujte míček až po pečlivém zkontrolování, že neohrozíte ostatní.",
      "Pokud vás dojde rychlejší skupina, zdvořile ji pusťte.",
      "Pohybujte se mezi jamkami rychle a efektivně, jakmile ostatní hráči soustředí pozornost na svou hru, připravujte se na svůj odpal.",
      "Posouvejte své bagy a další vybavení směrem k další jamce, aby hra plynula rychleji.",
      "Nezapisujte skóre během hry na jamce, udělejte to až na příštím odpališti.",
      "Respektujte pokyny personálu.",
    ],
  },
};

export interface Trainer {
  name: string;
  image: string;
  role: string;
  details: string[];
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  pricing?: string[];
}

export const trainersContent = {
  title: "Naši trenéři",
  subtitle: "Profesionální golfová výuka na Kšírovce",
  heroImage: GOLF_HERO_IMAGE,
  intro: [
    "Chcete se golf naučit co nejlépe a co nejrychleji? Společně s našimi profesionálními trenéry pro Vás zajistíme individuální i skupinové golfové lekce, tréninky pro Vaše děti, golfové akademie i vícedenní golfové kurzy.",
    'Chcete-li začít s golfem nebo získat tak zvanou "zelenou kartu", vyberte si svého trenéra a dohodněte si s ním postup a čas, který bude vyhovovat právě Vám.',
    "Bližší informace Vám také rádi poskytneme na recepci Kšírovky +420 605 700 717.",
  ],
  trainers: [
    {
      name: "Tomáš Braun",
      image: assetUrl("/user_uploads/Golf/IVAH0307.jpg"),
      role: "PGA Golf Professional",
      details: [
        "Člen PGA od roku 2008",
        "Kšírovka od 2014",
        "Finále Extraligy družstev 2006",
        "Vyučuje v češtině",
      ],
      phone: "+420 724 990 070",
      email: "tomas@zijeme-golfem.cz",
      pricing: [
        "25 minut 500 Kč",
        "50 minut 1000 Kč",
        "Předplacení 10 lekcí naráz 9000 Kč",
        "Osvědčení pro hru na hřišti 2500 Kč",
      ],
    },
    {
      name: "Martin Laimar",
      image: assetUrl("/user_uploads/Golf/IVAH0294.jpg"),
      role: "PGA HEAD Professional",
      details: [
        "Člen PGA od roku 2000",
        "Olomouc 2000 – 2004, Kaskáda 2004 – 2023",
        "Kšírovka od 2023",
        "Vyučuje v češtině a angličtině",
      ],
      phone: "+420 604 290 812",
      email: "martin.laimar@seznam.cz",
      pricing: [
        "Individuální lekce – 1200 Kč / 50 min.",
        "Zvýhodněné balíčky: 10 + 2 zdarma – 12000 Kč, 5 + 1 zdarma – 6000 Kč",
        "Skupinová výuka – od 300 Kč",
        "Výměna gripu – 100 Kč + cena gripu dle vlastního výběru",
      ],
    },
    {
      name: "Mgr. Jana Doležalová",
      image: assetUrl("/user_uploads/Golf/IVAH6428.jpg"),
      role: "Trenérka golfu ČGF III. třídy",
      details: [
        "Certifikovaná lektorka SNAG golfu",
        "Zaměření na ladies golf a golf pro děti",
        "Sportovní koučka s pedagogickým a psychologickým vzděláním",
      ],
      phone: "+420 774 444 659",
      email: "golfgen@email.cz",
      website: "https://www.golfgen.cz",
    },
    {
      name: "Mgr. Dalibor Směšný",
      image: assetUrl("/user_uploads/Golf/IVAH6439.jpg"),
      role: "Golf Professional",
      details: [
        "Kšírovka od 2014",
        "Vyučuje v češtině, němčině a angličtině",
        "Certifikovaný Titleist Performance Institute instruktor",
      ],
      phone: "+420 776 656 556",
      email: "dsgolf@email.cz",
    },
    {
      name: "Adam Studený",
      image: assetUrl("/user_uploads/Golf/33bf5742-2211-45d7-9003-7ea5d936b4aa.JPG"),
      role: "PGA Professional A",
      details: [
        "Člen PGA od roku 2015",
        "Kaskáda 2015 – 2021",
        "Kšírovka od 2022",
        "Vyučuje v češtině a angličtině",
      ],
      phone: "+420 736 692 550",
      email: "adamstudeny@gmail.com",
      instagram: "studeny_golf_pro",
      pricing: [
        "Individuální lekce – 30 minut / 600 Kč, 60 minut / 1000 Kč",
        "Děti do 18 let – 60 minut / 800 Kč",
        "Balíček 10 lekcí – 9000 Kč",
      ],
    },
  ] satisfies Trainer[],
};
