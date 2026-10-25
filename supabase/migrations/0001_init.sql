-- STAR FIT / GYMNOVA — esquema base multi-organización y multisede
-- Zona horaria de negocio: America/Lima. Moneda: PEN (montos en céntimos).
create extension if not exists pgcrypto;

-- ===== Tipos =====
create type app_role as enum ('owner','admin','reception','trainer','member');
create type membership_status as enum ('pending_payment','active','suspended','expired','cancelled');
create type payment_status as enum ('pending','paid','failed','refunded');
create type booking_status as enum ('confirmed','cancelled','attended','no_show');
create type equipment_status as enum ('operational','maintenance','out_of_service');
create type plan_period as enum ('monthly','quarterly','semiannual','annual','day_pass','session_pack','custom');

-- ===== Organización y sedes =====
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  brand jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Lima',
  currency char(3) not null default 'PEN',
  created_at timestamptz not null default now()
);

create table gym_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  district text,
  city text default 'Lima',
  phone text,
  capacity int check (capacity > 0),
  opening_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on gym_locations(organization_id);

-- ===== Usuarios =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  full_name text,
  phone text,
  document_id text,
  birth_date date,
  avatar_path text,
  goals text[] not null default '{}',
  stats_hidden boolean not null default false,
  notify_email boolean not null default true,
  notify_whatsapp boolean not null default false,
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  created_at timestamptz not null default now()
);

create table staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references gym_locations(id) on delete cascade, -- null = todas las sedes
  role app_role not null check (role <> 'member'),
  is_active boolean not null default true,
  unique (user_id, organization_id, location_id, role)
);
create index on staff_members(user_id);

create table trainers (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references staff_members(id) on delete cascade,
  bio text,
  specialties text[] not null default '{}',
  certifications text[] not null default '{}',
  photo_path text,
  is_public boolean not null default false
);

create table trainer_assignments (
  trainer_id uuid references trainers(id) on delete cascade,
  member_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trainer_id, member_id)
);

-- ===== Helpers de autorización (SECURITY DEFINER evita recursión RLS) =====
create or replace function public.has_role(org uuid, roles app_role[], loc uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_members s
    where s.user_id = auth.uid() and s.is_active
      and s.organization_id = org and s.role = any(roles)
      and (s.location_id is null or loc is null or s.location_id = loc)
  );
$$;

create or replace function public.is_trainer_of(member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trainer_assignments ta
    join trainers t on t.id = ta.trainer_id
    join staff_members s on s.id = t.staff_id
    where ta.member_id = member and s.user_id = auth.uid() and s.is_active
  );
$$;

-- ===== Membresías =====
create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references gym_locations(id), -- null = todas
  name text not null,
  description text,
  period plan_period not null,
  duration_days int check (duration_days > 0),
  sessions_included int,
  price_cents int not null check (price_cents >= 0),
  enrollment_fee_cents int not null default 0,
  terms text not null,
  is_public boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references membership_plans(id),
  organization_id uuid not null references organizations(id),
  location_id uuid references gym_locations(id),
  status membership_status not null default 'pending_payment',
  starts_on date,
  ends_on date,
  sessions_remaining int,
  auto_renew_authorized boolean not null default false,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on memberships(user_id, status);

create table membership_changes (
  id bigserial primary key,
  membership_id uuid not null references memberships(id) on delete cascade,
  from_status membership_status,
  to_status membership_status not null,
  reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  percent_off int check (percent_off between 1 and 100),
  valid_until date,
  max_uses int,
  used int not null default 0,
  unique (organization_id, code)
);

-- ===== Pagos =====
create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id),
  membership_id uuid references memberships(id),
  amount_cents int not null check (amount_cents > 0),
  currency char(3) not null default 'PEN',
  provider text not null,                -- culqi | mercadopago | niubiz | cash
  provider_ref text,                     -- id de cargo/orden del proveedor
  idempotency_key text not null unique,
  status payment_status not null default 'pending',
  raw_event jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index on payments(user_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references payments(id),
  series text, number text, kind text check (kind in ('boleta','factura')),
  sunat_status text not null default 'pending_integration',
  pdf_path text,
  created_at timestamptz not null default now()
);

create table webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- ===== Acceso =====
create table access_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  public_code text not null unique default encode(gen_random_bytes(8),'hex'),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table access_events (
  id bigserial primary key,
  credential_id uuid references access_credentials(id),
  location_id uuid not null references gym_locations(id),
  nonce text unique,                     -- impide reutilizar un QR
  direction text not null check (direction in ('in','out')),
  granted boolean not null,
  reason text,
  validated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table checkins (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  location_id uuid not null references gym_locations(id),
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  source text not null default 'qr'
);
create index on checkins(location_id, checked_in_at);
create index on checkins(user_id, checked_in_at desc);

-- ===== Zonas, ocupación y equipos =====
create table training_zones (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references gym_locations(id) on delete cascade,
  name text not null,
  kind text not null,
  description text,
  rules text,
  capacity int,
  map_shape jsonb,                        -- {x,y,w,h} sobre plano 100x60
  photos text[] not null default '{}'
);

create table occupancy_records (
  id bigserial primary key,
  location_id uuid not null references gym_locations(id),
  zone_id uuid references training_zones(id),
  count int not null check (count >= 0),
  source text not null check (source in ('sensor','access_control','manual')),
  recorded_at timestamptz not null default now()
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references gym_locations(id),
  zone_id uuid references training_zones(id),
  code text not null,
  name text not null,
  status equipment_status not null default 'operational',
  reservable boolean not null default false,
  last_maintenance_on date,
  next_inspection_on date,
  unique (location_id, code)
);

create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  description text not null,
  technician text,
  cost_cents int,
  resolved boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ===== Clases y reservas =====
create table classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  kind text not null,
  description text,
  level text
);

create table class_schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  location_id uuid not null references gym_locations(id),
  zone_id uuid references training_zones(id),
  trainer_id uuid references trainers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  capacity int not null check (capacity > 0),
  booked int not null default 0 check (booked >= 0),
  cancelled boolean not null default false,
  constraint not_overbooked check (booked <= capacity)
);
create index on class_schedules(location_id, starts_at);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references class_schedules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status booking_status not null default 'confirmed',
  created_at timestamptz not null default now()
);
-- una sola reserva activa por clase y usuario
create unique index bookings_one_active on bookings(schedule_id, user_id) where status in ('confirmed','attended');

create table waiting_lists (
  schedule_id uuid references class_schedules(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (schedule_id, user_id)
);

-- ===== Entrenamiento =====
create table exercises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  difficulty text check (difficulty in ('inicial','intermedio','avanzado')),
  video_url text,
  technique_notes text,
  alternatives uuid[] not null default '{}'
);

create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  created_by uuid references auth.users(id),
  name text not null,
  items jsonb not null default '[]'::jsonb  -- [{exercise_id, sets, reps, rest_s, notes}]
);

create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid references trainers(id),
  template_id uuid references workout_templates(id),
  name text not null,
  items jsonb not null default '[]'::jsonb,
  reviewed_by_professional boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  scheduled_on date not null
);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references workout_plans(id),
  session_id uuid references workout_sessions(id),
  completed_items jsonb not null default '[]'::jsonb,
  perceived_effort int check (perceived_effort between 1 and 10),
  notes text,
  logged_at timestamptz not null default now()
);

-- ===== Comunicación, notificaciones, recompensas =====
create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  member_id uuid not null references auth.users(id),
  channel text not null check (channel in ('reception','trainer','staff')),
  created_at timestamptz not null default now()
);
create table messages (
  id bigserial primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (length(body) <= 4000),
  attachment_path text,
  created_at timestamptz not null default now()
);

create table notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  channel text not null default 'in_app',
  dedupe_key text unique,                -- evita envíos duplicados
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  rule jsonb not null,                   -- p.ej. {"type":"attendance_weeks","weeks":4,"max_per_week":5}
  benefit text
);
create table achievements (
  user_id uuid references auth.users(id) on delete cascade,
  reward_id uuid references rewards(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, reward_id)
);

create table wearable_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  scopes text[] not null default '{}',
  consent_at timestamptz not null,
  revoked_at timestamptz,
  unique (user_id, provider)
);

create table integration_settings (
  organization_id uuid references organizations(id) on delete cascade,
  key text not null,                     -- culqi | resend | whatsapp | turnstile ...
  enabled boolean not null default false,
  public_config jsonb not null default '{}'::jsonb, -- secretos SOLO en variables de entorno
  primary key (organization_id, key)
);

create table audit_logs (
  id bigserial primary key,
  organization_id uuid,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ===== Funciones de negocio =====

-- Reserva transaccional: bloquea la fila del horario para evitar sobreventa
create or replace function public.book_class(p_schedule uuid)
returns text language plpgsql security definer set search_path = public as $$
declare s class_schedules; uid uuid := auth.uid(); has_active boolean;
begin
  if uid is null then raise exception 'auth_required'; end if;
  select * into s from class_schedules where id = p_schedule for update;
  if not found or s.cancelled then raise exception 'class_unavailable'; end if;
  if s.starts_at < now() then raise exception 'class_started'; end if;
  select exists(select 1 from memberships m where m.user_id = uid and m.status='active'
    and (m.location_id is null or m.location_id = s.location_id)
    and (m.ends_on is null or m.ends_on >= (now() at time zone 'America/Lima')::date)) into has_active;
  if not has_active then raise exception 'membership_required'; end if;
  if exists(select 1 from bookings where schedule_id=p_schedule and user_id=uid and status in ('confirmed','attended')) then
    return 'already_booked';
  end if;
  if s.booked >= s.capacity then
    insert into waiting_lists(schedule_id,user_id) values (p_schedule,uid) on conflict do nothing;
    return 'waitlisted';
  end if;
  insert into bookings(schedule_id,user_id) values (p_schedule,uid);
  update class_schedules set booked = booked + 1 where id = p_schedule;
  insert into notifications(user_id,kind,title,dedupe_key)
    values (uid,'booking_confirmed','Reserva confirmada','booking:'||p_schedule||':'||uid) on conflict do nothing;
  return 'confirmed';
end $$;

create or replace function public.cancel_booking(p_schedule uuid)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); nxt uuid;
begin
  perform 1 from class_schedules where id = p_schedule for update;
  update bookings set status='cancelled' where schedule_id=p_schedule and user_id=uid and status='confirmed';
  if not found then return 'not_found'; end if;
  -- promover al primero de la lista de espera
  select user_id into nxt from waiting_lists where schedule_id=p_schedule order by created_at limit 1;
  if nxt is not null then
    delete from waiting_lists where schedule_id=p_schedule and user_id=nxt;
    insert into bookings(schedule_id,user_id) values (p_schedule,nxt);
    insert into notifications(user_id,kind,title,dedupe_key)
      values (nxt,'waitlist_promoted','Se liberó un cupo: tu reserva está confirmada','promo:'||p_schedule||':'||nxt) on conflict do nothing;
  else
    update class_schedules set booked = booked - 1 where id = p_schedule;
  end if;
  return 'cancelled';
end $$;

-- Activación de membresía: solo se invoca desde el backend (service_role) tras verificar el pago
create or replace function public.activate_membership(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p payments; m memberships; pl membership_plans; today date := (now() at time zone 'America/Lima')::date; base date;
begin
  select * into p from payments where id = p_payment for update;
  if p.status <> 'paid' or p.membership_id is null then return; end if;
  select * into m from memberships where id = p.membership_id for update;
  select * into pl from membership_plans where id = m.plan_id;
  -- renovación: si ya hay una activa vigente, extiende desde su fin
  select max(ends_on) into base from memberships where user_id = m.user_id and status='active' and ends_on >= today and id <> m.id;
  update memberships set status='active',
    starts_on = coalesce(base + 1, today),
    ends_on = case when pl.duration_days is null then null else coalesce(base + 1, today) + pl.duration_days - 1 end,
    sessions_remaining = pl.sessions_included
  where id = m.id;
  insert into membership_changes(membership_id,from_status,to_status,reason) values (m.id,m.status,'active','payment:'||p.id);
  insert into access_credentials(user_id) values (m.user_id) on conflict (user_id) do nothing;
end $$;
revoke execute on function public.activate_membership(uuid) from public, anon, authenticated;

-- Crear perfil al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, full_name, phone, accepted_terms_at, accepted_privacy_at, organization_id)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', now(), now(),
          (select id from organizations order by created_at limit 1));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Vista agregada de afluencia histórica (solo conteos, sin datos personales)
create or replace view public.hourly_traffic with (security_invoker = false) as
  select location_id,
         extract(isodow from checked_in_at at time zone 'America/Lima')::int as dow,
         extract(hour from checked_in_at at time zone 'America/Lima')::int as hour,
         count(*)::int as visits,
         count(distinct date_trunc('day', checked_in_at))::int as days
  from checkins where checked_in_at > now() - interval '90 days'
  group by 1,2,3;

-- ===== RLS =====
alter table organizations enable row level security;
alter table gym_locations enable row level security;
alter table profiles enable row level security;
alter table staff_members enable row level security;
alter table trainers enable row level security;
alter table trainer_assignments enable row level security;
alter table membership_plans enable row level security;
alter table memberships enable row level security;
alter table membership_changes enable row level security;
alter table coupons enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table webhook_events enable row level security;
alter table access_credentials enable row level security;
alter table access_events enable row level security;
alter table checkins enable row level security;
alter table training_zones enable row level security;
alter table occupancy_records enable row level security;
alter table equipment enable row level security;
alter table maintenance_records enable row level security;
alter table classes enable row level security;
alter table class_schedules enable row level security;
alter table bookings enable row level security;
alter table waiting_lists enable row level security;
alter table exercises enable row level security;
alter table workout_templates enable row level security;
alter table workout_plans enable row level security;
alter table workout_sessions enable row level security;
alter table workout_logs enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table rewards enable row level security;
alter table achievements enable row level security;
alter table wearable_connections enable row level security;
alter table integration_settings enable row level security;
alter table audit_logs enable row level security;

-- Contenido público
create policy pub_read on organizations for select using (true);
create policy pub_read on gym_locations for select using (is_active);
create policy pub_read on membership_plans for select using (is_public);
create policy pub_read on classes for select using (true);
create policy pub_read on class_schedules for select using (true);
create policy pub_read on training_zones for select using (true);
create policy pub_read on trainers for select using (is_public or exists(select 1 from staff_members s where s.id = staff_id and s.user_id = auth.uid()));
create policy pub_read on equipment for select using (true);
create policy pub_read on exercises for select using (auth.uid() is not null);
create policy pub_read on rewards for select using (true);

-- Gestión por staff de la organización / sede
create policy staff_write on gym_locations for all using (has_role(organization_id, '{owner,admin}')) with check (has_role(organization_id, '{owner,admin}'));
create policy staff_write on membership_plans for all using (has_role(organization_id, '{owner,admin}')) with check (has_role(organization_id, '{owner,admin}'));
create policy staff_write on classes for all using (has_role(organization_id, '{owner,admin}')) with check (has_role(organization_id, '{owner,admin}'));
create policy staff_write on class_schedules for all
  using (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin,reception}', location_id))
  with check (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin,reception}', location_id));
create policy staff_write on training_zones for all
  using (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin}', location_id))
  with check (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin}', location_id));
create policy staff_write on equipment for all
  using (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin,reception,trainer}', location_id))
  with check (has_role((select organization_id from gym_locations g where g.id = location_id), '{owner,admin,reception,trainer}', location_id));
create policy staff_all on maintenance_records for all
  using (exists(select 1 from equipment e join gym_locations g on g.id=e.location_id where e.id=equipment_id and has_role(g.organization_id,'{owner,admin,reception,trainer}',g.id)));
create policy staff_all on exercises for all using (has_role(organization_id,'{owner,admin,trainer}')) with check (has_role(organization_id,'{owner,admin,trainer}'));
create policy staff_all on workout_templates for all using (has_role(organization_id,'{owner,admin,trainer}')) with check (has_role(organization_id,'{owner,admin,trainer}'));
create policy staff_all on coupons for all using (has_role(organization_id,'{owner,admin}'));
create policy staff_all on rewards for all using (has_role(organization_id,'{owner,admin}'));
create policy staff_read on staff_members for select using (user_id = auth.uid() or has_role(organization_id,'{owner,admin}'));
create policy staff_manage on staff_members for all using (has_role(organization_id,'{owner}')) with check (has_role(organization_id,'{owner}'));
create policy staff_read on occupancy_records for select using (true);
create policy staff_write on occupancy_records for insert with check (has_role((select organization_id from gym_locations g where g.id=location_id),'{owner,admin,reception}',location_id));
create policy staff_all on integration_settings for all using (has_role(organization_id,'{owner,admin}'));
create policy staff_read on audit_logs for select using (has_role(organization_id,'{owner,admin}'));

-- Datos propios del miembro (+ staff autorizado)
create policy own on profiles for select using (id = auth.uid() or is_trainer_of(id) or has_role(organization_id,'{owner,admin,reception}'));
create policy own_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy own on memberships for select using (user_id = auth.uid() or has_role(organization_id,'{owner,admin,reception}', location_id));
create policy own_create on memberships for insert with check (user_id = auth.uid() and status = 'pending_payment');
create policy own on membership_changes for select using (exists(select 1 from memberships m where m.id = membership_id and (m.user_id = auth.uid() or has_role(m.organization_id,'{owner,admin,reception}'))));
create policy own on payments for select using (user_id = auth.uid() or has_role(organization_id,'{owner,admin,reception}'));
create policy own on invoices for select using (exists(select 1 from payments p where p.id = payment_id and (p.user_id = auth.uid() or has_role(p.organization_id,'{owner,admin}'))));
create policy own on access_credentials for select using (user_id = auth.uid());
create policy own on checkins for select using (user_id = auth.uid() or is_trainer_of(user_id) or has_role((select organization_id from gym_locations g where g.id=location_id),'{owner,admin,reception}',location_id));
create policy staff_read on access_events for select using (has_role((select organization_id from gym_locations g where g.id=location_id),'{owner,admin,reception}',location_id));
create policy own on bookings for select using (user_id = auth.uid() or exists(select 1 from class_schedules cs join gym_locations g on g.id=cs.location_id where cs.id=schedule_id and has_role(g.organization_id,'{owner,admin,reception,trainer}',g.id)));
create policy staff_update on bookings for update using (exists(select 1 from class_schedules cs join gym_locations g on g.id=cs.location_id where cs.id=schedule_id and has_role(g.organization_id,'{owner,admin,reception,trainer}',g.id)));
create policy own on waiting_lists for select using (user_id = auth.uid());
create policy own on workout_plans for select using (member_id = auth.uid() or is_trainer_of(member_id));
create policy trainer_write on workout_plans for all using (is_trainer_of(member_id)) with check (is_trainer_of(member_id));
create policy own on workout_sessions for select using (exists(select 1 from workout_plans p where p.id=plan_id and (p.member_id=auth.uid() or is_trainer_of(p.member_id))));
create policy own on workout_logs for select using (member_id = auth.uid() or is_trainer_of(member_id));
create policy own_insert on workout_logs for insert with check (member_id = auth.uid());
create policy own on trainer_assignments for select using (member_id = auth.uid() or exists(select 1 from trainers t join staff_members s on s.id=t.staff_id where t.id=trainer_id and s.user_id=auth.uid()));
create policy own on notifications for select using (user_id = auth.uid());
create policy own_update on notifications for update using (user_id = auth.uid());
create policy own on achievements for select using (user_id = auth.uid());
create policy own on wearable_connections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy part on conversations for select using (member_id = auth.uid() or (channel='trainer' and is_trainer_of(member_id)) or has_role(organization_id,'{owner,admin,reception}'));
create policy own_create on conversations for insert with check (member_id = auth.uid());
create policy part on messages for select using (exists(select 1 from conversations c where c.id=conversation_id));
create policy part_insert on messages for insert with check (sender_id = auth.uid() and exists(select 1 from conversations c where c.id=conversation_id));
-- webhook_events: sin políticas => solo service_role

grant execute on function public.book_class(uuid), public.cancel_booking(uuid) to authenticated;
revoke all on public.hourly_traffic from anon;
grant select on public.hourly_traffic to authenticated;
