"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { currentUser, supabaseAdmin } from "./supabase/server";
import { sedes } from "./config";
import type { FormState } from "./actions";

const err = (m: string) => m.match(/[a-z_]+$/)?.[0] ?? "error";
const queueMsg: Record<string, string> = { queue_disabled: "Esta máquina no usa turnos.", equipment_unavailable: "La máquina no está disponible.", membership_required: "Necesitas una membresía activa.", already_in_queue: "Ya tienes un turno activo (solo uno a la vez)." };

export async function joinQueue(_: FormState, fd: FormData): Promise<FormState> {
  const { sb } = await currentUser(); if (!sb) return { error: "No configurado" };
  const { data, error } = await sb.rpc("queue_join", { p_equipment: String(fd.get("id")) });
  if (error) return { error: queueMsg[err(error.message)] ?? "No se pudo tomar el turno" };
  await sb.rpc("queue_advance", { p_equipment: String(fd.get("id")) });
  revalidatePath("/portal/maquinas");
  return { ok: `Turno registrado. Posición ${data}.` };
}
export async function queueAction(fd: FormData) {
  const { sb } = await currentUser(); if (!sb) return;
  const id = String(fd.get("entry"));
  if (fd.get("op") === "confirm") await sb.rpc("queue_confirm", { p_entry: id }); else await sb.rpc("queue_leave", { p_entry: id });
  revalidatePath("/portal/maquinas");
}

const Ticket = z.object({ equipment: z.string().uuid(), description: z.string().trim().min(5, "Describe la falla (mín. 5 caracteres)").max(1000) });
export async function reportFailure(_: FormState, fd: FormData): Promise<FormState> {
  const p = Ticket.safeParse(Object.fromEntries(fd)); if (!p.success) return { error: p.error.issues[0].message };
  const { sb, user } = await currentUser(); if (!sb || !user) return { error: "Inicia sesión para reportar" };
  const { error } = await sb.from("maintenance_tickets").insert({ equipment_id: p.data.equipment, description: p.data.description, reported_by: user.id });
  return error ? { error: "No se pudo registrar el reporte" } : { ok: "Reporte enviado. El personal lo revisará." };
}

export async function setEquipmentStatus(fd: FormData) {
  const { sb } = await currentUser(); if (!sb) return;
  await sb.rpc("set_equipment_status", { p_equipment: String(fd.get("id")), p_status: String(fd.get("status")), p_note: String(fd.get("note") ?? "") || null });
  revalidatePath("/admin/equipos"); revalidatePath("/portal/maquinas");
}
export async function updateTicket(fd: FormData) {
  const { sb } = await currentUser(); if (!sb) return;
  const status = String(fd.get("status"));
  await sb.from("maintenance_tickets").update({ status, assigned_to: String(fd.get("assigned_to") ?? "") || null, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/equipos");
}

export async function closeStaleCheckins(): Promise<void> {
  const { sb, user } = await currentUser(); const admin = supabaseAdmin(); if (!sb || !user || !admin) return;
  const { data: staff } = await sb.from("staff_members").select("organization_id").eq("user_id", user.id).in("role", ["owner", "admin", "reception"]).limit(1);
  if (!staff?.length) return;
  const { data } = await admin.rpc("close_stale_checkins");
  await admin.from("audit_logs").insert({ organization_id: staff[0].organization_id, actor_id: user.id, action: "checkins.auto_close", meta: { closed: data } });
  revalidatePath("/recepcion");
}

// Contacto: inserción con service role, honeypot y límite de 3 mensajes por hora por IP
const Contact = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80), contact: z.string().trim().min(5, "Escribe un celular o correo").max(120),
  topic: z.enum(["membresia", "clases", "entrenador", "instalaciones", "otro"]), sede: z.string().optional(),
  message: z.string().trim().min(5, "Escribe tu mensaje").max(2000), consent: z.literal("on", { message: "Debes aceptar la política de privacidad" }),
});
export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: "Mensaje enviado." }; // honeypot
  const p = Contact.safeParse(Object.fromEntries(fd)); if (!p.success) return { error: p.error.issues[0].message };
  const admin = supabaseAdmin();
  if (!admin) return { error: `El formulario aún no está conectado. Escríbenos por WhatsApp: ${sedes.map((s) => `${s.name} ${s.phone}`).join(" · ")}` };
  const h = await headers();
  const ip_hash = createHash("sha256").update((h.get("x-forwarded-for") ?? "").split(",")[0] + (process.env.QR_SIGNING_SECRET ?? "")).digest("hex").slice(0, 32);
  const { count } = await admin.from("support_requests").select("*", { count: "exact", head: true }).eq("ip_hash", ip_hash).gte("created_at", new Date(Date.now() - 3600e3).toISOString());
  if ((count ?? 0) >= 3) return { error: "Has enviado varios mensajes seguidos. Intenta en una hora o escríbenos por WhatsApp." };
  const { data: org } = await admin.from("organizations").select("id").limit(1).single();
  const { user } = await currentUser();
  const { error } = await admin.from("support_requests").insert({ organization_id: org?.id, name: p.data.name, contact: p.data.contact, topic: p.data.topic, message: p.data.message, consent_at: new Date().toISOString(), ip_hash, user_id: user?.id ?? null });
  return error ? { error: "No se pudo enviar. Intenta de nuevo." } : { ok: "Mensaje recibido. Te responderemos pronto." };
}
