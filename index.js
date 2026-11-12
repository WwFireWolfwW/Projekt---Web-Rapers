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

const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs").trim();

function updateArtists() {
    const query = normalize(search.value);
    let count = 0;
    for (const card of cards) {
        card.hidden = !((selectedCountry === "all" || card.dataset.country === selectedCountry) && normalize(card.dataset.name).includes(query));
        if (!card.hidden) count++;
    }
    filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.country === selectedCountry)));
    const label = count === 1 ? "interpret" : count >= 2 && count <= 4 ? "interpreti" : "interpretů";
    resultCount.textContent = count + " " + label;
    emptyState.hidden = count !== 0;
}

function createCard(artist) {
    const card = element("a", "artist-card");
    card.href = profileUrl(artist.slug);
    card.dataset.country = artist.country;
    // Zachování přezdívek z původního vyhledávání, bez druhého seznamu interpretů.
    const aliases = artist.slug === "ben-cristovao" ? "Benny Cristo" : artist.slug === "yzomandias" ? "Yzo" : "";
    card.dataset.name = [artist.name, artist.realName, aliases].join(" ");
    const photo = element("div", "artist-photo");
    const image = picture(artist.photo, "");
    image.width = 400;
    image.height = 450;
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
    updateArtists();
    search.focus();
});

try {
    const { data: artists, source } = await getArtists();
    showDataSource(source);
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
