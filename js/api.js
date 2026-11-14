import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { loadArtists } from "./data.js";

const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";
const TIMEOUT_MS = 8000;
const artistSelection = "*, albums(*), links(*), artist_genres(display_order, genres(name)), artist_crews(display_order, crews(name))";
let clientPromise;

function withTimeout(promise, milliseconds = TIMEOUT_MS) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Vypršel čas načítání.")), milliseconds); })
    ]).finally(() => clearTimeout(timer));
}

export async function getClient() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase zatím není nastavené.");
    // Dynamický import umožňuje fallback i při nedostupném CDN.
    if (!clientPromise) {
        clientPromise = withTimeout(import(SDK_URL)).then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
        clientPromise.catch(() => { clientPromise = undefined; });
    }
    return clientPromise;
}

const ordered = rows => [...(rows ?? [])].sort((a, b) => a.display_order - b.display_order);
const known = value => value ?? "TODO";

function mapArtist(row) {
    return {
        id: row.id, slug: row.slug, name: row.name, realName: known(row.real_name),
        birthDate: known(row.birth_date), birthCity: known(row.birth_city), country: row.country,
        activeFrom: known(row.active_from), activeTo: row.active_to,
        photo: row.photo, photoCredit: row.photo_credit, photoLicense: row.photo_license,
        photoSourceUrl: row.photo_source_url, photoStatus: row.photo_status,
        bio: row.bio ?? [],
        genres: ordered(row.artist_genres).map(item => item.genres?.name).filter(Boolean),
        crews: ordered(row.artist_crews).map(item => item.crews?.name).filter(Boolean),
        links: ordered(row.links).map(link => ({ platform: link.platform, url: link.url })),
        albums: ordered(row.albums).map(album => ({
            id: album.id, title: album.title, year: known(album.release_year), releaseDate: album.release_date,
            type: album.type === "ep" ? "EP" : known(album.type), cover: album.cover, coverSourceUrl: album.cover_source_url, spotifyUrl: album.spotify_url
        })),
        collaborations: [], sourceFile: row.source_file, todos: row.todos ?? []
    };
}

// Každý výsledek nese zdroj dat; úspěšný prázdný výsledek není síťová chyba.
async function withFallback(online, offline) {
    try {
        const client = await getClient();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const { data, error } = await withTimeout(online(client, controller.signal));
            if (error) throw error;
            return { data, source: "supabase" };
        } finally {
            clearTimeout(timer);
        }
    } catch {
        try {
            return { data: await offline(), source: "offline" };
        } catch {
            throw new Error("Data se nepodařilo načíst ze Supabase ani z místní zálohy.");
        }
    }
}

export async function getArtists() {
    const result = await withFallback(
        (client, signal) => client.from("artists").select(artistSelection).order("display_order").abortSignal(signal),
        loadArtists
    );
    if (result.source === "supabase") result.data = result.data.map(mapArtist);
    return result;
}

export async function getArtistBySlug(slug) {
    const result = await withFallback(
        (client, signal) => client.from("artists").select(artistSelection).eq("slug", slug).maybeSingle().abortSignal(signal),
        async () => (await loadArtists()).find(artist => artist.slug === slug) ?? null
    );
    if (result.source === "supabase" && result.data) result.data = mapArtist(result.data);
    return result;
}

export async function getCollaborations() {
    return withFallback(
        (client, signal) => client.from("collaborations").select("*, artistA:artists!collaborations_artist_a_fkey(id,slug,name), artistB:artists!collaborations_artist_b_fkey(id,slug,name)").abortSignal(signal),
        async () => (await loadArtists()).flatMap(artist => artist.collaborations ?? [])
    );
}

export function showDataSource(source) {
    const notice = document.querySelector("#data-source");
    if (!notice) return;
    notice.textContent = source === "offline" ? "Zobrazena offline data" : "";
    notice.hidden = source !== "offline";
    document.documentElement.dataset.dataSource = source;
}
