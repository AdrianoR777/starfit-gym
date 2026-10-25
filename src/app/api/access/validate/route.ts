import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/qr";

const Body = z.object({ token: z.string().min(10).max(500), locationId: z.string().uuid(), direction: z.enum(["in", "out"]).default("in") });

// Validación en servidor: solo personal de recepción/admin de la sede (o lector autorizado con sesión de staff).
export async function POST(req: Request) {
  const secret = process.env.QR_SIGNING_SECRET;
  const admin = supabaseAdmin();
  if (!secret || !admin) return NextResponse.json({ granted: false, reason: "not_configured" }, { status: 503 });
  const { sb, user } = await currentUser();
  if (!sb || !user) return NextResponse.json({ granted: false, reason: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ granted: false, reason: "bad_request" }, { status: 400 });
  const { token, locationId, direction } = parsed.data;

  const { data: loc } = await admin.from("gym_locations").select("organization_id").eq("id", locationId).single();
  const { data: isStaff } = await sb.rpc("has_role", { org: loc?.organization_id, roles: ["owner", "admin", "reception"], loc: locationId });
  if (!isStaff) return NextResponse.json({ granted: false, reason: "forbidden" }, { status: 403 });

  const log = (granted: boolean, reason: string, credential_id?: string, nonce?: string) =>
    admin.from("access_events").insert({ credential_id, location_id: locationId, nonce, direction, granted, reason, validated_by: user.id });

  const v = verifyToken(token, secret);
  if (!v.ok) { await log(false, v.reason); return NextResponse.json({ granted: false, reason: v.reason }); }

  const { data: cred } = await admin.from("access_credentials").select("id, user_id, revoked").eq("public_code", v.code).single();
  if (!cred || cred.revoked) { await log(false, "revoked"); return NextResponse.json({ granted: false, reason: "revoked" }); }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const { data: ms } = await admin.from("memberships").select("id, ends_on, location_id")
    .eq("user_id", cred.user_id).eq("status", "active").or(`ends_on.is.null,ends_on.gte.${today}`)
    .or(`location_id.is.null,location_id.eq.${locationId}`).limit(1);
  if (!ms?.length) { await log(false, "no_active_membership", cred.id, v.nonce); return NextResponse.json({ granted: false, reason: "no_active_membership" }); }

  // nonce único => un QR no puede usarse dos veces
  const { error } = await log(true, "ok", cred.id, v.nonce);
  if (error) return NextResponse.json({ granted: false, reason: "replayed" });

  if (direction === "in") await admin.from("checkins").insert({ user_id: cred.user_id, location_id: locationId });
  else await admin.from("checkins").update({ checked_out_at: new Date().toISOString() })
    .eq("user_id", cred.user_id).eq("location_id", locationId).is("checked_out_at", null);

  const { data: prof } = await admin.from("profiles").select("full_name").eq("id", cred.user_id).single();
  return NextResponse.json({ granted: true, name: prof?.full_name ?? "Miembro", endsOn: ms[0].ends_on });
}
