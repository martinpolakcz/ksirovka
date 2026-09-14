import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "apps/web/dist");
const deployTemplate = resolve(root, "deploy/webhosting");
const output = resolve(root, "deploy/ftp-upload");

console.log("→ Building frontend (static-only for FTP)…");
execSync("npm run build -w @ksirovka/web", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, VITE_STATIC_ONLY: "true" },
});

if (!existsSync(dist)) {
  console.error("Build failed: dist folder not found");
  process.exit(1);
}

console.log("→ Preparing FTP upload folder…");
if (existsSync(output)) {
  rmSync(output, { recursive: true, force: true });
}
mkdirSync(output, { recursive: true });

cpSync(dist, output, { recursive: true });
cpSync(resolve(deployTemplate, ".htaccess"), resolve(output, ".htaccess"));
cpSync(resolve(deployTemplate, "index.php"), resolve(output, "index.php"));
cpSync(resolve(deployTemplate, "contact.php"), resolve(output, "contact.php"));

writeFileSync(
  resolve(output, "NAHRAT-PRES-FTP.txt"),
  `Kšírovka – soubory pro upload na WebSupport / webhosting.cz
============================================================

OBSAH SLOŽKY (nahrajte VŠE do složky web/ nebo www/ na hostingu):

  index.html      – hlavní stránka SPA
  index.php       – záložní router (nahradí starý index.php)
  contact.php     – kontaktní formulář (PHP mail)
  .htaccess       – Apache pravidla pro SPA routing
  assets/         – CSS a JavaScript
  (ostatní soubory z buildu)

POSTUP (FileZilla / klient FTP):
  1. Přihlaste se na FTP (údaje ve WebSupport administraci)
  2. Otevřete složku: web/  (nebo www/ – dle vašeho hostingu)
  3. ZÁLOHUJTE starý obsah (staáhněte si index.php a celou složku)
  4. Nahrajte VŠECHNY soubory z této složky do web/
  5. Přepište existující index.php novým souborem
  6. Ujistěte se, že .htaccess a contact.php byly nahrány (zobrazit skryté soubory)
  7. Otevřete https://vase-domena.cz v prohlížeči

DŮLEŽITÉ:
  - Toto je STATICKÝ frontend (HTML/CSS/JS) – Node API se nevolá.
  - Obsah stránek a novinek je vestavěný ve buildu.
  - Kontaktní formulář odesílá přes contact.php (mail na info@ksirovka.cz).
  - Obrázky se načítají z https://ksirovka.cz (do doby migrace na CDN).
  - Po nasazení zapněte SSL certifikát (Let's Encrypt) ve WebSupport.

Vygenerováno: ${new Date().toISOString()}
`,
);

console.log(`\n✓ Hotovo: ${output}`);
console.log("  Nahrajte obsah složky deploy/ftp-upload/ do web/ na FTP.\n");
