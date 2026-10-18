# Android / Google Play — postup (2026-09-20 15:19)

Pracovní kopie: `/Users/martin.polak/Projects/ksirovka-app2/ksirovka-app`  
Package už je v `app.json`: `cz.ksirovka.scorecard`. Adaptive ikony existují. EAS projekt `@martinpolak/ksirovka-scorecard`.  
iOS je v TestFlight; Android store listing **ještě není**.

Dva režimy: **A) jen na svůj telefon** (APK, bez Play), **B) Google Play** (AAB + Play Console).

---

## A) Rychlý test na Android telefonu (bez obchodu)

Stejný kód, EAS profile `preview` umí interně sdílet instalaci. Pro soubor k instalaci mimo Play:

```bash
cd /Users/martin.polak/Projects/ksirovka-app2/ksirovka-app
npx eas-cli whoami
npx eas-cli build --platform android --profile preview
```

V `eas.json` má `preview` `"distribution": "internal"`. EAS defaultně u preview často staví APK; pokud vznikne AAB, přidej do profile:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

Po buildu: odkaz z EAS dashboard → nainstalovat na telefon (povolit neznámé zdroje). API je stejné jako u iOS: `https://ksirovka.martinpolak.cz/api/v1`.

---

## B) Google Play (jako App Store u iPhonu)

### 1. Účet (jednorázově, ~25 USD)
- [Google Play Console](https://play.google.com/console/signup) — **jednorázový** poplatek, ne roční jako Apple.
- Stejné Google konto, které bude vlastnit appku.

### 2. Aplikace v Play Console **před** `eas submit`
- Create app: název **Kšírovka Scorecard**, výchozí jazyk čeština, app (ne hra), bez reklamy pokud platí.
- Package name při prvním nahrání musí být `cz.ksirovka.scorecard` — nejde později změnit.
- Doplnit: Data safety, content rating (IARC dotazník), cílové publikum, privacy policy URL (stejný blocker jako u iOS).

### 3. Google Service Account pro EAS Submit
Play nepustí nahrání heslem. EAS potřebuje JSON klíč:
1. Google Cloud projekt napojený na Play Console.
2. Service account s právem k Play Developer API (typicky *Release Manager* / *Admin* podle aktuálního UI).
3. Stáhnout JSON (ne do gitu).
4. `npx eas-cli credentials --platform android` → production → Google Service Account → Upload key.

Návod Expo: https://docs.expo.dev/submit/android/

### 4. Production AAB (Play vyžaduje bundle, ne APK)

```bash
cd /Users/martin.polak/Projects/ksirovka-app2/ksirovka-app
npx eas-cli build --platform android --profile production
```

- Profile `production` má `autoIncrement: true` → EAS zvedne `android.versionCode`.
- První Android build: EAS vygeneruje keystore (nechat na EAS, stáhnout zálohu do vaultu).
- Výstup: `.aab`. Nesmí být `buildType: apk` na production.

### 5. Nahrání

```bash
npx eas-cli submit --platform android --profile production
```

První submit jde na **internal testing** track. Až bude listing hotový, v Play Console promote na closed/open testing nebo production.

Volitelně do `eas.json` `submit.production.android`:

```json
"android": {
  "track": "internal",
  "releaseStatus": "draft"
}
```

`draft` = nahraje se binárka, rollout dokončíš v Console.

### 6. Listing (stejná práce jako App Store)
- Screenshoty (telefon; 7" / 10" tablet volitelně).
- Krátký + plný popis, ikona 512×512 (z `assets/icon.png`).
- Privacy policy URL, Data safety (e-mail + jméno lokálně + sync na API).
- Content rating.
- Pak **Review and publish**. Recenze Google obvykle hodin až pár dní.

---

## Co už je hotové vs. co chybí

| Položka | Stav |
| --- | --- |
| `android.package` | hotovo `cz.ksirovka.scorecard` |
| Adaptive icon | soubory v `app.json` |
| EAS project / Expo login | hotovo (iOS) |
| `android.versionCode` v app.json | 2 (EAS autoIncrement 2026-09-20) |
| Play Developer účet | schválený 2026-09-23 |
| App v Play Console | **ověřit / vytvořit** (název Kšírovka, package `cz.ksirovka.scorecard`) |
| Service account JSON | **chybí** — `eas submit -p android` proto padá |
| Production AAB | `414162cf` (1.0.0 / 4); nový build s jazykovou ikonou běží (versionCode 5) |
| Preview APK (telefon) | `926c8d8c` (1.0.0 / 4) |
| Privacy URL | **chybí** (blokuje i listing) |

---

## Příkazy na jedno místo

```bash
cd /Users/martin.polak/Projects/ksirovka-app2/ksirovka-app

# jen svůj telefon
npx eas-cli build --platform android --profile preview

# obchod
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform android --profile production
```
