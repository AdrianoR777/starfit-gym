import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

// Webhook Culqi (conciliación). Autenticación por secreto compartido configurado en el panel de Culqi
// + re-verificación del cargo consultando la API de Culqi (no se confía en el cuerpo recibido).
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  const secret = process.env.CULQI_SECRET_KEY, hook = process.env.CULQI_WEBHOOK_SECRET;
  if (!admin || !secret || !hook) return NextResponse.json({ error: "pending_integration" }, { status: 503 });
  const given = Buffer.from(new URL(req.url).searchParams.get("k") ?? "");
  const exp = Buffer.from(hook);
  if (given.length !== exp.length || !timingSafeEqual(given, exp)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const evt = await req.json().catch(() => null);
  const eventId = evt?.id, chargeId = (typeof evt?.data === "string" ? JSON.parse(evt.data) : evt?.data)?.id;
  if (!eventId || !chargeId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // idempotencia
  const { error: dup } = await admin.from("webhook_events").insert({ provider: "culqi", event_id: eventId });
  if (dup) return NextResponse.json({ ok: true, duplicate: true });

  const r = await fetch(`https://api.culqi.com/v2/charges/${encodeURIComponent(chargeId)}`, { headers: { Authorization: `Bearer ${secret}` } });
  if (!r.ok) return NextResponse.json({ error: "verify_failed" }, { status: 502 });
  const charge = await r.json();
  const { data: pay } = await admin.from("payments").select("id, status, amount_cents").eq("provider", "culqi").eq("provider_ref", chargeId).maybeSingle();
  if (!pay) return NextResponse.json({ ok: true, unmatched: true });
  if (charge.amount !== pay.amount_cents) return NextResponse.json({ error: "amount_mismatch" }, { status: 409 });
  if (charge?.outcome?.type === "venta_exitosa" && pay.status !== "paid") {
    await admin.from("payments").update({ status: "paid", paid_at: new Date().toISOString(), raw_event: charge }).eq("id", pay.id);
    await admin.rpc("activate_membership", { p_payment: pay.id });
  }
  return NextResponse.json({ ok: true });
}
