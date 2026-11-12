# Databáze a napojení

## Stav k 14. 11. 2026

Cílový projekt: `vuivadirkaexnxqyasei`, potvrzený uživatelem.

Migrace a seed byly nasazeny přes Supabase MCP do potvrzeného projektu. Frontend má ověřenou API URL a veřejný anon klíč. Žádná existující data nebyla smazána ani resetována.

Vzdáleně prošly testy RLS včetně zákazu změny vlastní role a zápisu interpretů běžným uživatelem; po ROLLBACK zůstalo 0 testovacích účtů. Všech 14 tabulek má zapnuté RLS. Security advisors po opravě vrátili prázdný seznam varování.

Veřejné REST API s anon klíčem vrací HTTP 200, 12 interpretů, 105 alb a 35 odkazů. Ověřeny byly všechny profily, jejich bio proti JSON a relační dotaz spoluprací. Vizuální kontrola v prohlížeči zůstává ruční.

## Připravené soubory

- `supabase/migrations/20261113175641_rap_wiki_schema.sql`: 14 tabulek, indexy, RLS, oprávnění, registrační trigger a dva veřejné buckety.
- `supabase/migrations/20261113232410_restrict_rls_auto_enable.sql`: odebrání klientského EXECUTE na existující privilegované event-trigger funkci `public.rls_auto_enable()`.
- `supabase/seed.sql`: idempotentní upsert 12 interpretů, 105 alb a 35 odkazů, včetně žánrů, skupin a vazeb.
- `supabase/generate-seed.mjs`: regenerace seedu příkazem `node supabase/generate-seed.mjs`. Generátor se nepřipojuje k databázi.
- `supabase/tests/rls.sql`: testy práv v transakci zakončené ROLLBACK, bez mazání existujících dat.
- `js/api.js`: `getArtists()`, `getArtistBySlug(slug)`, `getCollaborations()`; návratová hodnota `{ data, source: "supabase" | "offline" }`.
- `tests/api.test.mjs`: testy skutečného kódu API se simulovanou sítí; spuštění `node tests/api.test.mjs`.

## Tabulky a politiky

RLS je zapnuté na všech 14 nových tabulkách. Cizí klíče pokrývají samostatné indexy nebo první sloupce primárních/unikátních indexů. `artists.slug` má unikátní index.

| Tabulky | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| artists, albums, tracks, genres, artist_genres, crews, artist_crews, collaborations, links | všichni | admin | admin | admin |
| profiles | vlastní řádek | pouze registrační trigger / databázový vlastník | vlastní `display_name` | klient nesmí |
| favorites | vlastní | vlastní | vlastní | vlastní |
| ratings, quiz_scores | všichni | vlastní | vlastní | vlastní |
| suggestions | vlastní nebo admin | vlastní, pouze pending a bez reviewed_by | admin | klient nesmí |

Politiky katalogu se jmenují `<tabulka>_read`, `<tabulka>_admin_insert`, `<tabulka>_admin_update`, `<tabulka>_admin_delete`.

Profiles používají `profiles_read_self`, `profiles_update_self`. Oprávnění `UPDATE` je uděleno jen na sloupec `display_name`; běžný uživatel nemůže změnit `role` ani `id`. Role správce se čte z vlastního řádku profiles, nikoli z uživatelem editovatelných metadat. Funkce `rap_private.is_admin()` používá SECURITY INVOKER a respektuje RLS.

Favorites, ratings a quiz_scores používají `<tabulka>_read`, `<tabulka>_insert_self`, `<tabulka>_update_self`, `<tabulka>_delete_self`. Kontroly při UPDATE brání převodu vlastnictví na jiného uživatele.

Suggestions používají `suggestions_read`, `suggestions_insert_self`, `suggestions_admin_update`.

Storage má buckety `artists` a `covers`. Politiky `rap_media_read`, `rap_media_admin_insert`, `rap_media_admin_update`, `rap_media_admin_delete` dovolují veřejné čtení a zápis pouze správci, včetně náhrady souboru. Fotografie se zatím nenahrávají: seed zachovává existující místní cesty. Frontend podporuje i veřejné Storage URL těchto dvou bucketů na cílovém projektu.

Trigger `rap_wiki_user_created` vytváří po registraci profil s rolí `user`. Privilegovaná triggerová funkce je v neveřejném schématu s prázdným search_path a bez oprávnění EXECUTE pro klienty. Migrace doplní chybějící profily již registrovaným účtům, existující role nezmění.

## Převod původních dat

- Neznámé datum narození, rok a typ alba se ukládají jako NULL, frontend je zobrazuje jako TODO.
- `active_from` je text: zachovává i „kolem roku 2007“. `active_to` a `release_date` zůstávají NULL, nejsou-li doložené.
- `photo_credit`, `photo_license`, `photo_source_url` a `cover_source_url` jsou při vložení NULL; `photo_status` je `needs_review`.
- Opakovaný seed nepřepisuje doplněné autorské údaje ani stav kontroly. Aktualizuje obsah odvozený z JSON, ale nemaže jiné záznamy ani vazby.
- `display_order` zachovává pořadí interpretů, alb, odkazů a vazeb. `source_file` a `todos` zachovávají původ a nejasnosti.
- Tracks a collaborations se nenaplňují vymyšlenými údaji.

## Ověření, která již proběhla

V izolovaném PostgreSQL (PGlite, se simulovanými schématy Auth a Storage) prošla celá migrace a dvojí spuštění seedu. Po druhém spuštění zůstalo 12 interpretů, 105 alb a 35 odkazů.

SQL test ověřil veřejné čtení, odmítnutí zápisu interpreta anonymním i běžným uživatelem, odmítnutí změny role, povolenou úpravu vlastního jména, soukromí oblíbených a návrhů, veřejnost hodnocení a skóre, zákaz převodu vlastnictví a předběžného schválení návrhu, zápis správce a Storage oprávnění. Uživatelské metadata s role=admin nezpůsobila povýšení účtu.

Všech 9 testů API prošlo: online mapování, jediný relační dotaz detailu, prázdná databáze, nenalezený slug, chybějící konfigurace, výpadek API/CDN, timeout, selhání JSON a načítání spoluprací.

Následně proběhly i skutečné SQL testy na Supabase, veřejné REST dotazy a security advisors. Vizuální kontrola a nahrávání skutečného souboru přes Storage HTTP API zůstávají ruční.

## Nasazení a oprava advisors

Na prázdném cílovém projektu byly aplikovány migrace `rap_wiki_schema` a `restrict_rls_auto_enable` a spuštěn seed. Před každým zápisem byl uživatel informován.

Advisors původně označili klientské EXECUTE na existující funkci `public.rls_auto_enable()`. Opravná migrace odebrala toto oprávnění PUBLIC, anon a authenticated; automatické zapínání RLS zůstává zachované. Výsledná kontrola nemá varování. Viz [dokumentace advisors](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Ruční kontrola webu a správce

Spusť `index.html` přes Live Server. Po dokončeném nasazení otevři nástroje pro vývojáře → Network: požadavky na `vuivadirkaexnxqyasei.supabase.co/rest/v1/artists` musí vracet 200. Detail má jeden dotaz s vloženými alby, odkazy, žánry a crews. Po úspěchu se `data/artists.json` nenačítá a hláška offline není vidět. V konzoli můžeš ověřit `document.documentElement.dataset.dataSource`, které musí být `supabase`.

Zablokuj doménu Supabase a obnov stránku: použije se JSON a zobrazí se „Zobrazena offline data“. Zablokuj navíc JSON: musí se zobrazit chybová hláška a skeleton se musí skrýt. Při zpomalené síti ověř skeleton na seznamu i profilu.

Po nasazení vytvoř svůj účet v Auth (UI přihlášení je další fáze), zjisti jeho skutečné UUID a v SQL Editoru projektu spusť:

```sql
update public.profiles set role = 'admin' where id = 'SEM_VLOŽ_UUID_SVÉHO_ÚČTU';
```

UUID nikdy nenahrazovat e-mailem ani ID projektu. Tento příkaz nebyl za uživatele spuštěn.
