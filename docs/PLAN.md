# Plán rozvoje CZ/SK Interpret Wiki

Výchozí stav: statický web s úvodní stránkou, 12 samostatnými HTML profily, styly `style.css`, `InterStyles.css`, `Giga.css` a skriptem `index.js`. Úvodní stránka již obsahuje hledání, filtry CZ/SK a časovou osu.

Všechny fáze jsou zatím neprovedené. Tento dokument pouze plánuje další práci. Pro každou fázi platí pravidla z `AGENTS.md`, zachování tmavého glass vzhledu a použití údajů pouze z existujících HTML souborů; chybějící údaje a rozpory označit `TODO`.

## 1) Data do JSON a jedna šablona profilu

- Převést obsah všech 12 profilů, diskografii, odkazy a cesty k obrázkům do JSON; zachovat dohledatelnost původního HTML.
- Připravit jednu společnou šablonu profilu a načítání dat pomocí vanilla JS modulů. Zachovat dostupnost původních odkazů.
- Ručně ověřit: shodu všech profilů s původním obsahem, obrázky, odkazy a chování při neznámém profilu.

## 2) Sjednocení CSS

- Sjednotit společné proměnné, panely, typografii a responzivní pravidla; přesunout styly z HTML do CSS.
- Zachovat barvy, černobílé fotografie a šum; sjednotit focus stavy a přístupnost stránek.
- Ručně ověřit: úvodní stránku i profily na mobilu a počítači, klávesnici a skip-link.

## 3) Supabase (schéma, RLS, seed)

- Navrhnout databázové schéma, vazby a migrace pro obsah a plánované uživatelské funkce.
- Připravit RLS pravidla pro veřejné čtení a oprávněné zápisy; seed odvodit z JSON vzniklého z původních HTML.
- Ručně ověřit: úplnost seed dat a přístup anonymního uživatele, vlastníka záznamu a cizího uživatele. Destruktivní operace pouze po souhlasu.

## 4) Napojení frontendu

- Napojit seznam a společnou šablonu profilu na Supabase pomocí JS modulů; ve frontendu použít pouze veřejný anon klíč.
- Ošetřit načítání, prázdné výsledky a chyby; data vykreslovat bezpečně.
- Ručně ověřit: načtení seznamu i detailu, výpadek připojení a neexistující profil.

## 5) Funkce (filtry, oblíbení, porovnání, časová osa)

- Navázat na stávající vyhledávání a filtry, přidat oblíbené interprety a jejich porovnání.
- Napojit časovou osu na dostupná data; chybějící data nedoplňovat odhadem. Oblíbené před zavedením účtů ukládat lokálně.
- Ručně ověřit: kombinace filtrů, hledání bez diakritiky, prázdný výsledek, uchování oblíbených a porovnání neúplných údajů.

## 6) Účty, hodnocení, admin

- Přidat přihlášení, odhlášení, oblíbené navázané na účet, hodnocení a administraci obsahu.
- Vynucovat oprávnění v databázi pomocí RLS; skrytí ovládacích prvků samo o sobě není zabezpečení.
- Ručně ověřit: přihlášení a odhlášení, oddělení uživatelských dat a zamítnutí neoprávněných změn včetně administrace.

## 7) Graf spoluprací a kvíz

- Vytvořit graf spoluprací a kvíz pouze z údajů doložených původními HTML soubory.
- Zajistit přístupné ovládání a textovou alternativu grafu; chybějící podklady označit `TODO`.
- Ručně ověřit: doložení vazeb a odpovědí, ovládání klávesnicí a vyhodnocení kvízu.

## 8) Závěrečná kontrola a nasazení

- Zkontrolovat obsah, odkazy, obrázky, responzivitu, přístupnost, chyby v konzoli a zabezpečení včetně RLS a absence tajných klíčů v repozitáři.
- Doplnit návod ke spuštění a nasazení statického webu. TODO: vybrat cílový hosting.
- Ručně ověřit: celý průchod webem na cílové adrese, přímé odkazy na profily a funkce anonymního uživatele, přihlášeného uživatele i administrátora.
