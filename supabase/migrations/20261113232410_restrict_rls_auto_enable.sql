-- Interní event trigger není veřejné RPC; zachováme automatické zapínání RLS.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
