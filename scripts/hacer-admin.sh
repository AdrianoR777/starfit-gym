#!/usr/bin/env bash
# Da rol de propietario (o el rol indicado) a una cuenta ya registrada.
# Uso: DATABASE_URL=... scripts/hacer-admin.sh correo@ejemplo.com [owner|admin|reception|trainer]
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL}"; EMAIL="${1:?Indica el correo}"; ROLE="${2:-owner}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v email="$EMAIL" -v role="$ROLE" <<'SQL'
insert into staff_members(user_id, organization_id, role)
select u.id, '00000000-0000-0000-0000-000000000001', :'role'::app_role from auth.users u where lower(u.email) = lower(:'email')
on conflict do nothing
returning 'Rol asignado a ' || :'email' as resultado;
insert into trainers(staff_id, is_public)
select s.id, false from staff_members s join auth.users u on u.id = s.user_id
where :'role' = 'trainer' and lower(u.email) = lower(:'email') on conflict do nothing;
SQL
