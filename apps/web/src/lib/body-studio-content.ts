import { assetUrl } from "./utils";
import type { Trainer } from "./golf-content";

export const bodyStudioTrainersContent = {
  title: "Trenéři",
  subtitle: "Body studio Kšírovka",
  heroImage: assetUrl("/user_uploads/banery /shutterstock_1779707291 (1).jpg"),
  intro: [
    "Náš tým certifikovaných lektorů pilates reformer, power plate a kondičních trenérů vás provede cvičením na míru.",
    "Bližší informace a rezervace lekcí: lenusa.fucikova@seznam.cz, +420 731 507 070.",
  ],
  trainers: [
    {
      name: "Mgr. Lenka Zeman Fučíková",
      image: assetUrl("/user_uploads/Body studio/IVAH6728.jpg"),
      role: "Zakladatelka studia, lektor pilates reformer a power plate",
      details: [
        "Kondiční trenér, sportovní manažer a koordinátor eventů na Kšírovce",
        "Absolvent: Masarykova univerzita, Fakulta sportovních studií, Management sportu",
        "Absolvované kurzy a licence: Hormonální jogová terapie, DNS podle Koláře/sportovní kurz I a II, Kondiční trenér dětí a mládeže, Diastáza, Pánevní dno, Barefoot, Blackroll, Core trénink, Sportovní tape, Power plate, Circuit training, Pilates STOTT, Pilates reformer, Dynamic Training, TRX Suspension Training, H.E.A.T., Bosu Core, Fitbox, Spinning, Aerobik a další.",
      ],
      phone: "+420 731 507 070",
      email: "lenusa.fucikova@seznam.cz",
    },
    {
      name: "Mgr. Bc. Tadeáš Aulehla",
      image: assetUrl("/user_uploads/Body studio/jACEK.jpg"),
      role: "Osobní trenér, kondiční trenér, power plate",
      details: [
        "Absolvent: Masarykova univerzita, Fakulta sportovních studií – Osobní kondiční trenér a Ekonomicko-správní fakulta – Podnikový management",
        "Sportovní úspěchy: 19 let hokej na vrcholové úrovni. Mistr ČR v ledním hokeji v kategorii 8. tříd. 3 roky aktivní hráč v severní Americe. V roce 2023 3. místo Akademické mistrovství ČR ve vzpírání ve váhové kategorii do 96 kg.",
      ],
      email: "tadeas.aulehla@gmail.com",
    },
    {
      name: "Mgr. Lucie Mátéová",
      image: assetUrl("/user_uploads/Body studio/web_ivah4506.jpg"),
      role: "Lektor reformer pilates s certifikací a kondiční trenér",
      details: [
        "Vedoucí příměstských táborů pro děti",
        "Absolvent: Univerzita Tomáše Bati, Fakulta multimediálních komunikací / Marketingová komunikace",
        "Absolvované kurzy a licence: Alpinning instruktor, Jumping instruktor, fitMAMI basic, cvičení v těhotenství a po porodu, cvičení pro zdravá záda, pilates pro diastázu, metodika pohybové výchovy předškolních dětí, anatomie v kostce, diastáza a zdravá páteř, pilates s pomůckami, trupová stabilizace 1+2, certifikovaný instruktor pilates.",
      ],
    },
    {
      name: "Bc. Kateřina Vávrová",
      image: assetUrl("/user_uploads/Body studio/web_ivah4428.jpg"),
      role: "Lektor pilates reformer s certifikací, kondiční trenér",
      details: [
        "Absolvent: Masarykova univerzita, Fakulta ekonomicko-správní",
        "Absolvované kurzy a licence: certifikace osobního trenéra, vývojová kineziologie, TRX, stabilizace ramene a kyčle, diagnostika a trénink flexibility, kineziologie tlakových a tahových cviků, diastáza, těhotné a po porodu, pánevní dno, stretching, komplexní silový trénink, kompenzační cvičení, trigger pointy, fascie a jejich uvolnění, bolavá záda, pilates, pilates reformer.",
      ],
    },
    {
      name: "Bc. Lucie Sedlák",
      image: assetUrl("/user_uploads/Body studio/web_ivah4375.jpg"),
      role: "Lektor reformer pilates s certifikací",
      details: [
        "Osvědčení o získání profesní kvalifikace: Instruktorka cvičení metodou Pilates (RNDr. Veronika Vaverková Ph.D.)",
        "Absolvování vzdělávacího programu Reformer essential + intermediate, pilates s pomůckami, pilates reformer v těhotenství, pilates a práce s diastázou, reformer advanced",
        "Barre Teacher Training – Lenka Krejčová, Barre Academy",
      ],
    },
    {
      name: "Ing. Irena Pelánková",
      image: assetUrl("/user_uploads/Body studio/abb6d742-4762-44b7-a110-5cf657960166 (1).jpeg"),
      role: "Lektor reformer pilates s certifikací",
      details: [
        "myPilates Academy – certifikáty: instruktor MAT 1, 2, Reformer 1, 2 Balanced Body",
        "Pilates Point Jitka Miškářová – Cadillac",
        "IQ pohyb Daniel Muller: pěnový válec, core, axiální systém, pletenec horní a dolní končetiny",
        "Spiraldynamic Basic Move kurz, SM Systém – Alex Kling, Fitness instruktor Basic (Wellness school Evy Blahušové)",
        "Fitness Instruktor Pilatesova metoda cvičení, Školení rozhodčích a trenérek moderní gymnastiky Brno",
        "Instruktor Body and Mind, Certifikát 2. stupeň reiki, Kurz Reflexologie plosky nohy",
      ],
    },
  ] satisfies Trainer[],
};
