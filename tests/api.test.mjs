import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../js/api.js", import.meta.url), "utf8");
const artists = JSON.parse(await readFile(new URL("../data/artists.json", import.meta.url), "utf8"));

// Síťové hranice nahrazujeme řízeným klientem; běží skutečný kód api.js.
async function setup({ configured = true, response = { data: [], error: null }, cdnFails = false, offlineFails = false, hangs = false } = {}) {
    const calls = [];
    const query = {
        select(value) { calls.push(["select", value]); return this; },
        order(value) { calls.push(["order", value]); return this; },
        eq(...args) { calls.push(["eq", ...args]); return this; },
        maybeSingle() { calls.push(["maybeSingle"]); return this; },
        abortSignal() { return hangs ? new Promise(() => {}) : Promise.resolve(response); }
    };
    const client = { from(table) { calls.push(["from", table]); return query; } };
    const notice = { hidden: true, textContent: "" };
    const document = { querySelector: () => notice, documentElement: { dataset: {} } };
    const code = source.replace(/^import .*;\r?\n/gm, "").replace(/export /g, "")
        .replace("import(SDK_URL)", "importSdk()")
        .replace("const TIMEOUT_MS = 8000;", "const TIMEOUT_MS = 25;");
    const api = await runInNewContext(`(async () => { ${code}; return {getArtists,getArtistBySlug,getCollaborations,showDataSource}; })()`, {
        SUPABASE_URL: configured ? "https://example.supabase.co" : "", SUPABASE_ANON_KEY: configured ? "test" : "",
        loadArtists: async () => { if (offlineFails) throw new Error("Soubor nedostupný"); return artists; },
        importSdk: async () => { if (cdnFails) throw new Error("CDN nedostupné"); return { createClient: () => client }; },
        setTimeout, clearTimeout, AbortController, document
    });
    return { api, calls, notice, document };
}

test("Bez konfigurace se načte záloha a zobrazí zdroj", async () => {
    const { api, notice, document } = await setup({ configured: false });
    const result = await api.getArtists();
    assert.equal(result.data.length, 12);
    assert.equal(result.source, "offline");
    api.showDataSource(result.source);
    assert.equal(notice.hidden, false);
    assert.equal(notice.textContent, "Zobrazena offline data");
    assert.equal(document.documentElement.dataset.dataSource, "offline");
});

test("Detail používá jediný relační dotaz a mapuje NULL na TODO", async () => {
    const row = { id: "a", slug: "test", name: "Test", country: "cz", bio: [],
        albums: [{ title: "EP", type: "ep", release_year: null, display_order: 0 }], links: [],
        artist_genres: [{ display_order: 1, genres: { name: "trap" } }, { display_order: 0, genres: { name: "rap" } }],
        artist_crews: [{ display_order: 0, crews: { name: "Skupina" } }] };
    const { api, calls } = await setup({ response: { data: row, error: null } });
    const result = await api.getArtistBySlug("test");
    assert.equal(result.source, "supabase");
    assert.equal(result.data.realName, "TODO");
    assert.equal(result.data.albums[0].year, "TODO");
    assert.equal(result.data.albums[0].type, "EP");
    assert.equal(result.data.genres.join(","), "rap,trap");
    assert.equal(result.data.crews[0], "Skupina");
    assert.equal(calls.filter(call => call[0] === "from").length, 1);
    assert.match(calls.find(call => call[0] === "select")[1], /albums.*links.*genres.*crews/);
    assert.deepEqual(calls.find(call => call[0] === "eq"), ["eq", "slug", "test"]);
});

test("Nenalezený slug v databázi nespouští zálohu", async () => {
    const { api } = await setup({ response: { data: null, error: null } });
    const result = await api.getArtistBySlug("yzomandias");
    assert.equal(result.data, null);
    assert.equal(result.source, "supabase");
});

test("Prázdný seznam z databáze není chyba", async () => {
    const { api } = await setup();
    const result = await api.getArtists();
    assert.equal(result.data.length, 0);
    assert.equal(result.source, "supabase");
});

for (const [label, options] of [
    ["Chyba API", { response: { data: null, error: new Error("Nedostupné API") } }],
    ["Výpadek CDN", { cdnFails: true }], ["Časový limit", { hangs: true }]
]) test(`${label}: fallback funguje`, async () => {
    const { api } = await setup(options);
    assert.equal((await api.getArtistBySlug("rytmus")).data.slug, "rytmus");
    assert.equal((await api.getArtists()).source, "offline");
});

test("Selhání obou zdrojů vyvolá chybu", async () => {
    const { api } = await setup({ cdnFails: true, offlineFails: true });
    await assert.rejects(api.getArtists(), /místní zálohy/);
});

test("Spolupráce mají online dotaz i prázdnou zálohu", async () => {
    const { api, calls } = await setup();
    assert.equal((await api.getCollaborations()).source, "supabase");
    assert.equal(calls[0][1], "collaborations");
    const offline = await setup({ configured: false });
    const result = await offline.api.getCollaborations();
    assert.equal(result.source, "offline");
    assert.equal(result.data.length, 0);
});
