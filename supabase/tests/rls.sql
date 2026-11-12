-- Spouštět po migraci a seedu pod databázovým vlastníkem.
-- Testovací účty existují pouze v transakci; ROLLBACK neodstraňuje existující data.
begin;
insert into auth.users(id,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000101','{"display_name":"Test uživatele","role":"admin"}'),
 ('00000000-0000-4000-8000-000000000102','{"display_name":"Jiný uživatel"}'),
 ('00000000-0000-4000-8000-000000000103','{"display_name":"Test správce"}');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000000103';

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated"}',true);
do $$
declare target_artist uuid; target_album uuid; affected integer;
begin
 if (select count(*) from public.profiles)<>1 then raise exception 'Selhalo soukromí profiles'; end if;
 if (select role from public.profiles)<>'user' then raise exception 'Role z metadat nesmí povýšit uživatele'; end if;
 select id into strict target_artist from public.artists limit 1;
 select id into strict target_album from public.albums limit 1;
 begin
  insert into public.artists(slug,name,country) values('rls-test-nepovolen','Test','cz');
  raise exception 'Běžný uživatel může vložit interpreta';
 exception when insufficient_privilege then null;
 end;
 update public.artists set name='Nepovolená změna' where id=target_artist;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Běžný uživatel může měnit interpreta'; end if;
 begin
  update public.profiles set role='admin' where id=auth.uid();
  raise exception 'Uživatel si může změnit roli';
 exception when insufficient_privilege then null;
 end;
 update public.profiles set display_name='Povolená změna' where id=auth.uid();
 if (select display_name from public.profiles)<>'Povolená změna' then raise exception 'Vlastní jméno nelze upravit'; end if;
 insert into public.favorites(user_id,artist_id) values(auth.uid(),target_artist);
 insert into public.ratings(user_id,album_id,stars) values(auth.uid(),target_album,4);
 insert into public.quiz_scores(user_id,score) values(auth.uid(),3);
 insert into public.suggestions(user_id,artist_id,field,proposed_value) values(auth.uid(),target_artist,'name','Návrh');
 begin
  insert into public.favorites(user_id,artist_id) values('00000000-0000-4000-8000-000000000102',target_artist);
  raise exception 'Lze zapisovat cizí oblíbené';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.ratings set user_id='00000000-0000-4000-8000-000000000102' where user_id=auth.uid();
  raise exception 'Lze převést vlastnictví hodnocení';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.suggestions(user_id,field,proposed_value,status) values(auth.uid(),'name','Návrh','approved');
  raise exception 'Uživatel může předem schválit návrh';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into storage.objects(bucket_id,name) values('artists','rls-test.jpg');
  raise exception 'Uživatel může nahrávat obrázky';
 exception when insufficient_privilege then null;
 end;
end;
$$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000102',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated"}',true);
do $$
begin
 if exists(select 1 from public.favorites) then raise exception 'Viditelné cizí oblíbené'; end if;
 if exists(select 1 from public.suggestions) then raise exception 'Viditelné cizí návrhy'; end if;
 if not exists(select 1 from public.ratings) then raise exception 'Hodnocení nejsou veřejná'; end if;
 if not exists(select 1 from public.quiz_scores) then raise exception 'Výsledky nejsou veřejné'; end if;
end;
$$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000103","role":"authenticated"}',true);
do $$
declare affected integer;
begin
 if not rap_private.is_admin() then raise exception 'Role správce není rozpoznána'; end if;
 insert into public.artists(slug,name,country) values('rls-test-admin','Test správce','cz');
 update public.suggestions set status='approved', reviewed_by=auth.uid();
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'Správce nemůže schválit návrh'; end if;
 insert into storage.objects(bucket_id,name) values('artists','rls-admin.jpg');
end;
$$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
begin
 if not exists(select 1 from public.artists) then raise exception 'Anonymní čtení nefunguje'; end if;
 begin
  insert into public.artists(slug,name,country) values('rls-test-anon','Test','cz');
  raise exception 'Anonymní zápis je povolen';
 exception when insufficient_privilege then null;
 end;
end;
$$;
rollback;
