# Pravidla pro práci na CZ/SK Interpret Wiki

Tato pravidla platí pro celý projekt a všechny další úpravy.

- Používej HTML, CSS a vanilla JavaScript. Bez frameworků a bez bundleru; JavaScriptové moduly načítej přes `<script type="module">`.
- Zachovej stávající tmavý glass vzhled: barvy, průsvitné panely, černobílé fotografie a šum na pozadí. Vycházej z existujících stylů.
- Kód, jeho textový obsah, komentáře a dokumentaci piš česky; názvy proměnných piš anglicky. Klíčová slova jazyka a názvy standardních API neměň.
- Dbej na přístupnost: sémantické HTML, smysluplné alt texty (u dekorativních obrázků prázdný alt), viditelné focus stavy, ovládání klávesnicí, skip-link na hlavní obsah a responzivní rozložení.
- Nikdy nevkládej do repozitáře klíč `service_role`, hesla ani tajné tokeny. Ve frontendu smí být z klíčů Supabase pouze veřejný `anon` klíč.
- Nevkládej neošetřená data přes `innerHTML`. Preferuj `textContent` a vytváření DOM prvků; při nezbytném použití HTML data bezpečně escapuj podle kontextu.
- Před destruktivními akcemi, včetně mazání souborů, DROP tabulek a resetu databáze, se uživatele vždy zeptej a vyčkej na souhlas.
- Po každém kroku shrň, co jsi změnil a co má uživatel ručně ověřit. Uveď i případná omezení provedené kontroly.
- Obsah nevymýšlej. Údaje o interpretech přebírej pouze z existujících HTML souborů projektu. Chybějící údaje označ `TODO`; rozpory nerozhoduj odhadem a označ je `TODO` k ověření.
- Plán rozvoje je v `docs/PLAN.md`. Samotná existence plánu není pokynem k provedení dalších fází; dodržuj rozsah aktuálního zadání.
