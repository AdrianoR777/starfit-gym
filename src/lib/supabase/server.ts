import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { integrations } from "../config";

export async function supabaseServer() {
  if (!integrations.supabase) return null;
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}

// Solo servidor: omite RLS. Usar exclusivamente en webhooks y validaciones verificadas.
export function supabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !integrations.supabase) return null;
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export async function currentUser() {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, user: null };
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
}

export async function staffRoles(userId: string) {
  const sb = await supabaseServer();
  const { data } = await sb!.from("staff_members").select("role, location_id, organization_id").eq("user_id", userId).eq("is_active", true);
  return data ?? [];
}
