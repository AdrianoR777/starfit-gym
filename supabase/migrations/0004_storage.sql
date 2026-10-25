-- Bucket público para logo y video de portada (solo escritura desde el servidor con service role)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('branding', 'branding', true, 26214400, array['image/png','image/jpeg','image/webp','image/svg+xml','video/mp4'])
    on conflict (id) do nothing;
  end if;
end $$;
