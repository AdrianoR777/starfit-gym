#!/usr/bin/env bash
# Uso: PGURL=postgres://postgres@/postgres?host=/tmp&port=5499 tests/db/run.sh
set -euo pipefail
P="psql ${PGURL} -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists gymtest" ; $P -c "create database gymtest"
T="psql ${PGURL/\/postgres\?/\/gymtest?} -v ON_ERROR_STOP=1 -q"
$T -f tests/db/supabase_stub.sql
for f in supabase/migrations/*.sql; do echo "→ $f"; $T -f "$f"; done
$T -c "grant usage on schema public to anon, authenticated; grant select, insert, update, delete on all tables in schema public to authenticated; grant select on all tables in schema public to anon; grant usage on all sequences in schema public to authenticated;"
$T -f supabase/seed.sql
$T -f tests/db/tests.sql
