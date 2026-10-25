import { redirect } from "next/navigation";
import { currentUser, staffRoles } from "./supabase/server";
import { Pending } from "@/components/ui";

export async function requireUser() {
  const { sb, user } = await currentUser();
  if (!sb) return { sb: null, user: null } as const;
  if (!user) redirect("/login");
  return { sb, user } as const;
}
export async function requireStaff(roles: string[]) {
  const r = await requireUser();
  if (!r.sb) return { ...r, staff: [] };
  const staff = (await staffRoles(r.user.id)).filter((s) => roles.includes(s.role));
  if (!staff.length) redirect("/portal");
  // MFA obligatorio para personal: exige nivel aal2
  const { data } = await r.sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (process.env.REQUIRE_STAFF_MFA !== "false" && data?.currentLevel !== "aal2") redirect("/portal/perfil?mfa=required");
  return { ...r, staff };
}
export const NotConfigured = () => Pending({ what: "Esta sección no está disponible en este momento. Intenta más tarde o escríbenos por WhatsApp." });
