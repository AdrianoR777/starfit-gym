-- Fase 1/3/7 complementos: CMS de marca, panel de entrenador, autoservicio de membresía, preferencias de notificación.

-- ===== CMS: contenido y marca editables sin código =====
create table if not exists site_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  gym_name text not null default 'Mi gimnasio' check (length(gym_name) between 2 and 60),
  tagline text check (length(tagline) <= 160),
  hero_title text check (length(hero_title) <= 80),
  hero_accent text check (length(hero_accent) <= 80),
  hero_subtitle text check (length(hero_subtitle) <= 240),
  hero_video_path text,
  logo_path text,
  color_accent text not null default '#C9FF43' check (color_accent ~ '^#[0-9A-Fa-f]{6}$'),
  color_ink text not null default '#080A0A' check (color_ink ~ '^#[0-9A-Fa-f]{6}$'),
  hours_text text check (length(hours_text) <= 120),
  instagram_url text, tiktok_url text, facebook_url text, signup_url text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
create policy pub_read on site_settings for select using (true);
create policy owner_write on site_settings for all using (has_role(organization_id, '{owner,admin}')) with check (has_role(organization_id, '{owner,admin}'));

-- ===== Autoservicio de membresía =====
alter table membership_plans add column if not exists max_pause_days int not null default 0 check (max_pause_days between 0 and 180);
alter table membership_plans add column if not exists cancel_policy text not null default 'Puedes cancelar en cualquier momento desde tu portal. No hay reembolso del periodo en curso salvo disposición legal.';
alter table memberships add column if not exists paused_from date;
alter table memberships add column if not exists paused_until date;
alter table memberships add column if not exists pause_days_used int not null default 0;
alter table memberships add column if not exists cancelled_at timestamptz;

-- Pausa: extiende la vigencia por los días congelados, dentro del máximo del plan
create or replace function public.pause_membership(p_membership uuid, p_days int)
returns date language plpgsql security definer set search_path = public as $$
declare m memberships; pl membership_plans; today date := (now() at time zone 'America/Lima')::date;
begin
  select * into m from memberships where id = p_membership and user_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if m.status <> 'active' then raise exception 'not_active'; end if;
  select * into pl from membership_plans where id = m.plan_id;
  if p_days < 1 or m.pause_days_used + p_days > pl.max_pause_days then raise exception 'pause_limit'; end if;
  update memberships set status = 'suspended', paused_from = today, paused_until = today + p_days,
    ends_on = case when ends_on is null then null else ends_on + p_days end, pause_days_used = pause_days_used + p_days
  where id = m.id;
  insert into membership_changes(membership_id, from_status, to_status, reason, changed_by) values (m.id, 'active', 'suspended', 'pause:' || p_days || 'd', auth.uid());
  return today + p_days;
end $$;

-- Reanudar antes de tiempo (devuelve los días no usados)
create or replace function public.resume_membership(p_membership uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m memberships; today date := (now() at time zone 'America/Lima')::date; unused int;
begin
  select * into m from memberships where id = p_membership and (user_id = auth.uid() or has_role(organization_id, '{owner,admin,reception}')) for update;
  if not found or m.status <> 'suspended' then raise exception 'not_paused'; end if;
  unused := greatest(0, m.paused_until - today);
  update memberships set status = 'active', ends_on = case when ends_on is null then null else ends_on - unused end,
    pause_days_used = pause_days_used - unused, paused_from = null, paused_until = null where id = m.id;
  insert into membership_changes(membership_id, from_status, to_status, reason, changed_by) values (m.id, 'suspended', 'active', 'resume', auth.uid());
end $$;

-- Cancelación simple (sin obstáculos): desactiva renovación y marca cancelada al fin del periodo
create or replace function public.cancel_membership(p_membership uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m memberships;
begin
  select * into m from memberships where id = p_membership and user_id = auth.uid() for update;
  if not found or m.status not in ('active','suspended','pending_payment') then raise exception 'not_cancellable'; end if;
  update memberships set auto_renew_authorized = false, cancelled_at = now(),
    status = case when m.status = 'pending_payment' then 'cancelled' else m.status end where id = m.id;
  insert into membership_changes(membership_id, from_status, to_status, reason, changed_by) values (m.id, m.status, case when m.status = 'pending_payment' then 'cancelled'::membership_status else m.status end, 'cancel_requested', auth.uid());
end $$;
grant execute on function public.pause_membership(uuid, int), public.resume_membership(uuid), public.cancel_membership(uuid) to authenticated;

-- Tarea diaria: reactivar pausas vencidas y expirar membresías vencidas o canceladas
create or replace function public.membership_daily_maintenance()
returns int language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'America/Lima')::date; n int;
begin
  update memberships set status = 'active', paused_from = null, paused_until = null where status = 'suspended' and paused_until <= today;
  update memberships set status = case when cancelled_at is not null then 'cancelled'::membership_status else 'expired'::membership_status end
    where status = 'active' and ends_on < today;
  get diagnostics n = row_count;
  insert into notifications(user_id, kind, title, dedupe_key)
    select user_id, 'membership_expiring', 'Tu membresía vence el ' || to_char(ends_on, 'DD/MM'), 'exp7:' || id
    from memberships where status = 'active' and cancelled_at is null and ends_on = today + 7
    on conflict do nothing;
  return n;
end $$;
revoke execute on function public.membership_daily_maintenance() from public, anon, authenticated;

-- ===== Preferencias de notificación =====
create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bookings boolean not null default true, payments boolean not null default true, memberships boolean not null default true,
  schedule_changes boolean not null default true, queue boolean not null default true, announcements boolean not null default true,
  maintenance boolean not null default false,
  channel_email boolean not null default true, channel_whatsapp boolean not null default false, channel_push boolean not null default false,
  max_per_day int not null default 5 check (max_per_day between 1 and 20),
  updated_at timestamptz not null default now()
);
alter table notification_preferences enable row level security;
create policy own on notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== Panel del entrenador =====
-- El entrenador ve solo a sus socios asignados (perfiles y registros ya protegidos con is_trainer_of)
create or replace function public.my_trainer_id() returns uuid language sql stable security definer set search_path = public as $$
  select t.id from trainers t join staff_members s on s.id = t.staff_id where s.user_id = auth.uid() and s.is_active limit 1;
$$;
grant execute on function public.my_trainer_id() to authenticated;
alter table workout_plans add column if not exists status text not null default 'approved' check (status in ('draft','proposed','approved','rejected'));
alter table workout_plans add column if not exists source text not null default 'trainer' check (source in ('trainer','ai'));
alter table workout_plans add column if not exists reviewed_at timestamptz;
alter table workout_plans add column if not exists updated_at timestamptz not null default now();
create table if not exists workout_plan_revisions (
  id bigserial primary key, plan_id uuid not null references workout_plans(id) on delete cascade,
  items jsonb not null, changed_by uuid references auth.users(id), note text, created_at timestamptz not null default now()
);
alter table workout_plan_revisions enable row level security;
create policy trainer_or_owner on workout_plan_revisions for select using (exists (select 1 from workout_plans p where p.id = plan_id and (p.member_id = auth.uid() or is_trainer_of(p.member_id))));
-- historial automático de cambios en planes
create or replace function public.log_plan_revision() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.items is distinct from old.items or new.status is distinct from old.status then
    insert into workout_plan_revisions(plan_id, items, changed_by, note) values (new.id, new.items, auth.uid(), new.status);
  end if;
  return null;
end $$;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists workout_plans_revision on workout_plans;
create trigger workout_plans_revision after insert or update on workout_plans for each row execute function public.log_plan_revision();
drop trigger if exists workout_plans_touch on workout_plans;
create trigger workout_plans_touch before update on workout_plans for each row execute function public.touch_updated_at();
-- el socio solo ve planes aprobados
drop policy if exists own on workout_plans;
create policy own on workout_plans for select using ((member_id = auth.uid() and status = 'approved') or is_trainer_of(member_id));
