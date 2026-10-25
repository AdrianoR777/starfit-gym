#!/usr/bin/env bash
# Aplica las migraciones pendientes (registra cuáles ya se aplicaron) y los datos de STARFIT. Se puede volver a ejecutar.
# Uso: DATABASE_URL="postgresql://postgres:[CLAVE]@db.[REF].supabase.co:5432/postgres" scripts/setup-db.sh
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL (Supabase → Project Settings → Database → Connection string → URI)}"
Q="psql $DATABASE_URL -v ON_ERROR_STOP=1 -q"
$Q -c "create table if not exists public._migrations (name text primary key, applied_at timestamptz default now()); alter table public._migrations enable row level security;"
for f in supabase/migrations/*.sql; do
  n=$(basename "$f")
  if [ "$($Q -tAc "select 1 from public._migrations where name = '$n'")" = "1" ]; then echo "✓ $n (ya aplicada)"; continue; fi
  echo "→ $n"; $Q -1 -f "$f" -c "insert into public._migrations(name) values ('$n')"
done
echo "→ datos-starfit.sql"; $Q -f supabase/datos-starfit.sql
echo "Listo. Crea tu cuenta en la web y luego ejecuta scripts/hacer-admin.sh con tu correo."
