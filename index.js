import { element, picture, profileUrl } from "./js/data.js";

import { getArtists, showDataSource } from "./js/api.js";

const controls = document.querySelector("#artist-controls");
const search = document.querySelector("#artist-search");
const filters = [...document.querySelectorAll(".filter-button")];
const grid = document.querySelector("#artist-grid");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
let selectedCountry = "all";
let cards = [];
let artistsData = [];
const extra = element("div", "extra-filters");
const selects = {};
for (const [key, title] of [["genre", "Žánr"], ["crew", "Skupina / label"], ["sort", "Řazení"]]) {
 const label = element("label", "", title); const select = element("select"); select.id = "filter-" + key; label.append(select); extra.append(label); selects[key] = select; select.addEventListener("change", () => updateArtists());
}
controls.append(extra);
function readState() { const params = new URLSearchParams(location.search); selectedCountry = ["cz", "sk"].includes(params.get("country")) ? params.get("country") : "all"; search.value = params.get("q") || ""; for (const key of ["genre","crew","sort"]) { selects[key].value = params.get(key) || (key === "sort" ? "az" : ""); if (selects[key].selectedIndex < 0) selects[key].selectedIndex = 0; } }
window.addEventListener("popstate", () => { readState(); updateArtists(false); });

const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs").trim();

function updateArtists(sync = true) {
    const query = normalize(search.value);
    const year = value => /^\d{4}$/.test(String(value)) ? Number(value) : Infinity;
    const sorted = [...cards].sort((a,b) => {
        const first = artistsData.find(item => item.slug === a.dataset.slug);
        const second = artistsData.find(item => item.slug === b.dataset.slug);
        const order = selects.sort.value === 'activity' ? year(first.activeFrom)-year(second.activeFrom) : selects.sort.value === 'albums' ? second.albums.length-first.albums.length : 0;
        return (Number.isNaN(order) ? 0 : order) || first.name.localeCompare(second.name,'cs');
    });
    let count = 0;
    for (const card of sorted) {
        const artist = artistsData.find(item => item.slug === card.dataset.slug);
        card.hidden = !((selectedCountry === 'all' || artist.country === selectedCountry) && normalize(card.dataset.name).includes(query) && (!selects.genre.value || artist.genres.includes(selects.genre.value)) && (!selects.crew.value || artist.crews.includes(selects.crew.value)));
        if (!card.hidden) count++;
    }
    grid.replaceChildren(...sorted);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.country === selectedCountry)));
    resultCount.textContent = count + (count === 1 ? ' interpret' : count >= 2 && count <= 4 ? ' interpreti' : ' interpretů');
    emptyState.hidden = count !== 0;
    if (sync) { const url = new URL(location.href); for (const [key,value] of Object.entries({country:selectedCountry==='all'?'':selectedCountry,genre:selects.genre.value,crew:selects.crew.value,sort:selects.sort.value==='az'?'':selects.sort.value,q:search.value})) { if(value)url.searchParams.set(key,value); else url.searchParams.delete(key); } history.replaceState(null,'',url); }
}

function createCard(artist) {
    const card = element("a", "artist-card");
    card.href = profileUrl(artist.slug);
    card.dataset.country = artist.country;
    card.dataset.slug = artist.slug;
    // Zachování přezdívek z původního vyhledávání, bez druhého seznamu interpretů.
    const aliases = artist.slug === "ben-cristovao" ? "Benny Cristo" : artist.slug === "yzomandias" ? "Yzo" : "";
    card.dataset.name = [artist.name, artist.realName, aliases].join(" ");
    const photo = element("div", "artist-photo");
    const image = picture(artist.photo, "");
    const arrow = element("span", "card-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    photo.append(image, element("span", "country-tag", artist.country.toUpperCase()), arrow);
    const caption = element("div", "artist-caption");
    caption.append(element("h3", "", artist.name), element("span", "", "Prozkoumat profil"));
    card.append(photo, caption);
    return card;
}

filters.forEach(button => button.addEventListener("click", () => {
    selectedCountry = button.dataset.country;
    updateArtists();
}));
search.addEventListener("input", updateArtists);
document.querySelector("#reset-filters").addEventListener("click", () => {
    selectedCountry = "all";
    search.value = "";
    selects.genre.value = ""; selects.crew.value = ""; selects.sort.value = "az";
    updateArtists();
    search.focus();
});

try {
    const { data: artists, source } = await getArtists();
    showDataSource(source);
    artistsData = artists;
    for (const key of ['genre','crew']) {
        const all = element('option','','Všechny'); all.value=''; selects[key].append(all);
        [...new Set(artists.flatMap(artist => artist[key === 'genre' ? 'genres' : 'crews']))].sort((a,b)=>a.localeCompare(b,'cs')).forEach(value=>{ const option=element('option','',value); option.value=value; selects[key].append(option); });
    }
    for (const [value,title] of [['az','A–Z'],['activity','Nejdříve aktivní'],['albums','Nejvíce alb']]) { const option=element('option','',title); option.value=value; selects.sort.append(option); }
    readState();
    cards = artists.map(createCard);
    grid.replaceChildren(...cards);
    document.querySelector("#artist-total").textContent = artists.length;
    document.querySelector("#filter-total").textContent = artists.length;
    document.querySelector("#country-total").textContent = String(new Set(artists.map(artist => artist.country)).size).padStart(2, "0");
    const feature = document.querySelector(".hero-feature");
    const featured = artists.find(artist => artist.slug === "viktor-sheen") || artists[0];
    if (featured) {
        feature.href = profileUrl(featured.slug);
        feature.setAttribute("aria-label", "Prozkoumat profil: " + featured.name);
        feature.querySelector("img").replaceWith(picture(featured.photo, featured.name, false));
        feature.querySelector("h2").textContent = featured.name;
        feature.querySelector(".feature-number").textContent = "01 / " + String(artists.length).padStart(2, "0");
    } else feature.hidden = true;
    controls.hidden = false;
    updateArtists();
} catch {
    document.querySelector("#load-error").hidden = false;
    resultCount.textContent = "Načtení se nezdařilo";
    document.querySelector(".hero-feature").hidden = true;
} finally {
    grid.setAttribute("aria-busy", "false");
    document.querySelector("#list-skeleton").hidden = true;
}
