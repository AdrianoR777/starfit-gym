"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser, supabaseServer } from "./supabase/server";

export type FormState = { error?: string; ok?: string } | undefined;

const Signup = z.object({
  full_name: z.string().trim().min(3).max(80), email: z.string().email(), phone: z.string().trim().regex(/^\+?\d{9,12}$/, "Teléfono inválido"),
  password: z.string().min(10, "Mínimo 10 caracteres"), terms: z.literal("on", { message: "Debes aceptar términos y privacidad" }),
});
export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const p = Signup.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await supabaseServer();
  if (!sb) return { error: "Autenticación pendiente de configurar (Supabase)." };
  const { error } = await sb.auth.signUp({ email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.full_name, phone: p.data.phone }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/portal` } });
  if (error) return { error: error.message };
  return { ok: "Revisa tu correo para confirmar la cuenta." };
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ email: z.string().email(), password: z.string().min(1), next: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Datos inválidos" };
  const sb = await supabaseServer();
  if (!sb) return { error: "Autenticación pendiente de configurar (Supabase)." };
  const { error } = await sb.auth.signInWithPassword(p.data);
  if (error) return { error: "Correo o contraseña incorrectos" };
  const next = p.data.next?.startsWith("/") && !p.data.next.startsWith("//") ? p.data.next : "/portal";
  redirect(next);
}

export async function chooseMembership(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ plan: z.string().uuid(), accept: z.literal("on", { message: "Debes aceptar las condiciones del plan" }), renew: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { sb, user } = await currentUser();
  if (!sb || !user) redirect("/login");
  const { data: plan } = await sb.from("membership_plans").select("id, organization_id, location_id").eq("id", p.data.plan).single();
  if (!plan) return { error: "Plan no disponible" };
  const { error } = await sb.from("memberships").insert({ user_id: user.id, plan_id: plan.id, organization_id: plan.organization_id, location_id: plan.location_id,
    terms_accepted_at: new Date().toISOString(), auto_renew_authorized: p.data.renew === "on" });
  if (error) return { error: "No se pudo registrar la solicitud" };
  revalidatePath("/portal/membresia");
  return { ok: "Solicitud registrada. Completa el pago para activarla." };
}

export async function cancelBooking(fd: FormData) {
  const { sb } = await currentUser();
  await sb?.rpc("cancel_booking", { p_schedule: String(fd.get("id")) });
  revalidatePath("/portal/reservas");
}

export async function logWorkout(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ plan: z.string().uuid(), effort: z.coerce.number().int().min(1).max(10), notes: z.string().max(1000).optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Datos inválidos" };
  const { sb, user } = await currentUser();
  if (!sb || !user) redirect("/login");
  const done = fd.getAll("done").map(String);
  const { error } = await sb.from("workout_logs").insert({ member_id: user.id, plan_id: p.data.plan, perceived_effort: p.data.effort, notes: p.data.notes, completed_items: done });
  if (error) return { error: "No se pudo guardar" };
  revalidatePath("/portal");
  return { ok: "Sesión registrada. ¡Buen trabajo! Recuerda descansar." };
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ full_name: z.string().trim().min(3).max(80), phone: z.string().trim().max(15) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Datos inválidos" };
  const { sb, user } = await currentUser();
  if (!sb || !user) redirect("/login");
  await sb.from("profiles").update({ ...p.data, stats_hidden: fd.get("stats_hidden") === "on", notify_email: fd.get("notify_email") === "on", notify_whatsapp: fd.get("notify_whatsapp") === "on" }).eq("id", user.id);
  revalidatePath("/portal/perfil");
  return { ok: "Perfil actualizado" };
}

// ===== Autoservicio de membresía =====
const membershipErr: Record<string, string> = { pause_limit: "Superas los días de pausa que permite tu plan.", not_active: "Solo puedes pausar una membresía activa.", not_paused: "La membresía no está pausada.", not_cancellable: "Esta membresía ya no se puede cancelar." };
export async function membershipAction(_: FormState, fd: FormData): Promise<FormState> {
  const { sb } = await currentUser(); if (!sb) return { error: "No configurado" };
  const id = String(fd.get("id")), op = String(fd.get("op"));
  if (op === "cancel" && fd.get("confirm") !== "on") return { error: "Marca la casilla para confirmar la cancelación." };
  const days = Number(fd.get("days"));
  const { data, error } = op === "pause" ? await sb.rpc("pause_membership", { p_membership: id, p_days: days })
    : op === "resume" ? await sb.rpc("resume_membership", { p_membership: id }) : await sb.rpc("cancel_membership", { p_membership: id });
  if (error) return { error: membershipErr[error.message.match(/[a-z_]+$/)?.[0] ?? ""] ?? "No se pudo completar la operación" };
  revalidatePath("/portal/membresia");
  return { ok: op === "pause" ? `Membresía pausada hasta el ${data}. Tu fecha de vencimiento se extendió.` : op === "resume" ? "Membresía reactivada." : "Cancelación registrada. Mantienes el acceso hasta el fin del periodo pagado y no habrá renovaciones." };
}

// ===== Notificaciones =====
export async function markAllRead() {
  const { sb, user } = await currentUser(); if (!sb || !user) return;
  await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/portal/notificaciones");
}
const prefKeys = ["bookings", "payments", "memberships", "schedule_changes", "queue", "announcements", "maintenance", "channel_email", "channel_whatsapp", "channel_push"] as const;
export async function savePrefs(_: FormState, fd: FormData): Promise<FormState> {
  const { sb, user } = await currentUser(); if (!sb || !user) return { error: "Inicia sesión" };
  const max = z.coerce.number().int().min(1).max(20).safeParse(fd.get("max_per_day"));
  if (!max.success) return { error: "Máximo diario entre 1 y 20" };
  const row = Object.fromEntries(prefKeys.map((k) => [k, fd.get(k) === "on"]));
  const { error } = await sb.from("notification_preferences").upsert({ user_id: user.id, ...row, max_per_day: max.data, updated_at: new Date().toISOString() });
  if (!error && row.channel_whatsapp) await sb.from("user_consents").upsert({ user_id: user.id, purpose: "whatsapp", granted: true, updated_at: new Date().toISOString() });
  return error ? { error: "No se pudo guardar" } : { ok: "Preferencias guardadas." };
}

// ===== Recuperación de acceso =====
export async function requestReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = z.string().email().safeParse(fd.get("email"));
  if (!email.success) return { error: "Correo inválido" };
  const sb = await supabaseServer(); if (!sb) return { error: "Autenticación pendiente de configurar." };
  await sb.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/restablecer` });
  // misma respuesta exista o no la cuenta (no revela qué correos están registrados)
  return { ok: "Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña." };
}
export async function setNewPassword(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ password: z.string().min(10, "Mínimo 10 caracteres"), confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden" }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { sb, user } = await currentUser(); if (!sb || !user) return { error: "El enlace expiró. Solicita uno nuevo." };
  const { error } = await sb.auth.updateUser({ password: p.data.password });
  if (error) return { error: "No se pudo actualizar la contraseña." };
  redirect("/portal");
}
