#!/usr/bin/env bash
# 3 sesiones simultáneas intentan reservar una clase con 1 cupo: debe quedar 1 confirmada y 2 en espera
set -euo pipefail
T="psql ${PGURL/\/postgres\?/\/gymtest?} -qtA -v ON_ERROR_STOP=1"
$T -c "insert into class_schedules(id, class_id, location_id, starts_at, ends_at, capacity) values ('5c000000-0000-0000-0000-000000000099','c0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1', now()+interval '2 days', now()+interval '2 days 1 hour', 1) on conflict do nothing"
for u in 11111111-1111-1111-1111-111111111111 22222222-2222-2222-2222-222222222222 33333333-3333-3333-3333-333333333333; do
  $T -c "set role authenticated; select set_config('request.jwt.claim.sub','$u',false); select pg_sleep(0.2); select book_class('5c000000-0000-0000-0000-000000000099');" | tail -1 &
done; wait
R=$($T -c "select booked || '/' || (select count(*) from bookings where schedule_id='5c000000-0000-0000-0000-000000000099' and status='confirmed') || '/' || (select count(*) from waiting_lists where schedule_id='5c000000-0000-0000-0000-000000000099') from class_schedules where id='5c000000-0000-0000-0000-000000000099'")
echo "cupos ocupados/confirmadas/espera = $R"; [ "$R" = "1/1/2" ] && echo "OK: sin sobreventa bajo concurrencia"
