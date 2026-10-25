"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "./supabase/server";
import type { FormState } from "./actions";

const Item = z.object({ name: z.string().trim().min(2).max(80), sets: z.coerce.number().int().min(1).max(10), reps: z.string().trim().min(1).max(20), rest_s: z.coerce.number().int().min(0).max(600), notes: z.string().trim().max(200).optional() });

// Lee filas del editor: name[], sets[], reps[], rest_s[], notes[]
function parseItems(fd: FormData) {
  const names = fd.getAll("name").map(String);
  return names.map((name, i) => ({ name, sets: fd.getAll("sets")[i], reps: fd.getAll("reps")[i], rest_s: fd.getAll("rest_s")[i], notes: fd.getAll("notes")[i] || undefined }))
    .filter((r) => r.name.trim()).map((r) => Item.parse(r));
}

export async function savePlan(_: FormState, fd: FormData): Promise<FormState> {
  const { sb } = await currentUser(); if (!sb) return { error: "No configurado" };
  let items; try { items = parseItems(fd); } catch { return { error: "Revisa los ejercicios: nombre, series (1–10), repeticiones y descanso (0–600 s)." }; }
  if (!items.length) return { error: "Agrega al menos un ejercicio" };
  const member = String(fd.get("member")), planId = String(fd.get("plan") || ""), name = String(fd.get("plan_name") || "Plan").slice(0, 80);
  const status = fd.get("approve") === "on" ? "approved" : "draft";
  const { data: trainer } = await sb.rpc("my_trainer_id");
  const row = { name, items, status, reviewed_by_professional: status === "approved", reviewed_at: status === "approved" ? new Date().toISOString() : null };
  const { error } = planId
    ? await sb.from("workout_plans").update(row).eq("id", planId)
    : await sb.from("workout_plans").insert({ ...row, member_id: member, trainer_id: trainer });
  if (error) return { error: "No se pudo guardar (¿el socio está asignado a ti?)" };
  revalidatePath(`/entrenador/socio/${member}`);
  return { ok: status === "approved" ? "Plan aprobado y visible para el socio." : "Borrador guardado (el socio aún no lo ve)." };
}

export async function reviewPlan(fd: FormData) {
  const { sb } = await currentUser(); if (!sb) return;
  const approve = fd.get("decision") === "approve";
  await sb.from("workout_plans").update({ status: approve ? "approved" : "rejected", reviewed_by_professional: approve, reviewed_at: new Date().toISOString(), active: approve }).eq("id", String(fd.get("plan")));
  revalidatePath(`/entrenador/socio/${fd.get("member")}`);
}
