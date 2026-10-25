import { NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const { sb, user } = await currentUser();
  if (!sb || !user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const id = String((await req.formData()).get("id") ?? "");
  const { data, error } = await sb.rpc("book_class", { p_schedule: id });
  const r = error ? (error.message.match(/[a-z_]+$/)?.[0] ?? "error") : String(data);
  return NextResponse.redirect(new URL(`/portal/reservas?r=${r}`, req.url), 303);
}
