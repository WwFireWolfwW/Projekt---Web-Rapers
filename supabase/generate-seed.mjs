import { readFile, writeFile } from "node:fs/promises";

// Generátor pouze zapisuje SQL. Nemá klíče a nepřipojuje se k databázi.
const artists = JSON.parse(await readFile(new URL("../data/artists.json", import.meta.url), "utf8"));
const source = JSON.stringify(artists).replaceAll("'", "''");
const sql = `-- Vygenerováno z data/artists.json. Opakované spuštění nevytváří duplicity.
-- Neznámé datum/rok/typ se ukládá jako NULL; přibližná aktivita zůstává textem.
-- Autorské údaje fotografií jsou při vložení NULL, při aktualizaci se nepřepisují.
begin;
do $seed$
declare
 source jsonb := '${source}'::jsonb;
 artist jsonb; album jsonb; item jsonb; label text;
 artist_key uuid; label_key uuid;
 artist_order integer := 0; item_order integer;
begin
 for artist in select value from jsonb_array_elements(source) loop
  insert into public.artists(slug,name,real_name,birth_date,birth_city,country,bio,photo,active_from,display_order,source_file,todos)
  values(artist->>'slug',artist->>'name',nullif(artist->>'realName','TODO'),nullif(artist->>'birthDate','TODO')::date,
   nullif(artist->>'birthCity','TODO'),artist->>'country',artist->'bio',artist->>'photo',nullif(artist->>'activeFrom','TODO'),artist_order,artist->>'sourceFile',coalesce(artist->'todos','[]'::jsonb))
  on conflict(slug) do update set name=excluded.name,real_name=excluded.real_name,birth_date=excluded.birth_date,
   birth_city=excluded.birth_city,country=excluded.country,bio=excluded.bio,photo=excluded.photo,active_from=excluded.active_from,
   display_order=excluded.display_order,source_file=excluded.source_file,todos=excluded.todos
  returning id into artist_key;
  artist_order := artist_order+1;
  item_order := 0;
  for album in select value from jsonb_array_elements(artist->'albums') loop
   insert into public.albums(artist_id,title,release_year,type,cover,spotify_url,display_order)
   values(artist_key,album->>'title',nullif(album->>'year','TODO')::integer,
    case when lower(album->>'type') in ('album','ep','mixtape','live') then lower(album->>'type') else null end,
    album->>'cover',album->>'spotifyUrl',item_order)
   on conflict(artist_id,spotify_url) do update set title=excluded.title,release_year=excluded.release_year,
    type=excluded.type,cover=excluded.cover,display_order=excluded.display_order;
   item_order := item_order+1;
  end loop;
  item_order := 0;
  for item in select value from jsonb_array_elements(artist->'links') loop
   insert into public.links(artist_id,platform,url,display_order) values(artist_key,item->>'platform',item->>'url',item_order)
   on conflict(artist_id,platform,url) do update set display_order=excluded.display_order;
   item_order := item_order+1;
  end loop;
  item_order := 0;
  for label in select value from jsonb_array_elements_text(artist->'genres') loop
   insert into public.genres(name) values(label) on conflict(name) do update set name=excluded.name returning id into label_key;
   insert into public.artist_genres(artist_id,genre_id,display_order) values(artist_key,label_key,item_order)
    on conflict(artist_id,genre_id) do update set display_order=excluded.display_order;
   item_order := item_order+1;
  end loop;
  item_order := 0;
  for label in select value from jsonb_array_elements_text(artist->'crews') loop
   insert into public.crews(name) values(label) on conflict(name) do update set name=excluded.name returning id into label_key;
   insert into public.artist_crews(artist_id,crew_id,display_order) values(artist_key,label_key,item_order)
    on conflict(artist_id,crew_id) do update set display_order=excluded.display_order;
   item_order := item_order+1;
  end loop;
 end loop;
end;
$seed$;
commit;
`;
await writeFile(new URL("./seed.sql", import.meta.url), sql, "utf8");
