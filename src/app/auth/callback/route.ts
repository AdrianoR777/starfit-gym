import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Confirmación de correo y enlaces de recuperación: intercambia el código por una sesión
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/portal";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  if (code) {
    const sb = await supabaseServer();
    const { error } = (await sb?.auth.exchangeCodeForSession(code)) ?? { error: true };
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=enlace", url.origin));
}
