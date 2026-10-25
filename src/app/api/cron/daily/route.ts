import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

// Tareas diarias (Vercel Cron): vencimientos de membresía, pausas, entradas sin salida y turnos colgados.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET, got = Buffer.from((req.headers.get("authorization") ?? "").replace("Bearer ", ""));
  if (!secret || got.length !== Buffer.byteLength(secret) || !timingSafeEqual(got, Buffer.from(secret))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin(); if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const [m, c] = await Promise.all([admin.rpc("membership_daily_maintenance"), admin.rpc("close_stale_checkins")]);
  const { data: eq } = await admin.from("equipment").select("id").eq("queue_enabled", true);
  for (const e of eq ?? []) await admin.rpc("queue_advance", { p_equipment: e.id });
  return NextResponse.json({ memberships: m.data ?? m.error?.message, checkins_closed: c.data ?? c.error?.message, queues: eq?.length ?? 0 });
}
