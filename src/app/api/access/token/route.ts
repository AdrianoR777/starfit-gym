import { NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { issueToken, QR_TTL_SECONDS } from "@/lib/qr";

export async function POST() {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) return NextResponse.json({ error: "qr_not_configured" }, { status: 503 });
  const { sb, user } = await currentUser();
  if (!sb || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: cred } = await sb.from("access_credentials").select("public_code, revoked").eq("user_id", user.id).maybeSingle();
  if (!cred || cred.revoked) return NextResponse.json({ error: "no_credential" }, { status: 403 });
  return NextResponse.json({ token: issueToken(cred.public_code, secret), ttl: QR_TTL_SECONDS }, { headers: { "Cache-Control": "no-store" } });
}
