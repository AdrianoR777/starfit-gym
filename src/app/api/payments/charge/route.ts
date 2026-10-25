import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({ membershipId: z.string().uuid(), culqiToken: z.string().min(5), email: z.string().email() });

// Cobro con Culqi: el monto SIEMPRE se calcula en servidor desde el plan; nunca se confía en el cliente.
export async function POST(req: Request) {
  const secret = process.env.CULQI_SECRET_KEY;
  const admin = supabaseAdmin();
  if (!secret || !admin) return NextResponse.json({ error: "payments_pending_integration" }, { status: 503 });
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { data: m } = await admin.from("memberships")
    .select("id, user_id, organization_id, status, membership_plans(price_cents, enrollment_fee_cents, name)")
    .eq("id", body.data.membershipId).single();
  const plan = m?.membership_plans as unknown as { price_cents: number; enrollment_fee_cents: number; name: string } | undefined;
  if (!m || m.user_id !== user.id || m.status !== "pending_payment" || !plan) return NextResponse.json({ error: "invalid_membership" }, { status: 400 });
  const amount = plan.price_cents + plan.enrollment_fee_cents;
  if (amount <= 0) return NextResponse.json({ error: "price_not_configured" }, { status: 400 });

  const idem = randomUUID();
  const { data: pay, error } = await admin.from("payments").insert({
    organization_id: m.organization_id, user_id: user.id, membership_id: m.id, amount_cents: amount, provider: "culqi", idempotency_key: idem,
  }).select("id").single();
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const r = await fetch("https://api.culqi.com/v2/charges", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", "Idempotency-Key": idem },
    body: JSON.stringify({ amount, currency_code: "PEN", email: body.data.email, source_id: body.data.culqiToken, description: plan.name.slice(0, 80), metadata: { payment_id: pay.id } }),
  });
  const charge = await r.json();
  const paid = r.ok && charge?.outcome?.type === "venta_exitosa";
  await admin.from("payments").update({
    provider_ref: charge?.id ?? null, status: paid ? "paid" : "failed", paid_at: paid ? new Date().toISOString() : null, raw_event: charge,
  }).eq("id", pay.id);
  if (paid) {
    await admin.rpc("activate_membership", { p_payment: pay.id });
    await admin.from("audit_logs").insert({ organization_id: m.organization_id, actor_id: user.id, action: "payment.paid", entity: "payments", entity_id: pay.id });
  }
  return NextResponse.json({ ok: paid, message: paid ? "Pago confirmado" : charge?.user_message ?? "Pago rechazado" }, { status: paid ? 200 : 402 });
}
