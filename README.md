# CZ/SK Interpret Wiki

Neoficiální fanouškovský školní web o českém a slovenském rapu. HTML, CSS a vanilla JavaScript, bez frameworku a bundleru. Údaje pocházejí z původních HTML profilů; chybějící informace jsou TODO.

## Funkce

- Katalog a profily ze Supabase, při výpadku veřejná záloha JSON.
- Filtry, hledání Ctrl+K, diskografie, podobní interpreti, porovnání a graf spoluprací.
- Supabase Auth: registrace e-mailem a heslem, přihlášení, odhlášení.
- Oblíbení, hodnocení a komentáře, nahlášení komentářů a návrhy oprav.
- Administrace interpretů, alb, odkazů, návrhů a nahrávání obrázků.
- Kvíz o deseti obalech a anonymní veřejný žebříček.
- Místní fonty OFL, světlý/tmavý vzhled, informační stránky.
- Statické profily pro vyhledávače a základní offline stránka.

## Struktura

- index.html, artist.html: katalog a společný interaktivní profil.
- login.html, favorites.html, suggestions.html, admin.html, quiz.html: komunitní funkce.
- js/: API, přihlášení a jednotlivé moduly stránek.
- css/, fonts/, images/: vzhled a místní soubory.
- data/: záložní veřejná data a manifest obrázků.
- interpret/: vygenerované statické profily.
- scripts/: generátor statických profilů a optimalizace obrázků.
- supabase/: migrace, seed a testy RLS.
- docs/: plán, inventář obrázků, zdroje spoluprací a výsledky auditu.
- Původní samostatné profily zůstávají jako obsahový podklad. Nemaž je bez kontroly a souhlasu.

## Lokální spuštění

Ve VS Code otevři kořen projektu a spusť index.html přes Live Server. Použij HTTP adresu, nikoli file://. Pro účty a zápisy je nutné připojení k Supabase. Veřejná záloha neobsahuje účty ani hodnocení.

## Supabase

Potvrzený projekt: vuivadirkaexnxqyasei. Aktuální region: eu-west-2, Londýn (mimo EU).
Veřejné hodnoty jsou v js/config.js. Do frontendu patří pouze anon klíč; žádná hesla ani service_role. Tabulky a politiky dokumentuje docs/SUPABASE.md. Existující projekt znovu nevytvářej; migrace aplikuj pouze jednou a ve správném pořadí. Seed je odvozený z původních profilů.

V Auth nastav Site URL a povolené Redirect URLs pro lokální i produkční login.html. Ověř poskytovatele Email, potvrzování e-mailu a doručování zpráv. Pro produkční provoz ověř SMTP, limity a ochranu proti zneužití.

Po vlastní registraci a potvrzení e-mailu může správce v SQL Editoru nastavit roli:

```sql
update public.profiles set role = 'admin' where id = 'UUID_VLASTNIHO_UCTU';
```

UUID vezmi z Auth Users. Běžný klient nesmí změnit role. Admin odkaz je na stránce účtu po načtení přihlášeného správce.

## Co vynucuje databáze

RLS řídí vlastnictví oblíbených, hodnocení, skóre a návrhů; katalog a Storage může měnit pouze admin. Profil lze upravit jen vlastní a klient nemá UPDATE oprávnění ke sloupci role. Hodnocení je 1–5, jedno na uživatele a album; nové/změněné komentáře mají nejvýše 1000 znaků a skóre nejvýše 10. Nové limity jsou NOT VALID vůči historickým řádkům, ale pro nové zápisy se uplatňují.

Klient poskytuje formuláře, české zprávy, kontrolu velikosti/formátu uploadu a povinné autorství/licenci fotografie. Tyto klientské kontroly nejsou bezpečnostní hranicí. Autorství/licence a velikost uploadu zatím nemají doplňující serverové omezení nad původním RLS. Kvíz počítá výsledek v prohlížeči a není odolný proti podvádění.

Nahlášení je suggestions.field = report_rating, proposed_value obsahuje ID hodnocení a note důvod. Admin jej vidí a označí rozhodnutí; původní RLS mu nedává právo mazat cizí hodnocení. Schválení návrhu mění stav; správce následně provede obsahovou opravu v příslušném formuláři.

## Statické sestavení a nasazení

Vyžaduje Node 22 nebo novější. Zkopíruj .env.example do .env a vyplň SITE_URL skutečnou veřejnou adresou včetně případné podsložky. Pro čtení databáze vyplň veřejné SUPABASE_URL a SUPABASE_ANON_KEY. Bez těchto dvou hodnot se použije JSON.

```sh
node --env-file=.env scripts/build-static.mjs
```

Sestavení vytváří interpret/*.html. S nastaveným SITE_URL vytvoří také sitemap.xml, kanonické adresy a robots.txt. Bez SITE_URL sitemapu nevymýšlí. Po změně dat sestavení zopakuj.

GitHub Pages: publikuj kořen větve s vygenerovanými soubory. SITE_URL nastav včetně názvu repozitáře. Netlify: publikuj kořen projektu; při sestavení nastav výše uvedené veřejné proměnné a spusť generátor. Tajné .env a diagnostické logy nepublikuj. U 404.html zkontroluj base href podle cílové podsložky. Hosting není touto úpravou nasazen.

Service worker ukládá pouze veřejnou offline stránku. Necachuje odpovědi Auth, soukromé údaje ani komunitní zápisy. Po změně offline stránky změň verzi cache v sw.js.

## Ověření a omezení

Automaticky prošlo 9 API testů a syntaktická kontrola JS. Headless Edge načetl index, přihlášení, oblíbené, profil Nik Tenda, návrhy, administraci v anonymním režimu, kvíz a statický profil bez pageerror. Ověřené obrázky se načetly. Kontrola místních HTML odkazů a heuristické hledání tajemství v pracovních souborech a pěti dostupných commitech neměly nález; nejde o důkaz úplné absence všech typů tajemství. Podrobnosti: docs/AUDIT.md.

Uživatel dosud v této konverzaci nepotvrdil ruční test registrace, e-mailu, dvou účtů, administrace ani produkčního nasazení. Tyto scénáře nejsou označené jako ručně otestované.

Free Supabase projekt může být po delší nízké aktivitě (přibližně týden) pozastaven. Před prezentací otevři dashboard, případně projekt obnov a ověř skutečné načtení i zápis. Viz https://supabase.com/docs/guides/platform/free-project-pausing.

## Kontrola před odevzdáním

- [ ] Nastavit SITE_URL, vytvořit sitemap.xml a zkontrolovat sdílené náhledy.
- [ ] Ověřit běžící Supabase, Auth URL a doručení registračního e-mailu.
- [ ] Vyzkoušet registraci, přihlášení, chybné heslo a odhlášení.
- [ ] Dvěma účty ověřit oddělené oblíbené, návrhy a úpravu vlastních komentářů.
- [ ] Vyzkoušet hodnocení, průměr, limit komentáře, smazání a nahlášení.
- [ ] Ověřit admin roli, odmítnutí běžného účtu a formuláře i upload.
- [ ] Dokončit kvíz, ověřit neopakování otázek a uložení skóre.
- [ ] Projít klávesnicí a na šířkách 320/768/1280 px; světlý i tmavý vzhled.
- [ ] Doplnit kontakt [DOPLNIT], právní tituly a doby uchování v soukromí.
- [ ] Ověřit licence obrázků a textů; needs_review neznamená povolení publikovat.
- [ ] Ověřit 404, offline stav, konzoli a odkazy na skutečném hostingu.
- [ ] Případné mazání starých souborů schválit zvlášť.
