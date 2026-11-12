-- CZ/SK Interpret Wiki: nové tabulky; žádné mazání existujících dat.
create schema if not exists rap_private;
revoke all on schema rap_private from public;
grant usage on schema rap_private to authenticated;

create table public.artists (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name text not null, real_name text, birth_date date, birth_city text,
 country text not null check (country in ('cz','sk')), bio jsonb not null default '[]'::jsonb check(jsonb_typeof(bio)='array'),
 photo text, photo_credit text, photo_license text, photo_source_url text,
 photo_status text not null default 'needs_review' check(photo_status in ('ok','needs_review')),
 active_from text, active_to text, display_order integer not null default 0,
 source_file text, todos jsonb not null default '[]'::jsonb
);
comment on column public.artists.active_from is 'Původní rok nebo přibližný text; nedoplňovat odhadem.';
create table public.albums (
 id uuid primary key default gen_random_uuid(), artist_id uuid not null references public.artists(id),
 title text not null, release_date date, release_year integer check(release_year between 1800 and 2200),
 type text check(type in ('album','ep','mixtape','live')), cover text, cover_source_url text, spotify_url text,
 display_order integer not null default 0, unique(artist_id, spotify_url)
);
create table public.tracks (
 id uuid primary key default gen_random_uuid(), album_id uuid not null references public.albums(id),
 title text not null, position integer check(position>0), duration_sec integer check(duration_sec>=0), unique(album_id,position)
);
create table public.genres (id uuid primary key default gen_random_uuid(), name text not null unique);
create table public.artist_genres (
 artist_id uuid not null references public.artists(id), genre_id uuid not null references public.genres(id),
 display_order integer not null default 0, primary key(artist_id,genre_id)
);
create table public.crews (id uuid primary key default gen_random_uuid(), name text not null unique);
create table public.artist_crews (
 artist_id uuid not null references public.artists(id), crew_id uuid not null references public.crews(id),
 display_order integer not null default 0, primary key(artist_id,crew_id)
);
create table public.collaborations (
 id uuid primary key default gen_random_uuid(), artist_a uuid not null references public.artists(id),
 artist_b uuid not null references public.artists(id), track_title text, year integer, check(artist_a<>artist_b)
);
create table public.links (
 id uuid primary key default gen_random_uuid(), artist_id uuid not null references public.artists(id),
 platform text not null, url text not null, display_order integer not null default 0, unique(artist_id,platform,url)
);
create table public.profiles (
 id uuid primary key references auth.users(id), display_name text,
 role text not null default 'user' check(role in ('user','admin'))
);
create table public.favorites (
 user_id uuid not null default auth.uid() references public.profiles(id),
 artist_id uuid not null references public.artists(id), primary key(user_id,artist_id)
);
create table public.ratings (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id),
 album_id uuid not null references public.albums(id), stars integer not null check(stars between 1 and 5),
 comment text, created_at timestamptz not null default now(), unique(user_id,album_id)
);
create table public.quiz_scores (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id),
 score integer not null check(score>=0), created_at timestamptz not null default now()
);
create table public.suggestions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id),
 artist_id uuid references public.artists(id), field text not null, proposed_value text not null, note text,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), reviewed_by uuid references public.profiles(id)
);
-- Unikátní a primární klíče již indexují slug a první sloupce složených klíčů.
create index artist_genres_genre_idx on public.artist_genres(genre_id);
create index artist_crews_crew_idx on public.artist_crews(crew_id);
create index collaborations_artist_a_idx on public.collaborations(artist_a);
create index collaborations_artist_b_idx on public.collaborations(artist_b);
create index favorites_artist_idx on public.favorites(artist_id);
create index ratings_album_idx on public.ratings(album_id);
create index quiz_scores_user_idx on public.quiz_scores(user_id);
create index suggestions_user_idx on public.suggestions(user_id);
create index suggestions_artist_idx on public.suggestions(artist_id);
create index suggestions_reviewer_idx on public.suggestions(reviewed_by);

-- INVOKER: role se čte z vlastního řádku profiles přes jeho RLS, nikoli z metadat JWT.
create function rap_private.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function rap_private.is_admin() from public, anon;
grant execute on function rap_private.is_admin() to authenticated;

-- Trigger potřebuje právo vložit profil; není dostupný jako veřejné RPC.
create function rap_private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name,role) values(new.id, new.raw_user_meta_data->>'display_name', 'user');
 return new;
end;
$$;
revoke all on function rap_private.handle_new_user() from public, anon, authenticated;
create trigger rap_wiki_user_created after insert on auth.users for each row execute function rap_private.handle_new_user();
-- Doplnění profilů již registrovaným účtům nikdy nezmění jejich existující role.
insert into public.profiles(id,display_name,role)
 select id,raw_user_meta_data->>'display_name','user' from auth.users on conflict(id) do nothing;

alter table public.artists enable row level security;
revoke all on public.artists from anon, authenticated;

alter table public.albums enable row level security;
revoke all on public.albums from anon, authenticated;

alter table public.tracks enable row level security;
revoke all on public.tracks from anon, authenticated;

alter table public.genres enable row level security;
revoke all on public.genres from anon, authenticated;

alter table public.artist_genres enable row level security;
revoke all on public.artist_genres from anon, authenticated;

alter table public.crews enable row level security;
revoke all on public.crews from anon, authenticated;

alter table public.artist_crews enable row level security;
revoke all on public.artist_crews from anon, authenticated;

alter table public.collaborations enable row level security;
revoke all on public.collaborations from anon, authenticated;

alter table public.links enable row level security;
revoke all on public.links from anon, authenticated;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;

alter table public.favorites enable row level security;
revoke all on public.favorites from anon, authenticated;

alter table public.ratings enable row level security;
revoke all on public.ratings from anon, authenticated;

alter table public.quiz_scores enable row level security;
revoke all on public.quiz_scores from anon, authenticated;

alter table public.suggestions enable row level security;
revoke all on public.suggestions from anon, authenticated;

grant select on public.artists to anon, authenticated;
grant insert, update, delete on public.artists to authenticated;
create policy artists_read on public.artists for select to anon, authenticated using(true);
create policy artists_admin_insert on public.artists for insert to authenticated with check((select rap_private.is_admin()));
create policy artists_admin_update on public.artists for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy artists_admin_delete on public.artists for delete to authenticated using((select rap_private.is_admin()));

grant select on public.albums to anon, authenticated;
grant insert, update, delete on public.albums to authenticated;
create policy albums_read on public.albums for select to anon, authenticated using(true);
create policy albums_admin_insert on public.albums for insert to authenticated with check((select rap_private.is_admin()));
create policy albums_admin_update on public.albums for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy albums_admin_delete on public.albums for delete to authenticated using((select rap_private.is_admin()));

grant select on public.tracks to anon, authenticated;
grant insert, update, delete on public.tracks to authenticated;
create policy tracks_read on public.tracks for select to anon, authenticated using(true);
create policy tracks_admin_insert on public.tracks for insert to authenticated with check((select rap_private.is_admin()));
create policy tracks_admin_update on public.tracks for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy tracks_admin_delete on public.tracks for delete to authenticated using((select rap_private.is_admin()));

grant select on public.genres to anon, authenticated;
grant insert, update, delete on public.genres to authenticated;
create policy genres_read on public.genres for select to anon, authenticated using(true);
create policy genres_admin_insert on public.genres for insert to authenticated with check((select rap_private.is_admin()));
create policy genres_admin_update on public.genres for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy genres_admin_delete on public.genres for delete to authenticated using((select rap_private.is_admin()));

grant select on public.artist_genres to anon, authenticated;
grant insert, update, delete on public.artist_genres to authenticated;
create policy artist_genres_read on public.artist_genres for select to anon, authenticated using(true);
create policy artist_genres_admin_insert on public.artist_genres for insert to authenticated with check((select rap_private.is_admin()));
create policy artist_genres_admin_update on public.artist_genres for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy artist_genres_admin_delete on public.artist_genres for delete to authenticated using((select rap_private.is_admin()));

grant select on public.crews to anon, authenticated;
grant insert, update, delete on public.crews to authenticated;
create policy crews_read on public.crews for select to anon, authenticated using(true);
create policy crews_admin_insert on public.crews for insert to authenticated with check((select rap_private.is_admin()));
create policy crews_admin_update on public.crews for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy crews_admin_delete on public.crews for delete to authenticated using((select rap_private.is_admin()));

grant select on public.artist_crews to anon, authenticated;
grant insert, update, delete on public.artist_crews to authenticated;
create policy artist_crews_read on public.artist_crews for select to anon, authenticated using(true);
create policy artist_crews_admin_insert on public.artist_crews for insert to authenticated with check((select rap_private.is_admin()));
create policy artist_crews_admin_update on public.artist_crews for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy artist_crews_admin_delete on public.artist_crews for delete to authenticated using((select rap_private.is_admin()));

grant select on public.collaborations to anon, authenticated;
grant insert, update, delete on public.collaborations to authenticated;
create policy collaborations_read on public.collaborations for select to anon, authenticated using(true);
create policy collaborations_admin_insert on public.collaborations for insert to authenticated with check((select rap_private.is_admin()));
create policy collaborations_admin_update on public.collaborations for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy collaborations_admin_delete on public.collaborations for delete to authenticated using((select rap_private.is_admin()));

grant select on public.links to anon, authenticated;
grant insert, update, delete on public.links to authenticated;
create policy links_read on public.links for select to anon, authenticated using(true);
create policy links_admin_insert on public.links for insert to authenticated with check((select rap_private.is_admin()));
create policy links_admin_update on public.links for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));
create policy links_admin_delete on public.links for delete to authenticated using((select rap_private.is_admin()));

grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
create policy profiles_read_self on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

grant select on public.favorites to authenticated;
grant insert, update, delete on public.favorites to authenticated;
create policy favorites_read on public.favorites for select to authenticated using(user_id=(select auth.uid()));
create policy favorites_insert_self on public.favorites for insert to authenticated with check(user_id=(select auth.uid()));
create policy favorites_update_self on public.favorites for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy favorites_delete_self on public.favorites for delete to authenticated using(user_id=(select auth.uid()));

grant select on public.ratings to anon, authenticated;
grant insert, update, delete on public.ratings to authenticated;
create policy ratings_read on public.ratings for select to anon, authenticated using(true);
create policy ratings_insert_self on public.ratings for insert to authenticated with check(user_id=(select auth.uid()));
create policy ratings_update_self on public.ratings for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy ratings_delete_self on public.ratings for delete to authenticated using(user_id=(select auth.uid()));

grant select on public.quiz_scores to anon, authenticated;
grant insert, update, delete on public.quiz_scores to authenticated;
create policy quiz_scores_read on public.quiz_scores for select to anon, authenticated using(true);
create policy quiz_scores_insert_self on public.quiz_scores for insert to authenticated with check(user_id=(select auth.uid()));
create policy quiz_scores_update_self on public.quiz_scores for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy quiz_scores_delete_self on public.quiz_scores for delete to authenticated using(user_id=(select auth.uid()));

grant select, insert, update on public.suggestions to authenticated;
create policy suggestions_read on public.suggestions for select to authenticated using(user_id=(select auth.uid()) or (select rap_private.is_admin()));
create policy suggestions_insert_self on public.suggestions for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and reviewed_by is null);
create policy suggestions_admin_update on public.suggestions for update to authenticated using((select rap_private.is_admin())) with check((select rap_private.is_admin()));

insert into storage.buckets(id,name,public) values ('artists','artists',true),('covers','covers',true)
 on conflict(id) do update set public=true;
create policy rap_media_read on storage.objects for select to anon, authenticated using(bucket_id in ('artists','covers'));
create policy rap_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id in ('artists','covers') and (select rap_private.is_admin()));
create policy rap_media_admin_update on storage.objects for update to authenticated using(bucket_id in ('artists','covers') and (select rap_private.is_admin())) with check(bucket_id in ('artists','covers') and (select rap_private.is_admin()));
create policy rap_media_admin_delete on storage.objects for delete to authenticated using(bucket_id in ('artists','covers') and (select rap_private.is_admin()));
