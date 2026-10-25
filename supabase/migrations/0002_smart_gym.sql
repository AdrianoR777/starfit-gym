-- GYM EXPERIENCE 2026 · Fase 4: ocupación, máquinas inteligentes, turnos, mantenimiento por QR, contacto, consentimientos.

-- ===== Ocupación en vivo (agregada, sin identidades) =====
-- Fuente: checkins abiertos del día. Expone solo conteos.
create or replace function public.live_occupancy(p_location uuid)
returns table (inside int, capacity int, last_event timestamptz, source text)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from checkins c
      where c.location_id = p_location and c.checked_out_at is null
        and c.checked_in_at > (date_trunc('day', now() at time zone 'America/Lima') at time zone 'America/Lima')),
    (select g.capacity from gym_locations g where g.id = p_location),
    (select max(greatest(c.checked_in_at, coalesce(c.checked_out_at, c.checked_in_at))) from checkins c where c.location_id = p_location),
    case when exists (select 1 from integration_settings i join gym_locations g on g.organization_id = i.organization_id
                      where g.id = p_location and i.key = 'access_control' and i.enabled) then 'access_control' else 'reception_qr' end;
$$;
grant execute on function public.live_occupancy(uuid) to anon, authenticated;

-- Historial agregado por hora (para predicción y mapa de calor); público porque no tiene datos personales
create or replace function public.occupancy_history(p_location uuid, p_days int default 56)
returns table (dow int, hour int, visits int, days int)
language sql stable security definer set search_path = public as $$
  select extract(isodow from checked_in_at at time zone 'America/Lima')::int,
         extract(hour from checked_in_at at time zone 'America/Lima')::int,
         count(*)::int,
         count(distinct (checked_in_at at time zone 'America/Lima')::date)::int
  from checkins
  where location_id = p_location and checked_in_at > now() - make_interval(days => least(greatest(p_days, 7), 365))
  group by 1, 2;
$$;
grant execute on function public.occupancy_history(uuid, int) to anon, authenticated;

-- Corrección de registros incompletos: cierra entradas sin salida de días anteriores
create or replace function public.close_stale_checkins()
returns int language sql security definer set search_path = public as $$
  with u as (
    update checkins set checked_out_at = checked_in_at + interval '2 hours', source = source || '+auto_close'
    where checked_out_at is null
      and checked_in_at < (date_trunc('day', now() at time zone 'America/Lima') at time zone 'America/Lima')
    returning 1)
  select count(*)::int from u;
$$;
revoke execute on function public.close_stale_checkins() from public, anon, authenticated;

-- ===== Equipos: estado con origen y trazabilidad =====
alter type equipment_status add value if not exists 'in_use';
alter type equipment_status add value if not exists 'reserved';
alter table equipment add column if not exists category text;
alter table equipment add column if not exists instructions text;
alter table equipment add column if not exists photos text[] not null default '{}';
alter table equipment add column if not exists queue_enabled boolean not null default false;
alter table equipment add column if not exists queue_confirm_minutes int not null default 3 check (queue_confirm_minutes between 1 and 30);
alter table equipment add column if not exists status_source text not null default 'manual' check (status_source in ('manual','sensor','vendor'));
alter table equipment add column if not exists status_updated_at timestamptz not null default now();

create table if not exists equipment_status_events (
  id bigserial primary key,
  equipment_id uuid not null references equipment(id) on delete cascade,
  status equipment_status not null,
  source text not null check (source in ('manual','sensor','vendor')),
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists equipment_status_events_eq on equipment_status_events(equipment_id, created_at desc);

-- Solo staff cambia estados; queda registrado
create or replace function public.set_equipment_status(p_equipment uuid, p_status equipment_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare e equipment; org uuid;
begin
  select * into e from equipment where id = p_equipment for update;
  if not found then raise exception 'not_found'; end if;
  select organization_id into org from gym_locations where id = e.location_id;
  if not has_role(org, '{owner,admin,reception,trainer}', e.location_id) then raise exception 'forbidden'; end if;
  update equipment set status = p_status, status_source = 'manual', status_updated_at = now() where id = p_equipment;
  insert into equipment_status_events(equipment_id, status, source, note, changed_by) values (p_equipment, p_status, 'manual', p_note, auth.uid());
  insert into audit_logs(organization_id, actor_id, action, entity, entity_id, meta)
    values (org, auth.uid(), 'equipment.status', 'equipment', p_equipment::text, jsonb_build_object('status', p_status));
  -- equipo fuera de servicio: se vacía su cola y se avisa
  if p_status in ('maintenance','out_of_service') then
    insert into notifications(user_id, kind, title, dedupe_key)
      select q.user_id, 'queue_cancelled', 'La máquina ' || e.name || ' quedó fuera de servicio; tu turno fue liberado', 'qcancel:' || q.id
      from equipment_queue q where q.equipment_id = p_equipment and q.status in ('waiting','called')
      on conflict do nothing;
    update equipment_queue set status = 'cancelled' where equipment_id = p_equipment and status in ('waiting','called');
  end if;
end $$;
grant execute on function public.set_equipment_status(uuid, equipment_status, text) to authenticated;

-- ===== Turnos virtuales por máquina =====
create table if not exists equipment_queue (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','called','confirmed','expired','cancelled','done')),
  called_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists equipment_queue_one_active on equipment_queue(equipment_id, user_id) where status in ('waiting','called','confirmed');
create unique index if not exists equipment_queue_one_machine on equipment_queue(user_id) where status in ('waiting','called','confirmed');

create or replace function public.queue_join(p_equipment uuid)
returns int language plpgsql security definer set search_path = public as $$
declare e equipment; uid uuid := auth.uid(); pos int;
begin
  if uid is null then raise exception 'auth_required'; end if;
  select * into e from equipment where id = p_equipment for update;
  if not found or not e.queue_enabled then raise exception 'queue_disabled'; end if;
  if e.status in ('maintenance','out_of_service') then raise exception 'equipment_unavailable'; end if;
  if not exists (select 1 from memberships m where m.user_id = uid and m.status = 'active'
                 and (m.ends_on is null or m.ends_on >= (now() at time zone 'America/Lima')::date)) then
    raise exception 'membership_required'; end if;
  insert into equipment_queue(equipment_id, user_id) values (p_equipment, uid);
  select count(*)::int into pos from equipment_queue where equipment_id = p_equipment and status in ('waiting','called');
  return pos;
exception when unique_violation then raise exception 'already_in_queue';
end $$;

-- Avanza la cola: expira llamados no confirmados y llama al siguiente (ejecutar con cron o al liberar la máquina)
create or replace function public.queue_advance(p_equipment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e equipment; nxt equipment_queue;
begin
  select * into e from equipment where id = p_equipment for update;
  update equipment_queue set status = 'expired'
    where equipment_id = p_equipment and status = 'called' and called_at < now() - make_interval(mins => e.queue_confirm_minutes);
  if exists (select 1 from equipment_queue where equipment_id = p_equipment and status in ('called','confirmed')) then return; end if;
  select * into nxt from equipment_queue where equipment_id = p_equipment and status = 'waiting' order by created_at limit 1 for update skip locked;
  if found then
    update equipment_queue set status = 'called', called_at = now() where id = nxt.id;
    insert into notifications(user_id, kind, title, body, dedupe_key)
      values (nxt.user_id, 'queue_called', 'Es tu turno: ' || e.name, 'Confirma en ' || e.queue_confirm_minutes || ' min o se libera.', 'qcall:' || nxt.id)
      on conflict do nothing;
  end if;
end $$;

create or replace function public.queue_confirm(p_entry uuid)
returns text language plpgsql security definer set search_path = public as $$
declare q equipment_queue; e equipment;
begin
  select * into q from equipment_queue where id = p_entry and user_id = auth.uid() for update;
  if not found then return 'not_found'; end if;
  select * into e from equipment where id = q.equipment_id;
  if q.status <> 'called' then return q.status; end if;
  if q.called_at < now() - make_interval(mins => e.queue_confirm_minutes) then
    update equipment_queue set status = 'expired' where id = p_entry; perform queue_advance(q.equipment_id); return 'expired';
  end if;
  update equipment_queue set status = 'confirmed' where id = p_entry;
  return 'confirmed';
end $$;

create or replace function public.queue_leave(p_entry uuid)
returns void language plpgsql security definer set search_path = public as $$
declare q equipment_queue;
begin
  update equipment_queue set status = case when status = 'confirmed' then 'done' else 'cancelled' end
    where id = p_entry and user_id = auth.uid() and status in ('waiting','called','confirmed') returning * into q;
  if found then perform queue_advance(q.equipment_id); end if;
end $$;
grant execute on function public.queue_join(uuid), public.queue_confirm(uuid), public.queue_leave(uuid), public.queue_advance(uuid) to authenticated;

-- ===== Tickets de mantenimiento (socios reportan, staff gestiona) =====
create table if not exists maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  reported_by uuid references auth.users(id),
  description text not null check (length(description) between 5 and 1000),
  photo_path text,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','resolved','rejected')),
  assigned_to text,
  cost_cents int check (cost_cents >= 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists maintenance_tickets_status on maintenance_tickets(status, created_at desc);

-- ===== Contacto / solicitudes =====
create table if not exists support_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  location_id uuid references gym_locations(id),
  user_id uuid references auth.users(id),
  name text not null check (length(name) between 2 and 80),
  contact text not null check (length(contact) between 5 and 120),
  topic text not null check (topic in ('membresia','clases','entrenador','instalaciones','otro')),
  message text not null check (length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  consent_at timestamptz not null,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists support_requests_ip on support_requests(ip_hash, created_at desc);

-- ===== Consentimientos y preferencias =====
create table if not exists user_consents (
  user_id uuid references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('marketing','whatsapp','wearables','camera_motion','analytics')),
  granted boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, purpose)
);

-- ===== RLS =====
alter table equipment_status_events enable row level security;
alter table equipment_queue enable row level security;
alter table maintenance_tickets enable row level security;
alter table support_requests enable row level security;
alter table user_consents enable row level security;

create policy staff_read on equipment_status_events for select using (exists (select 1 from equipment e join gym_locations g on g.id = e.location_id where e.id = equipment_id and has_role(g.organization_id, '{owner,admin,reception,trainer}', g.id)));
create policy own on equipment_queue for select using (user_id = auth.uid() or exists (select 1 from equipment e join gym_locations g on g.id = e.location_id where e.id = equipment_id and has_role(g.organization_id, '{owner,admin,reception,trainer}', g.id)));
create policy own_insert on maintenance_tickets for insert with check (reported_by = auth.uid() and status = 'open' and assigned_to is null and cost_cents is null);
create policy own_or_staff on maintenance_tickets for select using (reported_by = auth.uid() or exists (select 1 from equipment e join gym_locations g on g.id = e.location_id where e.id = equipment_id and has_role(g.organization_id, '{owner,admin,reception,trainer}', g.id)));
create policy staff_update on maintenance_tickets for update using (exists (select 1 from equipment e join gym_locations g on g.id = e.location_id where e.id = equipment_id and has_role(g.organization_id, '{owner,admin}', g.id)));
create policy staff_read on support_requests for select using (has_role(organization_id, '{owner,admin,reception}'));
create policy staff_update on support_requests for update using (has_role(organization_id, '{owner,admin,reception}'));
create policy own on user_consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- support_requests: inserción solo vía servidor (service role) con límite de abuso
