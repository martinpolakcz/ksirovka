# Plánky jamek ve scorecardu

Schváleno 2026-10-17. Golf Shot kopírovat nebudeme. Implementace: migrace `0006`, `/admin/jamky` URL+tip, mobil `HolePlan`.

## Co nebrat z Golf Shot
- GPS, yardáže k bunkrům, green center
- statistiky GIR / fairway %
- samostatná mapa vs. samostatné skóre (dva režimy)
- putty

Fotbalgolf má papírový plánek „jak se jamka hraje“. Hráč stojí na místě a potřebuje orientaci, ne dálkoměr.

## Doporučený tok (lepší než „po uložení ukaž další obrázek“)
1. Obrazovka jamky = nahoře plánek aktuální jamky (náhled), pod ním skóre.
2. Klepnutí na plánek = fullscreen. Landscape tabulka zůstává.
3. **Potvrdit jamku** rovnou otevře další jamku s jejím plánkem. Mezikrok s obrázkem další jamky je zbytečný tap.
4. Chybějící fotka = dnešní obrazovka, nic se nerozbije.

## Data
Rozšířit `score_course_holes`: `image_url`, `tip` (krátký text). Správa: stávající `/admin/jamky`.
Obrázky **nepéct do IPA** — mění se bez EAS. První vlna: URL (jako TV reklamy). Upload na volume až když URL přestane stačit. Kontejner je na to read-only.

## Rozsah v1
Jen fotbalgolf, 20 plánků. Minigolf/adventure později.
Složitost: střední. Blokuje obsah (vyfotit karty), ne kód.
