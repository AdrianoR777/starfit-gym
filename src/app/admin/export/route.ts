import { NextResponse } from "next/server";
import { currentUser, staffRoles } from "@/lib/supabase/server";

// Exportación CSV (solo owner/admin). Datos según RLS del usuario.
const sources = {
  pagos: { table: "payments", cols: "created_at,amount_cents,currency,provider,status,paid_at" },
  membresias: { table: "memberships", cols: "created_at,status,starts_on,ends_on,location_id" },
  asistencias: { table: "checkins", cols: "checked_in_at,checked_out_at,location_id,source" },
  reservas: { table: "bookings", cols: "created_at,status,schedule_id" },
  incidencias: { table: "maintenance_tickets", cols: "created_at,priority,status,assigned_to,cost_cents" },
} as const;
const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function GET(req: Request) {
  const { sb, user } = await currentUser();
  if (!sb || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await staffRoles(user.id)).some((r) => r.role === "owner" || r.role === "admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const u = new URL(req.url); const key = u.searchParams.get("tipo") as keyof typeof sources;
  const src = sources[key]; if (!src) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  const from = u.searchParams.get("desde"), to = u.searchParams.get("hasta");
  const dateCol = src.cols.split(",")[0];
  let q = sb.from(src.table).select(src.cols).order(dateCol, { ascending: false }).limit(10000);
  if (from) q = q.gte(dateCol, `${from}T00:00:00-05:00`); if (to) q = q.lte(dateCol, `${to}T23:59:59-05:00`);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  const cols = src.cols.split(",");
  const csv = [cols.join(","), ...(data as unknown as Record<string, unknown>[]).map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="starfit-${key}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
