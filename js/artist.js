import { suggestionForm } from "./community.js";
import { favoriteButton } from "./favorites.js";
import { discography, relatedArtists, spotifyPlayer } from "./profile-features.js";
import { element, externalLink, picture } from "./data.js";

import { getArtistBySlug, showDataSource } from "./api.js";

const main = document.querySelector("#obsah");
const description = document.querySelector('meta[name="description"]');

function showState(title, message) {
    document.title = `${title} — CZ/SK Interpret Wiki`;
    description.content = message;
    const panel = element("section", "state-panel glass");
    panel.append(element("h1", "", title), element("p", "", message));
    const home = element("a", "button button-primary", "Zpět na přehled interpretů");
    home.href = "index.html#interpreti";
    panel.append(home);
    main.replaceChildren(panel);
}

function displayValue(value) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "TODO — údaj není uveden";
    return value === "TODO" || value == null ? "TODO — údaj není uveden" : String(value);
}

function renderProfile(artist) {
    document.title = `${artist.name} — CZ/SK Interpret Wiki`;
    const introduction = artist.bio[0]?.blocks.find(block => block.type === "paragraph")?.text;
    description.content = introduction
        ? introduction.replace(/\s+/g, " ").slice(0, 157) + (introduction.length > 157 ? "…" : "")
        : `${artist.name}: profil, biografie a diskografie.`;

    const profile = element("article", "profile-card glass");
    const content = element("div", "profile-copy");
    content.append(element("p", "eyebrow", "Příběh za hudbou"), element("h1", "profile-title", artist.name));
    artist.bio.forEach((section, index) => {
        const container = element("section", "bio-section");
        // Úvodní nadpis se shoduje se jménem, které je již hlavním nadpisem.
        if (index !== 0 || section.heading !== artist.name) container.append(element("h2", "", section.heading));
        for (const block of section.blocks) {
            if (block.type === "paragraph") {
                for (const paragraph of block.text.split(/\n\s*\n/)) container.append(element("p", "", paragraph));
            } else if (block.type === "list") {
                const list = element(block.ordered ? "ol" : "ul");
                block.items.forEach(item => list.append(element("li", "", item)));
                container.append(list);
            }
        }
        content.append(container);
    });

    const sidebar = element("aside", "profile-sidebar");
    sidebar.setAttribute("aria-label", `Základní údaje a odkazy: ${artist.name}`);
    const portrait = element("div", "profile-photo");
    portrait.append(picture(artist.photo, artist.name, false));
    sidebar.append(favoriteButton(artist));
    sidebar.append(portrait, element("h2", "facts-title", "Základní údaje"));
    const facts = element("dl", "profile-facts");
    const birthDate = /^\d{4}-\d{2}-\d{2}$/.test(artist.birthDate)
        ? new Intl.DateTimeFormat("cs", { dateStyle: "long", timeZone: "UTC" }).format(new Date(artist.birthDate))
        : artist.birthDate;
    for (const [label, value] of [
        ["Rodné jméno", artist.realName], ["Datum narození", birthDate],
        ["Místo narození", artist.birthCity], ["Scéna", artist.country === "sk" ? "Slovensko" : "Česko"],
        ["Aktivní od", artist.activeFrom], ["Žánry", artist.genres], ["Skupiny a labely", artist.crews]
    ]) {
        const row = element("div");
        row.append(element("dt", "", label), element("dd", "", displayValue(value)));
        facts.append(row);
    }
    sidebar.append(facts);
    const links = element("nav", "profile-links");
    links.setAttribute("aria-label", "Tvorba a sociální sítě");
    for (const item of artist.links) {
        const link = externalLink(item.url, "button", item.platform);
        if (link) links.append(link);
    }
    sidebar.append(links);
    profile.append(content, sidebar);

    const attribution = element('p', 'attribution');
    const sources = element('a', '', 'Zdroje fotografií a obalů'); sources.href = 'sources.html#' + artist.slug;
    attribution.append(sources); sidebar.append(attribution);
    for (const link of artist.links) { if (link.platform.toLowerCase().includes('spotify')) { const player = spotifyPlayer(link.url, artist.name); if(player)sidebar.append(player); } }
    main.replaceChildren(profile, discography(artist));
    if (artist.id) main.append(suggestionForm(artist));
    relatedArtists(artist, main);

}

try {
    const slug = new URLSearchParams(location.search).get("slug");
    const result = slug ? await getArtistBySlug(slug) : { data: null, source: "supabase" };
    const artist = result.data;
    if (slug) showDataSource(result.source);
    if (artist) renderProfile(artist);
    else showState("Interpret nenalezen", "Tento profil v encyklopedii není. Vyber si interpreta z přehledu.");
} catch {
    showState("Profil se nepodařilo načíst", "Data teď nejsou dostupná. Zkus stránku obnovit nebo se vrať na přehled interpretů.");
} finally {
    main.setAttribute("aria-busy", "false");
}
