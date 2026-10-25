-- Datos REALES de STARFIT GYM (fuente: Instagram oficial @sstarfitgym, oct-2026).
-- Completa los marcados con TODO antes de ejecutar. Se puede ejecutar varias veces sin duplicar.
insert into organizations(id, name, slug) values ('00000000-0000-0000-0000-000000000001', 'STARFIT GYM', 'starfit') on conflict (id) do nothing;

insert into gym_locations(id, organization_id, name, address, district, city, phone, capacity) values
 ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Sede Pardo',   'Cruce de Ppao',                       'Nuevo Chimbote', 'Chimbote', '993538789', 80),  -- TODO: capacidad real
 ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Sede Agraria', 'Av. Naciones Unidas con Av. Agraria', 'Nuevo Chimbote', 'Chimbote', '920373854', 80)   -- TODO: capacidad real
on conflict (id) do update set name = excluded.name, address = excluded.address, phone = excluded.phone;

insert into site_settings(organization_id, gym_name, tagline, hours_text, instagram_url, tiktok_url, facebook_url, signup_url) values
 ('00000000-0000-0000-0000-000000000001', 'STARFIT GYM', 'Porque estar fit no es solo verse bien, sino sentirse bien',
  'Lunes a sábado · 6:00 a. m. – 10:30 p. m.', 'https://www.instagram.com/sstarfitgym/', 'https://www.tiktok.com/@sstarfitgym', 'https://www.facebook.com/sstarfit/', 'https://bit.ly/inscripstarfit')
on conflict (organization_id) do nothing;

insert into classes(organization_id, name, kind) select '00000000-0000-0000-0000-000000000001', n, k
from (values ('Baile','baile'),('Funcional','funcional'),('Xbox','xbox'),('Zumba','zumba'),('Step','step'),('Functional Kids','kids')) v(n,k)
where not exists (select 1 from classes c where c.name = v.n);

-- TODO: planes y precios reales. Ejemplo (descomenta y ajusta; precios en céntimos: S/ 80.00 = 8000):
-- insert into membership_plans(organization_id, name, period, duration_days, price_cents, max_pause_days, terms) values
--  ('00000000-0000-0000-0000-000000000001', 'Mensual', 'monthly', 30, 8000, 7, 'Acceso a sala y clases grupales. Sin renovación automática.'),
--  ('00000000-0000-0000-0000-000000000001', 'Trimestral', 'quarterly', 90, 21000, 15, 'Acceso a sala y clases grupales. Sin renovación automática.');

-- TODO: horario de clases (repite por cada clase y fecha; hora de Lima):
-- insert into class_schedules(class_id, location_id, starts_at, ends_at, capacity)
-- select id, '00000000-0000-0000-0000-0000000000a1', '2026-11-03 19:00-05', '2026-11-03 20:00-05', 25 from classes where name = 'Zumba';

-- TODO: máquinas con turnos (opcional):
-- insert into equipment(location_id, code, name, category, queue_enabled) values
--  ('00000000-0000-0000-0000-0000000000a1', 'PR-01', 'Prensa de piernas', 'fuerza', true);
