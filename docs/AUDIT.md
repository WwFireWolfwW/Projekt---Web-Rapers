# Audit 14. 11. 2026

- AGENTS.md a aktuální RLS přečteny. Politiky nebyly oslabeny.
- 9 API testů prošlo. Všechny js/*.js a generátor prošly node --check.
- Osm stránek v anonymním headless Edge bez chyb JavaScriptu; aktuální obrázky na indexu a profilu Nik Tenda načteny.
- Místní src/href v HTML: žádné chybějící soubory po dekódování HTML entit. Externí cíle všech odkazů nebyly kompletně ověřeny.
- Heuristický audit klíčů, privátních klíčů a hesel: žádný nález; prohlédnuté změny pěti dostupných Git commitů. Anon klíč je veřejný a není nález tajemství.
- Žádné innerHTML v aktivních JS; žádné značky konfliktů.
- Security advisors: varování auth_leaked_password_protection. Nastavení a dostupnost podle tarifu ověř ručně: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Giga.css: nenalezen odkaz z HTML. debug.log: diagnostika, ignorována v .gitignore. Staré profily stále slouží jako zdroj obsahu. Nic nebylo smazáno.
- Historické profily mají neúplná metadata a starší alt texty; aktuální šablona generuje alt podle skutečného interpreta. Kompletní vizuální a asistivní audit starých profilů neproběhl.
- Přihlášené průchody dvou reálných účtů, admin upload, e-mail a produkční hosting nebyly ručně potvrzeny. Nepovažovat za plně otestované.
- Sitemap čeká na SITE_URL. Hosting nebyl nasazen.

Výsledek automatického skenu: audit-results.json. Ruční checklist je v README.md.
