-- Pruebas de base de datos: reservas, cupos, aislamiento RLS, turnos, ocupación
\set ON_ERROR_STOP 1
insert into auth.users(id, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','{"full_name":"Socio Demo A"}'),
 ('22222222-2222-2222-2222-222222222222','{"full_name":"Socio Demo B"}'),
 ('33333333-3333-3333-3333-333333333333','{"full_name":"Socio Demo C"}'),
 ('44444444-4444-4444-4444-444444444444','{"full_name":"Recepción Demo"}');
insert into staff_members(user_id, organization_id, location_id, role) values ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','reception');
insert into memberships(user_id, plan_id, organization_id, status, starts_on, ends_on, terms_accepted_at)
 select u, (select id from membership_plans limit 1), '00000000-0000-0000-0000-000000000001', 'active', current_date, current_date + 30, now()
 from unnest(array['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333']::uuid[]) u;
insert into classes(id, organization_id, name, kind) values ('c0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Funcional [DEMO]','funcional');
insert into class_schedules(id, class_id, location_id, starts_at, ends_at, capacity) values ('5c000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1', now() + interval '1 day', now() + interval '1 day 1 hour', 2);
insert into equipment(id, location_id, code, name, queue_enabled) values ('e0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','PR-01','Prensa [DEMO]', true);

create or replace function as_user(u uuid) returns void language sql as $$ select set_config('request.jwt.claim.sub', u::text, false) $$;
create or replace function t_ok(cond boolean, msg text) returns void language plpgsql as $$ begin if not cond then raise exception 'FALLÓ: %', msg; end if; raise notice 'OK: %', msg; end $$;

set role authenticated;
-- Reservas: cupo 2, tercer socio va a lista de espera, sin duplicados
select as_user('11111111-1111-1111-1111-111111111111'); select t_ok(book_class('5c000000-0000-0000-0000-000000000001') = 'confirmed', 'A reserva');
select t_ok(book_class('5c000000-0000-0000-0000-000000000001') = 'already_booked', 'A no duplica');
select as_user('22222222-2222-2222-2222-222222222222'); select t_ok(book_class('5c000000-0000-0000-0000-000000000001') = 'confirmed', 'B reserva último cupo');
select as_user('33333333-3333-3333-3333-333333333333'); select t_ok(book_class('5c000000-0000-0000-0000-000000000001') = 'waitlisted', 'C a lista de espera');
-- RLS: C no ve reservas ajenas
select t_ok((select count(*) from bookings) = 0, 'C no ve reservas de otros');
-- Cancelación promueve lista de espera y no altera cupos
select as_user('11111111-1111-1111-1111-111111111111'); select t_ok(cancel_booking('5c000000-0000-0000-0000-000000000001') = 'cancelled', 'A cancela');
reset role;
select t_ok((select booked from class_schedules where id = '5c000000-0000-0000-0000-000000000001') = 2, 'cupo sigue en 2 tras promoción');
select t_ok(exists(select 1 from bookings where user_id = '33333333-3333-3333-3333-333333333333' and status = 'confirmed'), 'C promovido');
select t_ok((select count(*) from notifications where kind = 'waitlist_promoted') = 1, 'C notificado');

-- Turnos de máquina: un turno por socio, llamada, confirmación
set role authenticated;
select as_user('11111111-1111-1111-1111-111111111111'); select t_ok(queue_join('e0000000-0000-0000-0000-000000000001') = 1, 'A turno 1'); select queue_advance('e0000000-0000-0000-0000-000000000001');
select as_user('22222222-2222-2222-2222-222222222222'); select t_ok(queue_join('e0000000-0000-0000-0000-000000000001') = 2, 'B turno 2');
do $$ begin perform queue_join('e0000000-0000-0000-0000-000000000001'); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%already_in_queue%' then raise; end if; raise notice 'OK: B no duplica turno'; end $$;
select as_user('11111111-1111-1111-1111-111111111111');
select t_ok(queue_confirm((select id from equipment_queue where user_id = auth.uid())) = 'confirmed', 'A confirma');
select queue_leave((select id from equipment_queue where user_id = auth.uid() and status = 'confirmed'));
reset role;
select t_ok((select status from equipment_queue where user_id = '22222222-2222-2222-2222-222222222222') = 'called', 'B llamado al terminar A');

-- Estado de máquina: socio no puede cambiarlo; recepción sí y vacía la cola
set role authenticated; select as_user('11111111-1111-1111-1111-111111111111');
do $$ begin perform set_equipment_status('e0000000-0000-0000-0000-000000000001','out_of_service'); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%forbidden%' then raise; end if; raise notice 'OK: socio no cambia estado'; end $$;
select as_user('44444444-4444-4444-4444-444444444444'); select set_equipment_status('e0000000-0000-0000-0000-000000000001','out_of_service','Cable roto');
reset role;
select t_ok((select count(*) from equipment_queue where status in ('waiting','called')) = 0, 'cola vaciada al quedar fuera de servicio');
select t_ok((select count(*) from equipment_status_events) = 1, 'evento de estado auditado');

-- Ticket: socio reporta pero no puede fijar costo ni asignar
set role authenticated; select as_user('11111111-1111-1111-1111-111111111111');
insert into maintenance_tickets(equipment_id, reported_by, description) values ('e0000000-0000-0000-0000-000000000001', auth.uid(), 'Hace ruido extraño');
do $$ begin insert into maintenance_tickets(equipment_id, reported_by, description, cost_cents) values ('e0000000-0000-0000-0000-000000000001', auth.uid(), 'trampa', 100); raise exception 'debió fallar'; exception when insufficient_privilege or check_violation then raise notice 'OK: socio no fija costo'; when others then if sqlerrm like '%row-level security%' then raise notice 'OK: socio no fija costo'; else raise; end if; end $$;
reset role;

-- Ocupación: 2 dentro, 1 salió; entradas de ayer sin salida se corrigen
insert into checkins(user_id, location_id, checked_in_at) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1', now()),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000a1', now());
insert into checkins(user_id, location_id, checked_in_at, checked_out_at) values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000a1', now() - interval '30 min', now());
insert into checkins(user_id, location_id, checked_in_at) values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-0000000000a1', now() - interval '2 days');
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select t_ok((select inside from live_occupancy('00000000-0000-0000-0000-0000000000a1')) = 2, 'ocupación en vivo = 2 (anónimo, solo total)');
select t_ok((select count(*) from checkins) = 0, 'anónimo no ve registros individuales (RLS)');
reset role;
select t_ok(close_stale_checkins() = 1, 'corrige 1 registro sin salida');
select t_ok((select sum(visits) from occupancy_history('00000000-0000-0000-0000-0000000000a1')) = 4, 'historial agregado');


-- ===== 0003: autoservicio, CMS, entrenador =====
update membership_plans set max_pause_days = 15;
set role authenticated; select as_user('11111111-1111-1111-1111-111111111111');
do $$ declare m uuid := (select id from memberships where user_id = auth.uid()); e0 date := (select ends_on from memberships where id = m); begin
  perform pause_membership(m, 10);
  perform t_ok((select ends_on from memberships where id = m) = e0 + 10 and (select status from memberships where id = m) = 'suspended', 'pausa extiende vigencia 10 días');
  begin perform pause_membership(m, 10); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%not_active%' and sqlerrm not like '%pause_limit%' then raise; end if; end;
  perform resume_membership(m);
  perform t_ok((select ends_on from memberships where id = m) = e0 and (select pause_days_used from memberships where id = m) = 0, 'reanudar devuelve días no usados');
  begin perform pause_membership(m, 20); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%pause_limit%' then raise; end if; perform t_ok(true, 'no supera máximo de pausa del plan'); end;
  perform cancel_membership(m);
  perform t_ok((select cancelled_at is not null and status = 'active' from memberships where id = m), 'cancelación respeta periodo pagado');
end $$;
-- B no puede pausar membresía de A
select as_user('22222222-2222-2222-2222-222222222222');
do $$ begin perform pause_membership((select id from memberships where user_id = '11111111-1111-1111-1111-111111111111'), 1); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%not_found%' then raise; end if; perform t_ok(true, 'socio no pausa membresía ajena'); end $$;
-- CMS: socio no edita; lectura pública
do $$ begin insert into site_settings(organization_id, gym_name) values ('00000000-0000-0000-0000-000000000001','Hack'); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%row-level security%' then raise; end if; perform t_ok(true, 'socio no edita CMS'); end $$;
reset role;
-- Entrenador: solo ve a su socio asignado y planes propuestos no son visibles al socio
insert into auth.users(id) values ('55555555-5555-5555-5555-555555555555');
insert into staff_members(id, user_id, organization_id, role) values ('5f000000-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','00000000-0000-0000-0000-000000000001','trainer');
insert into trainers(id, staff_id) values ('7a000000-0000-0000-0000-000000000001','5f000000-0000-0000-0000-000000000001');
insert into trainer_assignments(trainer_id, member_id) values ('7a000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111');
set role authenticated; select as_user('55555555-5555-5555-5555-555555555555');
select t_ok((select count(*) from profiles where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222')) = 1, 'entrenador ve solo a su socio asignado');
insert into workout_plans(member_id, trainer_id, name, items, status) values ('11111111-1111-1111-1111-111111111111', my_trainer_id(), 'Plan [DEMO]', '[{"name":"Sentadilla","sets":3,"reps":"10"}]', 'proposed');
do $$ begin insert into workout_plans(member_id, name) values ('22222222-2222-2222-2222-222222222222', 'intruso'); raise exception 'debió fallar'; exception when others then if sqlerrm not like '%row-level security%' then raise; end if; perform t_ok(true, 'entrenador no crea planes para socios ajenos'); end $$;
select as_user('11111111-1111-1111-1111-111111111111');
select t_ok((select count(*) from workout_plans) = 0, 'socio no ve plan propuesto sin aprobar');
select as_user('55555555-5555-5555-5555-555555555555'); update workout_plans set status = 'approved', reviewed_at = now();
select as_user('11111111-1111-1111-1111-111111111111');
select t_ok((select count(*) from workout_plans) = 1, 'socio ve plan aprobado');
reset role;
select t_ok((select count(*) from workout_plan_revisions) = 2, 'historial de cambios del plan');
\echo 'PRUEBAS 0003 PASARON'
\echo 'TODAS LAS PRUEBAS DE BASE DE DATOS PASARON'
