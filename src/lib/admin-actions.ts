"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser, staffRoles, supabaseAdmin } from "./supabase/server";
import type { FormState } from "./actions";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido (usa #RRGGBB)");
const url = z.string().trim().url("URL inválida").or(z.literal(""));
const Site = z.object({
  gym_name: z.string().trim().min(2).max(60), tagline: z.string().trim().max(160), hero_title: z.string().trim().max(80), hero_accent: z.string().trim().max(80),
  hero_subtitle: z.string().trim().max(240), hours_text: z.string().trim().max(120), color_accent: hex, color_ink: hex,
  instagram_url: url, tiktok_url: url, facebook_url: url, signup_url: url,
});
const ALLOWED = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "video/mp4": "mp4" } as const;

async function requireOwner() {
  const { sb, user } = await currentUser(); if (!sb || !user) return null;
  const r = (await staffRoles(user.id)).find((x) => x.role === "owner" || x.role === "admin");
  return r ? { sb, user, org: r.organization_id as string } : null;
}

// Sube un archivo al bucket público "branding" (validando tipo y tamaño en servidor)
async function upload(org: string, file: File | null, name: string, maxMB: number) {
  if (!file || file.size === 0) return undefined;
  const ext = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!ext) throw new Error("Formato no permitido (PNG, JPG, WEBP, SVG o MP4)");
  if (file.size > maxMB * 1024 * 1024) throw new Error(`El archivo supera ${maxMB} MB`);
  const admin = supabaseAdmin(); if (!admin) throw new Error("Storage no configurado");
  const path = `${org}/${name}-${Date.now()}.${ext}`;
  const { error } = await admin.storage.from("branding").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("No se pudo subir el archivo");
  return admin.storage.from("branding").getPublicUrl(path).data.publicUrl;
}

export async function saveSite(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireOwner(); if (!ctx) return { error: "Solo propietarios o administradores" };
  const p = Site.safeParse(Object.fromEntries(fd)); if (!p.success) return { error: p.error.issues[0].message };
  try {
    const logo_path = await upload(ctx.org, fd.get("logo") as File | null, "logo", 2);
    const hero_video_path = await upload(ctx.org, fd.get("hero_video") as File | null, "hero", 25);
    const row = { organization_id: ctx.org, ...p.data, updated_by: ctx.user.id, updated_at: new Date().toISOString(), ...(logo_path && { logo_path }), ...(hero_video_path && { hero_video_path }) };
    const { error } = await ctx.sb.from("site_settings").upsert(row);
    if (error) return { error: "No se pudo guardar" };
    await ctx.sb.from("audit_logs").insert({ organization_id: ctx.org, actor_id: ctx.user.id, action: "site.update", entity: "site_settings" });
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/", "layout");
  return { ok: "Cambios publicados." };
}
