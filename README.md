# CZ/SK Interpret Wiki

Školní projekt Davida Syřiště: webová encyklopedie českých a slovenských interpretů s profily, diskografií a odkazy na jejich tvorbu.

Úvodní stránka používá tmavý vzhled se skleněnými panely, černobílými fotografiemi a rozložením pro počítače i mobilní telefony. Obsahuje 12 interpretů, vyhledávání bez ohledu na diakritiku a filtry české a slovenské scény.

## Spuštění

Ve Visual Studio Code klikněte pravým tlačítkem na `index.html` a zvolte **Open with Live Server** (rozšíření Live Server musí být dostupné). Použijte adresu HTTP, kterou server otevře; přímé otevření přes `file://` nestačí kvůli načítání JSON a JavaScriptovým modulům. Projekt nevyžaduje framework, bundler ani sestavení.

## Struktura

- `index.html` — úvodní stránka a seznam interpretů.
- `artist.html`, `js/artist.js` — společná šablona profilu podle `?slug=...`.
- `data/artists.json` — zdroj profilů, seznamu a počtů interpretů.
- `index.js`, `js/data.js` — vykreslení seznamu, hledání, filtry a společné načítání dat.
- `css/tokens.css`, `css/base.css`, `css/components.css`, `css/pages/` — proměnné, základy, komponenty a styly stránek.
- `style.css`, `InterStyles.css` — kompatibilní vstupy importující přesunuté styly.
- Původních 12 HTML profilů a `Giga.css` — ponecháno; profily se nesmějí smazat bez potvrzení.
- `images/` — fotografie interpretů, logo a obaly alb.

Nový seznam a společný profil vyžadují JavaScript. Při jeho vypnutí se zobrazí vysvětlení; původní statické profily zůstávají dostupné na dosavadních adresách.

## Ověření

V izolovaném prostředí JavaScriptu bylo ověřeno vykreslení všech 12 profilů, úplnost textu biografií, počty alb, titulky, hledání bez diakritiky, filtry, prázdný výsledek, reset, dynamické počty a chyby načítání. Přes místní HTTP server bylo ověřeno 123 cest včetně obrázků. Vizuální kontrola v prohlížeči nebyla provedena: automatizované připojení k prohlížeči nebylo dostupné.

Ruční kontrola přes Live Server:

1. Otevřete `index.html`; ověřte počet načtených interpretů, karty a filtry Česko/Slovensko. Vyhledejte `ŠHÉÉN`, `Benny Cristo` a neexistující jméno; vyzkoušejte reset.
2. Otevřete kartu a zkontrolujte adresu `artist.html?slug=...`, titulek záložky, bio, základní údaje, odkazy a alba. Porovnejte obsah s původním profilem.
3. Otevřete `artist.html?slug=neexistuje` i samotné `artist.html`; zobrazí se „Interpret nenalezen“ a odkaz zpět.
4. Ověřte mobilní šířky 320, 375 a 760 px i širokou obrazovku. Zkontrolujte čitelnost, obrázky, panely a případné vodorovné přetékání.
5. Klávesou Tab projděte skip-link, navigaci, hledání, filtry a odkazy; focus musí být viditelný.
6. V nástrojích pro vývojáře ověřte meta description, konzoli a síťové požadavky. Zablokujte požadavek na JSON a obnovte stránku: zobrazí se chyba načítání.

Hodnoty `TODO` jsou záměrně zachované z dat. Karty používají portréty z JSON, které se mohou lišit od fotografií dříve zapsaných přímo v úvodním HTML.

## Obsah a obrázky

Web vznikl pro vzdělávací účely. Fotografie, obaly alb a ochranné známky náleží jejich příslušným vlastníkům.

## Supabase

Migrace, seed, RLS a API vrstva jsou nasazené v projektu `vuivadirkaexnxqyasei`. Frontend používá veřejný anon klíč; při výpadku přejde na JSON zálohu s informací „Zobrazena offline data“. Vzdálené testy RLS a REST prošly, security advisors jsou bez varování.

Seznam tabulek, politik, provedené testy a postup dokončení: [docs/SUPABASE.md](docs/SUPABASE.md). API testy: `node tests/api.test.mjs`.
