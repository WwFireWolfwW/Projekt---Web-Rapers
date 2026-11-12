import { SUPABASE_URL } from "./config.js";

// Společné načítání dat a bezpečné vytváření obsahu bez HTML řetězců.
export async function loadArtists() {
    const response = await fetch(new URL("../data/artists.json", import.meta.url), { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Data interpretů nejsou dostupná.");
    const artists = await response.json();
    if (!Array.isArray(artists)) throw new Error("Neplatný formát dat.");
    return artists;
}

export function element(tag, className = "", text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function externalLink(url, className, text) {
    const link = element("a", className, text);
    try {
        const target = new URL(url);
        if (target.protocol !== "https:" && target.protocol !== "http:") return null;
        link.href = target.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        return link;
    } catch {
        return null;
    }
}

export function picture(path, alt, lazy = true) {
    const image = element("img");
    // Místní obrázky a veřejné objekty dvou bucketů potvrzeného projektu.
    if (typeof path === "string" && path.startsWith("images/") && !path.split("/").includes("..") && !path.includes("\\")) {
        image.src = path.split("/").map(encodeURIComponent).join("/");
    } else if (typeof path === "string" && SUPABASE_URL) {
        try {
            const target = new URL(path);
            if (target.protocol === "https:" && target.origin === new URL(SUPABASE_URL).origin &&
                /^\/storage\/v1\/object\/public\/(artists|covers)\//.test(target.pathname)) {
                image.src = target.href;
            }
        } catch {
            // Neplatná adresa se nepoužije jako zdroj obrázku.
        }
    }
    image.alt = alt;
    image.loading = lazy ? "lazy" : "eager";
    image.decoding = "async";
    return image;
}

export function profileUrl(slug) {
    return `artist.html?slug=${encodeURIComponent(slug)}`;
}
